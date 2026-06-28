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
        serif: ['"Yu Mincho"', '"Hiragino Mincho ProN"', '"Hiragino Mincho Pro"', 'serif'],
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
        klee: ['"Yu Mincho"', '"Hiragino Mincho ProN"', '"Hiragino Mincho Pro"', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
