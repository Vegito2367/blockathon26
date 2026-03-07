import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { useAppKit, useAccount } from '@reown/appkit-react-native'

function ConnectButton() {
  const { open, disconnect } = useAppKit()
  const { address, isConnected, chainId } = useAccount()

  if (isConnected) {
    return (
      <View style={{ gap: 8 }}>
        <Text>Connected to: {String(chainId)}</Text>
        <Text numberOfLines={1}>Address: {address}</Text>
        <Pressable
          onPress={() => disconnect()}
          style={{ backgroundColor: '#ef4444', padding: 12, borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Disconnect</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <Pressable
      onPress={() => open()}
      style={{ backgroundColor: '#111827', padding: 12, borderRadius: 8 }}
    >
      <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Connect Wallet</Text>
    </Pressable>
  )
}

export default ConnectButton