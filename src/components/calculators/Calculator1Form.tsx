
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

const calculator1Schema = z.object({
  mediaIBC: z.coerce.number().min(0, "Média deve ser entre 0 e 10.").max(10, "Média deve ser entre 0 e 10.").optional().or(z.literal("").transform(() => undefined)),
  nota1Anatomia: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10.").optional().or(z.literal("").transform(() => undefined)),
  nota1Histologia: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10.").optional().or(z.literal("").transform(() => undefined)),
  nota2Anatomia: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10.").optional().or(z.literal("").transform(() => undefined)),
  nota2Histologia: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10.").optional().or(z.literal("").transform(() => undefined)),
  cognitiva1: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10.").optional().or(z.literal("").transform(() => undefined)),
  cognitiva2: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10.").optional().or(z.literal("").transform(() => undefined)),
  formativa: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10.").optional().or(z.literal("").transform(() => undefined)),
});

type Calculator1FormValues = z.infer<typeof calculator1Schema>;

interface CalculationResult {
  notaFinal: number;
  aprovado: boolean;
}

export function Calculator1Form() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [loadingData, setLoadingData] = useState(true); // For initial data load
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const form = useForm<Calculator1FormValues>({
    resolver: zodResolver(calculator1Schema),
    defaultValues: {
      mediaIBC: undefined,
      nota1Anatomia: undefined,
      nota1Histologia: undefined,
      nota2Anatomia: undefined,
      nota2Histologia: undefined,
      cognitiva1: undefined,
      cognitiva2: undefined,
      formativa: undefined,
    },
  });

  useEffect(() => {
    if (userProfile) {
      const loadData = async () => {
        setLoadingData(true);
        try {
          const docRef = doc(db, "calculator1Data", userProfile.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data()?.lastSession;
            if (data) {
              // Ensure all fields are numbers or reset if not
              const sanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
                acc[key as keyof Calculator1FormValues] = typeof value === 'number' ? value : undefined;
                return acc;
              }, {} as Calculator1FormValues);
              form.reset(sanitizedData);
              toast({ title: "Sessão anterior carregada!", description: "Suas notas da última vez foram recuperadas." });
            }
          }
        } catch (error) {
          console.error("Error loading data: ", error);
          toast({ title: "Erro ao carregar dados", description: "Não foi possível recuperar seus dados anteriores.", variant: "destructive" });
        } finally {
          setLoadingData(false);
        }
      };
      loadData();
    } else {
      setLoadingData(false); // No user, no data to load
    }
  }, [userProfile, form, toast]);

  const handleClearField = (fieldName: keyof Calculator1FormValues) => {
    form.setValue(fieldName, undefined);
  };
  
  const handleClearAll = () => {
    form.reset({
        mediaIBC: undefined,
        nota1Anatomia: undefined,
        nota1Histologia: undefined,
        nota2Anatomia: undefined,
        nota2Histologia: undefined,
        cognitiva1: undefined,
        cognitiva2: undefined,
        formativa: undefined,
    });
    setResult(null);
    toast({ title: "Campos Limpos", description: "Todas as notas foram apagadas." });
  };


  async function onSubmit(values: Calculator1FormValues) {
    setCalculating(true);
    setResult(null); // Clear previous result

    const {
        mediaIBC = 0,
        nota1Anatomia = 0, nota1Histologia = 0,
        nota2Anatomia = 0, nota2Histologia = 0,
        cognitiva1 = 0, cognitiva2 = 0,
        formativa = 0
    } = values;

    // Validate all required fields are present for calculation
    if (
        values.mediaIBC === undefined ||
        values.nota1Anatomia === undefined || values.nota1Histologia === undefined ||
        values.nota2Anatomia === undefined || values.nota2Histologia === undefined ||
        values.cognitiva1 === undefined || values.cognitiva2 === undefined ||
        values.formativa === undefined
    ) {
        toast({
            title: "Campos Incompletos",
            description: "Por favor, preencha todas as notas para calcular.",
            variant: "destructive",
        });
        setCalculating(false);
        return;
    }

    const mediaMorfologia1 = (nota1Anatomia * 2/3) + (nota1Histologia * 1/3);
    const mediaMorfologia2 = (nota2Anatomia * 2/3) + (nota2Histologia * 1/3);
    const mediaMorfologia = (mediaMorfologia1 + mediaMorfologia2) / 2;
    const mediaSessaoTutorial = (cognitiva1 + cognitiva2) / 2;

    const notaFinal = (mediaIBC * 0.2) + (mediaMorfologia * 0.3) + (mediaSessaoTutorial * 0.3) + (formativa * 0.2);
    const aprovado = notaFinal >= 6;

    setResult({ notaFinal, aprovado });

    if (aprovado) {
        toast({
            title: "Parabéns Amiguinha!",
            description: `Você foi aprovada com nota ${notaFinal.toFixed(2)}!`,
        });
    } else {
        toast({
            title: "Quase lá!",
            description: `Sua nota foi ${notaFinal.toFixed(2)}. Continue se esforçando!`,
            variant: "destructive",
        });
    }

    if (userProfile) {
      try {
        const docRef = doc(db, "calculator1Data", userProfile.uid);
        await setDoc(docRef, { 
          lastSession: values,
          matricula: userProfile.matricula,
          updatedAt: serverTimestamp() 
        }, { merge: true });
        toast({
          title: "Notas Salvas!",
          description: "Suas notas foram salvas com sucesso.",
        });
      } catch (error) {
        console.error("Error saving data: ", error);
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

  const renderFormField = (name: keyof Calculator1FormValues, label: string, placeholder: string) => (
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
                onChange={e => field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
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
          <h3 className="text-xl font-headline text-primary mb-4">Média IBC</h3>
          {renderFormField("mediaIBC", "Média IBC (0-10)", "Ex: 7.5")}
        </div>

        <Separator className="bg-primary/20 my-6" />

        <div>
          <h3 className="text-xl font-headline text-primary mb-4">Morfologia</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {renderFormField("nota1Anatomia", "Nota 1 de Anatomia (0-10)", "Ex: 8.0")}
            {renderFormField("nota1Histologia", "Nota 1 de Histologia (0-10)", "Ex: 7.0")}
            {renderFormField("nota2Anatomia", "Nota 2 de Anatomia (0-10)", "Ex: 9.0")}
            {renderFormField("nota2Histologia", "Nota 2 de Histologia (0-10)", "Ex: 6.5")}
          </div>
        </div>

        <Separator className="bg-primary/20 my-6" />

        <div>
          <h3 className="text-xl font-headline text-primary mb-4">Sessão Tutorial</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {renderFormField("cognitiva1", "Nota Cognitiva 1 (0-10)", "Ex: 8.5")}
            {renderFormField("cognitiva2", "Nota Cognitiva 2 (0-10)", "Ex: 7.8")}
          </div>
          <div className="mt-4">
            {renderFormField("formativa", "Nota Formativa (0-10)", "Ex: 9.2")}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button type="submit" className="w-full sm:w-auto flex-grow bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6" disabled={calculating}>
            {calculating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
            {calculating ? "Calculando..." : "Calcular Nota Final e Salvar"}
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
              <p className="text-xl text-green-600 font-semibold">Aprovada! Parabéns amiguinha! 🎉🍓</p>
            ) : (
              <p className="text-xl text-red-600 font-semibold">Reprovada. Não desanime, continue tentando! 💪</p>
            )}
          </CardContent>
           <CardFooter className="justify-center pt-4">
            <p className="text-sm text-muted-foreground">Suas notas foram salvas para a próxima vez.</p>
          </CardFooter>
        </Card>
      )}
    </Form>
  );
}

