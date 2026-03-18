import { globalIgnores } from 'eslint/config';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import pluginVue from 'eslint-plugin-vue';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/indent': ['error', 2],
      '@stylistic/function-paren-newline': ['error', { minItems: 3 }],
      '@stylistic/object-curly-newline': [
        'error',
        {
          ObjectPattern: { minProperties: 3, consistent: true },
          ObjectExpression: { minProperties: 3, consistent: true },
          ImportDeclaration: { minProperties: 3, consistent: true },
        },
      ],
      'vue/max-attributes-per-line': ['error', { singleline: { max: 2 }, multiline: { max: 1 } }],
      'vue/html-indent': ['error', 2, { attribute: 1, closeBracket: 0 }],
      'vue/multi-word-component-names': ['error', 'never'],
    },
  },
);
