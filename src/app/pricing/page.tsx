"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { GradientBackground } from '@/components/gradient-background';
import { Footer } from '@/components/Footer';
import { PaymentButton } from '@/components/PaymentButton';
import { SUBSCRIPTION_IDS } from '@/constants/subscriptions';

// Header Component
const Header = () => {
  const { isDarkMode } = useTheme();
  const { t, createLocalizedPath } = useLanguage();
  const [logoSrc, setLogoSrc] = useState("/vizzy-logo.svg");

  useEffect(() => {
    setLogoSrc(isDarkMode ? "/vizzy-logo-dark.svg" : "/vizzy-logo.svg");
  }, [isDarkMode]);

  return (
    <header className="px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* VIZZY Logo */}
        <Link href={createLocalizedPath('chat')} className="flex items-center space-x-2">
          <div className="flex items-center">
            <Image src={logoSrc} alt="VIZZY Logo" width={150} height={150} suppressHydrationWarning={true} />
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8" suppressHydrationWarning>
          <Link href={createLocalizedPath('chat')} className={`${isDarkMode ? 'text-white' : 'text-black'} transition-colors`} suppressHydrationWarning>
            {t('navigation.home')}
          </Link>
          <Link href={createLocalizedPath('about')} className={`${isDarkMode ? 'text-white' : 'text-black'} transition-colors`} suppressHydrationWarning>
            {t('navigation.about')}
          </Link>
          <Link href={createLocalizedPath('contact')} className={`${isDarkMode ? 'text-white' : 'text-black'} transition-colors`} suppressHydrationWarning>
            {t('navigation.contact')}
          </Link>
          <Link href={createLocalizedPath('pricing')} className={`${isDarkMode ? 'text-white' : 'text-black'} transition-colors`} suppressHydrationWarning>
            {t('navigation.pricing')}
          </Link>
        </nav>

        {/* Join Waiting List Button */}
        <button className="bg-[#4248FF] text-white px-6 py-2 rounded-full font-medium transition-all">
          {t('navigation.joinWaitingList')}
        </button>
      </div>
    </header>
  );
};

// Feature Interface
interface Feature {
  text: string;
  included: boolean;
}

// PricingCard Component
interface PricingCardProps {
  subscriptionId?: string;
  billingPeriod?: 'monthly' | 'yearly';
  title: string;
  description?: string;
  price?: string;
  originalPrice?: string;
  period?: string;
  features: Feature[];
  buttonText: string;
  isPopular?: boolean;
  isContactCard?: boolean;
  isRTL?: boolean;
  t: (key: string) => string;
  createLocalizedPath?: (path: string) => string;
}

