import { AuthCredentials } from './AuthCredentials';
import { AuthTokens } from './AuthTokens';
import { AuthUser } from './AuthUser';

export interface IAuthRepository {
  /** Resolves only after authentication succeeds and the returned session is saved. */
  login(credentials: AuthCredentials): Promise<AuthUser>;

  /** Verifies the supplied token snapshot and persists any successful renewal before resolving. */
  getCurrentUser(tokens: AuthTokens): Promise<AuthUser>;

  /** Removes the local session before resolving. */
  logout(): Promise<void>;
}
