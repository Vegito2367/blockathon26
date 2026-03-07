import React, { useEffect, useState } from 'react'
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import ConnectButton from '@/components/connectbutton'
import { useAccount } from '@reown/appkit-react-native'

const SEPOLIA_RPC = 'https://ethereum-sepolia-rpc.publicnode.com'

async function fetchSepoliaBalance(address: string): Promise<string> {
  const res = await fetch(SEPOLIA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBalance',
      params: [address, 'latest'],
    }),
  })
  const data = await res.json()
  if (!data?.result) return '0'
  const wei = BigInt(data.result)
  const eth = Number(wei) / 1e18
  return eth.toFixed(6)
}

function shortenAddress(addr: string) {
  const raw = addr.includes(':') ? addr.split(':').pop()! : addr
  return `${raw.slice(0, 6)}...${raw.slice(-4)}`
}

export default function HomeScreen() {
  const { address, isConnected } = useAccount()
  const [balance, setBalance] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isConnected || !address) {
      setBalance(null)
      return
    }

    let cancelled = false
    setLoading(true)

    const raw = address.includes(':') ? address.split(':').pop()! : address

    fetchSepoliaBalance(raw)
      .then((b) => { if (!cancelled) setBalance(b) })
      .catch(() => { if (!cancelled) setBalance(null) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [isConnected, address])

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>CryptoPay</Text>
        <Text style={styles.subtitle}>Sepolia Testnet</Text>
      </View>

      {!isConnected ? (
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>💳</Text>
          </View>
          <Text style={styles.heroTitle}>Connect Your Wallet</Text>
          <Text style={styles.heroDescription}>
            Link your wallet to view your Sepolia ETH balance and start transacting.
          </Text>
          <View style={styles.connectWrapper}>
            <ConnectButton />
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#6366f1" style={{ marginVertical: 12 }} />
            ) : (
              <Text style={styles.balanceAmount}>{balance ?? '0'} <Text style={styles.balanceCurrency}>ETH</Text></Text>
            )}
            <View style={styles.networkBadge}>
              <View style={styles.networkDot} />
              <Text style={styles.networkText}>Sepolia Testnet</Text>
            </View>
          </View>

          {/* Wallet Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Wallet</Text>
              <Text style={styles.infoValue}>{address ? shortenAddress(address) : '—'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Connected</Text>
              </View>
            </View>
          </View>

          {/* Disconnect */}
          <View style={styles.disconnectWrapper}>
            <ConnectButton />
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },

  // Disconnected hero
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 36,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  connectWrapper: {
    width: '100%',
  },

  // Connected content
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  balanceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#f8fafc',
    marginVertical: 4,
  },
  balanceCurrency: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748b',
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#a78bfa',
    marginRight: 6,
  },
  networkText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },

  // Info card
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    fontFamily: 'monospace',
  },
  infoDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#334155',
    marginVertical: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34d399',
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34d399',
  },
  disconnectWrapper: {
    marginTop: 8,
  },
})