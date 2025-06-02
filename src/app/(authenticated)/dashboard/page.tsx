import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StrawberryIcon } from "@/components/icons/StrawberryIcon";
import { Apple, ArrowRight, Calculator } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage() {
  const calculators = [
    {
      title: "Calculadora Moranguinho",
      description: "Cálculos doces e divertidos com a Moranguinho!",
      href: "/calculator1",
      icon: StrawberryIcon,
      imageHint: "strawberry field"
    },
    {
      title: "Calculadora Docinha",
      description: "Mais doçuras e cálculos com um toque especial!",
      href: "/calculator2",
      icon: Apple,
      imageHint: "apple orchard"
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold font-headline text-primary mb-4 animate-fade-in-down">
          Bem-vindo(a) ao Painel Doce!
        </h1>
        <p className="text-xl text-muted-foreground animate-fade-in-up">
          Escolha uma calculadora para começar suas aventuras matemáticas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {calculators.map((calc, index) => (
          <Card 
            key={calc.title} 
            className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden border-2 border-primary/10 animate-slide-in"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <CardHeader className="bg-gradient-to-br from-primary/10 to-background p-0">
              <Image
                src={`https://placehold.co/600x300/${'FAD2E1'.substring(1)}/${'E30B5D'.substring(1)}.png`} // Using theme colors for placeholder
                alt={calc.title}
                width={600}
                height={300}
                className="w-full h-48 object-cover"
                data-ai-hint={calc.imageHint}
              />
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center mb-3">
                <calc.icon className="h-10 w-10 text-primary mr-4" />
                <CardTitle className="text-2xl font-headline text-primary/90">{calc.title}</CardTitle>
              </div>
              <CardDescription className="text-foreground/80 mb-6 min-h-[40px]">{calc.description}</CardDescription>
              <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground transition-transform hover:scale-105">
                <Link href={calc.href}>
                  Acessar Calculadora <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
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
        .animate-slide-in { animation: slide-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
}
