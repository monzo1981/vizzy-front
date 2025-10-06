"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// CSS for custom scrollbar
const customScrollbarStyles = `
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-gutter: stable;
    background: transparent !important;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    background: transparent !important;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent !important;
    background-color: transparent !important;
    box-shadow: none !important;
    border: none !important;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(107, 114, 128, 0.3);
    background-clip: padding-box;
    border-radius: 3px;
    border: none;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(107, 114, 128, 0.5);
  }
  
  .custom-scrollbar::-webkit-scrollbar-corner {
    background: transparent !important;
  }
  
  /* Firefox */
  .custom-scrollbar {
    scrollbar-color: rgba(107, 114, 128, 0.3) transparent;
  }
  
  /* Dark mode */
  .dark .custom-scrollbar::-webkit-scrollbar {
    background: transparent !important;
  }
  
  .dark .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent !important;
    background-color: transparent !important;
  }
  
  .dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(107, 114, 128, 0.3);
  }
  
  .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(107, 114, 128, 0.5);
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

export function Sidebar({ 
  isOpen,
  onToggle,
  isDarkMode = false, 
  onDarkModeToggle, 
  isMobile = false, 
  onNewChatCreated 
}: SidebarProps) {
  const router = useRouter();
  const { language, changeLanguage, isHydrated, createLocalizedPath } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(isMobile ? true : isOpen);
  const [isPinned, setIsPinned] = useState(isMobile);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sync expanded state with external isOpen prop
  useEffect(() => {
    if (!isMobile) {
      setIsExpanded(isOpen);
    }
  }, [isOpen, isMobile]);

  // Set mounted state after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Inject custom scrollbar styles
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleElement = document.createElement('style');
      styleElement.textContent = customScrollbarStyles;
      document.head.appendChild(styleElement);
      
      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, []);

  // Fetch chat history
  useEffect(() => {
    fetchChatHistory();
  }, []);

  const fetchChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.log('No auth token found for chat history');
        return;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
      
      const response = await fetch(`${API_BASE_URL}/ai-chat-session/history/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch chat history:', response.status);
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        setChatHistory(data.data);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleChatSelect = (sessionId: string) => {
    sessionStorage.setItem('ai_chat_session_id', sessionId);
    
    if (window.location.pathname === '/chat' || window.location.pathname === '/ar/chat') {
      window.location.reload();
    } else {
      router.push(createLocalizedPath('chat'));
    }
    
    if (isMobile) {
      onToggle();
    }
  };

  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text || text.trim() === '') return 'New Chat';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const handleNewChat = () => {
    sessionStorage.removeItem('ai_chat_session_id');
    
    if (window.location.pathname === '/chat' || window.location.pathname === '/ar/chat') {
      window.location.reload();
    } else {
      router.push(createLocalizedPath('chat'));
    }
    
    if (isMobile) {
      onToggle();
    }
  };

  const handleTogglePin = () => {
    if (isMobile) {
      onToggle();
    } else {
      setIsPinned(!isPinned);
      if (isPinned) {
        setIsExpanded(false);
      }
    }
  };

  // Refresh function for external use
  const refreshChatHistory = useCallback(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    if (onNewChatCreated) {
      const globalWindow = window as unknown as { refreshSidebarHistory?: () => void };
      globalWindow.refreshSidebarHistory = refreshChatHistory;
    }
  }, [onNewChatCreated, refreshChatHistory]);

  const showExpanded = isExpanded || isMobile;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && (
        <div 
          className="fixed inset-0 bg-black/10 z-40 transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      {/* Main Sidebar */}
      <motion.div
        className={cn(
          "fixed left-0 top-0 h-full z-50 overflow-hidden",
          "backdrop-blur-xl transition-all duration-300",
          mounted && isDarkMode ? "bg-[#0E0E10]/95" : "bg-white/40",
        )}
        animate={{
          width: showExpanded ? 280 : 60,
        }}
        transition={{
          duration: 0.3,
          ease: [0.23, 1, 0.32, 1],
        }}
        onMouseEnter={() => !isPinned && !isMobile && setIsExpanded(true)}
        onMouseLeave={() => !isPinned && !isMobile && setIsExpanded(false)}
      >
        <div className="flex flex-col h-full px-4 py-6">
          
          {/* Header Section */}
          <div className="flex flex-col gap-3 mb-6">

            {/* Language Toggle */}
            <div className="flex items-center">
              <button
                onClick={() => changeLanguage(language === 'en' ? 'ar' : 'en')}
                className={cn(
                  "p-2 rounded-lg transition-colors duration-200 flex items-center gap-2",
                  mounted && isDarkMode ? "hover:bg-white/10" : "hover:bg-[#7FCAFE1A]",
                  showExpanded ? "w-full justify-start" : "mx-auto"
                )}
              >
                <span 
                  className={cn(
                    "text-sm font-bold flex-shrink-0",
                    mounted && isDarkMode ? "text-white" : "text-gray-700"
                  )}
                  style={{ 
                    minWidth: '24px',
                    textAlign: 'center',
                    display: 'inline-block'
                  }}
                  suppressHydrationWarning
                >
                  {!isHydrated ? 'ع' : (language === 'en' ? 'ع' : 'EN')}
                </span>
                <AnimatePresence>
                  {showExpanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ 
                        duration: 0.2,
                        delay: showExpanded ? 0.2 : 0
                      }}
                      className={cn(
                        "text-sm overflow-hidden whitespace-nowrap",
                        mounted && isDarkMode ? "text-gray-300" : "text-gray-600"
                      )}
                    >
                      Language
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <div className="flex items-center">
              <button
                onClick={onDarkModeToggle}
                className={cn(
                  "p-2 rounded-lg transition-colors duration-200 flex items-center gap-2",
                  mounted && isDarkMode ? "hover:bg-white/10" : "hover:bg-[#7FCAFE1A]",
                  showExpanded ? "w-full justify-start" : "mx-auto"
                )}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 20 20" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="flex-shrink-0"
                  style={{ 
                    minWidth: '24px',
                    minHeight: '24px',
                    width: '24px',
                    height: '24px'
                  }}
                >
                  <circle cx="10" cy="10" r="9" stroke={mounted && isDarkMode ? '#ffffff' : '#4B5563'} strokeWidth="2"/>
                  <path 
                    d="M10 1C14.9706 1 19 5.02944 19 10C19 14.9706 14.9706 19 10 19V1Z" 
                    fill={mounted && isDarkMode ? '#ffffff' : '#4B5563'}
                  />
                </svg>
                <AnimatePresence>
                  {showExpanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ 
                        duration: 0.2,
                        delay: showExpanded ? 0.2 : 0
                      }}
                      className={cn(
                        "text-sm overflow-hidden whitespace-nowrap",
                        mounted && isDarkMode ? "text-gray-300" : "text-gray-600"
                      )}
                    >
                      Dark Mode
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
            
            {/* Toggle Button */}
            <div className="flex items-center">
              <button
                onClick={handleTogglePin}
                className={cn(
                  "p-2 rounded-lg transition-colors duration-200 flex items-center gap-2",
                  // mounted && isDarkMode ? "hover:bg-white/10" : "hover:bg-[#7FCAFE1A]",
                  showExpanded ? "w-full justify-start" : "mx-auto"
                )}
              >
                <img 
                  src="/side-bar.svg" 
                  alt="Toggle" 
                  className="flex-shrink-0"
                  style={{ 
                    filter: mounted && isDarkMode ? 'brightness(0) invert(1)' : 'none',
                    minWidth: '24px',
                    minHeight: '24px',
                    width: '24px',
                    height: '24px'
                  }}
                />
                <AnimatePresence>
                  {showExpanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 0, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ 
                        duration: 0.2,
                        delay: showExpanded ? 0.2 : 0
                      }}
                      className={cn(
                        "text-sm overflow-hidden whitespace-nowrap",
                        mounted && isDarkMode ? "text-gray-300" : "text-gray-600"
                      )}
                    >
                      {isPinned ? 'Unpin' : 'Pin sidebar'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>

            {/* New Chat Button */}
            <div className="flex items-center">
              <button
                onClick={handleNewChat}
                className={cn(
                  "p-2 rounded-lg transition-colors duration-200 flex items-center gap-2",
                  mounted && isDarkMode ? "hover:bg-white/10" : "hover:bg-[#7FCAFE1A]",
                  showExpanded ? "w-full justify-start" : "mx-auto"
                )}
              >
                <img 
                  src="/edit.svg" 
                  alt="New Chat" 
                  className="flex-shrink-0" 
                  style={{ 
                    filter: mounted && isDarkMode ? 'brightness(0) invert(1)' : 'none',
                    minWidth: '24px',
                    minHeight: '24px',
                    width: '24px',
                    height: '24px'
                  }}
                />
                <AnimatePresence>
                  {showExpanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ 
                        duration: 0.2,
                        delay: showExpanded ? 0.2 : 0
                      }}
                      className={cn(
                        "text-sm font-medium overflow-hidden whitespace-nowrap",
                        mounted && isDarkMode ? "text-white" : "text-gray-700"
                      )}
                    >
                      New Chat
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>

          {/* Divider */}
          <AnimatePresence>
            {showExpanded && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0, scaleX: 0 }}
                transition={{ 
                  duration: 0.2,
                  delay: showExpanded ? 0.2 : 0
                }}
                className={cn(
                  "h-px mb-4 origin-left",
                  mounted && isDarkMode ? "bg-white/20" : "bg-gray-200"
                )}
              />
            )}
          </AnimatePresence>

          {/* Recent Chats Section */}
          <div className="flex-1 overflow-hidden" style={{ background: 'transparent' }}>
            <AnimatePresence>
              {showExpanded && (
                <>
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ 
                      duration: 0.2,
                      delay: 0.25
                    }}
                    className={cn(
                      "text-sm font-medium px-2 mb-3",
                      mounted && isDarkMode ? "text-white" : "text-gray-700"
                    )}
                  >
                    Recent
                  </motion.h3>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ 
                      duration: 0.3,
                      delay: 0.3
                    }}
                    className="space-y-1 overflow-y-auto custom-scrollbar"
                    style={{ 
                      maxHeight: 'calc(100vh - 320px)',
                      background: 'transparent',
                      backgroundColor: 'transparent'
                    }}
                  >
                    {isLoadingHistory ? (
                      <div className="flex justify-center items-center py-4">
                        <div className={cn(
                          "animate-spin rounded-full h-6 w-6 border-b-2",
                          mounted && isDarkMode ? "border-white" : "border-gray-700"
                        )} />
                      </div>
                    ) : chatHistory.length > 0 ? (
                      chatHistory.map((session, index) => (
                        <motion.button
                          key={session.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ 
                            delay: 0.3 + (index * 0.03),
                            duration: 0.2
                          }}
                          onClick={() => handleChatSelect(session.id)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-lg transition-colors",
                            mounted && isDarkMode 
                              ? "hover:bg-white/10 text-gray-300 hover:text-white" 
                              : "hover:bg-[#7FCAFE1A] text-gray-600 hover:text-gray-900"
                          )}
                        >
                          <span className="text-sm truncate block">
                            {truncateText(session.initial_client_request)}
                          </span>
                        </motion.button>
                      ))
                    ) : (
                      <div className={cn(
                        "text-center py-4",
                        mounted && isDarkMode ? "text-gray-400" : "text-gray-500"
                      )}>
                        <span className="text-sm">No chat history yet</span>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// Export the hook for compatibility with existing code
export function useSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);
  const open = () => setIsOpen(true);

  return {
    isOpen,
    toggle,
    close,
    open
  };
}