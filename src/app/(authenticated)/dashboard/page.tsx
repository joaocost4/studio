
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StrawberryIcon } from "@/components/icons/StrawberryIcon";
import { ArrowRight, Lightbulb, GraduationCap, ClipboardList, Megaphone, Info } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { USER_ROLES } from "@/lib/constants";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { userProfile, activeAnnouncements, loadingSessionData } = useAuth();

  const regularCards = [
    {
      id: "my-grades",
      title: "Minhas Notas",
      description: "Acompanhe seu desempenho e visualize suas notas lançadas nas disciplinas.",
      icon: GraduationCap,
      imageSrc: "https://placehold.co/600x300/FFDAB9/8B4513.png",
      imageAlt: "Livro de notas e caneta",
      imageAiHint: "grades report",
      links: [{ label: "Ver Minhas Notas", href: "/my-grades" }]
    },
    {
      id: "calculators",
      title: "Calculadora Moranguinho",
      description: "Acesse suas calculadoras temáticas!",
      icon: StrawberryIcon,
      imageSrc: "https://placehold.co/600x300/E95E8E/FFF0F5.png",
      imageAlt: "Calculadora Moranguinho",
      imageAiHint: "strawberry calculator",
      links: [
        { label: "Calculadora 1", href: "/calculator1" },
        { label: "Calculadora 2", href: "/calculator2" }
      ]
    },
    {
      id: "how-ai-works",
      title: "Entendendo a IA",
      description: "Descubra como a Inteligência Artificial (Genkit) é utilizada neste projeto.",
      icon: Lightbulb,
      imageSrc: "https://placehold.co/600x300/A2D2FF/FFF8DC.png",
      imageAlt: "Ilustração sobre Inteligência Artificial",
      imageAiHint: "artificial intelligence brain",
      links: [{ label: "Saiba Mais sobre a IA", href: "/how-ai-works" }],
      roles: [USER_ROLES.USER] 
    },
    {
      id: "mural",
      title: "Mural da Turma",
      description: "Compartilhe avisos, materiais e interaja com seus colegas. (Em Breve!)",
      icon: ClipboardList,
      imageSrc: "https://placehold.co/600x300/D8BFD8/4B0082.png",
      imageAlt: "Mural de avisos com notas adesivas",
      imageAiHint: "bulletin board",
      links: [{ label: "Acessar Mural", href: "/mural" }]
    }
  ];

  const filteredRegularCards = regularCards.filter(card => {
    if (!card.roles) return true;
    if (!userProfile) return false;
    return card.roles.includes(userProfile.role);
  });

  const announcementsToDisplay = activeAnnouncements?.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold font-headline text-primary mb-4 animate-fade-in-down">
          Bem-vindo(a) ao Painel Doce!
        </h1>
        <p className="text-xl text-muted-foreground animate-fade-in-up">
          Sua central de cálculos, informações e comunicados.
        </p>
      </div>

      {loadingSessionData && !announcementsToDisplay?.length && (
        <Card className="mb-8 shadow-lg rounded-xl border-2 border-primary/10 animate-slide-in">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-primary/90 flex items-center">
              <Loader2 className="mr-3 h-8 w-8 animate-spin text-primary" />
              Carregando Comunicados...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Buscando os últimos avisos para você...</p>
          </CardContent>
        </Card>
      )}

      {!loadingSessionData && announcementsToDisplay && announcementsToDisplay.length > 0 && (
        <Card className="mb-8 shadow-xl rounded-xl border-2 border-accent/30 bg-accent/5 animate-slide-in-strong">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-accent-foreground flex items-center">
              <Megaphone className="mr-3 h-10 w-10 text-accent" />
              Comunicados Importantes
            </CardTitle>
            <CardDescription className="text-accent-foreground/80">
              Fique por dentro das últimas novidades e avisos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[400px] pr-3">
              <Accordion type="single" collapsible defaultValue={announcementsToDisplay[0]?.id} className="w-full">
                {announcementsToDisplay.map((ann) => (
                  <AccordionItem value={ann.id} key={ann.id} className="border-b-accent/20">
                    <AccordionTrigger className="text-lg hover:no-underline">
                      <div className="flex flex-col items-start text-left flex-grow">
                        <span className="font-semibold text-foreground">{ann.title}</span>
                        <Badge variant="outline" className="mt-1 text-xs border-accent text-accent-foreground/80">
                          Para: {ann.targetTurmaName || "Turma Desconhecida"}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-md text-foreground/90 whitespace-pre-wrap pt-2 pb-4">
                      {ann.message}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
      
      {!loadingSessionData && announcementsToDisplay && announcementsToDisplay.length === 0 && (
         <Card className="mb-8 shadow-lg rounded-xl border-2 border-primary/10 animate-slide-in">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-primary/90 flex items-center">
              <Info className="mr-3 h-8 w-8 text-primary" />
              Sem Comunicados Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Não há nenhum comunicado novo para você no momento.</p>
          </CardContent>
        </Card>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {filteredRegularCards.map((cardItem) => (
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
                  priority={cardItem.id === "my-grades" || cardItem.id === "calculators"}
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
        @keyframes fade-in-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-in { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slide-in-strong { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-fade-in-down { animation: fade-in-down 0.5s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out 0.2s forwards; }
        .animate-slide-in { animation: slide-in 0.5s ease-out 0.3s forwards; animation-delay: 0.4s; }
        .animate-slide-in-strong { animation: slide-in-strong 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
}
