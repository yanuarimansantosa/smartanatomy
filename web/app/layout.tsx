import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NovaCareEMR · Salam AI",
    template: "%s · NovaCareEMR",
  },
  description:
    "NovaCareEMR — Clinical Practice Operating System dari Salam AI. Offline-first, tablet-friendly, terintegrasi SATUSEHAT. Teknologi yang Membawa Kesejahteraan Berkeadilan.",
  manifest: "/manifest.json",
  applicationName: "NovaCareEMR",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NovaCareEMR",
  },
  formatDetection: {
    telephone: false,
  },
  authors: [
    {
      name: "MedInovaTech / Lanungga Studio",
    },
  ],
  keywords: [
    "EMR",
    "RME",
    "rekam medis elektronik",
    "SATUSEHAT",
    "FHIR",
    "Salam AI",
    "NovaCareEMR",
    "ethical clinical AI",
    "praktek mandiri",
  ],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased theme-teduh`}
    >
      <head>
        <script
          // Apply saved theme BEFORE first paint to avoid flash.
          // Filters out ANY existing theme-* class so new palettes work without
          // needing to update this list.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('salamai.theme')||'teduh';var r=document.documentElement;var c=(r.className||'').split(/\\s+/).filter(function(x){return x&&x.indexOf('theme-')!==0;});c.push('theme-'+t);r.className=c.join(' ');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
