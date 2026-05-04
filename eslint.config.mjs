import nextConfig from 'eslint-config-next';
import tseslint from '@typescript-eslint/eslint-plugin';

const config = [
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'coverage/**'],
  },
  ...nextConfig,
  {
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'import/no-anonymous-default-export': 'off',
    },
  },
];

export default config;
