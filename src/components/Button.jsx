import React from 'react';
import './Button.css';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  fullWidth = false,
  className = '',
  disabled,
  ...props 
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="loader"></span> : null}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
    </button>
  );
};
