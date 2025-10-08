"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { downloadMedia, isVideoUrl as isVideoUrlHelper } from '@/lib/chat/imageHelpers'
import { isVideoUrl, getVideoMimeType } from '@/lib/videoUtils'

// StableImage component for handling image proxies
const StableImage = React.memo(({ 
  src, 
  alt, 
  className, 
  style, 
  onClick 
}: { 
  src: string
  alt: string
  className: string
  style: React.CSSProperties
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void 
}) => {
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState('')

  useEffect(() => {
    if (src) {
      const urlWithoutTimestamp = src.includes('/api/image-proxy') 
        ? src.split('&t=')[0] 
        : src
      if (urlWithoutTimestamp !== imageSrc) {
        setImageSrc(urlWithoutTimestamp)
        setImageError(false)
      }
    }
  }, [src, imageSrc])

  if (imageError || !imageSrc) return null

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={style}
      onClick={onClick}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  )
})
StableImage.displayName = 'StableImage'

interface RecentWorkItem {
  id: string;
  content_url: string;
  created_at: string;
  ai_chat_session_id?: string;
}

interface RecentWorkCardProps {
  isDarkMode: boolean;
  language: string;
  isRTL: boolean;
  t: (key: string) => string;
  createLocalizedPath: (path: string) => string;
  recentWork: RecentWorkItem[];
  setIsRecentWorkModalOpen: (open: boolean) => void;
}

// ExpandedImageModal Component (internal)
interface ExpandedImageModalProps {
  imageUrl: string | null
  onClose: () => void
}

