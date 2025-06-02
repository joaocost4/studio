"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { FIREBASE_EMAIL_DOMAIN, USER_ROLES } from "@/lib/constants";
import Link from "next/link";
import { UserPlus, Eye, EyeOff } from "lucide-react";

const formSchema = z.object({
  matricula: z.string().min(1, "Matrícula é obrigatória."),
  email: z.string().email("Email inválido."),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres."),
  confirmPassword: z.string().min(6, "Confirmação de senha deve ter no mínimo 6 caracteres."),
  terms: z.boolean().refine(val => val === true, {
    message: "Você deve aceitar os termos e condições.",
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      matricula: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      // Construct email for Firebase auth from matricula
      const firebaseAuthEmail = `${values.matricula}@${FIREBASE_EMAIL_DOMAIN}`;
      
      const userCredential = await createUserWithEmailAndPassword(auth, firebaseAuthEmail, values.password);
      const user = userCredential.user;

      // Store additional user info in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        matricula: values.matricula,
        actualEmail: values.email, // Store the real email separately
        role: USER_ROLES.USER, // Default role
        createdAt: new Date(),
      });

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Você será redirecionado para o login.",
      });
      router.push("/login");
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = "Falha no cadastro. Tente novamente.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Esta matrícula já está em uso.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Formato de matrícula inválido para o sistema.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Senha muito fraca. Tente uma senha mais forte.";
      }
      toast({
        title: "Erro no Cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="matricula"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Matrícula</FormLabel>
              <FormControl>
                <Input placeholder="Sua matrícula (será seu login)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Seu melhor email" {...field} />
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
                  <Input type={showPassword ? "text" : "password"} placeholder="Crie uma senha" {...field} />
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
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Senha</FormLabel>
              <FormControl>
                 <div className="relative">
                  <Input type={showConfirmPassword ? "text" : "password"} placeholder="Confirme sua senha" {...field} />
                   <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-card">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Li e concordo com as condições
                </FormLabel>
                <FormDescription>
                  Ao se registrar, você concorda com nossos{" "}
                  <Link href="/terms" className="underline hover:text-primary">Termos de Serviço</Link>.
                </FormDescription>
                 <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
          {loading ? "Registrando..." : "Registrar"} <UserPlus size={18} className="ml-2"/>
        </Button>

         <div className="mt-4 text-center text-sm">
          Já tem uma conta?{" "}
          <Link href="/login" className="underline text-primary hover:text-primary/80">
            Fazer Login
          </Link>
        </div>
      </form>
    </Form>
  );
}
