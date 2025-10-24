"use client";


export type PageProps = { initialLang?: LangCode };
import React, { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Manrope } from "next/font/google";
import { I18N } from "../components/i18n";
/* ===== WhatsApp link + lightweight tracking ===== */
type Placement = "hero" | "header" | "contact" | "footer";

function waLink(placement: Placement, lang: LangCode, customText?: string) {
  const base = "https://wa.me/381628347268";
  const defaultTexts: Record<LangCode, string> = {
    en: "Hi Kristof! Found you on the site.",
    hu: "Szia Kristóf! A weboldaladon találtalak.",
    sr: "Zdravo Kristof! Našao sam te preko sajta."
  };
  const message = encodeURIComponent(customText ?? defaultTexts[lang] ?? defaultTexts.en);
  const utm = new URLSearchParams({
    utm_source: "site",
    utm_medium: "whatsapp",
    utm_campaign: "contact",
    utm_content: placement
  }).toString();
  return `${base}?text=${message}&${utm}`;
}

function trackWhatsApp(placement: Placement) {
  try {
    // Vercel Analytics
    // @ts-ignore
    if (typeof window !== "undefined" && window.va && typeof window.va.track === "function") {
      // @ts-ignore
      window.va.track("whatsapp_click", { placement });
    }
    // Plausible
    if (typeof window !== "undefined" && (window as any).plausible) {
      (window as any).plausible("WhatsApp Click", { props: { placement } });
    }
    // Google Analytics gtag
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "whatsapp_click", {
        event_category: "engagement",
        event_label: placement,
      });
    }
  } catch {}
}



/** Attach to an existing <form> by CSS selector (default: #contact-form) */
function FormAutosave({ selector = "#contact-form", delay = 600 }: { selector?: string; delay?: number }) {
  React.useEffect(() => {
    const form = document.querySelector(selector) as HTMLFormElement | null;
    if (!form) return;

    const key = `autosave:${selector}`;

    // --- Restore any local draft into inputs ---
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved) as Record<string, FormDataEntryValue | FormDataEntryValue[]>;
        for (const [name, value] of Object.entries(data)) {
          const elements = form.querySelectorAll<HTMLElement>(`[name="${CSS.escape(name)}"]`);
          elements.forEach((el) => {
            if (el instanceof HTMLInputElement) {
              if (el.type === "checkbox" || el.type === "radio") {
                const vals = Array.isArray(value) ? value : [value];
                el.checked = vals.map(String).includes(el.value);
              } else {
                el.value = String(value ?? "");
              }
            } else if (el instanceof HTMLTextAreaElement) {
              el.value = String(value ?? "");
            } else if (el instanceof HTMLSelectElement) {
              const vals = new Set((Array.isArray(value) ? value : [value]).map(String));
              Array.from(el.options).forEach((opt) => (opt.selected = vals.has(opt.value)));
            }
          });
        }
      }
    } catch {}

    // --- Debounced serialize + save + POST ---
    let timer: number | null = null;
    let raf = 0;

    const serialize = () => {
      const fd = new FormData(form);
      const obj: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
      fd.forEach((v, k) => {
        if (k in obj) {
          const cur = obj[k];
          obj[k] = Array.isArray(cur) ? [...cur, v] : [cur, v];
        } else {
          obj[k] = v;
        }
      });
      return obj;
    };

    const fire = () => {
      const obj = serialize();
      try {
        localStorage.setItem(key, JSON.stringify(obj));
      } catch {}
      if (!raf) {
        raf = requestAnimationFrame(async () => {
          try {
            await fetch("/api/form-autosave", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ selector, data: obj }),
            });
          } catch {
            /* ignore network errors for autosave */
          } finally {
            raf = 0;
          }
        });
      }
    };

    const onChange = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(fire, delay);
    };

    form.addEventListener("input", onChange);
    form.addEventListener("change", onChange);

    return () => {
      form.removeEventListener("input", onChange);
      form.removeEventListener("change", onChange);
      if (timer) window.clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [selector, delay]);

  return null;
}



/* Headings font (display only) */
const manropeLocal = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  display: "swap",
});

function MouseGlow() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    let raf = 0;
    let latestX = window.innerWidth * 0.5;
    let latestY = window.innerHeight * 0.5;

    const onMove = (e: PointerEvent) => {
      latestX = e.clientX;
      latestY = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          root.style.setProperty("--mx", `${latestX}px`);
          root.style.setProperty("--my", `${latestY}px`);
          raf = 0;
        });
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);
  return null;
}

type ActiveTab = "services" | "packages" | "faq" | "about";




