import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const useLoginForm = () => {
  const { state, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const isSubmitting =
    state.status === 'anonymous' && state.isSubmitting;
  const loginError =
    state.status === 'anonymous' ? state.loginError : undefined;

  const submit = (): void => {
    if (username.trim().length === 0 || password.trim().length === 0) {
      setValidationError('Introduce usuario y contraseña.');
      return;
    }

    setValidationError(null);
    login({ username, password }).then(() => undefined);
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    validationError,
    loginError,
    isSubmitting,
    submit,
  };
};
