
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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
        toast({ title: "Erro ao buscar dados da turma", variant: "destructive" });
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
      toast({ title: "Erro ao buscar alunos", variant: "destructive" });
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
      toast({ title: "Erro", description: "ID da turma não fornecido.", variant: "destructive" });
      setIsLoading(false);
      // Optionally redirect if turmaId is missing
      // router.push('/management'); 
    }
  }, [turmaId, fetchTurmaInfo, fetchStudents, toast]);

  const handlePrint = () => {
    setIsPrinting(true); // Optionally hide buttons during print via CSS
    window.print();
    // setIsPrinting(false); // Might need a small delay or onafterprint
  };

  // Handle after print event to reset isPrinting state
  useEffect(() => {
    const afterPrint = () => setIsPrinting(false);
    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, []);


  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Carregando lista de chamada...</p>
      </div>
    );
  }

  if (!turmaId || !turmaInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-center">
        <div>
            <p className="text-xl text-destructive mb-4">Não foi possível carregar os dados da turma.</p>
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
            padding: 20px; /* Adjust padding for print */
          }
          .no-print {
            display: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid black !important;
            padding: 8px !important;
            text-align: left !important;
          }
          th {
            background-color: #f2f2f2 !important; /* Light gray for headers */
            -webkit-print-color-adjust: exact; /* Ensure background colors print in Chrome/Safari */
            color-adjust: exact; /* Standard */
          }
          /* Ensure table fits on page, might need further adjustments based on content */
          @page {
            size: A4 portrait; 
            margin: 20mm;
          }
        }
      `}</style>

    <div className="printable-area">
      <Card className="print:shadow-none print:border-none">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <CardTitle className="text-2xl md:text-3xl font-bold text-primary">
                    Lista de Chamada
                </CardTitle>
                <CardDescription className="text-md">
                    Turma: {turmaInfo.nome} <br/>
                    Data: {currentDate}
                </CardDescription>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2 no-print">
                <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button onClick={handlePrint} disabled={isPrinting}>
                <Printer className="mr-2 h-4 w-4" /> {isPrinting ? 'Imprimindo...' : 'Imprimir Lista'}
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[150px]">Matrícula</TableHead>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead className="w-[150px] text-center">Presença (P/A/F)</TableHead>
                    <TableHead className="w-[250px]">Assinatura</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map((student) => (
                    <TableRow key={student.id}>
                        <TableCell>{student.matricula}</TableCell>
                        <TableCell>{student.nomeCompleto}</TableCell>
                        <TableCell className="h-[40px]"></TableCell> {/* Empty cell for presence */}
                        <TableCell className="h-[40px]"></TableCell> {/* Empty cell for signature */}
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Nenhum aluno encontrado para esta turma.
            </p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
