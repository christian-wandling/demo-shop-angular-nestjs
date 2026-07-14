import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthFacade } from '@demo-shop/auth';
import { UserFacade } from '@demo-shop/user';
import { CartFacade } from '@demo-shop/cart';

/**
 * Component that handles user navigation functionality including login, registration, and logout
 *
 * @example
 * <lib-user-navigation>
 */
@Component({
  selector: 'lib-user-navigation',
  standalone: true,
  imports: [],
  templateUrl: './user-navigation.component.html',
  styleUrl: './user-navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserNavigationComponent {
  readonly #authFacade = inject(AuthFacade);
  readonly #userFacade = inject(UserFacade);
  readonly currentUser = this.#userFacade.getCurrentUser();
  readonly #cartFacade = inject(CartFacade);

  /** Handles user login and loads shopping session */
  async login(): Promise<void> {
    await this.#authFacade.login();
    await this.#cartFacade.loadShoppingSession();
  }

  /** Handles user registration and loads shopping session */
  async register(): Promise<void> {
    await this.#authFacade.register();
    await this.#cartFacade.loadShoppingSession();
  }

  /** Handles user logout */
  async logout(): Promise<void> {
    await this.#authFacade.logout();
  }
}
