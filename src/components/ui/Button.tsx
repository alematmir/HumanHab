import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
    const base = "px-4 py-2 font-medium text-sm transition-all duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-accent text-white hover:bg-accent/80 hover:shadow-[0_0_20px_rgba(138,128,255,0.4)]",
        secondary: "glass-button text-primary px-6",
        ghost: "bg-transparent text-secondary hover:text-primary transition-colors",
        danger: "bg-error/10 text-error border border-error/20 hover:bg-error hover:text-white"
    };

    return (
        <button className={`${base} ${variants[variant]} ${className}`} {...props} />
    );
}
