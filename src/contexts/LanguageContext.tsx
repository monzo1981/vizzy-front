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
    chat: {
      agenda: "What's Hot today?"
    },
    dropdown: {
      viewProfile: "View profile",
      upgradePlan: "Upgrade plan",
      settings: "Settings",
      help: "Help",
      logOut: "Log out"
    },
    profile: {
      editProfile: "Edit Profile",
      personalInfo: "Personal info",
      edit: "Edit",
      name: "Name",
      businessName: "Business name",
      jobTitle: "Job Title",
      industry: "Industry",
      aboutCompany: "About Company",
      email: "Email",
      mobile: "Mobile",
      website: "Website",
      recentWork: "Recent work",
      nothingHere: "Nothing here yet!",
      startGenerating: "Start Generating Now",
      seeFulld: "See Full",
      galleryLoading: "Loading...",
      myLinks: "My Links",
      linksDescription: "This links to your accounts will be used as reference for tone of voice and visual direction, to influence future generated visuals if needed.",
      yourLogo: "Your Logo",
      upload: "Upload",
      credits: "Credits",
      creditsRemaining: "You have",
      creditsRemainingEnd: "credits remaining",
      upgradeMessage: "Upgrade now to unlock more generations",
      upgradeNow: "Upgrade Now",
      assets: "Assets",
      brandManual: "Brand Manual",
      companyProfile: "Company Profile",
      document: "Document",
      remove: "Remove",
      update: "Update",
      assetsUpload: "upload",
      uploading: "Uploading...",
      notAvailable: "Not available",
      // Sidebar
      profile: "Profile",
      notification: "Notification",
      subscription: "Subscription",
      activities: "Activities",
      interest: "Interest",
      inviteWin: "Invite & win",
      payment: "Payment",
      secure: "Secure",
      password: "Password",
      access: "Access",
      deleteAccount: "Delete Account",
      // Toast messages
      loginAgain: "Please login again",
      logoUpdated: "Logo updated successfully!",
      logoUpdateFailed: "Failed to update logo",
      logoUpdateError: "Error updating logo",
      noFileSelected: "No file selected.",
      fileUploadFailed: "File upload failed. Please check the server response.",
      fileUploadSuccess: "uploaded successfully.",
      fileUploadError: "An error occurred during file upload.",
      fileRemovalFailed: "File removal failed.",
      fileRemovalSuccess: "removed successfully.",
      fileRemovalError: "An error occurred during file removal.",
      // Profile picture upload hints
      uploadProfilePic: "For uploading new Profile pic",
      recommendedSize: "At least 800×800 px recommended",
      allowedFormats: "JPG or PNG is allowed"
    }
  },
  ar: {
    chat: {
      agenda: "جرّب الجديد أول بأول"
    },
    dropdown: {
      viewProfile: "عرض الملف الشخصي",
      upgradePlan: "ترقية الخطة",
      settings: "الإعدادات",
      help: "المساعدة",
      logOut: "تسجيل الخروج"
    },
    profile: {
      editProfile: "تعديل الملف الشخصي",
      personalInfo: "المعلومات الشخصية",
      edit: "تعديل",
      name: "الاسم",
      businessName: "اسم شركتك",
      jobTitle: "المسمى الوظيفي",
      industry: "المجال",
      aboutCompany: "عن الشركة",
      email: "البريد الإلكتروني",
      mobile: "رقم الهاتف",
      website: "الموقع الإلكتروني",
      recentWork: "أعمالك السابقة",
      nothingHere: "لا يوجد أعمال سابقة!",
      startGenerating: "ابدأ الآن",
      seeFulld: "عرض الكل",
      galleryLoading: "جارٍ تحميل...",
      myLinks: "الروابط الشخصية",
      linksDescription: "سيتم استخدام روابط حساباتك في منصات التواصل  كمصدر مرجعي لطريقة الكلام و توجه التصميم البصري و الألوان ، وذلك للتأثير على الصور التي سيتم توليدها لاحقًا إذا لزم الأمر.",
      yourLogo: "شعارك",
      upload: "ارفع شعارك الان",
      credits: "النقاط",
      creditsRemaining: "لديك",
      creditsRemainingEnd: "نقطة متبقية",
      upgradeMessage: "افتح ميزات اضافية  و انتقل للخطة الاعلى",
      upgradeNow: "ترقية",
      assets: "ملفات الهوية البصرية",
      brandManual: "الهوية البصرية",
      companyProfile: "ملف تعريف الشركة",
      document: "ملف 1",
      remove: "مسح",
      update: "تحديث",
      assetsUpload: "رفع ملف جديد",
      uploading: "جارٍ الرفع...",
      notAvailable: "غير متوفر",
      // Sidebar
      profile: "الملف الشخصي",
      notification: "الإشعارات",
      subscription: "الاشتراك",
      activities: "الأنشطة",
      interest: "الاهتمامات",
      inviteWin: "ادع واربح",
      payment: "الدفع",
      secure: "الأمان",
      password: "كلمة المرور",
      access: "الوصول",
      deleteAccount: "حذف الحساب",
      // Toast messages
      loginAgain: "الرجاء تسجيل الدخول مرة أخرى",
      logoUpdated: "تم تحديث الشعار بنجاح!",
      logoUpdateFailed: "فشل في تحديث الشعار",
      logoUpdateError: "خطأ في تحديث الشعار",
      noFileSelected: "لم يتم اختيار ملف.",
      fileUploadFailed: "فشل في رفع الملف. يرجى التحقق من استجابة الخادم.",
      fileUploadSuccess: "تم الرفع بنجاح.",
      fileUploadError: "حدث خطأ أثناء رفع الملف.",
      fileRemovalFailed: "فشل في إزالة الملف.",
      fileRemovalSuccess: "تم الحذف بنجاح.",
      fileRemovalError: "حدث خطأ أثناء إزالة الملف.",
      // Profile picture upload hints
      uploadProfilePic: "لتحديث صورة الملف الشخصي يفضل أن لا تقل أبعادها عن",
      recommendedSize: "أبعاد الصورة الحديدة عن 800X800 بكسل",
      allowedFormats: "JPG or PNG: الصيغ المقبولة"
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