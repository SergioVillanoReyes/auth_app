import { DummyJsonAuthDataSource } from '../../../data/datasource/DummyJsonAuthDataSource';
import { HttpClient } from '../../../data/http/HttpClient';

const createResponse = (body: unknown): Response => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: new Headers(),
  redirected: false,
  type: 'basic',
  url: '',
  body: null,
  bodyUsed: false,
  bytes: jest.fn(),
  json: jest.fn().mockResolvedValue(body),
  clone: jest.fn(),
  arrayBuffer: jest.fn(),
  blob: jest.fn(),
  formData: jest.fn(),
  text: jest.fn(),
}) as unknown as Response;

describe('DummyJsonAuthDataSource', () => {
  let httpClient: HttpClient;
  let source: DummyJsonAuthDataSource;

  beforeEach(() => {
    jest.clearAllMocks();
    httpClient = new HttpClient('https://dummyjson.com');
    source = new DummyJsonAuthDataSource(httpClient);
  });

  it('posts credentials and maps the login user and token pair', async () => {
    const response = {
      id: 1,
      username: 'emilys',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(createResponse(response));

    await expect(
      source.login({ username: 'emilys', password: 'password' })
    ).resolves.toEqual({
      user: { id: 1, username: 'emilys' },
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://dummyjson.com/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'emilys', password: 'password' }),
      })
    );
    fetchMock.mockRestore();
  });

  it('sends the access token as a bearer header to auth/me', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        createResponse({ id: 1, username: 'emilys' })
      );

    await expect(source.getCurrentUser('access-token')).resolves.toEqual({
      id: 1,
      username: 'emilys',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://dummyjson.com/auth/me',
      expect.objectContaining({
        headers: { Authorization: 'Bearer access-token' },
      })
    );
    fetchMock.mockRestore();
  });

  it('posts the refresh token and rejects incomplete token responses', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        createResponse({
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
        })
      )
      .mockResolvedValueOnce(createResponse({ accessToken: 'new-access' }));

    await expect(source.refresh('refresh-token')).resolves.toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
    await expect(source.refresh('refresh-token')).rejects.toThrow(
      'DummyJSON returned an invalid authentication response'
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://dummyjson.com/auth/refresh',
      expect.objectContaining({
        body: JSON.stringify({ refreshToken: 'refresh-token' }),
      })
    );
    fetchMock.mockRestore();
  });
});
