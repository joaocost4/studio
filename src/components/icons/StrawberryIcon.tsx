
import React from 'react';

const StrawberryIcon: React.FC<{ className?: string, size?: number, width?: number, height?: number }> = ({ className, size, width, height }) => {
  const iconSize = size || 50; // Default size if only 'size' is provided
  const iconWidth = width || iconSize;
  const iconHeight = height || iconSize;

  return (
    <svg
      width={iconWidth}
      height={iconHeight}
      viewBox="0 0 64 64" // Adjusted viewBox for better detail
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Strawberry Icon"
    >
      {/* Strawberry Body */}
      <path
        d="M32 60C18 60 10 48 10 36C10 24 20 10 32 10C44 10 54 24 54 36C54 48 46 60 32 60Z"
        fill="#E30B5D" // Raspberry Pink (Primary Theme Color)
      />
      {/* Seeds - subtle dots */}
      <circle cx="26" cy="30" r="1.5" fill="#FAD2E1" fillOpacity="0.7" />
      <circle cx="38" cy="30" r="1.5" fill="#FAD2E1" fillOpacity="0.7" />
      <circle cx="22" cy="38" r="1.5" fill="#FAD2E1" fillOpacity="0.7" />
      <circle cx="32" cy="38" r="1.5" fill="#FAD2E1" fillOpacity="0.7" />
      <circle cx="42" cy="38" r="1.5" fill="#FAD2E1" fillOpacity="0.7" />
      <circle cx="28" cy="46" r="1.5" fill="#FAD2E1" fillOpacity="0.7" />
      <circle cx="36" cy="46" r="1.5" fill="#FAD2E1" fillOpacity="0.7" />
      <circle cx="32" cy="25" r="1.5" fill="#FAD2E1" fillOpacity="0.7" />
       <circle cx="29" cy="52" r="1.5" fill="#FAD2E1" fillOpacity="0.7" />
      <circle cx="35" cy="52" r="1.5" fill="#FAD2E1" fillOpacity="0.7" />


      {/* Leaves (Sepals) */}
      <path
        d="M32 4C28 10 22 12 20 18C20 18 32 16 32 4Z"
        fill="#D0FF14" // Lime Green (Accent Theme Color)
      />
      <path
        d="M32 4C36 10 42 12 44 18C44 18 32 16 32 4Z"
        fill="#D0FF14" // Lime Green
      />
      <path
        d="M24 12C20 18 22 22 28 22C28 22 24 18 24 12Z"
        fill="#D0FF14" // Lime Green
      />
      <path
        d="M40 12C44 18 42 22 36 22C36 22 40 18 40 12Z"
        fill="#D0FF14" // Lime Green
      />
       {/* Stem */}
      <rect x="30.5" y="0" width="3" height="6" fill="#A07855" rx="1"/>
    </svg>
  );
};

export default StrawberryIcon;
