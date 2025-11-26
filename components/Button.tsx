import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyle = "font-bold rounded-xl transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 border-b-4 border-blue-700",
    secondary: "bg-yellow-400 text-yellow-900 hover:bg-yellow-500 border-b-4 border-yellow-600",
    accent: "bg-green-500 text-white hover:bg-green-600 border-b-4 border-green-700",
    outline: "bg-white text-gray-600 border-2 border-gray-200 hover:bg-gray-50",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-3 text-base",
    lg: "px-6 py-4 text-lg",
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};