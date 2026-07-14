import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CartFacade } from '../../cart.facade';

/**
 * Displays a cart icon and provides functionality to show the shopping cart.
 * It shows the current number of items in the cart and allows users to open the cart view.
 *
 * @example
 * <lib-cart-icon/>
 */
@Component({
  selector: 'lib-cart-icon',
  standalone: true,
  imports: [],
  templateUrl: './cart-icon.component.html',
  styleUrl: './cart-icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-testid': 'shopping-cart-icon',
  },
})
export class CartIconComponent {
  readonly #cartFacade = inject(CartFacade);
  readonly itemsInCart = this.#cartFacade.getItemCount();

  /**
   * Shows the cart by updating the cart visibility state
   */
  showCart(): void {
    this.#cartFacade.setShowCart(true);
  }
}
