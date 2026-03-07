import React from 'react'
import { SafeAreaView, Text, View } from 'react-native'
import ConnectButton from '@/components/connectbutton'
import { useAccount } from '@reown/appkit-react-native'

export default function HomeScreen() {
  const { address, isConnected, chainId } = useAccount()

  return (
    <SafeAreaView style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>Wallet Demo</Text>
      <ConnectButton />
      {isConnected && (
        <View style={{ marginTop: 24, gap: 4 }}>
          <Text>Chain ID: {String(chainId)}</Text>
          <Text numberOfLines={1}>Address: {address}</Text>
        </View>
      )}
    </SafeAreaView>
  )
}