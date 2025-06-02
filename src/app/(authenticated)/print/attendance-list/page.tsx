
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { StrawberryIcon } from '@/components/icons/StrawberryIcon';
import { generateAttendanceHtml, GenerateAttendanceHtmlOutput } from '@/ai/flows/generate-attendance-html-flow';

export default function AttendanceListPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const turmaId = searchParams.get('turmaId');

  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [aiGeneratedOutput, setAiGeneratedOutput] = useState<GenerateAttendanceHtmlOutput | null>(null);


  useEffect(() => {
    if (turmaId) {
      setIsLoading(true);
      generateAttendanceHtml({ turmaId })
        .then(output => {
          setAiGeneratedOutput(output);
          if (!output || !output.htmlContent.includes("<table")) {
            toast({ title: "Aviso", description: "Conteúdo da lista de chamada pode não ter sido gerado corretamente pela IA.", variant: "default" });
          }
        })
        .catch(error => {
          console.error('Error generating attendance HTML with AI:', error);
          toast({ title: "Erro ao Gerar Lista", description: "Não foi possível gerar o conteúdo da lista via IA.", variant: "destructive" });
          setAiGeneratedOutput({
            htmlContent: `<h2>Erro ao gerar lista de chamada</h2><p>Falha na comunicação com o serviço de IA.</p>`,
            turmaName: "Desconhecida",
            currentDate: new Date().toLocaleDateString('pt-BR')
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      toast({ title: "Erro de Navegação", description: "ID da turma não fornecido na URL.", variant: "destructive" });
      setIsLoading(false);
      router.replace('/management'); // Redirect if no turmaId
    }
  }, [turmaId, toast, router]);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
    }, 100); 
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      setIsPrinting(false);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Gerando lista de chamada com IA...</p>
      </div>
    );
  }

  if (!turmaId || !aiGeneratedOutput) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-center">
        <div>
            <p className="text-xl text-destructive mb-4">Não foi possível carregar os dados da turma ou gerar a lista.</p>
            <Button onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="print-container">
      <style jsx global>{`
        .print-only-logo-text-container {
          display: none; 
        }
        .ai-generated-table table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .ai-generated-table th, .ai-generated-table td {
          border: 1px solid #000;
          padding: 6px; 
          text-align: left;
          vertical-align: middle;
        }
        .ai-generated-table th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        .ai-generated-table td:nth-child(3), /* Presença */
        .ai-generated-table td:nth-child(4)  /* Assinatura */
        {
           height: 1cm; 
        }

        @media print {
          body > *:not(.print-container) {
            display: none !important;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #ffffff !important;
          }
          .printable-area, .printable-area * {
            visibility: visible;
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .printable-area {
            position: static; /* Reset position for print content flow */
            width: 100%;
            margin: 0;
            padding: 20mm 12mm; /* Adjust padding to simulate A4 margins if @page margin is not enough */
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          
          .ai-generated-table table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 9pt; 
          }
          .ai-generated-table th, .ai-generated-table td {
            border: 1px solid #000000 !important;
            padding: 4px !important; 
            text-align: left !important;
            vertical-align: middle; 
          }
          .ai-generated-table th {
            background-color: #f0f0f0 !important;
            font-weight: bold;
          }
          .ai-generated-table tr {
            page-break-inside: avoid; 
          }

          .print-logo-and-text-container {
             display: flex !important;
             align-items: center;
             margin-bottom: 10px; 
          }
          .print-only-logo {
            display: block !important; 
            width: 40px; 
            height: 40px;
            fill: #E30B5D; 
            margin-right: 8px;
          }
          .print-logo-text {
            display: inline !important;
            font-size: 14pt;
            font-weight: bold;
            color: #E30B5D !important; /* Primary theme color */
          }
          .print-header-text-container {
            text-align: center; 
            flex-grow: 1;
            margin-left: -48px; /* Adjust to center considering logo space */
          }
          .print-main-title {
             font-size: 16pt; font-weight: bold; margin-bottom: 5px;
          }
          .print-sub-title {
             font-size: 10pt;
          }
          
          @page {
            size: A4 portrait; 
            margin: 12mm; /* Standard A4 margins */
          }
        }
      `}</style>

    <div className="printable-area container mx-auto py-8 px-4 print:p-0"> {/* Removed print:p-0 to allow @page margins */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="print:p-0 print:mb-2">
          <div className="print-logo-and-text-container">
            <StrawberryIcon className="print-only-logo" data-ai-hint="strawberry logo" />
            <span className="print-logo-text">Moranguinho</span>
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2 no-print fixed top-4 right-4 z-50"> {/* Added fixed positioning and z-index for screen view */}
              <Button variant="outline" onClick={() => router.back()} disabled={isPrinting}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button onClick={handlePrint} disabled={isPrinting || !aiGeneratedOutput?.htmlContent.includes("<table")}>
                <Printer className="mr-2 h-4 w-4" /> {isPrinting ? 'Imprimindo...' : 'Imprimir Lista'}
              </Button>
          </div>
        </CardHeader>
        <CardContent className="print:p-0">
          {aiGeneratedOutput?.htmlContent ? (
            <div 
                className="ai-generated-table" 
                dangerouslySetInnerHTML={{ __html: `
                    <div class="print-header-text-container">
                        ${aiGeneratedOutput.turmaName || aiGeneratedOutput.currentDate ? `<h1 class="print-main-title">Lista de Chamada</h1>` : ''}
                        ${aiGeneratedOutput.turmaName ? `<h2 class="print-sub-title">Turma: ${aiGeneratedOutput.turmaName}</h2>` : ''}
                        ${aiGeneratedOutput.currentDate ? `<h2 class="print-sub-title">Data: ${aiGeneratedOutput.currentDate}</h2>` : ''}
                    </div>
                    ${aiGeneratedOutput.htmlContent}
                `}} 
            />
          ) : (
            <p className="text-center text-muted-foreground py-4 print:text-black">
              Conteúdo da lista de chamada não disponível.
            </p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

