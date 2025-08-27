import React from 'react';

export function GradientBackground({ 
  children, 
  opacity = 1, 
  isDarkMode = false 
}: { 
  children: React.ReactNode; 
  opacity?: number;
  isDarkMode?: boolean;
}) {
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
      {/* Base gradient background */}
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
          }}
        />
        
        {/* Center floating blob for more depth */}
        <div 
          className="absolute w-[400px] h-[300px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40"
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
          }}
        />
      </div>
      
      {/* Subtle noise texture overlay */}
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