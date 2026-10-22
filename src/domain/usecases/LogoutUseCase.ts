import { IAuthRepository } from '../auth/IAuthRepository';

export class LogoutUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  execute(): Promise<void> {
    return this.authRepository.logout();
  }
}
