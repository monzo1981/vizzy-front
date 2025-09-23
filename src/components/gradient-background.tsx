import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export function GradientBackground({ 
  children, 
  opacity = 1
}: { 
  children: React.ReactNode; 
  opacity?: number;
}) {
  const { isDarkMode } = useTheme();
  // If dark mode is enabled, render a solid dark background
  if (isDarkMode) {
    return (
      <div className="min-h-screen w-full relative overflow-hidden" style={{ background: 'rgba(24, 24, 25, 1)' }}>
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }

  // Light mode gradient (original implementation)
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* CSS Animations */}
      <style>
        {`
          @keyframes floatSlow {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(80px, -60px) scale(1.2); }
            50% { transform: translate(-60px, 80px) scale(0.8); }
            75% { transform: translate(100px, 30px) scale(1.1); }
          }
          
          @keyframes floatMedium {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-100px, 50px) scale(1.3); }
            66% { transform: translate(120px, -80px) scale(0.7); }
          }
          
          @keyframes floatFast {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(60px, -120px) scale(1.4); }
          }
          
          @keyframes centerFloat {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            33% { transform: translate(-50%, -50%) scale(1.5) translate(80px, -60px); }
            66% { transform: translate(-50%, -50%) scale(0.6) translate(-40px, 90px); }
          }
        `}
      </style>

      {/* Base gradient background - ثابت */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(
              135deg,
              #FFFFFF 0%,
              #D3E6FC 25%,
              #D3E6FC 50%,
              #D3E6FC 75%,
              #FFD9D4 100%
            )
          `,
          opacity: opacity,
        }}
      />
      
      {/* Animated gradient blobs for wave effect */}
      <div className="absolute inset-0" style={{ opacity: opacity }}>
        {/* Top left white/light blue blob */}
        <div 
          className="absolute w-[800px] h-[600px] -top-32 -left-32 rounded-full opacity-80"
          style={{
            background: `
              radial-gradient(
                circle,
                #FFFFFF 0%,
                #FFFFFF 0%,
                #FFFFFF 20%,
                transparent 100%
              )
            `,
            filter: 'blur(60px)',
            animation: 'floatSlow 6s ease-in-out infinite'
          }}
        />
        
        {/* Bottom left darker blue blob */}
        <div 
          className="absolute w-[600px] h-[500px] -bottom-20 -left-20 rounded-full opacity-60"
          style={{
            background: `
              radial-gradient(
                circle,
                #AAD8FD 0%,
                #7FCAFE 30%,
                transparent 50%
              )
            `,
            filter: 'blur(60px)',
            animation: 'floatMedium 4s ease-in-out infinite reverse'
          }}
        />
        
        {/* Bottom right beige/light blob */}
        <div 
          className="absolute w-[700px] h-[400px] -bottom-10 -right-10 rounded-full opacity-50"
          style={{
            background: `
              radial-gradient(
                circle,
                #FFE4E0 0%,
                #FFE4E0 50%,
                transparent 100%
              )
            `,
            filter: 'blur(30px)',
            animation: 'floatFast 3s ease-in-out infinite'
          }}
        />
        
        {/* Center floating blob for more depth */}
        <div 
          className="absolute w-[400px] h-[300px] top-1/2 left-1/2 rounded-full opacity-40"
          style={{
            background: `
              radial-gradient(
                circle,
                #D3E6FC 0%,
                #D3E6FC 60%,
                transparent 100%
              )
            `,
            filter: 'blur(35px)',
            animation: 'centerFloat 7s ease-in-out infinite'
          }}
        />
      </div>
      
      {/* Subtle noise texture overlay - ثابت */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234248FF' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='17' r='1'/%3E%3Ccircle cx='47' cy='27' r='1'/%3E%3Ccircle cx='17' cy='37' r='1'/%3E%3Ccircle cx='37' cy='47' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: opacity * 0.2,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}