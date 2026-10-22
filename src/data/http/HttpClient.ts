import { HttpError } from './HttpError';

export class HttpClient {
  constructor(private baseUrl: string) {}

  async get<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(path, {
      method: 'GET',
      headers,
    });
  }

  async post<T>(
    path: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });
  }

  private async request<T>(
    path: string,
    options: {
      method: 'GET' | 'POST';
      headers?: Record<string, string>;
      body?: string;
    }
  ): Promise<T> {
    try {
      const hasOptions = options.headers !== undefined || options.body !== undefined;
      const resp = hasOptions
        ? await fetch(`${this.baseUrl}${path}`, options)
        : await fetch(`${this.baseUrl}${path}`);
      if (!resp.ok) throw new HttpError(resp.status, resp.statusText)
      return await resp.json()
    } catch (err) {
      if (err instanceof HttpError) throw err
      throw new HttpError(0, 'Network error')
    }
  }
}
