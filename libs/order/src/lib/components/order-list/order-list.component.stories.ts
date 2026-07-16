import { applicationConfig, Meta, StoryObj } from '@storybook/angular-vite';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { provideRouter } from '@angular/router';
import { importProvidersFrom, signal } from '@angular/core';
import { OrderStatus } from '@demo-shop/api';
import { expect, within } from 'storybook/test';
import { provideImageLoader } from '@demo-shop/shared';
import { OrderListComponent } from './order-list.component';
import { OrderFacade } from '../../order.facade';
import { mockAddress, mockUserWithAddress, UserFacade } from '@demo-shop/user';
import { mockOrders } from '../../+mock/mock-orders';

const mockOrderFacade = {
  getSortedByStatusAndDate: () => {
    mockOrders.sort((a, b) => {
      if (a.status === b.status) {
        return a.created > b.created ? -1 : 1;
      }

      return a.status === OrderStatus.Created ? -1 : 1;
    });

    return signal(mockOrders);
  },
  fetchAll: () => {
    return;
  },
};

const mockUserFacade = {
  getCurrentUser: () => signal(mockUserWithAddress),
};

const meta: Meta<OrderListComponent> = {
  component: OrderListComponent,
  title: 'Order/OrderListComponent',
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(CommonModule, NgOptimizedImage),
        provideImageLoader(),
        provideRouter([{ path: '**', redirectTo: '' }]),
        { provide: OrderFacade, useValue: mockOrderFacade },
        { provide: UserFacade, useValue: mockUserFacade },
      ],
    }),
  ],
  parameters: {
    controls: {
      exclude: ['#orderFacade', '#userFacade', 'orders', 'user', 'ngOnInit'],
    },
  },
};
export default meta;
type Story = StoryObj<OrderListComponent>;

export const Default: Story = {
  render: args => ({
    props: args,
    template: `
      <div>
        <div style="height: 4rem; width: 100%; background: #fff; z-index: 10; top: 0; position: sticky"></div>
        <lib-order-list></lib-order-list>
      </div>
    `,
  }),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const name = canvas.getByText(`${mockUserWithAddress.firstname} ${mockUserWithAddress.lastname}`);
    const addressLine1 = canvas.getByText(`${mockAddress.street} ${mockAddress.apartment}`);
    const addressLine2 = canvas.getByText(`${mockAddress.zip} ${mockAddress.city}, ${mockAddress.region}`);
    const addressLine3 = canvas.getByText(`${mockAddress.country}`);
    const orders = canvas.getAllByText(/Order #/i);
    expect(name).toBeTruthy();
    expect(addressLine1).toBeTruthy();
    expect(addressLine2).toBeTruthy();
    expect(addressLine3).toBeTruthy();
    expect(orders).toHaveLength(orders.length);
  },
};
