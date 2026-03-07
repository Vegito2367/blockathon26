import { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useAccount } from '@reown/appkit-react-native';
import { type Address } from 'viem';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getBalances } from '@/config/blockchain';

type Balances = Awaited<ReturnType<typeof getBalances>>;

export default function WalletScreen() {
  const { address, isConnected } = useAccount();
  const [balances, setBalances] = useState<Balances | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const b = await getBalances(address as Address);
      setBalances(b);
    } catch (e: any) {
      setError(e.message ?? 'Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchBalances();
    } else {
      setBalances(null);
    }
  }, [isConnected, address, fetchBalances]);

  if (!isConnected) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText style={styles.muted}>
          Connect your wallet on the Home tab to see balances.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchBalances} />
      }
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title">Wallet</ThemedText>
        <ThemedText style={styles.address}>
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </ThemedText>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Balances (Base Sepolia)
        </ThemedText>

        {loading && !balances && <ActivityIndicator size="large" style={{ marginTop: 24 }} />}

        {error && (
          <ThemedText style={styles.error}>{error}</ThemedText>
        )}

        {balances && (
          <View style={styles.balanceList}>
            <View style={styles.balanceRow}>
              <ThemedText style={styles.symbol}>ETH</ThemedText>
              <ThemedText style={styles.amount}>
                {parseFloat(balances.eth.formatted).toFixed(6)}
              </ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.balanceRow}>
              <ThemedText style={styles.symbol}>{balances.rlusd.symbol}</ThemedText>
              <ThemedText style={styles.amount}>
                {parseFloat(balances.rlusd.formatted).toFixed(2)}
              </ThemedText>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.refreshBtn} onPress={fetchBalances}>
          <ThemedText style={styles.refreshText}>Refresh</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
  },
  muted: {
    opacity: 0.5,
    textAlign: 'center',
  },
  address: {
    fontFamily: 'monospace',
    opacity: 0.6,
    marginTop: 4,
  },
  sectionTitle: {
    marginTop: 32,
  },
  balanceList: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(128,128,128,0.1)',
    padding: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  symbol: {
    fontSize: 18,
    fontWeight: '600',
  },
  amount: {
    fontSize: 18,
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  error: {
    color: '#ef4444',
    marginTop: 12,
  },
  refreshBtn: {
    marginTop: 24,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
