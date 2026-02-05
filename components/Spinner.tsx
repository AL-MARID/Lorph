import React from 'react';
import { LogoIcon } from './Logo';

interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

// 1️⃣ The Basic Spinner (appears before response)
export const Spinner: React.FC<SpinnerProps> = ({ className = "", ...props }) => (
  <svg
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    className={`animate-spin stroke-zinc-400 ${className}`}
    {...props}
  >
    <path d="M12 3v3m6.366-.366-2.12 2.12M21 12h-3m.366 6.366-2.12-2.12M12 21v-3m-6.366.366 2.12-2.12M3 12h3m-.366-6.366 2.12 2.12"></path>
  </svg>
);

// 2️⃣ LogoSpinner (Rotating Logo - Optional usage)
export const LogoSpinner = () => (
  <div className="p-4 border border-border rounded-lg bg-card inline-block">
    <div className="animate-spin">
       <LogoIcon className="h-5 w-5 text-foreground" />
    </div>
  </div>
);