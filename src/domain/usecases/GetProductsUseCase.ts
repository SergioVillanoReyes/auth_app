import { IProductsRepository } from '../products/IProductsRepository';
import { Product } from '../products/Product';

export class GetProductsUseCase {
  constructor(private readonly productsRepository: IProductsRepository) {}

  execute(query = ''): Promise<Product[]> {
    const normalizedQuery = query.trim();
    return normalizedQuery.length === 0
      ? this.productsRepository.getProducts()
      : this.productsRepository.searchProducts(normalizedQuery);
  }
}
