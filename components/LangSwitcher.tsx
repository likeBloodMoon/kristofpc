// components/LangSwitcher.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";

type Lang = "en" | "hu" | "sr";

function setLangCookie(code: Lang) {
  // 1 year, whole site, safe default for navigation
  document.cookie = `lang=${code}; path=/; max-age=31536000; samesite=lax`;
}

export default function LangSwitcher({ current }: { current: Lang }) {
  const qs = useMemo(
    () => (typeof window !== "undefined" ? window.location.search : ""),
    []
  );
  const href = (code: Lang) => `/${code}${qs}`;
  const cls = (code: Lang) =>
    `badge ${current === code ? "ring-1 ring-zinc-500" : ""}`;

  return (
    <div className="flex items-center gap-2">
      {(["en", "hu", "sr"] as const).map((code) => (
        <Link
          key={code}
          href={href(code)}
          className={cls(code)}
          onClick={() => setLangCookie(code)}   
        >
          {code.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
