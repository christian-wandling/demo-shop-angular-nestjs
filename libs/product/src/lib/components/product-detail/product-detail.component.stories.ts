import { applicationConfig, Meta, StoryObj } from '@storybook/angular-vite';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { importProvidersFrom, signal } from '@angular/core';
import { ProductDetailComponent } from './product-detail.component';
import { ProductFacade } from '../../product.facade';
import { ProductResponse } from '@demo-shop/api';
import { CartFacade } from '@demo-shop/cart';
import { expect, within } from 'storybook/test';
import { provideImageLoader } from '@demo-shop/shared';
import { mockProducts } from '../../+mock/mock-products';

const mockProductFacade = (product: ProductResponse) => ({
  getById: () => signal(product),
  fetchById: () => {
    return;
  },
});

const mockCartFacade = (hasShoppingSession: boolean) => ({
  getHasShoppingSession: () => signal(hasShoppingSession),
  addItem: () => {
    return;
  },
});

const mockActivatedRoute = {
  snapshot: {
    params: {
      id: 1,
    },
  },
};

const meta: Meta<ProductDetailComponent> = {
  component: ProductDetailComponent,
  title: 'Product/ProductDetailComponent',
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(CommonModule, NgOptimizedImage),
        provideImageLoader(),
        { provide: ProductFacade, useValue: mockProductFacade(mockProducts[0]) },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: CartFacade, useValue: mockCartFacade(false) },
      ],
    }),
  ],
  argTypes: {
    addToCart: { action: 'addToCart', control: false },
  },
  parameters: {
    controls: {
      exclude: ['#activatedRoute', '#productFacade', '#cartFacade', 'product', 'addButtonEnabled', 'ngOnInit'],
    },
  },
};
export default meta;
type Story = StoryObj<ProductDetailComponent>;

export const Unauthenticated: Story = {
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button');
    expect(button).toBeDisabled();
  },
};

export const Authenticated: Story = {
  decorators: [
    applicationConfig({
      providers: [{ provide: CartFacade, useValue: mockCartFacade(true) }],
    }),
  ],
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button');
    expect(button).not.toBeDisabled();
  },
};
