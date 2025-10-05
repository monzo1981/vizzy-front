"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { useTheme } from '@/contexts/ThemeContext';
import { GradientBackground } from '@/components/gradient-background';
import { Footer } from '@/components/Footer';
import { PaymentButton } from '@/components/PaymentButton';
import { SUBSCRIPTION_IDS } from '@/constants/subscriptions';

// Header Component
const Header = () => {
  const { isDarkMode } = useTheme();
  const [logoSrc, setLogoSrc] = useState("/vizzy-logo.svg");

  useEffect(() => {
    setLogoSrc(isDarkMode ? "/vizzy-logo-dark.svg" : "/vizzy-logo.svg");
  }, [isDarkMode]);

  return (
    <header className="px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* VIZZY Logo */}
        <Link href="/chat" className="flex items-center space-x-2">
          <div className="flex items-center">
            <Image src={logoSrc} alt="VIZZY Logo" width={150} height={150} suppressHydrationWarning={true} />
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8" suppressHydrationWarning>
          <Link href="/chat" className={`${isDarkMode ? 'text-white' : 'text-black'} transition-colors`} suppressHydrationWarning>
            Home
          </Link>
          <Link href="/about" className={`${isDarkMode ? 'text-white' : 'text-black'} transition-colors`} suppressHydrationWarning>
            About
          </Link>
          <Link href="/contact" className={`${isDarkMode ? 'text-white' : 'text-black'} transition-colors`} suppressHydrationWarning>
            Contact
          </Link>
          <Link href="/pricing" className={`${isDarkMode ? 'text-white' : 'text-black'} transition-colors`} suppressHydrationWarning>
            Pricing
          </Link>
        </nav>

        {/* Join Waiting List Button */}
        <button className="bg-[#4248FF] text-white px-6 py-2 rounded-full font-medium transition-all">
          Join Waiting List
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
  description: string;
  price?: string;
  originalPrice?: string;
  period?: string;
  features: Feature[];
  buttonText: string;
  isPopular?: boolean;
  isContactCard?: boolean;
}

const PricingCard = ({ 
  subscriptionId,
  billingPeriod = 'monthly',
  title, 
  description, 
  price, 
  originalPrice, 
  period, 
  features, 
  buttonText, 
  isPopular = false,
  isContactCard = false 
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
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[50px] font-bold" style={{ background: 'linear-gradient(90.77deg, #4248FF -13.59%, #370094 83.45%)', WebkitBackgroundClip: 'text', color: 'transparent', fontWeight: 700 }}>{title}</h3>
              {isPopular && (
                <div style={{ background: 'linear-gradient(269.85deg, #4248FF -4.66%, #FF4A19 110.74%)', color: 'white', padding: '0px 16px', borderRadius: '9999px', fontSize: '20px', fontWeight: 700 }}>
                  Best Value
                </div>
              )}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#11002E', fontWeight: 300 }}>{description}</p>
          </div>

          <div className="mb-8">
            {isContactCard ? (
              <div className="text-4xl font-bold text-center" style={{ color: '#11002E' }}>Contact Us</div>
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

          <div className="space-y-4 mb-8 flex-1">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                {feature.included ? (
                  <Image src="/true.svg" alt="check" width={20} height={20} className="flex-shrink-0" />
                ) : (
                  <Image src="/false.svg" alt="x" width={20} height={20} className="flex-shrink-0" />
                )}
                <span className="text-sm" style={{ color: '#320580', fontWeight: 300 }}>{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Payment Button or Contact Link */}
          {isContactCard ? (
            <Link 
              href="/contact"
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
  const { isDarkMode } = useTheme();
  const [isMonthly, setIsMonthly] = useState(true);

  const proFeatures = [
    { text: "3,000 AI credits/month for creating images", included: true },
    { text: "100 AI videos/month", included: true },
    { text: "5 Projects", included: true },
    { text: "Basic AI text generation", included: true },
    { text: "Priority support", included: false },
    { text: "Custom branding", included: false },
  ];

  const growFeatures = [
    { text: "5,000 AI credits/month for creating images", included: true },
    { text: "200 AI videos/month", included: true },
    { text: "Unlimited Projects", included: true },
    { text: "Advanced AI text generation", included: true },
    { text: "Priority support", included: true },
    { text: "Custom branding", included: false },
  ];

  const unlimitedFeatures = [
    { text: "Unlimited AI credits for images", included: true },
    { text: "Unlimited AI videos", included: true },
    { text: "Unlimited Projects", included: true },
    { text: "Premium AI text generation", included: true },
    { text: "24/7 Priority support", included: true },
    { text: "Custom branding & white-label", included: true },
  ];

  return (
    <section className="px-2 py-16 min-h-screen">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-2 pb-2" style={{ background: 'linear-gradient(90deg, #FFEB77 -11.94%, #FF4A19 25.5%, #4248FF 107.91%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            Your Complete Marketing Solution
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-black'} mb-8 font-medium`} dir="rtl" suppressHydrationWarning>
            باقات و حلول متنوعة عشان تختار اللي يناسب ميزانيتك و احتياجات مشروعك
          </p>
          
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
            price={isMonthly ? "490 EGP" : "4,900 EGP"}
            originalPrice={isMonthly ? "600 EGP" : "7,200 EGP"}
            period={isMonthly ? "month" : "year"}
            features={proFeatures}
            buttonText="Upgrade to Pro"
          />
          
          {/* Grow Plan - Most Popular */}
          <PricingCard
            subscriptionId={SUBSCRIPTION_IDS.GROW}
            billingPeriod={isMonthly ? 'monthly' : 'yearly'}
            title="Grow"
            description="Level up your content with advanced AI tools and unlimited possibilities!"
            price={isMonthly ? "780 EGP" : "7,800 EGP"}
            originalPrice={isMonthly ? "999 EGP" : "11,988 EGP"}
            period={isMonthly ? "month" : "year"}
            features={growFeatures}
            buttonText="Upgrade to Grow"
            isPopular={true}
          />
          
          {/* Unlimited Plan - Contact Us */}
          <PricingCard
            subscriptionId={SUBSCRIPTION_IDS.UNLIMITED}
            title="Unlimited"
            description="Enterprise solution with custom features tailored to your business needs!"
            features={unlimitedFeatures}
            buttonText="Contact Sales"
            isContactCard={true}
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