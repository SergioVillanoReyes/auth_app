import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Pressable, Text, TextInput, TouchableOpacity } from 'react-native';
import { getProductsDependencies } from '../../../core/di/productsDependencies';
import { IProductsRepository } from '../../../domain/products/IProductsRepository';
import { Product } from '../../../domain/products/Product';
import { GetProductByIdUseCase } from '../../../domain/usecases/GetProductByIdUseCase';
import { GetProductsUseCase } from '../../../domain/usecases/GetProductsUseCase';
import { ProductsCatalogScreen } from '../../../presentation/screens/ProductsCatalogScreen';

jest.mock('../../../core/di/productsDependencies', () => ({
  getProductsDependencies: jest.fn(),
}));

const firstProduct: Product = {
  id: 1,
  title: 'First product',
  price: 10,
  category: 'test',
  description: 'First product description',
};

const secondProduct: Product = {
  id: 2,
  title: 'Second product',
  price: 20,
  category: 'test',
  description: 'Second product description',
};

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

const pressButton = (
  root: ReactTestRenderer.ReactTestInstance,
  label: string,
): void => {
  const button = root
    .findAllByType(TouchableOpacity)
    .find(candidate => candidate.findByType(Text).props.children === label);
  if (!button) {
    throw new Error(`Button "${label}" was not found`);
  }
  button.props.onPress();
};

const submitSearch = async (
  root: ReactTestRenderer.ReactTestInstance,
  value: string,
): Promise<void> => {
  const input = root.findByType(TextInput);
  await ReactTestRenderer.act(async () => {
    input.props.onChangeText(value);
  });
  await ReactTestRenderer.act(async () => {
    pressButton(root, 'Buscar');
    await Promise.resolve();
  });
};

