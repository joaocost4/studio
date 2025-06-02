
'use server';
/**
 * @fileOverview A Genkit flow for generating HTML content for a student attendance list.
 *
 * - generateAttendanceHtml - Generates HTML for an attendance list for a given class, with optional additional attendees.
 * - GenerateAttendanceHtmlInput - Input type for the flow.
 * - GenerateAttendanceHtmlOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface StudentData {
  id: string;
  matricula: string;
  nomeCompleto: string;
}

interface TurmaData {
    id: string;
    nome: string;
}

const AdditionalAttendeeSchema = z.object({
  matricula: z.string().describe("The matricula or identifier for the additional attendee."),
  nomeCompleto: z.string().describe("The full name of the additional attendee."),
});

const GenerateAttendanceHtmlInputSchema = z.object({
  turmaId: z.string().describe("The ID of the class (turma) for which to generate the attendance list."),
  additionalAttendees: z.array(AdditionalAttendeeSchema).optional().describe("Optional list of attendees to add to the main student list."),
});
export type GenerateAttendanceHtmlInput = z.infer<typeof GenerateAttendanceHtmlInputSchema>;

const GenerateAttendanceHtmlOutputSchema = z.object({
  htmlContent: z.string().describe("The generated HTML string for the attendance list."),
  turmaName: z.string().describe("The name of the class."),
  currentDate: z.string().describe("The current date when the list was generated (dd/mm/yyyy)."),
});
export type GenerateAttendanceHtmlOutput = z.infer<typeof GenerateAttendanceHtmlOutputSchema>;

const attendanceHtmlPrompt = ai.definePrompt({
  name: 'attendanceHtmlPrompt',
  input: { schema: z.object({
    turmaName: z.string(),
    students: z.array(z.object({ matricula: z.string(), nomeCompleto: z.string() })),
    additionalAttendees: z.array(AdditionalAttendeeSchema).optional(),
    currentDate: z.string(),
  })},
  output: { schema: z.object({ htmlString: z.string() }) },
  prompt: `
    You are an HTML generation assistant. Your task is to create an HTML structure for a student attendance list.
    The list should be suitable for printing.

    Given the following data:
    - Turma Name: {{{turmaName}}}
    - Current Date: {{{currentDate}}}
    - Enrolled Students:
      {{#each students}}
      - Matricula: {{this.matricula}}, Name: {{this.nomeCompleto}}
      {{/each}}
    {{#if additionalAttendees.length}}
    - Additional Participants:
      {{#each additionalAttendees}}
      - Identifier: {{this.matricula}}, Name: {{this.nomeCompleto}}
      {{/each}}
    {{/if}}

    Generate an HTML string that includes:
    1.  A main title "Lista de Chamada".
    2.  Sub-headers for "Turma: {{{turmaName}}}" and "Data: {{{currentDate}}}".
    3.  A table with the following columns: "Matrícula", "Nome Completo", "Presença", "Assinatura".
        - "Presença" and "Assinatura" columns should be empty cells for manual filling.
        - Each student from the "Enrolled Students" list should be a row in this table.
        - Each participant from the "Additional Participants" list (if any) should also be a row in this table, following the enrolled students.
    
    The HTML should be simple, clean, and use standard table tags (<table>, <thead>, <tbody>, <tr>, <th>, <td>).
    Do not include <html>, <head>, or <body> tags. Only provide the content for the list itself (title, headers, table).
    Make sure the table headers are clear. The cells for "Presença" and "Assinatura" should be wide enough for handwriting.

    Example structure for a student row:
    <tr>
      <td>{{student.matricula}}</td>
      <td>{{student.nomeCompleto}}</td>
      <td></td> <!-- Empty for Presença -->
      <td></td> <!-- Empty for Assinatura -->
    </tr>
  `,
});

const generateAttendanceHtmlFlow = ai.defineFlow(
  {
    name: 'generateAttendanceHtmlFlow',
    inputSchema: GenerateAttendanceHtmlInputSchema,
    outputSchema: GenerateAttendanceHtmlOutputSchema,
  },
  async ({ turmaId, additionalAttendees }) => {
    let turmaName = "Desconhecida";
    try {
        const turmaDocRef = doc(db, "turmas", turmaId);
        const turmaDocSnap = await getDoc(turmaDocRef);
        if (turmaDocSnap.exists()) {
            turmaName = turmaDocSnap.data()?.nome || "Desconhecida";
        }
    } catch (e) {
        console.error("Error fetching turma name for HTML generation:", e);
    }

    let students: StudentData[] = [];
    try {
        const q = query(collection(db, 'users'), where('turmaId', '==', turmaId));
        const querySnapshot = await getDocs(q);
        students = querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                matricula: doc.data().matricula,
                nomeCompleto: doc.data().nomeCompleto,
            } as StudentData))
            .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto));
    } catch (e) {
        console.error("Error fetching students for HTML generation:", e);
    }

    const currentDate = new Date().toLocaleDateString('pt-BR', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    const { output } = await attendanceHtmlPrompt({
      turmaName,
      students,
      additionalAttendees: additionalAttendees || [],
      currentDate,
    });

    if (!output?.htmlString) {
      // Fallback HTML if AI fails to generate
      return {
        htmlContent: `<h2>Erro ao gerar lista de chamada para ${turmaName}</h2><p>Não foi possível gerar o conteúdo via IA.</p>`,
        turmaName,
        currentDate,
      };
    }
    
    return {
      htmlContent: output.htmlString,
      turmaName,
      currentDate
    };
  }
);

export async function generateAttendanceHtml(input: GenerateAttendanceHtmlInput): Promise<GenerateAttendanceHtmlOutput> {
  return generateAttendanceHtmlFlow(input);
}
