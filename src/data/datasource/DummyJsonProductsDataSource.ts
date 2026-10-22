import { Product } from '../../domain/products/Product';
import { HttpClient } from '../http/HttpClient';

export class InvalidProductsResponseError extends Error {
  constructor() {
    super('DummyJSON returned an invalid products response');
    this.name = 'InvalidProductsResponseError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isProduct = (value: unknown): value is Product => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    !Number.isFinite(value.id) ||
    typeof value.title !== 'string' ||
    value.title.trim().length === 0 ||
    typeof value.price !== 'number' ||
    !Number.isFinite(value.price) ||
    typeof value.category !== 'string' ||
    typeof value.description !== 'string'
  ) {
    return false;
  }

  return value.thumbnail === undefined || typeof value.thumbnail === 'string';
};

const parseProduct = (value: unknown): Product => {
  if (!isProduct(value)) {
    throw new InvalidProductsResponseError();
  }

  return {
    id: value.id,
    title: value.title,
    price: value.price,
    category: value.category,
    description: value.description,
    ...(value.thumbnail === undefined ? {} : { thumbnail: value.thumbnail }),
  };
};

const parseProductList = (value: unknown): Product[] => {
  if (!isRecord(value) || !Array.isArray(value.products)) {
    throw new InvalidProductsResponseError();
  }

  return value.products.map(parseProduct);
};

export class DummyJsonProductsDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  async getProducts(): Promise<Product[]> {
    const response = await this.httpClient.get<unknown>('/products');
    return parseProductList(response);
  }

  async searchProducts(query: string): Promise<Product[]> {
    const response = await this.httpClient.get<unknown>(
      `/products/search?q=${encodeURIComponent(query)}`,
    );
    return parseProductList(response);
  }

  async getProductById(id: number): Promise<Product> {
    const response = await this.httpClient.get<unknown>(`/products/${id}`);
    return parseProduct(response);
  }
}
