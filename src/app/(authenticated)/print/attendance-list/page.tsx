
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { StrawberryIcon } from '@/components/icons/StrawberryIcon'; // Importar o logo

interface StudentData {
  id: string;
  matricula: string;
  nomeCompleto: string;
}

interface TurmaData {
    id: string;
    nome: string;
}

export default function AttendanceListPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const turmaId = searchParams.get('turmaId');

  const [students, setStudents] = useState<StudentData[]>([]);
  const [turmaInfo, setTurmaInfo] = useState<TurmaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  const fetchTurmaInfo = useCallback(async (id: string) => {
    try {
        const turmaDocRef = doc(db, "turmas", id);
        const turmaDocSnap = await getDoc(turmaDocRef);
        if (turmaDocSnap.exists()) {
            setTurmaInfo({ id: turmaDocSnap.id, ...turmaDocSnap.data() } as TurmaData);
        } else {
            toast({ title: "Erro", description: "Turma não encontrada.", variant: "destructive" });
            setTurmaInfo(null);
        }
    } catch (error) {
        console.error("Error fetching turma info:", error);
        toast({ title: "Erro ao buscar dados da turma", description: "Não foi possível carregar informações da turma.", variant: "destructive" });
        setTurmaInfo(null);
    }
  }, [toast]);

  const fetchStudents = useCallback(async (id: string) => {
    try {
      const q = query(collection(db, 'users'), where('turmaId', '==', id));
      const querySnapshot = await getDocs(q);
      const studentList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        matricula: doc.data().matricula,
        nomeCompleto: doc.data().nomeCompleto,
      } as StudentData)).sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto));
      setStudents(studentList);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({ title: "Erro ao buscar alunos", description: "Não foi possível carregar a lista de alunos.", variant: "destructive" });
      setStudents([]);
    }
  }, [toast]);

  useEffect(() => {
    if (turmaId) {
      setIsLoading(true);
      Promise.all([fetchTurmaInfo(turmaId), fetchStudents(turmaId)]).finally(() => {
        setIsLoading(false);
      });
    } else {
      toast({ title: "Erro de Navegação", description: "ID da turma não fornecido na URL.", variant: "destructive" });
      setIsLoading(false);
    }
  }, [turmaId, fetchTurmaInfo, fetchStudents, toast, router]);

  const handlePrint = () => {
    setIsPrinting(true);
    // A pequena espera pode ajudar o navegador a aplicar estilos de impressão antes de imprimir
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
        <p className="ml-4 text-lg text-foreground">Carregando lista de chamada...</p>
      </div>
    );
  }

  if (!turmaId || !turmaInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-center">
        <div>
            <p className="text-xl text-destructive mb-4">Não foi possível carregar os dados da turma. Verifique se o ID da turma é válido.</p>
            <Button onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
        </div>
      </div>
    );
  }
  
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="container mx-auto py-8 px-4 print:p-0">
      <style jsx global>{`
        .print-only-logo {
          display: none; /* Escondido por padrão */
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            background-color: #ffffff !important;
          }
          body * {
            background-color: transparent !important;
            color: #000000 !important;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px; 
            background-color: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 9pt; /* Reduzido para caber mais em A4 */
          }
          th, td {
            border: 1px solid #000000 !important;
            padding: 4px !important; /* Reduzido padding */
            text-align: left !important;
            color: #000000 !important;
            vertical-align: middle; /* Alinhar verticalmente ao meio */
          }
          th {
            background-color: #f0f0f0 !important;
            color: #000000 !important;
            font-weight: bold;
          }
          tr {
            background-color: #ffffff !important;
            page-break-inside: avoid; /* Tentar evitar quebra de linha dentro da linha */
          }
          .print-logo-container {
             display: flex;
             justify-content: flex-start; /* Alinha o logo à esquerda */
             align-items: center;
             margin-bottom: 10px; /* Espaço abaixo do logo */
          }
          .print-only-logo {
            display: block !important; /* Mostra o logo na impressão */
            width: 50px; /* Tamanho do logo */
            height: 50px;
          }
          .print-header-text {
            text-align: center; /* Centraliza o texto do cabeçalho principal */
            flex-grow: 1;
          }
          .print-header-info {
            font-size: 10pt;
          }
          .print-card-header-content {
            display: flex;
            flex-direction: column;
            align-items: center; /* Centraliza o cabeçalho principal */
          }

          @page {
            size: A4 portrait; 
            margin: 12mm; /* Margens um pouco menores */
          }
        }
      `}</style>

    <div className="printable-area">
      <Card className="print:shadow-none print:border-none print:bg-white">
        <CardHeader className="print:mb-4 print:text-black">
          {/* Container para o logo e título - visível apenas na impressão */}
          <div className="print-logo-container">
            <StrawberryIcon className="print-only-logo text-primary" data-ai-hint="strawberry logo" />
          </div>

          <div className="print-card-header-content">
            <CardTitle className="text-2xl md:text-3xl font-bold text-primary print:text-black print:text-xl print:text-center">
                Lista de Chamada
            </CardTitle>
            <CardDescription className="text-md text-muted-foreground print:text-black print:text-sm print:text-center print-header-info">
                Turma: {turmaInfo.nome} <br/>
                Data: {currentDate}
            </CardDescription>
          </div>

          {/* Botões - visíveis apenas na tela */}
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2 no-print absolute top-4 right-4">
              <Button variant="outline" onClick={() => router.back()} disabled={isPrinting}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button onClick={handlePrint} disabled={isPrinting || students.length === 0}>
                <Printer className="mr-2 h-4 w-4" /> {isPrinting ? 'Imprimindo...' : 'Imprimir Lista'}
              </Button>
          </div>
        </CardHeader>
        <CardContent className="print:p-0">
          {students.length > 0 ? (
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[100px] print:w-[18%]">Matrícula</TableHead>
                    <TableHead className="print:w-[42%]">Nome Completo</TableHead>
                    <TableHead className="w-[130px] text-center print:w-[15%] print:text-center">Presença</TableHead>
                    <TableHead className="w-[180px] print:w-[25%]">Assinatura</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map((student) => (
                    <TableRow key={student.id}>
                        <TableCell>{student.matricula}</TableCell>
                        <TableCell>{student.nomeCompleto}</TableCell>
                        <TableCell className="h-[28px] print:h-[1cm] text-center"></TableCell> {/* Altura da célula reduzida */}
                        <TableCell className="h-[28px] print:h-[1cm]"></TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4 print:text-black">
              Nenhum aluno encontrado para esta turma. Não é possível imprimir uma lista vazia.
            </p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

