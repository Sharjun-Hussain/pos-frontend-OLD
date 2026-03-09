// app/layout.jsx
"use client"
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "./providers";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Inter } from 'next/font/google'
import { useEffect } from "react";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export default function RootLayout({ children }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => console.log('scope is: ', registration.scope));
    }
  }, []);

  const { global } = useSettingsStore();
  const zoomLevel = global?.zoomLevel || 1;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`} style={{ zoom: zoomLevel }}>
        <NextTopLoader showSpinner={false} color="#10b981" />
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}