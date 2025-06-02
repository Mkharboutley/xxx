import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500',
    secondary: 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500',
    outline: 'border border-gray-300 hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
    ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
  };
  
  const sizeClasses = {
    sm: 'text-sm px-3 py-2',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = props.disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${disabledClass} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;