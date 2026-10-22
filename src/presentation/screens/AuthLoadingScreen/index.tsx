import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, glass, radius, spacing } from '../../../core/theme';
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
    <View style={styles.panel}>
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
          <ActivityIndicator
            accessibilityLabel="Verificando sesión"
            color={colors.primary}
          />
          <Text style={styles.message}>Verificando sesión...</Text>
        </>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  panel: {
    alignItems: 'center',
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
  message: {
    color: colors.textPrimary,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
});
