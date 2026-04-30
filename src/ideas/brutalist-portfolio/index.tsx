const PROJECTS = [
  { n: '01', name: 'CONCRETE/SUITE', year: '2024', tag: 'IDENTITY' },
  { n: '02', name: 'HELIOSTAT', year: '2024', tag: 'WEB' },
  { n: '03', name: 'PAPER MOON', year: '2023', tag: 'PRINT' },
  { n: '04', name: 'NORTH/NORTH', year: '2023', tag: 'BRAND' },
];

export default function BrutalistPortfolio() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#ecebe6] text-[#111] [font-family:'Inter_Tight',sans-serif]">
      {/* grid lines */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{
        backgroundImage:
          'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      {/* nav */}
      <header className="relative flex items-center justify-between border-b-2 border-black px-10 py-5 text-xs font-bold uppercase tracking-[0.3em]">
        <span>K. ASTOR — STUDIO</span>
        <nav className="flex gap-8">
          <span className="border-b-2 border-black pb-1">Index</span>
          <span>About</span>
          <span>Press</span>
          <span>Contact</span>
        </nav>
        <span>EST. MMXIX</span>
      </header>

      {/* hero */}
      <section className="relative grid grid-cols-12 gap-6 px-10 pt-12 pb-8">
        <div className="col-span-7">
          <div className="text-xs uppercase tracking-[0.3em] text-neutral-600">Selected works · 2019—2024</div>
          <h1 className="mt-6 [font-family:'Fraunces',serif] text-[140px] leading-[0.85] font-black tracking-[-0.04em]">
            Heavy<br />
            <span className="italic font-light">things,</span><br />
            said quietly.
          </h1>
        </div>
        <div className="col-span-5 flex flex-col justify-end gap-4">
          <p className="max-w-[340px] text-[15px] leading-relaxed text-neutral-800">
            Independent design practice working on identity systems, editorial,
            and interfaces for cultural institutions and quietly ambitious companies.
          </p>
          <div className="flex items-center gap-3">
            <button className="rounded-none border-2 border-black bg-black px-5 py-3 text-xs font-bold uppercase tracking-[0.25em] text-[#ecebe6]">
              View Index ↘
            </button>
            <button className="rounded-none border-2 border-black px-5 py-3 text-xs font-bold uppercase tracking-[0.25em]">
              Inquire
            </button>
          </div>
        </div>
      </section>

      {/* index table */}
      <section className="relative border-t-2 border-black">
        <div className="grid grid-cols-12 border-b border-black/30 px-10 py-3 text-[11px] font-bold uppercase tracking-[0.3em]">
          <span className="col-span-1">N°</span>
          <span className="col-span-6">Project</span>
          <span className="col-span-3">Discipline</span>
          <span className="col-span-2 text-right">Year</span>
        </div>
        {PROJECTS.map((p, i) => (
          <div key={p.n} className="group grid cursor-pointer grid-cols-12 items-center border-b border-black/20 px-10 py-6 transition hover:bg-black hover:text-[#ecebe6]">
            <span className="col-span-1 font-mono text-sm">{p.n}</span>
            <span className="col-span-6 [font-family:'Fraunces',serif] text-[44px] leading-none tracking-[-0.02em]">
              {p.name}
              {i === 0 && <sup className="ml-3 text-xs font-mono align-top">NEW</sup>}
            </span>
            <span className="col-span-3 text-xs uppercase tracking-[0.25em]">{p.tag}</span>
            <span className="col-span-2 text-right font-mono text-sm">{p.year} →</span>
          </div>
        ))}
      </section>

      {/* footer ticker */}
      <footer className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t-2 border-black bg-[#111] px-10 py-3 text-[11px] uppercase tracking-[0.3em] text-[#ecebe6]">
        <span>● Available Q3</span>
        <span>kastor@studio.xyz</span>
        <span>52.5200° N, 13.4050° E</span>
      </footer>
    </div>
  );
}
