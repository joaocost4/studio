
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Cookie, Clock, Users, ListChecks } from "lucide-react";

interface Recipe {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imageAiHint: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: string;
  tags?: string[];
}

const recipes: Recipe[] = [
  {
    id: "1",
    title: "Torta de Morango Clássica da Moranguinho",
    description: "A torta de morango mais famosa e deliciosa, direto da cozinha da Moranguinho!",
    imageSrc: "https://placehold.co/600x400/FFC0CB/E30B5D.png",
    imageAlt: "Torta de Morango Clássica",
    imageAiHint: "strawberry pie",
    ingredients: [
      "1 pacote de massa folhada",
      "500g de morangos frescos",
      "1 xícara de açúcar",
      "1/2 xícara de água",
      "2 colheres de sopa de amido de milho",
      "Suco de 1/2 limão",
      "Chantilly para decorar (opcional)"
    ],
    instructions: [
      "Lave e corte os morangos.",
      "Em uma panela, misture os morangos, açúcar, água, amido de milho e suco de limão.",
      "Cozinhe em fogo médio até engrossar.",
      "Deixe esfriar.",
      "Asse a massa folhada conforme as instruções da embalagem.",
      "Recheie a massa assada com o creme de morango.",
      "Decore com chantilly e morangos frescos, se desejar."
    ],
    prepTime: "30 min",
    cookTime: "40 min",
    servings: "8 porções",
    tags: ["Sobremesa", "Torta", "Morango"]
  },
  {
    id: "2",
    title: "Cupcakes Fofinhos da Laranjinha",
    description: "Cupcakes com um toque cítrico especial da Laranjinha, perfeitos para qualquer festa.",
    imageSrc: "https://placehold.co/600x400/FFA500/FFF5E1.png",
    imageAlt: "Cupcakes de Laranja",
    imageAiHint: "orange cupcakes",
    ingredients: [
      "1 e 1/2 xícara de farinha de trigo",
      "1 xícara de açúcar",
      "1/2 colher de chá de sal",
      "1 colher de chá de fermento em pó",
      "1/2 xícara de manteiga sem sal, amolecida",
      "2 ovos grandes",
      "1/2 xícara de suco de laranja natural",
      "Raspas de 1 laranja",
      "Para a cobertura: 1 xícara de açúcar de confeiteiro, 2 colheres de sopa de suco de laranja"
    ],
    instructions: [
      "Preaqueça o forno a 180°C e prepare as forminhas de cupcake.",
      "Em uma tigela grande, misture a farinha, o açúcar, o sal e o fermento.",
      "Adicione a manteiga e bata em velocidade baixa até obter uma farofa.",
      "Em outra tigela, bata os ovos levemente. Adicione o suco de laranja e as raspas.",
      "Despeje os líquidos sobre os ingredientes secos e misture até incorporar.",
      "Divida a massa nas forminhas e asse por 18-20 minutos.",
      "Para a cobertura, misture o açúcar de confeiteiro com o suco de laranja até ficar homogêneo e cubra os cupcakes frios."
    ],
    prepTime: "20 min",
    cookTime: "20 min",
    servings: "12 cupcakes",
    tags: ["Cupcake", "Laranja", "Festa"]
  },
  {
    id: "3",
    title: "Biscoitinhos Amanteigados da Gotinha de Limão",
    description: "Biscoitos crocantes e amanteigados com um delicioso sabor de limão.",
    imageSrc: "https://placehold.co/600x400/DFFF00/F0FFF0.png",
    imageAlt: "Biscoitos de Limão",
    imageAiHint: "lemon cookies",
    ingredients: [
        "200g de manteiga sem sal, em temperatura ambiente",
        "1 xícara de açúcar de confeiteiro",
        "1 ovo",
        "Raspas de 2 limões sicilianos",
        "2 colheres de sopa de suco de limão siciliano",
        "2 e 1/2 xícaras de farinha de trigo",
        "1/2 colher de chá de fermento em pó",
        "Uma pitada de sal"
    ],
    instructions: [
        "Bata a manteiga com o açúcar de confeiteiro até obter um creme claro e fofo.",
        "Adicione o ovo, as raspas e o suco de limão, e bata bem.",
        "Peneire a farinha, o fermento e o sal sobre a mistura e incorpore delicadamente até formar uma massa homogênea.",
        "Divida a massa em duas porções, forme discos, embrulhe em filme plástico e leve à geladeira por pelo menos 1 hora.",
        "Preaqueça o forno a 180°C. Abra a massa em uma superfície enfarinhada e corte os biscoitos.",
        "Asse por 10-12 minutos ou até as bordas dourarem levemente. Deixe esfriar completamente."
    ],
    prepTime: "25 min (+1h de geladeira)",
    cookTime: "12 min",
    servings: "Aprox. 30 biscoitos",
    tags: ["Biscoito", "Limão", "Amanteigado"]
  }
];

export default function RecipesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-12 text-center">
        <Cookie className="h-20 w-20 text-primary mx-auto mb-6 animate-bounce" />
        <h1 className="text-5xl font-bold font-headline text-primary mb-4">
          Receitas Doces da Moranguinho
        </h1>
        <p className="text-xl text-muted-foreground">
          Delícias diretamente da cozinha da turma para você!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {recipes.map((recipe) => (
          <Card key={recipe.id} className="shadow-lg hover:shadow-2xl transition-shadow duration-300 rounded-xl border-primary/20 flex flex-col overflow-hidden">
            <div className="relative w-full h-56">
              <Image
                src={recipe.imageSrc}
                alt={recipe.imageAlt}
                layout="fill"
                objectFit="cover"
                data-ai-hint={recipe.imageAiHint}
              />
            </div>
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-primary/90">{recipe.title}</CardTitle>
              <CardDescription className="text-foreground/80 min-h-[40px]">{recipe.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <div className="flex flex-wrap gap-2">
                {recipe.tags?.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                {recipe.prepTime && <div className="flex items-center"><Clock size={16} className="mr-1.5 text-primary/70" /> {recipe.prepTime}</div>}
                {recipe.cookTime && <div className="flex items-center"><Clock size={16} className="mr-1.5 text-primary/70" /> {recipe.cookTime}</div>}
                {recipe.servings && <div className="flex items-center"><Users size={16} className="mr-1.5 text-primary/70" /> {recipe.servings}</div>}
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="ingredients">
                  <AccordionTrigger className="text-lg font-semibold text-primary/80 hover:text-primary">
                    <ListChecks size={20} className="mr-2" /> Ingredientes
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc list-inside space-y-1 pl-2 text-foreground/90">
                      {recipe.ingredients.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="instructions">
                  <AccordionTrigger className="text-lg font-semibold text-primary/80 hover:text-primary">
                    <ListChecks size={20} className="mr-2" /> Modo de Preparo
                  </AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal list-inside space-y-2 pl-2 text-foreground/90">
                      {recipe.instructions.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
             <CardFooter className="bg-primary/5 p-4 mt-auto">
                <p className="text-xs text-muted-foreground">Prepare com amor e carinho! 🍓</p>
            </CardFooter>
          </Card>
        ))}
      </div>
      <style jsx global>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(-10%);
            animation-timing-function: cubic-bezier(0.8,0,1,1);
          }
          50% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0,0,0.2,1);
          }
        }
        .animate-bounce {
          animation: bounce 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
