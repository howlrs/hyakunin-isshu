import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        washi: '#FAF6E9',
        sumi: '#1F1B16',
        shu: '#C7402A',
        koshoku: '#8C6E3F',
      },
      fontFamily: {
        serif: ['var(--font-noto-serif-jp)', 'serif'],
        sans: ['var(--font-noto-sans-jp)', 'sans-serif'],
        klee: ['var(--font-klee-one)', 'cursive'],
      },
    },
  },
  plugins: [],
};

export default config;
