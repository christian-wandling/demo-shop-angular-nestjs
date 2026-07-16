import 'zone.js';
import { Preview } from '@storybook/angular-vite';
import { setCompodocJson } from '@storybook/addon-docs/angular';
// eslint-disable-next-line @nx/enforce-module-boundaries
import * as docJson from 'dist/storybook-helper/documentation.json';

setCompodocJson(docJson);

const preview: Preview = {
  tags: ['autodocs'],

  parameters: {
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
};

export default preview;
