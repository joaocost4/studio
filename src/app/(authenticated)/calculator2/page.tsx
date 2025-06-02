import { CalculatorWrapper } from "@/components/calculators/CalculatorWrapper";
import { Calculator2Form } from "@/components/calculators/Calculator2Form";
import { Apple } from "lucide-react"; // Using Apple as a placeholder "docinha" icon

export default function Calculator2Page() {
  return (
    <CalculatorWrapper
      title="Calculadora Docinha"
      description="Mais cálculos deliciosos para suas receitas e ideias!"
      icon={Apple}
      imageSrc="https://placehold.co/800x300/D0FF14/4B0024.png?text=Docinha" // Theme colors in placeholder
      imageAlt="Fundo temático da Calculadora Docinha"
      imageAiHint="candy pattern"
    >
      <Calculator2Form />
    </CalculatorWrapper>
  );
}
