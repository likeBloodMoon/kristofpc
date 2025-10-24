import "./globals.css";
import { Inter, Manrope } from "next/font/google";
import type { Metadata } from "next";
import InAppBrowserNotice from "../components/InAppBrowserNotice";

const inter = Inter({ subsets: ["latin","latin-ext"], display: "swap", variable: "--font-inter", preload: true });
const manrope = Manrope({ subsets: ["latin","latin-ext"], display: "swap", variable: "--font-manrope", preload: true });

const SITE_URL = "https://kristofpc.vercel.app"; // ← change if you move domains

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kristóf PC Műhelye | Gyors, korrekt javítás. Precíz kivitel.",
    template: "%s | Kristóf PC Műhelye",
  },
  description:
    "PC szerviz és karbantartás Bačka Topolán: hardver- és szoftverjavítás, adatmentés, tisztítás, optimalizálás és összeszerelés.",
  keywords: [
    "PC javítás",
    "asztali gép szerviz",
    "hardver diagnosztika",
    "adatmentés",
    "BIOS finomhangolás",
    "tisztítás",
    "Bačka Topola",
    "Kristóf PC Műhelye",
  ],
  authors: [{ name: "Kristóf Kólity" }],
  creator: "Kristóf Kólity",
  publisher: "Kristóf PC Műhelye",

  // 👇 canonical + hreflang for localized routes
  alternates: {
    canonical: SITE_URL,
    languages: {
      en: `${SITE_URL}/en`,
      hu: `${SITE_URL}/hu`,
      sr: `${SITE_URL}/sr`,
    },
  },

  openGraph: {
    title: "Kristóf PC Műhelye",
    description:
      "Gyors, korrekt javítás Bačka Topolán. PC szerviz és karbantartás asztali gépekhez és munkaállomásokhoz.",
    url: SITE_URL,
    siteName: "Kristóf PC Műhelye",
    locale: "hu_HU", // default; /[lang] routes override via generateMetadata
    type: "website",
    images: [
      {
        url: "/og-image.jpg", // put this in /public
        width: 1200,
        height: 630,
        alt: "Kristóf PC Műhelye",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Kristóf PC Műhelye | Gyors, korrekt javítás",
    description:
      "Hardver és szoftver szerviz, adatmentés, tisztítás és optimalizálás Bačka Topolán.",
    images: ["/og-image.jpg"],
    creator: "@yourhandle", // optional
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: "/favicon.ico", // put in /public
    apple: "/apple-touch-icon.png", // optional
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // default language for root; /[lang]/layout.tsx should override <html lang className="dark"> per locale
  return (
    <html lang="hu" className={`dark ${inter.variable} ${manrope.variable}`}>
      <head>
        {/* LocalBusiness structured data for better local SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Kristóf PC Workshop",
  "image": "https://kristofpc.vercel.app/og.jpg",
  "telephone": "+381628347268",
  "email": "kristofkolity@gmail.com",
  "address": { "@type": "PostalAddress", "addressLocality": "Bačka Topola", "addressCountry": "RS" },
  "areaServed": "Bačka Topola",
  "openingHours": "Mo-Fr 09:00-18:00",
  "url": "https://kristofpc.vercel.app/"
})}} />
              <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-neutral-950 min-h-[100dvh] text-zinc-200">
        <InAppBrowserNotice />{children}</body>
    </html>
  );
}