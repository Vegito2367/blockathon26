import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { HCESession, NFCTagType4, NFCTagType4NDEFContentType } from 'react-native-hce';

type PaymentStep = 'summary' | 'processing' | 'ready' | 'completed';

// Connect to the backend server
// Note: Changed from 10.0.2.2 to your Mac's local Wi-Fi IP address so a physical device can connect
const SOCKET_URL = 'http://10.104.84.121:3001';

export default function CryptoPayScreen() {
    const [step, setStep] = useState<PaymentStep>('summary');
    const [paymentData, setPaymentData] = useState<any>(null);
    const [hceSession, setHceSession] = useState<HCESession | null>(null);
    const { terminal_id = 'term_01' } = useLocalSearchParams<{ terminal_id: string }>();

    useEffect(() => {
        // Initialize socket connection
        const newSocket = io(SOCKET_URL);

        newSocket.on('connect', () => {
            console.log('Connected to backend:', newSocket.id);
            newSocket.emit('join_terminal', terminal_id);
        });

        newSocket.on('payment_intent', (data) => {
            console.log('Received payment intent:', data);
            setPaymentData(data);
            setStep('summary'); // Automatically show summary when a new payment intent arrives
        });

        newSocket.on('payment_success', (data) => {
            console.log('Payment successful:', data);
            setStep('completed');
        });

        return () => {
            newSocket.disconnect();

            // Cleanup HCE session explicitly on umount
            if (hceSession) {
                hceSession.setEnabled(false)
                    .then(() => console.log('HCE Session disabled on unmount'))
                    .catch((e: any) => console.error('Error disabling HCE session on unmount:', e));
            }
        };
    }, [terminal_id]);

    useEffect(() => {
        return () => {
            if (hceSession) {
                hceSession.setEnabled(false)
                    .then(() => console.log('HCE Session disabled on unmount'))
                    .catch((e: any) => console.error('Error disabling HCE session on unmount:', e));
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hceSession]);

    // Moved stopNfcBroadcast above where it's used or wrapping in useCallback
    const stopNfcBroadcast = async () => {
        try {
            if (hceSession) {
                await hceSession.setEnabled(false); // Make invisible to POS readers
                console.log('NFC broadcast stopped (disabled).');
            }
        } catch (error) {
            console.error('Error stopping NFC broadcast:', error);
        }
    };

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        if (step === 'processing') {
            timeout = setTimeout(() => {
                setStep('ready');
            }, 1000); // 1 seconds of processing indicator before showing 'Ready to Pay'
        } else if (step === 'ready' && paymentData) {
            // Start NFC broadcast
            startNfcBroadcast(paymentData);
        } else if (step === 'completed') {
            // Stop NFC broadcast once paid
            stopNfcBroadcast();
        }
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, paymentData, hceSession]);

    const startNfcBroadcast = async (data: any) => {
        try {
            // Convert payment intent to JSON string
            const payloadString = JSON.stringify(data);

            // Create a Text NDEF record to send
            const tag = new NFCTagType4({
                type: NFCTagType4NDEFContentType.Text,
                content: payloadString,
                writable: false
            });

            const session = await HCESession.getInstance();
            await session.setApplication(tag);
            await session.setEnabled(true);

            // On Android, start the listener. The library will register the HCE service.
            session.on(HCESession.Events.HCE_STATE_CONNECTED, () => {
                console.log('NFC Reader connected to HCE.');
            });
            session.on(HCESession.Events.HCE_STATE_DISCONNECTED, () => {
                console.log('NFC Reader disconnected from HCE.');
            });

            console.log('NFC payload broadcast started:', payloadString);
            setHceSession(session);
        } catch (error) {
            console.error('Error starting NFC broadcast:', error);
        }
    };

    const handlePayPress = () => {
        setStep('processing');
    };

    const handleTapToPay = () => {
        if (step === 'ready') {
            setStep('completed');
        }
    };

    const renderSummary = () => (
        <View style={styles.content}>
            <Text style={styles.title}>Order Summary</Text>
            <View style={styles.card}>
                <Text style={styles.itemName}>Crypto Bakery Order</Text>
                <Text style={styles.price}>${paymentData?.amountUsd?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>${paymentData?.amountUsd?.toFixed(2) || '0.00'}</Text>
            </View>

            <TouchableOpacity style={styles.payButton} onPress={handlePayPress}>
                <Text style={styles.payButtonText}>Pay with Crypto (NFC)</Text>
            </TouchableOpacity>
        </View>
    );

    const renderProcessing = () => (
        <View style={styles.centerContent}>
            <Text style={styles.statusText}>Initializing Payment...</Text>
            <View style={[styles.circle, styles.blueCircle]}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
            <Text style={styles.subText}>Connecting to backend...</Text>
        </View>
    );

    const renderReady = () => (
        <TouchableOpacity style={styles.centerContent} onPress={handleTapToPay} activeOpacity={0.8}>
            <Text style={styles.statusText}>Ready to Pay</Text>
            <View style={[styles.circle, styles.greenCircle]}>
                <Ionicons name="card-outline" size={60} color="#ffffff" />
            </View>
            <Text style={styles.subText}>Tap phone to terminal</Text>
        </TouchableOpacity>
    );

    const renderCompleted = () => (
        <View style={styles.centerContent}>
            <Text style={styles.statusText}>Payment Successful</Text>
            <View style={[styles.circle, styles.completedCircle]}>
                <Ionicons name="checkmark" size={60} color="#ffffff" />
            </View>
            <Text style={styles.subText}>Transaction confirmed</Text>
            <TouchableOpacity
                style={[styles.payButton, { marginTop: 40, width: '80%' }]}
                onPress={() => router.back()}
            >
                <Text style={styles.payButtonText}>Done</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* 
        Ensure header is shown if you want back navigation.
        If using expo-router, we might need a Stack.Screen configuration here 
      */}
            {step === 'summary' && renderSummary()}
            {step === 'processing' && renderProcessing()}
            {step === 'ready' && renderReady()}
            {step === 'completed' && renderCompleted()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    centerContent: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 32,
        color: '#1a1a1a',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#f8f9fa',
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    itemName: {
        fontSize: 16,
        color: '#333',
    },
    price: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        marginBottom: 48,
    },
    totalLabel: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    payButton: {
        backgroundColor: '#007AFF', // Blue
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    payButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
    statusText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 40,
        color: '#1a1a1a',
    },
    subText: {
        fontSize: 16,
        color: '#666',
        marginTop: 40,
    },
    circle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    blueCircle: {
        backgroundColor: '#007AFF',
    },
    greenCircle: {
        backgroundColor: '#34C759',
    },
    completedCircle: {
        backgroundColor: '#34C759', // Green tickmark
    },
});
