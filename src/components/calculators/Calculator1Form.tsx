"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import React, { useEffect, useState } from "react";
import { Loader2, PlayCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";

// Define a Zod schema for your calculator form
const calculator1Schema = z.object({
  field1: z.string().min(1, "Campo obrigatório"),
  field2: z.coerce.number().min(0, "Deve ser um número positivo"),
  notes: z.string().optional(),
});

type Calculator1FormValues = z.infer<typeof calculator1Schema>;

export function Calculator1Form() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const form = useForm<Calculator1FormValues>({
    resolver: zodResolver(calculator1Schema),
    defaultValues: {
      field1: "",
      field2: 0,
      notes: "",
    },
  });

  // Load last session data
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
              toast({ title: "Sessão anterior carregada!" });
            }
          }
        } catch (error) {
          console.error("Error loading data: ", error);
          toast({ title: "Erro ao carregar dados", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [userProfile, form, toast]);

  async function onSubmit(values: Calculator1FormValues) {
    setSaving(true);
    // Placeholder calculation logic
    const calculatedResult = `Resultado para '${values.field1}' e '${values.field2}'. Detalhes: ${values.notes || "N/A"}`;
    setResult(calculatedResult);

    if (userProfile) {
      try {
        const docRef = doc(db, "calculator1Data", userProfile.uid);
        await setDoc(docRef, { 
          lastSession: values,
          history: [], // Placeholder for history array, implement if needed
          updatedAt: serverTimestamp() 
        }, { merge: true });
        toast({
          title: "Cálculo Salvo!",
          description: "Seu progresso foi salvo com sucesso.",
        });
      } catch (error) {
        console.error("Error saving data: ", error);
        toast({
          title: "Erro ao Salvar",
          description: "Não foi possível salvar seus dados.",
          variant: "destructive",
        });
      }
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Carregando dados...</span></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="field1"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-primary/90 font-semibold">Nome do Item Doce</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Bolo de Morango" {...field} className="border-primary/30 focus:border-primary" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="field2"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-primary/90 font-semibold">Quantidade de Doçura (0-100)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ex: 75" {...field} className="border-primary/30 focus:border-primary" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-primary/90 font-semibold">Anotações Especiais</FormLabel>
              <FormControl>
                <Textarea placeholder="Ex: Adicionar granulado extra!" {...field} className="border-primary/30 focus:border-primary" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
          {saving ? "Calculando & Salvando..." : "Calcular e Salvar"}
        </Button>
      </form>

      {result && (
        <Card className="mt-8 bg-primary/5 border-primary/20 shadow-md">
          <CardHeader>
            <CardTitle className="text-primary font-headline">Resultado Doce!</CardTitle>
            <CardDescription>Seu cálculo especial está pronto:</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-foreground/90 p-4 bg-background rounded-md shadow-inner">{result}</p>
          </CardContent>
           <CardFooter>
            <p className="text-sm text-muted-foreground">Os dados foram salvos automaticamente.</p>
          </CardFooter>
        </Card>
      )}
    </Form>
  );
}
