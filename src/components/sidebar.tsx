"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  isDarkMode?: boolean
  onDarkModeToggle?: () => void
  isMobile?: boolean
}

export function Sidebar({ onToggle, isDarkMode = false, onDarkModeToggle, isMobile = false }: SidebarProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(isMobile)
  const [isPinned, setIsPinned] = useState(isMobile)

  const handleToggle = () => {
    setIsPinned(!isPinned)
    setIsExpanded(!isPinned)
    onToggle()
  }

  const handleNewChat = () => {
    // Clear the session from localStorage
    sessionStorage.removeItem('ai_chat_session_id')
    
    // If already on chat page, reload to show initial state
    if (window.location.pathname === '/chat') {
      window.location.reload()
    } else {
      // Navigate to chat page (which will show the initial state)
      router.push('/chat')
    }
    
    // Close mobile sidebar if open
    if (isMobile) {
      onToggle()
    }
  }

  const recentChats = [
    "i need a new design for",
    "create a SM calendar for",
    "New ways to market my",
    "analysis my business's",
    "i need a new design for",
    "create a SM calendar for",
    "New ways to market my",
    "analysis my business's",
    "i need a new design for",
    "create a SM calendar for",
    "New ways to market my",
    "analysis my business's",
    "i need a new design for",
    "create a SM calendar for",
    "New ways to market my",
    "analysis my business's",
    "i need a new design for",
    "create a SM calendar for",
    "New ways to market my",
    "analysis my business's"
  ]

  return (
    <>
      {/* Overlay */}
      {isExpanded && !isMobile && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      {/* Mobile Overlay */}
      {isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full backdrop-blur-xl border-r z-50 transition-all duration-300 ease-in-out
        ${isMobile ? 'w-72' : (isExpanded ? 'w-72' : 'w-20')}
        ${isDarkMode 
          ? 'bg-[#0E0E10] border-white/20' 
          : 'bg-white/40 border-white/20'}
      `}
      onMouseEnter={() => !isPinned && !isMobile && setIsExpanded(true)}
      onMouseLeave={() => !isPinned && !isMobile && setIsExpanded(false)}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {(isExpanded || isMobile) ? (
            // Expanded Content
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-4 pt-10 pb-4">
                {/* Dark Mode Toggle Icon - Above Menu */}
                <div className="flex items-start mb-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDarkModeToggle?.();
                    }}
                    className={`p-2 transition-colors rounded-lg ${
                      isDarkMode 
                        ? 'hover:bg-white/10' 
                        : 'hover:bg-white/40'
                    }`}
                    aria-label="Toggle dark mode"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="10" cy="10" r="9" stroke={isDarkMode ? '#ffffff' : '#4B5563'} strokeWidth="2"/>
                      <path 
                        d="M10 1C14.9706 1 19 5.02944 19 10C19 14.9706 14.9706 19 10 19V1Z" 
                        fill={isDarkMode ? '#ffffff' : '#4B5563'}
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggle}
                      className={`p-2 transition-colors rounded-lg ${
                        isDarkMode 
                          ? 'hover:bg-white/10 text-white' 
                          : 'hover:bg-white/40 text-gray-700'
                      }`}
                      aria-label="Toggle menu"
                    >
                      <img 
                        src="/side-bar.svg" 
                        alt="Toggle Sidebar" 
                        className="w-6 h-6" 
                        style={{
                          filter: isDarkMode ? 'brightness(0) invert(1)' : 'none'
                        }}
                      />
                    </button>
                  </div>
                  
                  <button 
                    className={`p-2 transition-colors rounded-lg ${
                      isDarkMode 
                        ? 'hover:bg-white/10 text-white' 
                        : 'hover:bg-white/40 text-gray-700'
                    }`}
                    aria-label="Search"
                  >
                    <Search size={20} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col flex-1 px-4 overflow-hidden">
                {/* New Chat */}
                <button 
                  onClick={handleNewChat}
                  className={`flex items-center gap-3 px-3 py-2.5 transition-colors rounded-lg mb-4 ${
                    isDarkMode 
                      ? 'hover:bg-white/10 text-white' 
                      : 'hover:bg-white/40 text-gray-700'
                  }`}
                >
                  <img 
                    src="/edit.svg" 
                    alt="Edit" 
                    className="w-6 h-6" 
                    style={{
                      filter: isDarkMode ? 'brightness(0) invert(1)' : 'none'
                    }}
                  />
                  <span
                    className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-[#11002E]'}`}
                  >
                    New Chat
                  </span>
                </button>

                {/* Divider */}
                <div className={`h-px mb-4 ${isDarkMode ? 'bg-white/30' : 'bg-white/30'}`} />

                {/* Recent Section */}
                <div className="flex-1 overflow-hidden">
                  <h3 className={`text-sm font-medium mb-3 px-3 ${
                    isDarkMode ? 'text-white' : 'text-gray-700'
                  }`}>Recent</h3>
                  <div 
                    className="space-y-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-2"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.2) transparent' 
                        : 'rgba(0, 0, 0, 0.2) transparent'
                    }}
                  >
                    {recentChats.map((chat, index) => (
                      <button
                        key={index}
                        className={`w-full text-left px-3 py-2 transition-colors rounded-lg group ${
                          isDarkMode 
                            ? 'hover:bg-white/10' 
                            : 'hover:bg-white/40'
                        }`}
                      >
                        <span className={`text-sm truncate block ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {chat}
                          <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>...</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Collapsed Content
            <div className="flex flex-col items-center h-full pt-10 pb-4 px-2">
              {/* Dark Mode Toggle - Icon Only */}
              <button
                onClick={onDarkModeToggle}
                className={`p-2 transition-colors rounded-lg mb-4 ${
                  isDarkMode 
                    ? 'hover:bg-white/10' 
                    : 'hover:bg-white/40'
                }`}
                aria-label="Toggle dark mode"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="9" stroke={isDarkMode ? '#ffffff' : '#4B5563'} strokeWidth="2"/>
                  <path 
                    d="M10 1C14.9706 1 19 5.02944 19 10C19 14.9706 14.9706 19 10 19V1Z" 
                    fill={isDarkMode ? '#ffffff' : '#4B5563'}
                  />
                </svg>
              </button>

              {/* Menu Icon */}
              <button
                onClick={handleToggle}
                className={`p-2 transition-colors rounded-lg mb-4 ${
                  isDarkMode 
                    ? 'hover:bg-white/10 text-white' 
                    : 'hover:bg-white/40 text-gray-700'
                }`}
                aria-label="Toggle menu"
              >
                <img 
                  src="/side-bar.svg" 
                  alt="Toggle Sidebar" 
                  className="w-6 h-6" 
                  style={{
                    filter: isDarkMode ? 'brightness(0) invert(1)' : 'none'
                  }}
                />
              </button>

              {/* New Chat Icon */}
              <button 
                onClick={handleNewChat}
                className={`p-2 transition-colors rounded-lg mb-4 ${
                  isDarkMode 
                    ? 'hover:bg-white/10 text-white' 
                    : 'hover:bg-white/40 text-gray-700'
                }`}
                aria-label="New chat"
              >
                <img 
                  src="/edit.svg" 
                  alt="Edit" 
                  className="w-6 h-6" 
                  style={{
                    filter: isDarkMode ? 'brightness(0) invert(1)' : 'none'
                  }}
                />
              </button>

              {/* Spacer */}
              <div className="flex-1" />
            </div>
          )}
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
