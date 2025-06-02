
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, AlertTriangle, Info, BookOpenText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ProvaData {
  id: string;
  nome: string;
  disciplinaId: string;
  turmaId: string;
  peso: number;
  data: Timestamp;
}

interface GradeData {
  grade: number;
  submittedAt: Timestamp;
}

interface ProvaWithGrade extends ProvaData {
  grade?: GradeData;
}

interface DisciplinaData {
  id: string;
  nome: string;
  prioridade: number;
  turmaId: string;
}

interface DisciplinaWithGrades extends DisciplinaData {
  provas: ProvaWithGrade[];
  weightedAverage?: number;
  totalWeightWithGrades?: number;
  possibleTotalWeight?: number;
}

export default function MyGradesPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const [disciplinasComNotas, setDisciplinasComNotas] = useState<DisciplinaWithGrades[]>([]);
  const [isLoadingGrades, setIsLoadingGrades] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateWeightedAverage = (provas: ProvaWithGrade[]): { weightedAverage?: number; totalWeightWithGrades?: number, possibleTotalWeight?: number } => {
    let totalWeightedScore = 0;
    let totalWeightWithGrades = 0;
    let possibleTotalWeight = 0;

    provas.forEach(prova => {
      possibleTotalWeight += prova.peso;
      if (prova.grade?.grade !== undefined) {
        totalWeightedScore += prova.grade.grade * prova.peso;
        totalWeightWithGrades += prova.peso;
      }
    });
    
    if (totalWeightWithGrades > 0) {
      // Calculate average based on points earned so far / total points possible from graded assessments
      // Or, if you want an average based on total module weight:
      // return totalWeightedScore (this would be the sum of (grade * weight) for all components)
      // For this version, let's show the current earned points sum directly.
      return { weightedAverage: totalWeightedScore, totalWeightWithGrades, possibleTotalWeight };
    }
    return { weightedAverage: undefined, totalWeightWithGrades: 0, possibleTotalWeight };
  };


  const fetchGrades = useCallback(async () => {
    if (!userProfile || !userProfile.turmaId || !userProfile.uid) {
      setError("Perfil do usuário ou turma não encontrado. Certifique-se de que está associado a uma turma.");
      setIsLoadingGrades(false);
      return;
    }

    setIsLoadingGrades(true);
    setError(null);

    try {
      // 1. Fetch Disciplinas for the user's turma
      const disciplinasQuery = query(collection(db, "disciplinas"), where("turmaId", "==", userProfile.turmaId));
      const disciplinasSnapshot = await getDocs(disciplinasQuery);
      const disciplinasList: DisciplinaData[] = disciplinasSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as DisciplinaData));
      disciplinasList.sort((a, b) => a.prioridade - b.prioridade || a.nome.localeCompare(b.nome));

      if (disciplinasList.length === 0) {
        setError("Nenhuma disciplina encontrada para sua turma.");
        setDisciplinasComNotas([]);
        setIsLoadingGrades(false);
        return;
      }

      const disciplinasComNotasPromises = disciplinasList.map(async (disciplina) => {
        // 2. For each disciplina, fetch Provas
        const provasQuery = query(
          collection(db, "provas"),
          where("disciplinaId", "==", disciplina.id),
          where("turmaId", "==", userProfile.turmaId)
        );
        const provasSnapshot = await getDocs(provasQuery);
        const provasList: ProvaData[] = provasSnapshot.docs.map(p => ({ id: p.id, ...p.data() } as ProvaData));
        provasList.sort((a,b) => a.data.toDate().getTime() - b.data.toDate().getTime() || a.nome.localeCompare(b.nome));

        // 3. For each prova, fetch the student's grade
        const provasWithGradesPromises = provasList.map(async (prova) => {
          const gradeDocRef = doc(db, "studentGrades", `${userProfile.uid}_${prova.id}`);
          const gradeDocSnap = await getDoc(gradeDocRef);
          let gradeData: GradeData | undefined = undefined;
          if (gradeDocSnap.exists()) {
            gradeData = gradeDocSnap.data() as GradeData;
          }
          return { ...prova, grade: gradeData } as ProvaWithGrade;
        });

        const provasComNotasData = await Promise.all(provasWithGradesPromises);
        const averageInfo = calculateWeightedAverage(provasComNotasData);

        return {
          ...disciplina,
          provas: provasComNotasData,
          weightedAverage: averageInfo.weightedAverage,
          totalWeightWithGrades: averageInfo.totalWeightWithGrades,
          possibleTotalWeight: averageInfo.possibleTotalWeight
        } as DisciplinaWithGrades;
      });

      const result = await Promise.all(disciplinasComNotasPromises);
      setDisciplinasComNotas(result);

    } catch (e: any) {
      console.error("Error fetching grades:", e);
      setError("Ocorreu um erro ao buscar suas notas. Tente novamente mais tarde.");
    } finally {
      setIsLoadingGrades(false);
    }
  }, [userProfile]);

  useEffect(() => {
    if (!authLoading && userProfile) {
      fetchGrades();
    } else if (!authLoading && !userProfile) {
      setIsLoadingGrades(false);
      setError("Você precisa estar logado para ver suas notas.");
    }
  }, [authLoading, userProfile, fetchGrades]);

  if (authLoading || isLoadingGrades) {
    return (
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Carregando suas notas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-destructive/50">
            <CardHeader className="flex flex-row items-center space-x-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                    <CardTitle className="text-destructive">Erro ao Carregar Notas</CardTitle>
                    <CardDescription className="text-destructive/80">{error}</CardDescription>
                </div>
            </CardHeader>
        </Card>
      </div>
    );
  }

  if (disciplinasComNotas.length === 0 && !error) {
    return (
       <div className="container mx-auto py-8 px-4">
        <Card className="border-primary/30">
             <CardHeader className="flex flex-row items-center space-x-3">
                <Info className="h-8 w-8 text-primary" />
                 <div>
                    <CardTitle className="text-primary">Nenhuma Nota Encontrada</CardTitle>
                    <CardDescription>Ainda não há disciplinas ou notas lançadas para sua turma.</CardDescription>
                </div>
            </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="text-center mb-10">
        <BookOpenText className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold font-headline text-primary">Minhas Notas</h1>
        <p className="text-muted-foreground">Acompanhe seu desempenho nas disciplinas.</p>
         {userProfile?.turmaNome && <p className="text-sm text-foreground mt-1">Turma: <Badge variant="secondary">{userProfile.turmaNome}</Badge></p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {disciplinasComNotas.map((disciplina) => (
          <Card key={disciplina.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl border-primary/20 flex flex-col">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl font-headline text-primary/90">{disciplina.nome}</CardTitle>
              <CardDescription>Prioridade: {disciplina.prioridade}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-grow">
              {disciplina.provas.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Avaliação</TableHead>
                      <TableHead className="text-center">Data</TableHead>
                      <TableHead className="text-center">Peso</TableHead>
                      <TableHead className="text-right">Nota</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disciplina.provas.map((prova) => (
                      <TableRow key={prova.id}>
                        <TableCell className="font-medium">{prova.nome}</TableCell>
                        <TableCell className="text-center text-xs">
                          {prova.data ? prova.data.toDate().toLocaleDateString('pt-BR') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-center">{prova.peso.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {prova.grade?.grade !== undefined ? prova.grade.grade.toFixed(2) : <Badge variant="outline">Pendente</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma avaliação cadastrada para esta disciplina ainda.</p>
              )}
            </CardContent>
            {disciplina.provas.length > 0 && (
              <>
                <Separator className="my-0 bg-primary/10" />
                <CardFooter className="pt-4 pb-4 flex-col items-start text-sm">
                    {disciplina.weightedAverage !== undefined ? (
                        <>
                            <p>
                                <span className="font-semibold">Soma dos Pontos Obtidos:</span> {disciplina.weightedAverage.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                (Considerando {disciplina.totalWeightWithGrades?.toFixed(2)} de {disciplina.possibleTotalWeight?.toFixed(2)} pontos possíveis já avaliados)
                            </p>
                        </>
                    ) : (
                        <p className="text-muted-foreground">Nenhuma nota lançada para calcular a média.</p>
                    )}
                </CardFooter>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

