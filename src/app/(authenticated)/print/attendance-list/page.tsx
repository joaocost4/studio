
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

interface StudentData {
  id: string;
  matricula: string;
  nomeCompleto: string;
}

interface TurmaData {
    id: string;
    nome: string;
    // Add any other turma fields if needed, e.g., ano, semestre
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
      } as StudentData)).sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto)); // Sort by name
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
      // router.push('/management'); // Optionally redirect if turmaId is critically missing
    }
  }, [turmaId, fetchTurmaInfo, fetchStudents, toast, router]);

  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
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
        @media print {
          body {
            -webkit-print-color-adjust: exact; /* Chrome, Safari */
            color-adjust: exact; /* Firefox, Edge */
          }
          body * {
            visibility: hidden;
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
            padding: 20px; /* Standard padding for print */
          }
          .no-print {
            display: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 10pt; /* Adjust font size for print if needed */
          }
          th, td {
            border: 1px solid #000 !important; /* Black border for print */
            padding: 6px !important; /* Adjust padding for print */
            text-align: left !important;
          }
          th {
            background-color: #e9ecef !important; /* Lighter gray for headers, more printer-friendly */
          }
          /* Ensure table fits on page, might need further adjustments based on content */
          @page {
            size: A4 portrait; 
            margin: 15mm; /* Standard margin, adjust as needed */
          }
           /* Hide header/footer provided by browser if desired */
          /*
          @page {
            margin: 0; 
          }
          body {
            margin: 1.6cm;
          }
          */
        }
      `}</style>

    <div className="printable-area">
      <Card className="print:shadow-none print:border-none print:bg-white">
        <CardHeader className="print:mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center print:flex-row print:justify-between print:items-center">
            <div>
                <CardTitle className="text-2xl md:text-3xl font-bold text-primary print:text-black print:text-xl">
                    Lista de Chamada
                </CardTitle>
                <CardDescription className="text-md print:text-black print:text-sm">
                    Turma: {turmaInfo.nome} <br/>
                    Data: {currentDate}
                </CardDescription>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2 no-print">
                <Button variant="outline" onClick={() => router.back()} disabled={isPrinting}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button onClick={handlePrint} disabled={isPrinting || students.length === 0}>
                  <Printer className="mr-2 h-4 w-4" /> {isPrinting ? 'Imprimindo...' : 'Imprimir Lista'}
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="print:p-0">
          {students.length > 0 ? (
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[120px] print:w-[20%]">Matrícula</TableHead>
                    <TableHead className="print:w-[40%]">Nome Completo</TableHead>
                    <TableHead className="w-[150px] text-center print:w-[15%] print:text-center">Presença (P/A/F)</TableHead>
                    <TableHead className="w-[200px] print:w-[25%]">Assinatura</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map((student, index) => (
                    <TableRow key={student.id} className={index % 2 === 0 ? 'print:bg-white' : 'print:bg-slate-50'}>
                        <TableCell>{student.matricula}</TableCell>
                        <TableCell>{student.nomeCompleto}</TableCell>
                        <TableCell className="h-[38px] print:h-[1.5cm]"></TableCell> {/* Empty cell for presence */}
                        <TableCell className="h-[38px] print:h-[1.5cm]"></TableCell> {/* Empty cell for signature */}
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Nenhum aluno encontrado para esta turma. Não é possível imprimir uma lista vazia.
            </p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

