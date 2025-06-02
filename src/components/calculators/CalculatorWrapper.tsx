"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

interface CalculatorWrapperProps {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  imageAiHint?: string;
}

export function CalculatorWrapper({
  title,
  description,
  icon: Icon,
  children,
  imageSrc = "https://placehold.co/800x300/FAD2E1/E30B5D.png", // Default themed placeholder
  imageAlt = "Thematic background",
  imageAiHint = "themed background"
}: CalculatorWrapperProps) {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="shadow-xl rounded-xl overflow-hidden border-2 border-primary/20">
        <CardHeader className="p-0 relative">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={800}
            height={300}
            className="w-full h-48 md:h-64 object-cover"
            data-ai-hint={imageAiHint}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <div className="flex items-center mb-2">
              <Icon className="h-12 w-12 text-white mr-3 p-2 bg-primary/70 rounded-full" />
              <CardTitle className="text-4xl font-headline text-white drop-shadow-lg">{title}</CardTitle>
            </div>
            <CardDescription className="text-gray-200 drop-shadow-sm">{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
