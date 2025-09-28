"use client"

export const dynamic = 'force-dynamic' 

import { useState, useRef, useEffect, memo, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { AvatarDropdown } from "@/components/ui/avatar-dropdown"
import { GradientBackground } from "../../components/gradient-background"
import { Sidebar, useSidebar } from "../../components/sidebar"
import Image from "next/image"
import { isAuthenticated, getUser, type User } from "@/lib/auth"
import { N8NWebhook } from "@/lib/n8n-webhook"
import { useLanguage } from "../../contexts/LanguageContext"
import { useTheme } from "../../contexts/ThemeContext"
import { ResponseNormalizer } from "@/lib/response-normalizer"
import { useNotificationSound } from "@/lib/useNotificationSound"
import { supabase, type ChatMessage, type ChatMessageDB } from "@/lib/supabase-client"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { useToast, ToastContainer } from "@/components/ui/toast"
import {
  createAIChatSession as createSession,
  pollForFirstMessage as pollMessage,
  messagesToChatHistory as convertMessages
} from "@/lib/chat/sessionHelpers"
import ChatInput from '@/components/chat/ChatInput'
import type { ChatInputHandle } from '@/components/chat/ChatInput'
import TutorialCard from '@/components/chat/TutorialCard'
import MessagesContainer from '@/components/chat/MessagesContainer'
import { CompanyInfoModal } from '@/components/CompanyInfoModal'
import { ServicesCarousel } from '@/components/chat/ServicesCarousel'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

// StableImage component for handling image proxies
const StableImage = memo(({ 
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

function ChatContent() {
  const { toasts, toast, removeToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isOpen, toggle } = useSidebar()
  const { t, createLocalizedPath } = useLanguage()
  const { isDarkMode, toggleDarkMode } = useTheme()
  
  // State Management
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(1)
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showCompanyInfoModal, setShowCompanyInfoModal] = useState(false)
  const [companyProfileChecked, setCompanyProfileChecked] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Refs
  const processedMessageIds = useRef<Set<string>>(new Set())
  const lastProcessedCount = useRef<number>(0)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const chatInputRef = useRef<ChatInputHandle>(null)
  const n8nWebhook = useRef<N8NWebhook | null>(null)
  const { playSound } = useNotificationSound("/vizzy-message.mp3")

  // Auto-typing feature
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!chatInputRef.current) return
      if (chatInputRef.current.isInputFocused()) return
      if (isMobileSidebarOpen) return
      
      const activeElement = document.activeElement
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true'
      )) return
      
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key.length !== 1) return
      if (e.key === 'Tab' || e.key === 'Escape') return
      
      e.preventDefault()
      chatInputRef.current.focusAndInsertText(e.key)
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMobileSidebarOpen])

  // Wrapper for createAIChatSession
  const createAIChatSession = async (initialMessage?: string): Promise<string | undefined> => {
    const token = localStorage.getItem('access_token')
    if (!token || !API_BASE_URL) {
      console.error('No auth token or API URL found')
      return undefined
    }

    return await createSession(
      initialMessage,
      { apiBaseUrl: API_BASE_URL, token },
      { setIsCreatingSession, setSessionId }
    )
  }

  // Wrapper for pollForFirstMessage
  const pollForFirstMessage = useCallback(async (sessionId: string, userMessageId: string) => {
    await pollMessage(
      sessionId,
      userMessageId,
      { setMessages, setIsLoading },
      { processedMessageIds, lastProcessedCount }
    )
  }, [])

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      const urlSessionId = searchParams.get('id')
      if (urlSessionId) {
        setSessionId(urlSessionId)
        sessionStorage.setItem('ai_chat_session_id', urlSessionId)
        return
      }
      
      const storedSessionId = sessionStorage.getItem('ai_chat_session_id')
      if (storedSessionId) {
        setSessionId(storedSessionId)
      }
    }
    
    if (currentUser) {
      checkExistingSession()
    }
  }, [currentUser, searchParams])

  // Check if user has seen tutorial
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenChatTutorial')
    if (!hasSeenTutorial && messages.length === 0) {
      setShowTutorial(true)
    }
  }, [messages.length])

  // Tutorial functions
  const nextTutorialStep = () => {
    if (tutorialStep < 3) {
      setTutorialStep(tutorialStep + 1)
    } else {
      completeTutorial()
    }
  }

  const skipTutorial = () => {
    completeTutorial()
  }

  const completeTutorial = () => {
    setShowTutorial(false)
    localStorage.setItem('hasSeenChatTutorial', 'true')
  }

  // Function to check company profile
  const checkCompanyProfile = async () => {
    if (companyProfileChecked) return

    try {
      const webhook = new N8NWebhook()
      let profile = webhook.getCompanyProfile()
      
      if (!profile) {
        // If not cached, fetch from API
        await webhook.refreshCompanyProfile()
        profile = webhook.getCompanyProfile()
      }
      
      // Check if BOTH company_name AND industry are missing
      const needsCompanyInfo = !profile?.company_name && !profile?.industry
      
      if (needsCompanyInfo && !showCompanyInfoModal) {
        // Small delay to let the page load smoothly before showing modal
        setTimeout(() => {
          setShowCompanyInfoModal(true)
        }, 1000)
      }
      
      setCompanyProfileChecked(true)
    } catch (error) {
      console.error('Error checking company profile:', error)
      setCompanyProfileChecked(true)
    }
  }

  // Initialize auth and N8N
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/')
      return
    }

    const user = getUser()
    setCurrentUser(user)
    
    if (!n8nWebhook.current) {
      n8nWebhook.current = new N8NWebhook(
        process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL!,
        user?.id,
        user?.email
      )
    }

    // Check company profile and show modal if needed
    checkCompanyProfile()
  }, [router])

  // Set mounted state after component mounts
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize session and load existing messages
  useEffect(() => {
    if (!sessionId) return
    
    const loadExistingMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('core_aichatsession')
          .select('chat_messages')
          .eq('id', sessionId)
          .single()
        
        if (error) {
          console.error('Error fetching session:', error)
          lastProcessedCount.current = 0
          return
        }
        
        const existingMessages = data?.chat_messages || []
        processedMessageIds.current.clear()
        
        if (existingMessages.length > 0) {
          const uiMessages: ChatMessage[] = existingMessages.map((msg: ChatMessageDB, index: number) => {
            const messageId = `${sessionId}-${index}-${msg.timestamp}`
            processedMessageIds.current.add(messageId)
            
            const normalizer = new ResponseNormalizer(msg.content)
            const { text, mediaUrl } = normalizer.normalize()
            
            let finalVisual = msg.visual
            if (msg.role === 'user' && msg.image_url) {
              finalVisual = msg.image_url
            } else if (mediaUrl) {
              finalVisual = mediaUrl
            }
            
            let finalContent = text || msg.content
            if (msg.role === 'user' && (!finalContent || finalContent.trim() === '') && finalVisual) {
              finalContent = 'Sent an image'
            }
            
            return {
              id: `existing-${index}-${Date.now()}`,
              content: finalContent,
              sender: msg.role === 'user' ? 'user' : 'assistant',
              timestamp: new Date(msg.timestamp),
              visual: finalVisual,
              serviceType: msg.service_type,
              isProcessing: false,
              isVoice: false
            }
          })
          
          setMessages(uiMessages)
        }
        
        lastProcessedCount.current = existingMessages.length
      } catch (error) {
        console.error('Error initializing session:', error)
        lastProcessedCount.current = 0
      }
    }
    
    loadExistingMessages()
  }, [sessionId])

  // Supabase Realtime subscription
  useEffect(() => {
    if (!sessionId) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    
    const channel = supabase
      .channel(`chat-session-${sessionId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'core_aichatsession',
          filter: `id=eq.${sessionId}`,
        },
        (payload: RealtimePostgresChangesPayload<ChatMessageDB>) => {
          if (!payload || !payload.new) {
            console.error('Invalid payload structure')
            return
          }
          
          const record = payload.new as { chat_messages?: ChatMessageDB[] }
          if (!record.chat_messages) {
            console.error('chat_messages not found in payload')
            return
          }
          
          const allMessages = record.chat_messages
          
          if (allMessages.length > lastProcessedCount.current) {
            const newMessages = allMessages.slice(lastProcessedCount.current)
            
            const assistantMessages = newMessages.filter((msg: ChatMessageDB, localIndex: number) => {
              const globalIndex = lastProcessedCount.current + localIndex
              const messageId = `${sessionId}-${globalIndex}-${msg.timestamp}`
              
              if (processedMessageIds.current.has(messageId)) {
                return false
              }
              
              return msg.role === 'assistant'
            })
            
            if (assistantMessages.length > 0) {
              const normalizedMessages: ChatMessage[] = assistantMessages.map((msg: ChatMessageDB, localIndex: number) => {
                const messagePosition = allMessages.indexOf(msg)
                const messageId = `${sessionId}-${messagePosition}-${msg.timestamp}`
                processedMessageIds.current.add(messageId)
                
                const normalizer = new ResponseNormalizer(msg.content)
                const { text, mediaUrl } = normalizer.normalize()
                
                return {
                  id: `rt-${Date.now()}-${localIndex}`,
                  content: text || msg.content,
                  sender: 'assistant' as const,
                  timestamp: new Date(msg.timestamp),
                  visual: mediaUrl || msg.visual,
                  serviceType: msg.service_type,
                  isProcessing: false,
                  isVoice: false
                }
              })
              
              setMessages(prev => [...prev, ...normalizedMessages])
              playSound()
              setIsLoading(false)
            }
            
            lastProcessedCount.current = allMessages.length
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setIsSubscribed(false)
        }
      })
    
    channelRef.current = channel
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setIsSubscribed(false)
    }
  }, [sessionId, playSound])

// في page.tsx - تحديث handleSend function

const handleSend = async (messageToSend: string, imageToSend?: string | null) => {
  if (isLoading || isCreatingSession) return
  if (!messageToSend && !imageToSend) return
  if (!n8nWebhook.current) return

  let currentSessionId = sessionId
  const isFirstMessage = !currentSessionId
  
  // Check if this is user's VERY FIRST message ever
  const userData = localStorage.getItem('user')
  const user = userData ? JSON.parse(userData) : null
  const isFirstTimeUser = user && !user.has_sent_first_message
  
  if (isFirstMessage && !isCreatingSession) {
    currentSessionId = await createAIChatSession(messageToSend)
    if (!currentSessionId) {
      console.error('Failed to create AI chat session')
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        content: 'Failed to start chat session. Please try again.',
        sender: 'system',
        timestamp: new Date()
      }])
      return
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  const userMessage: ChatMessage = {
    id: `user-${Date.now()}`,
    content: messageToSend || (imageToSend ? 'Sent an image' : ''),
    sender: 'user',
    timestamp: new Date(),
    visual: imageToSend || undefined
  }
  setMessages(prev => [...prev, userMessage])
  setIsLoading(true)

  try {
    const chatHistory = convertMessages(messages)
    
    // Send message to N8N (N8N will get is_first_time_user = true for first message)
    if (imageToSend) {
      await n8nWebhook.current.sendImageMessage(imageToSend, messageToSend, currentSessionId, chatHistory)
    } else {
      await n8nWebhook.current.sendMessage(messageToSend, currentSessionId, chatHistory)
    }
    
    // Mark first message as sent if this was the user's first message
    if (isFirstTimeUser) {
      await markFirstMessageSent()
    }
    
    if (isFirstMessage || !isSubscribed) {
      pollForFirstMessage(currentSessionId!, userMessage.id)
    }
  } catch (error) {
    console.error('Error sending message to N8N:', error)
    const errorMessage: ChatMessage = {
      id: `error-${Date.now()}`,
      content: 'Sorry, something went wrong. Please try again.',
      sender: 'assistant',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, errorMessage])
    setIsLoading(false)
  }
}

// Helper function to mark first message sent
const markFirstMessageSent = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return
    
    const response = await fetch(`${API_BASE_URL}/ai-chat-session/mark-first-message/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      // Update local user data
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        user.has_sent_first_message = true
        localStorage.setItem('user', JSON.stringify(user))
      }
      console.log('✅ First message marked successfully')
    }
  } catch (error) {
    console.error('Error marking first message:', error)
    // Don't block the chat flow if this fails
  }
}

  const handleVoiceMessage = async (base64Audio: string) => {
    let currentSessionId = sessionId
    const isFirstMessage = !currentSessionId
    
    if (isFirstMessage && !isCreatingSession) {
      currentSessionId = await createAIChatSession('Voice message')
      if (!currentSessionId) {
        console.error('Failed to create AI chat session for voice')
        return
      }
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    const voiceMessage: ChatMessage = {
      id: `voice-${Date.now()}`,
      content: '🎤 Voice message',
      sender: 'user',
      timestamp: new Date(),
      isVoice: true
    }
    setMessages(prev => [...prev, voiceMessage])
    setIsLoading(true)
    
    try {
      if (n8nWebhook.current) {
        const chatHistory = convertMessages(messages)
        await n8nWebhook.current.sendVoiceMessage(base64Audio, currentSessionId, chatHistory)
        
        if (isFirstMessage || !isSubscribed) {
          pollForFirstMessage(currentSessionId!, voiceMessage.id)
        }
      }
    } catch (error) {
      console.error('Error processing voice:', error)
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: 'Failed to process voice message. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setIsLoading(false)
    }
  }

  const hasMessages = messages.length > 0

  return (
    <div>
      <GradientBackground opacity={hasMessages ? 0.6 : 1}>
        {/* Desktop Sidebar */}
        <div className="hidden lg:block relative">
          <Sidebar 
            isOpen={isOpen} 
            onToggle={toggle} 
            isDarkMode={mounted ? isDarkMode : false} 
            onDarkModeToggle={toggleDarkMode} 
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <Sidebar 
              isOpen={true} 
              onToggle={() => setIsMobileSidebarOpen(false)} 
              isDarkMode={mounted ? isDarkMode : false} 
              onDarkModeToggle={toggleDarkMode} 
              isMobile={true}
            />
          </div>
        )}

        {/* Main Content */}
        <div className={`h-screen flex flex-col transition-all duration-300 ${
          isOpen ? 'lg:ml-15' : 'lg:ml-15'
        } relative`}>
          
          {/* Tutorial Cards */}
          {showTutorial && (
            <>
              {tutorialStep === 1 && (
                <TutorialCard
                  title="update your profile"
                  subtitle="get a customized services!"
                  onNext={nextTutorialStep}
                  onSkip={skipTutorial}
                  className="fixed z-50"
                  style={{ top: '82px', right: '60px' }}
                />
              )}
              
              {tutorialStep === 2 && (
                <TutorialCard
                  title="Start a new Chat"
                  subtitle="Or See Your recent chats."
                  onNext={nextTutorialStep}
                  onSkip={skipTutorial}
                  className="fixed z-50"
                  style={{ top: '200px', left: '64px' }}
                  borderRadius="second"
                />
              )}
            </>
          )}
          
          {/* Header */}
          <header className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6">
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className={`p-2 rounded-lg transition-colors ${
                  mounted && isDarkMode 
                    ? 'hover:bg-gray-800 text-white' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <img 
                  src="/side-bar.svg" 
                  alt="Menu" 
                  style={{ 
                    filter: mounted && isDarkMode ? 'brightness(0) invert(1)' : 'none',
                    minWidth: '24px',
                    minHeight: '24px'
                  }}
                />
              </button>
            </div>
            <div className="hidden lg:block w-8" />
            
            <div className="flex justify-center mb-2">
              <div 
                className="relative"
              >
                <Image 
                  src={mounted && isDarkMode ? "/vizzy-logo-dark.svg" : "/vizzy-logo.svg"} 
                  alt="Vizzy Logo" 
                  width={220}
                  height={200}
                  className="w-32 sm:w-40 md:w-48 lg:w-[220px] h-auto transition-opacity"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 relative">
              <Badge 
                className="text-white border-0"
                style={{
                  background: 'linear-gradient(90deg, #FF4A19 0%, #4248FF 100%)',
                  borderRadius: '18px',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  fontSize: 'clamp(12px, 2vw, 16px)',
                  padding: '3px 8px'
                }}
              >
                Pro
              </Badge>
              <div className="relative">
                <AvatarDropdown 
                  currentUser={currentUser}
                  isDarkMode={mounted ? isDarkMode : false}
                />
              </div>
            </div>
          </header>


          {/* Main Content Area */}
          {!hasMessages ? (
            <main className="flex-1 flex flex-col px-4 sm:px-6 pb-6">
              {/* Spacer to push content to center */}
              <div className="flex-1 min-h-0" />
              
              {/* Center Content: Title and Carousel */}
              <div className="flex flex-col items-center">
                <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-[57px] font-bold text-center leading-none mb-4 pt-1 sm:mb-4 lg:mb-6 lg:pb-2 lg:pt-2.5`} style={{
                  background: 'linear-gradient(90.57deg, #ff9a3bff 2.54%, #FF4A19 37.91%, #4248FF 90.32%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {t('chat.agenda')}
                </h1>

                {/* Services Carousel */}
                <div className="w-full mb-8 sm:mb-12">
                  <ServicesCarousel isDarkMode={mounted ? isDarkMode : false} />
                </div>
              </div>

              {/* Spacer to push input to bottom */}
              <div className="flex-1 min-h-0" />
              
              {/* Bottom Input Box */}
              <div className="w-full flex justify-center">
                <ChatInput
                  ref={chatInputRef}
                  mode="initial"
                  isDarkMode={mounted ? isDarkMode : false}
                  isLoading={isLoading}
                  isCreatingSession={isCreatingSession}
                  onSend={handleSend}
                  onVoiceMessage={handleVoiceMessage}
                  showTutorial={showTutorial}
                  tutorialStep={tutorialStep}
                  onTutorialNext={nextTutorialStep}
                  onTutorialSkip={skipTutorial}
                  toast={toast}  // Add this line
                />
              </div>
            </main>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <MessagesContainer
                messages={messages}
                isLoading={isLoading}
                isCreatingSession={isCreatingSession}
                isDarkMode={mounted ? isDarkMode : false}
                StableImage={StableImage}
              />

              <ChatInput
                ref={chatInputRef}
                mode="compact"
                isDarkMode={mounted ? isDarkMode : false}
                isLoading={isLoading}
                isCreatingSession={isCreatingSession}
                onSend={handleSend}
                onVoiceMessage={handleVoiceMessage}
                toast={toast}  // Add this line
              />
            </div>
          )}
        </div>
      </GradientBackground>
      
      {/* Company Info Modal */}
      <CompanyInfoModal
        isOpen={showCompanyInfoModal}
        onClose={() => setShowCompanyInfoModal(false)}
        onSuccess={() => {
          // Modal was saved successfully, can refresh profile if needed
          if (n8nWebhook.current) {
            n8nWebhook.current.refreshCompanyProfile()
          }
        }}
        onToast={(type, message) => {
          if (type === 'success') {
            toast.success(message)
          } else {
            toast.error(message)
          }
        }}
      />
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default function Chat() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatContent />
    </Suspense>
  )
}