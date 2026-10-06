import { useEffect, useState } from 'react';
import { Check, Copy, FlaskConical, QrCode } from 'lucide-react';
import type { PublicOrder } from '@nazario/shared';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { formatBRL } from '@/lib/format';
import { toast } from '@/stores/ui';
import { useCatalog } from '@/stores/catalog';

function useCountdown(iso?: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  if (!iso) return null;
  const left = Math.max(0, new Date(iso).getTime() - now);
  const m = Math.floor(left / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  return { expired: left === 0, label: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` };
}

export function PixPanel({ order, onPaid }: { order: PublicOrder; onPaid: (o: PublicOrder) => void }) {
  const pix = order.payment.pix;
  const countdown = useCountdown(pix?.expiresAt);
  const testMode = useCatalog((s) => s.data?.payments.testMode);
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  if (!pix) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pix.copyPaste);
      setCopied(true);
      toast({ tone: 'success', title: 'Código Pix copiado', description: 'Cole no app do seu banco para pagar.' });
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({ tone: 'error', title: 'Não foi possível copiar', description: 'Selecione o código e copie manualmente.' });
    }
  };

  const simulate = async () => {
    setSimulating(true);
    try {
      onPaid(await api.post<PublicOrder>(`/orders/${order.token}/simulate-payment`));
    } catch (e) {
      toast({ tone: 'error', title: e instanceof ApiError ? e.message : 'Falha ao simular' });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <section aria-labelledby="pix-title" className="overflow-hidden rounded-[var(--radius-xl)] bg-oven text-flour">
      <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:p-8">
        <div className="mx-auto rounded-[var(--radius-lg)] bg-white p-3 sm:mx-0">
          <img src={pix.qrCodeImage} alt="QR Code Pix para pagamento do pedido" width={200} height={200} className="size-48 sm:size-52" />
        </div>
        <div>
          <p className="eyebrow flex items-center gap-2 text-olive">
            <QrCode className="size-4" aria-hidden /> Pague com Pix
          </p>
          <h2 id="pix-title" className="mt-2 font-display text-3xl leading-tight">
            {formatBRL(order.total)}
          </h2>
          <ol className="mt-3 space-y-1 text-sm text-ash">
            <li>1. Abra o app do seu banco e escolha Pix.</li>
            <li>2. Escaneie o QR Code ou use o “copia e cola”.</li>
            <li>3. A confirmação aparece aqui automaticamente.</li>
          </ol>
          {countdown && (
            <p className="mt-3 text-sm" role="timer" aria-live="off">
              {countdown.expired ? (
                <span className="text-ember">Código expirado — fale com a loja para gerar outro.</span>
              ) : (
                <>
                  Expira em <span className="tabular font-semibold text-flour">{countdown.label}</span>
                </>
              )}
            </p>
          )}
        </div>
      </div>
      <div className="border-t border-oven-line p-4 sm:px-8">
        <label htmlFor="pix-code" className="sr-only">
          Código Pix copia e cola
        </label>
        <div className="flex gap-2">
          <input
            id="pix-code"
            readOnly
            value={pix.copyPaste}
            onFocus={(e) => e.currentTarget.select()}
            className="h-12 min-w-0 flex-1 truncate rounded-full bg-oven-raised px-4 font-mono text-xs text-ash outline-none focus:ring-2 focus:ring-olive"
          />
          <Button variant="light" onClick={copy} icon={copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}>
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
        {testMode && (
          <div className="mt-4 flex flex-col gap-3 rounded-[var(--radius-md)] border border-dashed border-oven-line p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-ash">
              <FlaskConical className="size-4 shrink-0 text-olive" aria-hidden />
              Ambiente de teste: este Pix é fictício. Configure o Asaas para cobranças reais.
            </p>
            <Button size="sm" variant="outline-light" loading={simulating} onClick={simulate}>
              Simular pagamento
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
