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

export const metadata = {
  title: "TuPresuListo - Gestión para Carpintería",
  description: "Gestión profesional y sencilla de presupuestos",
  icons: {
    icon: '/icon.svg',
  },
};

import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Script src="https://assets.lemonsqueezy.com/lemon.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
