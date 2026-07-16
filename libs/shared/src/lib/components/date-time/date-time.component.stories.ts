import { applicationConfig, Meta, StoryObj } from '@storybook/angular-vite';
import { DateTimeComponent } from './date-time.component';
import { expect, within } from 'storybook/test';
import { CommonModule } from '@angular/common';
import { importProvidersFrom } from '@angular/core';

const meta: Meta<DateTimeComponent> = {
  component: DateTimeComponent,
  title: 'Shared/DateTimeComponent',
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(CommonModule)],
    }),
  ],
  argTypes: {
    pattern: {
      control: {
        type: 'text',
      },
    },
    timezone: {
      control: {
        type: 'text',
      },
    },
  },
};
export default meta;
type Story = StoryObj<DateTimeComponent>;

export const WithISOString: Story = {
  args: {
    dateTime: '2025-03-16T12:00:00Z',
    pattern: 'MMM dd, yyyy',
    timezone: 'UTC',
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const date = new Date(args.dateTime).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
    expect(canvas.getByText(date)).toBeTruthy();
  },
};

export const WithDate: Story = {
  args: {
    dateTime: new Date('2025-03-16T12:00:00'),
    pattern: 'MMM dd, yyyy',
    timezone: 'UTC',
  },
  argTypes: {
    dateTime: {
      control: {
        type: 'date',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const date = args.dateTime.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

    expect(canvas.getByText(date)).toBeTruthy();
  },
};
