import { IAuthRepository } from '../../domain/auth/IAuthRepository';
import { ISessionStorage } from '../../domain/storage/ISessionStorage';
import { LoginUseCase } from '../../domain/usecases/LoginUseCase';
import { LogoutUseCase } from '../../domain/usecases/LogoutUseCase';
import { RestoreSessionUseCase } from '../../domain/usecases/RestoreSessionUseCase';
import { DummyJsonAuthDataSource } from '../../data/datasource/DummyJsonAuthDataSource';
import { NativeStorageDataSource } from '../../data/datasource/NativeStorageDataSource';
import { AuthRepository } from '../../data/repositories/AuthRepository';
import { SessionStorage } from '../../data/storage/SessionStorage';
import { HttpClient } from '../../data/http/HttpClient';

export interface AuthDependencies {
  loginUseCase: LoginUseCase;
  logoutUseCase: LogoutUseCase;
  restoreSessionUseCase: RestoreSessionUseCase;
}

let dependencies: AuthDependencies | null = null;

export const getAuthDependencies = (): AuthDependencies => {
  if (dependencies === null) {
    const sessionStorage: ISessionStorage = new SessionStorage(
      new NativeStorageDataSource()
    );
    const authRepository: IAuthRepository = new AuthRepository(
      new DummyJsonAuthDataSource(new HttpClient('https://dummyjson.com')),
      sessionStorage
    );

    dependencies = {
      loginUseCase: new LoginUseCase(authRepository),
      logoutUseCase: new LogoutUseCase(authRepository),
      restoreSessionUseCase: new RestoreSessionUseCase(
        sessionStorage,
        authRepository
      ),
    };
  }

  return dependencies;
};
