import React, { ReactNode } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
    return (
        <div className={`bg-card border border-border p-4 sm:p-5 rounded-3xl ${className}`} {...props}>
            {children}
        </div>
    );
}
