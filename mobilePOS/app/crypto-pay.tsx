import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type PaymentStep = 'summary' | 'processing' | 'ready' | 'completed';

export default function CryptoPayScreen() {
    const [step, setStep] = useState<PaymentStep>('summary');

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        if (step === 'processing') {
            timeout = setTimeout(() => {
                setStep('ready');
            }, 3000); // 3 seconds of processing
        } else if (step === 'ready') {
            // Auto-complete after tapping or some timeout (e.g., 5 seconds for simulation)
            timeout = setTimeout(() => {
                setStep('completed');
            }, 5000);
        }
        return () => clearTimeout(timeout);
    }, [step]);

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
                <Text style={styles.itemName}>1x Crypto Bakery Order</Text>
                <Text style={styles.price}>$24.50</Text>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>$24.50</Text>
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
