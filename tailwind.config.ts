import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f5f7fb',
          100: '#e6eaf2',
          200: '#cbd5e1',
          300: '#a9b5c7',
          400: '#8390a7',
          500: '#626f85',
          600: '#334155',
          700: '#1e293b',
          800: '#111827',
          900: '#0b1020',
          950: '#050816',
        },
        accent: {
          purple: '#7c3aed',
          blue: '#3b82f6',
          cyan: '#06b6d4',
          green: '#10b981',
          yellow: '#f59e0b',
          red: '#ef4444',
          pink: '#ec4899',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
