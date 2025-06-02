
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StrawberryIcon } from "@/components/icons/StrawberryIcon";
import { ArrowRight, Calculator } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage() {
  const calculator = {
    title: "Calculadora Moranguinho",
    description: "Acesse suas calculadoras temáticas!",
    icon: StrawberryIcon,
    imageSrc: "https://placehold.co/600x300/E95E8E/FFF0F5.png", // Placeholder for the new image
    imageAlt: "Calculadora Moranguinho",
    imageAiHint: "strawberry calculator",
    buttons: [
      {
        label: "Calculadora 1",
        href: "/calculator1",
      },
      {
        label: "Calculadora 2",
        href: "/calculator2",
      }
    ]
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold font-headline text-primary mb-4 animate-fade-in-down">
          Bem-vindo(a) ao Painel Doce!
        </h1>
        <p className="text-xl text-muted-foreground animate-fade-in-up">
          Sua central de cálculos temáticos.
        </p>
      </div>

      <div className="flex justify-center">
        <Card 
          className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden border-2 border-primary/10 animate-slide-in w-full max-w-lg"
        >
          <CardHeader className="bg-gradient-to-br from-primary/10 to-background p-0">
            <Image
              src={calculator.imageSrc}
              alt={calculator.imageAlt}
              width={600}
              height={300}
              className="w-full h-48 object-cover"
              data-ai-hint={calculator.imageAiHint}
              priority
            />
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center mb-3">
              <calculator.icon className="h-10 w-10 text-primary mr-4" />
              <CardTitle className="text-2xl font-headline text-primary/90">{calculator.title}</CardTitle>
            </div>
            <CardDescription className="text-foreground/80 mb-6 min-h-[40px]">{calculator.description}</CardDescription>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {calculator.buttons.map(button => (
                <Button key={button.label} asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground transition-transform hover:scale-105">
                  <Link href={button.href}>
                    {button.label} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
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
        .animate-slide-in { animation: slide-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
}
