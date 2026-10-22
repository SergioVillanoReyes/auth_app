import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AuthCredentials } from '../../domain/auth/AuthCredentials';
import { AuthSessionRejectedError } from '../../domain/auth/AuthSessionRejectedError';
import { AuthUser } from '../../domain/auth/AuthUser';
import { HttpError } from '../../data/http/HttpError';
import { getAuthDependencies } from '../../core/di/authDependencies';

export type AuthState =
  | { status: 'initializing' }
  | { status: 'error'; message: string }
  | { status: 'anonymous'; loginError?: string; isSubmitting: boolean }
  | {
      status: 'authenticated';
      user: AuthUser;
      logoutError?: string;
      isLoggingOut: boolean;
    };

interface AuthContextValue {
  state: AuthState;
  retryInitialization(): Promise<void>;
  login(credentials: AuthCredentials): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const initializationErrorMessage = (error: unknown): string => {
  if (error instanceof AuthSessionRejectedError) {
    return 'La sesión ya no es válida. Inicia sesión nuevamente.';
  }
  return 'No se pudo verificar la sesión. Comprueba la conexión o el almacenamiento e inténtalo de nuevo.';
};

const loginErrorMessage = (error: unknown): string => {
  if (error instanceof HttpError && (error.status === 401 || error.status === 403)) {
    return 'El usuario o la contraseña no son correctos.';
  }
  if (error instanceof HttpError && error.status === 0) {
    return 'No se pudo conectar con el servicio. Inténtalo de nuevo.';
  }
  return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
};

export const AuthProvider = ({
  children,
}: PropsWithChildren): React.JSX.Element => {
  const [state, setState] = useState<AuthState>({ status: 'initializing' });
  const loginInProgress = useRef(false);

  const retryInitialization = useCallback(async (): Promise<void> => {
    setState({ status: 'initializing' });
    try {
      const { restoreSessionUseCase } = getAuthDependencies();
      const user = await restoreSessionUseCase.execute();
      setState(
        user === null
          ? { status: 'anonymous', isSubmitting: false }
          : { status: 'authenticated', user, isLoggingOut: false }
      );
    } catch (error) {
      setState({
        status: 'error',
        message: initializationErrorMessage(error),
      });
    }
  }, []);

  useEffect(() => {
    retryInitialization().then(() => undefined);
  }, [retryInitialization]);

  const login = useCallback(async (credentials: AuthCredentials): Promise<void> => {
    if (loginInProgress.current) {
      return;
    }

    if (
      credentials.username.trim().length === 0 ||
      credentials.password.trim().length === 0
    ) {
      setState({
        status: 'anonymous',
        loginError: 'Introduce usuario y contraseña.',
        isSubmitting: false,
      });
      return;
    }

    loginInProgress.current = true;
    setState({ status: 'anonymous', isSubmitting: true });
    try {
      const { loginUseCase } = getAuthDependencies();
      const user = await loginUseCase.execute(credentials);
      setState({ status: 'authenticated', user, isLoggingOut: false });
    } catch (error) {
      setState({
        status: 'anonymous',
        loginError: loginErrorMessage(error),
        isSubmitting: false,
      });
    } finally {
      loginInProgress.current = false;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    if (state.status !== 'authenticated') {
      return;
    }

    const { user } = state;
    setState({ status: 'authenticated', user, isLoggingOut: true });
    try {
      const { logoutUseCase } = getAuthDependencies();
      await logoutUseCase.execute();
      setState({ status: 'anonymous', isSubmitting: false });
    } catch {
      setState({
        status: 'authenticated',
        user,
        logoutError: 'No se pudo cerrar la sesión. Inténtalo de nuevo.',
        isLoggingOut: false,
      });
    }
  }, [state]);

  return (
    <AuthContext.Provider
      value={{ state, retryInitialization, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
