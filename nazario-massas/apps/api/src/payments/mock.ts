import QRCode from 'qrcode';
import type { Order } from '@nazario/shared';
import { offlinePayment, type PaymentProvider } from './types';

/** EMV "Pix copia e cola" helpers (BR Code). */
const field = (id: string, value: string) => `${id}${value.length.toString().padStart(2, '0')}${value}`;

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

function buildPixPayload(order: Order): string {
  const body =
    field('00', '01') +
    field('26', field('00', 'br.gov.bcb.pix') + field('01', 'teste@nazariomassas.com.br')) +
    field('52', '0000') +
    field('53', '986') +
    field('54', (order.total / 100).toFixed(2)) +
    field('58', 'BR') +
    field('59', 'NAZARIO MASSAS TESTE') +
    field('60', 'SAO PAULO') +
    field('62', field('05', `PEDIDO${order.number}`)) +
    '6304';
  return body + crc16(body);
}

/**
 * Development provider: issues a structurally valid but fake Pix charge.
 * Payment is confirmed through the "simulate" endpoint or by the admin.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';
  readonly capabilities = { provider: 'mock', onlinePix: true, requiresDocument: false, testMode: true };

  async createCharge(order: Order) {
    if (order.payment.method !== 'pix') return offlinePayment(order, this.name);
    const copyPaste = buildPixPayload(order);
    const qrCodeImage = await QRCode.toDataURL(copyPaste, { margin: 1, width: 320, color: { dark: '#1C1714' } });
    return {
      payment: {
        method: 'pix' as const,
        status: 'awaiting_payment' as const,
        provider: this.name,
        providerChargeId: `mock_${order.id}`,
        pix: { qrCodeImage, copyPaste, expiresAt: new Date(Date.now() + 30 * 60_000).toISOString() },
      },
    };
  }
}
