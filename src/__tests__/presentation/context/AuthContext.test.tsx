import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import { getAuthDependencies } from '../../../core/di/authDependencies';
import { AuthUser } from '../../../domain/auth/AuthUser';
import { IAuthRepository } from '../../../domain/auth/IAuthRepository';
import { ISessionStorage } from '../../../domain/storage/ISessionStorage';
import { LoginUseCase } from '../../../domain/usecases/LoginUseCase';
import { LogoutUseCase } from '../../../domain/usecases/LogoutUseCase';
import { RestoreSessionUseCase } from '../../../domain/usecases/RestoreSessionUseCase';
import { AuthProvider, useAuth } from '../../../presentation/context/AuthContext';

jest.mock('../../../core/di/authDependencies', () => ({
  getAuthDependencies: jest.fn(),
}));

describe('AuthContext', () => {
  const user: AuthUser = { id: 1, username: 'emilys' };
  let repository: jest.Mocked<IAuthRepository>;
  let storage: jest.Mocked<ISessionStorage>;
  let api: ReturnType<typeof useAuth>;

  const AuthProbe = (): React.JSX.Element => {
    api = useAuth();
    return <Text>{api.state.status}</Text>;
  };

  beforeEach(() => {
    repository = {
      login: jest.fn(),
      getCurrentUser: jest.fn(),
      logout: jest.fn(),
    };
    storage = {
      getTokens: jest.fn(),
      saveTokens: jest.fn(),
      cleanStorage: jest.fn(),
    };
    (getAuthDependencies as jest.Mock).mockReturnValue({
      loginUseCase: new LoginUseCase(repository),
      logoutUseCase: new LogoutUseCase(repository),
      restoreSessionUseCase: new RestoreSessionUseCase(storage, repository),
    });
  });

  it('restores an existing session before exposing authenticated state', async () => {
    storage.getTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    repository.getCurrentUser.mockResolvedValue(user);

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      );
      await Promise.resolve();
    });

    expect(renderer!.root.findByType(Text).props.children).toBe(
      'authenticated'
    );
    expect(repository.getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('keeps an initialization error retryable instead of treating it as no session', async () => {
    storage.getTokens.mockRejectedValueOnce(new Error('Storage unavailable'));
    storage.getTokens.mockResolvedValueOnce(null);

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      );
      await Promise.resolve();
    });
    expect(api.state.status).toBe('error');

    await ReactTestRenderer.act(async () => {
      await api.retryInitialization();
    });
    expect(api.state.status).toBe('anonymous');
  });

  it('transitions through login and logout only after repository operations complete', async () => {
    repository.login.mockResolvedValue(user);
    repository.logout.mockResolvedValue(undefined);
    storage.getTokens.mockResolvedValue(null);

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      );
      await Promise.resolve();
    });
    expect(api.state.status).toBe('anonymous');

    await ReactTestRenderer.act(async () => {
      await api.login({ username: 'emilys', password: 'password' });
    });
    expect(api.state.status).toBe('authenticated');

    await ReactTestRenderer.act(async () => {
      await api.logout();
    });
    expect(api.state.status).toBe('anonymous');
    expect(repository.logout).toHaveBeenCalledTimes(1);
  });

  it('does not clear authenticated UI when logout storage operation fails', async () => {
    repository.getCurrentUser.mockResolvedValue(user);
    storage.getTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    repository.logout.mockRejectedValue(new Error('Storage unavailable'));

    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      );
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      await api.logout();
    });
    expect(api.state.status).toBe('authenticated');
    if (api.state.status === 'authenticated') {
      expect(api.state.logoutError).toBeTruthy();
    }
  });
});
