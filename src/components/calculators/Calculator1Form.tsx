
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
import { Loader2, PlayCircle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

const calculator1Schema = z.object({
  mediaIBC: z.coerce.number().min(0, "Média deve ser entre 0 e 10.").max(10, "Média deve ser entre 0 e 10."),
  nota1Anatomia: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10."),
  nota1Histologia: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10."),
  nota2Anatomia: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10."),
  nota2Histologia: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10."),
  cognitiva1: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10."),
  cognitiva2: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10."),
  formativa: z.coerce.number().min(0, "Nota deve ser entre 0 e 10.").max(10, "Nota deve ser entre 0 e 10."),
});

type Calculator1FormValues = z.infer<typeof calculator1Schema>;

interface CalculationResult {
  notaFinal: number;
  aprovado: boolean;
}

export function Calculator1Form() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
        setLoading(true);
        try {
          const docRef = doc(db, "calculator1Data", userProfile.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data()?.lastSession;
            if (data) {
              form.reset(data);
              toast({ title: "Sessão anterior carregada!", description: "Suas notas da última vez foram recuperadas." });
            }
          }
        } catch (error) {
          console.error("Error loading data: ", error);
          toast({ title: "Erro ao carregar dados", description: "Não foi possível recuperar seus dados anteriores.", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [userProfile, form, toast]);

  async function onSubmit(values: Calculator1FormValues) {
    setSaving(true);

    const mediaMorfologia1 = (values.nota1Anatomia * 2/3) + (values.nota1Histologia * 1/3);
    const mediaMorfologia2 = (values.nota2Anatomia * 2/3) + (values.nota2Histologia * 1/3);
    const mediaMorfologia = (mediaMorfologia1 + mediaMorfologia2) / 2;
    const mediaSessaoTutorial = (values.cognitiva1 + values.cognitiva2) / 2;

    const notaFinal = (values.mediaIBC * 0.2) + (mediaMorfologia * 0.3) + (mediaSessaoTutorial * 0.3) + (values.formativa * 0.2);
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
          description: "Não foi possível salvar suas notas.",
          variant: "destructive",
        });
      }
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Carregando suas notas...</span></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <div>
          <h3 className="text-xl font-semibold text-primary mb-4">Média IBC</h3>
          <FormField
            control={form.control}
            name="mediaIBC"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Média IBC (0-10)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Ex: 7.5" {...field} className="border-primary/30 focus:border-primary" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator className="bg-primary/20 my-6" />

        <div>
          <h3 className="text-xl font-semibold text-primary mb-4">Morfologia</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField
              control={form.control}
              name="nota1Anatomia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota 1 de Anatomia (0-10)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 8.0" {...field} className="border-primary/30 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nota1Histologia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota 1 de Histologia (0-10)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 7.0" {...field} className="border-primary/30 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nota2Anatomia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota 2 de Anatomia (0-10)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 9.0" {...field} className="border-primary/30 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nota2Histologia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota 2 de Histologia (0-10)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 6.5" {...field} className="border-primary/30 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="bg-primary/20 my-6" />

        <div>
          <h3 className="text-xl font-semibold text-primary mb-4">Sessão Tutorial</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField
              control={form.control}
              name="cognitiva1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota Cognitiva 1 (0-10)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 8.5" {...field} className="border-primary/30 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cognitiva2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota Cognitiva 2 (0-10)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 7.8" {...field} className="border-primary/30 focus:border-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="formativa"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Nota Formativa (0-10)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="Ex: 9.2" {...field} className="border-primary/30 focus:border-primary" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6 mt-8" disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
          {saving ? "Calculando & Salvando..." : "Calcular Nota Final e Salvar"}
        </Button>
      </form>

      {result && (
        <Card className="mt-10 bg-primary/5 border-primary/20 shadow-lg rounded-xl">
          <CardHeader className="text-center">
            <CardTitle className={`text-3xl font-headline ${result.aprovado ? 'text-green-600' : 'text-red-600'}`}>
              {result.aprovado ? <CheckCircle className="inline-block mr-2 mb-1 h-8 w-8" /> : <XCircle className="inline-block mr-2 mb-1 h-8 w-8" />}
              Resultado Final
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-4xl font-bold text-foreground/90 my-4">{result.notaFinal.toFixed(2)}</p>
            {result.aprovado ? (
              <p className="text-xl text-green-600 font-semibold">Aprovada! Parabéns amiguinha! 🎉🍓</p>
            ) : (
              <p className="text-xl text-red-600 font-semibold">Reprovada. Não desanime, continue tentando! 💪</p>
            )}
          </CardContent>
           <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">Suas notas foram salvas para a próxima vez.</p>
          </CardFooter>
        </Card>
      )}
    </Form>
  );
}
