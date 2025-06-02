
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
import { Loader2, Sparkles, XCircle, Eraser } from "lucide-react"; // Added XCircle
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";

const calculator2Schema = z.object({
  ingredient: z.string().min(1, "Ingrediente é obrigatório").optional().or(z.literal("").transform(() => undefined)),
  quantity: z.coerce.number().positive("Quantidade deve ser positiva").optional().or(z.literal("").transform(() => undefined)),
  unit: z.enum(["gramas", "ml", "unidades"], { required_error: "Unidade é obrigatória" }).optional(),
});

type Calculator2FormValues = z.infer<typeof calculator2Schema>;

export function Calculator2Form() {
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const form = useForm<Calculator2FormValues>({
    resolver: zodResolver(calculator2Schema),
    defaultValues: {
      ingredient: undefined,
      quantity: undefined, 
      unit: undefined,
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
              const sanitizedData: Partial<Calculator2FormValues> = {};
              if (typeof data.ingredient === 'string') sanitizedData.ingredient = data.ingredient;
              if (typeof data.quantity === 'number') sanitizedData.quantity = data.quantity;
              if (["gramas", "ml", "unidades"].includes(data.unit)) sanitizedData.unit = data.unit;
              form.reset(sanitizedData);
              toast({ title: "Sessão anterior da Calculadora Docinha carregada!" });
            }
          }
        } catch (error) {
          console.error("Error loading data for calc 2: ", error);
          toast({ title: "Erro ao carregar dados da Calc. Docinha", variant: "destructive" });
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
    if (fieldName === "quantity") {
        form.setValue(fieldName, undefined);
    } else if (fieldName === "unit") {
        form.setValue(fieldName, undefined);
    }
    else {
        form.setValue(fieldName, "");
    }
  };

  const handleClearAll = () => {
    form.reset({
        ingredient: undefined,
        quantity: undefined,
        unit: undefined,
    });
    setResult(null);
    toast({ title: "Campos Limpos", description: "Todos os dados da receita foram apagados." });
  };

  async function onSubmit(values: Calculator2FormValues) {
    setCalculating(true);
    setResult(null);

    if (!values.ingredient || values.quantity === undefined || !values.unit) {
        toast({
            title: "Campos Incompletos",
            description: "Por favor, preencha todos os campos da receita.",
            variant: "destructive",
        });
        setCalculating(false);
        return;
    }
    
    const calculatedResult = `Ingrediente: ${values.ingredient}, Quantidade: ${values.quantity} ${values.unit}.`;
    setResult(calculatedResult);

    toast({
        title: "Receita Calculada!",
        description: "Sua combinação mágica está pronta!",
    });

    if (userProfile) {
      try {
        const docRef = doc(db, "calculator2Data", userProfile.uid);
        await setDoc(docRef, { 
            lastSession: values,
            matricula: userProfile.matricula,
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
          description: "Não foi possível salvar seus dados. Verifique as regras de segurança do Firestore.",
          variant: "destructive",
        });
      }
    }
    setCalculating(false);
  }
  
  if (loadingData) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2 text-foreground">Carregando delícias...</span></div>;
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
               <div className="flex items-center gap-2">
                <FormControl>
                    <Input 
                    placeholder="Ex: Chocolate Belga" 
                    {...field} 
                    value={field.value ?? ""}
                    className="border-primary/30 focus:border-primary" 
                    />
                </FormControl>
                {field.value && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleClearField("ingredient")} className="text-muted-foreground hover:text-destructive h-8 w-8">
                        <XCircle size={18}/>
                    </Button>
                )}
              </div>
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
              <div className="flex items-center gap-2">
                <FormControl>
                    <Input 
                    type="number" 
                    placeholder="Ex: 100" 
                    {...field}
                    value={field.value ?? ""}
                    onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                    className="border-primary/30 focus:border-primary" 
                    />
                </FormControl>
                {field.value !== undefined && (
                     <Button type="button" variant="ghost" size="icon" onClick={() => handleClearField("quantity")} className="text-muted-foreground hover:text-destructive h-8 w-8">
                        <XCircle size={18} />
                    </Button>
                )}
              </div>
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
              <div className="flex items-center gap-2">
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
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
                {field.value && (
                     <Button type="button" variant="ghost" size="icon" onClick={() => handleClearField("unit")} className="text-muted-foreground hover:text-destructive h-8 w-8">
                        <XCircle size={18} />
                    </Button>
                )}
               </div>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button type="submit" className="w-full sm:w-auto flex-grow bg-accent hover:bg-accent/90 text-accent-foreground" disabled={calculating}>
            {calculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {calculating ? "Processando Magia..." : "Calcular Ingredientes"}
            </Button>
            <Button type="button" variant="outline" onClick={handleClearAll} className="w-full sm:w-auto border-destructive text-destructive hover:bg-destructive/10">
                <Eraser className="mr-2 h-5 w-5" /> Limpar Tudo
            </Button>
        </div>
      </form>

      {result && (
        <Card className="mt-8 bg-card border-primary/20 shadow-md">
          <CardHeader>
            <CardTitle className="text-primary font-headline">Receita Pronta!</CardTitle>
            <CardDescription className="text-muted-foreground">Detalhes do seu ingrediente mágico:</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-foreground/90 p-4 bg-background rounded-md shadow-inner">{result}</p>
          </CardContent>
          <CardFooter className="pt-4">
            <p className="text-sm text-muted-foreground">Os dados foram salvos automaticamente.</p>
          </CardFooter>
        </Card>
      )}
    </Form>
  );
}

