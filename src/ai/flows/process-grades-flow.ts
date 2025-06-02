
'use server';
/**
 * @fileOverview A Genkit flow for processing pasted student grades or uploaded files (image/PDF).
 *
 * - processPastedGrades - Parses pasted text or files for matriculas and grades, validates them,
 *                         and matches matriculas to existing students.
 * - ProcessGradesInput - The input type for the processPastedGrades function.
 * - ProcessGradesOutput - The return type for the processPastedGrades function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Input for the LLM prompt
const GradesParserPromptInputSchema = z.union([
  z.object({
    inputType: z.literal('text'),
    textData: z.string().describe("Pasted text containing student matriculas and grades."),
  }),
  z.object({
    inputType: z.literal('file'),
    fileDataUri: z.string().describe("A file (image or PDF) as a data URI, containing grades."),
    fileMimeType: z.string().describe("The MIME type of the file.")
  })
]);

const ParsedGradeEntrySchema = z.object({
  matricula: z.string().describe("The student's matricula (ID number) as extracted."),
  gradeRaw: z.string().describe("The raw grade string as extracted from the input."),
});

const GradesParserOutputSchema = z.object({
  parsedEntries: z.array(ParsedGradeEntrySchema).describe("An array of parsed matricula and raw grade strings."),
});

// Input for the overall flow / exported function
const ProcessGradesInputSchema = z.object({
  turmaId: z.string().describe("The ID of the class/turma."),
  disciplinaId: z.string().describe("The ID of the subject/disciplina."),
  provaId: z.string().describe("The ID of the exam/prova."),
  source: z.union([
    z.object({
      type: z.literal("text"),
      content: z.string().min(1, { message: "O texto das notas não pode estar vazio." }),
    }),
    z.object({
      type: z.literal("file"),
      fileName: z.string(),
      mimeType: z.string(),
      dataUri: z.string().describe("File content as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
    }),
  ]).describe("The source of grades, either pasted text or an uploaded file."),
}).refine(data => (data.source.type === 'text' && data.source.content) || (data.source.type === 'file' && data.source.dataUri), {
  message: "Either pasted grades text or a grade file must be provided.",
});
export type ProcessGradesInput = z.infer<typeof ProcessGradesInputSchema>;


const ProcessedGradeItemSchema = z.object({
  originalLine: z.string().optional().describe("The original line from the input text if available (only for text source)."),
  matricula: z.string().describe("The student's matricula (ID number)."),
  gradeRaw: z.string().describe("The raw grade string as parsed from the input."),
  gradeNumeric: z.number().optional().describe("The numeric value of the grade if successfully converted."),
  studentUid: z.string().optional().describe("The Firestore UID of the student, if matricula is found."),
  studentName: z.string().optional().describe("The full name of the student, if matricula is found."),
  status: z.enum(['parsed', 'valid', 'invalid_matricula', 'invalid_grade_format', 'invalid_grade_value', 'unknown_error']).describe("Status of processing for this entry."),
  message: z.string().optional().describe("Any relevant message, e.g., error details."),
});
export type ProcessedGradeItem = z.infer<typeof ProcessedGradeItemSchema>;

const ProcessGradesOutputSchema = z.object({
  processedEntries: z.array(ProcessedGradeItemSchema).describe("An array of processed grade entries."),
  summary: z.object({
    totalSourceEntries: z.number().describe("Number of lines if text input, or number of successfully parsed entries if file input."),
    successfullyParsed: z.number(),
    validEntries: z.number(),
    invalidMatricula: z.number(),
    invalidGradeFormat: z.number(),
    invalidGradeValue: z.number(),
  }).describe("A summary of the processing results."),
});
export type ProcessGradesOutput = z.infer<typeof ProcessGradesOutputSchema>;


const gradesParserPrompt = ai.definePrompt({
  name: 'gradesParserPrompt',
  input: { schema: GradesParserPromptInputSchema },
  output: { schema: GradesParserOutputSchema },
  prompt: `Você é um assistente especializado em analisar dados de alunos para extrair matrículas e suas respectivas notas.
Os dados podem vir de texto colado ou de um arquivo (imagem ou PDF).

{{#if (eq inputType "file")}}
A entrada é um arquivo. Realize OCR se for uma imagem. Analise o conteúdo do arquivo para identificar pares de matrícula e nota.
Arquivo fornecido: {{media url=fileDataUri}} (Tipo: {{fileMimeType}})
{{else}}
A entrada é texto colado. Analise o texto para identificar pares de matrícula e nota.
Texto para processar:
{{{textData}}}
{{/if}}

Cada linha ou entrada detectada geralmente representa um aluno. A matrícula e a nota podem ser separadas por espaços, dois pontos (:) ou tabs.
Ignore linhas em branco ou linhas que não pareçam conter uma matrícula e uma nota.
Matrículas são tipicamente sequências de números ou alfanuméricas. Notas são tipicamente números, podendo ter casas decimais (usando ponto ou vírgula como separador decimal).

Exemplo de extração esperada (independente da fonte):
- Matrícula "12345", Nota Bruta "9.5"
- Matrícula "67890", Nota Bruta "8,0"
- Matrícula "ABC01", Nota Bruta "7"

Seu objetivo é retornar uma lista de objetos, cada um contendo 'matricula' e 'gradeRaw' para cada entrada que você conseguir identificar.
`,
});

const processGradesFlow = ai.defineFlow(
  {
    name: 'processGradesFlow',
    inputSchema: ProcessGradesInputSchema, // Input to the flow
    outputSchema: ProcessGradesOutputSchema,
  },
  async (input: ProcessGradesInput) => {
    let parserPromptInputValue: z.infer<typeof GradesParserPromptInputSchema>;
    let sourceDescriptionForSummary = "";

    if (input.source.type === 'file') {
      parserPromptInputValue = {
        inputType: 'file',
        fileDataUri: input.source.dataUri,
        fileMimeType: input.source.mimeType,
      };
      sourceDescriptionForSummary = `Arquivo: ${input.source.fileName}`;
    } else {
      parserPromptInputValue = {
        inputType: 'text',
        textData: input.source.content,
      };
      sourceDescriptionForSummary = `Texto Colado`;
    }

    const { output: parserOutput } = await gradesParserPrompt(parserPromptInputValue);

    const finalProcessedEntries: ProcessedGradeItem[] = [];
    let summary = {
      totalSourceEntries: 0, // Will be updated based on successful parsing or text lines
      successfullyParsed: 0,
      validEntries: 0,
      invalidMatricula: 0,
      invalidGradeFormat: 0,
      invalidGradeValue: 0,
    };

    if (!parserOutput?.parsedEntries || parserOutput.parsedEntries.length === 0) {
      if (input.source.type === 'text') {
        // Fallback for TEXT input if LLM fails or returns no entries
        const lines = input.source.content.split('\n').filter(line => line.trim() !== '');
        summary.totalSourceEntries = lines.length;
        lines.forEach(line => {
            const parts = line.trim().split(/[\s:]+/);
            if (parts.length >= 2) {
                 finalProcessedEntries.push({
                    originalLine: line,
                    matricula: parts[0],
                    gradeRaw: parts.slice(1).join(' '),
                    status: 'parsed',
                 });
                 summary.successfullyParsed++;
            } else {
                 finalProcessedEntries.push({
                    originalLine: line,
                    matricula: line,
                    gradeRaw: "",
                    status: 'unknown_error',
                    message: 'Não foi possível extrair matrícula e nota da linha (fallback).',
                });
            }
        });
      } else {
        // No reliable fallback for file if LLM parsing fails to produce entries
        summary.totalSourceEntries = 0; // Or perhaps 1 if we consider the file itself as one entry
      }
    } else {
        summary.successfullyParsed = parserOutput.parsedEntries.length;
        summary.totalSourceEntries = parserOutput.parsedEntries.length; // Number of items LLM identified
        parserOutput.parsedEntries.forEach(entry => {
             finalProcessedEntries.push({
                matricula: entry.matricula,
                gradeRaw: entry.gradeRaw,
                status: 'parsed',
                originalLine: input.source.type === 'text' ? input.source.content.split('\n').find(l => l.includes(entry.matricula) && l.includes(entry.gradeRaw)) : undefined, // Attempt to find original line for text
            });
        });
    }


    for (let i = 0; i < finalProcessedEntries.length; i++) {
      const entry = finalProcessedEntries[i];
      if (entry.status !== 'parsed') continue;

      const gradeStringNormalized = entry.gradeRaw.replace(',', '.');
      const gradeNumeric = parseFloat(gradeStringNormalized);

      if (isNaN(gradeNumeric)) {
        entry.status = 'invalid_grade_format';
        entry.message = `Formato de nota inválido: "${entry.gradeRaw}"`;
        summary.invalidGradeFormat++;
        continue;
      }

      if (gradeNumeric < 0 || gradeNumeric > 10) {
        entry.status = 'invalid_grade_value';
        entry.message = `Nota fora do intervalo (0-10): ${gradeNumeric}`;
        summary.invalidGradeValue++;
        continue;
      }
      entry.gradeNumeric = gradeNumeric;

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('matricula', '==', entry.matricula), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          entry.status = 'invalid_matricula';
          entry.message = `Matrícula "${entry.matricula}" não encontrada.`;
          summary.invalidMatricula++;
        } else {
          const studentDoc = querySnapshot.docs[0].data();
          entry.studentUid = querySnapshot.docs[0].id;
          entry.studentName = studentDoc.nomeCompleto || 'Nome não disponível';
          entry.status = 'valid';
          summary.validEntries++;
        }
      } catch (error) {
        console.error(`Error fetching student for matricula ${entry.matricula}:`, error);
        entry.status = 'unknown_error';
        entry.message = 'Erro ao verificar matrícula no banco de dados.';
      }
    }
    return { processedEntries: finalProcessedEntries, summary };
  }
);

export async function processPastedGrades(input: ProcessGradesInput): Promise<ProcessGradesOutput> {
  return processGradesFlow(input);
}
