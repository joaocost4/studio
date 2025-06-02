
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
import { Loader2, UploadCloud, AlertTriangle, CheckCircle, Info, ShieldAlert, Save, FileUp, FileText, Image as ImageIcon, X } from "lucide-react";
import { ProcessGradesInput, processPastedGrades, ProcessGradesOutput, ProcessedGradeItem } from "@/ai/flows/process-grades-flow";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

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

interface SelectedFileForAI {
  name: string;
  type: string; // MIME type
  dataUri: string;
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
  const [selectedFileForAI, setSelectedFileForAI] = useState<SelectedFileForAI | null>(null);

  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isSavingGrades, setIsSavingGrades] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessGradesOutput | null>(null);
  const [forceSaveOverride, setForceSaveOverride] = useState<Record<number, boolean>>({});

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

  const resetDependentStates = () => {
    setDisciplinas([]);
    setSelectedDisciplinaId(undefined);
    setProvas([]);
    setSelectedProvaId(undefined);
    setProcessingResult(null);
    setForceSaveOverride({});
  };

  useEffect(() => {
    const fetchDisciplinas = async (turmaId: string) => {
      setLoadingDisciplinas(true);
      resetDependentStates();
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
    else resetDependentStates();
  }, [selectedTurmaId, toast]);

  useEffect(() => {
    const fetchProvas = async (disciplinaId: string) => {
      setLoadingProvas(true);
      setProvas([]);
      setSelectedProvaId(undefined);
      setProcessingResult(null);
      setForceSaveOverride({});
      try {
        const provasQuery = query(collection(db, "provas"), 
          where("disciplinaId", "==", disciplinaId),
          where("turmaId", "==", selectedTurmaId) 
        );
        const provasSnapshot = await getDocs(provasQuery);
        const provasList = provasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProvaData));
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
    else {
        setProvas([]);
        setSelectedProvaId(undefined);
        setProcessingResult(null);
        setForceSaveOverride({});
    }
  }, [selectedDisciplinaId, selectedTurmaId, toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          if (file.type.startsWith('text/')) {
            setGradesPasted(result);
            setSelectedFileForAI(null); 
            toast({ title: "Conteúdo do Arquivo de Texto Carregado", description: "O texto do arquivo foi colado na área abaixo." });
          } else if (file.type.startsWith('image/') || file.type === 'application/pdf') {
            setSelectedFileForAI({ name: file.name, type: file.type, dataUri: result });
            setGradesPasted(""); 
            toast({ title: `Arquivo ${file.type.startsWith('image/') ? 'de Imagem' : 'PDF'} Carregado`, description: `Arquivo "${file.name}" pronto para processamento pela IA.` });
          }
        } else {
          toast({ title: "Erro ao Ler Arquivo", description: "Não foi possível ler o conteúdo do arquivo.", variant: "destructive" });
        }
      };
      reader.onerror = () => {
        toast({ title: "Erro ao Ler Arquivo", description: "Ocorreu um erro ao tentar ler o arquivo.", variant: "destructive" });
      };
      
      if (file.type.startsWith('text/') || file.type.startsWith('image/') || file.type === 'application/pdf') {
        // REMOVED the problematic reader.readAsDataURL(file); that was here.
        if (file.type.startsWith('text/')) {
          reader.readAsText(file);
        } else { // This covers image/* and application/pdf
          reader.readAsDataURL(file);
        }
      } else {
        toast({ title: "Tipo de Arquivo Não Suportado", description: "Por favor, selecione um arquivo de texto, imagem ou PDF.", variant: "destructive" });
      }
    }
    if (event.target) {
      event.target.value = ""; 
    }
  };

  const handleProcessGrades = async () => {
    if (!selectedTurmaId || !selectedDisciplinaId || !selectedProvaId) {
      toast({ title: "Seleção Incompleta", description: "Selecione turma, disciplina e prova.", variant: "destructive"});
      return;
    }
    if (!gradesPasted.trim() && !selectedFileForAI) {
      toast({ title: "Nenhuma Nota para Processar", description: "Cole as notas ou carregue um arquivo de imagem/PDF.", variant: "destructive"});
      return;
    }

    setIsProcessingAI(true);
    setProcessingResult(null);
    setForceSaveOverride({});

    let inputSource: ProcessGradesInput['source'];

    if (selectedFileForAI) {
      inputSource = {
        type: "file",
        fileName: selectedFileForAI.name,
        mimeType: selectedFileForAI.type,
        dataUri: selectedFileForAI.dataUri,
      };
    } else if (gradesPasted.trim()) {
      inputSource = {
        type: "text",
        content: gradesPasted,
      };
    } else {
      toast({ title: "Erro Interno", description: "Nenhuma fonte de dados para processar.", variant: "destructive" });
      setIsProcessingAI(false);
      return;
    }

    try {
      const input: ProcessGradesInput = {
        turmaId: selectedTurmaId,
        disciplinaId: selectedDisciplinaId,
        provaId: selectedProvaId,
        source: inputSource,
      };
      const result = await processPastedGrades(input);
      setProcessingResult(result);
      if (result.summary.successfullyParsed === 0 && result.summary.totalSourceEntries > 0) {
         toast({ title: "Processamento IA", description: "Nenhuma nota pôde ser extraída. Verifique o conteúdo.", variant: "destructive" });
      } else if (result.summary.validEntries === 0 && result.summary.successfullyParsed > 0 && !result.processedEntries.some(e => e.status === 'invalid_matricula')) {
         toast({ title: "Processamento IA Concluído", description: "Nenhuma das notas processadas é válida (matrícula ou nota incorreta).", variant: "destructive" });
      } else if (result.summary.successfullyParsed > 0){
        toast({ title: "Processamento IA Concluído", description: `Verifique as ${result.summary.successfullyParsed} notas processadas abaixo.` });
      }
    } catch (error: any) {
      console.error("Error processing grades with AI:", error);
      toast({ title: "Erro na IA", description: error.message || "Não foi possível processar as notas.", variant: "destructive" });
    } finally {
      setIsProcessingAI(false);
    }
  };
  
  const handleClearSelectedFile = () => {
    setSelectedFileForAI(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
  };

  const handleGradesPastedChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGradesPasted(e.target.value);
    if (selectedFileForAI) {
      setSelectedFileForAI(null); 
    }
  };


  const handleToggleForceSave = (entryIndex: number, shouldForceSave: boolean) => {
    setForceSaveOverride(prev => ({ ...prev, [entryIndex]: shouldForceSave }));
  };
  
  const handleSaveChanges = async () => {
    if (!processingResult || !userProfile || !selectedTurmaId || !selectedDisciplinaId || !selectedProvaId) {
        toast({ title: "Dados Incompletos", description: "Informações necessárias para salvar as notas estão faltando.", variant: "destructive"});
        return;
    }

    const entriesToSave = processingResult.processedEntries.filter((entry, index) => 
        (entry.status === 'valid' || (entry.status === 'invalid_matricula' && forceSaveOverride[index])) && typeof entry.gradeNumeric === 'number'
    );

    if (entriesToSave.length === 0) {
        toast({ title: "Nenhuma Nota para Salvar", description: "Não há notas válidas ou selecionadas para forçar o salvamento.", variant: "default" });
        return;
    }

    setIsSavingGrades(true);
    try {
        const batch = writeBatch(db);
        let savedCount = 0;

        processingResult.processedEntries.forEach((entry, index) => {
            const isOverriddenInvalidMatricula = entry.status === 'invalid_matricula' && forceSaveOverride[index];
            const isValidEntry = entry.status === 'valid';

            if ((isValidEntry || isOverriddenInvalidMatricula) && typeof entry.gradeNumeric === 'number') {
                 let gradeDocRef;
                 const gradeData: any = {
                    turmaId: selectedTurmaId,
                    disciplinaId: selectedDisciplinaId,
                    provaId: selectedProvaId,
                    grade: entry.gradeNumeric,
                    submittedAt: serverTimestamp(),
                    submittedByUid: userProfile.uid,
                    studentMatricula: entry.matricula,
                };

                if (isValidEntry && entry.studentUid) {
                    gradeDocRef = doc(db, "studentGrades", `${entry.studentUid}_${selectedProvaId}`);
                    gradeData.studentUid = entry.studentUid;
                    gradeData.studentNameSnapshot = entry.studentName;
                    gradeData.isUnverifiedMatricula = false;
                } else if (isOverriddenInvalidMatricula) {
                    gradeDocRef = doc(collection(db, "studentGrades")); 
                    gradeData.studentUid = null; 
                    gradeData.studentNameSnapshot = null;
                    gradeData.isUnverifiedMatricula = true;
                } else {
                    return; 
                }
                batch.set(gradeDocRef, gradeData);
                savedCount++;
            }
        });

        if (savedCount > 0) {
            await batch.commit();
            toast({ title: "Notas Salvas!", description: `${savedCount} notas foram salvas com sucesso no Firestore.` });
            setProcessingResult(null); 
            setGradesPasted(""); 
            setSelectedFileForAI(null);
            setForceSaveOverride({});
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

  const savableEntriesCount = processingResult?.processedEntries.filter(
    (entry, index) => (entry.status === 'valid' || (entry.status === 'invalid_matricula' && forceSaveOverride[index])) && typeof entry.gradeNumeric === 'number'
  ).length ?? 0;


  if (!userProfile) return <div className="flex justify-center items-center min-h-[200px]"><Loader2 className="h-8 w-8 animate-spin"/></div>;

  const canProcess = !!selectedProvaId && (gradesPasted.trim().length > 0 || !!selectedFileForAI);

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary flex items-center">
            <UploadCloud className="mr-3 h-8 w-8" /> Lançar Notas da Turma
          </CardTitle>
          <CardDescription>
            Selecione turma, disciplina e prova. Cole as notas (matrícula e nota por linha), ou carregue de um arquivo de texto, imagem ou PDF, depois use a IA para processar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
              <Select value={selectedProvaId} onValueChange={(value) => { setSelectedProvaId(value); setProcessingResult(null); setForceSaveOverride({}); }} disabled={!selectedDisciplinaId || loadingProvas || provas.length === 0}>
                <SelectTrigger id="prova-select">
                  <SelectValue placeholder={loadingProvas ? "Carregando..." : (selectedDisciplinaId && provas.length === 0 && !loadingProvas ? "Nenhuma prova" : "Selecione prova")} />
                </SelectTrigger>
                <SelectContent>
                  {provas.map(p => <SelectItem key={p.id} value={p.id}>{p.nome} (Peso: {p.peso})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="grades-paste">
              {selectedFileForAI 
                ? `Arquivo selecionado para IA: ${selectedFileForAI.name}` 
                : "Cole as Notas Aqui ou Extraia de um Arquivo"}
            </Label>
            {selectedFileForAI && (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50 my-1">
                {selectedFileForAI.type.startsWith("image/") && <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                {selectedFileForAI.type === "application/pdf" && <FileText className="h-5 w-5 text-muted-foreground" />}
                <span className="text-sm text-muted-foreground flex-grow truncate">{selectedFileForAI.name}</span>
                <Button variant="ghost" size="icon" onClick={handleClearSelectedFile} className="h-7 w-7">
                  <X className="h-4 w-4 text-destructive"/>
                </Button>
              </div>
            )}
            <Textarea
              id="grades-paste"
              value={gradesPasted}
              onChange={handleGradesPastedChange}
              placeholder={
                selectedFileForAI 
                ? "Conteúdo do arquivo selecionado será processado pela IA."
                : "Exemplo:\n12345: 9.5\n67890 8,0\nABC01   7.2"
              }
              rows={selectedFileForAI ? 3 : 8}
              className="mt-1"
              disabled={!selectedProvaId || !!selectedFileForAI}
            />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept=".txt,.csv,.text,image/*,application/pdf" 
          />
          <div className="flex flex-wrap gap-2">
            <Button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={!selectedProvaId || isProcessingAI} 
                variant="outline"
                className="w-full sm:w-auto"
            >
                <FileUp className="mr-2 h-5 w-5" /> Extrair de Arquivo (.txt, .csv, .png, .jpg, .pdf)
            </Button>
            <Button 
                onClick={handleProcessGrades} 
                disabled={isProcessingAI || !canProcess} 
                className="w-full sm:w-auto flex-grow bg-accent hover:bg-accent/90 text-accent-foreground"
            >
                {isProcessingAI ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UploadCloud className="mr-2 h-5 w-5" />}
                {isProcessingAI ? "Processando com IA..." : "Processar com IA"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {processingResult && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
                {processingResult.summary.validEntries > 0 && processingResult.summary.validEntries === processingResult.summary.successfullyParsed ? 
                    <CheckCircle className="mr-2 h-6 w-6 text-green-500" /> :
                    processingResult.summary.successfullyParsed > 0 || savableEntriesCount > 0 ?
                    <Info className="mr-2 h-6 w-6 text-blue-500" /> :
                    <AlertTriangle className="mr-2 h-6 w-6 text-destructive" />
                }
                Resultado do Processamento
            </CardTitle>
            <CardDescription>
              Fonte: {selectedFileForAI ? `Arquivo (${selectedFileForAI.name})` : "Texto Colado"} | 
              Entradas Identificadas pela IA: {processingResult.summary.totalSourceEntries} | 
              Extraídas com Sucesso: {processingResult.summary.successfullyParsed} | 
              Válidas (Matrícula OK): <span className="font-semibold text-green-600">{processingResult.summary.validEntries}</span> | 
              Matr. Inválida: <span className="font-semibold text-red-600">{processingResult.summary.invalidMatricula}</span> | 
              Formato Nota Inválido: <span className="font-semibold text-orange-600">{processingResult.summary.invalidGradeFormat}</span> |
              Nota Fora Intervalo: <span className="font-semibold text-orange-500">{processingResult.summary.invalidGradeValue}</span>
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
                    <TableHead className="text-center">Forçar Salvar?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processingResult.processedEntries.map((entry, index) => (
                    <TableRow 
                        key={entry.matricula + '-' + index + '-' + entry.gradeRaw} 
                        className={
                        entry.status === 'valid' ? 'bg-green-500/10 hover:bg-green-500/20' : 
                       (entry.status === 'invalid_matricula' && !forceSaveOverride[index]) ? 'bg-red-500/10 hover:bg-red-500/20' :
                       (entry.status === 'invalid_matricula' && forceSaveOverride[index]) ? 'bg-yellow-500/10 hover:bg-yellow-500/20' :
                       entry.status === 'invalid_grade_format' || entry.status === 'invalid_grade_value' ? 'bg-orange-500/10 hover:bg-orange-500/20' : ''
                    }>
                      <TableCell>{entry.matricula}</TableCell>
                      <TableCell>{entry.gradeRaw}</TableCell>
                      <TableCell>{entry.studentName || "---"}</TableCell>
                      <TableCell>{typeof entry.gradeNumeric === 'number' ? entry.gradeNumeric.toFixed(2) : "---"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          entry.status === 'valid' ? 'bg-green-200 text-green-800' :
                          entry.status === 'invalid_matricula' && !forceSaveOverride[index] ? 'bg-red-200 text-red-800' :
                          entry.status === 'invalid_matricula' && forceSaveOverride[index] ? 'bg-yellow-200 text-yellow-800' :
                          entry.status === 'invalid_grade_format' || entry.status === 'invalid_grade_value' ? 'bg-orange-200 text-orange-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {entry.status === 'valid' && "Válido"}
                          {entry.status === 'invalid_matricula' && !forceSaveOverride[index] && "Matrícula Inválida"}
                          {entry.status === 'invalid_matricula' && forceSaveOverride[index] && "Matr. Inválida (Salvar Mesmo Assim)"}
                          {entry.status === 'invalid_grade_format' && "Formato de Nota Inválido"}
                          {entry.status === 'invalid_grade_value' && "Nota Fora do Intervalo"}
                          {entry.status === 'parsed' && "Apenas Extraído"}
                          {entry.status === 'unknown_error' && "Erro Desconhecido"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{entry.message || "---"}</TableCell>
                      <TableCell className="text-center">
                        {entry.status === 'invalid_matricula' && typeof entry.gradeNumeric === 'number' && (
                          <Checkbox
                            id={`force-save-${index}`}
                            checked={!!forceSaveOverride[index]}
                            onCheckedChange={(checked) => handleToggleForceSave(index, !!checked)}
                          />
                        )}
                         {entry.status === 'invalid_matricula' && typeof entry.gradeNumeric !== 'number' && (
                            <span className="text-xs text-muted-foreground italic">Nota inválida</span>
                         )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {savableEntriesCount > 0 && (
              <Button onClick={handleSaveChanges} disabled={isSavingGrades} className="mt-6 w-full md:w-auto">
                {isSavingGrades ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                {isSavingGrades ? "Salvando Notas..." : `Confirmar e Salvar ${savableEntriesCount} Nota(s)`}
              </Button>
            )}
          </CardContent>
           <CardFooter>
                <p className="text-xs text-muted-foreground">
                    <ShieldAlert className="inline-block mr-1 h-3 w-3" />
                    Verifique cuidadosamente as notas processadas antes de salvar. Notas para matrículas não encontradas (se selecionadas para salvar) serão armazenadas sem vínculo direto a um usuário existente.
                </p>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}
    