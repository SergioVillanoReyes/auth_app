import {
  DummyJsonProductsDataSource,
  InvalidProductsResponseError,
} from '../../../data/datasource/DummyJsonProductsDataSource';
import { HttpClient } from '../../../data/http/HttpClient';

const createResponse = (body: unknown): Response =>
  ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: jest.fn().mockResolvedValue(body),
  } as Response);

const product = {
  id: 1,
  title: 'Test product',
  price: 12.5,
  category: 'test',
  description: 'A product for testing',
  thumbnail: 'https://example.com/product.png',
};

describe('DummyJsonProductsDataSource', () => {
  let dataSource: DummyJsonProductsDataSource;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    dataSource = new DummyJsonProductsDataSource(
      new HttpClient('https://dummyjson.com'),
    );
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('loads and validates the product list', async () => {
    fetchMock.mockResolvedValue(createResponse({ products: [product] }));

    await expect(dataSource.getProducts()).resolves.toEqual([product]);
    expect(fetchMock).toHaveBeenCalledWith('https://dummyjson.com/products');
  });

  it('encodes a search query and does not attach authentication headers', async () => {
    fetchMock.mockResolvedValue(createResponse({ products: [product] }));

    await expect(dataSource.searchProducts('phone & case')).resolves.toEqual([
      product,
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://dummyjson.com/products/search?q=phone%20%26%20case',
    );
  });

  it('loads a single product by id', async () => {
    fetchMock.mockResolvedValue(createResponse(product));

    await expect(dataSource.getProductById(1)).resolves.toEqual(product);
    expect(fetchMock).toHaveBeenCalledWith('https://dummyjson.com/products/1');
  });

  it('rejects malformed list envelopes and product data', async () => {
    fetchMock
      .mockResolvedValueOnce(createResponse({ items: [product] }))
      .mockResolvedValueOnce(
        createResponse({ products: [{ ...product, price: '12.5' }] }),
      );

    await expect(dataSource.getProducts()).rejects.toBeInstanceOf(
      InvalidProductsResponseError,
    );
    await expect(dataSource.getProducts()).rejects.toBeInstanceOf(
      InvalidProductsResponseError,
    );
  });

  it('rejects malformed product details', async () => {
    fetchMock.mockResolvedValue(createResponse({ ...product, id: '1' }));

    await expect(dataSource.getProductById(1)).rejects.toBeInstanceOf(
      InvalidProductsResponseError,
    );
  });

  it('propagates HTTP and network errors from the existing client', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    await expect(dataSource.getProducts()).rejects.toMatchObject({
      status: 0,
    });
  });

  it('preserves non-success HTTP status errors from the existing client', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    await expect(dataSource.getProducts()).rejects.toMatchObject({
      status: 503,
    });
  });
});
