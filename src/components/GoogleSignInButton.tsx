"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { googleAuth, GoogleTokenPayload } from '@/lib/googleAuth';
import { googleLogin, User } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface GoogleSignInButtonProps {
  onSuccess?: (user: User) => void;
  onError?: (error: string) => void;
  text?: 'sign_in_with' | 'sign_up_with' | 'continue_with';
  className?: string;
  disabled?: boolean;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  text = 'continue_with',
  className = '',
  disabled = false,
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [googleButtonRendered, setGoogleButtonRendered] = useState(false);

  const handleGoogleSuccess = useCallback(async (payload: GoogleTokenPayload & { credential: string }) => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      console.log('[GoogleSignInButton] Received payload:', { 
        email: payload.email, 
        name: payload.name,
        credentialLength: payload.credential?.length 
      });
      
      // Send the credential token to our backend
      const result = await googleLogin(payload.credential);
      
      if (result.success && result.data?.user) {
        console.log('[GoogleSignInButton] Login successful:', result.data.user.email);
        onSuccess?.(result.data.user);
        router.push('/ar/chat');
      } else {
        console.error('[GoogleSignInButton] Backend error:', result.error);
        throw new Error(result.error || 'Google login failed');
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Google Sign-In failed';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onSuccess, onError, router]);

  useEffect(() => {
    const initializeGoogleAuth = async () => {
      try {
        await googleAuth.initialize();
        setIsInitialized(true);
        
        if (buttonRef.current && !disabled) {
          googleAuth.renderSignInButton(
            buttonRef.current,
            handleGoogleSuccess,
            {
              theme: 'outline',
              size: 'large',
              text,
              shape: 'rectangular',
              logo_alignment: 'left',
            }
          );
          setGoogleButtonRendered(true);
        }
      } catch (error) {
        console.error('Failed to initialize Google Auth:', error);
        onError?.('Failed to initialize Google Sign-In');
      }
    };

    if (!isInitialized) {
      initializeGoogleAuth();
    }
  }, [text, disabled, isInitialized, onError, handleGoogleSuccess]);

  const handleFallbackClick = async () => {
    if (disabled || isLoading || !isInitialized) return;
    
    setIsLoading(true);
    
    try {
      const googleUser = await googleAuth.signInWithPopup();
      await handleGoogleSuccess(googleUser);
    } catch (error) {
      console.error('Google Sign-In popup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Google Sign-In failed';
      onError?.(errorMessage);
      setIsLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className={`flex items-center justify-center h-12 border border-gray-300 rounded-full bg-white ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading Google Sign-In...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Google's rendered button */}
      <div 
        ref={buttonRef} 
        className={disabled ? 'opacity-50 pointer-events-none' : ''}
      />
      
      {/* Fallback button (hidden by default, shown if Google button fails to render) */}
      {!googleButtonRendered && (
        <button
          onClick={handleFallbackClick}
          disabled={disabled || isLoading}
          className={`w-full h-12 flex items-center justify-center border border-gray-300 rounded-full bg-white hover:bg-gray-50 transition-colors ${
            disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-gray-700">Signing in...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span className="text-gray-700 font-medium">
                {text === 'sign_in_with' && 'Sign in with Google'}
                {text === 'sign_up_with' && 'Sign up with Google'}
                {text === 'continue_with' && 'Continue with Google'}
              </span>
            </div>
          )}
        </button>
      )}
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-full">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default GoogleSignInButton;
