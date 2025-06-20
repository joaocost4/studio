"use client";

import React from 'react';

const StrawberryIcon: React.FC<{ className?: string, size?: number, width?: number, height?: number }> = ({ className, size, width, height }) => {
  const iconSize = size || 50; // Default size if only 'size' is provided
  const iconWidth = width || iconSize;
  const iconHeight = height || iconSize;

  return (
    <svg
      width={iconWidth}
      height={iconHeight}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Strawberry Icon"
    >
      {/* Strawberry Body */}
      <path 
        d="M32 58C18 58 8 45 8 34C8 23 18 10 32 10C46 10 56 23 56 34C56 45 46 58 32 58Z" 
        fill="#E30B5D" // Raspberry Pink - Primary Theme Color
      />
      
      {/* Seeds - using a lighter pink from the theme for a subtle look */}
      <circle cx="22" cy="30" r="1.5" fill="#FAD2E1" />
      <circle cx="32" cy="26" r="1.5" fill="#FAD2E1" />
      <circle cx="42" cy="30" r="1.5" fill="#FAD2E1" />
      <circle cx="27" cy="38" r="1.5" fill="#FAD2E1" />
      <circle cx="37" cy="38" r="1.5" fill="#FAD2E1" />
      <circle cx="22" cy="46" r="1.5" fill="#FAD2E1" />
      <circle cx="32" cy="44" r="1.5" fill="#FAD2E1" />
      <circle cx="42" cy="46" r="1.5" fill="#FAD2E1" />
      <circle cx="27" cy="52" r="1.5" fill="#FAD2E1" />
      <circle cx="37" cy="52" r="1.5" fill="#FAD2E1" />
      
      {/* Leaves (Sepals) - using the accent green */}
      <path 
        d="M32 10C28 14 24 16 20 20L32 15L44 20C40 16 36 14 32 10Z" 
        fill="#D0FF14" // Lime Green - Accent Theme Color
      />
      <path 
        d="M32 10L30 2C32 2 34 2 32 10Z" // Stem
        fill="#D0FF14"
      />
    </svg>
  );
};

export default StrawberryIcon;