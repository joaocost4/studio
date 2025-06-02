
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Printer, ArrowLeft, UserPlus, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { StrawberryIcon } from '@/components/icons/StrawberryIcon';
import { generateAttendanceHtml, GenerateAttendanceHtmlOutput, GenerateAttendanceHtmlInput } from '@/ai/flows/generate-attendance-html-flow';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomAttendee {
  matricula: string;
  nomeCompleto: string;
}

export default function AttendanceListPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const turmaId = searchParams.get('turmaId');

  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [aiGeneratedOutput, setAiGeneratedOutput] = useState<GenerateAttendanceHtmlOutput | null>(null);
  
  const [customAttendees, setCustomAttendees] = useState<CustomAttendee[]>([]);
  const [isAddParticipantDialogOpen, setIsAddParticipantDialogOpen] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [newParticipantMatricula, setNewParticipantMatricula] = useState("");


  const fetchAndSetAttendanceHtml = useCallback(async (currentTurmaId: string, currentCustomAttendees: CustomAttendee[]) => {
    setIsLoading(true);
    try {
      const input: GenerateAttendanceHtmlInput = { 
        turmaId: currentTurmaId,
        additionalAttendees: currentCustomAttendees.length > 0 ? currentCustomAttendees : undefined,
      };
      const output = await generateAttendanceHtml(input);
      setAiGeneratedOutput(output);
      if (!output || !output.htmlContent.includes("<table")) {
        toast({ title: "Aviso", description: "Conteúdo da lista de chamada pode não ter sido gerado corretamente pela IA.", variant: "default" });
      }
    } catch (error) {
      console.error('Error generating attendance HTML with AI:', error);
      toast({ title: "Erro ao Gerar Lista", description: "Não foi possível gerar o conteúdo da lista via IA.", variant: "destructive" });
      setAiGeneratedOutput({
        htmlContent: `<h2>Erro ao gerar lista de chamada</h2><p>Falha na comunicação com o serviço de IA.</p>`,
        turmaName: "Desconhecida",
        currentDate: new Date().toLocaleDateString('pt-BR')
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (turmaId) {
      fetchAndSetAttendanceHtml(turmaId, customAttendees);
    } else {
      toast({ title: "Erro de Navegação", description: "ID da turma não fornecido na URL.", variant: "destructive" });
      setIsLoading(false);
      router.replace('/management'); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId, customAttendees, fetchAndSetAttendanceHtml]); // fetchAndSetAttendanceHtml is memoized, customAttendees change triggers re-fetch

  const handlePrint = () => {
    setIsPrinting(true);
    // Small delay to ensure any DOM updates are rendered before printing
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

  const handleAddParticipant = () => {
    if (!newParticipantName.trim() || !newParticipantMatricula.trim()) {
      toast({ title: "Campos Obrigatórios", description: "Nome e Matrícula/ID são necessários.", variant: "destructive" });
      return;
    }
    setCustomAttendees(prev => [...prev, { nomeCompleto: newParticipantName, matricula: newParticipantMatricula }]);
    toast({ title: "Participante Adicionado", description: `${newParticipantName} foi adicionado(a) à lista atual.`});
    setNewParticipantName("");
    setNewParticipantMatricula("");
    setIsAddParticipantDialogOpen(false);
  };

  if (!turmaId) { // Early return if turmaId is missing after initial check
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-center">
        <p className="text-xl text-destructive mb-4">ID da turma não fornecido.</p>
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
          font-size: 9pt; /* Default for screen, print style overrides */
        }
        .ai-generated-table th, .ai-generated-table td {
          border: 1px solid #ccc; /* Lighter border for screen */
          padding: 6px; 
          text-align: left;
          vertical-align: middle;
        }
        .ai-generated-table th {
          background-color: #f8f9fa; /* Light grey for screen headers */
          font-weight: bold;
        }
        .ai-generated-table td:nth-child(3), /* Presença */
        .ai-generated-table td:nth-child(4)  /* Assinatura */
        {
           height: 1cm; /* For screen, if desired */
        }

        @media print {
          body {
            -webkit-print-color-adjust: exact !important; /* Chrome, Safari */
            print-color-adjust: exact !important; /* Firefox, Edge */
          }
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
            display: block !important; /* Ensure it's block for printing */
            position: static; 
            width: 100%;
            margin: 0;
            padding: 0; /* Margins handled by @page */
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          
          .ai-generated-table table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 9pt !important; 
          }
          .ai-generated-table th, .ai-generated-table td {
            border: 1px solid #000000 !important;
            padding: 4px !important; 
            text-align: left !important;
            vertical-align: middle !important; 
          }
          .ai-generated-table th {
            background-color: #e0e0e0 !important; /* Light gray for print headers */
            font-weight: bold !important;
          }
           .ai-generated-table td:nth-child(3), 
           .ai-generated-table td:nth-child(4) {
             height: 1cm !important; 
           }
          .ai-generated-table tr {
            page-break-inside: avoid !important; 
          }

          .print-logo-and-text-container {
             display: flex !important;
             align-items: center;
             margin-bottom: 10px; 
          }
          .print-only-logo {
            display: block !important; 
            width: 35px; 
            height: 35px;
            fill: #E30B5D; /* Primary theme color */
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
            margin-left: -43px; /* Adjust to center (logo width + margin-right) */
          }
          .print-main-title {
             font-size: 16pt; font-weight: bold; margin-bottom: 5px;
          }
          .print-sub-title {
             font-size: 10pt;
          }
          
          @page {
            size: A4 portrait; 
            margin: 12mm; 
          }
        }
      `}</style>

    <div className="printable-area">
      <Card className="print:shadow-none print:border-none print:bg-transparent">
        <CardHeader className="print:p-0 print:mb-2">
          {/* This div is only for print layout */}
          <div className="print-logo-and-text-container">
            <StrawberryIcon className="print-only-logo" data-ai-hint="strawberry logo" />
            <span className="print-logo-text">Moranguinho</span>
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2 no-print fixed top-4 right-4 z-50">
              <Button variant="outline" onClick={() => router.back()} disabled={isPrinting || isLoading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>

              <Dialog open={isAddParticipantDialogOpen} onOpenChange={setIsAddParticipantDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={isPrinting || isLoading}>
                    <UserPlus className="mr-2 h-4 w-4" /> Adicionar Participante
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Participante à Lista Atual</DialogTitle>
                    <DialogDescription>
                      Preencha os dados do participante a ser adicionado temporariamente a esta lista.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="participant-name" className="text-right">Nome</Label>
                      <Input id="participant-name" value={newParticipantName} onChange={(e) => setNewParticipantName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="participant-matricula" className="text-right">Matrícula/ID</Label>
                      <Input id="participant-matricula" value={newParticipantMatricula} onChange={(e) => setNewParticipantMatricula(e.target.value)} className="col-span-3" />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleAddParticipant}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar à Lista
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button 
                onClick={handlePrint} 
                disabled={isPrinting || isLoading || !aiGeneratedOutput?.htmlContent.includes("<table")}
                className="bg-primary hover:bg-primary/90"
              >
                <Printer className="mr-2 h-4 w-4" /> 
                {isLoading ? 'Carregando...' : (isPrinting ? 'Preparando...' : 'Gerar PDF / Imprimir')}
              </Button>
          </div>
        </CardHeader>
        <CardContent className="print:p-0">
          {isLoading && !aiGeneratedOutput && (
             <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-lg text-foreground mt-4">Gerando lista de chamada com IA...</p>
            </div>
          )}
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
            !isLoading && <p className="text-center text-muted-foreground py-4 print:text-black">
              Conteúdo da lista de chamada não disponível ou erro na geração.
            </p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
