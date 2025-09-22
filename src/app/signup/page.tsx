"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { register, isAuthenticated, User } from '@/lib/auth';
import GoogleSignInButton from '@/components/GoogleSignInButton';

// Industry options with Arabic support - same as profile modal
const INDUSTRY_OPTIONS = [
  { value: "", label: { en: "Select Industry", ar: "اختر المجال" } },
  { value: "Food and Beverage", label: { en: "Food and Beverage", ar: "الأغذية والمشروبات" } },
  { value: "Fashion", label: { en: "Fashion", ar: "الموضة والأزياء" } },
  { value: "Beauty and Personal Care", label: { en: "Beauty and Personal Care", ar: "التجميل والعناية الشخصية" } },
  { value: "Health and Wellness", label: { en: "Health and Wellness", ar: "الصحة" } },
  { value: "Education", label: { en: "Education", ar: "التعليم" } },
  { value: "Technology and Software", label: { en: "Technology and Software", ar: "التكنولوجيا والبرمجيات" } },
  { value: "Home and Décor", label: { en: "Home and Décor", ar: "المنزل والديكور" } },
  { value: "Automotive and Transportation", label: { en: "Automotive and Transportation", ar: "السيارات والنقل" } },
  { value: "Sports and Fitness", label: { en: "Sports and Fitness", ar: "الرياضة واللياقة البدنية" } },
  { value: "Travel and Tourism", label: { en: "Travel and Tourism", ar: "السفر والسياحة" } },
  { value: "Finance Services", label: { en: "Finance Services", ar: "الخدمات المالية" } },
  { value: "Real Estate", label: { en: "Real Estate", ar: "العقارات" } },
  { value: "Entertainment", label: { en: "Entertainment", ar: "الترفيه" } },
  { value: "Media & Publishing", label: { en: "Media & Publishing", ar: "الإعلام والنشر" } },
  { value: "Government & NGOs", label: { en: "Government & NGOs", ar: "الحكومة والمنظمات غير الحكومية" } },
  { value: "Energy & Utilities", label: { en: "Energy & Utilities", ar: "الطاقة والمرافق" } },
  { value: "Retail & E-Commerce", label: { en: "Retail & E-Commerce", ar: "التجزئة والتجارة الإلكترونية" } },
  { value: "Hospitality", label: { en: "Hospitality", ar: "الضيافة" } },
  { value: "Pharmaceuticals & Medical Devices", label: { en: "Pharmaceuticals & Medical Devices", ar: "الأدوية والمستلزمات الطبية" } },
  { value: "Gaming & Esports", label: { en: "Gaming & Esports", ar: "الألعاب والرياضات الإلكترونية" } },
  { value: "Agriculture & Food Tech", label: { en: "Agriculture & Food Tech", ar: "الزراعة والتكنولوجيا الغذائية" } },
  { value: "Legal Services", label: { en: "Legal Services", ar: "الخدمات القانونية" } },
  { value: "Construction & Architecture", label: { en: "Construction & Architecture", ar: "البناء والعمارة" } },
  { value: "Luxury Goods", label: { en: "Luxury Goods", ar: "السلع الفاخرة" } },
  { value: "Pet Industry", label: { en: "Pet Industry", ar: "الحيوانات الأليفة ومستلزماتها" } }
];

