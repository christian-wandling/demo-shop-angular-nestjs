import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { expect, within } from 'storybook/test';
import { provideImageLoader } from '@demo-shop/shared';
import { CartItemsComponent } from './cart-items.component';
import { mockCartItems } from '../../../+mock/mock-cart-items';

const meta: Meta<CartItemsComponent> = {
  component: CartItemsComponent,
  title: 'Cart/CartItemsComponent',
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(CommonModule, NgOptimizedImage),
        provideImageLoader(),
        provideRouter([{ path: '**', redirectTo: '' }]),
      ],
    }),
  ],
  argTypes: {
    removeItem: { action: 'removeItem', control: false },
  },
};
export default meta;
type Story = StoryObj<CartItemsComponent>;

export const Default: Story = {
  args: {
    items: mockCartItems,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const productImages = canvas.getAllByRole('img');
    expect(productImages).toHaveLength(mockCartItems.length);
  },
};
