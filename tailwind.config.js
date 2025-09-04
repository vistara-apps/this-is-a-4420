/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(220 15% 98%)',
        accent: 'hsl(170 75% 40%)',
        primary: 'hsl(220 85% 45%)',
        surface: 'hsl(220 15% 100%)',
        'text-primary': 'hsl(220 15% 15%)',
        'text-secondary': 'hsl(220 15% 35%)',
      },
      borderRadius: {
        'lg': '16px',
        'md': '10px',
        'sm': '6px',
      },
      boxShadow: {
        'card': '0 5px 15px hsla(0, 0%, 0%, 0.08)',
        'dropdown': '0 10px 20px hsla(0, 0%, 0%, 0.12)',
      },
      spacing: {
        'sm': '8px',
        'md': '12px',
        'lg': '20px',
        'xl': '24px',
      },
      fontSize: {
        'display': ['3rem', { fontWeight: '700' }],
        'heading': ['1.5rem', { fontWeight: '600' }],
        'body': ['1rem', { fontWeight: '400', lineHeight: '1.75' }],
        'caption': ['0.875rem', { fontWeight: '300' }],
      },
    },
  },
  plugins: [],
}