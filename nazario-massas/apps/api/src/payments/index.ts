import { config } from '../config';
import { AsaasPaymentProvider } from './asaas';
import { MockPaymentProvider } from './mock';
import type { PaymentProvider } from './types';

export function createPaymentProvider(): PaymentProvider {
  switch (config.payments.provider) {
    case 'asaas':
      return new AsaasPaymentProvider(config.payments.asaas);
    default:
      return new MockPaymentProvider();
  }
}

export * from './types';
