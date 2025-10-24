"use client";
import { useEffect, useMemo, useState } from "react";

type Lang = "en"|"hu"|"sr";
type Opts = {
  ssd?: "240"|"480"|"960";
  windows?: boolean;
  deepClean?: boolean;
  gpuService?: boolean;
  dataRescue?: boolean;
};

const copy = {
  en: {
    title: "Quick Quote Calculator",
    ssd: "SSD Upgrade",
    windows: "Clean Windows install",
    deepClean: "Deep clean + thermal paste",
    gpuService: "GPU fan clean & paste",
    dataRescue: "Data rescue (no hardware damage)",
    total: "Estimated total",
    reset: "Reset",
  },
  hu: {
    title: "Gyors árajánlat kalkulátor",
    ssd: "SSD bővítés",
    windows: "Tiszta Windows telepítés",
    deepClean: "Mélytisztítás + pasztázás",
    gpuService: "GPU tisztítás és paszta",
    dataRescue: "Adatmentés (hardver hiba nélkül)",
    total: "Becsült végösszeg",
    reset: "Visszaállítás",
  },
  sr: {
    title: "Brzi kalkulator ponude",
    ssd: "SSD nadogradnja",
    windows: "Čista instalacija Windows-a",
    deepClean: "Dubinsko čišćenje + pasta",
    gpuService: "GPU čišćenje i pasta",
    dataRescue: "Spašavanje podataka (bez HW kvara)",
    total: "Procena ukupno",
    reset: "Resetuj",
  }
} as const;

const prices = {
  ssd: { "240": 3500, "480": 5500, "960": 9000 },
  windows: 2000,
  deepClean: 2500,
  gpuService: 1800,
  dataRescue: 4500
};

export default function Calculator({ lang }: { lang: Lang }) {
  const [opts, setOpts] = useState<Opts>({});

  // hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("calc:opts");
      if (saved) setOpts(JSON.parse(saved));
    } catch {}
  }, []);

  // persist on change
  useEffect(() => {
    try { localStorage.setItem("calc:opts", JSON.stringify(opts)); } catch {}
  }, [opts]);

  const total = useMemo(() => {
    let t = 0;
    if (opts.ssd) t += prices.ssd[opts.ssd];
    if (opts.windows) t += prices.windows;
    if (opts.deepClean) t += prices.deepClean;
    if (opts.gpuService) t += prices.gpuService;
    if (opts.dataRescue) t += prices.dataRescue;
    return t;
  }, [opts]);

  const t = copy[lang];

  return (
    <section className="card">
      <h3 className="text-lg font-semibold mb-4">{t.title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm">{t.ssd}</span>
            <select
              className="mt-1 w-full rounded-xl bg-zinc-800/70 border border-zinc-700 p-2"
              value={opts.ssd ?? ""}
              onChange={e => setOpts(o => ({ ...o, ssd: e.target.value ? (e.target.value as any) : undefined }))}
            >
              <option value="">—</option>
              <option value="240">240 GB — 3,500 RSD</option>
              <option value="480">480 GB — 5,500 RSD</option>
              <option value="960">960 GB — 9,000 RSD</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!opts.windows} onChange={e => setOpts(o => ({...o, windows: e.target.checked}))} />
            <span>{t.windows} — 2,000 RSD</span>
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!opts.deepClean} onChange={e => setOpts(o => ({...o, deepClean: e.target.checked}))} />
            <span>{t.deepClean} — 2,500 RSD</span>
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!opts.gpuService} onChange={e => setOpts(o => ({...o, gpuService: e.target.checked}))} />
            <span>{t.gpuService} — 1,800 RSD</span>
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!opts.dataRescue} onChange={e => setOpts(o => ({...o, dataRescue: e.target.checked}))} />
            <span>{t.dataRescue} — 4,500 RSD</span>
          </label>
        </div>
        <div className="space-y-3">
          <div className="card">
            <div className="text-sm text-zinc-400">{t.total}</div>
            <div className="text-3xl font-bold mt-2">{total.toLocaleString("sr-RS")} RSD</div>
          </div>
          <button className="btn" onClick={() => setOpts({})}>{t.reset}</button>
        </div>
      </div>
    </section>
  );
}
