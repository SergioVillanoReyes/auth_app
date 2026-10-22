import { AuthCredentials } from '../../../domain/auth/AuthCredentials';
import { AuthSessionRejectedError } from '../../../domain/auth/AuthSessionRejectedError';
import { AuthTokens } from '../../../domain/auth/AuthTokens';
import { AuthUser } from '../../../domain/auth/AuthUser';
import { ISessionStorage } from '../../../domain/storage/ISessionStorage';
import {
  IAuthDataSource,
  InvalidAuthResponseError,
} from '../../../data/datasource/DummyJsonAuthDataSource';
import {
  AuthOperationCancelledError,
  AuthRepository,
} from '../../../data/repositories/AuthRepository';
import { HttpError } from '../../../data/http/HttpError';

const credentials: AuthCredentials = {
  username: 'emilys',
  password: 'password',
};

const oldTokens: AuthTokens = {
  accessToken: 'old-access',
  refreshToken: 'old-refresh',
};

const newTokens: AuthTokens = {
  accessToken: 'new-access',
  refreshToken: 'new-refresh',
};

const user: AuthUser = {
  id: 1,
  username: 'emilys',
};

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

describe('AuthRepository', () => {
  let authDataSource: jest.Mocked<IAuthDataSource>;
  let sessionStorage: jest.Mocked<ISessionStorage>;
  let repository: AuthRepository;

  beforeEach(() => {
    authDataSource = {
      login: jest.fn(),
      getCurrentUser: jest.fn(),
      refresh: jest.fn(),
    };
    sessionStorage = {
      getTokens: jest.fn(),
      saveTokens: jest.fn().mockResolvedValue(undefined),
      cleanStorage: jest.fn().mockResolvedValue(undefined),
    };
    repository = new AuthRepository(authDataSource, sessionStorage);
  });

  it('saves the login token pair before resolving the user', async () => {
    authDataSource.login.mockResolvedValue({ user, tokens: oldTokens });
    sessionStorage.saveTokens.mockImplementation(async () => {
      expect(authDataSource.login).toHaveBeenCalledWith(credentials);
    });

    await expect(repository.login(credentials)).resolves.toEqual(user);
    expect(sessionStorage.saveTokens).toHaveBeenCalledWith(oldTokens);
  });

  it('does not report login success if storing tokens fails', async () => {
    const error = new Error('Storage write failed');
    authDataSource.login.mockResolvedValue({ user, tokens: oldTokens });
    sessionStorage.saveTokens.mockRejectedValue(error);

    await expect(repository.login(credentials)).rejects.toBe(error);
  });

  it('renews after auth rejection, persists both tokens, then verifies again', async () => {
    authDataSource.getCurrentUser
      .mockRejectedValueOnce(new HttpError(401, 'Unauthorized'))
      .mockResolvedValueOnce(user);
    authDataSource.refresh.mockResolvedValue(newTokens);

    await expect(repository.getCurrentUser(oldTokens)).resolves.toEqual(user);
    expect(authDataSource.refresh).toHaveBeenCalledWith('old-refresh');
    expect(sessionStorage.saveTokens).toHaveBeenCalledWith(newTokens);
    expect(authDataSource.getCurrentUser).toHaveBeenNthCalledWith(
      2,
      'new-access'
    );
  });

  it('shares a single in-flight renewal between requests from one session', async () => {
    const refresh = createDeferred<AuthTokens>();
    authDataSource.getCurrentUser
      .mockRejectedValueOnce(new HttpError(401, 'Unauthorized'))
      .mockRejectedValueOnce(new HttpError(401, 'Unauthorized'))
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(user);
    authDataSource.refresh.mockReturnValue(refresh.promise);

    const first = repository.getCurrentUser(oldTokens);
    const second = repository.getCurrentUser(oldTokens);
    await Promise.resolve();
    await Promise.resolve();
    expect(authDataSource.refresh).toHaveBeenCalledTimes(1);

    refresh.resolve(newTokens);
    await expect(Promise.all([first, second])).resolves.toEqual([user, user]);
    expect(sessionStorage.saveTokens).toHaveBeenCalledTimes(1);
    expect(authDataSource.getCurrentUser).toHaveBeenNthCalledWith(
      3,
      'new-access'
    );
    expect(authDataSource.getCurrentUser).toHaveBeenNthCalledWith(
      4,
      'new-access'
    );
  });

  it('does not retry a protected request more than once after renewal', async () => {
    const authError = new HttpError(401, 'Unauthorized');
    authDataSource.getCurrentUser
      .mockRejectedValueOnce(authError)
      .mockRejectedValueOnce(authError);
    authDataSource.refresh.mockResolvedValue(newTokens);

    await expect(repository.getCurrentUser(oldTokens)).rejects.toBeInstanceOf(
      AuthSessionRejectedError
    );
    expect(authDataSource.refresh).toHaveBeenCalledTimes(1);
    expect(sessionStorage.cleanStorage).toHaveBeenCalledTimes(1);
    expect(authDataSource.getCurrentUser).toHaveBeenCalledTimes(2);
  });

  it('does not continue after renewing if persisting the new pair fails', async () => {
    const error = new Error('Storage write failed');
    authDataSource.getCurrentUser.mockRejectedValue(
      new HttpError(401, 'Unauthorized')
    );
    authDataSource.refresh.mockResolvedValue(newTokens);
    sessionStorage.saveTokens.mockRejectedValue(error);

    await expect(repository.getCurrentUser(oldTokens)).rejects.toBe(error);
    expect(authDataSource.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(sessionStorage.cleanStorage).not.toHaveBeenCalled();
  });

  it('cleans a definitively rejected refresh token', async () => {
    const error = new HttpError(401, 'Unauthorized');
    authDataSource.getCurrentUser.mockRejectedValue(
      new HttpError(401, 'Expired access token')
    );
    authDataSource.refresh.mockRejectedValue(error);

    await expect(repository.getCurrentUser(oldTokens)).rejects.toBeInstanceOf(
      AuthSessionRejectedError
    );
    expect(sessionStorage.cleanStorage).toHaveBeenCalledTimes(1);
  });

  it('cleans storage if refresh returns an invalid response', async () => {
    const error = new InvalidAuthResponseError();
    authDataSource.getCurrentUser.mockRejectedValue(
      new HttpError(401, 'Expired access token')
    );
    authDataSource.refresh.mockRejectedValue(error);

    await expect(repository.getCurrentUser(oldTokens)).rejects.toBeInstanceOf(
      AuthSessionRejectedError
    );
    expect(sessionStorage.cleanStorage).toHaveBeenCalledTimes(1);
  });

  it('does not persist a refresh response that arrives after logout', async () => {
    const refresh = createDeferred<AuthTokens>();
    authDataSource.getCurrentUser.mockRejectedValue(
      new HttpError(401, 'Expired access token')
    );
    authDataSource.refresh.mockReturnValue(refresh.promise);

    const restoreResult = repository.getCurrentUser(oldTokens);
    await Promise.resolve();
    await Promise.resolve();
    expect(authDataSource.refresh).toHaveBeenCalledTimes(1);

    await repository.logout();
    refresh.resolve(newTokens);

    await expect(restoreResult).rejects.toBeInstanceOf(
      AuthOperationCancelledError
    );
    expect(sessionStorage.cleanStorage).toHaveBeenCalledTimes(1);
    expect(sessionStorage.saveTokens).not.toHaveBeenCalled();
    expect(authDataSource.getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('prevents a login response from restoring session after logout', async () => {
    const login = createDeferred<{ user: AuthUser; tokens: AuthTokens }>();
    authDataSource.login.mockReturnValue(login.promise);
    const loginResult = repository.login(credentials);

    await repository.logout();
    login.resolve({ user, tokens: oldTokens });

    await expect(loginResult).rejects.toBeInstanceOf(
      AuthOperationCancelledError
    );
    expect(sessionStorage.cleanStorage).toHaveBeenCalledTimes(1);
    expect(sessionStorage.saveTokens).not.toHaveBeenCalled();
  });
});
