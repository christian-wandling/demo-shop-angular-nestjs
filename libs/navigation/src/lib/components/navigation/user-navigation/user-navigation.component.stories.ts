import { applicationConfig, Meta, StoryObj } from '@storybook/angular-vite';
import { CommonModule } from '@angular/common';
import { importProvidersFrom, signal } from '@angular/core';
import { UserResponse } from '@demo-shop/api';
import { CartFacade } from '@demo-shop/cart';
import { UserNavigationComponent } from './user-navigation.component';
import { mockUser, UserFacade } from '@demo-shop/user';
import { expect, within } from 'storybook/test';
import { AuthFacade } from '@demo-shop/auth';

const mockUserFacade = (user?: UserResponse) => ({
  getCurrentUser: () => signal(user),
});

const mockAuthFacade = {
  login: () => {
    return;
  },
  logout: () => {
    return;
  },
  register: () => {
    return;
  },
};

const mockCartFacade = {
  loadShoppingSession: () => {
    return;
  },
};

const meta: Meta<UserNavigationComponent> = {
  component: UserNavigationComponent,
  title: 'Navigation/UserNavigationComponent',
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(CommonModule),
        { provide: AuthFacade, useValue: mockAuthFacade },
        { provide: CartFacade, useValue: mockCartFacade },
      ],
    }),
  ],
  argTypes: {
    login: { action: 'login', control: false },
    register: { action: 'register', control: false },
    logout: { action: 'logout', control: false },
  },
  parameters: {
    controls: {
      exclude: ['#authFacade', '#userFacade', 'currentUser', '#cartFacade'],
    },
  },
};
export default meta;
type Story = StoryObj<UserNavigationComponent>;

export const Unauthenticated: Story = {
  decorators: [
    applicationConfig({
      providers: [{ provide: UserFacade, useValue: mockUserFacade() }],
    }),
  ],
  play: async ({ canvasElement, args }) => {
    const signIn = within(canvasElement).getByText('Sign in');
    const register = within(canvasElement).getByText('Register');
    expect(signIn).toBeInTheDocument();
    expect(register).toBeInTheDocument();
  },
};

export const Authenticated: Story = {
  decorators: [
    applicationConfig({
      providers: [{ provide: UserFacade, useValue: mockUserFacade(mockUser) }],
    }),
  ],
  play: async ({ canvasElement, args }) => {
    const signOut = within(canvasElement).getByText('Sign out');
    expect(signOut).not.toBeDisabled();
  },
};
