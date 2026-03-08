import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import NfcManager, { NfcTech, Ndef, NfcEvents, TagEvent } from 'react-native-nfc-manager';
import { useProvider, useAccount } from '@reown/appkit-react-native';

// --- Types ---
interface RLUSDPaymentPayload {
  type: 'RLUSD_PAY';
  tokenAddress: string;
  to: string;
  amountRaw: string;
  amountUsd: number;
  chainId: number;
}

// ERC-20 transfer(address,uint256) function selector
const ERC20_TRANSFER_SELECTOR = '0xa9059cbb';

function encodeErc20Transfer(to: string, amountRaw: string): string {
  // Pad address to 32 bytes (remove 0x prefix, left-pad to 64 hex chars)
  const paddedAddress = to.slice(2).toLowerCase().padStart(64, '0');
  // Convert amount to hex and pad to 32 bytes
  const amountHex = BigInt(amountRaw).toString(16).padStart(64, '0');
  return `${ERC20_TRANSFER_SELECTOR}${paddedAddress}${amountHex}`;
}

const SERVER_URL = "http://10.104.84.121:3001"
// --- Visual Component: Pulsating Ring ---
const PulsingRing = ({ delay }: { delay: number }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animValue, {
        toValue: 1,
        duration: 2000,
        delay: delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [delay]);

  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 2.5],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
};

export default function NfcReceiver() {
  const [payload, setPayload] = useState<RLUSDPaymentPayload | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { provider } = useProvider();
  const { address, isConnected } = useAccount();

  useEffect(() => {
    const initNfc = async () => {
      try {
        await NfcManager.start();
        const supported = await NfcManager.isSupported();
        if (!supported) {
          Alert.alert('NFC Error', 'NFC is not supported on this device');
        }
      } catch (e) {
        console.warn('NFC start error:', e);
      }
    };

    initNfc();

    NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
      console.log('NFC Background Tag Discovered:', tag);

      if (tag && tag.ndefMessage && tag.ndefMessage.length > 0) {
        try {
          const ndefRecord = tag.ndefMessage[0];
          const text = Ndef.text.decodePayload(ndefRecord.payload as unknown as Uint8Array);
          const data = JSON.parse(text);
          console.log('NFC Background Tag Data:', data);

          if (data.type === 'RLUSD_PAY') {
            setPayload(data);
          } else {
            Alert.alert('Invalid Tag', 'This is not an RLUSD payment tag.');
          }
        } catch (err) {
          console.error('Error parsing background NDEF tag:', err);
        }
      }
      NfcManager.unregisterTagEvent().catch(() => 0);
      setIsScanning(false);
    });

    return () => {
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      NfcManager.cancelTechnologyRequest();
    };
  }, []);

  const readNfc = async () => {
    try {
      setIsScanning(true);
      setPayload(null);
      setTxHash(null);

      await NfcManager.registerTagEvent();

      setTimeout(() => {
        if (isScanning) {
          NfcManager.unregisterTagEvent().catch(() => 0);
          setIsScanning(false);
          console.log('NFC scan timeout');
        }
      }, 15000);

    } catch (ex) {
      console.log('NFC Register Tag Event Error:', ex);
      setIsScanning(false);
      NfcManager.unregisterTagEvent().catch(() => 0);
    }
  };

  const cancelScan = async () => {
    NfcManager.unregisterTagEvent();
    setIsScanning(false);
  };

  const sendPayment = async () => {
    if (!payload) return;

    if (!isConnected || !provider || !address) {
      Alert.alert('Wallet Not Connected', 'Please connect your wallet on the Home tab first.');
      return;
    }

    try {
      setIsSending(true);

      // Get raw address without CAIP prefix
      const fromAddress = address.includes(':') ? address.split(':').pop()! : address;

      const data = encodeErc20Transfer(payload.to, payload.amountRaw);

      const chainIdHex = `0x${payload.chainId.toString(16)}`;

      const txHash = await provider.request<string>({
        method: 'eth_sendTransaction',
        params: [{
          from: fromAddress,
          to: payload.tokenAddress,
          data: data,
          value: '0x0',
        }],
      }, `eip155:${payload.chainId}`);

      console.log('Transaction sent:', txHash);
      setTxHash(txHash);
      Alert.alert('Payment Sent!', `TX: ${txHash}`);
    } catch (error: any) {
      console.error('Transaction error:', error);
      Alert.alert('Transaction Failed', error?.message || 'Failed to send transaction');
    } finally {
      setIsSending(false);
    }
  };


  return (
    <View style={styles.container}>

      {/* --- Scanning UI State --- */}
      {isScanning ? (
        <View style={styles.scannerContainer}>
          <View style={styles.pulseWrapper}>
            <PulsingRing delay={0} />
            <PulsingRing delay={600} />
            <PulsingRing delay={1200} />

            <View style={styles.centerAnchor}>
              <Text style={styles.nfcIcon}>NFC</Text>
            </View>
          </View>

          <Text style={styles.scanningText}>Hold near sender...</Text>

          <TouchableOpacity style={styles.cancelButton} onPress={cancelScan}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.scanButton} onPress={readNfc}>
            <Text style={styles.scanButtonText}>
              {payload ? 'Scan Another Payment' : 'Tap to Receive Payment'}
            </Text>
          </TouchableOpacity>

          {payload && (
            <ScrollView style={styles.resultContainer}>
              <Text style={styles.header}>Payment Request</Text>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Amount USD</Text>
                <Text style={styles.amountValue}>${payload.amountUsd.toFixed(2)}</Text>
              </View>


              {txHash ? (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>Payment Sent!</Text>
                  <Text style={styles.txHash} numberOfLines={1} ellipsizeMode="middle">{txHash}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.payButton, isSending && styles.payButtonDisabled]}
                  onPress={sendPayment}
                  disabled={isSending}
                >
                  {isSending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.payButtonText}>Confirm & Pay ${payload.amountUsd.toFixed(2)}</Text>
                  )}
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding:20,
    paddingTop: 50,
    justifyContent: 'center',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  scannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  pulseWrapper: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  centerAnchor: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
  },
  nfcIcon: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  scanningText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
  },
  cancelButton: {
    marginTop: 30,
    padding: 10,
  },
  cancelText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    elevation: 3,
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resultContainer: {
    width: width - 40,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#eee',
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  detailBox: {
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
    backgroundColor: '#eee',
    padding: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  label: {
    fontSize: 16,
    color: '#555',
  },
  payButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  successText: {
    color: '#2E7D32',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  txHash: {
    fontSize: 12,
    color: '#555',
    fontFamily: 'monospace',
  },
});