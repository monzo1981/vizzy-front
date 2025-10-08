"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, ChevronLeft, Settings, HelpCircle, Zap, MessageSquare, UserIcon, LogOut } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { logout, type User } from "@/lib/auth"
import { useLanguage } from "../../contexts/LanguageContext"

interface AvatarDropdownProps {
  currentUser: User | null
  isDarkMode?: boolean
  onUserUpdate?: (user: User) => void
  className?: string
}

export function AvatarDropdown({ currentUser, isDarkMode = false, onUserUpdate, className }: AvatarDropdownProps) {
  const router = useRouter()
  const { createLocalizedPath, t, isRTL, language } = useLanguage()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    sessionStorage.removeItem('ai_chat_session_id')
    logout()
    router.push('/')
  }

  // Choose correct chevron based on language direction
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div 
        className="cursor-pointer transition-transform hover:scale-105"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <Avatar 
          src={currentUser?.profile_picture_url || undefined}
          fallback={currentUser && currentUser.first_name && currentUser.last_name ? `${currentUser.first_name.charAt(0)}${currentUser.last_name.charAt(0)}`.toUpperCase() : 'U'} 
          alt="User" 
          size={isLargeScreen ? 60 : 48}
          className={isLargeScreen ? "w-[60px] h-[60px]" : "w-12 h-12"}
          showBorder={currentUser?.subscription_type_name !== 'Trial'} // Hide border for Trial users
        />
      </div>
      
      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div
          style={{ borderRadius: 16 }}
          className={`absolute right-0 top-full mt-2 w-64 shadow-xl border transform transition-all duration-200 ease-out z-50 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600' 
              : 'bg-white border-gray-200'
          } animate-in slide-in-from-top-2`}
        >
          {/* User Email - Clickable to Profile */}
          <button
            onClick={() => {
              router.push(createLocalizedPath('profile'));
              setIsDropdownOpen(false);
            }}
            className={`w-full px-3 py-2 text-left transition-colors duration-150 flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 border-b rounded-t-[16px] ${
              isDarkMode 
                ? 'hover:bg-gray-700 border-gray-600 text-gray-100' 
                : 'hover:bg-gray-50 border-gray-100 text-gray-800'
            }`}
          >
            <UserIcon size={16} className={isDarkMode ? 'text-blue-300 font-bold' : 'text-blue-600 font-bold'} />
            <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className={`text-base font-medium truncate ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                {currentUser?.email || 'user@example.com'}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t('dropdown.viewProfile')}
              </div>
            </div>
          </button>
          
          {/* Upgrade Plan */}
          <button onClick={() => { router.push(createLocalizedPath('pricing')); setIsDropdownOpen(false); }} className={`w-full px-3 py-2 text-left flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 transition-colors duration-150 ${
            isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
          }`}>
            <Zap size={16} className="text-yellow-600 font-bold" />
            <span className="text-base">{t('dropdown.upgradePlan')}</span>
          </button>
          
          {/* Settings */}
          <button className={`w-full px-3 py-2 text-left flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 transition-colors duration-150 ${
            isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
          }`}>
            <Settings size={16} className={isDarkMode ? 'text-gray-300 font-bold' : 'text-gray-700 font-bold'} />
            <span className="text-base">{t('dropdown.settings')}</span>
          </button>
          
          {/* Separator before Help */}
          <div className={`border-t my-1 ${isDarkMode ? 'border-gray-600' : 'border-gray-100'}`}></div>
          
          {/* Help */}
          {/* <button className={`w-full px-3 py-2 text-left flex items-center 'flex-row' ${isRTL ? 'justify-between' : 'gap-2'} transition-colors duration-150 ${
            isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
          }`}>
            {isRTL ? (
              <>
                <ChevronIcon size={14} className={isDarkMode ? 'text-gray-400 font-bold' : 'text-gray-600 font-bold'} />
                <div className="flex items-center gap-2">
                  <span className="text-base">{t('dropdown.help')}</span>
                  <HelpCircle size={16} className="text-blue-600 font-bold" />
                </div>
              </>
            ) : (
              <>
                <HelpCircle size={16} className="text-blue-600 font-bold" />
                <span className="text-base flex-1">{t('dropdown.help')}</span>
                <ChevronIcon size={14} className={isDarkMode ? 'text-gray-400 font-bold' : 'text-gray-600 font-bold'} />
              </>
            )}
          </button> */}
          
          {/* Log out */}
          <button
            onClick={() => {
              handleLogout();
              setIsDropdownOpen(false);
            }}
            className={`w-full px-3 py-2 text-left flex items-center ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-2 transition-colors duration-150 rounded-b-[16px] ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <LogOut size={16} className="text-red-600 font-bold" />
            <span className="text-base">{t('dropdown.logOut')}</span>
          </button>
        </div>
      )}
    </div>
  )
}