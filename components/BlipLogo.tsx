
import React from 'react';

interface BlipLogoProps {
  className?: string;
  variant?: 'color' | 'white';
}

export const BlipLogo: React.FC<BlipLogoProps> = ({ className = "", variant = 'color' }) => {
  // Blip Blue: #0096FA
  const textColor = variant === 'white' ? 'text-white' : 'text-[#0096FA]';
  const fillColor = variant === 'white' ? 'white' : '#0096FA';
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Blip Symbol (Balloon) */}
      <svg 
        viewBox="0 0 48 48" 
        className="h-[1.1em] w-auto" 
        fill={fillColor}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M24 4C12.95 4 4 12.06 4 22c0 5.39 2.61 10.23 6.74 13.52L7.33 44l10.8-3.6c1.86.51 3.84.8 5.87.8 11.05 0 20-8.06 20-18S35.05 4 24 4z"/>
      </svg>
      
      <span className={`font-black tracking-tighter leading-none ${textColor}`}>
        BLIP
      </span>
    </div>
  );
};
