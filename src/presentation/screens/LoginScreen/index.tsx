import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, glass, radius, spacing } from '../../../core/theme';
import { AppButton } from '../../components/AppButton';
import { useLoginForm } from '../../hooks/useLoginForm';

export const LoginScreen = (): React.JSX.Element => {
  const {
    username,
    setUsername,
    password,
    setPassword,
    validationError,
    loginError,
    isSubmitting,
    submit,
  } = useLoginForm();

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.title}>Iniciar sesión</Text>
        <TextInput
          accessibilityLabel="Usuario"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSubmitting}
          onChangeText={setUsername}
          placeholder="Usuario"
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.primary}
          style={styles.input}
          value={username}
        />
        <TextInput
          accessibilityLabel="Contraseña"
          editable={!isSubmitting}
          onChangeText={setPassword}
          placeholder="Contraseña"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          selectionColor={colors.primary}
          style={styles.input}
          value={password}
        />
        {validationError || loginError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {validationError || loginError}
          </Text>
        ) : null}
        {isSubmitting ? (
          <ActivityIndicator
            accessibilityLabel="Iniciando sesión"
            color={colors.primary}
          />
        ) : (
          <AppButton
            text="Entrar"
            onPress={submit}
            variant="primary"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  panel: {
    backgroundColor: glass.surface,
    borderColor: glass.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    maxWidth: 440,
    padding: spacing.xl,
    width: '100%',
    shadowColor: glass.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: glass.surfaceRaised,
    borderColor: glass.border,
    borderRadius: radius.md,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
    padding: 12,
    color: colors.textPrimary,
  },
  error: {
    backgroundColor: glass.surfaceError,
    borderColor: glass.errorBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    color: '#b91c1c',
    marginBottom: 16,
    overflow: 'hidden',
    padding: spacing.sm,
  },
});
