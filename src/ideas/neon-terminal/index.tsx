import { useEffect, useState } from 'react';

const TICKERS = [
  { sym: 'AURA', px: 142.31, chg: +2.41 },
  { sym: 'NOVA', px: 88.04, chg: -1.12 },
  { sym: 'HELI', px: 311.7, chg: +5.88 },
  { sym: 'KORE', px: 14.22, chg: +0.31 },
  { sym: 'PULS', px: 977.5, chg: -12.4 },
  { sym: 'OBEL', px: 49.66, chg: +0.92 },
  { sym: 'VANE', px: 220.18, chg: -3.05 },
  { sym: 'ZINC', px: 6.78, chg: +0.14 },
];

function useTick(intervalMs = 1200) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return t;
}

function jitter(seed: number, amp = 1) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 2 * amp;
}

export default function NeonTerminal() {
  const t = useTick(1100);
  return (
    <div className="grid h-full w-full grid-cols-[260px_1fr_320px] grid-rows-[44px_1fr_28px] bg-[#06080a] font-mono text-[13px] text-emerald-300/90">
      {/* top bar */}
      <div className="col-span-3 flex items-center justify-between border-b border-emerald-400/15 px-5">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.6)]" />
          <span className="tracking-[0.3em] text-emerald-200/70">SIGNAL // TERMINAL v0.42</span>
        </div>
        <div className="flex items-center gap-6 text-emerald-200/60">
          <span>SESSION 02:14:08</span>
          <span>LAT 11ms</span>
          <span>NODE eu-w-3</span>
        </div>
      </div>

      {/* left column */}
      <div className="border-r border-emerald-400/15 p-5">
        <div className="mb-4 text-emerald-200/40 uppercase tracking-[0.25em] text-[11px]">Watchlist</div>
        <ul className="space-y-2">
          {TICKERS.map((tk, i) => {
            const drift = jitter(t + i, 0.4);
            const px = tk.px + drift;
            const up = tk.chg >= 0;
            return (
              <li key={tk.sym} className="flex items-center justify-between rounded border border-transparent px-2 py-1.5 hover:border-emerald-400/20 hover:bg-emerald-400/[0.04]">
                <span className="text-emerald-100">{tk.sym}</span>
                <span className="tabular-nums">{px.toFixed(2)}</span>
                <span className={up ? 'text-emerald-300' : 'text-rose-400'}>
                  {up ? '+' : ''}{tk.chg.toFixed(2)}%
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 mb-3 text-emerald-200/40 uppercase tracking-[0.25em] text-[11px]">Alerts</div>
        <div className="space-y-2 text-emerald-200/70">
          <div className="rounded border border-emerald-400/20 bg-emerald-400/[0.05] p-3">
            <div className="text-emerald-300">PULS &lt; 980</div>
            <div className="text-emerald-200/50">triggered 02:13:51</div>
          </div>
          <div className="rounded border border-amber-300/20 bg-amber-300/[0.05] p-3 text-amber-200">
            <div>VOLATILITY ↑ 14%</div>
            <div className="text-amber-200/60">cluster: tech</div>
          </div>
        </div>
      </div>

      {/* center: chart */}
      <div className="relative p-5">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-emerald-200/40 uppercase tracking-[0.25em] text-[11px]">HELI / USD</div>
            <div className="mt-2 flex items-end gap-3">
              <div className="font-display text-5xl text-emerald-100 tabular-nums">311.{(70 + Math.floor(jitter(t, 6))).toString().padStart(2, '0')}</div>
              <div className="text-emerald-300">+5.88%</div>
            </div>
          </div>
          <div className="flex gap-1 text-[11px] text-emerald-200/50">
            {['1H', '1D', '1W', '1M', 'ALL'].map((r, i) => (
              <span key={r} className={'rounded border px-2 py-1 ' + (i === 1 ? 'border-emerald-300/50 text-emerald-200' : 'border-emerald-400/15')}>{r}</span>
            ))}
          </div>
        </div>

        <svg viewBox="0 0 600 280" className="mt-6 h-[300px] w-full">
          <defs>
            <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(52,211,153)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="rgb(52,211,153)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={i} x1="0" x2="600" y1={i * 40} y2={i * 40} stroke="rgba(52,211,153,0.08)" />
          ))}
          {(() => {
            const pts = Array.from({ length: 60 }).map((_, i) => {
              const x = (i / 59) * 600;
              const y = 200 - 80 * Math.sin(i / 6 + t * 0.2) + jitter(i + t, 12);
              return [x, y] as const;
            });
            const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
            const fill = `${d} L600,280 L0,280 Z`;
            return (
              <>
                <path d={fill} fill="url(#glow)" />
                <path d={d} fill="none" stroke="rgb(110,231,183)" strokeWidth="1.5" />
              </>
            );
          })()}
        </svg>

        <div className="mt-4 grid grid-cols-4 gap-3 text-[11px]">
          {['OPEN', 'HIGH', 'LOW', 'VOL'].map((k, i) => (
            <div key={k} className="rounded border border-emerald-400/15 p-3">
              <div className="text-emerald-200/40 tracking-[0.2em]">{k}</div>
              <div className="mt-1 text-emerald-100 tabular-nums">{[305.20, 318.4, 301.7, '4.2M'][i]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* right: order book / log */}
      <div className="border-l border-emerald-400/15 p-5">
        <div className="mb-3 text-emerald-200/40 uppercase tracking-[0.25em] text-[11px]">Order Book</div>
        <div className="space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={'s' + i} className="relative grid grid-cols-3 text-rose-300/90">
              <div className="absolute inset-y-0 right-0 bg-rose-500/10" style={{ width: `${30 + jitter(t + i, 30)}%` }} />
              <span className="relative tabular-nums">{(312.4 - i * 0.3).toFixed(2)}</span>
              <span className="relative tabular-nums text-right">{(120 + i * 18).toString()}</span>
              <span className="relative tabular-nums text-right text-rose-300/60">{((312.4 - i * 0.3) * (120 + i * 18)).toFixed(0)}</span>
            </div>
          ))}
          <div className="my-2 border-t border-dashed border-emerald-400/20" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={'b' + i} className="relative grid grid-cols-3 text-emerald-300">
              <div className="absolute inset-y-0 right-0 bg-emerald-400/10" style={{ width: `${30 + jitter(t + 9 + i, 30)}%` }} />
              <span className="relative tabular-nums">{(311.6 - i * 0.3).toFixed(2)}</span>
              <span className="relative tabular-nums text-right">{(140 + i * 22).toString()}</span>
              <span className="relative tabular-nums text-right text-emerald-300/60">{((311.6 - i * 0.3) * (140 + i * 22)).toFixed(0)}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 mb-2 text-emerald-200/40 uppercase tracking-[0.25em] text-[11px]">Log</div>
        <div className="h-[140px] overflow-hidden rounded border border-emerald-400/15 bg-emerald-400/[0.02] p-2 text-[11px] leading-5 text-emerald-200/70">
          {[
            '02:14:08  fill HELI buy 120 @ 311.42',
            '02:13:51  alert PULS < 980',
            '02:13:42  cancel ord #4421',
            '02:13:30  stream resume node:eu-w-3',
            '02:13:11  fill VANE sell 80 @ 220.18',
            '02:12:58  ingest snapshot 1.4MB',
          ].map((l) => (
            <div key={l}><span className="text-emerald-400">›</span> {l}</div>
          ))}
        </div>
      </div>

      {/* bottom status */}
      <div className="col-span-3 flex items-center justify-between border-t border-emerald-400/15 px-5 text-[11px] text-emerald-200/50">
        <span>READY</span>
        <span>BUF 92% · CPU 14% · NET 1.2MB/s</span>
        <span>⌘K command · / search · ? help</span>
      </div>
    </div>
  );
}
