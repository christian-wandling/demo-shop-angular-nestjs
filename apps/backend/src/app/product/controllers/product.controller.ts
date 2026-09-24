import { Controller, Param, ParseIntPipe } from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { ProductResponse } from '../dtos/product-response';
import { Public } from '../../common/decorators/public.decorator';
import { CustomGet } from '../../common/decorators/custom-get.decorator';
import { ProductListResponse } from '../dtos/product-list-response';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

/**
 * Controller handling product-related HTTP endpoints.
 *
 * This controller exposes API endpoints for retrieving product information.
 * The @Public() decorator indicates these endpoints are accessible without authentication.
 */
@Public()
@ApiTags('product')
@Controller({ path: 'products', version: '1' })
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * Retrieves all available products.
   *
   * @returns A promise that resolves to a ProductListResponse containing all products
   * @decorator CustomGet - Custom decorator that configures the endpoint with ProductListResponse as the return type
   */
  @ApiOperation({
    summary: 'Get all products',
    description: 'Get all products',
    operationId: 'GetAllProducts',
  })
  @CustomGet({ res: ProductListResponse })
  getAllProducts(): Promise<ProductListResponse> {
    return this.productService.all();
  }

  /**
   * Retrieves a specific product by its ID.
   *
   * @param id - The unique identifier of the product to retrieve
   * @returns A promise that resolves to a ProductResponse for the requested product
   * @decorator CustomGet - Custom decorator that configures the endpoint with ProductResponse as the return type
   */
  @ApiOperation({
    summary: 'Get product by id',
    description: 'Get product by id',
    operationId: 'GetProductById',
  })
  @CustomGet({ path: ':id', res: ProductResponse })
  getProductById(@Param('id', ParseIntPipe) id: number): Promise<ProductResponse> {
    return this.productService.find(id);
  }
}
