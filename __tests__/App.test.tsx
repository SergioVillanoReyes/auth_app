import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import App from '../App';
import { getAuthDependencies } from '../src/core/di/authDependencies';
import { getProductsDependencies } from '../src/core/di/productsDependencies';
import { IProductsRepository } from '../src/domain/products/IProductsRepository';
import { AuthTokens } from '../src/domain/auth/AuthTokens';
import { AuthUser } from '../src/domain/auth/AuthUser';
import { IAuthRepository } from '../src/domain/auth/IAuthRepository';
import { GetProductByIdUseCase } from '../src/domain/usecases/GetProductByIdUseCase';
import { GetProductsUseCase } from '../src/domain/usecases/GetProductsUseCase';
import { ISessionStorage } from '../src/domain/storage/ISessionStorage';
import { LoginUseCase } from '../src/domain/usecases/LoginUseCase';
import { LogoutUseCase } from '../src/domain/usecases/LogoutUseCase';
import { RestoreSessionUseCase } from '../src/domain/usecases/RestoreSessionUseCase';
import { AuthProvider } from '../src/presentation/context/AuthContext';
import { HomeScreen } from '../src/presentation/screens/HomeScreen';

jest.mock('../src/core/di/authDependencies', () => ({
  getAuthDependencies: jest.fn(),
}));

jest.mock('../src/core/di/productsDependencies', () => ({
  getProductsDependencies: jest.fn(),
}));

const tokens: AuthTokens = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};
const user: AuthUser = { id: 1, username: 'emilys' };

beforeEach(() => {
  const repository: jest.Mocked<IAuthRepository> = {
    login: jest.fn(),
    getCurrentUser: jest.fn().mockResolvedValue(user),
    logout: jest.fn().mockResolvedValue(undefined),
  };
  const storage: jest.Mocked<ISessionStorage> = {
    getTokens: jest.fn().mockResolvedValue(tokens),
    saveTokens: jest.fn().mockResolvedValue(undefined),
    cleanStorage: jest.fn().mockResolvedValue(undefined),
  };
  jest.mocked(getAuthDependencies).mockReturnValue({
    loginUseCase: new LoginUseCase(repository),
    logoutUseCase: new LogoutUseCase(repository),
    restoreSessionUseCase: new RestoreSessionUseCase(storage, repository),
  });
  const productsRepository: jest.Mocked<IProductsRepository> = {
    getProducts: jest.fn().mockResolvedValue([]),
    searchProducts: jest.fn().mockResolvedValue([]),
    getProductById: jest.fn(),
  };
  jest.mocked(getProductsDependencies).mockReturnValue({
    getProductsUseCase: new GetProductsUseCase(productsRepository),
    getProductByIdUseCase: new GetProductByIdUseCase(productsRepository),
  });
});

test('renders the app', async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
    await Promise.resolve();
    await Promise.resolve();
  });
});

test('shows the auth_app home screen', async () => {
  let renderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <AuthProvider>
        <HomeScreen />
      </AuthProvider>
    );
    await Promise.resolve();
    await Promise.resolve();
  });
  expect(
    renderer?.root.findAllByType(Text).some(node => node.props.children === 'auth_app')
  ).toBe(true);
});
