import { AuthTokens } from '../../../domain/auth/AuthTokens';
import { InvalidStoredSessionError } from '../../../domain/storage/InvalidStoredSessionError';
import { INativeStorageDataSource } from '../../../data/datasource/NativeStorageDataSource';
import { SessionStorage } from '../../../data/storage/SessionStorage';

const SESSION_KEY = 'auth_session';

describe('SessionStorage', () => {
  let dataSource: jest.Mocked<INativeStorageDataSource>;
  let storage: SessionStorage;

  beforeEach(() => {
    dataSource = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    storage = new SessionStorage(dataSource);
  });

  it('returns null when no session is stored', async () => {
    dataSource.getItem.mockResolvedValue(null);

    await expect(storage.getTokens()).resolves.toBeNull();
    expect(dataSource.getItem).toHaveBeenCalledWith(SESSION_KEY);
  });

  it('reads both tokens from one stored session object', async () => {
    const tokens: AuthTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };
    dataSource.getItem.mockResolvedValue(JSON.stringify(tokens));

    await expect(storage.getTokens()).resolves.toEqual(tokens);
    expect(dataSource.getItem).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['malformed JSON', '{'],
    ['missing refresh token', '{"accessToken":"access-token"}'],
    ['empty token', '{"accessToken":"","refreshToken":"refresh-token"}'],
  ])('rejects %s stored data', async (_description, serialized) => {
    dataSource.getItem.mockResolvedValue(serialized);

    await expect(storage.getTokens()).rejects.toBeInstanceOf(
      InvalidStoredSessionError
    );
  });

  it('propagates native read errors instead of treating them as absence', async () => {
    const error = new Error('Native read failed');
    dataSource.getItem.mockRejectedValue(error);

    await expect(storage.getTokens()).rejects.toBe(error);
  });

  it('persists the token pair together under one key', async () => {
    const tokens: AuthTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };
    dataSource.setItem.mockResolvedValue();

    await storage.saveTokens(tokens);

    expect(dataSource.setItem).toHaveBeenCalledWith(
      SESSION_KEY,
      JSON.stringify(tokens)
    );
  });

  it('rejects invalid tokens instead of persisting them', async () => {
    await expect(
      storage.saveTokens({ accessToken: '', refreshToken: 'refresh-token' })
    ).rejects.toBeInstanceOf(InvalidStoredSessionError);
    expect(dataSource.setItem).not.toHaveBeenCalled();
  });

  it('propagates native write errors', async () => {
    const error = new Error('Native write failed');
    dataSource.setItem.mockRejectedValue(error);

    await expect(
      storage.saveTokens({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })
    ).rejects.toBe(error);
  });

  it('removes the session key and propagates removal errors', async () => {
    dataSource.removeItem.mockResolvedValue();
    await expect(storage.cleanStorage()).resolves.toBeUndefined();
    expect(dataSource.removeItem).toHaveBeenCalledWith(SESSION_KEY);

    const error = new Error('Native remove failed');
    dataSource.removeItem.mockRejectedValue(error);
    await expect(storage.cleanStorage()).rejects.toBe(error);
  });
});
