"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface ServiceCard {
  id: string
  title: string
  image: string
  subtitle?: string
  cardTitle?: string
  onClick: () => void
}

interface ServicesCarouselProps {
  isDarkMode?: boolean
  className?: string
}

export function ServicesCarousel({ isDarkMode = false, className = "" }: ServicesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const { language } = useLanguage()

  const services: ServiceCard[] = useMemo(() => [
    {
      id: "card1",
      title: "Service 1",
      image: language === 'ar' ? "/cards/card1-ar.png" : "/cards/card1.png",
      onClick: () => console.log("Card 1 clicked"),
    },
    {
      id: "card2",
      title: "Service 2",
      image: language === 'ar' ? "/cards/card2-ar.png" : "/cards/card2.png",
      cardTitle: language === 'ar' ? "خطة احترافية متكاملة لحملاتك الاعلانية للحصول على أفضل  النتائج" : "Professional Budgeting, & Targeting assuring best results",
      onClick: () => console.log("Card 2 clicked"),
    },
    {
      id: "card3",
      title: "Service 3",
      image: language === 'ar' ? "/cards/card3-ar.png" : "/cards/card3.png",
      onClick: () => console.log("Card 3 clicked"),
    },
    {
      id: "card4",
      title: "Service 4",
      image: language === 'ar' ? "/cards/card4-ar.png" : "/cards/card4.png",
      onClick: () => console.log("Card 4 clicked"),
    },
    {
      id: "card5",
      title: "Service 5",
      image: language === 'ar' ? "/cards/card5-ar.png" : "/cards/card5.png",
      cardTitle: language === 'ar' ? "فيديو مراجعة لمنتجك" : "Instant UGC!",
      subtitle: language === 'ar' ? "اشرح ميزات منتجك بفيديو .. فقط من صورة المنتج!" : "Create a preview video For your products",
      onClick: () => console.log("Card 5 clicked"),
    },
    {
      id: "card6",
      title: "Service 6",
      image: language === 'ar' ? "/cards/card6-ar.png" : "/cards/card6.png",
      onClick: () => console.log("Card 6 clicked"),
    },
    {
      id: "card7",
      title: "Service 7",
      image: language === 'ar' ? "/cards/card7-ar.png" : "/cards/card7.png",
      onClick: () => console.log("Card 7 clicked"),
    },
    {
      id: "card8",
      title: "Service 8",
      image: language === 'ar' ? "/cards/card8-ar.png" : "/cards/card8.png",
      onClick: () => console.log("Card 8 clicked"),
    },
    {
      id: "card9",
      title: "Service 9",
      image: language === 'ar' ? "/cards/card9-ar.png" : "/cards/card9.png",
      cardTitle: language === 'ar' ? "تخيل موقعك الإلكتروني" : "Imagine Your Website",
      subtitle: language === 'ar' ? "تصميم احترافي لموقعك مناسب لمشروعك" : "Professional website layout with just a chat",
      onClick: () => console.log("Card 9 clicked"),
    }
  ], [language])

  // Get visible cards based on screen size
  const getVisibleCards = () => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
    if (screenWidth < 640) return 1 // Mobile
    if (screenWidth < 768) return 2 // Tablet
    if (screenWidth < 1024) return 3 // Small Desktop
    return 4 // Large desktop
  }

  const [visibleCards, setVisibleCards] = useState(getVisibleCards())

  const goToPrevious = () => {
    setCurrentIndex((prev) => {
      if (prev === 0) {
        // Loop to the end
        return services.length - visibleCards
      }
      return prev - 1
    })
  }

  const goToNext = () => {
    setCurrentIndex((prev) => {
      if (prev >= services.length - visibleCards) {
        // Loop to the beginning
        return 0
      }
      return prev + 1
    })
  }

  useEffect(() => {
    const handleResize = () => {
      setVisibleCards(getVisibleCards())
      // Reset index if it's out of bounds after resize
      if (currentIndex > services.length - getVisibleCards()) {
        setCurrentIndex(0)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [currentIndex, services.length])

  return (
    <div className={`w-full max-w-7xl mx-auto px-4 py-4 ${className}`} style={{ border: '2px solid #D3E6FC1F', borderRadius: '50px', boxShadow: '0px 0px 12px 0px #4248ff49' }}>
      {/* Main Carousel Container with Navigation */}
      <div className="relative flex items-center ">
        
        {/* Left Arrow */}
        <button
          onClick={goToPrevious}
          className={`absolute left-0 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
            isDarkMode 
              ? ' text-white' 
              : 'text-gray-700'
          }`}
        >
          <ChevronLeft size={24} />
        </button>

        {/* Carousel Content */}
        <div 
          ref={carouselRef}
          className="overflow-hidden rounded-xl mx-14 w-full"
        >
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ 
              transform: `translateX(-${(currentIndex * 100) / visibleCards}%)`,
            }}
          >
            {services.map((service) => (
              <div
                key={service.id}
                className="flex-shrink-0 px-2"
                style={{ width: `${100 / visibleCards}%` }}
              >
                <div 
                  className="relative cursor-pointer rounded-xl flex flex-col items-center justify-start"

                  onClick={service.onClick}
                >
                  {/* Image Container with Text for card 2 */}
                  <div className="w-full h-full flex flex-col items-center justify-start p-2">
                    <img 
                      src={service.image} 
                      alt={service.title}
                      className="max-w-full max-h-full object-contain transition-transform duration-200 active:scale-95"
                      loading="lazy"
                    />
                    
                    {/* Text Content - For cards with title and subtitle */}
                    {service.cardTitle && (
                      <div className="w-full text-center">
                        <h3 className={`text-[12px] font-semibold mb-0 ${
                          isDarkMode ? 'text-white' : 'text-black'
                        }`}>
                          {service.cardTitle}
                        </h3>
                        {service.subtitle && (
                          <p className={`text-[10px] font-light ${
                            isDarkMode ? 'text-[#D3E6FC]' : 'text-black'
                          }`}>
                            {service.subtitle}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={goToNext}
          className={`absolute right-0 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
            isDarkMode 
              ? 'text-white' 
              : 'text-gray-700'
          }`}
        >
          <ChevronRight size={24} />
        </button>

      </div>
    </div>
  )
}