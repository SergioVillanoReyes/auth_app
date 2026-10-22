import { IProductsRepository } from '../products/IProductsRepository';
import { Product } from '../products/Product';

export class GetProductByIdUseCase {
  constructor(private readonly productsRepository: IProductsRepository) {}

  execute(id: number): Promise<Product> {
    return this.productsRepository.getProductById(id);
  }
}
