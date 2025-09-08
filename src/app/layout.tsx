"use client"
export const dynamic = 'force-dynamic' 

import { Inter } from "next/font/google";
import "./globals.css";
import { useEffect } from "react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Inject Mojeeb chat widget script dynamically for Next.js compatibility
  useEffect(() => {
    if (typeof window !== "undefined" && !document.getElementById("mojeeb-chat-widget")) {
      const script = document.createElement("script");
      script.id = "mojeeb-chat-widget";
      script.src = "https://mojeebcdn.z7.web.core.windows.net/mojeeb-widget.js";
      script.setAttribute("data-widget-id", "07c413ba-ff3d-47ed-9eb4-95df9ec8e70b");
      script.setAttribute("data-config", "{}")
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
