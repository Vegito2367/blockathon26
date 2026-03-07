import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';

export interface PaymentData {
  to: string;
  value: string;
  chainId: number;
}

/**
 * Initialize the NFC manager. Call once at app startup.
 */
export async function initNfc(): Promise<boolean> {
  const supported = await NfcManager.isSupported();
  if (supported) {
    await NfcManager.start();
  }
  return supported;
}

/**
 * Scan an NDEF NFC tag and parse the payment JSON payload.
 * Returns { to, value, chainId } where value is in Wei (string).
 */
export async function scanPaymentTag(): Promise<PaymentData> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();

    if (!tag?.ndefMessage?.[0]?.payload) {
      throw new Error('No NDEF payload found on tag');
    }

    const payload = tag.ndefMessage[0].payload;
    const text = Ndef.text.decodePayload(new Uint8Array(payload));
    const data: PaymentData = JSON.parse(text);

    if (!data.to || !data.value || !data.chainId) {
      throw new Error('Invalid payment data: missing to, value, or chainId');
    }

    return data;
  } finally {
    await NfcManager.cancelTechnologyRequest().catch(() => {});
  }
}
