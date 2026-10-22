import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
      <Text style={styles.title}>auth_app</Text>
      <Text style={styles.subtitle}>Bienvenido, {state.user.username}</Text>
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
    backgroundColor: '#ffffff',
    flex: 1,
    padding: 24,
  },
  title: {
    alignSelf: 'center',
    color: '#1f2937',
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    alignSelf: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 8,
  },
  error: {
    color: '#b91c1c',
    textAlign: 'center',
    marginVertical: 16,
  },
  catalog: {
    flex: 1,
    marginTop: 24,
  },
});
