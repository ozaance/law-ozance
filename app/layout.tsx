import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

// Inter — texte / UI (police de corps de LegalPlace).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Switzer (Fontshare) — grotesque pour les titres, équivalent libre de Rebond Grotesque.
const switzer = localFont({
  variable: "--font-switzer",
  display: "swap",
  src: [
    { path: "./fonts/Switzer-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Switzer-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Switzer-Semibold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Switzer-Bold.woff2", weight: "700", style: "normal" },
  ],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://law-ozance-pbki.vercel.app";

const description =
  "Centralisez vos dossiers, automatisez votre facturation et gardez le contrôle de votre activité depuis un seul espace.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ozance — La plateforme qui pilote votre cabinet",
    template: "%s · Ozance",
  },
  description,
  applicationName: "Ozance",
  keywords: [
    "logiciel avocat",
    "gestion cabinet d'avocats",
    "facturation avocat",
    "suivi du temps",
    "dossiers juridiques",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: "Ozance",
    title: "Ozance — La plateforme qui pilote votre cabinet",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Ozance — La plateforme qui pilote votre cabinet",
    description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${switzer.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
