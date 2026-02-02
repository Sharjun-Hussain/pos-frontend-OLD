// app/layout.jsx
"use client"
// import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Providers from "./providers";
import { useSettingsStore } from "@/store/useSettingsStore";

import { Ubuntu } from 'next/font/google'
import { useEffect } from "react";

const ubuntu = Ubuntu({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-ubuntu',
})

// const inter = Inter({ subsets: ["latin"] });

// export const metadata = {
//   title: "POS Application",
//   description: "Point of Sale Application",

// };

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
      <body className={ubuntu.variable} style={{ zoom: zoomLevel }}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors /> {/* Add the Toaster here */}
        </Providers>
      </body>
    </html>
  );
}