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
        // Semantic colors
        background: {
          DEFAULT: '#ffffff',
          secondary: '#f9fafb',
        },
        foreground: '#111827',
        card: '#ffffff',
        border: '#e5e7eb',
        primary: {
          DEFAULT: '#3b82f6',
          muted: '#dbeafe',
        },
        secondary: {
          DEFAULT: '#f3f4f6',
        },
        success: {
          DEFAULT: '#10b981',
          muted: '#d1fae5',
        },
        warning: {
          DEFAULT: '#f59e0b',
          muted: '#fef3c7',
        },
        destructive: {
          DEFAULT: '#ef4444',
          muted: '#fee2e2',
        },
        muted: {
          DEFAULT: '#f9fafb',
          foreground: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
      },
    },
  },
  plugins: [],
}

