/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        main: 'rgb(var(--color-bg-main) / <alpha-value>)',
        surface: 'rgb(var(--color-bg-surface) / <alpha-value>)',
        card: 'rgb(var(--color-bg-card) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        tertiary: 'rgb(var(--color-text-tertiary) / <alpha-value>)',
        accent: 'rgb(var(--color-brand-accent) / <alpha-value>)',
        'accent-hover': 'rgb(var(--color-brand-accent-hover) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',

        // Colores en crudo por si se necesitan
        'raw-gray-900': 'rgb(var(--gray-900) / <alpha-value>)',
        'raw-gray-800': 'rgb(var(--gray-800) / <alpha-value>)',
        'raw-gray-700': 'rgb(var(--gray-700) / <alpha-value>)',
        'raw-gray-200': 'rgb(var(--gray-200) / <alpha-value>)',
        'raw-gray-100': 'rgb(var(--gray-100) / <alpha-value>)',
        'raw-blue-900': 'rgb(var(--blue-900) / <alpha-value>)',
        'raw-blue-800': 'rgb(var(--blue-800) / <alpha-value>)',
        'raw-blue-700': 'rgb(var(--blue-700) / <alpha-value>)',
        'raw-blue-600': 'rgb(var(--blue-600) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem', // Para etiquetas muy sutiles
      }
    },
  },
  plugins: [],
}