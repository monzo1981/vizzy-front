"use client"

export const dynamic = 'force-dynamic' 

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { login, isAuthenticated, User } from '@/lib/auth';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import Lottie from 'lottie-react';
import { useTheme } from '@/contexts/ThemeContext';

const Login = () => {
  const router = useRouter();
  const { isDarkMode, mounted } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [animationData, setAnimationData] = useState(null);
  const [btnBg, setBtnBg] = useState('linear-gradient(92.09deg, #7FCBFD -17.23%, #4248FF 107.78%)');

  useEffect(() => {
    // Fetch animation data
    fetch('/logo-motion.json')
      .then(res => res.json())
      .then(setAnimationData)
      .catch(console.error);
  }, []);

  useEffect(() => {
    // Check if user is already authenticated
    if (isAuthenticated()) {
      router.push('/chat');
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await login({ email, password });
    if (result.success) {
      router.push('/chat');
    } else {
      setError(result.error || 'An unexpected error occurred.');
    }
    setIsLoading(false);
  };

  return (
    <>
      {isCheckingAuth ? (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: mounted && isDarkMode ? '#181819' : 'white' }}>
          {animationData ? (
            <Lottie animationData={animationData} loop={true} style={{ height: 400, width: 400 }} />
          ) : (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          )}
        </div>
      ) : (
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

        {/* Right side - Login Form */}
        <div className="flex-1 lg:flex-[1] flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24 pb-8 lg:pb-0">
          <Card 
            className="border-0 flex flex-col justify-center w-full"
            style={{
              maxWidth: 'min(585px, 90vw)',
              width: '100%',
              minWidth: '300px',
              minHeight: '500px',
              height: 'auto',
              opacity: 1,
              borderRadius: 'clamp(32px, 6vw, 88px)',
              background: 'linear-gradient(92.9deg, rgba(211, 230, 252, 1) -14.33%, rgba(127, 202, 254, 1) 111.43%)',
              padding: 'clamp(24px, 4vw, 60px)'
            }}
          >
            <div className="text-center">
              {/* Logo */}
              <div className="flex justify-center mb-2">
                <div className="relative">
                  <Image 
                    src="/vizzy-logo.svg" 
                    alt="Vizzy Logo" 
                    width={300}
                    height={300}
                    className="w-[150px] sm:w-[200px] md:w-[250px] lg:w-[300px] h-auto"
                  />
                </div>
              </div>
              <p 
                className="mb-6 lg:mb-8" 
                style={{ 
                  fontWeight: 500, 
                  fontSize: 'clamp(16px, 2.5vw, 24px)', 
                  color: '#4248FF' 
                }}
              >
                Your Personal Agency!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 lg:space-y-6">
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
                    className="w-full h-12 sm:h-13 lg:h-14 bg-white rounded-full px-4 sm:px-5 lg:px-6 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0 text-sm sm:text-base"
                    required
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
                    className="w-full h-12 sm:h-13 lg:h-14 bg-white rounded-full px-4 sm:px-5 lg:px-6 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-center text-sm sm:text-base">
                  The email or password is incorrect
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className={`cursor-pointer w-full h-12 sm:h-13 lg:h-14 text-white rounded-full font-medium text-sm sm:text-base ${isLoading ? 'animate-pulse scale-95' : ''} transition-transform duration-150`}
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
                    <span>Signing In...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-4 sm:mt-5 lg:mt-6">
              <p 
                className="text-center mb-4 sm:mb-5 lg:mb-6 max-w-[280px] sm:max-w-[300px] mx-auto" 
                style={{ 
                  fontWeight: 400, 
                  fontSize: 'clamp(13px, 2vw, 15px)', 
                  color: '#6B7280' 
                }}
              >
                By continuing, you agree to our Terms and acknowledge our{' '}
                <Link href="/" className="hover:underline" style={{ color: '#4248FF' }}>
                  Privacy Policy
                </Link>
              </p>

              {/* Divider */}
              <div className="flex items-center my-4 sm:my-5 lg:my-6">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-3 sm:px-4 text-gray-500 text-xs sm:text-sm">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Google Sign-In */}
              <div className="mb-4 sm:mb-5 lg:mb-6">
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

              <p 
                className="text-center" 
                style={{ 
                  fontWeight: 400, 
                  fontSize: 'clamp(13px, 2vw, 14px)',
                  color: '#6B7280' 
                }}
              >
                Don&apos;t have an account?{' '}
                <Link 
                  href="/signup" 
                  className="hover:underline" 
                  style={{ 
                    color: '#4248FF', 
                    fontWeight: 400 
                  }}
                >
                  Sign up
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
      )}
    </>
  );
};

export default Login;