import { AuthCredentials } from '../../domain/auth/AuthCredentials';
import { AuthSessionRejectedError } from '../../domain/auth/AuthSessionRejectedError';
import { AuthTokens } from '../../domain/auth/AuthTokens';
import { AuthUser } from '../../domain/auth/AuthUser';
import { IAuthRepository } from '../../domain/auth/IAuthRepository';
import { ISessionStorage } from '../../domain/storage/ISessionStorage';
import {
  IAuthDataSource,
  InvalidAuthResponseError,
} from '../datasource/DummyJsonAuthDataSource';
import { HttpError } from '../http/HttpError';

interface CompletedRenewal {
  sourceRefreshToken: string;
  tokens: AuthTokens;
  generation: number;
}

interface ActiveRenewal {
  sourceRefreshToken: string;
  generation: number;
  promise: Promise<AuthTokens>;
}

export class AuthOperationCancelledError extends Error {
  constructor() {
    super('Authentication operation was cancelled by a newer session action');
    this.name = 'AuthOperationCancelledError';
  }
}

const isAuthenticationRejection = (error: unknown): error is HttpError =>
  error instanceof HttpError && (error.status === 401 || error.status === 403);

export class AuthRepository implements IAuthRepository {
  private activeRenewal: ActiveRenewal | null = null;
  private completedRenewal: CompletedRenewal | null = null;
  private operationGeneration = 0;
  private mutationQueue: Promise<void> = Promise.resolve();

  constructor(
    private readonly authDataSource: IAuthDataSource,
    private readonly sessionStorage: ISessionStorage
  ) {}

  async login(credentials: AuthCredentials): Promise<AuthUser> {
    const generation = this.operationGeneration;
    const response = await this.authDataSource.login(credentials);

    await this.enqueueMutation(async () => {
      this.ensureCurrentGeneration(generation);
      this.operationGeneration += 1;
      const saveGeneration = this.operationGeneration;
      this.completedRenewal = null;
      this.activeRenewal = null;
      await this.sessionStorage.saveTokens(response.tokens);
      this.ensureCurrentGeneration(saveGeneration);
    });

    return response.user;
  }

  async getCurrentUser(tokens: AuthTokens): Promise<AuthUser> {
    const generation = this.operationGeneration;
    try {
      const user = await this.authDataSource.getCurrentUser(tokens.accessToken);
      this.ensureCurrentGeneration(generation);
      return user;
    } catch (error) {
      if (!isAuthenticationRejection(error)) {
        throw error;
      }
    }

    this.ensureCurrentGeneration(generation);
    const renewedTokens = await this.renew(tokens, generation);
    try {
      const user = await this.authDataSource.getCurrentUser(
        renewedTokens.accessToken
      );
      this.ensureCurrentGeneration(generation);
      return user;
    } catch (error) {
      if (isAuthenticationRejection(error)) {
        await this.enqueueMutation(async () => {
          this.ensureCurrentGeneration(generation);
          await this.sessionStorage.cleanStorage();
        });
        this.completedRenewal = null;
        throw new AuthSessionRejectedError();
      }

      throw error;
    }
  }

  async logout(): Promise<void> {
    this.operationGeneration += 1;
    this.completedRenewal = null;
    this.activeRenewal = null;
    await this.enqueueMutation(() => this.sessionStorage.cleanStorage());
  }

  private renew(tokens: AuthTokens, generation: number): Promise<AuthTokens> {
    const completed = this.completedRenewal;
    if (
      completed?.sourceRefreshToken === tokens.refreshToken &&
      completed.generation === generation
    ) {
      return Promise.resolve(completed.tokens);
    }

    const active = this.activeRenewal;
    if (
      active?.sourceRefreshToken === tokens.refreshToken &&
      active.generation === generation
    ) {
      return active.promise;
    }

    const promise = this.performRenewal(tokens, generation);
    this.activeRenewal = {
      sourceRefreshToken: tokens.refreshToken,
      generation,
      promise,
    };

    const clearActiveRenewal = (): void => {
      if (this.activeRenewal?.promise === promise) {
        this.activeRenewal = null;
      }
    };
    promise.then(clearActiveRenewal, clearActiveRenewal);

    return promise;
  }

  private async performRenewal(
    tokens: AuthTokens,
    generation: number
  ): Promise<AuthTokens> {
    let renewedTokens: AuthTokens;
    try {
      renewedTokens = await this.authDataSource.refresh(
        tokens.refreshToken
      );
    } catch (error) {
      if (
        isAuthenticationRejection(error) ||
        error instanceof InvalidAuthResponseError
      ) {
        await this.enqueueMutation(async () => {
          this.ensureCurrentGeneration(generation);
          await this.sessionStorage.cleanStorage();
        });
        this.completedRenewal = null;
        throw new AuthSessionRejectedError();
      }

      throw error;
    }

    await this.enqueueMutation(async () => {
      this.ensureCurrentGeneration(generation);
      await this.sessionStorage.saveTokens(renewedTokens);
    });

    this.ensureCurrentGeneration(generation);
    this.completedRenewal = {
      sourceRefreshToken: tokens.refreshToken,
      tokens: renewedTokens,
      generation,
    };

    return renewedTokens;
  }

  private enqueueMutation<T>(mutation: () => Promise<T>): Promise<T> {
    const currentMutation = this.mutationQueue.then(mutation, mutation);
    this.mutationQueue = currentMutation.then(
      () => undefined,
      () => undefined
    );
    return currentMutation;
  }

  private ensureCurrentGeneration(generation: number): void {
    if (generation !== this.operationGeneration) {
      throw new AuthOperationCancelledError();
    }
  }
}
