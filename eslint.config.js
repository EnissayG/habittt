// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', '.expo/*', 'coverage/*'],
  },
  {
    // Layer dependency rule: ui -> domain <- data (see docs/architecture.md).
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/domain',
              from: ['./src/data', './src/ui'],
              message: 'domain/ must not depend on data/ or ui/.',
            },
            {
              target: './src/data',
              from: './src/ui',
              message: 'data/ must not depend on ui/.',
            },
            {
              target: './src/ui',
              from: './src/data',
              message:
                'ui/ talks to domain/ only; wiring to data/ happens in the composition root.',
            },
          ],
        },
      ],
    },
  },
  {
    // domain/ is plain TypeScript: no framework or storage packages.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-*',
                'react-native',
                'react-native-*',
                'expo',
                'expo-*',
                '@expo/*',
                'zustand',
                'zustand/*',
                '@shopify/*',
                '@supabase/*',
              ],
              message: 'domain/ must stay framework-free (see docs/architecture.md).',
            },
          ],
        },
      ],
    },
  },
]);
