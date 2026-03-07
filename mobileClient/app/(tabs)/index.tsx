import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useAppKit, useAccount } from '@reown/appkit-react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        CryptoPay
      </ThemedText>

      {isConnected ? (
        <View style={styles.connected}>
          <ThemedText style={styles.check}>Wallet Connected</ThemedText>
          <ThemedText style={styles.address}>
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </ThemedText>

          <TouchableOpacity style={styles.button} onPress={() => open()}>
            <ThemedText style={styles.buttonText}>Account Details</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.disconnected}>
          <ThemedText style={styles.subtitle}>
            Connect your wallet to get started
          </ThemedText>

          <TouchableOpacity style={styles.button} onPress={() => open()}>
            <ThemedText style={styles.buttonText}>Connect Wallet</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    marginBottom: 32,
  },
  subtitle: {
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
  connected: {
    alignItems: 'center',
    gap: 16,
  },
  disconnected: {
    alignItems: 'center',
  },
  check: {
    fontSize: 18,
    fontWeight: '600',
    color: '#22c55e',
  },
  address: {
    fontSize: 16,
    opacity: 0.6,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