describe('ProductsCatalogScreen', () => {
  let repository: jest.Mocked<IProductsRepository>;

  beforeEach(() => {
    repository = {
      getProducts: jest.fn(),
      searchProducts: jest.fn(),
      getProductById: jest.fn(),
    };
    jest.mocked(getProductsDependencies).mockReturnValue({
      getProductsUseCase: new GetProductsUseCase(repository),
      getProductByIdUseCase: new GetProductByIdUseCase(repository),
    });
  });

  it('shows loading and then the product list', async () => {
    const deferred = createDeferred<Product[]>();
    repository.getProducts.mockReturnValue(deferred.promise);
    let renderer!: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProductsCatalogScreen />);
    });
    expect(
      renderer.root
        .findAllByType(Text)
        .some(node =>
          String(node.props.children).includes('Cargando productos'),
        ),
    ).toBe(true);

    await ReactTestRenderer.act(async () => {
      deferred.resolve([firstProduct]);
      await deferred.promise;
    });
    expect(
      renderer.root
        .findAllByType(Text)
        .some(node => node.props.children === firstProduct.title),
    ).toBe(true);
    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('preserves previous results and submitted query after a search failure and retries it', async () => {
    repository.getProducts.mockResolvedValue([firstProduct]);
    repository.searchProducts
      .mockRejectedValueOnce(new Error('Search failed'))
      .mockResolvedValueOnce([secondProduct]);
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProductsCatalogScreen />);
      await Promise.resolve();
    });

    await submitSearch(renderer.root, '  phone  ');
    expect(repository.searchProducts).toHaveBeenNthCalledWith(1, 'phone');
    expect(
      renderer.root
        .findAllByType(Text)
        .some(node => node.props.children === firstProduct.title),
    ).toBe(true);
    expect(
      renderer.root
        .findAllByType(Text)
        .some(
          node =>
            node.props.children ===
            'No se pudieron cargar los productos. Inténtalo de nuevo.',
        ),
    ).toBe(true);
    expect(renderer.root.findByType(TextInput).props.value).toBe('  phone  ');

    await ReactTestRenderer.act(async () => {
      pressButton(renderer.root, 'Reintentar búsqueda');
      await Promise.resolve();
    });
    expect(repository.searchProducts).toHaveBeenNthCalledWith(2, 'phone');
    expect(
      renderer.root
        .findAllByType(Text)
        .some(node => node.props.children === secondProduct.title),
    ).toBe(true);
    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('does not allow an older search response to replace the newest results', async () => {
    repository.getProducts.mockResolvedValue([firstProduct]);
    const olderSearch = createDeferred<Product[]>();
    const newerSearch = createDeferred<Product[]>();
    repository.searchProducts
      .mockReturnValueOnce(olderSearch.promise)
      .mockReturnValueOnce(newerSearch.promise);
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProductsCatalogScreen />);
      await Promise.resolve();
    });

    const input = renderer.root.findByType(TextInput);
    await ReactTestRenderer.act(async () => {
      input.props.onChangeText('older');
    });
    await ReactTestRenderer.act(async () => {
      pressButton(renderer.root, 'Buscar');
    });
    await ReactTestRenderer.act(async () => {
      input.props.onChangeText('newer');
    });
    await ReactTestRenderer.act(async () => {
      pressButton(renderer.root, 'Buscar');
    });
    await ReactTestRenderer.act(async () => {
      newerSearch.resolve([secondProduct]);
      await newerSearch.promise;
    });
    await ReactTestRenderer.act(async () => {
      olderSearch.resolve([firstProduct]);
      await olderSearch.promise;
    });

    expect(
      renderer.root
        .findAllByType(Text)
        .some(node => node.props.children === secondProduct.title),
    ).toBe(true);
    expect(
      renderer.root
        .findAllByType(Text)
        .some(node => node.props.children === firstProduct.title),
    ).toBe(false);
    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('ignores a stale detail response after returning and selecting another product', async () => {
    repository.getProducts.mockResolvedValue([firstProduct, secondProduct]);
    const firstDetail = createDeferred<Product>();
    const secondDetail = createDeferred<Product>();
    repository.getProductById
      .mockReturnValueOnce(firstDetail.promise)
      .mockReturnValueOnce(secondDetail.promise);
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProductsCatalogScreen />);
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      renderer.root.findByProps({ testID: 'product-1' }).props.onPress();
    });
    await ReactTestRenderer.act(async () => {
      pressButton(renderer.root, 'Volver al catálogo');
    });
    await ReactTestRenderer.act(async () => {
      renderer.root.findByProps({ testID: 'product-2' }).props.onPress();
    });

    await ReactTestRenderer.act(async () => {
      secondDetail.resolve(secondProduct);
      await secondDetail.promise;
    });
    await ReactTestRenderer.act(async () => {
      firstDetail.resolve(firstProduct);
      await firstDetail.promise;
    });

    expect(
      renderer.root
        .findAllByType(Text)
        .some(node => node.props.children === secondProduct.title),
    ).toBe(true);
    expect(
      renderer.root
        .findAllByType(Text)
        .some(node => node.props.children === firstProduct.title),
    ).toBe(false);
    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('does not allow the initial list response to replace a later search', async () => {
    const initialList = createDeferred<Product[]>();
    const search = createDeferred<Product[]>();
    repository.getProducts.mockReturnValue(initialList.promise);
    repository.searchProducts.mockReturnValue(search.promise);
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProductsCatalogScreen />);
    });

    const input = renderer.root.findByType(TextInput);
    await ReactTestRenderer.act(async () => {
      input.props.onChangeText('newer');
    });
    await ReactTestRenderer.act(async () => {
      pressButton(renderer.root, 'Buscar');
    });
    await ReactTestRenderer.act(async () => {
      search.resolve([secondProduct]);
      await search.promise;
    });
    await ReactTestRenderer.act(async () => {
      initialList.resolve([firstProduct]);
      await initialList.promise;
    });

    expect(
      renderer.root
        .findAllByType(Text)
        .some(node => node.props.children === secondProduct.title),
    ).toBe(true);
    expect(
      renderer.root
        .findAllByType(Text)
        .some(node => node.props.children === firstProduct.title),
    ).toBe(false);
    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('retries a detail error for the same product', async () => {
    repository.getProducts.mockResolvedValue([firstProduct]);
    repository.getProductById
      .mockRejectedValueOnce(new Error('Detail failed'))
      .mockResolvedValueOnce(firstProduct);
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProductsCatalogScreen />);
      await Promise.resolve();
    });
    await ReactTestRenderer.act(async () => {
      renderer.root.findByProps({ testID: 'product-1' }).props.onPress();
      await Promise.resolve();
    });

    expect(
      renderer.root
        .findAllByType(Text)
        .some(
          node =>
            node.props.children ===
            'No se pudo cargar el producto. Inténtalo de nuevo.',
        ),
    ).toBe(true);
    await ReactTestRenderer.act(async () => {
      pressButton(renderer.root, 'Reintentar detalle');
      await Promise.resolve();
    });
    expect(repository.getProductById).toHaveBeenNthCalledWith(2, 1);
    expect(
      renderer.root
        .findAllByType(Text)
        .some(node => node.props.children === firstProduct.title),
    ).toBe(true);
    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('shows an empty search response separately from errors', async () => {
    repository.getProducts.mockResolvedValue([firstProduct]);
    repository.searchProducts.mockResolvedValue([]);
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProductsCatalogScreen />);
      await Promise.resolve();
    });

    await submitSearch(renderer.root, 'missing');
    expect(
      renderer.root
        .findAllByType(Text)
        .some(
          node =>
            node.props.children ===
            'No se encontraron productos para esta búsqueda.',
        ),
    ).toBe(true);
    expect(renderer.root.findAllByType(Pressable)).toHaveLength(0);
    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });
});
