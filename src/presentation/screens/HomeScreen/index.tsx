import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, glass, radius, spacing } from '../../../core/theme';
import { AppButton } from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';
import { ProductsCatalogScreen } from '../ProductsCatalogScreen';

export const HomeScreen = (): React.JSX.Element => {
  const { state, logout } = useAuth();

  if (state.status !== 'authenticated') {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>auth_app</Text>
        <Text style={styles.subtitle}>Bienvenido, {state.user.username}</Text>
      </View>
      {state.logoutError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {state.logoutError}
        </Text>
      ) : null}
      <View style={styles.catalog}>
        <ProductsCatalogScreen />
      </View>
      <AppButton
        text={state.isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
        onPress={() => {
          logout().then(() => undefined);
        }}
        variant="secondary"
        disabled={state.isLoggingOut}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    backgroundColor: glass.surface,
    borderColor: glass.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
    shadowColor: glass.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 5,
  },
  title: {
    alignSelf: 'center',
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    alignSelf: 'center',
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 8,
  },
  error: {
    backgroundColor: glass.surfaceError,
    borderColor: glass.errorBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    color: '#b91c1c',
    marginVertical: 16,
    overflow: 'hidden',
    padding: spacing.sm,
    textAlign: 'center',
  },
  catalog: {
    flex: 1,
    marginTop: spacing.lg,
  },
});
