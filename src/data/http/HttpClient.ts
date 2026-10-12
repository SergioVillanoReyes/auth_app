import { HttpError } from './HttpError';
import { INetworkChecker } from './INetworkChecker';

export class HttpClient {
  constructor(
    private baseUrl: string,
    private networkChecker: INetworkChecker
  ) {}

  async get<T>(path: string): Promise<T> {
    await this.networkChecker.checkConnectivity()
    try {
      const resp = await fetch(`${this.baseUrl}${path}`)
      if (!resp.ok) throw new HttpError(resp.status, resp.statusText)
      return await resp.json()
    } catch (err) {
      if (err instanceof HttpError) throw err
      throw new HttpError(0, 'Network error')
    }
  }
}
