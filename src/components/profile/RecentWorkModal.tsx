"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Lottie from 'lottie-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { isVideoUrl, getVideoMimeType } from '@/lib/videoUtils'
import { downloadMedia } from '@/lib/chat/imageHelpers'

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
  id: string
  content_url: string
  created_at: string
  ai_chat_session_id?: string
}

interface RecentWorkModalProps {
  isOpen: boolean
  onClose: () => void
}

// ExpandedImageModal Component
interface ExpandedImageModalProps {
  imageUrl: string | null
  onClose: () => void
  StableImage: React.ComponentType<{
    src: string
    alt: string
    className: string
    style: React.CSSProperties
    onClick?: (e: React.MouseEvent<HTMLImageElement>) => void
  }>
}

const ExpandedImageModal: React.FC<ExpandedImageModalProps> = ({ 
  imageUrl, 
  onClose,
  StableImage
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
}

export const RecentWorkModal: React.FC<RecentWorkModalProps> = ({
  isOpen,
  onClose
}) => {
  const { t, language } = useLanguage()
  const [recentWork, setRecentWork] = useState<RecentWorkItem[]>([])
  const [loading, setLoading] = useState(false)
  const [logoAnimationData, setLogoAnimationData] = useState(null)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  // Fetch all recent work when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllRecentWork()
    }
  }, [isOpen])

  // Load logo animation data
  useEffect(() => {
    fetch('/logo-motion.json')
      .then(response => response.json())
      .then(data => setLogoAnimationData(data))
      .catch(error => console.error('Error loading logo animation:', error))
  }, [])

  const fetchAllRecentWork = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      // Fetch all data with limit=all
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/recent-work/?limit=all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setRecentWork(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching all recent work:', error)
    } finally {
      setLoading(false)
    }
  }

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      style={{
        backgroundColor: '#11002E80',
        backdropFilter: 'blur(6px)',
      }}
      onClick={handleBackdropClick}
    >
      {/* Back/Close Arrow - Screen Top Left */}
      <button
        onClick={onClose}
        className="fixed top-6 left-6 z-50 text-white hover:text-gray-300 transition-colors cursor-pointer"
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

      <div
        className="relative w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden rounded-[20px] sm:rounded-[50px]"
        style={{
          backgroundColor: '#11002e17',
          backdropFilter: 'blur(20px)',
          border: '2px solid #D3E6FC',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        }}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto max-h-[98vh] sm:max-h-[95vh] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {loading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="text-center">
                {logoAnimationData ? (
                  <Lottie 
                    animationData={logoAnimationData} 
                    loop={true} 
                    style={{ 
                      width: window.innerWidth < 640 ? 200 : 300, 
                      height: window.innerWidth < 640 ? 200 : 300, 
                      margin: '0 auto 16px' 
                    }}
                  />
                ) : (
                  <div
                    className="w-8 sm:w-12 h-8 sm:h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"
                  />
                )}
                <p className="text-white text-sm sm:text-base">{t('profile.galleryLoading')}</p>
              </div>
            </div>
          ) : recentWork.length === 0 ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="text-center">
                <div className="w-16 sm:w-24 h-16 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Image
                    src="/recent-work.png"
                    alt="No work"
                    width={window.innerWidth < 640 ? 32 : 48}
                    height={window.innerWidth < 640 ? 32 : 48}
                    className="opacity-50"
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
                  {t('profile.nothingHere')}
                </h3>
                <p className="text-gray-500 text-sm sm:text-base">
                  {t('profile.startGenerating')}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
              {recentWork.map((item, index) => (
                <div
                  key={item.id}
                  className="group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer"
                  style={{
                    aspectRatio: '5/6',
                    background: 'rgba(255, 255, 255, 0.5)',
                    borderRadius: '16px',
                  }}
                  onClick={() => setExpandedImage(item.content_url)}
                >
                  <Image
                    src={item.content_url}
                    alt={`Generated content ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/recent-work.png'
                    }}
                  />
                  
                  {/* Overlay with info */}
                  <div
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-end p-2 sm:p-3 opacity-0 group-hover:opacity-100"
                  >
                    <div className="text-white text-xs">
                      <p className="font-semibold">Image {index + 1}</p>
                      <p className="opacity-80">
                        {new Date(item.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Image Modal */}
      <ExpandedImageModal
        imageUrl={expandedImage}
        onClose={() => setExpandedImage(null)}
        StableImage={StableImage}
      />
    </div>
  )
}