import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mainnet, sepolia } from 'wagmi/chains';
import { baseSepolia } from 'viem/chains';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { createAppKit } from '@reown/appkit-react-native';
import { AppKitProvider } from '@reown/appkit-react-native';
import { AppKit } from '@reown/appkit-react-native';
import type { AppKitNetwork } from '@reown/appkit-react-native';

// --- Reown AppKit / Wagmi Configuration ---
const projectId = '9e134d6fa8014baa3c381450dd286df0'; // Replace with your WalletConnect Cloud project ID

// Networks cast needed: web adapter types differ from RN types at build time but work at runtime
const networks = [mainnet, sepolia, baseSepolia] as unknown as AppKitNetwork[];

const wagmiAdapter = new WagmiAdapter({
  networks: networks as any,
  projectId,
});

const queryClient = new QueryClient();

const metadata = {
  name: 'CryptoPay Client',
  description: 'NFC-powered crypto payment client',
  url: 'https://cryptopay.example.com',
  icons: ['https://cryptopay.example.com/icon.png'],
  redirect: {
    native: 'mobileclient://',
  },
};

// In-memory storage (sufficient for hackathon)
const storage = {
  getKeys: async () => Object.keys(_store),
  getEntries: async <T = any>() => Object.entries(_store) as [string, T][],
  getItem: async <T = any>(key: string) => _store[key] as T | undefined,
  setItem: async <T = any>(key: string, value: T) => { _store[key] = value; },
  removeItem: async (key: string) => { delete _store[key]; },
};
const _store: Record<string, any> = {};

const appKitInstance = createAppKit({
  projectId,
  metadata,
  networks,
  adapters: [wagmiAdapter as any],
  storage,
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppKitProvider instance={appKitInstance}>
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
          <AppKit />
        </QueryClientProvider>
      </WagmiProvider>
    </AppKitProvider>
  );
}
