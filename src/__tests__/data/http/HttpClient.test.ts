import { HttpClient } from '../../../data/http/HttpClient';
import { HttpError } from '../../../data/http/HttpError';
import { INetworkChecker } from '../../../data/http/INetworkChecker';

const mockNetworkChecker: jest.Mocked<INetworkChecker> = {
  checkConnectivity: jest.fn(),
};

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('HttpClient', () => {
  let client: HttpClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNetworkChecker.checkConnectivity.mockResolvedValue();
    client = new HttpClient('https://example.com/api/v2', mockNetworkChecker);
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

  it('should call networkChecker before fetch', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: jest.fn().mockResolvedValue({}) });

    await client.get('/items');

    expect(mockNetworkChecker.checkConnectivity).toHaveBeenCalledTimes(1);
  });

  it('should propagate HttpError from networkChecker', async () => {
    mockNetworkChecker.checkConnectivity.mockRejectedValue(new HttpError(0, 'No internet connection'));

    await expect(client.get('/items')).rejects.toMatchObject({
      status: 0,
      message: 'No internet connection',
    });
  });
});
