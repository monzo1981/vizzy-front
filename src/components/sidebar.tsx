"use client"

import { useState, useEffect, useCallback } from "react"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLanguage } from '../contexts/LanguageContext'

// CSS for custom scrollbar
const customScrollbarStyles = `
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-gutter: stable;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 4px;
    margin: 4px 0;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.4);
    border-radius: 4px;
    transition: all 0.2s ease;
    border: 1px solid transparent;
    background-clip: padding-box;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.6);
    transform: scaleX(1.2);
  }
  
  .dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.35);
  }
`;

interface ChatSession {
  id: string
  initial_client_request: string
  session_start: string
  status: string
}

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  isDarkMode?: boolean
  onDarkModeToggle?: () => void
  isMobile?: boolean
  onNewChatCreated?: () => void
}

export function Sidebar({ onToggle, isDarkMode = false, onDarkModeToggle, isMobile = false, onNewChatCreated }: SidebarProps) {
  const router = useRouter()
  const { language, changeLanguage, isHydrated } = useLanguage()
  const [isExpanded, setIsExpanded] = useState(isMobile)
  const [isPinned, setIsPinned] = useState(isMobile)
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Fetch chat history when component mounts
  useEffect(() => {
    fetchChatHistory()
    
    // Add custom scrollbar styles
    if (typeof document !== 'undefined') {
      const styleElement = document.createElement('style')
      styleElement.textContent = customScrollbarStyles
      document.head.appendChild(styleElement)
      
      return () => {
        document.head.removeChild(styleElement)
      }
    }
  }, [])

  const fetchChatHistory = async () => {
    try {
      setIsLoadingHistory(true)
      const token = localStorage.getItem('access_token')
      
      if (!token) {
        console.log('No auth token found for chat history')
        return
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'
      
      const response = await fetch(`${API_BASE_URL}/ai-chat-session/history/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('Failed to fetch chat history:', response.status)
        return
      }

      const data = await response.json()
      if (data.success && data.data) {
        setChatHistory(data.data)
      }
    } catch (error) {
      console.error('Error fetching chat history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleChatSelect = (sessionId: string) => {
    // Save session to session storage
    sessionStorage.setItem('ai_chat_session_id', sessionId)
    
    // Navigate or reload based on current page
    if (window.location.pathname === '/chat') {
      window.location.reload()
    } else {
      router.push('/chat')
    }
    
    // Close sidebar on mobile
    if (isMobile) {
      onToggle()
    }
  }

  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text || text.trim() === '') return 'New Chat'
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const handleToggle = () => {
    setIsPinned(!isPinned)
    setIsExpanded(!isPinned)
    onToggle()
  }

  // Expose refresh function for external use
  const refreshChatHistory = useCallback(() => {
    fetchChatHistory()
  }, [])

  // Make refresh function available through callback
  useEffect(() => {
    if (onNewChatCreated) {
      // Store refresh function reference for external access
      const globalWindow = window as unknown as { refreshSidebarHistory?: () => void }
      globalWindow.refreshSidebarHistory = refreshChatHistory
    }
  }, [onNewChatCreated, refreshChatHistory])

  const handleNewChat = () => {
    sessionStorage.removeItem('ai_chat_session_id')
    
    if (window.location.pathname === '/chat') {
      window.location.reload()
    } else {
      router.push('/chat')
    }
    
    if (isMobile) {
      onToggle()
    }
  }

  // Determine if sidebar should show expanded content
  const showExpanded = isExpanded || isMobile

  return (
    <>
      {/* Overlays */}
      {isExpanded && !isMobile && (
        <div 
          className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
            isExpanded ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      {isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`
          fixed left-0 top-0 h-full backdrop-blur-xl z-50 
          transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isMobile ? 'w-72' : (showExpanded ? 'w-72' : 'w-20')}
          ${isDarkMode 
            ? 'bg-[#0E0E10] dark' 
            : 'bg-white/40'}
        `}
        onMouseEnter={() => !isPinned && !isMobile && setIsExpanded(true)}
        onMouseLeave={() => !isPinned && !isMobile && setIsExpanded(false)}
      >
        <div className="flex flex-col h-full overflow-hidden">
          
          {/* Header */}
          <div className="px-4 pt-10 pb-4">
            
            {/* Dark Mode Toggle */}
            <div className={`flex items-start mb-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              showExpanded ? 'justify-start' : 'justify-center'
            }`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDarkModeToggle?.();
                }}
                className={`p-2 transition-all duration-300 ease-out rounded-lg group ${
                  isDarkMode 
                    ? 'hover:bg-white/10' 
                    : 'hover:bg-white/40'
                }`}
                aria-label="Toggle dark mode"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 20 20" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="transition-transform duration-300 ease-out group-hover:scale-110"
                >
                  <circle cx="10" cy="10" r="9" stroke={isDarkMode ? '#ffffff' : '#4B5563'} strokeWidth="2"/>
                  <path 
                    d="M10 1C14.9706 1 19 5.02944 19 10C19 14.9706 14.9706 19 10 19V1Z" 
                    fill={isDarkMode ? '#ffffff' : '#4B5563'}
                  />
                </svg>
              </button>
            </div>

            {/* Language Toggle */}
            <div className={`flex items-start mb-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              showExpanded ? 'justify-start' : 'justify-center'
            }`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  changeLanguage(language === 'en' ? 'ar' : 'en');
                }}
                className={`p-2 transition-all duration-300 ease-out rounded-lg group ${
                  isDarkMode 
                    ? 'hover:bg-white/10' 
                    : 'hover:bg-white/40'
                } flex items-center gap-2`}
                aria-label="Toggle language"
              >
                <span 
                  className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-[#11002E]'}`} 
                  style={{ fontFamily: "'Noto Sans Arabic', var(--font-inter), Inter, sans-serif" }}
                  data-font-applied="arabic"
                >
                  {!isHydrated ? 'عربي' : (language === 'en' ? 'عربي' : 'English')}
                </span>
              </button>
            </div>

            {/* Sidebar Toggle and Search Row */}
            <div className={`flex items-center mb-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              showExpanded ? 'justify-between' : 'justify-center'
            }`}>
              {/* Sidebar Toggle */}
              <button
                onClick={handleToggle}
                className={`p-2 transition-all duration-300 ease-out rounded-lg group ${
                  isDarkMode 
                    ? 'hover:bg-white/10 text-white' 
                    : 'hover:bg-white/40 text-gray-700'
                }`}
                aria-label="Toggle menu"
              >
                <img 
                  src="/side-bar.svg" 
                  alt="Toggle Sidebar" 
                  className="w-6 h-6 transition-transform duration-300 ease-out group-hover:scale-110" 
                  style={{
                    filter: isDarkMode ? 'brightness(0) invert(1)' : 'none'
                  }}
                />
              </button>

              {/* Search Button - with better animation */}
              <div className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
                showExpanded 
                  ? 'opacity-100 scale-100 w-auto' 
                  : 'opacity-0 scale-75 w-0'
              }`}>
                <button 
                  className={`p-2 transition-all duration-300 ease-out rounded-lg group
                    ${isDarkMode 
                      ? 'hover:bg-white/10 text-white' 
                      : 'hover:bg-white/40 text-gray-700'
                    }`}
                  aria-label="Search"
                >
                  <Search size={20} className="transition-transform duration-300 ease-out group-hover:scale-110" />
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex flex-col flex-1 px-4 overflow-hidden">
            
            {/* New Chat Button */}
            <div className={`mb-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              showExpanded ? 'px-0' : 'px-0 flex justify-center'
            }`}>
              <button 
                onClick={handleNewChat}
                className={`flex items-center gap-3 px-3 py-2.5 transition-all duration-300 ease-out rounded-lg group
                  ${showExpanded ? 'w-full' : 'w-auto'}
                  ${isDarkMode 
                    ? 'hover:bg-white/10 text-white' 
                    : 'hover:bg-white/40 text-gray-700'
                  }`}
              >
                <img 
                  src="/edit.svg" 
                  alt="Edit" 
                  className="w-6 h-6 transition-transform duration-300 ease-out group-hover:scale-110 flex-shrink-0" 
                  style={{
                    filter: isDarkMode ? 'brightness(0) invert(1)' : 'none'
                  }}
                />
                <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  showExpanded 
                    ? 'opacity-100 max-w-[200px] ml-0' 
                    : 'opacity-0 max-w-0 -ml-3'
                }`}>
                  <span className={`text-sm font-medium whitespace-nowrap block
                    ${isDarkMode ? 'text-white' : 'text-[#11002E]'}
                  `}>
                    New Chat
                  </span>
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              showExpanded ? 'opacity-100 max-h-4 mb-4' : 'opacity-0 max-h-0 mb-0'
            }`}>
              <div className={`h-px ${isDarkMode ? 'bg-white/30' : 'bg-white/30'}`} />
            </div>

            {/* Recent Section */}
            <div className="flex-1 overflow-hidden">
              
              {/* Recent Header */}
              <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                showExpanded 
                  ? 'opacity-100 max-h-8 mb-3' 
                  : 'opacity-0 max-h-0 mb-0'
              }`}>
                <h3 className={`text-sm font-medium px-3
                  ${isDarkMode ? 'text-white' : 'text-gray-700'}
                `}>
                  Recent
                </h3>
              </div>
              
              {/* Recent Chat List */}
              <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                showExpanded 
                  ? 'opacity-100 max-h-[calc(100vh-300px)]' 
                  : 'opacity-0 max-h-0'
              }`}>
                <div 
                  className="space-y-1 overflow-y-auto pr-1 custom-scrollbar"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: isDarkMode 
                      ? 'rgba(255, 255, 255, 0.3) transparent' 
                      : 'rgba(0, 0, 0, 0.3) transparent',
                    maxHeight: 'calc(100vh - 300px)',
                    minHeight: '200px'
                  }}
                >
                  {isLoadingHistory ? (
                    <div className="flex justify-center items-center py-4">
                      <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${
                        isDarkMode ? 'border-white' : 'border-gray-700'
                      }`}></div>
                    </div>
                  ) : chatHistory.length > 0 ? (
                    chatHistory.map((session, index) => (
                      <div
                        key={session.id}
                        className={`transition-all duration-300 ease-out ${
                          showExpanded 
                            ? 'opacity-100 translate-x-0' 
                            : 'opacity-0 -translate-x-4'
                        }`}
                        style={{
                          transitionDelay: showExpanded ? `${index * 30}ms` : '0ms'
                        }}
                      >
                        <button
                          onClick={() => handleChatSelect(session.id)}
                          className={`w-full text-left px-3 py-2 transition-all duration-300 ease-out rounded-lg group
                            hover:translate-x-1
                            ${isDarkMode 
                              ? 'hover:bg-white/10' 
                              : 'hover:bg-white/40'
                            }`}
                        >
                          <span className={`text-sm truncate block transition-colors duration-300 ease-out ${
                            isDarkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-800'
                          }`}>
                            {truncateText(session.initial_client_request)}
                          </span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className={`text-center py-4 px-3 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <span className="text-sm">No chat history yet</span>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function useSidebar() {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => setIsOpen(!isOpen)
  const close = () => setIsOpen(false)
  const open = () => setIsOpen(true)

  return {
    isOpen,
    toggle,
    close,
    open
  }
}