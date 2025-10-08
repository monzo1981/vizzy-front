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
  const [phoneNumber, setPhoneNumber] = useState('');  // New state for phone number
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [error, setError] = useState('');
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [language] = useState<'en' | 'ar'>('en'); // Default to English, can be changed later
  const [isLoading, setIsLoading] = useState(false);
  const [btnBg, setBtnBg] = useState('linear-gradient(92.09deg, #7FCBFD -17.23%, #4248FF 107.78%)');
  
  const industryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If user is already authenticated, redirect to chat
    if (isAuthenticated()) {
      router.push('/ar/chat');
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
    setIsLoading(true);

    // Validate all required fields
    if (!firstName || !firstName.trim()) {
      setError('First name is required.');
      setIsLoading(false);
      return;
    }
    
    if (!lastName || !lastName.trim()) {
      setError('Last name is required.');
      setIsLoading(false);
      return;
    }
    
    if (!email || !email.trim()) {
      setError('Email is required.');
      setIsLoading(false);
      return;
    }
    
    if (!password) {
      setError('Password is required.');
      setIsLoading(false);
      return;
    }
    
    if (!companyName || !companyName.trim()) {
      setError('Company name is required.');
      setIsLoading(false);
      return;
    }
    
    if (!industry || !industry.trim()) {
      setError('Industry is required.');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    if (companyName.trim().length < 2) {
      setError('Company name must be at least 2 characters long.');
      setIsLoading(false);
      return;
    }

    // Validate phone number if provided
    if (phoneNumber && phoneNumber.trim().length > 0) {
      const cleanedPhone = phoneNumber.replace(/\s|-|\(|\)/g, '');
      if (cleanedPhone.length < 7) {
        setError('Please enter a valid phone number.');
        setIsLoading(false);
        return;
      }
    }

    // Send registration data with trimmed values to ensure no empty strings
    const result = await register({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      password,
      phone_number: phoneNumber && phoneNumber.trim() ? phoneNumber.trim() : '',
      company_name: companyName.trim(),
      industry: industry.trim()
    });

    if (result.success) {
      // Optionally show a success message before redirecting
      router.push('/ar/chat');
    } else {
      setError(result.error || 'An unexpected error occurred.');
    }
    setIsLoading(false);
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

        {/* Main Layout Container */}
        <div className="min-h-screen flex flex-col lg:flex-row relative z-10">
          {/* Left side - Text Content */}
          <div className="flex-1 lg:flex-[1.5] xl:flex-[2] flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-6 xl:px-12 py-8 lg:py-0">
            <div className="w-full max-w-[90%] sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl text-center">
              {/* Arabic text */}
              <div className="mb-4 sm:mb-6 md:mb-8 lg:mb-10">
                <p
                  dir="rtl"
                  className="text-white leading-relaxed font-arabic"
                  style={{
                    fontSize: 'clamp(22px, 3.5vw + 0.5rem, 60px)',
                    fontWeight: 700,
                    lineHeight: '1.3',
                    textShadow: '0px 4px 55px #000000',
                    margin: 0,
                    textAlign: 'center'
                  }}
                >
                  أنا <span style={{ 
                    color: '#7FCAFE', 
                    fontFamily: 'var(--font-inter), Inter', 
                    fontWeight: 900 
                  }}>VIZZY</span> أول مساعد شخصي
                  <br />
                  للتسويق بالذكــاء الاصطــناعي
                </p>
              </div>
              
              {/* English text */}
              <div>
                <h1
                  className="text-white leading-tight"
                  style={{
                    fontSize: 'clamp(24px, 4vw + 0.5rem, 64px)',
                    lineHeight: '1.1',
                    letterSpacing: '-0.02em',
                    fontWeight: 700,
                    margin: 0,
                    textShadow: '0px 0px 30px #000000',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ 
                    color: '#FF4A19', 
                    fontWeight: 900 
                  }}>Join Now</span> & lets elevate
                  <br />
                  your brand together
                </h1>
              </div>
            </div>
          </div>

          {/* Right side - Sign Up Form */}
          <div className="flex-1 lg:flex-[1] flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24 pb-8 lg:pb-0">
            <Card
              className="border-0 flex flex-col justify-center w-full"
              style={{
                maxWidth: 'min(585px, 90vw)',
                width: '100%',
                minWidth: '300px',
                minHeight: '650px',
                height: 'auto',
                opacity: 1,
                borderRadius: 'clamp(32px, 6vw, 88px)',
                background: 'linear-gradient(92.9deg, rgba(211, 230, 252, 1) -14.33%, rgba(127, 202, 254, 1) 111.43%)',
                padding: 'clamp(20px, 3vw, 50px)'
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
                      className="w-[120px] sm:w-[180px] md:w-[220px] lg:w-[280px] h-auto"
                    />
                  </div>
                </div>
                <p 
                  className="mb-4 lg:mb-6" 
                  style={{ 
                    fontWeight: 500, 
                    fontSize: 'clamp(14px, 2.5vw, 22px)', 
                    color: '#4248FF' 
                  }}
                >
                  Your Personal Agency!
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                {/* First Name and Last Name Row */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div
                    className="rounded-full p-[1px] w-full sm:w-1/2"
                    style={{
                      background: 'linear-gradient(91.52deg, #4248FF -19.2%, #7FCBFD 119.88%)'
                    }}
                  >
                    <Input
                      type="text"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full h-10 sm:h-11 lg:h-12 bg-white rounded-full px-4 sm:px-5 lg:px-6 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0 text-sm sm:text-base"
                    />
                  </div>
                  <div
                    className="rounded-full p-[1px] w-full sm:w-1/2"
                    style={{
                      background: 'linear-gradient(91.52deg, #4248FF -19.2%, #7FCBFD 119.88%)'
                    }}
                  >
                    <Input
                      type="text"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full h-10 sm:h-11 lg:h-12 bg-white rounded-full px-4 sm:px-5 lg:px-6 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0 text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Email */}
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
                      className="w-full h-10 sm:h-11 lg:h-12 bg-white rounded-full px-4 sm:px-5 lg:px-6 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0 text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Phone Number (Required) */}
                <div>
                  <div
                    className="rounded-full p-[1px]"
                    style={{
                      background: 'linear-gradient(91.52deg, #4248FF -19.2%, #7FCBFD 119.88%)'
                    }}
                  >
                    <Input
                      type="tel"
                      placeholder="Phone Number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full h-10 sm:h-11 lg:h-12 bg-white rounded-full px-4 sm:px-5 lg:px-6 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0 text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Password */}
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
                      className="w-full h-10 sm:h-11 lg:h-12 bg-white rounded-full px-4 sm:px-5 lg:px-6 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0 text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Company Name */}
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
                      className="w-full h-10 sm:h-11 lg:h-12 bg-white rounded-full px-4 sm:px-5 lg:px-6 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0 text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Industry Dropdown */}
                <div className="relative" ref={industryDropdownRef}>
                  <div
                    className="rounded-full p-[1px]"
                    style={{
                      background: 'linear-gradient(91.52deg, #4248FF -19.2%, #7FCBFD 119.88%)'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setIsIndustryDropdownOpen(!isIndustryDropdownOpen)}
                      className="w-full h-10 sm:h-11 lg:h-12 bg-white rounded-full px-4 sm:px-5 lg:px-6 text-gray-700 flex items-center justify-between focus:outline-none focus:ring-0 focus:border-0 text-sm sm:text-base"
                    >
                      <span className={!industry ? 'text-gray-400' : ''}>
                        {getIndustryLabel(industry)}
                      </span>
                      <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform ${isIndustryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Industry Dropdown Menu */}
                    {isIndustryDropdownOpen && (
                      <div 
                        className="absolute top-full left-0 right-0 bg-white z-50 mt-1"
                        style={{ 
                          borderRadius: 20,
                          maxHeight: '270px',
                          overflow: 'hidden',
                          boxShadow: 'rgba(17, 0, 46, 0.1) 0px 0px 20px 2px, rgba(66, 72, 255, 0.1) 0px 1.5px 6px'
                        }}
                      >
                        <div 
                          className="custom-scrollbar overflow-y-auto" 
                          style={{ 
                            maxHeight: '280px',
                          }}
                        >
                          {INDUSTRY_OPTIONS.map((option, index) => (
                            <div
                              key={`${option.value}-${index}`}
                              data-dropdown-item="true"
                              onClick={() => {
                                setIndustry(option.value);
                                setIsIndustryDropdownOpen(false);
                              }}
                              className="w-full px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-left text-xs sm:text-sm transition-all duration-200 cursor-pointer"
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

                {error && (
                  <p className="text-red-500 text-center text-xs sm:text-sm">
                    {error}
                  </p>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className={`cursor-pointer w-full h-10 sm:h-11 lg:h-12 text-white rounded-full font-medium text-sm sm:text-base ${isLoading ? 'animate-pulse scale-95' : ''} transition-transform duration-150`}
                  style={{ 
                    background: btnBg, 
                    transition: 'background 0.3s' 
                  }}
                  onMouseEnter={() => !isLoading && setBtnBg('linear-gradient(92.09deg, #6ec5ffff -17.23%, #3138ffff 107.78%)')}
                  onMouseLeave={() => !isLoading && setBtnBg('linear-gradient(92.09deg, #7FCBFD -17.23%, #4248FF 107.78%)')}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing Up...</span>
                    </div>
                  ) : (
                    'Sign Up'
                  )}
                </Button>
              </div>

              <div className="mt-3 sm:mt-4 lg:mt-5">
                <p 
                  className="text-center mb-3 sm:mb-4 lg:mb-5 max-w-[260px] sm:max-w-[280px] lg:max-w-[300px] mx-auto" 
                  style={{ 
                    fontWeight: 400, 
                    fontSize: 'clamp(11px, 1.8vw, 14px)', 
                    color: '#6B7280' 
                  }}
                >
                  By continuing, you agree to our Terms and acknowledge our{' '}
                  <Link href="/" className="hover:underline" style={{ color: '#4248FF' }}>
                    Privacy Policy
                  </Link>
                </p>

                {/* Divider */}
                <div className="flex items-center my-3 sm:my-4 lg:my-5">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-3 sm:px-4 text-gray-500 text-xs sm:text-sm">OR</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                {/* Google Sign-In */}
                <div className="mb-3 sm:mb-4 lg:mb-5">
                  <GoogleSignInButton
                    text="continue_with"
                    onSuccess={(user: User) => {
                      console.log('Google sign-up successful:', user);
                    }}
                    onError={(error: string) => {
                      setError(error);
                    }}
                    className="w-full"
                  />
                </div>

                <p 
                  className="text-center" 
                  style={{ 
                    fontWeight: 400, 
                    fontSize: 'clamp(11px, 1.8vw, 14px)',
                    color: '#6B7280' 
                  }}
                >
                  Already have an account?{' '}
                  <Link 
                    href="/" 
                    className="hover:underline" 
                    style={{ 
                      color: '#4248FF', 
                      fontWeight: 400 
                    }}
                  >
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