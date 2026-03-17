import React from 'react';
import './Card.css';

export const Card = ({ children, className = '', hoverable = false, ...props }) => {
  return (
    <div className={`card glass ${hoverable ? 'hoverable' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`card-header ${className}`}>{children}</div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`card-content ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`card-footer ${className}`}>{children}</div>
);
