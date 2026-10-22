import { AuthTokens } from '../auth/AuthTokens';

export interface ISessionStorage {
  getTokens(): Promise<AuthTokens | null>;
  saveTokens(tokens: AuthTokens): Promise<void>;
  cleanStorage(): Promise<void>;
}
