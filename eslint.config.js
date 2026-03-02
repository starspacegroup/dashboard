import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default [
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				google: 'readonly',
				PermissionState: 'readonly',
				EventListener: 'readonly'
			}
		},
		rules: {
			'@typescript-eslint/no-unused-vars': ['error', {
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
				destructuredArrayIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_'
			}]
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		},
		rules: {
			'@typescript-eslint/no-unused-expressions': 'off'
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'dist/']
	}
];
