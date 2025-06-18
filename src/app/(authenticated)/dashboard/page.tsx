
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StrawberryIcon } from "@/components/icons/StrawberryIcon";
import { ArrowRight, Calculator, Lightbulb, GraduationCap, ClipboardList } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage() {
  const cards = [
    {
      id: "calculators",
      title: "Calculadora Moranguinho",
      description: "Acesse suas calculadoras temáticas!",
      icon: StrawberryIcon,
      imageSrc: "https://placehold.co/600x300/E95E8E/FFF0F5.png",
      imageAlt: "Calculadora Moranguinho",
      imageAiHint: "strawberry calculator",
      links: [
        {
          label: "Calculadora 1",
          href: "/calculator1",
        },
        {
          label: "Calculadora 2",
          href: "/calculator2",
        }
      ]
    },
    {
      id: "ai-info",
      title: "Entendendo a IA",
      description: "Descubra como a Inteligência Artificial (Genkit) é utilizada neste projeto para facilitar tarefas.",
      icon: Lightbulb,
      imageSrc: "https://placehold.co/600x300/A2D2FF/FFF8DC.png",
      imageAlt: "Ilustração sobre Inteligência Artificial",
      imageAiHint: "artificial intelligence brain",
      links: [
        {
          label: "Saiba Mais sobre a IA",
          href: "/how-ai-works",
        }
      ]
    },
    {
      id: "my-grades",
      title: "Minhas Notas",
      description: "Acompanhe seu desempenho e visualize suas notas lançadas nas disciplinas.",
      icon: GraduationCap,
      imageSrc: "https://placehold.co/600x300/FFDAB9/8B4513.png",
      imageAlt: "Livro de notas e caneta",
      imageAiHint: "grades report",
      links: [
        {
          label: "Ver Minhas Notas",
          href: "/my-grades",
        }
      ]
    },
    {
      id: "mural",
      title: "Mural da Turma",
      description: "Compartilhe avisos, materiais e interaja com seus colegas. (Em Breve!)",
      icon: ClipboardList,
      imageSrc: "https://placehold.co/600x300/D8BFD8/4B0082.png",
      imageAlt: "Mural de avisos com notas adesivas",
      imageAiHint: "bulletin board",
      links: [
        {
          label: "Acessar Mural",
          href: "/mural",
        }
      ]
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold font-headline text-primary mb-4 animate-fade-in-down">
          Bem-vindo(a) ao Painel Doce!
        </h1>
        <p className="text-xl text-muted-foreground animate-fade-in-up">
          Sua central de cálculos e informações.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {cards.map((cardItem) => (
          <Card
            key={cardItem.id}
            className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden border-2 border-primary/10 animate-slide-in flex flex-col"
          >
            <CardHeader className="p-0">
              {cardItem.imageSrc && (
                <Image
                  src={cardItem.imageSrc}
                  alt={cardItem.imageAlt}
                  width={600}
                  height={300}
                  className="w-full h-48 object-cover"
                  data-ai-hint={cardItem.imageAiHint}
                  priority={cardItem.id === "calculators"} // Prioritize first image
                />
              )}
            </CardHeader>
            <CardContent className="p-6 flex-grow flex flex-col">
              <div className="flex items-center mb-3">
                <cardItem.icon className="h-10 w-10 text-primary mr-4" />
                <CardTitle className="text-2xl font-headline text-primary/90">{cardItem.title}</CardTitle>
              </div>
              <CardDescription className="text-foreground/80 mb-6 min-h-[40px] flex-grow">{cardItem.description}</CardDescription>
              
              <div className="grid grid-cols-1 gap-4 mt-auto">
                {cardItem.links.map(link => (
                  <Button key={link.label} asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground transition-transform hover:scale-105">
                    <Link href={link.href}>
                      {link.label} <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <style jsx global>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.5s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out 0.2s forwards; }
        .animate-slide-in { animation: slide-in 0.5s ease-out 0.3s forwards; }
      `}</style>
    </div>
  );
}
