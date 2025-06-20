import React from 'react';

const StrawberryIcon: React.FC<{ size?: number }> = ({ size = 100 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="100" rx="20" fill="#FADADD" />
      <path
        d="M50 15C45 10 40 12 38 18C35 15 30 15 28 20C26 25 28 30 32 34C36 38 44 40 50 35C56 40 64 38 68 34C72 30 74 25 72 20C70 15 65 15 62 18C60 12 55 10 50 15Z"
        fill="#76A36F"
        stroke="#4E4E4E"
        strokeWidth="2"
      />
      <path
        d="M50 30C40 30 25 45 35 65C45 85 55 85 65 65C75 45 60 30 50 30Z"
        fill="#F48FB1"
        stroke="#4E4E4E"
        strokeWidth="2"
      />
      {[...Array(7)].map((_, i) => (
        <ellipse
          key={i}
          cx={35 + (i % 3) * 10}
          cy={45 + Math.floor(i / 3) * 10}
          rx="2"
          ry="4"
          fill="#FFFFFF"
        />
      ))}
    </svg>
  );
};

export default StrawberryIcon;
