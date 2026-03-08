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
  Dimensions
} from 'react-native';
import NfcManager, { NfcTech, Ndef, NfcEvents, TagEvent } from 'react-native-nfc-manager';

// --- Types ---
interface RLUSDPaymentPayload {
  type: 'RLUSD_PAY';
  tokenAddress: string;
  to: string;
  amountRaw: string;
  amountUsd: number;
  chainId: number;
}

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
    outputRange: [0.8, 2.5], // Expands from 80% to 250% size
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0], // Fades out
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
      await NfcManager.start();
    };

    initNfc();

    // Set up persistent NDEF listener
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
      NfcManager.unregisterTagEvent().catch(() => 0); // Stop listening after one successful read
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

      // Register tag event listener. This is an alternative to requestTechnology
      // that sometimes works better with Android HCE tags.
      await NfcManager.registerTagEvent();

      // Setting a timeout in case no tag is found
      setTimeout(() => {
        if (isScanning) {
          NfcManager.unregisterTagEvent().catch(() => 0);
          setIsScanning(false);
          console.log('NFC scan timeout');
        }
      }, 15000); // 15 seconds timeout

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

  return (
    <View style={styles.container}>

      {/* --- Scanning UI State --- */}
      {isScanning ? (
        <View style={styles.scannerContainer}>
          <View style={styles.pulseWrapper}>
            {/* Multiple rings for ripple effect */}
            <PulsingRing delay={0} />
            <PulsingRing delay={600} />
            <PulsingRing delay={1200} />

            {/* Center Anchor */}
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
        /* --- Idle / Result UI State --- */
        <>
          <TouchableOpacity style={styles.scanButton} onPress={readNfc}>
            <Text style={styles.scanButtonText}>
              {payload ? 'Scan Another Payment' : 'Tap to Receive Payment'}
            </Text>
          </TouchableOpacity>

          {payload && (
            <ScrollView style={styles.resultContainer}>
              <Text style={styles.header}>Payment Received</Text>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Amount USD</Text>
                <Text style={styles.amountValue}>${payload.amountUsd.toFixed(2)}</Text>
              </View>

              <View style={styles.detailBox}>
                <Text style={styles.detailLabel}>Raw Amount:</Text>
                <Text style={styles.detailValue}>{payload.amountRaw}</Text>

                <Text style={styles.detailLabel}>Merchant:</Text>
                <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">{payload.to}</Text>

                <Text style={styles.detailLabel}>Token:</Text>
                <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="middle">{payload.tokenAddress}</Text>

                <Text style={styles.detailLabel}>Chain ID:</Text>
                <Text style={styles.detailValue}>{payload.chainId}</Text>
              </View>
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
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  // --- Scanner Styles ---
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
  // --- Result Styles ---
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
});