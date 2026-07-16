import { TestBed } from '@angular/core/testing';
import { createAuthInitializer } from './create-auth-initializer';
import { KeycloakService } from '../services/keycloak.service';

describe('Create auth initializer', () => {
  let keycloakService: KeycloakService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: KeycloakService,
          useValue: {
            init: jest.fn,
          },
        },
      ],
    });

    keycloakService = TestBed.inject(KeycloakService);
  });

  it('create auth initializer', async () => {
    const res = createAuthInitializer();

    expect(res).toBeTruthy();
  });

  it('create init keycloak when the initializer factory is called', async () => {
    const init = jest.spyOn(keycloakService, 'init');

    const res = createAuthInitializer();
    await res.useFactory(keycloakService)();

    expect(init).toHaveBeenCalled();
  });
});
