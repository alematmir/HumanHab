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
        main: 'var(--color-bg-main)',
        surface: 'var(--color-bg-surface)',
        card: 'var(--color-bg-card)',
        border: 'var(--color-border)',
        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        tertiary: 'var(--color-text-tertiary)',
        accent: 'var(--color-brand-accent)',
        'accent-hover': 'var(--color-brand-accent-hover)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',

        // Colores en crudo por si se necesitan
        'raw-gray-900': 'var(--gray-900)',
        'raw-gray-800': 'var(--gray-800)',
        'raw-gray-700': 'var(--gray-700)',
        'raw-gray-200': 'var(--gray-200)',
        'raw-gray-100': 'var(--gray-100)',
        'raw-blue-900': 'var(--blue-900)',
        'raw-blue-800': 'var(--blue-800)',
        'raw-blue-700': 'var(--blue-700)',
        'raw-blue-600': 'var(--blue-600)',
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