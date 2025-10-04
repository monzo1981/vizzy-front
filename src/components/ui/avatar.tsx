"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"

interface AvatarProps {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | number
  className?: string
  bgOverride?: 'transparent' | 'light' | 'dark' | 'auto' // Added prop to control background
  showBorder?: boolean // NEW: Control gradient border visibility
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12", 
  lg: "w-16 h-16",
  xl: "w-20 h-20"
}

const textSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base", 
  xl: "text-lg"
}

export function Avatar({ 
  src, 
  alt = "", 
  fallback, 
  size = 'md',
  className,
  bgOverride = 'auto',
  showBorder = true // Default to true to maintain existing behavior
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false)
  const { isDarkMode, mounted } = useTheme()
  
  // Determine background color based on override prop
  const getBackgroundColor = () => {
    if (bgOverride === 'transparent') return 'bg-transparent'
    if (bgOverride === 'light') return 'bg-white'
    if (bgOverride === 'dark') return 'bg-black'
    // Default 'auto' mode - only apply theme after mount
    return (mounted && isDarkMode) ? 'bg-black' : 'bg-white'
  }
  
  // Generate fallback from alt text if not provided
  const displayFallback = React.useMemo(() => {
    if (fallback) return fallback
    if (alt) {
      return alt
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase()
    }
    return "??"
  }, [fallback, alt])

  const handleImageError = () => {
    setImageError(true)
  }

  const showImage = src && !imageError

  // Support custom pixel size
  const customSize = typeof size === 'number' ? { width: size, height: size, minWidth: size, minHeight: size } : undefined;
  
  return (
    <div
      className={cn(
        "relative flex-shrink-0 rounded-full",
        showBorder ? "p-[2px]" : "p-0", // Only add padding if border is shown
        typeof size === 'string' ? sizeClasses[size] : '',
        className
      )}
      style={{
        ...customSize,
        ...(showBorder && {
          background: ' conic-gradient(from 223.88deg at 50% 50%, #FF4A19 -75.43deg, #FFEB77 6.01deg, #4248FF 92.34deg, #7FCAFE 211.14deg, #FF4A19 284.57deg, #FFEB77 366.01deg)',
          boxShadow: (bgOverride === 'dark' || (bgOverride === 'auto' && mounted && isDarkMode)) 
            ? '0px 0px 16px 0px #4248ff69' 
            : '0px 0px 16px 0px rgba(255, 255, 255, 0.75)'
        })
      }}
      suppressHydrationWarning
    >
      <div className={`w-full h-full ${showBorder ? 'p-[3px]' : 'p-0'} rounded-full ${getBackgroundColor()}`} suppressHydrationWarning>
        {showImage ? (
          <div className="relative w-full h-full overflow-hidden rounded-full">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover"
              onError={handleImageError}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div 
            className={cn(
              "w-full h-full flex items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 font-semibold select-none",
              typeof size === 'string' ? textSizes[size] : 'text-base'
            )}
            role="img"
            aria-label={alt || "Avatar"}
          >
            {displayFallback}
          </div>
        )}
      </div>
    </div>
  )
}