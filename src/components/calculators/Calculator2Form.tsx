
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import React, { useEffect, useState } from "react";
import { Loader2, PlayCircle, CheckCircle, XCircle, Eraser } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

const calculator2Schema = z.object({
  cognitiva1Calc2: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10.").optional().or(z.literal("").transform(() => undefined)),
  cognitiva2Calc2: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10.").optional().or(z.literal("").transform(() => undefined)),
  formativaCalc2: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10.").optional().or(z.literal("").transform(() => undefined)),
  microbiologiaProva1: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10.").optional().or(z.literal("").transform(() => undefined)),
  microbiologiaProva2: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10.").optional().or(z.literal("").transform(() => undefined)),
  patologiaNota: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10.").optional().or(z.literal("").transform(() => undefined)),
});

type Calculator2FormValues = z.infer<typeof calculator2Schema>;

interface CalculationResultCalc2 {
  notaFinal: number;
  aprovado: boolean;
  detalhes: {
    cognitiva1: { nota: number; peso: number; contribuicao: number };
    cognitiva2: { nota: number; peso: number; contribuicao: number };
    formativa: { nota: number; peso: number; contribuicao: number };
    microbiologia1: { nota: number; peso: number; contribuicao: number };
    microbiologia2: { nota: number; peso: number; contribuicao: number };
    patologia: { nota: number; peso: number; contribuicao: number };
  };
}

