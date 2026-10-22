import { HttpClient } from '../../../data/http/HttpClient';
import { HttpError } from '../../../data/http/HttpError';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('HttpClient', () => {
  let client: HttpClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new HttpClient('https://example.com/api/v2');
  });

  it('should return parsed JSON on successful response', async () => {
    const data = { results: [] };
    mockFetch.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue(data) });

    const result = await client.get('/items');

    expect(result).toEqual(data);
    expect(mockFetch).toHaveBeenCalledWith('https://example.com/api/v2/items');
  });

  it('should throw HttpError with status when response is not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });

    await expect(client.get('/items/9999')).rejects.toThrow(HttpError);
    await expect(client.get('/items/9999')).rejects.toMatchObject({ status: 404 });
  });

  it('should throw HttpError with status 0 on network error', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));

    await expect(client.get('/items')).rejects.toThrow(HttpError);
    await expect(client.get('/items')).rejects.toMatchObject({ status: 0 });
  });

  it('should use the requested endpoint to determine connectivity', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({}) });

    await client.get('/items');

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should post JSON with content type and custom headers', async () => {
    const body = { username: 'emilys', password: 'password' };
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ accessToken: 'token' }),
    });

    await expect(
      client.post('/auth/login', body, { 'X-Request-Id': 'test' })
    ).resolves.toEqual({ accessToken: 'token' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/v2/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': 'test',
        },
        body: JSON.stringify(body),
      }
    );
  });

  it('should pass custom headers to GET requests', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 1 }),
    });

    await client.get('/auth/me', { Authorization: 'Bearer token' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/api/v2/auth/me',
      {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      }
    );
  });

});
