import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Locked design tokens (see image 1)
        canvas: '#F4F3E7',     // cream app background
        lime: {
          DEFAULT: '#CDE84A',  // brand acid-lime accent
          soft: '#E3F08A',
          deep: '#AFCB2E',
        },
        ink: '#14141B',         // near-black text / dark panels
        panel: '#16161E',       // dark card panel
        panel2: '#1E1E29',      // raised dark surface
        muted: '#6B6B73',       // secondary text
        line: '#E7E6D8',        // hairline on cream
        card: '#FFFFFF',
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        display: ['var(--font-grotesk)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl2: '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,20,27,0.04), 0 8px 24px -12px rgba(20,20,27,0.10)',
        panel: '0 20px 60px -24px rgba(20,20,27,0.45)',
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        spinslow: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        spinslow: 'spinslow 40s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
