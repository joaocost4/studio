
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, ListChecks, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HowAiWorksPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="text-center mb-10">
        <Lightbulb className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold font-headline text-primary">Como a Inteligência Artificial Funciona no Projeto</h1>
        <p className="text-muted-foreground text-lg">
          Entenda como a IA (através do Genkit) nos ajuda a automatizar e facilitar algumas tarefas.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center mb-2">
            <FileText className="h-8 w-8 text-accent mr-3" />
            <CardTitle className="text-2xl font-headline text-primary/90">1. Processamento e Extração de Notas</CardTitle>
          </div>
          <CardDescription>Fluxo responsável: <code>src/ai/flows/process-grades-flow.ts</code></CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-foreground/80">
          <p>
            Quando você utiliza a funcionalidade de "Lançar Notas da Turma" (em{" "}
            <Button variant="link" asChild className="p-0 h-auto"><Link href="/management/grades">/management/grades</Link></Button>),
            seja colando um texto com matrículas e notas ou enviando um arquivo (imagem ou PDF), esta IA entra em ação.
          </p>
          <div>
            <h3 className="font-semibold text-primary/85 mb-1">Como a IA ajuda?</h3>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>
                <strong>Leitura Inteligente:</strong> A IA é capaz de "ler" o texto que você colou ou o conteúdo visual de um arquivo de imagem/PDF.
              </li>
              <li>
                <strong>Extração de Dados:</strong> Mesmo que as matrículas e notas não estejam perfeitamente formatadas ou alinhadas (com espaços, tabulações, dois-pontos, ou em diferentes colunas/linhas em um arquivo), a IA tenta identificar a matrícula de cada aluno e a respectiva nota associada a ela.
              </li>
              <li>
                <strong>OCR (Reconhecimento Óptico de Caracteres):</strong> Se você enviar uma imagem ou PDF, a IA primeiro tenta converter a imagem do texto em texto editável para depois realizar a extração.
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-primary/85 mb-1">O que mais o sistema faz (além da IA)?</h3>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>
                <strong>Validação de Matrículas:</strong> Após a IA extrair os pares de matrícula e nota, o sistema verifica no banco de dados (Firestore) se cada matrícula encontrada corresponde a um aluno existente.
              </li>
              <li>
                <strong>Validação de Notas:</strong> As notas extraídas são convertidas para um formato numérico e o sistema verifica se estão dentro de um intervalo válido (geralmente 0 a 10).
              </li>
            </ul>
          </div>
          <p>
            <strong>Objetivo:</strong> Facilitar o lançamento de múltiplas notas de uma vez, reduzindo o trabalho manual de digitação e o risco de erros, mesmo com dados de entrada variados.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center mb-2">
            <ListChecks className="h-8 w-8 text-accent mr-3" />
            <CardTitle className="text-2xl font-headline text-primary/90">2. Geração da Lista de Chamada (HTML)</CardTitle>
          </div>
          <CardDescription>Fluxo responsável: <code>src/ai/flows/generate-attendance-html-flow.ts</code></CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-foreground/80">
          <p>
            Quando você acessa a funcionalidade de imprimir uma lista de chamada (em{" "}
            <Button variant="link" asChild className="p-0 h-auto"><Link href="/management">/management</Link></Button>{" "}
            e depois na opção de impressão), esta IA é utilizada.
          </p>
          <div>
            <h3 className="font-semibold text-primary/85 mb-1">Como a IA ajuda?</h3>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>
                <strong>Criação de Conteúdo HTML:</strong> A IA recebe informações como o nome da turma, a data atual, a lista de alunos matriculados e quaisquer participantes adicionais que você tenha inserido manualmente.
              </li>
              <li>
                <strong>Formatação da Tabela:</strong> Com base nessas informações, a IA gera o código HTML para uma lista de presença. Essa lista inclui um título, os dados da turma e uma tabela com colunas para "Matrícula", "Nome Completo", "Presença" e "Assinatura". As colunas de "Presença" e "Assinatura" são deixadas em branco para preenchimento manual.
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-primary/85 mb-1">O que mais o sistema faz (além da IA)?</h3>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>
                <strong>Busca de Dados:</strong> Antes de solicitar a geração do HTML para a IA, o sistema busca no banco de dados (Firestore) o nome da turma e a lista completa de alunos matriculados nela.
              </li>
            </ul>
          </div>
          <p>
            <strong>Objetivo:</strong> Gerar rapidamente uma lista de chamada formatada e pronta para ser impressa (ou salva como PDF pelo navegador), incluindo tanto alunos regulares quanto participantes ocasionais.
          </p>
        </CardContent>
      </Card>

       <div className="text-center mt-12">
            <Button asChild>
                <Link href="/dashboard">
                    <Lightbulb className="mr-2 h-5 w-5" /> Voltar ao Dashboard
                </Link>
            </Button>
        </div>
    </div>
  );
}
