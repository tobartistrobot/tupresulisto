import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL('https://tupresulisto.com'),
  title: "TuPresuListo - Gestión para Carpintería",
  description: "Presupuestos profesionales en minutos. La herramienta definitiva para carpintería, cristalería y reformas.",
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'TuPresuListo - Gestión para Carpintería',
    description: 'Presupuestos profesionales en minutos. La herramienta definitiva para carpintería, cristalería y reformas.',
    url: 'https://tupresulisto.com',
    siteName: 'TuPresuListo',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'TuPresuListo - Gestión para Carpintería',
    description: 'Presupuestos profesionales en minutos. La herramienta definitiva para carpintería, cristalería y reformas.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import Script from "next/script";

import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { CSPostHogProvider } from '@/components/Providers/PostHogProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CSPostHogProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              <ToastProvider>
                {children}
                <Script src="https://assets.lemonsqueezy.com/lemon.js" strategy="lazyOnload" />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </CSPostHogProvider>
      </body>
    </html>

  );
}
