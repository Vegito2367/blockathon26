import { createPublicClient, http, formatUnits, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';

// RLUSD stand-in (USDC on Base Sepolia)
export const RLUSD_TOKEN_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;
export const RLUSD_DECIMALS = 6;
export const RLUSD_SYMBOL = 'RLUSD';

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export async function getBalances(address: Address) {
  const [ethBalanceRaw, rlusdBalanceRaw] = await Promise.all([
    publicClient.getBalance({ address }),
    publicClient.readContract({
      address: RLUSD_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    }),
  ]);

  return {
    eth: {
      symbol: 'ETH',
      raw: ethBalanceRaw,
      formatted: formatUnits(ethBalanceRaw, 18),
    },
    rlusd: {
      symbol: RLUSD_SYMBOL,
      raw: rlusdBalanceRaw,
      formatted: formatUnits(rlusdBalanceRaw, RLUSD_DECIMALS),
    },
  };
}
