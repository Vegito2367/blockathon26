import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAppKit } from '@reown/appkit-react-native';
import { useSendTransaction, useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { initNfc, scanPaymentTag, type PaymentData } from '@/src/services/NfcService';

type Status = 'IDLE' | 'SCANNING' | 'CONFIRMING' | 'SENDING' | 'SUCCESS' | 'ERROR';

export default function PaymentScreen() {
  const { isConnected, address } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { open } = useAppKit();

  const [status, setStatus] = useState<Status>('IDLE');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState('');

  useEffect(() => {
    initNfc().then(setNfcSupported).catch(() => setNfcSupported(false));
  }, []);

  const handleScan = async () => {
    setStatus('SCANNING');
    setErrorMsg('');
    try {
      const data = await scanPaymentTag();
      setPaymentData(data);
      setStatus('CONFIRMING');
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'NFC scan failed');
      setStatus('ERROR');
    }
  };

  const handleConfirmPay = async () => {
    if (!paymentData) return;
    setStatus('SENDING');
    try {
      const hash = await sendTransactionAsync({
        to: paymentData.to as `0x${string}`,
        value: BigInt(paymentData.value),
        chainId: paymentData.chainId,
      });
      setTxHash(hash);
      setStatus('SUCCESS');
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Transaction failed');
      setStatus('ERROR');
    }
  };

  const handleReset = () => {
    setStatus('IDLE');
    setPaymentData(null);
    setErrorMsg('');
    setTxHash('');
  };

  const displayValue = paymentData
    ? formatEther(BigInt(paymentData.value))
    : '';

  const canScan = isConnected && nfcSupported && status === 'IDLE';

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>CryptoPay Client</Text>

      {/* Wallet Button */}
      <View style={styles.walletSection}>
        <TouchableOpacity
          style={styles.walletButton}
          onPress={() => open({ view: isConnected ? 'Account' : 'Connect' })}
          activeOpacity={0.7}
        >
          <Text style={styles.walletButtonText}>
            {isConnected
              ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
              : 'Connect Wallet'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* NFC Status */}
      {nfcSupported === false && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>NFC is not supported on this device</Text>
        </View>
      )}

      {/* Main Action Button */}
      <View style={styles.actionSection}>
        {status === 'IDLE' && (
          <TouchableOpacity
            style={[styles.scanButton, !canScan && styles.scanButtonDisabled]}
            onPress={handleScan}
            disabled={!canScan}
            activeOpacity={0.7}
          >
            <Text style={styles.scanIcon}>📡</Text>
            <Text style={styles.scanButtonText}>
              {!isConnected ? 'Connect Wallet First' : 'TAP TO PAY'}
            </Text>
          </TouchableOpacity>
        )}

        {status === 'SCANNING' && (
          <View style={styles.scanButton}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.scanButtonText}>Hold near NFC tag...</Text>
          </View>
        )}

        {status === 'SUCCESS' && (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successText}>Payment Sent!</Text>
            {txHash && (
              <Text style={styles.txHashText} numberOfLines={2}>
                TX: {txHash}
              </Text>
            )}
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>New Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'ERROR' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'SENDING' && (
          <View style={styles.scanButton}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.scanButtonText}>Sending transaction...</Text>
          </View>
        )}
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={status === 'CONFIRMING'}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Payment</Text>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Amount</Text>
              <Text style={styles.modalValue}>{displayValue} ETH</Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>To</Text>
              <Text style={styles.modalValueSmall} numberOfLines={1}>
                {paymentData?.to}
              </Text>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Chain ID</Text>
              <Text style={styles.modalValue}>{paymentData?.chainId}</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleReset}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmPay}
              >
                <Text style={styles.confirmButtonText}>Confirm Pay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  walletSection: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  walletButton: {
    backgroundColor: '#1e2340',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  walletButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  warningBanner: {
    backgroundColor: '#3d2000',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    color: '#ffb020',
    textAlign: 'center',
    fontSize: 14,
  },
  actionSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  scanButtonDisabled: {
    backgroundColor: '#2a2e45',
    shadowOpacity: 0,
    elevation: 0,
  },
  scanIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    gap: 12,
  },
  successIcon: {
    fontSize: 64,
  },
  successText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22c55e',
  },
  txHashText: {
    color: '#8b8fa3',
    fontSize: 11,
    fontFamily: 'monospace',
    textAlign: 'center',
    maxWidth: 300,
  },
  errorContainer: {
    alignItems: 'center',
    gap: 12,
  },
  errorIcon: {
    fontSize: 64,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    maxWidth: 300,
  },
  resetButton: {
    backgroundColor: '#1e2340',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  resetButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#151934',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2340',
  },
  modalLabel: {
    fontSize: 14,
    color: '#8b8fa3',
  },
  modalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  modalValueSmall: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'monospace',
    maxWidth: 200,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1e2340',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#8b8fa3',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
