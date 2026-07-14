import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { FormErrorComponent } from './form-error.component';
import { expect, within } from 'storybook/test';
import { CommonModule } from '@angular/common';
import { importProvidersFrom } from '@angular/core';

const meta: Meta<FormErrorComponent> = {
  component: FormErrorComponent,
  title: 'Shared/FormErrorComponent',
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(CommonModule)],
    }),
  ],
  argTypes: {
    fieldName: {
      control: {
        type: 'text',
      },
    },
  },
};
export default meta;
type Story = StoryObj<FormErrorComponent>;

export const RequiredError: Story = {
  args: {
    errors: { required: true },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(`${args.fieldName || 'Field'} is required`)).toBeTruthy();
  },
};

export const InvalidEmailError: Story = {
  args: {
    errors: { email: true },
  },
  parameters: {
    controls: {
      exclude: ['fieldName'],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText('Email invalid')).toBeTruthy();
  },
};

export const MultipleErrors: Story = {
  args: {
    fieldName: 'Name',
    errors: { required: true, email: true },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(`${args.fieldName} is required`)).toBeTruthy();
    expect(canvas.getByText('Email invalid')).toBeTruthy();
  },
};
