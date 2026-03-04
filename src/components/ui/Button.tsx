import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
    const base = "px-4 py-2 font-medium text-sm transition-all duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-accent text-white hover:bg-accent-hover",
        secondary: "bg-surface text-primary border border-border hover:brightness-110",
        ghost: "bg-transparent text-secondary hover:text-primary",
        danger: "bg-transparent text-error border border-error hover:bg-error hover:text-white"
    };

    return (
        <button className={`${base} ${variants[variant]} ${className}`} {...props} />
    );
}
