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
            ? 'bg-[#0E0E10]' 
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
                  ? 'opacity-100 max-h-[calc(100vh-280px)]' 
                  : 'opacity-0 max-h-0'
              }`}>
                <div 
                  className="space-y-1 overflow-y-auto pr-2 h-full"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: isDarkMode 
                      ? 'rgba(255, 255, 255, 0.2) transparent' 
                      : 'rgba(0, 0, 0, 0.2) transparent'
                  }}
                >
                  {recentChats.map((chat, index) => (
                    <div
                      key={index}
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
                          {chat}
                          <span className={`transition-colors duration-300 ease-out ${
                            isDarkMode ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-gray-500'
                          }`}>...</span>
                        </span>
                      </button>
                    </div>
                  ))}
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