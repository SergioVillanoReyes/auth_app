import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppButton } from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen = (): React.JSX.Element => {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>
      <TextInput
        accessibilityLabel="Usuario"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isSubmitting}
        onChangeText={setUsername}
        placeholder="Usuario"
        style={styles.input}
        value={username}
      />
      <TextInput
        accessibilityLabel="Contraseña"
        editable={!isSubmitting}
        onChangeText={setPassword}
        placeholder="Contraseña"
        secureTextEntry
        style={styles.input}
        value={password}
      />
      {validationError || loginError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {validationError || loginError}
        </Text>
      ) : null}
      {isSubmitting ? (
        <ActivityIndicator accessibilityLabel="Iniciando sesión" />
      ) : (
        <AppButton
          text="Entrar"
          onPress={submit}
          variant="primary"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#1f2937',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderColor: '#9ca3af',
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
    padding: 12,
  },
  error: {
    color: '#b91c1c',
    marginBottom: 16,
  },
});
