import { createAppKit } from '@reown/appkit-react-native';
import { EthersAdapter } from '@reown/appkit-ethers-react-native';
import type { AppKitNetwork, Storage } from '@reown/appkit-common-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage wrapper that satisfies the AppKit Storage interface
const appKitStorage: Storage = {
  async getKeys() {
    return AsyncStorage.getAllKeys() as Promise<string[]>;
  },
  async getEntries<T = any>() {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys as string[]);
    return pairs.map(([k, v]) => [k, v ? JSON.parse(v) : undefined] as [string, T]);
  },
  async getItem<T = any>(key: string) {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  },
  async setItem<T = any>(key: string, value: T) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
  },
};

// Base Sepolia isn't pre-bundled in the RN SDK — define it manually
const baseSepolia: AppKitNetwork = {
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.base.org'] },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
  },
  testnet: true,
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:84532',
};

const PROJECT_ID = '9e134d6fa8014baa3c381450dd286df0';

const metadata = {
  name: 'CryptoPay',
  description: 'Tap-to-Pay with RLUSD',
  url: 'https://cryptopay.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
  redirect: {
    native: 'mobileclient://',
  },
};

createAppKit({
  projectId: PROJECT_ID,
  metadata,
  networks: [baseSepolia],
  adapters: [new EthersAdapter()],
  storage: appKitStorage,
  enableAnalytics: false,
});
