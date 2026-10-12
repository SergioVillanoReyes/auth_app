import { StyleSheet, Text, View } from 'react-native';

export const HomeScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>auth_app</Text>
    <Text style={styles.subtitle}>Bienvenido</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#1f2937',
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 8,
  },
});
