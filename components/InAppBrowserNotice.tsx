// components/InAppBrowserNotice.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

function isInAppBrowser(ua: string) {
  ua = ua.toLowerCase();
  return ua.includes("fbav") || ua.includes("fban") || ua.includes("fb_iab") ||
         ua.includes("instagram") || ua.includes("tiktok") || ua.includes("line/");
}

function canUseChromeIntent() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  const isAndroid = /android/.test(ua);
  const isChrome = /chrome/.test(ua) && !/edg|edge|opr/.test(ua);
  const isLocalhost = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  return isAndroid && isChrome && !isLocalhost;
}

type LangCode = "en" | "hu" | "sr";

const STRINGS: Record<LangCode, {
  message: string; openChrome: string; openBrowser: string; closeAria: string;
}> = {
  en: { message: "For best performance, open this site in your browser.",
        openChrome: "Open in Chrome", openBrowser: "Open in Browser", closeAria: "Close notice" },
  hu: { message: "A legjobb élményhez nyisd meg az oldalt a böngésződben.",
        openChrome: "Megnyitás Chrome-ban", openBrowser: "Megnyitás böngészőben", closeAria: "Értesítés bezárása" },
  sr: { message: "Za najbolje iskustvo, otvorite sajt u pregledaču.",
        openChrome: "Otvori u Chrome‑u", openBrowser: "Otvori u pregledaču", closeAria: "Zatvori obaveštenje" },
};

function detectLangFromPath(pathname: string | null): LangCode {
  if (!pathname) return "en";
  const seg = pathname.split("/").filter(Boolean)[0];
  if (seg === "en" || seg === "hu" || seg === "sr") return seg;
  return "en";
}

const STORAGE_KEY = "iab_notice_closed_v1";
const DAYS_TO_REMEMBER = 30;

function isClosedFlagValid(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const { ts } = JSON.parse(raw) as { ts: number };
    const ageDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    return ageDays < DAYS_TO_REMEMBER;
  } catch { return false; }
}

function setClosedFlag() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now() })); } catch {}
}

export default function InAppBrowserNotice() {
  const pathname = usePathname();
  const lang: LangCode = useMemo(() => detectLangFromPath(pathname), [pathname]);
  const [show, setShow] = useState(false);
  const [intentUrl, setIntentUrl] = useState<string | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const inApp = isInAppBrowser(ua);

    if (!inApp || isClosedFlagValid()) { setShow(false); return; }
    setShow(true);

    if (canUseChromeIntent()) {
      const current = location.href.replace(/^https?:\/\//, "");
      setIntentUrl(`intent://${current}#Intent;scheme=https;package=com.android.chrome;end`);
    } else { setIntentUrl(null); }
  }, [pathname]);

  const onClose = () => { setClosedFlag(); setShow(false); };
  if (!show) return null;
  const S = STRINGS[lang] ?? STRINGS.en;

  return (
    <div className="fixed bottom-3 left-1/2 z-[9999] w-[92%] -translate-x-1/2 rounded-2xl bg-black/80 p-4 text-white backdrop-blur-md shadow-lg">
      <button onClick={onClose} aria-label={S.closeAria}
        className="absolute right-2 top-2 rounded-full p-1 text-white/70 hover:text-white transition">✕</button>
      <div className="text-sm pr-6">{S.message}</div>
      <div className="mt-3 flex gap-2">
        {intentUrl && <a href={intentUrl} className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black">{S.openChrome}</a>}
        <a href={typeof window !== "undefined" ? location.href : "/"} target="_blank" rel="noopener noreferrer"
           className="rounded-xl border border-white/40 px-3 py-2 text-sm">{S.openBrowser}</a>
      </div>
    </div>
  );
}