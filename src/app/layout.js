import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { SITE_URL } from '../lib/site';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITULO = 'TuPresuListo — Presupuestos para profesionales desde el móvil';
const DESCRIPCION =
  'Haz presupuestos de ventanas, toldos, carpintería y cristalería en el móvil y envíalos por WhatsApp al momento, desde casa del cliente. Prueba gratis, sin tarjeta.';

export const metadata = {
  // La base con www: es el dominio que se sirve de verdad. Con esto, todos
  // los canonical/OG relativos del sitio se resuelven contra el dominio bueno.
  metadataBase: new URL(SITE_URL),
  // `template` deja que cada página ponga su propio título ("Login | TuPresuListo")
  // sin repetir la marca a mano. `default` es el de la home.
  title: {
    default: TITULO,
    template: '%s | TuPresuListo',
  },
  description: DESCRIPCION,
  applicationName: 'TuPresuListo',
  keywords: [
    'presupuestos', 'app presupuestos', 'programa presupuestos',
    'carpintería', 'aluminio', 'PVC', 'cristalería', 'toldos', 'ventanas',
    'autónomo', 'gremio', 'presupuesto por WhatsApp',
  ],
  authors: [{ name: 'TuPresuListo' }],
  alternates: { canonical: '/' },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
  // Permite instalar y abrir como app en iOS (Añadir a pantalla de inicio)
  appleWebApp: {
    capable: true,
    title: 'TuPresuListo',
    statusBarStyle: 'default',
  },
  openGraph: {
    title: TITULO,
    description: DESCRIPCION,
    url: SITE_URL,
    siteName: 'TuPresuListo',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITULO,
    description: DESCRIPCION,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Necesario para que env(safe-area-inset-*) funcione en móviles con notch
  viewportFit: 'cover',
  // La barra de estado del móvil acompaña al tema de la app
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

import Script from "next/script";

import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { ConfirmProvider } from '../context/ConfirmContext';
import { CSPostHogProvider } from '@/components/Providers/PostHogProvider';
import ImpersonationBanner from '../components/ImpersonationBanner';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';

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
                <ConfirmProvider>
                  <ServiceWorkerRegister />
                  <ImpersonationBanner />
                  {children}
                  <Script src="https://assets.lemonsqueezy.com/lemon.js" strategy="lazyOnload" />
                </ConfirmProvider>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </CSPostHogProvider>
      </body>
    </html>

  );
}
