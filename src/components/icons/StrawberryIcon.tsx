import type { SVGProps } from 'react';

export function StrawberryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2c-3.5 0-6.5 2-8 5.5S2.5 14.5 6 18c3.5 3.5 8 2.5 10-1s1-6.5-2.5-10C11.5 3.5 12 2 12 2z" />
      <path d="M12 2c1.5 0 2.5 1 3 2.5" />
      <path d="M14.5 3.5c-.5.5-.5 1.5.5 2" />
      <path d="M17 6.5c0 .5.5 1 1 .5" />
      <path d="M16 10.5c.5 0 .5-.5.5-1" />
      <path d="M12.5 13.5c0 .5-.5.5-1 0" />
      <path d="M10 15.5c0 .5-.5 1-1 .5" />
    </svg>
  );
}
