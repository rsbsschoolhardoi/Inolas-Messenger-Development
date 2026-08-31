import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface AsyncButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<any> | void;
  loadingText?: string;
  children: React.ReactNode;
}

export const AsyncButton: React.FC<AsyncButtonProps> = ({
  onClick,
  loadingText,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading || disabled) return;
    if (!onClick) return;

    try {
      setIsLoading(true);
      const result = onClick(e);
      if (result instanceof Promise) {
        await result;
      }
    } catch (err) {
      console.error('AsyncButton action error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading && (
        <RefreshCw className="h-4 w-4 animate-spin shrink-0 text-current" />
      )}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
};
