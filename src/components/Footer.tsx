import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';


export const Footer = () => {
  const { t, isRTL, createLocalizedPath } = useLanguage();
  return (
    <footer className="bg-[#11002E] text-white px-6 py-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        {/* Logo */}
        <div className="flex justify-start mb-4">
          <Image src="/vizzy-logo-dark.svg" alt="VIZZY Logo" width={180} height={180} />
        </div>

        {/* Section Titles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-8">
          <h4 style={{ background: 'linear-gradient(90.19deg, #4248FF 3.94%, #FF4A19 109.12%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', fontWeight: 700, fontSize: '20px' }}>
            {t('footer.personalAgency')}
          </h4>
          <h4 style={{ background: 'linear-gradient(90.19deg, #4248FF 3.94%, #FF4A19 109.12%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', fontWeight: 700, fontSize: '20px' }}>
            {t('footer.helpfulLinks')}
          </h4>
          <h4 style={{ background: 'linear-gradient(90.19deg, #4248FF 3.94%, #FF4A19 109.12%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', fontWeight: 700, fontSize: '20px' }}>
            {t('footer.informationCenter')}
          </h4>
          <div className="flex space-x-4">
            <Link href={createLocalizedPath('chat')} className="hover:text-white transition-colors" style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>
              {t('footer.home')}
            </Link>
            <Link href={createLocalizedPath('pricing')} className="hover:text-white transition-colors" style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>
              {t('footer.pricing')}
            </Link>
            <Link href={createLocalizedPath('services')} className="hover:text-white transition-colors" style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>
              {t('footer.services')}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">{t('footer.aboutUs')}</h4>
              <p className="text-sm leading-relaxed" style={{ color: '#78758E', fontWeight: 400 }}>
                {t('footer.aboutDescription')}
              </p>
              
              <div className="space-y-3">
                <h4 className="text-lg font-semibold">{t('footer.contactUs')}</h4>
                <div className="flex space-x-4 text-sm" style={{ color: '#78758E', fontWeight: 400 }}>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5" />
                    <span>{t('footer.supportEmail')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5" />
                    <span>{t('footer.infoEmail')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Helpful Links & Features */}
          <div className="space-y-6">
            <div className="space-y-3 text-sm" style={{ color: '#78758E', fontWeight: 400 }}>
              <Link href={createLocalizedPath('competitions')} className="block hover:text-white transition-colors">{t('footer.competitions')}</Link>
              <Link href={createLocalizedPath('testimonials')} className="block hover:text-white transition-colors">{t('footer.testimonials')}</Link>
              <Link href={createLocalizedPath('tutorials')} className="block hover:text-white transition-colors">{t('footer.tutorials')}</Link>
              <Link href={createLocalizedPath('blogs')} className="block hover:text-white transition-colors">{t('footer.blogs')}</Link>
              <Link href={createLocalizedPath('events')} className="block hover:text-white transition-colors">{t('footer.events')}</Link>
            </div>
          </div>

          {/* Information Center */}
          <div className="space-y-6">
            <div className="space-y-3 text-sm" style={{ color: '#78758E', fontWeight: 400 }}>
              <Link href={createLocalizedPath('terms')} className="block hover:text-white transition-colors">{t('footer.terms')}</Link>
              <Link href={createLocalizedPath('privacy')} className="block hover:text-white transition-colors">{t('footer.privacy')}</Link>
              <Link href={createLocalizedPath('support')} className="block hover:text-white transition-colors">{t('footer.support')}</Link>
            </div>
            
            <div className="space-y-3">
              <h4 style={{ background: 'linear-gradient(90.19deg, #4248FF 3.94%, #FF4A19 109.12%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', fontWeight: 700, fontSize: '20px' }}>
                {t('footer.keepInTouch')}
              </h4>
              <div className="flex space-x-4">
                <a href="https://www.facebook.com/share/16SE6Ny5jB/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Image src="/facebook.svg" alt="Facebook" width={24} height={24} />
                </a>
                <a href="https://www.instagram.com/vizzy.app?igsh=NzlxMTl4eXE1MGdi" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Image src="/instagram.svg" alt="Instagram" width={24} height={24} />
                </a>
                <a href="https://www.linkedin.com/company/vizzy-app/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Image src="/linkedin.svg" alt="LinkedIn" width={24} height={24} />
                </a>
              </div>
            </div>
          </div>

          {/* Newsletter & Top Links */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold" style={{ color: '#4248FF' }}>
                {t('footer.subscribeTitle')}
              </h4>
              <div className="space-y-3">
                <input 
                  type="email"
                  placeholder={t('footer.emailPlaceholder')} 
                  className="w-full bg-white text-black placeholder:text-[#78758E] rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ fontWeight: 200 }}
                />
                <button className="w-full text-white rounded-lg px-4 py-2 hover:shadow-lg transition-all" style={{ background: 'linear-gradient(90deg, #4248FF 0%, #7FCAFE 98.7%)', fontWeight: 700, fontSize: '18px' }}>
                  {t('footer.subscribeNow')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white pt-6 text-center">
          <p className="text-sm text-white">
            © All Copy Rights is Reseved to vizzy app 2025 - Owned By  Monzology EG  and any fesa or zeta legal action will be taken.
          </p>
        </div>
      </div>
    </footer>
  );
};