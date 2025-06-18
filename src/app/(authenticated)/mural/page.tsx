
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Construction } from "lucide-react";
import Link from "next/link";

export default function MuralPage() {
  return (
    <div className="container mx-auto py-8 px-4 flex flex-col items-center">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="text-center">
          <ClipboardList className="h-16 w-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold font-headline text-primary">Mural da Turma</CardTitle>
          <CardDescription className="text-muted-foreground">
            Um espaço para compartilhar avisos, materiais e interagir.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <Construction className="h-24 w-24 text-accent mx-auto animate-pulse" />
          <p className="text-xl text-foreground">
            Esta página está em construção!
          </p>
          <p className="text-muted-foreground">
            Em breve, você poderá postar mensagens, imagens e interagir com sua turma aqui.
            Representantes poderão moderar o conteúdo de suas turmas, e administradores terão moderação completa.
          </p>
          <Button asChild>
            <Link href="/dashboard">Voltar ao Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
       <style jsx>{`
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }
      `}</style>
    </div>
  );
}
