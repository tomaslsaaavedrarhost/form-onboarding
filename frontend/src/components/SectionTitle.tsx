import React from 'react';

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * Un componente reutilizable para títulos de sección con efecto gradiente.
 * Este componente aplica consistentemente el estilo de texto con gradiente en toda la aplicación.
 */
export const SectionTitle: React.FC<SectionTitleProps> = ({ 
  children, 
  className = '',
  size = 'lg'
}) => {
  const sizeClasses = {
    'sm': 'text-sm',
    'md': 'text-md',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl'
  };

  return (
    <h3 className={`font-bold tracking-tight relative mb-4 ${sizeClasses[size]} ${className}`}>
      <span className="bg-gradient-brand gradient-text">{children}</span>
    </h3>
  );
};

export default SectionTitle; 