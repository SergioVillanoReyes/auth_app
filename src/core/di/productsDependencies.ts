import { GetProductByIdUseCase } from '../../domain/usecases/GetProductByIdUseCase';
import { GetProductsUseCase } from '../../domain/usecases/GetProductsUseCase';
import { DummyJsonProductsDataSource } from '../../data/datasource/DummyJsonProductsDataSource';
import { ProductsRepository } from '../../data/repositories/ProductsRepository';
import { HttpClient } from '../../data/http/HttpClient';

export interface ProductsDependencies {
  getProductsUseCase: GetProductsUseCase;
  getProductByIdUseCase: GetProductByIdUseCase;
}

let dependencies: ProductsDependencies | null = null;

export const getProductsDependencies = (): ProductsDependencies => {
  if (dependencies === null) {
    const productsRepository = new ProductsRepository(
      new DummyJsonProductsDataSource(new HttpClient('https://dummyjson.com')),
    );
    dependencies = {
      getProductsUseCase: new GetProductsUseCase(productsRepository),
      getProductByIdUseCase: new GetProductByIdUseCase(productsRepository),
    };
  }

  return dependencies;
};
