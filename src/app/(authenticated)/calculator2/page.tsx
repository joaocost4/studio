
"use client"; // Add this directive

import { CalculatorWrapper } from "@/components/calculators/CalculatorWrapper";
import { Calculator2Form } from "@/components/calculators/Calculator2Form";
import { BookOpenCheck } from "lucide-react"; 

export default function Calculator2Page() {
  return (
    <CalculatorWrapper
      title="Calculadora Detalhada (M2)"
      description="Insira suas notas para calcular o desempenho no módulo e verificar os pesos de cada avaliação."
      icon={BookOpenCheck}
      imageSrc="https://placehold.co/800x300/A2D2FF/003566.png"
      imageAlt="Fundo temático para cálculo de notas do módulo"
      imageAiHint="study notes pattern"
    >
      <Calculator2Form />
    </CalculatorWrapper>
  );
}

