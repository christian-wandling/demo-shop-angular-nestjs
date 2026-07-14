import { applicationConfig, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { signal } from '@angular/core';
import { CartFacade } from '../../cart.facade';
import { CartIconComponent } from './cart-icon.component';
import { expect, within } from 'storybook/test';

const mockCartFacade = {
  getItemCount: () => signal(5),
};

const meta: Meta<CartIconComponent> = {
  component: CartIconComponent,
  title: 'Cart/CartIconComponent',
  decorators: [
    applicationConfig({
      providers: [{ provide: CartFacade, useValue: mockCartFacade }],
    }),
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  argTypes: {
    showCart: { action: 'showCart', control: false },
  },
  parameters: {
    controls: {
      exclude: ['#cartFacade', 'itemsInCart'],
    },
  },
};
export default meta;
type Story = StoryObj<CartIconComponent>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const count = canvas.getByText(5);
    expect(count).toBeTruthy();
  },
};
