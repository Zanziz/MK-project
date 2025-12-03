import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyle = "px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border-b-4";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 border-blue-800 text-white",
    secondary: "bg-gray-700 hover:bg-gray-600 border-gray-900 text-white",
    danger: "bg-red-600 hover:bg-red-500 border-red-800 text-white",
    success: "bg-green-600 hover:bg-green-500 border-green-800 text-white"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};