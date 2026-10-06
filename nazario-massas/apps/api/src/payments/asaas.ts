import type { Order } from '@nazario/shared';
import { offlinePayment, PaymentError, type PaymentProvider } from './types';

interface AsaasConfig {
  apiKey: string;
  baseUrl: string;
}

/**
 * Asaas gateway (https://docs.asaas.com). Pix is charged online; card and
 * cash stay "pay on delivery" until online card checkout is enabled.
 *
 * Confirmation arrives via POST /api/webhooks/asaas (PAYMENT_RECEIVED /
 * PAYMENT_CONFIRMED), validated with the `asaas-access-token` header.
 */
export class AsaasPaymentProvider implements PaymentProvider {
  readonly name = 'asaas';
  readonly capabilities = { provider: 'asaas', onlinePix: true, requiresDocument: true, testMode: false };

  constructor(private readonly config: AsaasConfig) {}

  private async request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
    const res = await fetch(`${this.config.baseUrl}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        'content-type': 'application/json',
        access_token: this.config.apiKey,
        'user-agent': 'nazario-massas',
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[asaas] ${init.method ?? 'GET'} ${path} → ${res.status} ${detail.slice(0, 500)}`);
      throw new PaymentError('Não foi possível gerar a cobrança agora. Tente novamente ou escolha outra forma de pagamento.');
    }
    return (await res.json()) as T;
  }

  async createCharge(order: Order) {
    if (order.payment.method !== 'pix') return offlinePayment(order, this.name);
    if (!order.customer.document) throw new PaymentError('Informe o CPF para pagar com Pix.');

    const customer = await this.request<{ id: string }>('/customers', {
      method: 'POST',
      body: {
        name: order.customer.name,
        cpfCnpj: order.customer.document,
        mobilePhone: order.customer.phone,
        externalReference: order.customer.phone,
        notificationDisabled: true,
      },
    });

    const dueDate = new Date().toISOString().slice(0, 10);
    const charge = await this.request<{ id: string }>('/payments', {
      method: 'POST',
      body: {
        customer: customer.id,
        billingType: 'PIX',
        value: order.total / 100,
        dueDate,
        description: `Nazário Massas — pedido #${order.number}`,
        externalReference: order.id,
      },
    });

    const qr = await this.request<{ encodedImage: string; payload: string; expirationDate: string }>(
      `/payments/${charge.id}/pixQrCode`,
    );

    return {
      payment: {
        method: 'pix' as const,
        status: 'awaiting_payment' as const,
        provider: this.name,
        providerChargeId: charge.id,
        pix: {
          qrCodeImage: `data:image/png;base64,${qr.encodedImage}`,
          copyPaste: qr.payload,
          expiresAt: new Date(qr.expirationDate).toISOString(),
        },
      },
    };
  }
}
