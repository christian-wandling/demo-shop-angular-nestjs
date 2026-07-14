import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { importProvidersFrom } from '@angular/core';
import { OrderStatusComponent } from './order-status.component';
import { OrderStatus } from '@demo-shop/api';
import { expect, within } from 'storybook/test';

const meta: Meta<OrderStatusComponent> = {
  component: OrderStatusComponent,
  title: 'Order/OrderStatusComponent',
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(CommonModule)],
    }),
  ],
  argTypes: {
    status: {
      options: Object.keys(OrderStatus),
    },
  },
};
export default meta;
type Story = StoryObj<OrderStatusComponent>;

export const Created: Story = {
  args: {
    status: OrderStatus.Created,
  },
  play: async ({ canvasElement, args }) => {
    const status = within(canvasElement).getByText(OrderStatus.Created);
    expect(status).toBeTruthy();
  },
};

export const Completed: Story = {
  args: {
    status: OrderStatus.Completed,
  },
  play: async ({ canvasElement, args }) => {
    const status = within(canvasElement).getByText(OrderStatus.Completed);
    expect(status).toBeTruthy();
  },
};
