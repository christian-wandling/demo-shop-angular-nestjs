import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserNavigationComponent } from './user-navigation.component';
import { AuthFacade } from '@demo-shop/auth';
import { UserFacade } from '@demo-shop/user';
import { signal } from '@angular/core';
import { UserResponse } from '@demo-shop/api';
import { CartFacade } from '@demo-shop/cart';

describe('UserNavigationComponent', () => {
  const user = signal<UserResponse>({
    address: {
      street: 'street',
      apartment: 'apartment',
      city: 'city',
      region: 'region',
      zip: 'zip',
      country: 'country',
    },
    email: 'email',
    firstname: 'firstname',
    id: 1,
    lastname: 'lastname',
    phone: 'phone',
  });

  let component: UserNavigationComponent;
  let fixture: ComponentFixture<UserNavigationComponent>;
  let authFacade: AuthFacade;
  let cartFacade: CartFacade;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserNavigationComponent],
      providers: [
        { provide: AuthFacade, useValue: { login: jest.fn(), logout: jest.fn(), register: jest.fn() } },
        { provide: UserFacade, useValue: { getCurrentUser: jest.fn().mockReturnValue(user) } },
        { provide: CartFacade, useValue: { loadShoppingSession: jest.fn() } },
      ],
    }).compileComponents();

    authFacade = TestBed.inject(AuthFacade);
    cartFacade = TestBed.inject(CartFacade);
    fixture = TestBed.createComponent(UserNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call auth facade login and load shopping session', async () => {
    await component.login();

    expect(authFacade.login).toHaveBeenCalled();
    expect(cartFacade.loadShoppingSession).toHaveBeenCalled();
  });

  it('should call auth facade register and load shopping session', async () => {
    await component.register();

    expect(authFacade.register).toHaveBeenCalled();
    expect(cartFacade.loadShoppingSession).toHaveBeenCalled();
  });

  it('should call auth facade logout', async () => {
    await component.logout();

    expect(authFacade.logout).toHaveBeenCalled();
  });

  describe('snapshots', () => {
    it('should match snapshot with default state', () => {
      expect(fixture.nativeElement).toMatchSnapshot();
    });
  });
});
