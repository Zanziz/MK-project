import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-500 border-blue-800 text-white',
  secondary: 'bg-gray-700 hover:bg-gray-600 border-gray-900 text-white',
  danger: 'bg-red-600 hover:bg-red-500 border-red-800 text-white',
  success: 'bg-green-600 hover:bg-green-500 border-green-800 text-white',
  ghost: 'border-transparent text-gray-300 hover:bg-gray-700 hover:text-white',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5',
  lg: 'px-8 py-3.5 text-lg',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={[
      'inline-flex items-center justify-center gap-2 rounded-lg font-bold transition-[background-color,transform] duration-150',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400',
      'enabled:active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50',
      variant === 'ghost' ? '' : 'border-b-4 shadow-lg enabled:active:border-b-2',
      variants[variant],
      sizes[size],
      fullWidth ? 'w-full' : '',
      className,
    ].join(' ')}
    {...props}
  />
);
