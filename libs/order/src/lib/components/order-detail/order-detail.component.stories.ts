import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { importProvidersFrom, signal } from '@angular/core';
import { expect, within } from 'storybook/test';
import { provideImageLoader } from '@demo-shop/shared';
import { OrderDetailComponent } from './order-detail.component';
import { OrderFacade } from '../../order.facade';
import { mockAddress, mockUserWithAddress, UserFacade } from '@demo-shop/user';
import { PrintInvoiceService } from '../../services/print-invoice.service';
import { mockOrders } from '../../+mock/mock-orders';

const mockOrderFacade = {
  getById: () => signal(mockOrders[0]),
  fetchById: () => {
    return;
  },
};

const mockUserFacade = {
  getCurrentUser: () => signal(mockUserWithAddress),
};

const mockActivatedRoute = {
  snapshot: {
    params: {
      id: 1,
    },
  },
};

const mockPrintInvoiceService = {
  generatePdf: () => {
    return;
  },
};

const meta: Meta<OrderDetailComponent> = {
  component: OrderDetailComponent,
  title: 'Order/OrderDetailComponent',
  decorators: [
    applicationConfig({
      providers: [
        importProvidersFrom(CommonModule, NgOptimizedImage),
        provideImageLoader(),
        { provide: OrderFacade, useValue: mockOrderFacade },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: UserFacade, useValue: mockUserFacade },
        { provide: PrintInvoiceService, useValue: mockPrintInvoiceService },
      ],
    }),
  ],
  argTypes: {
    printPdf: { action: 'printPdf', control: false },
  },
  parameters: {
    controls: {
      exclude: ['#activatedRoute', '#orderFacade', '#userFacade', '#printInvoiceService', 'order', 'user', 'ngOnInit'],
    },
  },
};
export default meta;
type Story = StoryObj<OrderDetailComponent>;

export const Default: Story = {
  render: args => ({
    props: args,
    template: `
      <div>
        <div style="height: 4rem; width: 100%; background: #fff; z-index: 10; top: 0; position: sticky"></div>
        <lib-order-detail></lib-order-detail>
      </div>
    `,
  }),
  play: async ({ canvasElement, args }) => {
    const name = within(canvasElement).getByText(`${mockUserWithAddress.firstname} ${mockUserWithAddress.lastname}`);
    const addressLine1 = within(canvasElement).getByText(`${mockAddress.street} ${mockAddress.apartment}`);
    const addressLine2 = within(canvasElement).getByText(
      `${mockAddress.zip} ${mockAddress.city}, ${mockAddress.region}`
    );
    const addressLine3 = within(canvasElement).getByText(`${mockAddress.country}`);
    const printPdfButton = within(canvasElement).getByRole('button');
    const productImages = within(canvasElement).getAllByRole('img');
    expect(name).toBeTruthy();
    expect(addressLine1).toBeTruthy();
    expect(addressLine2).toBeTruthy();
    expect(addressLine3).toBeTruthy();
    expect(printPdfButton).toBeTruthy();
    expect(productImages).toHaveLength(mockOrders[0].items.length);
  },
};
