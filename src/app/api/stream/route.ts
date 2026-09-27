export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Closes before the function limit; EventSource reconnects on its own.
const LIFETIME_MS = 50_000;
const TICK_MS = 1_500;

const jitter = (base: number, spread: number) =>
  Math.max(0, base + (Math.random() - 0.5) * 2 * spread);

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  let seq = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  let closer: ReturnType<typeof setTimeout> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      const stop = () => {
        clearInterval(timer);
        clearTimeout(closer);
        try { controller.close(); } catch { /* already closed */ }
      };

      controller.enqueue(encoder.encode('retry: 2000\n\n'));
      const tick = () => {
        seq += 1;
        const active = Math.round(jitter(7, 4));
        send('health', {
          seq,
          at: Date.now(),
          postgres: { active, idle: 20 - active, max: 20, waiting: active > 10 ? 1 : 0, queryP95: Math.round(jitter(14, 6)) },
          redis: { depth: Math.round(jitter(3, 3)), perSec: Math.round(jitter(42, 12)), latency: Number(jitter(0.6, 0.3).toFixed(2)) },
          webhook: { lastStatus: Math.random() > 0.04 ? 200 : 502, p95: Math.round(jitter(180, 60)), retries: Math.random() > 0.9 ? 1 : 0 },
          auth: { verifyMs: Number(jitter(1.8, 0.6).toFixed(1)), sessions: Math.round(jitter(38, 6)) },
        });
      };
      tick();
      timer = setInterval(tick, TICK_MS);
      closer = setTimeout(stop, LIFETIME_MS);
      req.signal.addEventListener('abort', stop);
    },
    cancel() {
      clearInterval(timer);
      clearTimeout(closer);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
