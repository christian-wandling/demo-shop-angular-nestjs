import { TestBed } from '@angular/core/testing';
import { UserApi, UserResponse } from '@demo-shop/api';
import { UserStore } from './user.store';
import { of } from 'rxjs';
import { MonitoringFacade } from '@demo-shop/monitoring';
import { patchState } from '@ngrx/signals';

describe('UserStore', () => {
  let store: any;
  let userApi: UserApi;
  let monitoringFacade: MonitoringFacade;

  const user: UserResponse = {
    id: 1,
    email: 'email',
    firstname: 'firstname',
    lastname: 'lastname',
    phone: 'phone',
    address: {
      street: 'street',
      apartment: 'apartment',
      city: 'city',
      region: 'region',
      zip: 'zip',
      country: 'country',
    },
  };

  const updatePhoneRequest = { phone: 'newPhone' };
  const updateAddressRequest = { ...user.address, street: 'newStreet' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: UserApi,
          useValue: {
            resolveCurrentUser: jest.fn().mockReturnValue(of(user)),
            updateCurrentUserPhone: jest.fn().mockReturnValue(of({ ...user, ...updatePhoneRequest })),
            updateCurrentUserAddress: jest.fn().mockReturnValue(of(updateAddressRequest)),
          },
        },
        {
          provide: MonitoringFacade,
          useValue: {
            setUser: jest.fn(),
          },
        },
      ],
    });
    userApi = TestBed.inject(UserApi);
    monitoringFacade = TestBed.inject(MonitoringFacade);
    store = TestBed.inject(UserStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should fetch the current user from the api', async () => {
    await store.fetchCurrentUser();

    expect(userApi.resolveCurrentUser).toHaveBeenCalled();
    expect(store.user()).toEqual(user);
  });

  it('should update the phone of the current user', async () => {
    patchState(store, state => ({ ...state, user }));
    await store.updateUserPhone(updatePhoneRequest);

    expect(userApi.updateCurrentUserPhone).toHaveBeenCalledWith(updatePhoneRequest);
    expect(store.user()).toEqual({ ...user, ...updatePhoneRequest });
  });

  it('should update the address of the current user', async () => {
    patchState(store, state => ({ ...state, user }));
    await store.updateUserAddress(updateAddressRequest);

    expect(userApi.updateCurrentUserAddress).toHaveBeenCalledWith(updateAddressRequest);
    expect(store.user()).toEqual({ ...user, address: updateAddressRequest });
  });

  describe('onInit', () => {
    it('should set up effect to track user in Sentry when store initializes', () => {
      TestBed.tick();

      expect(monitoringFacade.setUser).toHaveBeenCalledWith({ id: undefined });
    });

    it('should update Sentry user when store user changes', async () => {
      await store.fetchCurrentUser();
      TestBed.tick();

      expect(monitoringFacade.setUser).toHaveBeenCalledWith({ id: 1 });
    });
  });

  describe('onInit', () => {
    it('should set up effect to track user in Sentry when store initializes', () => {
      TestBed.tick();

      expect(monitoringFacade.setUser).toHaveBeenCalledWith({ id: undefined });
    });

    it('should update Sentry user when store user changes', async () => {
      await store.fetchCurrentUser();
      TestBed.tick();

      expect(monitoringFacade.setUser).toHaveBeenCalledWith({ id: 1 });
    });
  });
});
