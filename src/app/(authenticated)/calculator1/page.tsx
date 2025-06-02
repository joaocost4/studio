import { CalculatorWrapper } from "@/components/calculators/CalculatorWrapper";
import { Calculator1Form } from "@/components/calculators/Calculator1Form";
import { StrawberryIcon } from "@/components/icons/StrawberryIcon"; // Placeholder

export default function Calculator1Page() {
  return (
    <CalculatorWrapper
      title="Calculadora Moranguinho"
      description="Insira os dados para realizar cálculos doces e divertidos!"
      icon={StrawberryIcon}
      imageSrc="https://placehold.co/800x300/E30B5D/FAD2E1.png?text=Moranguinho" // Theme colors in placeholder
      imageAlt="Fundo temático da Moranguinho"
      imageAiHint="strawberry pattern"
    >
      <Calculator1Form />
    </CalculatorWrapper>
  );
}
