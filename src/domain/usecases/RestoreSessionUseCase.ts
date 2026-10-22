import { AuthSessionRejectedError } from '../auth/AuthSessionRejectedError';
import { AuthTokens } from '../auth/AuthTokens';
import { AuthUser } from '../auth/AuthUser';
import { IAuthRepository } from '../auth/IAuthRepository';
import { InvalidStoredSessionError } from '../storage/InvalidStoredSessionError';
import { ISessionStorage } from '../storage/ISessionStorage';

export class RestoreSessionUseCase {
  constructor(
    private readonly sessionStorage: ISessionStorage,
    private readonly authRepository: IAuthRepository
  ) {}

  async execute(): Promise<AuthUser | null> {
    let tokens: AuthTokens | null;
    try {
      tokens = await this.sessionStorage.getTokens();
    } catch (error) {
      if (!(error instanceof InvalidStoredSessionError)) {
        throw error;
      }

      await this.sessionStorage.cleanStorage();
      return null;
    }

    if (tokens === null) {
      return null;
    }

    try {
      return await this.authRepository.getCurrentUser(tokens);
    } catch (error) {
      if (error instanceof AuthSessionRejectedError) {
        return null;
      }

      throw error;
    }
  }
}
