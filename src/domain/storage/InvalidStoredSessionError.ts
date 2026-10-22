export class InvalidStoredSessionError extends Error {
  constructor() {
    super('Stored session data is invalid');
    this.name = 'InvalidStoredSessionError';
  }
}
