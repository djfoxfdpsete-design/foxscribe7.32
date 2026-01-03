import React from 'react';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'secondary';
  icon?: React.ReactNode;
}

export const NeonButton: React.FC<NeonButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-bold transition-all duration-300 rounded-md group focus:outline-none";
  
  const variants = {
    primary: "text-white bg-transparent border border-neon-cyan hover:bg-neon-cyan/10 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]",
    danger: "text-white bg-transparent border border-red-500 hover:bg-red-500/10 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]",
    secondary: "text-slate-300 bg-slate-800/50 border border-slate-700 hover:border-neon-purple hover:text-neon-purple hover:shadow-[0_0_15px_rgba(217,70,239,0.3)]"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">
        {icon}
        {children}
      </span>
    </button>
  );
};