const PricingCard = ({ 
  subscriptionId,
  billingPeriod = 'monthly',
  title, 
  price, 
  originalPrice, 
  period, 
  features, 
  buttonText, 
  isPopular = false,
  isContactCard = false,
  isRTL = false,
  t,
  createLocalizedPath
}: PricingCardProps) => {
  
  return (
    <div className="relative">
      {/* Gradient Border Container */}
      <div 
        className="relative p-[3px] backdrop-blur-xl h-full"
        style={{
          borderRadius: '38px',
          background: 'conic-gradient(from -19.98deg at 50% 50%, #7FCAFE -60.58deg, #4248FF 16.34deg, #FF4A19 100.38deg, #FFEB77 185.19deg, #7FCAFE 299.42deg, #4248FF 376.34deg)',
          boxShadow: '0px 0px 23px 0px #4248FF6B'
        }}
      >
        {/* Inner Content Container */}
        <div 
          className="relative h-full p-8 flex flex-col"
          style={{
            background: 'linear-gradient(180deg, #D3E6FC 0%, #FFFFFF 77.84%)',
            borderRadius: '36px'
          }}
        >
          <div className="mb-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[50px] font-bold" style={{ background: 'linear-gradient(90.77deg, #4248FF -13.59%, #370094 83.45%)', WebkitBackgroundClip: 'text', color: 'transparent', fontWeight: 700 }}>{title}</h3>
              {isPopular && (
                <div style={{ background: 'linear-gradient(269.85deg, #4248FF -4.66%, #FF4A19 110.74%)', color: 'white', padding: '0px 16px', borderRadius: '9999px', fontSize: '20px', fontWeight: 700 }}>
                  {t('pricing.best')}
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            {isContactCard ? (
              <div className="text-4xl font-bold text-center" style={{ color: '#11002E' }}>{t('pricing.contactUs')}</div>
            ) : (
              <>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold" style={{ color: '#11002E' }}>{price}</span>
                  {period && <span className="text-lg ml-1" style={{ color: '#11002E' }}>/{period}</span>}
                </div>
                {originalPrice && (
                  <div className="text-sm text-center line-through mt-1" style={{ color: '#11002E', fontWeight: 200 }}>{originalPrice}/{period}</div>
                )}
              </>
            )}
          </div>

          {isContactCard && <div className="h-8"></div>}

          <div className="space-y-4 mb-8 flex-1">
            {features.map((feature, index) => (
              <div key={index} className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-3 space-x-reverse' : 'space-x-3'}`}>
                {feature.included ? (
                  <Image src="/true.svg" alt="check" width={16} height={16} className="flex-shrink-0" />
                ) : (
                  <Image src="/false.svg" alt="x" width={16} height={16} className="flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${isRTL ? 'text-right' : ''}`}
                  style={{
                    color: '#320580',
                    fontWeight: feature.text.includes('Points') ? 500 : 300,
                    borderBottom: feature.text.includes('Points') ? '2px dotted #320580' : 'none'
                  }}
                >
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* Payment Button or Contact Link */}
          {isContactCard ? (
            <Link 
              href={createLocalizedPath ? createLocalizedPath('contact') : '/contact'}
              className="block w-full text-center text-white py-3 font-medium hover:shadow-lg transition-all" 
              style={{ 
                background: 'linear-gradient(90deg, #4248FF 0%, rgba(66, 72, 255, 0.57) 49.12%, #4248FF 100%)', 
                borderRadius: '50px', 
                fontWeight: 700, 
                fontSize: '28px' 
              }}
            >
              {buttonText}
            </Link>
          ) : subscriptionId ? (
            <PaymentButton
              subscriptionTypeId={subscriptionId}
              billingPeriod={billingPeriod}
              buttonText={buttonText}
            />
          ) : (
            <button 
              disabled 
              className="w-full text-white py-3 font-medium opacity-50 cursor-not-allowed" 
              style={{ 
                background: 'linear-gradient(90deg, #4248FF 0%, rgba(66, 72, 255, 0.57) 49.12%, #4248FF 100%)', 
                borderRadius: '50px', 
                fontWeight: 700, 
                fontSize: '28px' 
              }}
            >
              {buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// PricingSection Component
const PricingSection = () => {
  const { t, isRTL, createLocalizedPath } = useLanguage();
  const isMonthly = true; // Currently showing monthly pricing only

  const proFeatures = [
    { text: t('pricing.points'), included: true },
    { text: t('pricing.vizzyChat'), included: true },
    { text: t('pricing.imageGeneration'), included: true },
    { text: t('pricing.imageEdit'), included: true },
    { text: t('pricing.videoGeneration'), included: true },
    { text: t('pricing.brandedContent'), included: true },
    { text: t('pricing.voiceChat'), included: false },
    { text: t('pricing.emailing'), included: false },
    { text: t('pricing.brandManual'), included: false },
  ];

  const growFeatures = [
    { text: t('pricing.points13k'), included: true },
    { text: t('pricing.vizzyChat'), included: true },
    { text: t('pricing.imageGeneration'), included: true },
    { text: t('pricing.imageEdit'), included: true },
    { text: t('pricing.videoGeneration'), included: true },
    { text: t('pricing.brandedContent'), included: true },
    { text: t('pricing.voiceChat'), included: true },
    { text: t('pricing.emailing'), included: true },
    { text: t('pricing.brandManual'), included: true },
  ];

  const unlimitedFeatures = [
    { text: t('pricing.unlimitedPoints'), included: true },
    { text: t('pricing.vizzyChat'), included: true },
    { text: t('pricing.imageGeneration'), included: true },
    { text: t('pricing.imageEdit'), included: true },
    { text: t('pricing.videoGeneration'), included: true },
    { text: t('pricing.brandedContent'), included: true },
    { text: t('pricing.voiceChat'), included: true },
    { text: t('pricing.emailing'), included: true },
    { text: t('pricing.brandManual'), included: true },
  ];

  return (
    <section className="px-2 py-16 min-h-screen">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-2 pt-2 pb-2 max-w-5xl mx-auto" style={{ background: 'linear-gradient(90deg, #FFEB77 -11.94%, #FF4A19 25.5%, #4248FF 107.91%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            {t('pricing.completeMarketingSolution')}
          </h1>
          
          {/* Toggle */}
          {/* <div className="flex items-center justify-center px-1 py-1 mb-12 w-fit mx-auto" style={{ backgroundColor: isDarkMode ? '#D3E6FC33' : '#4248FF2E', borderRadius: '50px', border: isDarkMode ? '1px solid #ffffff70' : 'none' }} suppressHydrationWarning>
            <button
              onClick={() => setIsMonthly(true)}
              className={`px-8 py-2 rounded-full font-bold transition-all ${
                isMonthly 
                  ? 'bg-white text-[#4248FF] border border-[#4248FF]' 
                  : 'text-[#78758E] bg-transparent'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsMonthly(false)}
              className={`px-8 py-2 rounded-full font-bold transition-all ${
                !isMonthly 
                  ? 'bg-white text-[#4248FF] border border-[#4248FF]' 
                  : 'text-[#78758E] bg-transparent'
              }`}
            >
              Yearly
            </button>
          </div> */}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-4 max-w-7xl mx-auto">
          {/* Pro Plan */}
          <PricingCard
            subscriptionId={SUBSCRIPTION_IDS.PRO}
            billingPeriod={isMonthly ? 'monthly' : 'yearly'}
            title="Pro"
            description="Kick off your AI journey with all the basics to spark your creativity!"
            price={isMonthly ? "499 EGP" : "4,900 EGP"}
            originalPrice={isMonthly ? "750 EGP" : "7,200 EGP"}
            period={isMonthly ? "month" : "year"}
            features={proFeatures}
            buttonText={t('pricing.upgradeToPro')}
            isRTL={isRTL}
            t={t}
            createLocalizedPath={createLocalizedPath}
          />
          
          {/* Grow Plan - Most Popular */}
          <PricingCard
            subscriptionId={SUBSCRIPTION_IDS.GROW}
            billingPeriod={isMonthly ? 'monthly' : 'yearly'}
            title="Grow"
            description="Level up your content with advanced AI tools and unlimited possibilities!"
            price={isMonthly ? "759 EGP" : "7,800 EGP"}
            originalPrice={isMonthly ? "1,130 EGP" : "11,988 EGP"}
            period={isMonthly ? "month" : "year"}
            features={growFeatures}
            buttonText={t('pricing.upgradeToGrow')}
            isPopular={true}
            isRTL={isRTL}
            t={t}
            createLocalizedPath={createLocalizedPath}
          />
          
          {/* Unlimited Plan - Contact Us */}
          <PricingCard
            subscriptionId={SUBSCRIPTION_IDS.UNLIMITED}
            title="Unlimited"
            description="Enterprise solution with custom features tailored to your business needs!"
            features={unlimitedFeatures}
            buttonText={t('pricing.contactSales')}
            isContactCard={true}
            isRTL={isRTL}
            t={t}
            createLocalizedPath={createLocalizedPath}
          />
        </div>
      </div>
    </section>
  );
};

// Main Pricing Page Component
export default function PricingPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/");
    }
  }, [router]);

  return (
    <>

      <GradientBackground>
        <Header />
        <PricingSection />
        <Footer />
      </GradientBackground>
    </>
  );
}