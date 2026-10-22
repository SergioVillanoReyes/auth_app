import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';

interface AuthLoadingScreenProps {
  errorMessage?: string;
  onRetry?: () => void;
}

export const AuthLoadingScreen = ({
  errorMessage,
  onRetry,
}: AuthLoadingScreenProps): React.JSX.Element => (
  <View style={styles.container}>
    {errorMessage ? (
      <>
        <Text accessibilityRole="alert" style={styles.message}>
          {errorMessage}
        </Text>
        {onRetry ? (
          <AppButton
            text="Reintentar"
            onPress={onRetry}
            variant="primary"
          />
        ) : null}
      </>
    ) : (
      <>
        <ActivityIndicator accessibilityLabel="Verificando sesión" />
        <Text style={styles.message}>Verificando sesión...</Text>
      </>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    color: '#1f2937',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
});
