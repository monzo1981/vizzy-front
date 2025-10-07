"use client"
export const dynamic = 'force-dynamic' 

import { Inter } from "next/font/google";
import { Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { useEffect } from "react";
import { LanguageProvider } from "../contexts/LanguageContext";
import { ThemeProvider } from "../contexts/ThemeContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  display: "block",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
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

  // Auto-detect Arabic text and apply appropriate font
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Flag to track if hydration is complete
      let hydrationComplete = false;
      
      const applyArabicFont = () => {
        // Skip during hydration to avoid mismatch
        if (!hydrationComplete) return;
        
        // Arabic Unicode range: U+0600-U+06FF
        const arabicRegex = /[\u0600-\u06FF]/;
        
        // Find all text nodes in the document
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
          textNodes.push(node);
        }
        
        // Check each text node for Arabic content
        textNodes.forEach(textNode => {
          if (textNode.textContent && arabicRegex.test(textNode.textContent)) {
            const element = textNode.parentElement;
            if (element && !element.hasAttribute('data-font-applied') && !element.hasAttribute('suppressHydrationWarning')) {
              // Use a CSS class instead of inline styles to avoid hydration issues
              if (!element.classList.contains('arabic-text')) {
                element.classList.add('arabic-text');
                element.setAttribute('data-font-applied', 'arabic');
              }
            }
          }
        });
      };
      
      // Wait for hydration to complete before applying font changes
      const timeoutId = setTimeout(() => {
        hydrationComplete = true;
        applyArabicFont();
      }, 500); // Increased delay to ensure hydration is complete
      
      // Apply when DOM changes (for dynamic content)
      const observer = new MutationObserver(() => {
        applyArabicFont();
      });
      
      // Start observing after hydration
      const observerTimeoutId = setTimeout(() => {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }, 500);
      
      return () => {
        clearTimeout(timeoutId);
        clearTimeout(observerTimeoutId);
        observer.disconnect();
      };
    }
  }, []);

  // Set page title based on route
  let pageTitle = "Vizzy";
  if (typeof window !== "undefined") {
    const path = window.location.pathname;
    if (path === "/") pageTitle = "Vizzy";
    else if (path.startsWith("/chat")) pageTitle = "Chat";
    else if (path.startsWith("/profile")) pageTitle = "Profile";
    else if (path.startsWith("/signup")) pageTitle = "Sign Up";
  }

  return (
    <html lang="ar" suppressHydrationWarning>
      <head>
        <title>{pageTitle}</title>
        <link rel="icon" href="/web-icon.svg" />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body
        className={`${inter.variable} ${notoSansArabic.variable} antialiased`}
        suppressHydrationWarning
      >
        <LanguageProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
