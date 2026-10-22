export class AuthSessionRejectedError extends Error {
  constructor() {
    super('The stored authentication session is no longer valid');
    this.name = 'AuthSessionRejectedError';
  }
}
