"use client";

import React from "react";

interface AnimatedBorderWrapperProps {
  children: React.ReactNode;
  isAnimating: boolean;
  className?: string;
  isDarkMode?: boolean;
}

const AnimatedBorderWrapper: React.FC<AnimatedBorderWrapperProps> = ({
  children,
  isAnimating,
  className = "",
  isDarkMode = false,
}) => {
  const borderRadius = "50px"; // ثابت 50px بدلاً من responsive

  return (
    <>
      <style jsx>{`
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        @keyframes rotateGradient {
          from {
            --angle: 0deg;
          }
          to {
            --angle: 360deg;
          }
        }

        .animated-border-wrapper {
          position: relative;
          padding: 2px;
          background: ${isAnimating
            ? `conic-gradient(from calc(var(--angle) - 46.15deg) at 50.76% 47.25%, 
            #4248FF99 -40.22deg, 
            #7FCAFE99 50.49deg, 
            #FFEB7799 104.02deg, 
            #4248FF99 158.81deg, 
            #FF4A1999 224.78deg, 
            #4248FF99 319.78deg, 
            #7FCAFE99 410.49deg)`
            : "transparent"};
          animation: ${isAnimating ? "rotateGradient 3s linear" : "none"};
          transition: all 0.5s ease-out;
          box-shadow: ${isAnimating
            ? isDarkMode
              ? "0px 0px 15px rgba(66, 72, 255, 0.4)"
              : "0px 0px 15px rgba(255, 255, 255, 0.4)"
            : "none"};
          overflow: hidden;
        }

        .animated-border-content {
          overflow: hidden;
        }
      `}</style>
      <div
        className={`animated-border-wrapper ${className}`}
        style={{
          borderRadius,
          overflow: "hidden",
        }}
      >
        <div
          className="animated-border-content"
          style={{
            borderRadius,
            overflow: "hidden",
            backgroundColor: isDarkMode ? "#181819" : "#ffffff",
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default AnimatedBorderWrapper;