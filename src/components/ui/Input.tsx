import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, className = '', ...props }, ref) => {
        return (
            <div className="w-full flex flex-col gap-1.5">
                {label && (
                    <label className="text-sm font-medium text-primary">
                        {label}
                    </label>
                )}
                <div className="relative flex items-center">
                    {icon && (
                        <div className="absolute left-3 text-secondary">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
                            w-full py-3 bg-transparent text-primary
                            border rounded-xl outline-none
                            transition-all duration-200
                            ${error ? 'border-error focus:border-error' : 'border-border focus:border-accent'}
                            disabled:opacity-50 disabled:cursor-not-allowed
                            placeholder:text-tertiary
                            ${icon ? 'pl-10 pr-4' : 'px-4'}
                            ${className}
                        `}
                        {...props}
                    />
                </div>
                {error && <span className="text-xs text-error">{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
