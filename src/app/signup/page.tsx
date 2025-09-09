"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { register, isAuthenticated, User } from '@/lib/auth';
import GoogleSignInButton from '@/components/GoogleSignInButton';

const SignUp = () => {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // If user is already authenticated, redirect to chat
    if (isAuthenticated()) {
      router.push('/chat');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName || !lastName || !email || !password) {
      setError('All fields are required.');
      return;
    }

    const emailRegex = /^[^S@]+@[^S@]+\.[^S@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    const result = await register({
      first_name: firstName,
      last_name: lastName,
      email,
      password,
    });

    if (result.success) {
      // Optionally show a success message before redirecting
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

        {/* Right side - Sign Up Form */}
        <div className="flex-[1] flex items-center justify-end relative z-10 p-12 md:p-16 pr-12 md:pr-16 lg:pr-24 xl:pr-32 2xl:pr-40">
          <Card
            className="border-0 flex flex-col justify-center"
            style={{
              width: 'clamp(350px, 500px, 585px)',
              height: 'clamp(600px, 80vh, 750px)', // Adjusted height for new fields
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
              <div className="flex flex-col lg:flex-row lg:gap-4">
                <div
                  className="rounded-full p-[1px] w-full lg:w-1/2 mb-6 lg:mb-0"
                  style={{
                    background: 'linear-gradient(91.52deg, #4248FF -19.2%, #7FCBFD 119.88%)'
                  }}
                >
                  <Input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-14 bg-white rounded-full px-6 text-gray-700 placeholder:text-gray-400 border-0 focus:outline-none focus:ring-0 focus:border-0"
                    required
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

              {error && <p className="text-red-500 text-center mb-4">{error}</p>}

              <Button
                type="submit"
                className="cursor-pointer w-full h-14 text-white rounded-full font-medium text-base"
                style={{ background: 'linear-gradient(92.09deg, #7FCBFD -17.23%, #4248FF 107.78%)' }}
              >
                Sign Up
              </Button>
            </form>

            <div className="mt-4">
              <p className="text-center mb-6 max-w-[300px] mx-auto" style={{ fontWeight: 400, fontSize: '15px', color: '#6B7280' }}>
                By continuing, you agree to our Terms and acknowledge our{' '}
                <Link href="/" className="hover:underline" style={{ color: '#4248FF' }}>Privacy Policy</Link>
              </p>

                {/* Divider */}
                <div className="flex items-center my-6">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-4 text-gray-500 text-sm">OR</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                {/* Google Sign-In */}
                <div className="mb-6">
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

              <p className="text-sm text-center mt-6" style={{ fontWeight: 400, color: '#6B7280' }}>
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
        <div className="flex-1 flex items-center justify-center p-8 pt-0">
          <Card
            className="border-0 flex flex-col justify-center"
            style={{
              width: 'clamp(280px, 90vw, 400px)',
              height: 'clamp(550px, 70vh, 650px)', // Adjusted height
              opacity: 1,
              borderRadius: 'clamp(32px, 8vw, 88px)',
              background: 'linear-gradient(92.9deg, rgba(211, 230, 252, 1) -14.33%, rgba(127, 202, 254, 1) 111.43%)',
              padding: 'clamp(16px, 4vw, 24px)'
            }}
          >
            <div className="text-center">
                {/* Logo */}
                <div className="flex justify-center mb-2">
                    <div className="relative">
                        <Image
                        src="/vizzy-logo.svg"
                        alt="Vizzy Logo"
                        width={150}
                        height={150}
                        />
                    </div>
                </div>
              <p className="mb-6" style={{ fontWeight: 500, fontSize: 'clamp(16px, 4vw, 20px)', color: '#4248FF' }}>Your Personal Agency!</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div
                className="rounded-full p-[1px] mb-4"
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
                  required
                />
              </div>
              <div
                className="rounded-full p-[1px] mb-4"
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
                  required
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

              {error && <p className="text-red-500 text-center mb-4">{error}</p>}

              <Button
                type="submit"
                className="w-full h-12 text-white rounded-full font-medium text-base"
                style={{ background: 'linear-gradient(92.09deg, #7FCBFD -17.23%, #4248FF 107.78%)' }}
              >
                Sign Up
              </Button>
            </form>

            <div className="mt-4">
              {/* Google Sign-Up */}
              <div className="mb-4">
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
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-gray-500 text-sm">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              <p className="text-center mb-4 max-w-[300px] mx-auto" style={{ fontWeight: 400, fontSize: '15px', color: '#6B7280' }}>
                By continuing, you agree to our Terms and acknowledge our{' '}
                <Link href="/" className="hover:underline" style={{ color: '#4248FF' }}>Privacy Policy</Link>
              </p>

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
    </div>
  );
};

export default SignUp;
