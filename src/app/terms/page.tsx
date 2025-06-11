
"use client"; // Added "use client" directive

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react"; // Imported useState and useEffect

export default function TermsPage() {
  const [lastUpdated, setLastUpdated] = useState(""); // State for the date

  useEffect(() => {
    // Set the date string only on the client side after mount
    setLastUpdated(new Date().toLocaleDateString('pt-BR'));
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-2xl shadow-xl border-2 border-primary/20 rounded-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary">Termos de Serviço</CardTitle>
          <CardDescription className="text-muted-foreground">
            Leia atentamente nossos termos e condições antes de usar a Calculadora da Moranguinho.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <section>
            <h2 className="text-xl font-semibold text-primary/90 mb-2">1. Aceitação dos Termos</h2>
            <p className="text-foreground/80">
              Ao acessar ou usar o aplicativo Calculadora da Moranguinho ("Serviço"), você concorda em cumprir estes Termos de Serviço.
              Se você não concordar com qualquer parte dos termos, não poderá acessar o Serviço.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-primary/90 mb-2">2. Contas</h2>
            <p className="text-foreground/80">
              Ao criar uma conta conosco, você deve nos fornecer informações precisas, completas e atuais em todos os momentos.
              Deixar de fazê-lo constitui uma violação dos Termos, o que pode resultar na rescisão imediata de sua conta em nosso Serviço.
              Você é responsável por proteger a senha que usa para acessar o Serviço e por quaisquer atividades ou ações sob sua senha.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-primary/90 mb-2">3. Uso do Serviço</h2>
            <p className="text-foreground/80">
              A Calculadora da Moranguinho fornece calculadoras para fins educacionais e de referência. Os resultados fornecidos pelas calculadoras
              são baseados nas informações inseridas pelo usuário e nas fórmulas programadas. Não nos responsabilizamos por
              decisões tomadas com base nos resultados das calculadoras.
            </p>
          </section>
           <section>
            <h2 className="text-xl font-semibold text-primary/90 mb-2">4. Propriedade Intelectual</h2>
            <p className="text-foreground/80">
              O Serviço e seu conteúdo original (excluindo conteúdo fornecido pelos usuários), recursos e funcionalidades são e permanecerão
              propriedade exclusiva da Calculadora da Moranguinho e de seus licenciadores. O tema "Moranguinho" é usado como inspiração lúdica e
              não implica afiliação ou endosso pelos detentores dos direitos autorais originais da personagem.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-primary/90 mb-2">5. Rescisão</h2>
            <p className="text-foreground/80">
              Podemos rescindir ou suspender sua conta imediatamente, sem aviso prévio ou responsabilidade, por qualquer motivo,
              incluindo, sem limitação, se você violar os Termos.
            </p>
          </section>
          <p className="text-sm text-muted-foreground pt-4">
            Última atualização: {lastUpdated || "Carregando..."} {/* Display state or loading text */}
          </p>
          <div className="pt-6 text-center">
            <Button asChild variant="outline">
              <Link href="/register">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Cadastro
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
