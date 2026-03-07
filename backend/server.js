// /backend/server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { baseSepolia } from 'viem/chains';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

// --- CONFIGURATION ---
// USDC on Base Sepolia (standing in for RLUSD in hackathon)
const RLUSD_TOKEN_ADDRESS = "0xbD84621010fF42EB5bF72872BE6ec6FE67Db546f";
const RLUSD_DECIMALS = 18;
const CHAIN_ID = 84532; // Base Sepolia

// Merchant receives RLUSD directly — no treasury middleman
const MERCHANT_WALLET = process.env.MERCHANT_WALLET_ADDRESS;

if (!MERCHANT_WALLET) {
  console.error("❌ MERCHANT_WALLET_ADDRESS not set in .env — exiting.");
  process.exit(1);
}

// --- BLOCKCHAIN CLIENT ---
const ethClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC_URL || undefined),
});

// --- SESSION STORE ---
// Map<terminalId, SessionData>
const activeSessions = new Map();

// Reverse lookup: merchant address (lowercase) -> Set of terminal IDs with PENDING sessions
// Allows matching on‑chain transfers to the right session
function pendingTerminalsForMerchant(merchantAddr) {
  const addr = merchantAddr.toLowerCase();
  const matches = [];
  for (const [terminalId, session] of activeSessions) {
    if (session.status === 'PENDING' && session.merchantAddress.toLowerCase() === addr) {
      matches.push(terminalId);
    }
  }
  return matches;
}

// ─────────────────────────────────────────────
// 1. CHECKOUT ENDPOINT
//    Laptop Kiosk → Backend
// ─────────────────────────────────────────────
app.post('/api/checkout', (req, res) => {
  const { amount_usd, terminal_id } = req.body;

  if (!amount_usd || !terminal_id) {
    return res.status(400).json({ error: "Missing amount_usd or terminal_id" });
  }
  if (typeof amount_usd !== 'number' || amount_usd <= 0) {
    return res.status(400).json({ error: "amount_usd must be a positive number" });
  }

  // 6‑decimal precision for RLUSD / USDC
  const rawAmount = BigInt(Math.round(amount_usd * 10 ** RLUSD_DECIMALS)).toString();

  console.log(`[Checkout] terminal=${terminal_id} | $${amount_usd} → ${MERCHANT_WALLET}`);

  // Store session
  activeSessions.set(terminal_id, {
    status: 'PENDING',
    amount_usd,
    rawAmount,
    merchantAddress: MERCHANT_WALLET,
    createdAt: Date.now(),
  });

  // Push NFC payload to the Android POS via WebSocket
  // The POS will broadcast this over HCE so the iOS client can read & sign
  io.to(terminal_id).emit('payment_intent', {
    type: 'RLUSD_PAY',
    tokenAddress: RLUSD_TOKEN_ADDRESS,
    to: MERCHANT_WALLET,        // Direct to merchant — no middleman
    amountRaw: rawAmount,
    amountUsd: amount_usd,
    chainId: CHAIN_ID,
  });

  res.json({ success: true, terminal_id, amount_usd, rawAmount });
});

// ─────────────────────────────────────────────
// 2. SESSION STATUS ENDPOINT
//    Laptop Kiosk can poll this for current state
// ─────────────────────────────────────────────
app.get('/api/session/:terminal_id', (req, res) => {
  const session = activeSessions.get(req.params.terminal_id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json({
    terminal_id: req.params.terminal_id,
    status: session.status,
    amount_usd: session.amount_usd,
    txHash: session.txHash || null,
  });
});

// ─────────────────────────────────────────────
// 3. HEALTH CHECK
// ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, activeSessions: activeSessions.size });
});

// ─────────────────────────────────────────────
// 4. ON‑CHAIN EVENT WATCHER
//    Watches for RLUSD (USDC) Transfer events
//    TO the merchant wallet on Base Sepolia
// ─────────────────────────────────────────────
ethClient.watchEvent({
  address: RLUSD_TOKEN_ADDRESS,
  event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
  args: { to: MERCHANT_WALLET },
  onLogs: async (logs) => {
    for (const log of logs) {
      const txHash = log.transactionHash;
      const receivedRaw = log.args.value?.toString();

      console.log(`[Base Sepolia] RLUSD Transfer detected → tx: ${txHash}`);

      // Find all PENDING sessions for this merchant
      const terminalIds = pendingTerminalsForMerchant(MERCHANT_WALLET);

      for (const terminalId of terminalIds) {
        const session = activeSessions.get(terminalId);
        if (!session || session.status !== 'PENDING') continue;

        // Optional: verify the amount matches (tolerance‑free for demo)
        if (receivedRaw && receivedRaw !== session.rawAmount) {
          console.log(`[Base Sepolia] Amount mismatch for ${terminalId}: expected ${session.rawAmount}, got ${receivedRaw}`);
          continue;
        }

        // Mark as completed immediately (direct settlement — one hop)
        session.status = 'COMPLETED';
        session.txHash = txHash;

        console.log(`[Success] terminal=${terminalId} | tx=${txHash}`);

        // Notify both the Laptop Kiosk (Device A) and the Android POS (Device B)
        io.to(terminalId).emit('payment_success', {
          amount: session.amount_usd,
          txHash,
          explorerUrl: `https://sepolia.basescan.org/tx/${txHash}`,
        });

        // Clean up after 5 minutes
        setTimeout(() => activeSessions.delete(terminalId), 300_000);

        // Only match one session per transfer
        break;
      }
    }
  },
});

// ─────────────────────────────────────────────
// 5. SOCKET.IO — Room management
// ─────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // Devices join a room identified by the terminal ID (e.g. "term_01")
  socket.on('join_terminal', (terminalId) => {
    socket.join(terminalId);
    console.log(`[Socket] ${socket.id} joined room ${terminalId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

// ─────────────────────────────────────────────
// 6. START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`✅ CryptoPay backend running on port ${PORT}`);
  console.log(`   Merchant wallet: ${MERCHANT_WALLET}`);
  console.log(`   Token (RLUSD):   ${RLUSD_TOKEN_ADDRESS}`);
  console.log(`   Chain:           Base Sepolia (${CHAIN_ID})`);
});