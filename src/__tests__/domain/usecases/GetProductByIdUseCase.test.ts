import { IProductsRepository } from '../../../domain/products/IProductsRepository';
import { Product } from '../../../domain/products/Product';
import { GetProductByIdUseCase } from '../../../domain/usecases/GetProductByIdUseCase';

describe('GetProductByIdUseCase', () => {
  it('returns the product requested from the repository', async () => {
    const product: Product = {
      id: 5,
      title: 'Test product',
      price: 5,
      category: 'test',
      description: 'A product for testing',
    };
    const repository: jest.Mocked<IProductsRepository> = {
      getProducts: jest.fn(),
      searchProducts: jest.fn(),
      getProductById: jest.fn().mockResolvedValue(product),
    };
    const useCase = new GetProductByIdUseCase(repository);

    await expect(useCase.execute(5)).resolves.toEqual(product);
    expect(repository.getProductById).toHaveBeenCalledWith(5);
  });
});
