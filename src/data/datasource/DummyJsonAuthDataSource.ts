import { AuthCredentials } from '../../domain/auth/AuthCredentials';
import { AuthTokens } from '../../domain/auth/AuthTokens';
import { AuthUser } from '../../domain/auth/AuthUser';
import { HttpClient } from '../http/HttpClient';

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface IAuthDataSource {
  login(credentials: AuthCredentials): Promise<LoginResponse>;
  getCurrentUser(accessToken: string): Promise<AuthUser>;
  refresh(refreshToken: string): Promise<AuthTokens>;
}

export class InvalidAuthResponseError extends Error {
  constructor() {
    super('DummyJSON returned an invalid authentication response');
    this.name = 'InvalidAuthResponseError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isAuthUser = (value: unknown): value is AuthUser =>
  isRecord(value) &&
  typeof value.id === 'number' &&
  typeof value.username === 'string' &&
  value.username.trim().length > 0;

const isToken = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const parseLoginResponse = (response: unknown): LoginResponse => {
  if (
    !isRecord(response) ||
    !isAuthUser(response) ||
    !isToken(response.accessToken) ||
    !isToken(response.refreshToken)
  ) {
    throw new InvalidAuthResponseError();
  }

  return {
    user: {
      id: response.id,
      username: response.username,
    },
    tokens: {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    },
  };
};

const parseRefreshResponse = (response: unknown): AuthTokens => {
  if (
    !isRecord(response) ||
    !isToken(response.accessToken) ||
    !isToken(response.refreshToken)
  ) {
    throw new InvalidAuthResponseError();
  }

  return {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  };
};

export class DummyJsonAuthDataSource implements IAuthDataSource {
  constructor(private readonly httpClient: HttpClient) {}

  async login(credentials: AuthCredentials): Promise<LoginResponse> {
    const response = await this.httpClient.post<unknown>(
      '/auth/login',
      credentials
    );
    return parseLoginResponse(response);
  }

  async getCurrentUser(accessToken: string): Promise<AuthUser> {
    const response = await this.httpClient.get<unknown>('/auth/me', {
      Authorization: `Bearer ${accessToken}`,
    });

    if (!isAuthUser(response)) {
      throw new InvalidAuthResponseError();
    }

    return {
      id: response.id,
      username: response.username,
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const response = await this.httpClient.post<unknown>('/auth/refresh', {
      refreshToken,
    });
    return parseRefreshResponse(response);
  }
}
