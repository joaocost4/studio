import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import StrawberryIcon from "@/components/icons/StrawberryIcon"; // Corrected import
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="absolute inset-0 opacity-30">
            <Image 
                src="https://placehold.co/1200x800/FAD2E1/E30B5D.png?text=." // Subtle background pattern
                alt="Background pattern"
                layout="fill"
                objectFit="cover"
                data-ai-hint="abstract pattern"
            />
        </div>
       <Card className="w-full max-w-md shadow-xl z-10 border-2 border-primary/20 rounded-xl">
        <CardHeader className="text-center">
           <div className="mx-auto mb-4 text-primary">
            <StrawberryIcon size={60} /> {/* Assuming size prop is valid, otherwise adjust */}
          </div>
          <CardTitle className="text-3xl font-headline text-primary">Bem-vindo(a) à Calculadora da Moranguinho!</CardTitle>
          <CardDescription className="text-muted-foreground">Faça login para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
       <footer className="mt-8 text-center text-sm text-muted-foreground z-10">
        <p>&copy; {new Date().getFullYear()} Calculadora da Moranguinho. Todos os direitos reservados.</p>
        <p className="mt-1">Tema Moranguinho com <span className="text-primary">♥</span></p>
      </footer>
    </div>
  );
}
