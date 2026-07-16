import { applicationConfig, Meta, StoryObj } from '@storybook/angular-vite';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { provideRouter } from '@angular/router';
import { importProvidersFrom, signal } from '@angular/core';
import { ProductFacade } from '../../product.facade';
import { expect, within } from 'storybook/test';
import { ProductListComponent } from './product-list.component';
import { provideImageLoader } from '@demo-shop/shared';
import { mockProducts } from '../../+mock/mock-products';

const mockProductFacade = {
  getFiltered: () => signal(mockProducts),
  fetchAll: () => {
    return;
  },
};

const meta: Meta<ProductListComponent> = {
  component: ProductListComponent,
  title: 'Product/ProductListComponent',
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(CommonModule, NgOptimizedImage),
        provideImageLoader(),
        provideRouter([{ path: '**', redirectTo: '' }]),
        { provide: ProductFacade, useValue: mockProductFacade },
      ],
    }),
  ],
  parameters: {
    controls: {
      exclude: ['#productFacade', 'products', 'ngOnInit'],
    },
  },
};
export default meta;
type Story = StoryObj<ProductListComponent>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const firstImage: HTMLImageElement = within(canvasElement).getByAltText(mockProducts[0].name);
    const images: HTMLImageElement[] = within(canvasElement).getAllByRole('img');
    expect(firstImage).toBeTruthy();
    expect(images).toHaveLength(mockProducts.length);
  },
};
