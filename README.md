# NexusPay: Seamless NFC Crypto Payments

NexusPay is a full-stack solution for modern retail, enabling seamless, contactless crypto payments using NFC (Near Field Communication). It bridges traditional e-commerce with decentralized finance by allowing customers to pay with stablecoins (RLUSD/USDC) on Layer 2 (Base) while merchants receive instant settlement notifications and optional secondary settlement on the XRP Ledger.

## 🚀 Core Features

- **Contactless NFC Payments**: Uses Android Host Card Emulation (HCE) and iOS NFC scanning for a "Tap to Pay" experience.
- **Real-time Synchronization**: Socket.io integration ensures the Marketplace, Backend, and POS terminal stay in perfect sync during the checkout flow.
- **Stablecoin Support**: Optimized for RLUSD/USDC payments on Base Sepolia, providing price stability for both merchants and customers.
- **Multi-Chain Settlement**: Features a dual-chain approach—payments are executed on Base for low fees and high speed, with backend logic for XRPL settlement.
- **Sophisticated Mobile UX**: High-fidelity animations using Reanimated 3, including pulsing rings, swipe-to-pay gestures, and full-screen transitions.

## 🏗️ Architecture

The project is organized as a monorepo with four primary components:

### 1. Backend (`/backend`)

The central coordinator of the ecosystem.

- **Tech**: Node.js, Express, Socket.io, Viem.
- **Role**: Manages checkout sessions, routes payment intents to POS terminals, and verifies on-chain transactions on Base Sepolia.
- **Settlement**: Includes an XRPL settlement engine to facilitate merchant payouts on the XRP Ledger, leveraging established trust lines between the merchant and the treasury issuer.

### 2. Marketplace (`/marketplace`)

A customer-facing web storefront.

- **Tech**: Next.js, Tailwind CSS, Lucide React.
- **Role**: A mock "Artisan Bakery" where users select products and initiate the checkout process.

### 3. Mobile POS (`/mobilePOS`)

The merchant's point-of-sale application.

- **Tech**: Expo (React Native), React Native HCE, Socket.io-client.
- **Role**: Receives checkout intents from the backend and broadcasts payment details via NFC. Provides a visual interface for the merchant to track payment status.

### 4. Mobile Client (`/mobileClient`)

The customer's mobile wallet and payment app.

- **Tech**: Expo (React Native), Reown AppKit (WalletConnect), Viem, React Native NFC Manager.
- **Role**: Connects to the user's wallet, scans the merchant's POS via NFC, and executes the blockchain transaction.

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- Expo Go (for mobile testing) or Android/iOS Development Environment
- An Android device with NFC support (for the POS HCE feature)

### Installation

From the root directory, install all dependencies:

```bash
npm run install-all
```

### Environment Setup

1.  **Backend**: Create a `.env` file in `/backend` with:
    - `MERCHANT_WALLET_ADDRESS`: The EVM address receiving funds.
    - `BASE_SEPOLIA_RPC_URL`: Your RPC provider URL.
    - `XRPL_TREASURY_SEED`: (Optional) Seed for XRPL settlement.
2.  **Mobile**: Update the `SERVER_URL` or `SOCKET_URL` in the mobile apps to point to your backend's local IP address.

### Running the Project

1.  **Start Backend**: `cd backend && npm start`
2.  **Start Marketplace**: `cd marketplace && npm run dev`
3.  **Start Mobile POS**: `cd mobilePOS && npx expo start`
4.  **Start Mobile Client**: `cd mobileClient && npx expo start`

## 🔄 Payment Flow

1.  **Initiate**: Customer selects items on the **Marketplace** and clicks Checkout.
2.  **Broadcast**: **Backend** alerts the **Mobile POS** via WebSockets.
3.  **NFC Tap**: **Mobile POS** broadcasts payment data via NFC. The customer taps their **Mobile Client** phone to the POS.
4.  **Authorize**: **Mobile Client** parses the NFC data and prompts the user to "Slide to Pay".
5.  **Settle**: The transaction is sent to **Base Sepolia**. The **Backend** detects the on-chain event and notifies both devices of the successful payment.

## 🏆 Hackathon Context

This project was built for **Midwest Blockathon '26**, showcasing the practical application of RLUSD and cross-chain interoperability in a real-world retail environment.
