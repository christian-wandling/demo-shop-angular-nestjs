import { applicationConfig, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { CartItemResponse } from '@demo-shop/api';
import { provideImageLoader } from '@demo-shop/shared';
import { CartComponent } from './cart.component';
import { CartFacade } from '../../cart.facade';
import { CartItemsComponent } from '../shared/cart-items/cart-items.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { expect, within } from 'storybook/test';
import { mockCartItems } from '../../+mock/mock-cart-items';

const mockCartFacade = (items: CartItemResponse[]) => ({
  removeItem: () => {
    return;
  },
  closeCart: () => {
    return;
  },
  getAll: () => signal(items),
  getTotalPrice: () => {
    const totalPrice = items.reduce((acc, curr) => acc + curr.totalPrice, 0);
    return signal(totalPrice);
  },
  getShowCart: () => signal(true),
  setShowCart: () => {
    return;
  },
});

const meta: Meta<CartComponent> = {
  render: args => ({
    props: args,
    template: `
      <div style="height: 75vh">
        <lib-cart></lib-cart>
      </div>
    `,
  }),
  component: CartComponent,
  title: 'Cart/CartComponent',
  decorators: [
    applicationConfig({
      providers: [provideImageLoader(), provideRouter([{ path: '**', redirectTo: '' }]), provideAnimations()],
    }),
    moduleMetadata({
      imports: [CommonModule, NgOptimizedImage, CartItemsComponent],
    }),
  ],
  argTypes: {
    removeItem: { action: 'removeItem', control: false },
    closeCart: { action: 'closeCart', control: false },
  },
  parameters: {
    controls: {
      exclude: ['#cartFacade', 'checkoutButtonEnabled', 'items', 'totalPrice', 'checkoutButtonEnabled', 'showCart'],
    },
  },
};
export default meta;
type Story = StoryObj<CartComponent>;

export const WithItems: Story = {
  decorators: [
    applicationConfig({
      providers: [{ provide: CartFacade, useValue: mockCartFacade(mockCartItems) }],
    }),
  ],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const productImages = canvas.getAllByRole('img');
    const checkoutButton = canvas.getByText('Checkout');
    expect(productImages).toHaveLength(mockCartItems.length);
    expect(checkoutButton).not.toHaveClass('disabled');
  },
};

export const Empty: Story = {
  decorators: [
    applicationConfig({
      providers: [{ provide: CartFacade, useValue: mockCartFacade([]) }],
    }),
  ],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const checkoutButton = canvas.getByText('Checkout');
    expect(checkoutButton).not.toHaveClass('disabled');
  },
};
