"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import React, { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";

// Define a Zod schema for your calculator form
const calculator2Schema = z.object({
  ingredient: z.string().min(1, "Ingrediente é obrigatório"),
  quantity: z.coerce.number().positive("Quantidade deve ser positiva"),
  unit: z.enum(["gramas", "ml", "unidades"], { required_error: "Unidade é obrigatória" }),
});

type Calculator2FormValues = z.infer<typeof calculator2Schema>;

export function Calculator2Form() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const form = useForm<Calculator2FormValues>({
    resolver: zodResolver(calculator2Schema),
    defaultValues: {
      ingredient: "",
      quantity: 1,
      unit: undefined, // Default to undefined so placeholder shows
    },
  });

  // Load last session data
  useEffect(() => {
    if (userProfile) {
      const loadData = async () => {
        setLoading(true);
        try {
          const docRef = doc(db, "calculator2Data", userProfile.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data()?.lastSession;
            if (data) {
              form.reset(data);
              toast({ title: "Sessão anterior da Calculadora Docinha carregada!" });
            }
          }
        } catch (error) {
          console.error("Error loading data for calc 2: ", error);
          toast({ title: "Erro ao carregar dados da Calc. Docinha", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [userProfile, form, toast]);

  async function onSubmit(values: Calculator2FormValues) {
    setSaving(true);
    // Placeholder calculation logic for Calculator 2
    const calculatedResult = `Ingrediente: ${values.ingredient}, Quantidade: ${values.quantity} ${values.unit}.`;
    setResult(calculatedResult);

    if (userProfile) {
      try {
        const docRef = doc(db, "calculator2Data", userProfile.uid);
        await setDoc(docRef, { 
            lastSession: values,
            updatedAt: serverTimestamp()
        }, { merge: true });
        toast({
          title: "Cálculo Docinho Salvo!",
          description: "Seu progresso na Calculadora Docinha foi salvo.",
        });
      } catch (error) {
        console.error("Error saving data for calc 2: ", error);
        toast({
          title: "Erro ao Salvar (Calc. Docinha)",
          description: "Não foi possível salvar seus dados.",
          variant: "destructive",
        });
      }
    }
    setSaving(false);
  }
  
  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Carregando delícias...</span></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="ingredient"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-primary/90 font-semibold">Ingrediente Mágico</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Chocolate Belga" {...field} className="border-primary/30 focus:border-primary" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-primary/90 font-semibold">Quantidade</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ex: 100" {...field} className="border-primary/30 focus:border-primary" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-primary/90 font-semibold">Unidade de Medida</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="border-primary/30 focus:border-primary">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="gramas">Gramas (g)</SelectItem>
                  <SelectItem value="ml">Mililitros (ml)</SelectItem>
                  <SelectItem value="unidades">Unidades</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {saving ? "Processando Magia..." : "Calcular Ingredientes"}
        </Button>
      </form>

      {result && (
        <Card className="mt-8 bg-primary/5 border-primary/20 shadow-md">
          <CardHeader>
            <CardTitle className="text-primary font-headline">Receita Pronta!</CardTitle>
            <CardDescription>Detalhes do seu ingrediente mágico:</CardDescription>
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
