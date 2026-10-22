import { AuthCredentials } from '../auth/AuthCredentials';
import { AuthUser } from '../auth/AuthUser';
import { IAuthRepository } from '../auth/IAuthRepository';

export class LoginUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  execute(credentials: AuthCredentials): Promise<AuthUser> {
    return this.authRepository.login(credentials);
  }
}
