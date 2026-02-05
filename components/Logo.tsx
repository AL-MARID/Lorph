import React from 'react';

export const Logo = ({ className = "h-6" }: { className?: string }) => {
  return (
    <div className={`flex items-center select-none ${className}`}>
      <svg viewBox="0 0 400 60" className="h-full w-auto fill-current text-inherit">
        {/* L */}
        <path d="M10 10 V40 Q10 50 20 50 H55 V42 H20 Q18 42 18 40 V10 H10 Z" />
        
        {/* O */}
        <path d="M70 30 Q70 10 95 10 H115 Q140 10 140 30 V30 Q140 50 115 50 H95 Q70 50 70 30 Z M80 30 Q80 42 95 42 H115 Q130 42 130 30 V30 Q130 18 115 18 H95 Q80 18 80 30 Z" />
        
        {/* R */}
        <path d="M155 10 H185 Q205 10 205 25 Q205 35 190 38 L208 50 H196 L180 38 H163 V50 H155 V10 Z M163 18 V30 H185 Q195 30 195 24 Q195 18 185 18 H163 Z" />
        
        {/* P */}
        <path d="M220 10 H250 Q270 10 270 25 Q270 40 250 40 H228 V50 H220 V10 Z M228 18 V32 H250 Q260 32 260 25 Q260 18 250 18 H228 Z" />
        
        {/* H */}
        <path d="M285 10 V50 H293 V34 H327 V50 H335 V10 H327 V26 H293 V10 H285 Z" />
        
        {/* AI (Superscript) */}
        <path d="M345 12 L340 22 H343 L344 19 H349 L350 22 H353 L348 12 H345 Z M345 17 L346.5 14 L348 17 H345 Z" />
        <path d="M355 12 V22 H358 V12 H355 Z" />
      </svg>
    </div>
  );
};

export const LogoIcon = ({ className = "h-6" }: { className?: string }) => {
  return (
    <div className={`flex items-center justify-center select-none ${className}`}>
        {/* Keeps a minimal version if ever needed, though currently hidden in chat */}
      <svg viewBox="0 0 60 60" className="h-full w-full fill-current text-inherit">
         <path d="M10 10 V40 Q10 50 20 50 H50 V42 H20 Q18 42 18 40 V10 H10 Z" />
      </svg>
    </div>
  );
};