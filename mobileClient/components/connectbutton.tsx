import React, { useEffect, useRef } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useAppKit, useAccount } from '@reown/appkit-react-native'
import { sepolia } from 'viem/chains'

const SEPOLIA_CHAIN_ID = sepolia.id // 11155111

function ConnectButton() {
  const { open, disconnect, switchNetwork } = useAppKit()
  const { address, isConnected, chainId } = useAccount()
  const didAutoSwitch = useRef(false)

  // Auto-switch to Sepolia right after connecting if on wrong chain
  useEffect(() => {
    if (isConnected && chainId && chainId !== SEPOLIA_CHAIN_ID && !didAutoSwitch.current) {
      didAutoSwitch.current = true
      switchNetwork(sepolia).catch(() => {})
    }
    if (!isConnected) {
      didAutoSwitch.current = false
    }
  }, [isConnected, chainId, switchNetwork])

  if (isConnected) {
    return (
      <View style={{ gap: 8 }}>
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