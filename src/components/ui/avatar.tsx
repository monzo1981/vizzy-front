"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface AvatarProps {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | number
  className?: string
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
  className 
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false)
  
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
        "relative flex-shrink-0 p-[2px] border-2 border-[#FF4A19] rounded-full bg-white",
        typeof size === 'string' ? sizeClasses[size] : '',
        className
      )}
      style={customSize}
    >
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
  )
}
