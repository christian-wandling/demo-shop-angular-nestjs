import { applicationConfig, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { CartItemResponse, UserResponse } from '@demo-shop/api';
import { FormErrorComponent, provideImageLoader } from '@demo-shop/shared';
import { CartFacade } from '../../cart.facade';
import { CartItemsComponent } from '../shared/cart-items/cart-items.component';
import { expect, within } from 'storybook/test';
import { ReactiveFormsModule } from '@angular/forms';
import { mockAddress, mockUser, mockUserWithAddress, UserFacade } from '@demo-shop/user';
import { CheckoutComponent } from './checkout.component';
import { mockCartItems } from '../../+mock/mock-cart-items';

const mockCartFacade = (items: CartItemResponse[]) => ({
  removeItem: () => {
    return;
  },
  checkout: () => {
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

const mockUserFacade = (user: UserResponse) => ({
  updateUserAddress: () => {
    return;
  },
  updateUserPhone: () => {
    return;
  },
  getCurrentUser: () => signal(user),
});

const meta: Meta<CheckoutComponent> = {
  component: CheckoutComponent,
  title: 'Cart/CheckoutComponent',
  decorators: [
    applicationConfig({
      providers: [
        provideImageLoader(),
        provideRouter([{ path: '**', redirectTo: '' }]),
        {
          provide: CartFacade,
          useValue: mockCartFacade(mockCartItems),
        },
      ],
    }),
    moduleMetadata({
      imports: [CommonModule, NgOptimizedImage, ReactiveFormsModule, CartItemsComponent, FormErrorComponent],
    }),
  ],
  argTypes: {
    removeItem: { action: 'removeItem', control: false },
    checkout: { action: 'checkout', control: false },
    updateUser: { action: 'updateUser', control: false },
  },
  parameters: {
    controls: {
      exclude: [
        'checkoutForm',
        'shippingInformationExtended',
        '#cartFacade',
        'items',
        'price',
        '#userFacade',
        'user',
        '#fb',
        '#router',
        'formDirty',
        'formValid',
        'updateButtonEnabled',
        'checkoutButtonEnabled',
        'createCheckOutForm',
      ],
    },
  },
};
export default meta;
type Story = StoryObj<CheckoutComponent>;

export const WithValidShippingInformation: Story = {
  decorators: [
    applicationConfig({
      providers: [{ provide: UserFacade, useValue: mockUserFacade(mockUserWithAddress) }],
    }),
  ],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const firstname: HTMLInputElement = canvas.getByRole('textbox', { name: /first name/i });
    const lastname: HTMLInputElement = canvas.getByRole('textbox', { name: /last name/i });
    const email: HTMLInputElement = canvas.getByRole('textbox', { name: /email/i });
    const phone: HTMLInputElement = canvas.getByRole('textbox', { name: /phone/i });
    const country: HTMLInputElement = canvas.getByRole('combobox', { name: /country/i });
    const street: HTMLInputElement = canvas.getByRole('textbox', { name: /street/i });
    const apartment: HTMLInputElement = canvas.getByRole('textbox', { name: /apartment/i });
    const city: HTMLInputElement = canvas.getByRole('textbox', { name: /city/i });
    const region: HTMLInputElement = canvas.getByRole('textbox', { name: /state/i });
    const zip: HTMLInputElement = canvas.getByRole('textbox', { name: /zip/i });
    const buttonCheckout: HTMLButtonElement = canvas.getByText('Checkout');
    expect(firstname.value).toBe(mockUserWithAddress.firstname);
    expect(lastname.value).toBe(mockUserWithAddress.lastname);
    expect(email.value).toBe(mockUserWithAddress.email);
    expect(phone.value).toBe(mockUserWithAddress.phone);
    expect(country.value).toBe(mockAddress.country);
    expect(street.value).toBe(mockAddress.street);
    expect(apartment.value).toBe(mockAddress.apartment);
    expect(city.value).toBe(mockAddress.city);
    expect(region.value).toBe(mockAddress.region);
    expect(zip.value).toBe(mockAddress.zip);
    expect(buttonCheckout).not.toBeDisabled();
  },
};

export const WithoutValidShippingInformation: Story = {
  decorators: [
    applicationConfig({
      providers: [{ provide: UserFacade, useValue: mockUserFacade(mockUser) }],
    }),
  ],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const buttonCheckout: HTMLButtonElement = canvas.getByText('Checkout');
    expect(buttonCheckout).toBeDisabled();
  },
};
