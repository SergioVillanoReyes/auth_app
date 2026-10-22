import {
  INativeStorageDataSource,
  NativeStorageDataSource,
} from '../../../data/datasource/NativeStorageDataSource';

describe('NativeStorageDataSource', () => {
  it('delegates reads, writes and removal to the existing native module', async () => {
    const nativeModule: jest.Mocked<INativeStorageDataSource> = {
      getItem: jest.fn().mockResolvedValue('serialized-session'),
      setItem: jest.fn().mockResolvedValue(undefined),
      removeItem: jest.fn().mockResolvedValue(undefined),
    };
    const source = new NativeStorageDataSource(nativeModule);

    await expect(source.getItem('auth_session')).resolves.toBe(
      'serialized-session'
    );
    await source.setItem('auth_session', 'serialized-session');
    await source.removeItem('auth_session');

    expect(nativeModule.getItem).toHaveBeenCalledWith('auth_session');
    expect(nativeModule.setItem).toHaveBeenCalledWith(
      'auth_session',
      'serialized-session'
    );
    expect(nativeModule.removeItem).toHaveBeenCalledWith('auth_session');
  });

  it('fails explicitly when the native module is missing required methods', () => {
    expect(() => new NativeStorageDataSource({ getItem: jest.fn() })).toThrow(
      'Native StorageModule is unavailable or incomplete'
    );
  });

  it('propagates native method failures', async () => {
    const error = new Error('Native operation failed');
    const nativeModule: jest.Mocked<INativeStorageDataSource> = {
      getItem: jest.fn().mockRejectedValue(error),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    const source = new NativeStorageDataSource(nativeModule);

    await expect(source.getItem('auth_session')).rejects.toBe(error);
  });
});
