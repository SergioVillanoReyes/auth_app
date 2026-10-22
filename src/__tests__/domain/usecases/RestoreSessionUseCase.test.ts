import { AuthSessionRejectedError } from '../../../domain/auth/AuthSessionRejectedError';
import { AuthTokens } from '../../../domain/auth/AuthTokens';
import { AuthUser } from '../../../domain/auth/AuthUser';
import { IAuthRepository } from '../../../domain/auth/IAuthRepository';
import { InvalidStoredSessionError } from '../../../domain/storage/InvalidStoredSessionError';
import { ISessionStorage } from '../../../domain/storage/ISessionStorage';
import { RestoreSessionUseCase } from '../../../domain/usecases/RestoreSessionUseCase';

describe('RestoreSessionUseCase', () => {
  const tokens: AuthTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };
  const user: AuthUser = { id: 1, username: 'emilys' };
  let sessionStorage: jest.Mocked<ISessionStorage>;
  let authRepository: jest.Mocked<IAuthRepository>;
  let useCase: RestoreSessionUseCase;

  beforeEach(() => {
    sessionStorage = {
      getTokens: jest.fn(),
      saveTokens: jest.fn(),
      cleanStorage: jest.fn().mockResolvedValue(undefined),
    };
    authRepository = {
      login: jest.fn(),
      getCurrentUser: jest.fn(),
      logout: jest.fn(),
    };
    useCase = new RestoreSessionUseCase(sessionStorage, authRepository);
  });

  it('returns no user when the session key is absent', async () => {
    sessionStorage.getTokens.mockResolvedValue(null);

    await expect(useCase.execute()).resolves.toBeNull();
    expect(authRepository.getCurrentUser).not.toHaveBeenCalled();
    expect(sessionStorage.cleanStorage).not.toHaveBeenCalled();
  });

  it('verifies one coherent token pair before returning the user', async () => {
    sessionStorage.getTokens.mockResolvedValue(tokens);
    authRepository.getCurrentUser.mockResolvedValue(user);

    await expect(useCase.execute()).resolves.toEqual(user);
    expect(sessionStorage.getTokens).toHaveBeenCalledTimes(1);
    expect(authRepository.getCurrentUser).toHaveBeenCalledWith(tokens);
  });

  it('cleans malformed stored data before returning no session', async () => {
    sessionStorage.getTokens.mockRejectedValue(new InvalidStoredSessionError());

    await expect(useCase.execute()).resolves.toBeNull();
    expect(sessionStorage.cleanStorage).toHaveBeenCalledTimes(1);
    expect(authRepository.getCurrentUser).not.toHaveBeenCalled();
  });

  it('propagates storage read failures instead of treating them as absence', async () => {
    const error = new Error('Storage read failed');
    sessionStorage.getTokens.mockRejectedValue(error);

    await expect(useCase.execute()).rejects.toBe(error);
    expect(sessionStorage.cleanStorage).not.toHaveBeenCalled();
  });

  it('propagates cleanup failures for malformed session data', async () => {
    const error = new Error('Storage cleanup failed');
    sessionStorage.getTokens.mockRejectedValue(new InvalidStoredSessionError());
    sessionStorage.cleanStorage.mockRejectedValue(error);

    await expect(useCase.execute()).rejects.toBe(error);
  });

  it('returns no user for a definitively rejected session', async () => {
    sessionStorage.getTokens.mockResolvedValue(tokens);
    authRepository.getCurrentUser.mockRejectedValue(
      new AuthSessionRejectedError()
    );

    await expect(useCase.execute()).resolves.toBeNull();
  });

  it('propagates transient verification failures for retry', async () => {
    const error = new Error('Network unavailable');
    sessionStorage.getTokens.mockResolvedValue(tokens);
    authRepository.getCurrentUser.mockRejectedValue(error);

    await expect(useCase.execute()).rejects.toBe(error);
  });
});
