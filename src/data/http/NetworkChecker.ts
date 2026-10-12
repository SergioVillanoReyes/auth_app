import { HttpError } from './HttpError';
import { INetworkChecker } from './INetworkChecker';

export class NetworkChecker implements INetworkChecker {
  async checkConnectivity(): Promise<void> {
    try {
      await fetch('https://www.google.com', { method: 'HEAD' })
    } catch (err) {
      if (err instanceof TypeError) {
        throw new HttpError(0, 'No internet connection')
      }
      throw new HttpError(0, 'Network error')
    }
  }
}
