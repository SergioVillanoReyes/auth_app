import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthLoadingScreen } from '../screens/AuthLoadingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';

export const AppNavigator = (): React.JSX.Element => {
  const { state, retryInitialization } = useAuth();

  if (state.status === 'initializing') {
    return <AuthLoadingScreen />;
  }

  if (state.status === 'error') {
    return (
      <AuthLoadingScreen
        errorMessage={state.message}
        onRetry={() => {
          retryInitialization().then(() => undefined);
        }}
      />
    );
  }

  if (state.status === 'anonymous') {
    return <LoginScreen />;
  }

  return <HomeScreen />;
};
