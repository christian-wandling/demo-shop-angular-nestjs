import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { StorybookConfig } from '@storybook/angular-vite';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const config: StorybookConfig = {
  stories: ['../src/app/**/*.@(mdx|stories.@(js|jsx|ts|tsx))', '../../../libs/**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],
  addons: [
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-mcp'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/angular-vite'),
    options: {},
  },
  staticDirs: ['../public'],
  viteFinal: async viteConfig => {
    const { mergeConfig } = await import('vite');
    const tsPaths: Record<string, string[]> = JSON.parse(
      readFileSync(join(workspaceRoot, 'tsconfig.base.json'), 'utf-8')
    ).compilerOptions.paths;
    const alias = Object.fromEntries(
      Object.entries(tsPaths).map(([name, [target]]) => [name, join(workspaceRoot, target)])
    );
    return mergeConfig(viteConfig, { resolve: { alias } });
  },
};

export default config;

// To customize your webpack configuration you can use the webpackFinal field.
// Check https://storybook.js.org/docs/react/builders/webpack#extending-storybooks-webpack-config
// and https://nx.dev/recipes/storybook/custom-builder-configs

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
