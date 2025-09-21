"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  changeLanguage: (language: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
  isHydrated: boolean;
  createLocalizedPath: (path: string) => string;
  navigateWithLanguage: (path: string) => void;
}

const translations = {
  en: {
    nav: {
      chat: "Chat",
      profile: "Profile"
    },
    chat: {
      title: "Chat",
      placeholder: "Type your message...",
      send: "Send",
      newChat: "New Chat",
      loading: "Loading...",
      typing: "Typing...",
      agenda: "What's on your agenda today?"
    }
  },
  ar: {
    nav: {
      chat: "المحادثة", 
      profile: "الملف الشخصي"
    },
    chat: {
      title: "المحادثة",
      placeholder: "اكتب رسالتك...",
      send: "إرسال",
      newChat: "محادثة جديدة",
      loading: "جارٍ التحميل...",
      typing: "يكتب...",
      agenda: "ما هو الموجود في جدول أعمالك؟"
    }
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en'); // Always start with 'en' for SSR consistency
  const [isHydrated, setIsHydrated] = useState(false);

  // Enhanced URL-based language management with localStorage backup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const detectAndSetLanguage = () => {
        const path = window.location.pathname;
        const isArabicPath = path.startsWith('/ar');
        const urlLanguage = isArabicPath ? 'ar' : 'en';
        
        // For pages without language prefix, check localStorage as fallback
        let finalLanguage: Language = urlLanguage;
        if (!isArabicPath && path === '/') {
          // Only for root path, consider localStorage preference
          const savedLanguage = localStorage.getItem('language') as Language;
          if (savedLanguage === 'ar') {
            // User prefers Arabic but is on root - redirect to /ar
            window.history.replaceState({}, '', '/ar');
            finalLanguage = 'ar';
          }
        }
        
        // Set language immediately without comparison to fix hydration
        setLanguage(finalLanguage);
        setIsHydrated(true);
        
        // Always keep localStorage in sync
        localStorage.setItem('language', finalLanguage);
        
        // Update document attributes smoothly
        document.documentElement.lang = finalLanguage;
        // Let components decide individually on RTL
        document.documentElement.removeAttribute('dir');
      };

      // Initial detection
      detectAndSetLanguage();
      
      // Listen for route changes (back/forward navigation)
      const handlePopState = () => {
        detectAndSetLanguage();
      };
      
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []); // Empty dependency array - only run once on mount

  // Enhanced language change function with URL navigation
  const changeLanguage = (newLanguage: Language) => {
    const currentPath = window.location.pathname;
    let newPath = '';
    
    if (newLanguage === 'ar') {
      // Switch to Arabic: add /ar prefix
      if (currentPath.startsWith('/ar')) {
        newPath = currentPath; // Already Arabic
      } else {
        newPath = `/ar${currentPath === '/' ? '' : currentPath}`;
      }
    } else {
      // Switch to English: remove /ar prefix
      if (currentPath.startsWith('/ar')) {
        newPath = currentPath.replace('/ar', '') || '/';
      } else {
        newPath = currentPath; // Already English
      }
    }
    
    // Navigate to new path if different
    if (newPath !== currentPath) {
      // Use pushState for smooth navigation without page reload
      window.history.pushState({}, '', newPath);
      
      // Manually trigger detection after navigation
      setLanguage(newLanguage);
      localStorage.setItem('language', newLanguage);
      document.documentElement.lang = newLanguage;
      document.documentElement.removeAttribute('dir');
    }
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = translations[language];
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return (typeof value === 'string') ? value : key;
  };

  const isRTL = language === 'ar';

  // Helper function to create language-aware URLs
  const createLocalizedPath = (path: string): string => {
    // Remove leading slash if exists
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    if (language === 'ar') {
      return cleanPath ? `/ar/${cleanPath}` : '/ar';
    }
    return cleanPath ? `/${cleanPath}` : '/';
  };

  // Helper function to navigate with current language
  const navigateWithLanguage = (path: string) => {
    const localizedPath = createLocalizedPath(path);
    window.history.pushState({}, '', localizedPath);
    // Trigger a popstate-like event to update components
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      changeLanguage,
      t, 
      isRTL,
      isHydrated,
      createLocalizedPath,
      navigateWithLanguage
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};