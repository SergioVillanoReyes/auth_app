import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { glass } from './src/core/theme';
import { AuthProvider } from './src/presentation/context/AuthContext';
import { AppNavigator } from './src/presentation/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View pointerEvents="none" style={styles.background}>
          <View style={styles.blueGlow} />
          <View style={styles.yellowGlow} />
        </View>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: glass.background,
    flex: 1,
  },
  background: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  blueGlow: {
    backgroundColor: glass.blueGlow,
    borderRadius: 220,
    height: 440,
    left: -170,
    position: 'absolute',
    top: -150,
    width: 440,
  },
  yellowGlow: {
    backgroundColor: glass.yellowGlow,
    borderRadius: 200,
    bottom: -170,
    height: 400,
    position: 'absolute',
    right: -140,
    width: 400,
  },
});
