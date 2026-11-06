const js = require('@eslint/js');
const prettier = require('eslint-config-prettier');
module.exports = [js.configs.recommended, prettier, { ignores: ['node_modules/**'], languageOptions: { ecmaVersion: 2023, sourceType: 'commonjs', globals: { Buffer: 'readonly', console: 'readonly', global: 'readonly', Intl: 'readonly', clearTimeout: 'readonly', module: 'readonly', process: 'readonly', require: 'readonly', setTimeout: 'readonly', __dirname: 'readonly' } }, rules: { 'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] } }];