const SignUp = () => {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [error, setError] = useState('');
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [language] = useState<'en' | 'ar'>('en'); // Default to English, can be changed later
  
  const industryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If user is already authenticated, redirect to chat
    if (isAuthenticated()) {
      router.push('/chat');
    }
  }, [router]);

  // Close industry dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside both the dropdown and any dropdown items
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(target)) {
        // Only close if we're not clicking on a dropdown item
        const clickedElement = event.target as Element;
        if (!clickedElement.closest('[data-dropdown-item]')) {
          setIsIndustryDropdownOpen(false);
        }
      }
    };

    if (isIndustryDropdownOpen) {
      // Use 'click' instead of 'mousedown' to let onClick fire first
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isIndustryDropdownOpen]);

  const getIndustryLabel = (industryValue: string) => {
    if (!industryValue) return language === 'ar' ? 'اختر المجال' : 'Select Industry';
    const option = INDUSTRY_OPTIONS.find(opt => opt.value === industryValue);
    return option ? option.label[language] : industryValue;
  };

  const handleSubmit = async () => {
    setError('');

    if (!firstName || !lastName || !email || !password || !companyName || !industry) {
      setError('All fields are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (companyName.length < 2) {
      setError('Company name must be at least 2 characters long.');
      return;
    }

    const result = await register({
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      company_name: companyName,
      industry
    });

    if (result.success) {
      // Optionally show a success message before redirecting
      router.push('/chat');
    } else {
      setError(result.error || 'An unexpected error occurred.');
    }
  };

  // Custom scrollbar styles
  const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #fff;
      border-radius: 10px;
      margin: 8px 0;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #bdbdbd;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #a0a0a0;
    }
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #bdbdbd #fff;
    }
  `;

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div
        className="min-h-screen relative"
        style={{
          backgroundImage: `url('/e143461c99c47a62e2341cde65ee15e7f8c9903f.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Full screen overlay */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex min-h-screen">
          {/* Left side - Text */}
          <div className="flex-[2] flex items-center justify-center relative z-10">
            <div className="w-full max-w-4xl flex flex-col items-center justify-center text-center">
              {/* Arabic text at top */}
              <div className="mb-12 w-full flex justify-center">
                <p
                  dir="rtl"
                  className="text-white leading-relaxed"
                  style={{
                    fontFamily: 'Noto Sans Arabic',
                    fontSize: '60px',
                    fontWeight: 700,
                    lineHeight: '1.3',
                    textShadow: '0px 4px 55px #000000',
                    margin: 0,
                    textAlign: 'right'
                  }}
                >
                  أنا <span style={{ color: '#7FCAFE', fontFamily: 'inter', fontWeight: 900 }}>VIZZY</span> أول مساعد شخصي<br />
                  للتسويق بالذكاء الاصطناعي
                </p>
              </div>
              {/* Main English text */}
              <div className="w-full flex justify-center">
                <h1
                  className="text-white leading-tight"
                  style={{
                    fontSize: '64px',
                    lineHeight: '1.1',
                    letterSpacing: '-0.02em',
                    fontWeight: 700,
                    margin: 0,
                    textShadow: '0px 0px 30px #000000',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ color: '#FF4A19', fontWeight: 900 }}>Join Now</span> & lets elevate<br />
                  your brand together
                </h1>
              </div>
            </div>
          </div>

          {/* Right side - Sign Up Form */}
          <div className="flex-[1] flex items-center justify-end relative z-10 p-12 md:p-16 pr-12 md:pr-16 lg:pr-24 xl:pr-32 2xl:pr-40">
            <Card
              className="border-0 flex flex-col justify-center"
              style={{
                width: 'clamp(350px, 500px, 585px)',
                height: 'clamp(750px, 90vh, 900px)', // Increased height for new fields
                opacity: 1,
                borderRadius: '88px',
                background: 'linear-gradient(92.9deg, rgba(211, 230, 252, 1) -14.33%, rgba(127, 202, 254, 1) 111.43%)',
                padding: '50px'
              }}
            >
              <div className="text-center">
                  {/* Logo */}
                  <div className="flex justify-center mb-2">
                    <div className="relative">
                        <Image
                        src="/vizzy-logo.svg"
                        alt="Vizzy Logo"
                        width={280}
                        height={280}
                    />
                    </div>
                  </div>
                <p className="mb-6" style={{ fontWeight: 500, fontSize: '22px', color: '#4248FF' }}>Your Personal Agency!</p>
              </div>

              <div className="space-y-5">
                <div className="flex flex-col lg:flex-row lg:gap-4">
                  <div
                    className="rounded-full p-[1px] w-full lg:w-1/2 mb-5 lg:mb-0"
                    style={{
                      background: 'linear-gradient(91.52deg, #4248FF -19.2%, #7FCBFD 119.88%)'
                    }}
                  >
                    <Input
                      type="text"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full h-12 bg-white rounded-full px-6 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0"
                    />
                  </div>
                  <div
                    className="rounded-full p-[1px] w-full lg:w-1/2"
                    style={{
                      background: 'linear-gradient(91.52deg, #4248FF -19.2%, #7FCBFD 119.88%)'
                    }}
                  >
                    <Input
                      type="text"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full h-12 bg-white rounded-full px-6 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0"
                    />
                  </div>
                </div>

                <div>
                  <div
                    className="rounded-full p-[1px]"
                    style={{
                      background: 'linear-gradient(91.52deg, #4248FF -19.2%, #7FCBFD 119.88%)'
                    }}
                  >
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 bg-white rounded-full px-6 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0"
                    />
                  </div>
                </div>

                <div>
                  <div
                    className="rounded-full p-[1px]"
                    style={{
                      background: 'linear-gradient(91.52deg, #4248FF -19.2%, #7FCBFD 119.88%)'
                    }}
                  >
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 bg-white rounded-full px-6 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0"
                    />
                  </div>
                </div>

                {/* NEW: Company Name Field */}
                <div>
                  <div
                    className="rounded-full p-[1px]"
                    style={{
                      background: 'linear-gradient(91.52deg, #4248FF -19.2%, #7FCBFD 119.88%)'
                    }}
                  >
                    <Input
                      type="text"
                      placeholder="Company Name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full h-12 bg-white rounded-full px-6 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0"
                    />
                  </div>
                </div>

                {/* NEW: Industry Dropdown */}
                <div className="relative">
                  <div
                    className="rounded-full p-[1px]"
                    style={{
                      background: 'linear-gradient(91.52deg, #4248FF -19.2%, #7FCBFD 119.88%)'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setIsIndustryDropdownOpen(!isIndustryDropdownOpen)}
                      className="w-full h-12 bg-white rounded-full px-6 text-gray-700 flex items-center justify-between focus:outline-none focus:ring-0 focus:border-0"
                    >
                      <span className={!industry ? 'text-gray-400' : ''}>
                        {getIndustryLabel(industry)}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isIndustryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Industry Dropdown Menu */}
                    {isIndustryDropdownOpen && (
                      <div 
                        className="absolute top-full left-0 right-0 bg-white z-50 mt-1"
                        style={{ 
                          borderRadius: 20,
                          maxHeight: '200px',
                          overflow: 'hidden',
                          boxShadow: 'rgba(17, 0, 46, 0.1) 0px 0px 20px 2px, rgba(66, 72, 255, 0.1) 0px 1.5px 6px'
                        }}
                        ref={industryDropdownRef}
                      >
                        <div 
                          className="custom-scrollbar overflow-y-auto" 
                          style={{ 
                            maxHeight: '200px',
                          }}
                        >
                          {INDUSTRY_OPTIONS.map((option, index) => (
                            <div
                              key={`${option.value}-${index}`}
                              data-dropdown-item="true"
                              onClick={() => {
                                console.log('Industry clicked:', option.value, option.label[language]);
                                setIndustry(option.value);
                                setIsIndustryDropdownOpen(false);
                              }}
                              className="w-full px-6 py-3 text-left text-sm transition-all duration-200 cursor-pointer"
                              style={{
                                background: industry === option.value ? 'linear-gradient(272deg, #FFF -1.67%, #7FCAFE 99.45%)' : 'transparent',
                                color: '#111',
                                borderBottom: index < INDUSTRY_OPTIONS.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none'
                              }}
                              onMouseEnter={(e) => {
                                if (industry !== option.value) {
                                  e.currentTarget.style.background = 'rgba(127, 202, 254, 0.2)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (industry !== option.value) {
                                  e.currentTarget.style.background = 'transparent';
                                }
                              }}
                            >
                              {option.label[language]}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                <Button
                  onClick={handleSubmit}
                  className="cursor-pointer w-full h-12 text-white rounded-full font-medium text-base"
                  style={{ background: 'linear-gradient(92.09deg, #7FCBFD -17.23%, #4248FF 107.78%)' }}
                >
                  Sign Up
                </Button>
              </div>

              <div className="mt-4">
                <p className="text-center mb-4 max-w-[300px] mx-auto" style={{ fontWeight: 400, fontSize: '14px', color: '#6B7280' }}>
                  By continuing, you agree to our Terms and acknowledge our{' '}
                  <Link href="/" className="hover:underline" style={{ color: '#4248FF' }}>Privacy Policy</Link>
                </p>

                  {/* Divider */}
                  <div className="flex items-center my-4">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-4 text-gray-500 text-sm">OR</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>

                  {/* Google Sign-In */}
                  <div className="mb-4">
                    <GoogleSignInButton
                      text="continue_with"
                      onSuccess={(user: User) => {
                        console.log('Google sign-in successful:', user);
                      }}
                      onError={(error: string) => {
                        setError(error);
                      }}
                      className="w-full"
                    />
                  </div>

                <p className="text-sm text-center mt-4" style={{ fontWeight: 400, color: '#6B7280' }}>
                  Already have an account?{' '}
                  <Link href="/" className="hover:underline" style={{ color: '#4248FF', fontWeight: 400 }}>
                    Sign in
                  </Link>
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden min-h-screen flex flex-col relative z-10">
          {/* Top - Text */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight" style={{ fontSize: 'clamp(2rem, 6vw, 3.75rem)' }}>
                Sign up and gets<br />
                all your solutions
              </h1>
            </div>
          </div>

          {/* Bottom - Sign Up Form */}
          <div className="flex-1 flex items-center justify-center p-6 pt-0">
            <Card
              className="border-0 flex flex-col justify-center"
              style={{
                width: 'clamp(280px, 90vw, 400px)',
                height: 'clamp(700px, 90vh, 800px)', // Increased height
                opacity: 1,
                borderRadius: 'clamp(32px, 8vw, 88px)',
                background: 'linear-gradient(92.9deg, rgba(211, 230, 252, 1) -14.33%, rgba(127, 202, 254, 1) 111.43%)',
                padding: 'clamp(20px, 5vw, 30px)'
              }}
            >
              <div className="text-center">
                  {/* Logo */}
                  <div className="flex justify-center mb-2">
                      <div className="relative">
                          <Image
                          src="/vizzy-logo.svg"
                          alt="Vizzy Logo"
                          width={140}
                          height={140}
                          />
                      </div>
                  </div>
                <p className="mb-4" style={{ fontWeight: 500, fontSize: 'clamp(16px, 4vw, 20px)', color: '#4248FF' }}>Your Personal Agency!</p>
              </div>

              <div className="space-y-3">
                <div
                  className="rounded-full p-[1px]"
                  style={{
                    background: 'linear-gradient(91.52deg, #4248FF -19.2%, #7FCBFD 119.88%)'
                  }}
                >
                  <Input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-10 bg-white rounded-full px-5 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0 text-sm"
                  />
                </div>
                <div
                  className="rounded-full p-[1px]"
                  style={{
                    background: 'linear-gradient(91.52deg, #4248FF -19.2%, #7FCBFD 119.88%)'
                  }}
                >
                  <Input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-10 bg-white rounded-full px-5 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0 text-sm"
                  />
                </div>
                <div>
                  <div
                    className="rounded-full p-[1px]"
                    style={{
                      background: 'linear-gradient(91.52deg, #4248FF -19.2%, #7FCBFD 119.88%)'
                    }}
                  >
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 bg-white rounded-full px-5 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div
                    className="rounded-full p-[1px]"
                    style={{
                      background: 'linear-gradient(91.52deg, #4248FF -19.2%, #7FCBFD 119.88%)'
                    }}
                  >
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-10 bg-white rounded-full px-5 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0 text-sm"
                    />
                  </div>
                </div>

                {/* NEW: Company Name Field - Mobile */}
                <div>
                  <div
                    className="rounded-full p-[1px]"
                    style={{
                      background: 'linear-gradient(91.52deg, #4248FF -19.2%, #7FCBFD 119.88%)'
                    }}
                  >
                    <Input
                      type="text"
                      placeholder="Company Name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full h-10 bg-white rounded-full px-5 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0 text-sm"
                    />
                  </div>
                </div>

                {/* NEW: Industry Dropdown - Mobile */}
                <div className="relative">
                  <div
                    className="rounded-full p-[1px]"
                    style={{
                      background: 'linear-gradient(91.52deg, #4248FF -19.2%, #7FCBFD 119.88%)'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setIsIndustryDropdownOpen(!isIndustryDropdownOpen)}
                      className="w-full h-10 bg-white rounded-full px-5 text-gray-700 flex items-center justify-between focus:outline-none focus:ring-0 focus:border-0 text-sm"
                    >
                      <span className={!industry ? 'text-gray-400' : ''}>
                        {getIndustryLabel(industry)}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isIndustryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Industry Dropdown Menu - Mobile */}
                    {isIndustryDropdownOpen && (
                      <div 
                        className="absolute top-full left-0 right-0 bg-white z-50 mt-1"
                        style={{ 
                          borderRadius: 20,
                          maxHeight: '150px',
                          overflow: 'hidden',
                          boxShadow: 'rgba(17, 0, 46, 0.1) 0px 0px 20px 2px, rgba(66, 72, 255, 0.1) 0px 1.5px 6px'
                        }}
                        ref={industryDropdownRef}
                      >
                        <div 
                          className="custom-scrollbar overflow-y-auto" 
                          style={{ 
                            maxHeight: '150px',
                          }}
                        >
                          {INDUSTRY_OPTIONS.map((option, index) => (
                            <div
                              key={`mobile-${option.value}-${index}`}
                              data-dropdown-item="true"
                              onClick={() => {
                                console.log('Mobile industry clicked:', option.value, option.label[language]);
                                setIndustry(option.value);
                                setIsIndustryDropdownOpen(false);
                              }}
                              className="w-full px-4 py-2 text-left text-xs transition-all duration-200 cursor-pointer"
                              style={{
                                background: industry === option.value ? 'linear-gradient(272deg, #FFF -1.67%, #7FCAFE 99.45%)' : 'transparent',
                                color: '#111',
                                borderBottom: index < INDUSTRY_OPTIONS.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none'
                              }}
                              onMouseEnter={(e) => {
                                if (industry !== option.value) {
                                  e.currentTarget.style.background = 'rgba(127, 202, 254, 0.2)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (industry !== option.value) {
                                  e.currentTarget.style.background = 'transparent';
                                }
                              }}
                            >
                              {option.label[language]}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {error && <p className="text-red-500 text-center mb-3 text-sm">{error}</p>}

                <Button
                  onClick={handleSubmit}
                  className="w-full h-10 text-white rounded-full font-medium text-sm"
                  style={{ background: 'linear-gradient(92.09deg, #7FCBFD -17.23%, #4248FF 107.78%)' }}
                >
                  Sign Up
                </Button>
              </div>

              <div className="mt-3">
                {/* Google Sign-Up */}
                <div className="mb-3">
                  <GoogleSignInButton
                    text="sign_up_with"
                    onSuccess={(user: User) => {
                      console.log('Google sign-up successful:', user);
                    }}
                    onError={(error: string) => {
                      setError(error);
                    }}
                    className="w-full"
                  />
                </div>

                {/* Divider */}
                <div className="flex items-center my-3">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-3 text-gray-500 text-xs">OR</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                <p className="text-center mb-3 max-w-[280px] mx-auto" style={{ fontWeight: 400, fontSize: '12px', color: '#6B7280' }}>
                  By continuing, you agree to our Terms and acknowledge our{' '}
                  <Link href="/" className="hover:underline" style={{ color: '#4248FF' }}>Privacy Policy</Link>
                </p>

                <p className="text-xs text-center mt-3" style={{ fontWeight: 400, color: '#6B7280' }}>
                  Already have an account?{' '}
                  <Link href="/" className="hover:underline" style={{ color: '#4248FF', fontWeight: 400 }}>
                    Sign in
                  </Link>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUp;