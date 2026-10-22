import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text, TouchableOpacity } from 'react-native';
import { getAuthDependencies } from '../../../core/di/authDependencies';
import { getProductsDependencies } from '../../../core/di/productsDependencies';
import { AuthUser } from '../../../domain/auth/AuthUser';
import { IAuthRepository } from '../../../domain/auth/IAuthRepository';
import { IProductsRepository } from '../../../domain/products/IProductsRepository';
import { Product } from '../../../domain/products/Product';
import { GetProductByIdUseCase } from '../../../domain/usecases/GetProductByIdUseCase';
import { GetProductsUseCase } from '../../../domain/usecases/GetProductsUseCase';
import { LoginUseCase } from '../../../domain/usecases/LoginUseCase';
import { LogoutUseCase } from '../../../domain/usecases/LogoutUseCase';
import { RestoreSessionUseCase } from '../../../domain/usecases/RestoreSessionUseCase';
import { ISessionStorage } from '../../../domain/storage/ISessionStorage';
import { AuthProvider } from '../../../presentation/context/AuthContext';
import { AppNavigator } from '../../../presentation/navigation/AppNavigator';

jest.mock('../../../core/di/authDependencies', () => ({
  getAuthDependencies: jest.fn(),
}));

jest.mock('../../../core/di/productsDependencies', () => ({
  getProductsDependencies: jest.fn(),
}));

const user: AuthUser = { id: 1, username: 'emilys' };
const product: Product = {
  id: 1,
  title: 'Test product',
  price: 10,
  category: 'test',
  description: 'Test description',
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

describe('HomeScreen catalog integration', () => {
  let authRepository: jest.Mocked<IAuthRepository>;

  beforeEach(() => {
    authRepository = {
      login: jest.fn(),
      getCurrentUser: jest.fn().mockResolvedValue(user),
      logout: jest.fn().mockResolvedValue(undefined),
    };
    const sessionStorage: jest.Mocked<ISessionStorage> = {
      getTokens: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
      saveTokens: jest.fn(),
      cleanStorage: jest.fn(),
    };
    jest.mocked(getAuthDependencies).mockReturnValue({
      loginUseCase: new LoginUseCase(authRepository),
      logoutUseCase: new LogoutUseCase(authRepository),
      restoreSessionUseCase: new RestoreSessionUseCase(
        sessionStorage,
        authRepository,
      ),
    });

    const productsRepository: jest.Mocked<IProductsRepository> = {
      getProducts: jest.fn().mockResolvedValue([product]),
      searchProducts: jest.fn().mockResolvedValue([product]),
      getProductById: jest.fn().mockResolvedValue(product),
    };
    jest.mocked(getProductsDependencies).mockReturnValue({
      getProductsUseCase: new GetProductsUseCase(productsRepository),
      getProductByIdUseCase: new GetProductByIdUseCase(productsRepository),
    });
  });

  it('keeps logout available from the catalog and returns to login on success', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>,
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      renderer.root
        .findAllByType(Text)
        .some(node => node.props.children === 'Test product'),
    ).toBe(true);
    await ReactTestRenderer.act(async () => {
      pressButton(renderer.root, 'Cerrar sesión');
      await Promise.resolve();
    });

    expect(authRepository.logout).toHaveBeenCalledTimes(1);
    expect(
      renderer.root
        .findAllByType(Text)
        .some(node => node.props.children === 'Iniciar sesión'),
    ).toBe(true);
    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });

  it('keeps logout visible while the product detail is open', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>,
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      renderer.root.findByProps({ testID: 'product-1' }).props.onPress();
      await Promise.resolve();
    });
    expect(
      renderer.root
        .findAllByType(Text)
        .some(node => node.props.children === 'Cerrar sesión'),
    ).toBe(true);
    await ReactTestRenderer.act(async () => {
      renderer.unmount();
    });
  });
});
