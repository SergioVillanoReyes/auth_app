import { IProductsRepository } from '../../domain/products/IProductsRepository';
import { Product } from '../../domain/products/Product';
import { DummyJsonProductsDataSource } from '../datasource/DummyJsonProductsDataSource';

export class ProductsRepository implements IProductsRepository {
  constructor(
    private readonly productsDataSource: Pick<
      DummyJsonProductsDataSource,
      'getProducts' | 'searchProducts' | 'getProductById'
    >,
  ) {}

  getProducts(): Promise<Product[]> {
    return this.productsDataSource.getProducts();
  }

  searchProducts(query: string): Promise<Product[]> {
    return this.productsDataSource.searchProducts(query);
  }

  getProductById(id: number): Promise<Product> {
    return this.productsDataSource.getProductById(id);
  }
}