type LangCode = "en" | "hu" | "sr";
function Flag({ code, className = "" }: { code: LangCode; className?: string }) {
  if (code === "hu") {
    return (
      <svg viewBox="0 0 3 2" className={`flag ${className}`} aria-label="Hungary flag" role="img">
        <rect width="3" height="2" fill="#ffffff" />
        <rect width="3" height="0.6667" y="0" fill="#CE2939" />
        <rect width="3" height="0.6667" y="1.3333" fill="#477050" />
      </svg>
    );
  }
  if (code === "sr") {
    return (
      <svg viewBox="0 0 3 2" className={`flag ${className}`} aria-label="Serbia flag" role="img">
        <rect width="3" height="2" fill="#ffffff" />
        <rect width="3" height="0.6667" y="0" fill="#C6363C" />
        <rect width="3" height="0.6667" y="0.6667" fill="#0C4076" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 40" className={`flag ${className}`} aria-label="United Kingdom flag" role="img">
      <clipPath id="uk-clip"><rect width="60" height="40" rx="3" ry="3" /></clipPath>
      <g clipPath="url(#uk-clip)">
        <rect width="60" height="40" fill="#012169" />
        <path d="M0,0 60,40 M60,0 0,40" stroke="#FFF" strokeWidth="10" />
        <path d="M0,0 60,40 M60,0 0,40" stroke="#C8102E" strokeWidth="6" />
        <path d="M30,0 v40 M0,20 h60" stroke="#FFF" strokeWidth="16" />
        <path d="M30,0 v40 M0,20 h60" stroke="#C8102E" strokeWidth="10" />
      </g>
    </svg>
  );
}

function IconWrench({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 7a6 6 0 0 1-8.24 5.64L6 18.4l-2.4-2.4 5.76-5.76A6 6 0 1 1 20 7Z" />
      <circle cx="17" cy="7" r="1.8" fill="currentColor" />
    </svg>
  );
}
function IconBox({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7l9-4 9 4-9 4-9-4Z" />
      <path d="M3 7v10l9 4 9-4V7" />
    </svg>
  );
}
function IconHelp({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 18h.01" />
      <path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 2-3 4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}
function IconShield({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l7 4v5c0 5-3.8 8.4-7 9-3.2-.6-7-4-7-9V7l7-4Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function Copyable({
  text,
  children,
  kind = "generic",
  lang,
}: {
  text: string;
  children: React.ReactNode;
  kind?: "generic" | "phone" | "email";
  lang: LangCode; // "en" | "hu" | "sr"
}) {
  const [copied, setCopied] = React.useState(false);

  // ✅ Safe fallback: if COPY[lang] is missing, fall back to English
  const dict = (COPY as any)?.[lang] ?? COPY.en;

  const msg =
    kind === "phone"
      ? dict.copiedPhone ?? "Copied!"
      : kind === "email"
      ? dict.copiedEmail ?? "Copied!"
      : dict.copiedGeneric ?? "Copied!";

  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        } catch {}
      }}
      className="relative underline decoration-dotted underline-offset-2 hover:no-underline"
      aria-live="polite"
    >
      {children}
      <span
        className={`absolute -top-7 left-1/2 -translate-x-1/2 rounded-md px-2 py-1 text-[11px] bg-emerald-600 text-white transition-opacity ${
          copied ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {msg}
      </span>
    </button>
  );
}

/* Scroll opacity helper for background blobs */
function useScrollReactiveGlows(refs: React.RefObject<HTMLDivElement>[]) {
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight || 1;
        const p = Math.min(1, Math.max(0, window.scrollY / max));
        if (refs[0]?.current) refs[0].current!.style.opacity = String(0.45 + p * 0.35);
        if (refs[1]?.current) refs[1].current!.style.opacity = String(0.38 + p * 0.30);
        if (refs[2]?.current) refs[2].current!.style.opacity = String(0.30 + p * 0.25);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [refs]);
}

/* === COPY (translations & content) === */
const COPY = {
  en: {
    brand: "Kristóf PC Workshop",
    tagline: "Fast, honest repairs. Built right.",
    copiedGeneric: "Copied!", copiedPhone: "Phone copied!", copiedEmail: "Email copied!",
    replyFast: "Usually replies within 1 hour",
    ctaBook: "Book Free Diagnostics",
    ctaCall: "Call / WhatsApp",
    navServices: "Services",
    navPricing: "Packages",
    navAbout: "About",
    navContact: "Contact",
    navFAQ: "FAQ",
    dropOnly: "Drop-off only in Bačka Topola — no house calls.",
    servicesTitle: "What I Do",
    servicesSub: "A quick overview of my services",
    packagesTitle: "Service Packages",
    packagesSub: "Transparent bundles you can start with",
    pricesNote: "*Prices are estimates; final quote after free diagnostics.",
    from: "from",
    rsd: "RSD",
    aboutTitle: "Why Choose Me",
    aboutSub: "What makes the workshop reliable",
    contactTitle: "Contact",
    contactText: "Message me any time — I reply quickly during working hours.",
    phoneLabel: "Tel/WA:",
    emailLabel: "Email:",
    hours: "Mon–Fri 09:00–18:00",
    address: "Bačka Topola (workshop address on request)",
    formName: "Your name",
    formEmail: "Email or phone",
    formMsg: "How can I help?",
    formSend: "Send Message",
    formSuccess: "Thanks! I'll reply soon.",
    formFail: "Message failed. Try later.",
    backTop: "Back to top",
    Call: "Call",
    WhatsApp: "WhatsApp",
    perfLabel: "Performance 95+",
    perfNote: "Fast loads, image lazy-loading, minimal JS.",
    tabs: { services: "Services", packages: "Packages", faq: "FAQ", about: "About" },
    faqsTitle: "FAQ",
    faqsSub: "Quick answers to common questions",
    services: [
      ["Desktop hardware repair", "PSU swap, motherboard diagnostics, GPU testing, fans, cabling."],
      ["Software cleanup & Windows", "Clean install, drivers, malware cleanup, backup & tuning."],
      ["SSD upgrades + migration", "Fast SSDs stocked; migration, TRIM/SMART checks."],
      ["Custom PC builds", "Parts by budget, assembly, BIOS & Windows setup."],
      ["Maintenance for small business", "On-call support, priority turnaround, preventive plans."],
      ["Diagnostics & stress testing", "Thermals, noise checks, paste refresh, airflow & dust."],
    ],
    packages: [
      ["Speed Boost", "SSD + Windows + drivers + optimization", "6,500"],
      ["Tune & Clean", "Deep clean, new thermal paste, noise & temp check", "3,500"],
      ["Custom Build Setup", "Consultation, parts list, assembly, BIOS & stress test", "0"],
      ["Data Rescue (Lite)", "Logical recovery & backup (no hardware damage)", "4,500"],
      ["GPU/CPU Upgrade + Bench", "Hardware upgrade, BIOS tune, stability & performance test", "2,500"],
      ["Diagnostics & Quote", "Full check and written estimate (waived if you proceed)", "0"],
    ],
    faqs: [
      ["Do you fix laptops?", "Yes — software issues and simple hardware (SSD/RAM/cleaning). Complex board work is referred to a partner."],
      ["How long does diagnostics take?", "Usually the same day; complex issues 24–48h."],
      ["Can you pick up my PC?", "Currently drop-off only at the workshop in Bačka Topola."],
      ["What payments do you accept?", "Cash and bank transfer. Invoices available for businesses."],
      ["Is my data safe?", "Drives are handled securely and not read; wipes only with explicit consent."],
    ],
    about: [
      "Local, solo-operated — you talk directly to the technician.",
      "Transparent pricing & written estimates.",
      "1–3 day turnaround for most jobs.",
      "Warranty on labor.",
    ],
    subtitles: { heroSub: "Local PC repair, upgrades and custom builds" },
  },
  hu: {
    brand: "Kristóf PC Műhelye",
    tagline: "Gyors, korrekt javítás. Precíz kivitel.",
    copiedGeneric: "Kimásolva!", copiedPhone: "Telefon kimásolva!", copiedEmail: "E-mail kimásolva!",
    replyFast: "Általában 1 órán belül válaszolok",
    ctaBook: "Ingyenes bevizsgálás",
    ctaCall: "Hívás / WhatsApp",
    navServices: "Szolgáltatások",
    navPricing: "Csomagok",
    navAbout: "Rólam",
    navContact: "Kapcsolat",
    navFAQ: "GYIK",
    dropOnly: "Leadás a műhelyben – házhoz nem megyek.",
    servicesTitle: "Mivel foglalkozom",
    servicesSub: "A szolgáltatások röviden",
    packagesTitle: "Szolgáltatás csomagok",
    packagesSub: "Átlátható csomagok kezdéshez",
    pricesNote: "*Az árak tájékoztató jellegűek; végső ajánlat bevizsgálás után.",
    from: "ettől",
    rsd: "RSD",
    aboutTitle: "Miért engem?",
    aboutSub: "Amiért megbízható a műhely",
    contactTitle: "Kapcsolat",
    contactText: "Írj üzenetet – munkaidőben gyorsan válaszolok.",
    phoneLabel: "Tel/WA:",
    emailLabel: "Email:",
    hours: "H–P 09:00–18:00",
    address: "Bačka Topola (a műhely címe üzenetben)",
    formName: "Név",
    formEmail: "Email vagy telefon",
    formMsg: "Miben segíthetek?",
    formSend: "Üzenet küldése",
    formSuccess: "Köszönöm! Hamarosan válaszolok.",
    formFail: "Sikertelen üzenet. Próbáld később.",
    backTop: "Vissza az elejére",
    Call: "Hívás",
    WhatsApp: "WhatsApp",
    perfLabel: "Teljesítmény 95+",
    perfNote: "Gyors betöltés, képlusta-töltés, minimális JS.",
    tabs: { services: "Szolgáltatások", packages: "Csomagok", faq: "GYIK", about: "Rólam" },
    faqsTitle: "GYIK",
    faqsSub: "Gyakori kérdésekre gyors válaszok",
    services: [
      ["Asztali gép hardverjavítás", "Tápcsere, alaplap-diagnosztika, VGA teszt, ventilátorok, kábelezés."],
      ["Szoftvertisztítás & Windows", "Tiszta telepítés, driverek, kártevőeltávolítás, mentés & hangolás."],
      ["SSD bővítés + költöztetés", "Gyors SSD-k készleten; migráció, TRIM/SMART ellenőrzés."],
      ["Egyedi PC építés", "Költségkeret szerinti alkatrészek, összeszerelés, BIOS & Windows."],
      ["Kisvállalati karbantartás", "Készenléti támogatás, prioritás, megelőző karbantartás."],
      ["Diagnosztika & terheléses teszt", "Hőmérséklet, zaj, pasztacsere, légáramlás & por."],
    ],
    packages: [
      ["Sebességfrissítés", "SSD + Windows + driverek + optimalizálás", "6,500"],
      ["Tisztítás & Pasztázás", "Alapos portalanítás, új paszta, zaj- és hőellenőrzés", "3,500"],
      ["Egyedi PC összeállítás", "Igényfelmérés, alkatrészlista, összeszerelés, BIOS & teszt", "0"],
      ["Adatmentés (Lite)", "Logikai adatmentés és biztonsági mentés", "4,500"],
      ["GPU/CPU frissítés + Bench", "Hardvercsere, BIOS finomhangolás, stabilitás & teljesítmény", "2,500"],
      ["Bevizsgálás & Árajánlat", "Teljes ellenőrzés, írásos ajánlat (levonva, ha megrendeled)", "0"],
    ],
    faqs: [
      ["Javítasz laptopot is?", "Igen — szoftveres gondokat és egyszerű hardvercseréket (SSD/RAM/tisztítás). Bonyolult alaplapi hiba partnerhez megy."],
      ["Mennyi a bevizsgálás ideje?", "Általában még aznap; összetett esetben 24–48 óra."],
      ["El tudod hozni a gépet?", "Jelenleg csak műhelybe leadással dolgozom, Bačka Topola."],
      ["Mivel lehet fizetni?", "Készpénz és átutalás. Cégeknek számla."],
      ["Biztonságban az adatom?", "A meghajtókat biztonságosan kezelem, adatokat nem olvasok; törlés csak kifejezett kérésre."],
    ],
    about: [
      "Helyi, egyéni műhely — közvetlenül a szerelővel egyeztetsz.",
      "Átlátható árak, írásos ajánlat.",
      "A legtöbb munka 1–3 nap alatt.",
      "Garancia a munkára.",
    ],
    subtitles: { heroSub: "Helyi PC javítás, bővítés és egyedi építés" },
  },
  sr: {
    brand: "Kristóf PC radionica",
    tagline: "Brze, poštene popravke. Kako treba.",
    copiedGeneric: "Kopirano!", copiedPhone: "Telefon kopiran!", copiedEmail: "Email kopiran!",
    replyFast: "Obično odgovaram u roku od 1 sata",
    ctaBook: "Besplatna dijagnostika",
    ctaCall: "Poziv / WhatsApp",
    navServices: "Usluge",
    navPricing: "Paketi",
    navAbout: "O meni",
    navContact: "Kontakt",
    navFAQ: "FAQ",
    dropOnly: "Samo ostavljanje u radionici u Bačkoj Topoli — ne dolazim na kućne adrese.",
    servicesTitle: "Šta radim",
    servicesSub: "Brzi pregled mojih usluga",
    packagesTitle: "Paketi usluga",
    packagesSub: "Jasni paketi za početak",
    pricesNote: "*Cene su okvirne; konačna ponuda nakon dijagnostike.",
    from: "od",
    rsd: "RSD",
    aboutTitle: "Zašto baš ja",
    aboutSub: "Zašto je radionica pouzdana",
    contactTitle: "Kontakt",
    contactText: "Piši poruku — brzo odgovaram tokom radnog vremena.",
    phoneLabel: "Tel/WA:",
    emailLabel: "Email:",
    hours: "Pon–Pet 09:00–18:00",
    address: "Bačka Topola (adresu šaljem u poruci)",
    formName: "Ime",
    formEmail: "Email ili telefon",
    formMsg: "Kako mogu da pomognem?",
    formSend: "Pošalji poruku",
    formSuccess: "Hvala! Odgovoriću uskoro.",
    formFail: "Slanje neuspešno. Pokušaj kasnije.",
    backTop: "Nazad na vrh",
    Call: "Poziv",
    WhatsApp: "WhatsApp",
    perfLabel: "Performanse 95+",
    perfNote: "Brzo učitavanje, lenjo učitavanje slika, minimum JS.",
    tabs: { services: "Usluge", packages: "Paketi", faq: "FAQ", about: "O meni" },
    faqsTitle: "FAQ",
    faqsSub: "Kratki odgovori na česta pitanja",
    services: [
      ["Hardverski servis desktop računara", "Zamena napajanja, dijagnostika ploče, test grafike, ventilatori, kabliranje."],
      ["Softversko sređivanje & Windows", "Čista instalacija, drajveri, uklanjanje malvera, bekap i podešavanje."],
      ["SSD nadogradnja + migracija", "Brzi SSD-ovi na stanju; migracija, TRIM/SMART provere."],
      ["Sklapanje custom PC-jeva", "Delovi po budžetu, sklapanje, BIOS & Windows setap."],
      ["Održavanje za mala preduzeća", "Podrška na poziv, prioritetna obrada, preventivno održavanje."],
      ["Dijagnostika & stres test", "Temperature, buka, zamena paste, protok vazduha i prašina."],
    ],
    packages: [
      ["Speed Boost", "SSD + Windows + drajveri + optimizacija", "6,500"],
      ["Čišćenje & Pasta", "Dubinsko čišćenje, nova termalna pasta, provera buke i temperatura", "3,500"],
      ["Custom Build Setup", "Konsultacije, delovi, sklapanje, BIOS & stres test", "0"],
      ["Obnova podataka (Lite)", "Logički oporavak & bekap (bez HW kvara)", "4,500"],
      ["GPU/CPU upgrade + Bench", "Ugradnja, BIOS podešavanje, test stabilnosti i performansi", "2,500"],
      ["Dijagnostika i ponuda", "Kompletna provera i pisana ponuda (ne naplaćuje se ako nastaviš)", "0"],
    ],
    faqs: [
      ["Da li popravljate laptopove?", "Da — softver i jednostavne hardverske zamene (SSD/RAM/čišćenje). Složene ploče idu partneru."],
      ["Koliko traje dijagnostika?", "Obično istog dana; složenije 24–48h."],
      ["Da li preuzimate računar?", "Trenutno samo ostavljanje u radionici u Bačkoj Topoli."],
      ["Koje načine plaćanja prihvatate?", "Gotovina i bankovni transfer. Računi za firme."],
      ["Da li su podaci bezbedni?", "Diskovi se bezbedno rukuju; ne čitam podatke; brisanje samo uz dozvolu."],
    ],
    about: [
      "Lokalna, solo radionica — pričaš direktno sa majstorom.",
      "Jasne cene i pisana ponuda.",
      "Većina poslova za 1–3 dana.",
      "Garancija na rad.",
    ],
    subtitles: { heroSub: "Lokalni servis, nadogradnje i custom PC" },
  },
} as const;

type Lang = keyof typeof COPY;
type Dict = (typeof COPY)["en"];
const tFor = (lang: Lang) => (k: keyof Dict) => COPY[lang][k] as any;

/** Normalize odd code like "rs" -> "sr" */
const normalizeLang = (code: string): Lang => (code === "rs" ? "sr" : (["en","hu","sr"].includes(code) ? (code as Lang) : "en"));

/** Derive language from the first URL segment (client-safe) */
const getLangFromPath = (path?: string): Lang => {
  const p = path ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const seg = p.split("/").filter(Boolean)[0] || "";
  return normalizeLang(seg);
};


function PageInner({ initialLang }: { initialLang?: LangCode }) {
  const langs = ["en", "hu", "sr"] as const;
  const [lang, setLang] = useState<Lang>(() => getLangFromPath());

  const router = useRouter();
  const pathname = usePathname() ?? "/";

// Redirect "/" to preferred language or browser locale (client-side)
useEffect(() => {
  if (typeof window === "undefined") return;
  const currentPath = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const segments = currentPath.split("/").filter(Boolean);
  const isRoot = segments.length === 0;
  if (!isRoot) return;

  let target: LangCode | null = null;
  try {
    const stored = localStorage.getItem("preferredLang") as LangCode | null;
    if (stored && (stored === "en" || stored === "hu" || stored === "sr")) {
      target = stored;
    }
  } catch {}

  if (!target) {
    const navLangs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language])
      .map(l => l?.toLowerCase?.() || "");
    if (navLangs.some(l => l.startsWith("hu"))) target = "hu";
    else if (navLangs.some(l => l.startsWith("sr") || l.startsWith("sr-rs"))) target = "sr";
    else target = "en";
  }

  router.replace("/" + target, { scroll: false });
}, [pathname, router]);
  const searchParams = useSearchParams();

const [active, setActive] = useState<ActiveTab>(() => {
  // 1) URL ?tab=...
  const fromUrl = (searchParams?.get("tab") as ActiveTab) || null;
  if (fromUrl === "services" || fromUrl === "packages" || fromUrl === "faq" || fromUrl === "about") {
    return fromUrl;
  }
  // 2) localStorage lastTab
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("lastTab") as ActiveTab | null;
      if (saved === "services" || saved === "packages" || saved === "faq" || saved === "about") {
        return saved;
      }
    } catch {}
  }
  // 3) fallback
  return "services";
});

useEffect(() => {
  if (typeof window === "undefined") return;
  try { localStorage.setItem("lastTab", active); } catch {}

  // Update ?tab=... (no scroll / no full reload)
  const sp = new URLSearchParams(window.location.search);
  sp.set("tab", active);
  router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
}, [active, pathname, router]);



  const [menuOpen, setMenuOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [progress, setProgress] = useState(0);
const [langFx, setLangFx] = useState(false);

const changeLang = (code: LangCode) => {
  const anyDoc = document as any;
  const nav = () => {
    try { localStorage.setItem("preferredLang", code); localStorage.setItem("lang", code); } catch {}
    const currentPath = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const segments = currentPath.split("/").filter(Boolean);
    if (segments[0] === "en" || segments[0] === "hu" || segments[0] === "sr") {
      segments[0] = code;
      router.replace("/" + segments.join("/"), { scroll: false });
    } else {
      router.replace("/" + code, { scroll: false });
    }
  };
  if (anyDoc?.startViewTransition) {
    anyDoc.startViewTransition(() => {
      setLang(code);
      nav();
    });
  } else {
    setLang(code);
    nav();
    setLangFx(true);
    window.setTimeout(() => setLangFx(false), 200);
  }
};



  const t = tFor(lang);

  /* progress bar */
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      setProgress(Math.max(0, Math.min(1, p)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* persist small prefs */
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("lang", lang);
  }, [lang]);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("lastTab", active);
  }, [active]);
  useEffect(() => {
    const seg = getLangFromPath(pathname ?? "/");
    // If URL already carries a language, that wins.
    if (seg && lang !== seg) setLang(seg);

    if (typeof window !== "undefined") {
      const tab = localStorage.getItem("lastTab") as any;
      if (tab && ["services", "packages", "faq", "about"].includes(tab)) setActive(tab);
    }
  }, [pathname]);;

  const PHONE = "+381 62 834 7268";
  const WA = "https://wa.me/381628347268";
  const EMAIL = "kristofkolity@gmail.com";

  type TService = readonly [string, string];
type TPackage = readonly [string, string, string];

const services  = COPY[lang].services  as ReadonlyArray<TService>;
const packages  = COPY[lang].packages  as ReadonlyArray<TPackage>;
const faqs      = COPY[lang].faqs      as ReadonlyArray<TService>;
const about     = COPY[lang].about     as ReadonlyArray<string>;
  const bg1 = useRef<HTMLDivElement | null>(null);
  const bg2 = useRef<HTMLDivElement | null>(null);
  const bg3 = useRef<HTMLDivElement | null>(null);
  useScrollReactiveGlows([bg1, bg2, bg3]);

  const goTab = (tab: "services" | "packages" | "faq" | "about", scrollIfNeeded: boolean) => {
    setActive(tab);
    const el = document.getElementById("sections");
    if (scrollIfNeeded && el) {
      const r = el.getBoundingClientRect();
      const inView = r.top > 60 && r.top < window.innerHeight * 0.5;
      if (!inView) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMenuOpen(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const keys = ["services", "packages", "faq", "about"] as const;
      const ix = keys.indexOf(active as any);
      if (e.key === "ArrowRight") setActive(keys[(ix + 1) % keys.length]);
      if (e.key === "ArrowLeft") setActive(keys[(ix - 1 + keys.length) % keys.length]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
  <div id="lang-root"
    className={`relative min-h-screen bg-neutral-950 text-white ${
      langFx ? "lang-anim" : ""
    }`}
  >
    {/* Mouse glow background activator */}
    <MouseGlow />

      <div className="progress-bar">
        <div className="progress-bar__inner" style={{ transform: `scaleX(${progress})` }} />
      </div>

      {/* backdrop glow blobs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          ref={bg1}
          className="absolute -top-20 -left-20 h-[60vh] w-[80vw] md:w-[60vw] rounded-full blur-3xl will-change-[opacity] mix-blend-screen"
          style={{ background: "radial-gradient(600px 400px at center, rgba(16,185,129,0.55), transparent)", opacity: 0.45 }}
        />
        <div
          ref={bg2}
          className="absolute top-1/3 -right-24 h-[70vh] w-[80vw] md:w-[60vw] rounded-full blur-3xl will-change-[opacity] mix-blend-screen"
          style={{ background: "radial-gradient(600px 400px at center, rgba(99,102,241,0.5), transparent)", opacity: 0.38 }}
        />
        <div
          ref={bg3}
          className="absolute bottom-0 left-1/4 h-[50vh] w-[80vw] md:w-[50vw] rounded-full blur-3xl will-change-[opacity] mix-blend-screen"
          style={{ background: "radial-gradient(600px 400px at center, rgba(59,130,246,0.45), transparent)", opacity: 0.30 }}
        />
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/70 border-b border-zinc-200 dark:supports-[backdrop-filter]:bg-neutral-950/70 dark:border-neutral-800">
          <div className="mx-auto max-w-6xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className={`font-display ${manropeLocal.className} font-extrabold tracking-tight text-base sm:text-lg`}
            >
              {COPY[lang].brand}
            </button>
            <nav className="hidden md:flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-300">
              <button onClick={() => goTab("services", true)} className="nav-btn px-3 py-2 rounded-lg hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-800 whitespace-nowrap">
                {COPY[lang].navServices}
              </button>
              <button onClick={() => goTab("packages", true)} className="nav-btn px-3 py-2 rounded-lg hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-800 whitespace-nowrap">
                {COPY[lang].navPricing}
              </button>
              <button onClick={() => goTab("faq", true)} className="nav-btn px-3 py-2 rounded-lg hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-800 whitespace-nowrap">
                {COPY[lang].navFAQ}
              </button>
              <button onClick={() => goTab("about", true)} className="nav-btn px-3 py-2 rounded-lg hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-800 whitespace-nowrap">
                {COPY[lang].navAbout}
              </button>
              <button onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })} className="nav-btn px-3 py-2 rounded-lg hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-800 whitespace-nowrap">
                {COPY[lang].navContact}
              </button>
            </nav>
            <div className="flex items-center gap-1">
              <div className="inline-flex items-center gap-1 mr-1">
                {(["en", "hu", "sr"] as const).map((code) => (
                  <button
                    key={code}
                    onClick={() => changeLang(code)}
                    className={`px-2 py-1 rounded-lg border text-xs flex items-center gap-1 ${
                      lang === code
                        ? "bg-zinc-200 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-white dark:border-zinc-600"
                        : "text-zinc-700 border-zinc-300 hover:bg-zinc-100 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    }`}
                    aria-label={code === "sr" ? "RS" : code.toUpperCase()}
                  >
                    <Flag code={code} className="mr-1" />
                    {code === "sr" ? "RS" : code.toUpperCase()}
                  </button>
                ))}
              </div>
              <button
                className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 ml-1"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
          {menuOpen && (
            <div className="md:hidden absolute inset-x-0 top-full px-3 pb-3">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-900/95 backdrop-blur shadow-2xl px-3 py-2 text-center dark:border-neutral-800 dark:bg-neutral-950/95 animate-menu-in origin-top">
<div className="flex flex-col items-center gap-1.5 text-base font-semibold">
                  {(["services", "packages", "faq", "about"] as const).map((k) => (
                    <button key={k} onClick={() => goTab(k, true)} className="px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 w-full">
                      {COPY[lang].tabs[k]}
                    </button>
                  ))}
                  <a
                    href="#contact"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                      setMenuOpen(false);
                    }}
                    className="px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 w-full"
                  >
                    {COPY[lang].navContact}
                  </a>
                </div>
              </div>
            </div>
          )}
        </header>

        <section id="hero" className="relative">
          <div className="mx-auto max-w-6xl px-3 sm:px-4 py-12 sm:py-16 md:py-20">
            <h1 className={`font-display ${manropeLocal.className} text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight`}>{COPY[lang].brand}</h1>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl text-zinc-700 dark:text-zinc-300 max-w-2xl leading-snug">{COPY[lang].tagline}</p>
            <div className="mt-6 sm:mt-8 flex flex-wrap gap-3">
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold"
              >
                {COPY[lang].ctaBook}
              </a>
              <a
                href={WA}
                target="_blank"
                className="px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-sm inline-flex items-center gap-2 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <span>{COPY[lang].ctaCall}</span>
              </a>
            </div>
            <div className="mt-4 sm:mt-5 flex items-center gap-2 text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{COPY[lang].replyFast}</span>
            </div>
            <p className="mt-4 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">{COPY[lang].dropOnly}</p>
          </div>
        </section>

        <section id="sections" className="mx-auto max-w-6xl px-3 sm:px-4 pb-12 sm:pb-16 md:pb-20">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-900/70 dark:border-neutral-800 dark:bg-neutral-900/50 backdrop-blur p-2 sticky top-[66px] z-40">
            <div className="flex flex-wrap md:grid md:grid-cols-4 gap-2 overflow-x-auto hide-scrollbar md:overflow-visible snap-x md:snap-none px-1" role="tablist" aria-label="Sections">
              {[
                { key: "services", icon: <IconWrench className="icon-anim h-5 w-5" />, label: COPY[lang].tabs.services },
                { key: "packages", icon: <IconBox className="icon-anim h-5 w-5" />, label: COPY[lang].tabs.packages },
                { key: "faq", icon: <IconHelp className="icon-anim h-5 w-5" />, label: COPY[lang].tabs.faq },
                { key: "about", icon: <IconShield className="icon-anim h-5 w-5" />, label: COPY[lang].tabs.about },
              ].map((tab) => (
                <button
                  key={tab.key as string}
                  onClick={() => {
                    setActive(tab.key as any);
                    localStorage.setItem("lastTab", tab.key as string);
                  }}
                  className={`group inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium border snap-center ${
                    (active as any) === tab.key ? "bg-emerald-600 text-white border-emerald-600" : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  }`}
                  role="tab"
                  aria-selected={(active as any) === tab.key}
                >
                  {tab.icon}
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 sm:mt-8 fade-in" key={active}>
            {active === "services" && (
              <div className="section-wrapper">
                <h2 className={`font-display ${manropeLocal.className} text-2xl sm:text-3xl font-extrabold mb-1`}>{COPY[lang].servicesTitle}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 sm:mb-8">{COPY[lang].servicesSub}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {(services).map(([title, body], i) => (
                    <div key={i} className="group card rounded-2xl border border-zinc-200 bg-zinc-900 p-5 sm:p-6 shadow-xl dark:border-zinc-700 dark:bg-neutral-900/60">
                      <div className="flex items-center gap-3 mb-2">
                        {[
                          <svg key="tower" viewBox="0 0 24 24" className="h-6 w-6 icon-anim" stroke="currentColor" fill="none" strokeWidth="1.8"><rect x="6" y="3" width="12" height="18" rx="2"/><circle cx="12" cy="17" r="1.3"/><path d="M10 7h4v3h-4z"/></svg>,
                          <svg key="windows" viewBox="0 0 24 24" className="h-6 w-6 icon-anim" stroke="currentColor" fill="none" strokeWidth="1.8"><path d="M3 5l8-1v8H3V5zm10-1l8-1v9h-8V4zm-10 9h8v8l-8-1v-7zm10 0h8v9l-8-1v-8z"/></svg>,
                          <svg key="ssd" viewBox="0 0 24 24" className="h-6 w-6 icon-anim" stroke="currentColor" fill="none" strokeWidth="1.8"><rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="8" cy="12" r="1.2"/><circle cx="16" cy="12" r="1.2"/></svg>,
                          <svg key="build" viewBox="0 0 24 24" className="h-6 w-6 icon-anim" stroke="currentColor" fill="none" strokeWidth="1.8"><path d="M3 21v-3a4 4 0 0 1 4-4h3m0 7v-3a4 4 0 0 1 4-4h3m4 7h-3a4 4 0 0 1-4-4v-3m7 0h-3a4 4 0 0 1-4-4V4"/></svg>,
                          <svg key="business" viewBox="0 0 24 24" className="h-6 w-6 icon-anim" stroke="currentColor" fill="none" strokeWidth="1.8"><path d="M4 21V3h16v18M4 9h16M9 9v12M15 9v12M12 3v6"/></svg>,
                          <svg key="thermals" viewBox="0 0 24 24" className="h-6 w-6 icon-anim" stroke="currentColor" fill="none" strokeWidth="1.8"><path d="M12 3v10a4 4 0 1 0 0 8 4 4 0 0 0 0-8V3z"/></svg>,
                        ][i % 6]}
                        <h3 className={`font-display ${manropeLocal.className} text-lg sm:text-xl font-bold`}>{title}</h3>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-snug">{body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {active === "packages" && (
              <div className="section-wrapper">
                <h2 className={`font-display ${manropeLocal.className} text-2xl sm:text-3xl font-extrabold mb-1`}>{COPY[lang].packagesTitle}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 sm:mb-8">{COPY[lang].packagesSub}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {(packages).map(([name, desc, price], i) => (
                    <div key={i} className="group card rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6 shadow-xl dark:border-emerald-700 dark:bg-emerald-900/40">
                      <div className="flex items-baseline justify-between gap-4">
                        <h4 className={`font-display ${manropeLocal.className} text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-300`}>{name}</h4>
                        <div className="text-right">
                          <div className="text-xl sm:text-2xl font-extrabold">{price} {COPY[lang].rsd}</div>
                          <div className="text-[10px] sm:text-xs text-emerald-700/70 dark:text-emerald-200/80">{COPY[lang].from}</div>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-emerald-900/80 dark:text-emerald-100/90 leading-snug">{desc}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 sm:mt-4 text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-snug">{COPY[lang].pricesNote}</p>
              </div>
            )}

            {active === "faq" && (
              <div className="section-wrapper">
                <h2 className={`font-display ${manropeLocal.className} text-2xl sm:text-3xl font-extrabold mb-1`}>{COPY[lang].faqsTitle}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 sm:mb-8">{COPY[lang].faqsSub}</p>
                <div className="divide-y divide-zinc-200 dark:divide-neutral-800 rounded-2xl border border-zinc-200 dark:border-neutral-800 bg-zinc-900/70 dark:bg-neutral-900/50 backdrop-blur">
                  {(faqs).map(([q, a], idx) => (
                    <details key={idx} className="group p-4 sm:p-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between">
                        <span className="text-sm sm:text-base font-medium leading-snug">{q}</span>
                        <svg className="h-5 w-5 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </summary>
                      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 leading-snug">{a}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {active === "about" && (
              <div className="section-wrapper">
                <h2 className={`font-display ${manropeLocal.className} text-2xl sm:text-3xl font-extrabold mb-1`}>{COPY[lang].aboutTitle}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 sm:mb-8">{COPY[lang].aboutSub}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {(about).map((line, i) => (
                    <div key={i} className="group card rounded-2xl border border-zinc-200 bg-zinc-900 p-5 sm:p-6 shadow-xl dark:border-zinc-700 dark:bg-neutral-900/60">
                      <div className="flex items-center gap-3">
                        <IconShield className="icon-anim h-6 w-6" />
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-snug">{line}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section id="contact" className="mx-auto max-w-6xl px-3 sm:px-4 pb-20 sm:pb-24">
          <div className="section-wrapper">
            <h2 className={`font-display ${manropeLocal.className} text-2xl sm:text-3xl font-extrabold mb-6 sm:mb-8`}>{COPY[lang].contactTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
              <form
              id="contact-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const data = new FormData(form);
                  const payload = {
                    name: String(data.get("name") || ""),
                    email: String(data.get("email") || ""),
                    message: String(data.get("message") || ""),
                    honey: String(data.get("company") || ""),
                  };
                  if (payload.honey) return;
                  setSending(true);
                  setStatus("idle");
                  try {
                    const res = await fetch("/api/contact", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: payload.name, email: payload.email, message: payload.message }),
                    });
                    setStatus(res.ok ? "ok" : "err");
                    if (res.ok) form.reset();
                  } catch {
                    setStatus("err");
                  } finally {
                    setSending(false);
                  }
                }}
                className="rounded-2xl border border-zinc-200 p-5 sm:p-6 bg-zinc-900 dark:border-zinc-700 dark:bg-neutral-900/60"
              >
                <div className="grid gap-3 sm:gap-4">
                  <label className="text-sm">
                    {COPY[lang].formName}
                    <input
                      name="name"
                      className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600 dark:bg-neutral-800 dark:border-zinc-700"
                      required
                    />
                  </label>
                  <label className="text-sm">
                    {COPY[lang].formEmail}
                    <input
                      name="email"
                      type="email"
                      className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600 dark:bg-neutral-800 dark:border-zinc-700"
                      required
                    />
                  </label>
                  <label className="text-sm">
                    {COPY[lang].formMsg}
                    <textarea
                      name="message"
                      rows={5}
                      className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600 dark:bg-neutral-800 dark:border-zinc-700"
                    />
                  </label>
                  <input name="company" className="hidden" tabIndex={-1} autoComplete="nope" />
                  <button
                    disabled={sending}
                    className="mt-1 sm:mt-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-sm font-semibold w-full sm:w-fit"
                  >
                    {sending ? "..." : COPY[lang].formSend}
                  </button>
                  {status === "ok" && <div className="text-[13px] sm:text-sm mt-1 text-emerald-600 dark:text-emerald-300">{COPY[lang].formSuccess}</div>}
                  {status === "err" && <div className="text-[13px] sm:text-sm mt-1 text-red-500 dark:text-red-300">{COPY[lang].formFail}</div>}
                </div>
              </form>
                  <FormAutosave selector="#contact-form" />
              <div className="h-full rounded-2xl border border-zinc-200 p-5 sm:p-6 bg-zinc-900 dark:border-zinc-700 dark:bg-neutral-900/60">
  <div className="flex flex-col min-h-full space-y-2.5 sm:space-y-3 text-zinc-700 dark:text-zinc-300 text-[13px] sm:text-sm">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">{COPY[lang].phoneLabel}</span>{" "}
                    <Copyable text={PHONE} kind="phone" lang={lang}>{PHONE}</Copyable> ·{" "}
                    <a className="underline hover:no-underline" href={WA} target="_blank" rel="noreferrer">
                      WhatsApp
                    </a>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">{COPY[lang].emailLabel}</span>{" "}
                    <Copyable text={EMAIL} kind="email" lang={lang}>{EMAIL}</Copyable>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Hours:</span> {COPY[lang].hours}
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">Location:</span> {COPY[lang].address}
                  </div>
                  <div className="mt-auto pt-[14rem] text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                    GDPR note: messages are stored only for scheduling and invoices.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-zinc-200 dark:border-neutral-800">
          <div className="mx-auto max-w-6xl px-3 sm:px-4 py-6 sm:py-8 text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-500 flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="text-center md:text-left">
              © {new Date().getFullYear()} Kristóf Kólity — {COPY[lang].brand} ·{" "}
              <a className="underline hover:no-underline" href={`mailto:${EMAIL}`}>{EMAIL}</a>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1">
                {(["en", "hu", "sr"] as const).map((code) => (
                  <button
                    key={code}
                    onClick={() => changeLang(code)}
                    className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 ${
                      lang === code
                        ? "bg-zinc-200 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-white dark:border-zinc-600"
                        : "text-zinc-700 border-zinc-300 hover:bg-zinc-100 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Flag code={code} className="mr-1" />
                    {code === "sr" ? "RS" : code.toUpperCase()}
                  </button>
                ))}
              </div>
              <a
                href="#hero"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="hover:text-zinc-900 dark:hover:text-zinc-300"
              >
                {COPY[lang].backTop}
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Suspense wrapper required by Next.js when using useSearchParams
export default function Page({ initialLang }: PageProps = {}) {
  const __initialLang: LangCode | undefined = typeof initialLang !== "undefined" ? initialLang : undefined;

  return (
    <Suspense fallback={null}>
      <PageInner />
    </Suspense>
  );
}