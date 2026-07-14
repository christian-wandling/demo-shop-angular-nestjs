import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ProductFacade } from '../../product.facade';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

/**
 * Component for searching products in the application.
 *
 * This standalone component provides a product search interface that allows users to filter products by name
 * and navigate to the products page. It uses OnPush change detection strategy for improved performance.
 *
 * @example
 * <lib-product-search/>
 */
@Component({
  selector: 'lib-product-search',
  standalone: true,
  imports: [NgOptimizedImage, FormsModule],
  templateUrl: './product-search.component.html',
  styleUrl: './product-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex align-middle lg:ml-6 cursor-pointer relative',
    'data-testid': 'product-search',
  },
})
export class ProductSearchComponent {
  readonly #productFacade = inject(ProductFacade);
  readonly productFilter = this.#productFacade.getFilter();
  readonly #router = inject(Router);

  /**
   * Updates the product name filter in the application state
   *
   * @param name - The product name to filter by, or undefined to clear the filter
   */
  setProductNameFilter(name?: string): void {
    this.#productFacade.setFilter({
      name,
    });
  }

  /**
   * Navigates the user to the products page
   *
   * This method is typically triggered when a user submits a search or clicks
   * on the search component.
   */
  goToProductPage(): void {
    this.#router.navigateByUrl('/products');
  }
}
