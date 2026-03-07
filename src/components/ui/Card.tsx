import React, { ReactNode } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
    return (
        <div className={`glass-card p-4 sm:p-5 ${className}`} {...props}>
            {children}
        </div>
    );
}
