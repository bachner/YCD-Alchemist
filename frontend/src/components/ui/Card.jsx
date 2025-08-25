import React from 'react';

const Card = ({ 
  children, 
  variant = 'default', 
  className = '',
  ...props 
}) => {
  const baseClasses = 'glass-card p-6 mb-8';
  
  const variantClasses = {
    default: 'glass-card-hover',
    success: 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-500',
    upload: 'glass-card-hover min-h-[200px] flex items-center justify-center cursor-pointer'
  };

  const cardClasses = [
    baseClasses,
    variantClasses[variant] || variantClasses.default,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

export default Card;
