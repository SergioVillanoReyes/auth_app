import { IProductsRepository } from '../../../domain/products/IProductsRepository';
import { Product } from '../../../domain/products/Product';
import { GetProductsUseCase } from '../../../domain/usecases/GetProductsUseCase';

describe('GetProductsUseCase', () => {
  const products: Product[] = [];
  let repository: jest.Mocked<IProductsRepository>;
  let useCase: GetProductsUseCase;

  beforeEach(() => {
    repository = {
      getProducts: jest.fn().mockResolvedValue(products),
      searchProducts: jest.fn().mockResolvedValue(products),
      getProductById: jest.fn(),
    };
    useCase = new GetProductsUseCase(repository);
  });

  it('loads the list for an empty or whitespace-only query', async () => {
    await useCase.execute();
    await useCase.execute('   ');

    expect(repository.getProducts).toHaveBeenCalledTimes(2);
    expect(repository.searchProducts).not.toHaveBeenCalled();
  });

  it('trims a non-empty query before searching', async () => {
    await useCase.execute('  phone  ');

    expect(repository.searchProducts).toHaveBeenCalledWith('phone');
    expect(repository.getProducts).not.toHaveBeenCalled();
  });
});