export function Calculator2Form() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<CalculationResultCalc2 | null>(null);

  const form = useForm<Calculator2FormValues>({
    resolver: zodResolver(calculator2Schema),
    defaultValues: {
      cognitiva1Calc2: undefined,
      cognitiva2Calc2: undefined,
      formativaCalc2: undefined,
      microbiologiaProva1: undefined,
      microbiologiaProva2: undefined,
      patologiaNota: undefined,
    },
  });

  useEffect(() => {
    if (userProfile) {
      const loadData = async () => {
        setLoadingData(true);
        try {
          const docRef = doc(db, "calculator2Data", userProfile.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data()?.lastSession;
            if (data) {
              const sanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
                acc[key as keyof Calculator2FormValues] = typeof value === 'number' ? value : undefined;
                return acc;
              }, {} as Calculator2FormValues);
              form.reset(sanitizedData);
              toast({ title: "Sessão anterior da Calculadora Detalhada carregada!" });
            }
          }
        } catch (error) {
          console.error("Error loading data for calc 2: ", error);
          toast({ title: "Erro ao carregar dados da Calculadora Detalhada", variant: "destructive" });
        } finally {
          setLoadingData(false);
        }
      };
      loadData();
    } else {
      setLoadingData(false);
    }
  }, [userProfile, form, toast]);

  const handleClearField = (fieldName: keyof Calculator2FormValues) => {
    form.setValue(fieldName, undefined);
  };

  const handleClearAll = () => {
    form.reset({
        cognitiva1Calc2: undefined,
        cognitiva2Calc2: undefined,
        formativaCalc2: undefined,
        microbiologiaProva1: undefined,
        microbiologiaProva2: undefined,
        patologiaNota: undefined,
    });
    setResult(null);
    toast({ title: "Campos Limpos", description: "Todas as notas foram apagadas." });
  };

  async function onSubmit(values: Calculator2FormValues) {
    setCalculating(true);
    setResult(null);

    const {
        cognitiva1Calc2,
        cognitiva2Calc2,
        formativaCalc2,
        microbiologiaProva1,
        microbiologiaProva2,
        patologiaNota,
    } = values;

    if (
        cognitiva1Calc2 === undefined ||
        cognitiva2Calc2 === undefined ||
        formativaCalc2 === undefined ||
        microbiologiaProva1 === undefined ||
        microbiologiaProva2 === undefined ||
        patologiaNota === undefined
    ) {
        toast({
            title: "Campos Incompletos",
            description: "Por favor, preencha todas as notas para calcular.",
            variant: "destructive",
        });
        setCalculating(false);
        return;
    }
    
    const pesos = {
        cognitiva1: 0.21,
        cognitiva2: 0.21,
        formativa: 0.28,
        microbiologia1: 0.09,
        microbiologia2: 0.09,
        patologia: 0.12,
    };

    const contCognitiva1 = (cognitiva1Calc2 || 0) * pesos.cognitiva1;
    const contCognitiva2 = (cognitiva2Calc2 || 0) * pesos.cognitiva2;
    const contFormativa = (formativaCalc2 || 0) * pesos.formativa;
    const contMicro1 = (microbiologiaProva1 || 0) * pesos.microbiologia1;
    const contMicro2 = (microbiologiaProva2 || 0) * pesos.microbiologia2;
    const contPatologia = (patologiaNota || 0) * pesos.patologia;

    const notaFinal = contCognitiva1 + contCognitiva2 + contFormativa + contMicro1 + contMicro2 + contPatologia;
    const aprovado = notaFinal >= 6;

    const newResult = {
      notaFinal,
      aprovado,
      detalhes: {
        cognitiva1: { nota: cognitiva1Calc2 || 0, peso: pesos.cognitiva1, contribuicao: contCognitiva1 },
        cognitiva2: { nota: cognitiva2Calc2 || 0, peso: pesos.cognitiva2, contribuicao: contCognitiva2 },
        formativa: { nota: formativaCalc2 || 0, peso: pesos.formativa, contribuicao: contFormativa },
        microbiologia1: { nota: microbiologiaProva1 || 0, peso: pesos.microbiologia1, contribuicao: contMicro1 },
        microbiologia2: { nota: microbiologiaProva2 || 0, peso: pesos.microbiologia2, contribuicao: contMicro2 },
        patologia: { nota: patologiaNota || 0, peso: pesos.patologia, contribuicao: contPatologia },
      },
    };
    setResult(newResult);

    toast({
        title: aprovado ? "Parabéns!" : "Quase lá!",
        description: `Sua nota final no módulo é ${notaFinal.toFixed(2)}.`,
        variant: aprovado ? undefined : "destructive",
    });

    if (userProfile) {
      try {
        const docRef = doc(db, "calculator2Data", userProfile.uid);
        await setDoc(docRef, { 
            lastSession: values,
            matricula: userProfile.matricula,
            updatedAt: serverTimestamp()
        }, { merge: true });
        // Toast de notas salvas foi removido daqui
      } catch (error) {
        console.error("Error saving data for calc 2: ", error);
        toast({
          title: "Erro ao Salvar",
          description: "Não foi possível salvar suas notas. Verifique as regras de segurança do Firestore.",
          variant: "destructive",
        });
      }
    }
    setCalculating(false);
  }
  
  if (loadingData) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2 text-foreground">Carregando suas notas...</span></div>;
  }

  const renderFormField = (name: keyof Calculator2FormValues, label: string, placeholder: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-primary/90 font-semibold">{label}</FormLabel>
          <div className="flex items-center gap-2">
            <FormControl>
              <Input 
                type="number" 
                step="0.01" 
                placeholder={placeholder} 
                {...field}
                value={field.value ?? ""}
                onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                className="border-primary/30 focus:border-primary" 
              />
            </FormControl>
            {field.value !== undefined && field.value !== "" && (
                 <Button type="button" variant="ghost" size="icon" onClick={() => handleClearField(name)} className="text-muted-foreground hover:text-destructive h-8 w-8">
                    <XCircle size={18} />
                </Button>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <div>
          <h3 className="text-xl font-headline text-primary mb-4">🧠 Avaliações Cognitivas (42%)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {renderFormField("cognitiva1Calc2", "Cognitiva 1 (21%)", "Nota de 0-10")}
            {renderFormField("cognitiva2Calc2", "Cognitiva 2 (21%)", "Nota de 0-10")}
          </div>
        </div>

        <Separator className="bg-primary/20 my-6" />

        <div>
          <h3 className="text-xl font-headline text-primary mb-4">📝 Avaliação Formativa (28%)</h3>
          {renderFormField("formativaCalc2", "Nota Formativa (28%)", "Nota de 0-10")}
        </div>

        <Separator className="bg-primary/20 my-6" />

        <div>
          <h3 className="text-xl font-headline text-primary mb-4">🔬 Prática de Microbiologia (18%)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {renderFormField("microbiologiaProva1", "Prova 1 (9%)", "Nota de 0-10")}
            {renderFormField("microbiologiaProva2", "Prova 2 (9%)", "Nota de 0-10")}
          </div>
        </div>

        <Separator className="bg-primary/20 my-6" />

        <div>
          <h3 className="text-xl font-headline text-primary mb-4">🩺 Patologia (12%)</h3>
            {renderFormField("patologiaNota", "Nota de Patologia (12%)", "Nota de 0-10")}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button type="submit" className="w-full sm:w-auto flex-grow bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6" disabled={calculating}>
            {calculating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
            {calculating ? "Calculando..." : "Calcular Nota Final"}
            </Button>
            <Button type="button" variant="outline" onClick={handleClearAll} className="w-full sm:w-auto text-lg py-6 border-destructive text-destructive hover:bg-destructive/10">
                <Eraser className="mr-2 h-5 w-5" /> Limpar Tudo
            </Button>
        </div>
      </form>

      {result && (
        <Card className="mt-10 bg-card border-primary/20 shadow-lg rounded-xl">
          <CardHeader className="text-center">
             <div className={`mx-auto mb-2 ${result.aprovado ? 'text-green-500' : 'text-red-500'}`}>
                {result.aprovado ? <CheckCircle size={48} /> : <XCircle size={48} />}
            </div>
            <CardTitle className={`text-3xl font-headline ${result.aprovado ? 'text-green-600' : 'text-red-600'}`}>
              Resultado Final
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-5xl font-bold text-foreground/90 my-4">{result.notaFinal.toFixed(2)}</p>
            {result.aprovado ? (
              <p className="text-xl text-green-600 font-semibold">Aprovada! Parabéns! 🎉</p>
            ) : (
              <p className="text-xl text-red-600 font-semibold">Reprovada. Continue se esforçando! 💪</p>
            )}
          </CardContent>
           <CardFooter className="flex-col items-start p-6 border-t border-border mt-4">
            <h4 className="text-lg font-semibold text-primary mb-3 self-center">Detalhes do Cálculo:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-foreground/90 w-full">
                <p>Cognitiva 1: {result.detalhes.cognitiva1.nota.toFixed(1)} × {(result.detalhes.cognitiva1.peso * 100).toFixed(0)}% = {result.detalhes.cognitiva1.contribuicao.toFixed(2)}</p>
                <p>Cognitiva 2: {result.detalhes.cognitiva2.nota.toFixed(1)} × {(result.detalhes.cognitiva2.peso * 100).toFixed(0)}% = {result.detalhes.cognitiva2.contribuicao.toFixed(2)}</p>
                <p>Formativa: {result.detalhes.formativa.nota.toFixed(1)} × {(result.detalhes.formativa.peso * 100).toFixed(0)}% = {result.detalhes.formativa.contribuicao.toFixed(2)}</p>
                <p>Microbiologia 1: {result.detalhes.microbiologia1.nota.toFixed(1)} × {(result.detalhes.microbiologia1.peso * 100).toFixed(0)}% = {result.detalhes.microbiologia1.contribuicao.toFixed(2)}</p>
                <p>Microbiologia 2: {result.detalhes.microbiologia2.nota.toFixed(1)} × {(result.detalhes.microbiologia2.peso * 100).toFixed(0)}% = {result.detalhes.microbiologia2.contribuicao.toFixed(2)}</p>
                <p>Patologia: {result.detalhes.patologia.nota.toFixed(1)} × {(result.detalhes.patologia.peso * 100).toFixed(0)}% = {result.detalhes.patologia.contribuicao.toFixed(2)}</p>
            </div>
            {/* Texto de "notas salvas" foi removido daqui */}
          </CardFooter>
        </Card>
      )}
    </Form>
  );
}


    