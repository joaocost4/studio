
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { USER_ROLES } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, getDocs, doc, serverTimestamp, writeBatch, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, UploadCloud, AlertTriangle, CheckCircle, Info, ShieldAlert, Save, FileUp } from "lucide-react";
import { ProcessGradesInput, processPastedGrades, ProcessGradesOutput, ProcessedGradeItem } from "@/ai/flows/process-grades-flow";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TurmaData {
  id: string;
  nome: string;
  ativa: boolean;
}

interface DisciplinaData {
  id: string;
  nome: string;
  prioridade: number;
  turmaId: string;
}

interface ProvaData {
  id: string;
  nome: string;
  disciplinaId: string;
  turmaId: string;
  peso: number;
  data: Timestamp;
}

export default function LancarNotasPage() {
  const { userProfile } = useAuth();
  useRequireAuth({ allowedRoles: [USER_ROLES.ADMIN, USER_ROLES.REPRESENTATIVE] });
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = userProfile?.role === USER_ROLES.ADMIN;

  const [activeTurmas, setActiveTurmas] = useState<TurmaData[]>([]);
  const [disciplinas, setDisciplinas] = useState<DisciplinaData[]>([]);
  const [provas, setProvas] = useState<ProvaData[]>([]);

  const [selectedTurmaId, setSelectedTurmaId] = useState<string | undefined>(
    isAdmin ? undefined : userProfile?.turmaId
  );
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string | undefined>();
  const [selectedProvaId, setSelectedProvaId] = useState<string | undefined>();
  
  const [gradesPasted, setGradesPasted] = useState<string>("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isSavingGrades, setIsSavingGrades] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessGradesOutput | null>(null);

  const [loadingTurmas, setLoadingTurmas] = useState(false);
  const [loadingDisciplinas, setLoadingDisciplinas] = useState(false);
  const [loadingProvas, setLoadingProvas] = useState(false);

  const fetchActiveTurmas = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingTurmas(true);
    try {
      const turmasQuery = query(collection(db, "turmas"), where("ativa", "==", true));
      const turmasSnapshot = await getDocs(turmasQuery);
      setActiveTurmas(turmasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TurmaData)));
    } catch (error) {
      toast({ title: "Erro ao buscar turmas", variant: "destructive" });
    } finally {
      setLoadingTurmas(false);
    }
  }, [isAdmin, toast]);

  useEffect(() => {
    if (isAdmin) fetchActiveTurmas();
    else if (userProfile?.turmaId) setSelectedTurmaId(userProfile.turmaId);
  }, [isAdmin, fetchActiveTurmas, userProfile?.turmaId]);

  useEffect(() => {
    const fetchDisciplinas = async (turmaId: string) => {
      setLoadingDisciplinas(true);
      setDisciplinas([]);
      setSelectedDisciplinaId(undefined);
      setProvas([]);
      setSelectedProvaId(undefined);
      setProcessingResult(null);
      try {
        const discQuery = query(collection(db, "disciplinas"), where("turmaId", "==", turmaId));
        const discSnapshot = await getDocs(discQuery);
        const discList = discSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DisciplinaData));
        discList.sort((a,b) => a.prioridade - b.prioridade || a.nome.localeCompare(b.nome));
        setDisciplinas(discList);
      } catch (error) {
        toast({ title: "Erro ao buscar disciplinas", variant: "destructive" });
      } finally {
        setLoadingDisciplinas(false);
      }
    };
    if (selectedTurmaId) fetchDisciplinas(selectedTurmaId);
  }, [selectedTurmaId, toast]);

  useEffect(() => {
    const fetchProvas = async (disciplinaId: string) => {
      setLoadingProvas(true);
      setProvas([]);
      setSelectedProvaId(undefined);
      setProcessingResult(null);
      try {
        const provasQuery = query(collection(db, "provas"), 
          where("disciplinaId", "==", disciplinaId),
          where("turmaId", "==", selectedTurmaId) // Ensure prova is for the correct turma
        );
        const provasSnapshot = await getDocs(provasQuery);
        const provasList = provasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProvaData));
        // Sort by date, most recent first, then by name
        provasList.sort((a, b) => {
            const dateComparison = b.data.toDate().getTime() - a.data.toDate().getTime();
            if (dateComparison !== 0) return dateComparison;
            return a.nome.localeCompare(b.nome);
        });
        setProvas(provasList);
      } catch (error) {
        toast({ title: "Erro ao buscar provas", variant: "destructive" });
      } finally {
        setLoadingProvas(false);
      }
    };
    if (selectedDisciplinaId && selectedTurmaId) fetchProvas(selectedDisciplinaId);
  }, [selectedDisciplinaId, selectedTurmaId, toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          setGradesPasted(text);
          toast({ title: "Conteúdo do Arquivo Carregado", description: "O texto do arquivo foi colado na área abaixo." });
        } else {
          toast({ title: "Erro ao Ler Arquivo", description: "Não foi possível ler o conteúdo do arquivo como texto.", variant: "destructive" });
        }
      };
      reader.onerror = () => {
        toast({ title: "Erro ao Ler Arquivo", description: "Ocorreu um erro ao tentar ler o arquivo.", variant: "destructive" });
      };
      reader.readAsText(file);
    }
    // Reset file input value to allow selecting the same file again
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleProcessGrades = async () => {
    if (!selectedTurmaId || !selectedDisciplinaId || !selectedProvaId || !gradesPasted.trim()) {
      toast({ title: "Campos Obrigatórios", description: "Selecione turma, disciplina, prova e cole as notas.", variant: "destructive"});
      return;
    }
    setIsProcessingAI(true);
    setProcessingResult(null);
    try {
      const input: ProcessGradesInput = {
        turmaId: selectedTurmaId,
        disciplinaId: selectedDisciplinaId,
        provaId: selectedProvaId,
        gradesPasted: gradesPasted,
      };
      const result = await processPastedGrades(input);
      setProcessingResult(result);
      if (result.summary.successfullyParsed === 0 && result.summary.totalLines > 0) {
         toast({ title: "Processamento IA", description: "Nenhuma nota pôde ser extraída do texto. Verifique o formato.", variant: "destructive" });
      } else if (result.summary.validEntries === 0 && result.summary.successfullyParsed > 0) {
         toast({ title: "Processamento IA Concluído", description: "Nenhuma das notas processadas é válida (matrícula ou nota incorreta).", variant: "destructive" });
      } else {
        toast({ title: "Processamento IA Concluído", description: `Verifique as ${result.summary.successfullyParsed} notas processadas abaixo.` });
      }
    } catch (error: any) {
      console.error("Error processing grades with AI:", error);
      toast({ title: "Erro na IA", description: error.message || "Não foi possível processar as notas.", variant: "destructive" });
    } finally {
      setIsProcessingAI(false);
    }
  };
  
  const handleSaveChanges = async () => {
    if (!processingResult || processingResult.summary.validEntries === 0 || !userProfile) {
        toast({ title: "Nenhuma Nota Válida", description: "Não há notas válidas para salvar ou o resultado do processamento não está disponível.", variant: "destructive" });
        return;
    }
    if (!selectedTurmaId || !selectedDisciplinaId || !selectedProvaId) {
        toast({ title: "Contexto Inválido", description: "Turma, disciplina ou prova não selecionada.", variant: "destructive"});
        return;
    }

    setIsSavingGrades(true);
    try {
        const batch = writeBatch(db);
        let savedCount = 0;

        processingResult.processedEntries.forEach(entry => {
            if (entry.status === 'valid' && entry.studentUid && typeof entry.gradeNumeric === 'number') {
                const gradeDocRef = doc(db, "studentGrades", `${entry.studentUid}_${selectedProvaId}`);
                batch.set(gradeDocRef, {
                    studentUid: entry.studentUid,
                    turmaId: selectedTurmaId,
                    disciplinaId: selectedDisciplinaId,
                    provaId: selectedProvaId,
                    grade: entry.gradeNumeric,
                    submittedAt: serverTimestamp(),
                    submittedByUid: userProfile.uid,
                    studentMatricula: entry.matricula, 
                    studentNameSnapshot: entry.studentName, 
                });
                savedCount++;
            }
        });

        if (savedCount > 0) {
            await batch.commit();
            toast({ title: "Notas Salvas!", description: `${savedCount} notas foram salvas com sucesso no Firestore.` });
            setProcessingResult(null); 
            setGradesPasted(""); 
        } else {
            toast({ title: "Nenhuma Nota para Salvar", description: "Nenhuma das notas processadas estava em um estado válido para ser salva.", variant: "default" });
        }

    } catch (error: any) {
        console.error("Error saving grades to Firestore:", error);
        toast({ title: "Erro ao Salvar Notas", description: error.message || "Ocorreu um erro ao salvar as notas.", variant: "destructive" });
    } finally {
        setIsSavingGrades(false);
    }
  };


  if (!userProfile) return <div className="flex justify-center items-center min-h-[200px]"><Loader2 className="h-8 w-8 animate-spin"/></div>;

  const turmaNome = isAdmin 
    ? activeTurmas.find(t => t.id === selectedTurmaId)?.nome 
    : userProfile?.turmaNome;

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary flex items-center">
            <UploadCloud className="mr-3 h-8 w-8" /> Lançar Notas da Turma
          </CardTitle>
          <CardDescription>
            Selecione a turma, disciplina e prova. Cole as notas (matrícula e nota por linha) ou carregue de um arquivo, depois use a IA para processar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seletores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {isAdmin && (
              <div>
                <Label htmlFor="turma-select">Turma</Label>
                <Select value={selectedTurmaId} onValueChange={setSelectedTurmaId} disabled={loadingTurmas}>
                  <SelectTrigger id="turma-select">
                    <SelectValue placeholder={loadingTurmas ? "Carregando turmas..." : "Selecione uma turma"} />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTurmas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!isAdmin && userProfile?.turmaNome && (
                 <div>
                    <Label>Turma</Label>
                    <Input value={userProfile.turmaNome} readOnly disabled className="bg-muted/50"/>
                </div>
            )}
            <div>
              <Label htmlFor="disciplina-select">Disciplina</Label>
              <Select value={selectedDisciplinaId} onValueChange={setSelectedDisciplinaId} disabled={!selectedTurmaId || loadingDisciplinas || disciplinas.length === 0}>
                <SelectTrigger id="disciplina-select">
                  <SelectValue placeholder={loadingDisciplinas ? "Carregando..." : (selectedTurmaId && disciplinas.length === 0 && !loadingDisciplinas ? "Nenhuma disciplina" : "Selecione disciplina")} />
                </SelectTrigger>
                <SelectContent>
                  {disciplinas.map(d => <SelectItem key={d.id} value={d.id}>{d.nome} (Prior: {d.prioridade})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="prova-select">Prova</Label>
              <Select value={selectedProvaId} onValueChange={setSelectedProvaId} disabled={!selectedDisciplinaId || loadingProvas || provas.length === 0}>
                <SelectTrigger id="prova-select">
                  <SelectValue placeholder={loadingProvas ? "Carregando..." : (selectedDisciplinaId && provas.length === 0 && !loadingProvas ? "Nenhuma prova" : "Selecione prova")} />
                </SelectTrigger>
                <SelectContent>
                  {provas.map(p => <SelectItem key={p.id} value={p.id}>{p.nome} (Peso: {p.peso})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Textarea e Botão de Processar */}
          <div>
            <Label htmlFor="grades-paste">Cole as Notas Aqui (Matrícula: Nota ou Matrícula Nota) ou Extraia de um Arquivo</Label>
            <Textarea
              id="grades-paste"
              value={gradesPasted}
              onChange={(e) => setGradesPasted(e.target.value)}
              placeholder={"Exemplo:\n12345: 9.5\n67890 8,0\nABC01   7.2"}
              rows={8}
              className="mt-1"
              disabled={!selectedProvaId}
            />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept=".txt,.csv,.text" 
          />
          <div className="flex flex-wrap gap-2">
            <Button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={!selectedProvaId} 
                variant="outline"
                className="w-full sm:w-auto"
            >
                <FileUp className="mr-2 h-5 w-5" /> Extrair de Arquivo
            </Button>
            <Button 
                onClick={handleProcessGrades} 
                disabled={isProcessingAI || !selectedProvaId || !gradesPasted.trim()} 
                className="w-full sm:w-auto flex-grow bg-accent hover:bg-accent/90 text-accent-foreground"
            >
                {isProcessingAI ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UploadCloud className="mr-2 h-5 w-5" />}
                {isProcessingAI ? "Processando com IA..." : "Processar Notas com IA"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados do Processamento */}
      {processingResult && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
                {processingResult.summary.validEntries > 0 && processingResult.summary.validEntries === processingResult.summary.successfullyParsed ? 
                    <CheckCircle className="mr-2 h-6 w-6 text-green-500" /> :
                    processingResult.summary.successfullyParsed > 0 ?
                    <Info className="mr-2 h-6 w-6 text-blue-500" /> :
                    <AlertTriangle className="mr-2 h-6 w-6 text-destructive" />
                }
                Resultado do Processamento
            </CardTitle>
            <CardDescription>
              Total de Linhas: {processingResult.summary.totalLines} | 
              Extraídas com Sucesso: {processingResult.summary.successfullyParsed} | 
              Entradas Válidas: <span className="font-semibold text-green-600">{processingResult.summary.validEntries}</span> | 
              Matrículas Inválidas: <span className="font-semibold text-red-600">{processingResult.summary.invalidMatricula}</span> | 
              Notas com Formato Inválido: <span className="font-semibold text-orange-600">{processingResult.summary.invalidGradeFormat}</span> |
              Notas Fora do Intervalo: <span className="font-semibold text-orange-500">{processingResult.summary.invalidGradeValue}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nota Extraída</TableHead>
                    <TableHead>Nome do Aluno</TableHead>
                    <TableHead>Nota Numérica</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mensagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processingResult.processedEntries.map((entry, index) => (
                    <TableRow key={index} className={
                        entry.status === 'valid' ? 'bg-green-500/10 hover:bg-green-500/20' : 
                       (entry.status === 'invalid_matricula' || entry.status === 'invalid_grade_value') ? 'bg-red-500/10 hover:bg-red-500/20' :
                       entry.status === 'invalid_grade_format' ? 'bg-orange-500/10 hover:bg-orange-500/20' : ''
                    }>
                      <TableCell>{entry.matricula}</TableCell>
                      <TableCell>{entry.gradeRaw}</TableCell>
                      <TableCell>{entry.studentName || "---"}</TableCell>
                      <TableCell>{entry.gradeNumeric?.toFixed(2) ?? "---"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          entry.status === 'valid' ? 'bg-green-200 text-green-800' :
                          entry.status === 'invalid_matricula' ? 'bg-red-200 text-red-800' :
                          entry.status === 'invalid_grade_format' ? 'bg-orange-200 text-orange-800' :
                          entry.status === 'invalid_grade_value' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {entry.status === 'valid' && "Válido"}
                          {entry.status === 'invalid_matricula' && "Matrícula Inválida"}
                          {entry.status === 'invalid_grade_format' && "Formato de Nota Inválido"}
                          {entry.status === 'invalid_grade_value' && "Nota Fora do Intervalo"}
                          {entry.status === 'parsed' && "Apenas Extraído"}
                          {entry.status === 'unknown_error' && "Erro Desconhecido"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{entry.message || "---"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {processingResult.summary.validEntries > 0 && (
              <Button onClick={handleSaveChanges} disabled={isSavingGrades} className="mt-6 w-full md:w-auto">
                {isSavingGrades ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                {isSavingGrades ? "Salvando Notas..." : `Confirmar e Salvar ${processingResult.summary.validEntries} Notas Válidas`}
              </Button>
            )}
          </CardContent>
           <CardFooter>
                <p className="text-xs text-muted-foreground">
                    <ShieldAlert className="inline-block mr-1 h-3 w-3" />
                    Verifique cuidadosamente as notas processadas antes de salvar. As notas salvas sobrescreverão quaisquer notas anteriores para o mesmo aluno nesta prova.
                </p>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}

