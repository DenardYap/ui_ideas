export default function AuroraOnboarding() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* gradient sky */}
      <div className="absolute inset-0" style={{
        background:
          'radial-gradient(120% 80% at 20% 0%, #ffd6e7 0%, transparent 60%),' +
          'radial-gradient(100% 80% at 90% 10%, #c9d8ff 0%, transparent 55%),' +
          'radial-gradient(120% 100% at 60% 100%, #ffe8c2 0%, transparent 60%),' +
          'linear-gradient(180deg, #fff7fb 0%, #f3eefe 60%, #eef6ff 100%)',
      }} />

      {/* soft blobs */}
      <div className="absolute -left-20 top-32 h-72 w-72 rounded-full bg-pink-300/40 blur-3xl" />
      <div className="absolute right-10 -top-10 h-80 w-80 rounded-full bg-indigo-300/40 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl" />

      {/* nav */}
      <div className="relative z-10 flex items-center justify-between px-12 py-8">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-pink-400 via-rose-400 to-indigo-500 shadow-lg shadow-pink-200" />
          <span className="text-[15px] font-semibold text-neutral-800">aurora</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span className="font-mono">step 02 of 04</span>
          <div className="ml-3 flex gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={
                  'h-1.5 rounded-full transition ' +
                  (i <= 2 ? 'w-8 bg-neutral-800' : 'w-3 bg-neutral-800/20')
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* content */}
      <div className="relative z-10 grid grid-cols-2 gap-16 px-16 pt-6">
        <div className="pt-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/50 px-3 py-1 text-[11px] font-medium tracking-wide text-neutral-700 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            New here · welcome
          </div>
          <h1 className="mt-6 [font-family:'Fraunces',serif] text-7xl font-light leading-[0.95] tracking-[-0.03em] text-neutral-900">
            Tell us how<br />
            <span className="italic">your day</span><br />
            usually flows.
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-neutral-600">
            We'll tune notifications, focus blocks, and gentle nudges so the app
            stays out of your way until it matters.
          </p>

          <div className="mt-10 flex items-center gap-3">
            <button className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-neutral-900/20 transition hover:translate-y-[-1px]">
              Continue →
            </button>
            <button className="rounded-full px-4 py-3 text-sm text-neutral-600 hover:bg-white/50">
              Skip for now
            </button>
          </div>
        </div>

        {/* options card stack */}
        <div className="relative pt-6">
          <div className="absolute right-6 top-2 h-full w-full rotate-3 rounded-3xl bg-white/30 backdrop-blur" />
          <div className="absolute right-3 top-1 h-full w-full rotate-1 rounded-3xl bg-white/40 backdrop-blur" />
          <div className="relative rounded-3xl border border-white/70 bg-white/80 p-7 shadow-2xl shadow-indigo-200/40 backdrop-blur-xl">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">Your rhythm</div>
            <div className="mt-4 space-y-3">
              {[
                { k: 'Early bird', d: 'Up before 7 — quiet morning focus.' },
                { k: 'Steady through midday', d: 'Two solid blocks, lunch break.', selected: true },
                { k: 'Night owl', d: 'Best work happens after 9pm.' },
                { k: 'It changes a lot', d: "I'd rather pick day-by-day." },
              ].map((opt) => (
                <label
                  key={opt.k}
                  className={
                    'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ' +
                    (opt.selected
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200/80 bg-white/70 hover:border-neutral-300')
                  }
                >
                  <div
                    className={
                      'mt-0.5 h-5 w-5 flex-none rounded-full border-2 ' +
                      (opt.selected
                        ? 'border-white bg-white'
                        : 'border-neutral-300')
                    }
                  >
                    {opt.selected && (
                      <div className="m-1 h-2 w-2 rounded-full bg-neutral-900" />
                    )}
                  </div>
                  <div>
                    <div className="text-[15px] font-medium">{opt.k}</div>
                    <div className={'text-xs ' + (opt.selected ? 'text-white/70' : 'text-neutral-500')}>
                      {opt.d}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
