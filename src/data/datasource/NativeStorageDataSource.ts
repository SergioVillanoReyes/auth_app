import { NativeModules } from 'react-native';

export interface INativeStorageDataSource {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

interface NativeStorageModule {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const isNativeStorageModule = (value: unknown): value is NativeStorageModule => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.getItem === 'function' &&
    typeof candidate.setItem === 'function' &&
    typeof candidate.removeItem === 'function'
  );
};

export class NativeStorageDataSource implements INativeStorageDataSource {
  private readonly module: NativeStorageModule;

  constructor(moduleCandidate: unknown = NativeModules.StorageModule) {
    if (!isNativeStorageModule(moduleCandidate)) {
      throw new Error('Native StorageModule is unavailable or incomplete');
    }

    this.module = moduleCandidate;
  }

  getItem(key: string): Promise<string | null> {
    return this.module.getItem(key);
  }

  setItem(key: string, value: string): Promise<void> {
    return this.module.setItem(key, value);
  }

  removeItem(key: string): Promise<void> {
    return this.module.removeItem(key);
  }
}
