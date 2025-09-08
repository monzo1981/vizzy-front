"use client"

export const dynamic = 'force-dynamic' 

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { login, isAuthenticated } from '@/lib/auth';

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [btnBg, setBtnBg] = useState('linear-gradient(92.09deg, #7FCBFD -17.23%, #4248FF 107.78%)');

  useEffect(() => {
    // If user is already authenticated, redirect to chat
    if (isAuthenticated()) {
      router.push('/chat');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await login({ email, password });
    if (result.success) {
      router.push('/chat');
    } else {
      setError(result.error || 'An unexpected error occurred.');
    }
  };

  return (
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
                للتسويق بالذكــاء الاصطـناعي
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

        {/* Right side - Login Form */}
        <div className="flex-[1] flex items-center justify-end relative z-10 p-12 md:p-16 pr-12 md:pr-16 lg:pr-24 xl:pr-32 2xl:pr-40">
          <Card 
            className="border-0 flex flex-col justify-center"
            style={{
              width: 'clamp(350px, 500px, 585px)',
              height: 'clamp(500px, 70vh, 650px)',
              opacity: 1,
              borderRadius: '88px',
              background: 'linear-gradient(92.9deg, rgba(211, 230, 252, 1) -14.33%, rgba(127, 202, 254, 1) 111.43%)',
              padding: '60px'
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
                  />
                  </div>
                </div>
              <p className="mb-8" style={{ fontWeight: 500, fontSize: '24px', color: '#4248FF' }}>Your Personal Agency!</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    className="w-full h-14 bg-white rounded-full px-6 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0"
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
                    className="w-full h-14 bg-white rounded-full px-6 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-center mb-4">The email or password is incorrect</p>}

              <Button
                type="submit"
                className="cursor-pointer w-full h-14 text-white rounded-full font-medium text-base"
                style={{ background: btnBg, transition: 'background 0.3s' }}
                onMouseEnter={() => setBtnBg('linear-gradient(92.09deg, #6ec5ffff -17.23%, #3138ffff 107.78%)')}
                onMouseLeave={() => setBtnBg('linear-gradient(92.09deg, #7FCBFD -17.23%, #4248FF 107.78%)')}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-4">
              <p className="text-center mb-6 max-w-[300px] mx-auto" style={{ fontWeight: 400, fontSize: '15px', color: '#6B7280' }}>
                By continuing, you agree to our Terms and acknowledge our{' '}
                <Link href="/" className="hover:underline" style={{ color: '#4248FF' }}>Privacy Policy</Link>
              </p>

                {/* Social Login */}
                <div className="flex justify-center gap-2 mb-8">
                <button
                    className="cursor-pointer w-12 h-12 rounded-xl hover:bg-gray-200/20 transition-all duration-200 flex items-center justify-center"
                >
                    <svg className="w-9 h-9" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                    </svg>
                </button>
                <button
                    className="cursor-pointer w-12 h-12 rounded-xl hover:bg-gray-200/20 transition-all duration-200 flex items-center justify-center"
                >
                    <svg className="w-9 h-9" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                </button>
                <button
                    className="cursor-pointer w-12 h-12 rounded-xl hover:bg-gray-200/20 transition-all duration-200 flex items-center justify-center"
                >
                    <svg className="w-10 h-10" fill="#000000" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                </button>
                </div>

              <p className="text-sm text-center mt-6" style={{ fontWeight: 400, color: '#6B7280' }}>
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="hover:underline" style={{ color: '#4248FF', fontWeight: 400 }}>
                  Sign up
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
              Login and gets<br />
              all your solutions
            </h1>
          </div>
        </div>

        {/* Bottom - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8 pt-0">
          <Card 
            className="border-0 flex flex-col justify-center overflow-hidden"
            style={{
              width: 'clamp(280px, 90vw, 400px)',
              height: 'clamp(520px, 70vh, 650px)',
              opacity: 1,
              borderRadius: 'clamp(32px, 8vw, 88px)',
              background: 'linear-gradient(92.9deg, rgba(211, 230, 252, 1) -14.33%, rgba(127, 202, 254, 1) 111.43%)',
              padding: 'clamp(20px, 5vw, 32px)'
            }}
          >
            <div className="text-center">
                {/* Logo */}
                <div className="flex justify-center mb-4">
                    <div className="relative">
                        <Image 
                        src="/vizzy-logo.svg" 
                        alt="Vizzy Logo" 
                        width={150}
                        height={150}
                        className="max-w-full h-auto"
                        />
                    </div>
                </div>
              <p className="mb-6" style={{ fontWeight: 500, fontSize: 'clamp(14px, 3.5vw, 18px)', color: '#4248FF' }}>Your Personal Agency!</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full h-12 bg-white rounded-full px-6 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-center mb-4">The email or password is incorrect</p>}

              <Button 
                type="submit"
                className="w-full h-12 text-white rounded-full font-medium text-base"
                style={{ background: 'linear-gradient(92.09deg, #7FCBFD -17.23%, #4248FF 107.78%)' }}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-4">
              <p className="text-center mb-4 max-w-[300px] mx-auto" style={{ fontWeight: 400, fontSize: '15px', color: '#6B7280' }}>
                By continuing, you agree to our Terms and acknowledge our{' '}
                <Link href="/" className="hover:underline" style={{ color: '#4248FF' }}>Privacy Policy</Link>
              </p>

                {/* Social Login */}
                <div className="flex justify-center gap-2 mb-8">
                    <button
                        className="cursor-pointer w-12 h-12 rounded-xl hover:bg-gray-200/20 transition-all duration-200 flex items-center justify-center"
                    >
                        <svg className="w-9 h-9" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                        </svg>
                    </button>
                    <button
                        className="cursor-pointer w-12 h-12 rounded-xl hover:bg-gray-200/20 transition-all duration-200 flex items-center justify-center"
                    >
                        <svg className="w-9 h-9" fill="#1877F2" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                    </button>
                    <button
                        className="cursor-pointer w-12 h-12 rounded-xl hover:bg-gray-200/20 transition-all duration-200 flex items-center justify-center"
                    >
                        <svg className="w-10 h-10" fill="#000000" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                    </button>
                </div>

              <p className="text-sm text-center mt-4" style={{ fontWeight: 400, color: '#6B7280' }}>
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="hover:underline" style={{ color: '#4248FF', fontWeight: 400 }}>
                  Sign up
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;