const ExpandedImageModal: React.FC<ExpandedImageModalProps> = ({ 
  imageUrl, 
  onClose
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  // Handle media download in modal
  const handleModalDownload = async () => {
    if (!imageUrl || isDownloading) return;
    
    setIsDownloading(true);
    try {
      // Get the original URL if it's a proxied URL  
      let originalUrl = imageUrl;
      if (imageUrl.includes('/api/image-proxy?imageUrl=') || imageUrl.includes('/api/video-proxy?videoUrl=')) {
        // Extract original URL from proxy
        const urlMatch = imageUrl.match(/[?&](imageUrl|videoUrl)=([^&]+)/);
        if (urlMatch && urlMatch[2]) {
          originalUrl = decodeURIComponent(urlMatch[2]);
        }
      }
      
      // For user uploaded images, use the URL directly
      if (!imageUrl.includes('/api/')) {
        originalUrl = imageUrl;
      }
      
      await downloadMedia(originalUrl);
      console.log('Media downloaded successfully from modal');
    } catch (error) {
      console.error('Failed to download media from modal:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex flex-col"
      onClick={onClose}
    >
      {/* Top Controls Bar */}
      <div className="flex justify-between items-center p-6 z-10 flex-shrink-0">
        {/* Back/Close Arrow - Left Side */}
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors cursor-pointer"
          aria-label="Back"
        >
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>

        {/* Download Button - Right Side */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleModalDownload();
          }}
          disabled={isDownloading}
          className="transition-opacity duration-200 disabled:opacity-50 cursor-pointer hover:opacity-80"
          title={isVideoUrl(imageUrl) ? "Download Video" : "Download Image"}
        >
          <Image
            src="/download.svg"
            alt="Download"
            width={32}
            height={32}
            style={{ filter: 'brightness(0) invert(1) sepia(1)' }}
          />
        </button>
      </div>

      {/* Media Content - Absolutely Centered */}
      <div className="absolute inset-0 flex items-center justify-center p-20">
        {isVideoUrl(imageUrl) ? (
          <video 
            controls 
            autoPlay
            className="max-w-[90vw] max-h-[70vh]"
            style={{ borderRadius: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <source 
              src={`/api/video-proxy?videoUrl=${encodeURIComponent(imageUrl)}`} 
              type={getVideoMimeType(imageUrl)} 
            />
            Your browser does not support the video tag.
          </video>
        ) : (
          <StableImage
            src={imageUrl.includes('/api/') ? imageUrl : `/api/image-proxy?imageUrl=${encodeURIComponent(imageUrl)}`}
            alt="Expanded view"
            className="max-w-[90vw] max-h-[70vh]"
            style={{ 
              borderRadius: '20px',
              objectFit: 'contain'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
    </div>
  );
};

export function RecentWorkCard({
  isDarkMode,
  language,
  isRTL,
  t,
  createLocalizedPath,
  recentWork,
  setIsRecentWorkModalOpen,
}: RecentWorkCardProps) {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Auto-slide effect - Continuous movement
  useEffect(() => {
    if (recentWork.length <= 1) return

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % recentWork.length)
    }, 3000) // 4 seconds for longer viewing time

    return () => clearInterval(interval)
  }, [recentWork.length])

  // Touch handlers for mobile swipe - Faster response
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 30 // Reduced threshold for faster response
    const isRightSwipe = distance < -30

    if (isLeftSwipe && recentWork.length > 0) {
      setCurrentSlide(prev => (prev + 1) % recentWork.length)
    } else if (isRightSwipe && recentWork.length > 0) {
      setCurrentSlide(prev => prev === 0 ? recentWork.length - 1 : prev - 1)
    }
  }

  return (
    <>
      <Card 
      className="border-0 text-white md:col-span-3"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      style={{
        background: '#7FCAFE',
        borderRadius: '36px',
      }}
    >
      <CardContent className="p-6">
        <h3 className="font-bold mb-2" style={{ fontWeight: 700, fontSize: 30, fontFamily: 'Inter', textAlign: 'center' }}>{t('profile.recentWork')}</h3>
        <div className="flex flex-col h-full min-h-[240px]">
          <div className="flex-1 flex items-center justify-center relative overflow-hidden"
            onTouchStart={recentWork.length > 0 ? handleTouchStart : undefined}
            onTouchMove={recentWork.length > 0 ? handleTouchMove : undefined}
            onTouchEnd={recentWork.length > 0 ? handleTouchEnd : undefined}
          >
            {recentWork.length > 0 ? (
              <div className="relative w-full h-[200px] flex items-center justify-center">
                {/* Navigation Arrows */}
                <button
                  onClick={() => setCurrentSlide(prev => prev === 0 ? recentWork.length - 1 : prev - 1)}
                  className="absolute left-2 z-50 p-3 rounded-full transition-all duration-200 hover:scale-110 hover:opacity-100 hover:bg-white/20"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    opacity: 0.8,
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                
                <button
                  onClick={() => setCurrentSlide(prev => (prev + 1) % recentWork.length)}
                  className="absolute right-2 z-50 p-3 rounded-full transition-all duration-200 hover:scale-110 hover:opacity-100 hover:bg-white/20"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    opacity: 0.8,
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Triangular Stacked Carousel Container */}
                <div className="relative w-full h-full flex items-center justify-center">
                  {recentWork.map((item, index) => {
                    // Create seamless circular movement for 5 visible images
                    const totalItems = recentWork.length
                    let position = (index - currentSlide + totalItems) % totalItems
                    
                    // Handle negative positions for seamless loop
                    if (position > totalItems / 2) {
                      position = position - totalItems
                    }
                    
                    // Calculate properties for 5 visible images in triangle formation
                    const absPosition = Math.abs(position)
                    const isCenter = position === 0
                    const isVisible = absPosition <= 2 // Show 5 images total (-2, -1, 0, 1, 2)
                    
                    if (!isVisible) return null
                    
                    let scale = 1
                    let opacity = 1
                    let zIndex = 10
                    let translateX = 0
                    let translateY = 0
                    
                    if (isCenter) {
                      // Center image - largest and in front
                      scale = 1
                      opacity = 1
                      zIndex = 30
                      translateX = 0
                      translateY = 0
                    } else if (absPosition === 1) {
                      // First level - medium size, slightly behind
                      scale = 0.8
                      opacity = 0.8
                      zIndex = 20
                      translateX = position * 70 // Keep wider spacing for bigger width
                      translateY = 15 // Back to original vertical spacing
                    } else if (absPosition === 2) {
                      // Second level - same size as first level but further behind
                      scale = 0.8 // Same size as first level
                      opacity = 0.6
                      zIndex = 10
                      translateX = position * 55 // Keep adjusted spacing for wider images
                      translateY = 25 // Back to original vertical spacing
                    }
                    
                    return (
                      <div
                        key={item.id}
                        className="absolute transition-all duration-1000 ease-in-out cursor-pointer"
                        style={{
                          transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`,
                          opacity,
                          zIndex,
                          width: '160px', // Keep the wider width
                          height: '180px', // Back to original height
                        }}
                        onClick={() => setCurrentSlide(index)}
                      >
                        <Image
                          src={item.content_url}
                          alt={`Generated content ${index + 1}`}
                          width={160}
                          height={180}
                          className="rounded-lg object-cover w-full h-full shadow-lg cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the carousel click
                            setExpandedImage(item.content_url);
                          }}
                          onError={(e) => {
                            // Handle broken images
                            const target = e.target as HTMLImageElement
                            target.src = '/recent-work.png'
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              // Static placeholder boxes when no recent work is available
              <div className="relative w-full h-[200px] flex items-center justify-center">
                {/* Background placeholder boxes */}
                <div className="relative w-full h-full flex items-center justify-center">
                  {Array.from({ length: 5 }).map((_, index) => {
                    // Static positions for 5 placeholder boxes in same formation
                    let scale = 1
                    let opacity = 1
                    let zIndex = 10
                    let translateX = 0
                    let translateY = 0
                    
                    // Position 2 is center (index 2)
                    const position = index - 2
                    const absPosition = Math.abs(position)
                    const isCenter = position === 0
                    
                    if (isCenter) {
                      // Center box - largest and in front
                      scale = 1
                      opacity = 0.4
                      zIndex = 30
                      translateX = 0
                      translateY = 0
                    } else if (absPosition === 1) {
                      // First level - medium size, slightly behind
                      scale = 0.8
                      opacity = 0.4
                      zIndex = 20
                      translateX = position * 70
                      translateY = 15
                    } else if (absPosition === 2) {
                      // Second level - smaller size, further behind
                      scale = 0.8
                      opacity = 0.2
                      zIndex = 10
                      translateX = position * 55
                      translateY = 25
                    }
                    
                    return (
                      <div
                        key={index}
                        className="absolute"
                        style={{
                          transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`,
                          opacity,
                          zIndex,
                          width: '160px',
                          height: '180px',
                        }}
                      >
                        <div 
                          className="w-full h-full rounded-lg shadow-lg"
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
                
                {/* Text and button overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-50">
                  <h3 
                    style={{
                      color: '#4248FF',
                      fontSize: '30px',
                      fontWeight: 700,
                      marginBottom: '8px'
                    }}
                  >
                    {t('profile.nothingHere')}
                  </h3>
                  <button
                    onClick={() => router.push(createLocalizedPath('chat'))}
                    style={{
                      background: 'white',
                      color: '#78758E',
                      fontSize: '20px',
                      fontWeight: 400,
                      padding: '8px 24px',
                      borderRadius: '32px',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'Inter',
                    }}
                  >
                    {t('profile.startGenerating')}
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Navigation Dots - Only show when there are actual images */}
          {recentWork.length > 0 && (
            <div className="flex flex-col gap-2 mt-6">
              <div className="flex justify-center w-full gap-2">
                {recentWork.map((_, index) => {
                  const isActive = index === currentSlide
                  const width = Math.max(15, 80 / Math.max(5, recentWork.length)) // Responsive width
                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      style={{
                        width: `${width}%`,
                        height: isActive ? '10px' : '8px',
                        background: isActive ? '#FF4A19' : '#D3E6FC',
                        borderRadius: '8px',
                        opacity: 1,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  )
                })}
              </div>
              <div className="flex justify-end w-full mt-2">
                <Button
                  type="button"
                  className="shadow-md font-bold"
                  style={{
                    background: 'white',
                    color: '#000',
                    borderRadius: '50px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '16px',
                    padding: '12px 40px',
                    marginRight: 0,
                    fontFamily: 'inherit',
                  }}
                  onClick={() => setIsRecentWorkModalOpen(true)}
                >
                  {t('profile.seeFulld')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Expanded Image Modal */}
    {expandedImage && (
      <ExpandedImageModal
        imageUrl={expandedImage}
        onClose={() => setExpandedImage(null)}
      />
    )}
    </>
  )
}