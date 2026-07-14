import { applicationConfig, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { provideRouter } from '@angular/router';
import { CartFacade, CartIconComponent } from '@demo-shop/cart';
import { NavigationComponent } from './navigation.component';
import { ProductFacade, ProductSearchComponent } from '@demo-shop/product';
import { UserNavigationComponent } from './user-navigation/user-navigation.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { RouteItem } from '../../models/route-item';
import { NavigationService } from '../../services/navigation.service';
import { AuthFacade, PermissionStrategy } from '@demo-shop/auth';
import { UserResponse } from '@demo-shop/api';
import { signal } from '@angular/core';
import { mockUser, UserFacade } from '@demo-shop/user';
import { expect, within } from 'storybook/test';
import { FormsModule } from '@angular/forms';

const navItems = [
  new RouteItem('products', 101, {
    route: 'products',
  }),
];

const authItems = [
  new RouteItem('orders', 102, {
    route: 'orders',
    permissionStrategy: PermissionStrategy.AUTHENTICATED,
  }),
];

const navigationService = (items: RouteItem[]) => ({
  getFilteredItems: () => items,
});

const productFilter = signal({ name: '' });

const mockProductFacade = {
  getFilter: () => productFilter,
  setFilter: (filter: { name: string }) => productFilter.set(filter),
};

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
  getItemCount: () => signal(5),
};

const meta: Meta<NavigationComponent> = {
  component: NavigationComponent,
  title: 'Navigation/NavigationComponent',
  decorators: [
    applicationConfig({
      providers: [
        provideAnimations(),
        provideRouter([{ path: '**', redirectTo: '' }]),
        { provide: AuthFacade, useValue: mockAuthFacade },
        { provide: CartFacade, useValue: mockCartFacade },
        { provide: ProductFacade, useValue: mockProductFacade },
      ],
    }),
    moduleMetadata({
      imports: [
        CommonModule,
        FormsModule,
        NgOptimizedImage,
        ProductSearchComponent,
        UserNavigationComponent,
        CartIconComponent,
      ],
    }),
  ],
  parameters: {
    controls: {
      exclude: ['#navigationService', 'menuItems', 'mobileMenuOpen', 'selectedMenuItem'],
    },
  },
};

export default meta;
type Story = StoryObj<NavigationComponent>;

export const Unauthenticated: Story = {
  decorators: [
    applicationConfig({
      providers: [
        { provide: UserFacade, useValue: mockUserFacade() },
        { provide: NavigationService, useValue: navigationService(navItems) },
      ],
    }),
  ],
  play: async ({ canvasElement, args }) => {
    const product = within(canvasElement).getByText('Products');
    const signIn = within(canvasElement).getByText('Sign in');
    const register = within(canvasElement).getByText('Register');
    const productSearch = within(canvasElement).getByAltText('search');
    expect(product).toBeInTheDocument();
    expect(signIn).toBeInTheDocument();
    expect(register).toBeInTheDocument();
    expect(productSearch).toBeInTheDocument();
  },
};

export const Authenticated: Story = {
  decorators: [
    applicationConfig({
      providers: [
        { provide: UserFacade, useValue: mockUserFacade(mockUser) },
        { provide: NavigationService, useValue: navigationService([...navItems, ...authItems]) },
      ],
    }),
  ],
  play: async ({ canvasElement, args }) => {
    const product = within(canvasElement).getByText('Products');
    const order = within(canvasElement).getByText('Orders');
    const signOut = within(canvasElement).getByText('Sign out');
    const userName = within(canvasElement).getByText(`${mockUser.firstname} ${mockUser.lastname}`);
    const productSearch = within(canvasElement).getByAltText('search');
    expect(product).toBeInTheDocument();
    expect(order).toBeInTheDocument();
    expect(signOut).toBeInTheDocument();
    expect(userName).toBeInTheDocument();
    expect(productSearch).toBeInTheDocument();
  },
};
