
'use server';
/**
 * @fileOverview A Genkit flow for processing pasted student grades.
 *
 * - processPastedGrades - Parses pasted text of matriculas and grades, validates them,
 *                         and matches matriculas to existing students.
 * - ProcessGradesInput - The input type for the processPastedGrades function.
 * - ProcessGradesOutput - The return type for the processPastedGrades function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const GradesParserInputSchema = z.object({
  gradesPasted: z.string().describe("A string containing student matriculas and grades, typically one per line, e.g., 'matricula1: 9.5\\nmatricula2 8.0'. Separators can be colon, space, or tab. Grades should be numeric."),
});

const ParsedGradeEntrySchema = z.object({
  matricula: z.string().describe("The student's matricula (ID number) as extracted."),
  gradeRaw: z.string().describe("The raw grade string as extracted from the input."),
});

const GradesParserOutputSchema = z.object({
  parsedEntries: z.array(ParsedGradeEntrySchema).describe("An array of parsed matricula and raw grade strings."),
});

export const ProcessGradesInputSchema = z.object({
  turmaId: z.string().describe("The ID of the class/turma."),
  disciplinaId: z.string().describe("The ID of the subject/disciplina."),
  provaId: z.string().describe("The ID of the exam/prova."),
  gradesPasted: z.string().min(1, { message: "O texto das notas não pode estar vazio." }).describe("A string containing student matriculas and grades."),
});
export type ProcessGradesInput = z.infer<typeof ProcessGradesInputSchema>;

export const ProcessedGradeItemSchema = z.object({
  originalLine: z.string().optional().describe("The original line from the input text if available."),
  matricula: z.string().describe("The student's matricula (ID number)."),
  gradeRaw: z.string().describe("The raw grade string as parsed from the input."),
  gradeNumeric: z.number().optional().describe("The numeric value of the grade if successfully converted."),
  studentUid: z.string().optional().describe("The Firestore UID of the student, if matricula is found."),
  studentName: z.string().optional().describe("The full name of the student, if matricula is found."),
  status: z.enum(['parsed', 'valid', 'invalid_matricula', 'invalid_grade_format', 'invalid_grade_value', 'unknown_error']).describe("Status of processing for this entry."),
  message: z.string().optional().describe("Any relevant message, e.g., error details."),
});
export type ProcessedGradeItem = z.infer<typeof ProcessedGradeItemSchema>;

export const ProcessGradesOutputSchema = z.object({
  processedEntries: z.array(ProcessedGradeItemSchema).describe("An array of processed grade entries."),
  summary: z.object({
    totalLines: z.number(),
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
  input: { schema: GradesParserInputSchema },
  output: { schema: GradesParserOutputSchema },
  prompt: `Você é um assistente especializado em analisar texto bruto contendo uma lista de matrículas de alunos e suas respectivas notas.
Cada linha geralmente representa um aluno. A matrícula e a nota podem ser separadas por espaços, dois pontos (:) ou tabs.
Ignore linhas em branco ou linhas que não pareçam conter uma matrícula e uma nota.
Matrículas são tipicamente sequências de números ou alfanuméricas. Notas são tipicamente números, podendo ter casas decimais (usando ponto ou vírgula como separador decimal).

Entrada de Exemplo:
\`\`\`
12345: 9.5
67890 8,0
ABC01 7
44444 : 10.0
\`\`\`

Para a entrada acima, você deve extrair:
- Matrícula "12345", Nota Bruta "9.5"
- Matrícula "67890", Nota Bruta "8,0"
- Matrícula "ABC01", Nota Bruta "7"
- Matrícula "44444", Nota Bruta "10.0"

Seu objetivo é retornar uma lista de objetos, cada um contendo 'matricula' e 'gradeRaw' para cada entrada que você conseguir identificar.

Texto para processar:
{{{gradesPasted}}}
`,
});

const processGradesFlow = ai.defineFlow(
  {
    name: 'processGradesFlow',
    inputSchema: ProcessGradesInputSchema,
    outputSchema: ProcessGradesOutputSchema,
  },
  async (input) => {
    const { output: parserOutput } = await gradesParserPrompt({ gradesPasted: input.gradesPasted });

    const finalProcessedEntries: ProcessedGradeItem[] = [];
    let summary = {
      totalLines: input.gradesPasted.split('\n').filter(line => line.trim() !== '').length,
      successfullyParsed: 0,
      validEntries: 0,
      invalidMatricula: 0,
      invalidGradeFormat: 0,
      invalidGradeValue: 0,
    };

    if (!parserOutput?.parsedEntries) {
      // Handle case where LLM parsing fails or returns nothing
      // This might happen if the prompt output schema isn't perfectly matched by the LLM
      // or if the input text is completely unparseable.
      // We can try a simpler regex fallback or just mark all as failed.
      // For now, let's assume it provides some entries or is empty.
       const lines = input.gradesPasted.split('\n').filter(line => line.trim() !== '');
       lines.forEach(line => {
            const parts = line.trim().split(/[\s:]+/);
            if (parts.length >= 2) {
                 finalProcessedEntries.push({
                    originalLine: line,
                    matricula: parts[0],
                    gradeRaw: parts.slice(1).join(' '), // take the rest as gradeRaw
                    status: 'parsed', // will be further processed
                 });
                 summary.successfullyParsed++;
            } else {
                 finalProcessedEntries.push({
                    originalLine: line,
                    matricula: line, // Could not parse matricula
                    gradeRaw: "", // Could not parse grade
                    status: 'unknown_error',
                    message: 'Não foi possível extrair matrícula e nota da linha.',
                });
            }
       });
    } else {
        summary.successfullyParsed = parserOutput.parsedEntries.length;
        parserOutput.parsedEntries.forEach(entry => {
             finalProcessedEntries.push({
                matricula: entry.matricula,
                gradeRaw: entry.gradeRaw,
                status: 'parsed', // Initial status
            });
        });
    }


    for (let i = 0; i < finalProcessedEntries.length; i++) {
      const entry = finalProcessedEntries[i];
      if (entry.status !== 'parsed') continue; // Skip if already marked as error by fallback

      // 1. Validate and convert grade
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

      // 2. Validate matricula and fetch student info
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
          // Further check: ensure student belongs to input.turmaId if necessary
          // For now, just validating matricula existence
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
