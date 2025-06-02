"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { FIREBASE_EMAIL_DOMAIN } from "@/lib/constants";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";

const formSchema = z.object({
  matricula: z.string().min(1, "Matrícula é obrigatória."),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres."),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      matricula: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      // Construct email from matricula
      const email = `${values.matricula}@${FIREBASE_EMAIL_DOMAIN}`;
      await signInWithEmailAndPassword(auth, email, values.password);
      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o dashboard...",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Falha no login. Verifique suas credenciais.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Matrícula ou senha inválida.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Formato de matrícula inválido.";
      }
      toast({
        title: "Erro no Login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleSkipLogin = () => {
    // This is for development convenience and does not bypass actual auth for protected resources.
    // It just navigates to the dashboard page.
    // Actual protection should be handled by a HOC or context check on the dashboard page.
    toast({
        title: "Pulando Login (Modo DEV)",
        description: "Redirecionando para o dashboard...",
      });
    router.push("/dashboard");
  };

  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="matricula"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Matrícula</FormLabel>
              <FormControl>
                <Input placeholder="Sua matrícula" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="Sua senha" {...field} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"} <LogIn size={18} className="ml-2"/>
        </Button>

        <div className="mt-4 text-center text-sm">
          Não tem uma conta?{" "}
          <Link href="/register" className="underline text-primary hover:text-primary/80">
            Registrar
          </Link>
        </div>

        {isDevMode && (
            <Button type="button" variant="outline" onClick={handleSkipLogin} className="w-full mt-2">
                Pular Login (DEV)
            </Button>
        )}
      </form>
    </Form>
  );
}
