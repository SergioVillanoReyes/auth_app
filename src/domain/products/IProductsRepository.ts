import { Product } from './Product';

export interface IProductsRepository {
  getProducts(): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
  getProductById(id: number): Promise<Product>;
}
