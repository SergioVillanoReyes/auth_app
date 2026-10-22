import { Product } from '../../../domain/products/Product';
import { DummyJsonProductsDataSource } from '../../../data/datasource/DummyJsonProductsDataSource';
import { ProductsRepository } from '../../../data/repositories/ProductsRepository';

describe('ProductsRepository', () => {
  const product: Product = {
    id: 1,
    title: 'Test product',
    price: 12.5,
    category: 'test',
    description: 'A product for testing',
  };
  let dataSource: jest.Mocked<
    Pick<
      DummyJsonProductsDataSource,
      'getProducts' | 'searchProducts' | 'getProductById'
    >
  >;
  let repository: ProductsRepository;

  beforeEach(() => {
    dataSource = {
      getProducts: jest.fn(),
      searchProducts: jest.fn(),
      getProductById: jest.fn(),
    };
    repository = new ProductsRepository(dataSource);
  });

  it('delegates list, search, and detail operations', async () => {
    dataSource.getProducts.mockResolvedValue([product]);
    dataSource.searchProducts.mockResolvedValue([product]);
    dataSource.getProductById.mockResolvedValue(product);

    await expect(repository.getProducts()).resolves.toEqual([product]);
    await expect(repository.searchProducts('test')).resolves.toEqual([product]);
    await expect(repository.getProductById(1)).resolves.toEqual(product);

    expect(dataSource.getProducts).toHaveBeenCalledTimes(1);
    expect(dataSource.searchProducts).toHaveBeenCalledWith('test');
    expect(dataSource.getProductById).toHaveBeenCalledWith(1);
  });

  it('propagates datasource failures', async () => {
    const error = new Error('Request failed');
    dataSource.getProducts.mockRejectedValue(error);

    await expect(repository.getProducts()).rejects.toBe(error);
  });
});
