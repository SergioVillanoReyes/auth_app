import { AuthTokens } from '../../domain/auth/AuthTokens';
import { InvalidStoredSessionError } from '../../domain/storage/InvalidStoredSessionError';
import { ISessionStorage } from '../../domain/storage/ISessionStorage';
import { INativeStorageDataSource } from '../datasource/NativeStorageDataSource';

const SESSION_STORAGE_KEY = 'auth_session';

const isAuthTokens = (value: unknown): value is AuthTokens => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const tokens = value as Record<string, unknown>;
  return (
    typeof tokens.accessToken === 'string' &&
    tokens.accessToken.trim().length > 0 &&
    typeof tokens.refreshToken === 'string' &&
    tokens.refreshToken.trim().length > 0
  );
};

export class SessionStorage implements ISessionStorage {
  constructor(private readonly dataSource: INativeStorageDataSource) {}

  async getTokens(): Promise<AuthTokens | null> {
    const serializedTokens = await this.dataSource.getItem(SESSION_STORAGE_KEY);
    if (serializedTokens === null) {
      return null;
    }

    let parsedTokens: unknown;
    try {
      parsedTokens = JSON.parse(serializedTokens);
    } catch {
      throw new InvalidStoredSessionError();
    }

    if (!isAuthTokens(parsedTokens)) {
      throw new InvalidStoredSessionError();
    }

    return {
      accessToken: parsedTokens.accessToken,
      refreshToken: parsedTokens.refreshToken,
    };
  }

  async saveTokens(tokens: AuthTokens): Promise<void> {
    if (!isAuthTokens(tokens)) {
      throw new InvalidStoredSessionError();
    }

    await this.dataSource.setItem(SESSION_STORAGE_KEY, JSON.stringify(tokens));
  }

  cleanStorage(): Promise<void> {
    return this.dataSource.removeItem(SESSION_STORAGE_KEY);
  }
}
