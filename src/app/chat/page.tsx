"use client"

export const dynamic = 'force-dynamic' 

import { useState, useRef, useEffect, memo, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, MicOff, X, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AvatarDropdown } from "@/components/ui/avatar-dropdown"
import { GradientBackground } from "../../components/gradient-background"
import { Sidebar, useSidebar } from "../../components/sidebar"
import Image from "next/image"
import { isAuthenticated, getUser, type User } from "@/lib/auth"
import { N8NWebhook } from "@/lib/n8n-webhook"
import { ResponseNormalizer } from "@/lib/response-normalizer"
import { isVideoUrl, getVideoMimeType } from "@/lib/videoUtils"
import { TextDirectionHandler } from "@/lib/text-direction-handler"
import { useNotificationSound } from "@/lib/useNotificationSound";
import { supabase, type ChatMessage, type ChatMessageDB } from "@/lib/supabase-client"
import { RealtimeChannel } from "@supabase/supabase-js"
import { useToast, ToastContainer } from "@/components/ui/toast"
import TypewriterPlaceholder from "@/components/chat/TypewriterPlaceholder"
import AnimatedBorderWrapper from "@/components/chat/AnimatedBorderWrapper"
import { 
  downloadImage, 
  isBase64Image, 
  handleImageSelect as handleImageSelectHelper
} from "@/lib/chat/imageHelpers"
import {
  createAIChatSession as createSession,
  pollForFirstMessage as pollMessage,
  messagesToChatHistory as convertMessages
} from "@/lib/chat/sessionHelpers"
import {
  startRecording as startVoiceRecording,
  stopRecording as stopVoiceRecording,
  cancelRecording as cancelVoiceRecording,
  toggleRecording as toggleVoiceRecording,
  type VoiceRecordingHandlers
} from "@/lib/chat/voiceHelpers"


// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

// Tutorial Card Component
const TutorialCard = ({ 
  title, 
  subtitle, 
  onNext, 
  onSkip, 
  className = "",
  style = {},
  borderRadius = "default"
}: { 
  title: string
  subtitle: string
  onNext: () => void
  onSkip: () => void
  className?: string
  style?: React.CSSProperties
  borderRadius?: "default" | "second" | "third"
}) => {
  // Define different border radius styles
  const getBorderRadius = () => {
    switch (borderRadius) {
      case "second":
        return {
          borderTopLeftRadius: '4px',
          borderTopRightRadius: '20px',
          borderBottomRightRadius: '20px',
          borderBottomLeftRadius: '14px',
        }
      case "third":
        return {
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '14px',
          borderBottomRightRadius: '4px',
          borderBottomLeftRadius: '20px',
        }
      default:
        return {
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '4px',
          borderBottomRightRadius: '14px',
          borderBottomLeftRadius: '20px',
        }
    }
  }

  return (
    <div className={`absolute z-50 ${className}`} style={style}>
      <div
        className="relative"
        style={{
          width: '180px',
          minHeight: 'auto',
          background: '#4248FFE0',
          border: '#7FCAFE 0.5px solid',
          boxShadow: '0px 0px 8px 0px #7FCAFE73',
          ...getBorderRadius(),
        }}
      >
        <div className="p-3 flex flex-col">
          <div className="mb-3">
            <div 
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'white',
                lineHeight: '1.2',
                marginBottom: '2px',
                whiteSpace: 'nowrap'
              }}
            >
              {title}
            </div>
            <div 
              style={{
                fontSize: '12px',
                fontWeight: 300,
                color: 'white',
                lineHeight: '1.2',
                wordWrap: 'break-word'
              }}
            >
              {subtitle}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onNext}
              style={{
                fontSize: '12px',
                fontWeight: 300,
                color: 'white',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              next
            </button>
            <button
              onClick={onSkip}
              style={{
                fontSize: '12px',
                fontWeight: 300,
                color: 'white',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              skip
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const StableImage = memo(({ src, alt, className, style, onClick }: { src: string, alt: string, className: string, style: React.CSSProperties, onClick?: (e: React.MouseEvent<HTMLImageElement>) => void }) => {
    const [imageError, setImageError] = useState(false);
    const [imageSrc, setImageSrc] = useState('');

    useEffect(() => {
        if (src) {
            const urlWithoutTimestamp = src.includes('/api/image-proxy') ? src.split('&t=')[0] : src;
            if (urlWithoutTimestamp !== imageSrc) {
                setImageSrc(urlWithoutTimestamp);
                setImageError(false);
            }
        }
    }, [src, imageSrc]);

    if (imageError || !imageSrc) {
        return null;
    }

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
    );
});
StableImage.displayName = 'StableImage';

// Loading animation component for image upload
const ImageUploadLoader = ({ isDarkMode }: { isDarkMode: boolean }) => {
  return (
    <div 
      className="h-20 w-20 rounded-lg flex items-center justify-center"
      style={{
        background: isDarkMode 
          ? '#20262D' 
          : 'linear-gradient(109.03deg, #BEDCFF -35.22%, rgba(255, 255, 255, 0.9) 17.04%, rgba(255, 232, 228, 0.4) 57.59%, #BEDCFF 97.57%)'
      }}
    >
      <div className="relative">
        <div 
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{
            borderColor: 'transparent',
            borderTopColor: isDarkMode ? '#78758E' : '#7FCAFE',
            borderRightColor: isDarkMode ? '#FFFFFF' : '#D3E6FC',
            animationDuration: '1s'
          }}
        />
      </div>
    </div>
  );
};

function ChatContent() {
  const { toasts, toast, removeToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isOpen, toggle } = useSidebar()
  
  // State Management
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isImageUploading, setIsImageUploading] = useState(false)
  
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  
  // Animated border state
  const [showAnimatedBorder, setShowAnimatedBorder] = useState(false)
  
  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(1)
  
  // AI Chat Session State
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  
  // Track processed message IDs to prevent duplicates
  const processedMessageIds = useRef<Set<string>>(new Set())
  const lastProcessedCount = useRef<number>(0)
  const channelRef = useRef<RealtimeChannel | null>(null)
  
  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const compactInputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // N8N instances
  const n8nWebhook = useRef<N8NWebhook | null>(null)
  const { playSound } = useNotificationSound("/vizzy-message.mp3");

  // Wrapper for createAIChatSession with required parameters
  const createAIChatSession = async (initialMessage?: string): Promise<string | undefined> => {
    const token = localStorage.getItem('access_token');
    if (!token || !API_BASE_URL) {
      console.error('No auth token or API URL found');
      return undefined;
    }

    return await createSession(
      initialMessage,
      { apiBaseUrl: API_BASE_URL, token },
      { setIsCreatingSession, setSessionId }
    );
  };

  // Wrapper for pollForFirstMessage with required parameters
  const pollForFirstMessage = useCallback(async (sessionId: string, userMessageId: string) => {
    await pollMessage(
      sessionId,
      userMessageId,
      { setMessages, setIsLoading },
      { processedMessageIds, lastProcessedCount }
    );
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      const urlSessionId = searchParams.get('id')
      if (urlSessionId) {
        console.log('🔗 Using session ID from URL:', urlSessionId)
        setSessionId(urlSessionId)
        sessionStorage.setItem('ai_chat_session_id', urlSessionId)
        return
      }
      
      const storedSessionId = sessionStorage.getItem('ai_chat_session_id')
      if (storedSessionId) {
        console.log('📌 Found existing session in storage:', storedSessionId)
        setSessionId(storedSessionId)
      }
    }
    
    if (currentUser) {
      checkExistingSession()
    }
  }, [currentUser, searchParams])

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode === 'true') {
      setIsDarkMode(true)
    }
  }, [])

  // Check if user has seen tutorial before
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenChatTutorial')
    if (!hasSeenTutorial && messages.length === 0) {
      setShowTutorial(true)
    }
  }, [messages.length])

  // Save dark mode preference
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem('darkMode', String(newDarkMode))
  }

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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      })
    }
  }, [messages])

  // Ensure proper scroll on initial render with messages
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'auto',
            block: 'end'
          })
        }
      }, 100)
    }
  }, [messages.length])

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
  }, [router]);

  // Initialize session and load existing messages
  useEffect(() => {
    if (!sessionId) return;
    
    console.log('🔄 Initializing session:', sessionId);
    
    const loadExistingMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('core_aichatsession')
          .select('chat_messages')
          .eq('id', sessionId)
          .single();
        
        if (error) {
          console.error('❌ Error fetching session:', error);
          lastProcessedCount.current = 0;
          return;
        }
        
        const existingMessages = data?.chat_messages || [];
        console.log(`📊 Session has ${existingMessages.length} existing messages`);
        
        // Clear processed IDs for new session
        processedMessageIds.current.clear();
        
        // Load existing messages and mark them as processed
        if (existingMessages.length > 0) {
          const uiMessages: ChatMessage[] = existingMessages.map((msg: ChatMessageDB, index: number) => {
            // Mark this message as processed
            const messageId = `${sessionId}-${index}-${msg.timestamp}`;
            processedMessageIds.current.add(messageId);
            
            const normalizer = new ResponseNormalizer(msg.content);
            const { text, mediaUrl } = normalizer.normalize();
            
            // For user messages, prioritize image_url over visual and mediaUrl
            let finalVisual = msg.visual;
            if (msg.role === 'user' && msg.image_url) {
              finalVisual = msg.image_url;
            } else if (mediaUrl) {
              finalVisual = mediaUrl;
            }
            
            // Handle content - if user message has image but no text, show "Sent an image"
            let finalContent = text || msg.content;
            if (msg.role === 'user' && (!finalContent || finalContent.trim() === '') && finalVisual) {
              finalContent = 'Sent an image';
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
            };
          });
          
          console.log(`📥 Loading ${uiMessages.length} existing messages into UI`);
          setMessages(uiMessages);
        }
        
        // Update processed count
        lastProcessedCount.current = existingMessages.length;
        console.log(`🔢 Set processed count to: ${lastProcessedCount.current}`);
        
      } catch (error) {
        console.error('❌ Error initializing session:', error);
        lastProcessedCount.current = 0;
      }
    };
    
    loadExistingMessages();
  }, [sessionId]);

  // Supabase Realtime subscription - FIXED VERSION
  useEffect(() => {
    if (!sessionId) {
      console.log('⏸️ No session ID, skipping Supabase subscription');
      return;
    }

    // Clean up any existing channel
    if (channelRef.current) {
      console.log('🧹 Cleaning up existing channel before creating new one');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('📌 Setting up Supabase Realtime for session:', sessionId);
    
    const channel = supabase
      .channel(`chat-session-${sessionId}-${Date.now()}`) // Unique channel name
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'core_aichatsession',
          filter: `id=eq.${sessionId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          console.log('🔨 Supabase Update Received');
          
          if (!payload || !payload.new) {
            console.error('❌ Invalid payload structure');
            return;
          }
          
          if (!('chat_messages' in payload.new)) {
            console.error('❌ chat_messages not found in payload');
            return;
          }
          
          const allMessages = payload.new.chat_messages as ChatMessageDB[];
          console.log(`📊 Total messages in DB: ${allMessages.length}, Processed: ${lastProcessedCount.current}`);
          
          // Only process new messages
          if (allMessages.length > lastProcessedCount.current) {
            const newMessages = allMessages.slice(lastProcessedCount.current);
            console.log(`✨ Processing ${newMessages.length} new messages`);
            
            // Filter and process only assistant messages that we haven't seen
            const assistantMessages = newMessages.filter((msg: ChatMessageDB, localIndex: number) => {
              const globalIndex = lastProcessedCount.current + localIndex;
              const messageId = `${sessionId}-${globalIndex}-${msg.timestamp}`;
              
              // Check if we've already processed this message
              if (processedMessageIds.current.has(messageId)) {
                console.log(`⏭️ Skipping already processed message: ${messageId}`);
                return false;
              }
              
              return msg.role === 'assistant';
            });
            
            console.log(`🤖 Found ${assistantMessages.length} new assistant messages to add`);
            
            if (assistantMessages.length > 0) {
              const normalizedMessages: ChatMessage[] = assistantMessages.map((msg: ChatMessageDB, localIndex: number) => {
                // Calculate the global index for this message
                const messagePosition = allMessages.indexOf(msg);
                const messageId = `${sessionId}-${messagePosition}-${msg.timestamp}`;
                
                // Mark as processed
                processedMessageIds.current.add(messageId);
                console.log(`✅ Processing message ID: ${messageId}`);
                
                const normalizer = new ResponseNormalizer(msg.content);
                const { text, mediaUrl } = normalizer.normalize();
                
                return {
                  id: `rt-${Date.now()}-${localIndex}`,
                  content: text || msg.content,
                  sender: 'assistant' as const,
                  timestamp: new Date(msg.timestamp),
                  visual: mediaUrl || msg.visual,
                  serviceType: msg.service_type,
                  isProcessing: false,
                  isVoice: false
                };
              });
              
              console.log('➕ Adding new messages to UI');
              setMessages(prev => [...prev, ...normalizedMessages]);
              playSound();
              setIsLoading(false);
            }
            
            // Update the processed count
            lastProcessedCount.current = allMessages.length;
            console.log(`🔢 Updated processed count to: ${lastProcessedCount.current}`);
          } else {
            console.log('ℹ️ No new messages to process');
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Supabase subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to Supabase Realtime');
          setIsSubscribed(true);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Supabase channel error');
          setIsSubscribed(false);
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ Supabase subscription timed out');
          setIsSubscribed(false);
        } else if (status === 'CLOSED') {
          console.log('🔒 Supabase channel closed');
          setIsSubscribed(false);
        }
      });
    
    channelRef.current = channel;
    
    // Cleanup subscription
    return () => {
      console.log('🧹 Cleaning up Supabase subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsSubscribed(false);
    };
  }, [sessionId]);

  const hasMessages = messages.length > 0

  useEffect(() => {
    if (hasMessages) {
      compactInputRef.current?.focus()
    } else {
      inputRef.current?.focus()
    }
  }, [hasMessages, messages.length])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;

      if (event.metaKey || event.ctrlKey) {
        return;
      }

      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
         activeElement.tagName === 'TEXTAREA' ||
         activeElement.tagName === 'SELECT' ||
         activeElement.getAttribute('role') === 'dialog')
      ) {
        return;
      }
      
      if (expandedImage) {
        return;
      }

      if (event.key.length !== 1) {
        return;
      }
      
      event.preventDefault();

      const targetRef = hasMessages ? compactInputRef : inputRef;
      const textarea = targetRef.current;

      if (textarea) {
        textarea.focus();

        const currentVal = textarea.value;
        const selectionStart = textarea.selectionStart;
        const selectionEnd = textarea.selectionEnd;
        
        const newValue = 
          currentVal.substring(0, selectionStart) + 
          event.key + 
          currentVal.substring(selectionEnd);
        
        setInputValue(newValue);

        setTimeout(() => {
          const newCursorPosition = selectionStart + 1;
          textarea.setSelectionRange(newCursorPosition, newCursorPosition);
          
          const event = new Event('input', { bubbles: true });
          textarea.dispatchEvent(event);
        }, 0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasMessages, setInputValue, expandedImage, inputRef, compactInputRef]);

  // Trigger animated border on component mount
  useEffect(() => {
    setShowAnimatedBorder(true);
    
    // Turn off animation after 3 seconds
    const timer = setTimeout(() => {
      setShowAnimatedBorder(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Wrapper for messagesToChatHistory
  const messagesToChatHistory = (messages: ChatMessage[]) => {
    return convertMessages(messages);
  }

  const handleSend = async (message?: string) => {
    if (isLoading || isCreatingSession) return
    const messageToSend = message || inputValue.trim()
    
    if (!messageToSend && !selectedImage) return
    if (!n8nWebhook.current) return

    let currentSessionId = sessionId
    const isFirstMessage = !currentSessionId;
    
    if (isFirstMessage && !isCreatingSession) {
      console.log('🚀 Creating new AI chat session for first message...')
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
      // Wait a bit for subscription to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: messageToSend || (selectedImage ? 'Sent an image' : ''),
      sender: 'user',
      timestamp: new Date(),
      visual: selectedImage || undefined
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsLoading(true)

    try {
      const chatHistory = messagesToChatHistory(messages);
      
      if (selectedImage) {
        await n8nWebhook.current.sendImageMessage(selectedImage, messageToSend, currentSessionId, chatHistory);
      } else {
        await n8nWebhook.current.sendMessage(messageToSend, currentSessionId, chatHistory)
      }
      console.log("✅ Message sent to N8N successfully");
      
      // For first message or if subscription is not ready, use polling
      if (isFirstMessage || !isSubscribed) {
        console.log("📊 Using polling for first message or unsubscribed state");
        pollForFirstMessage(currentSessionId!, userMessage.id);
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

  // Wrapper function for image selection with correct parameters
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const token = localStorage.getItem('access_token');
    if (!token || !API_BASE_URL) {
      toast.error("Authentication or configuration error");
      return;
    }

    await handleImageSelectHelper(
      e,
      {
        setSelectedImage,
        setIsImageUploading,
        toast
      },
      {
        token,
        apiBaseUrl: API_BASE_URL
      }
    );
  };

  // Voice recording callback handlers
  const handleRecordingComplete = async (base64Audio: string) => {
    let currentSessionId = sessionId;
    const isFirstMessage = !currentSessionId;
    
    if (isFirstMessage && !isCreatingSession) {
      currentSessionId = await createAIChatSession('Voice message');
      if (!currentSessionId) {
        console.error('Failed to create AI chat session for voice');
        return;
      }
      // Wait for subscription
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const voiceMessage: ChatMessage = {
      id: `voice-${Date.now()}`,
      content: '🎤 Voice message',
      sender: 'user',
      timestamp: new Date(),
      isVoice: true
    };
    setMessages(prev => [...prev, voiceMessage]);
    
    setIsLoading(true);
    
    try {
      if (n8nWebhook.current) {
        const chatHistory = messagesToChatHistory(messages);
        await n8nWebhook.current.sendVoiceMessage(base64Audio, currentSessionId, chatHistory);
        console.log("🎤 Voice message sent to N8N successfully");
        
        // Use polling for first message
        if (isFirstMessage || !isSubscribed) {
          console.log("📊 Using polling for voice message");
          pollForFirstMessage(currentSessionId!, voiceMessage.id);
        }
      }
    } catch (error) {
      console.error('Error processing voice:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: 'Failed to process voice message. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const voiceHandlers: VoiceRecordingHandlers = {
    mediaRecorderRef,
    audioChunksRef,
    isRecording,
    setIsRecording,
    onRecordingComplete: handleRecordingComplete,
    onError: (error: string) => toast.error(error)
  };

  // Voice recording wrapper functions
  const startRecording = () => startVoiceRecording(voiceHandlers);
  const stopRecording = () => stopVoiceRecording(voiceHandlers);
  const cancelRecording = () => cancelVoiceRecording(voiceHandlers);
  const toggleRecording = () => toggleVoiceRecording(voiceHandlers);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <GradientBackground opacity={hasMessages ? 0.6 : 1} isDarkMode={isDarkMode}>
        {/* Desktop Sidebar */}
        <div className="hidden lg:block relative">
          <Sidebar isOpen={isOpen} onToggle={toggle} isDarkMode={isDarkMode} onDarkModeToggle={toggleDarkMode} />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <Sidebar 
              isOpen={true} 
              onToggle={() => setIsMobileSidebarOpen(false)} 
              isDarkMode={isDarkMode} 
              onDarkModeToggle={toggleDarkMode} 
              isMobile={true}
            />
          </div>
        )}

        {/* Main Content */}
        <div className={`h-screen flex flex-col transition-all duration-300 ${isOpen ? 'lg:ml-20' : 'lg:ml-20'} relative`}>
          
          {/* Tutorial Cards - All in one place for easy control */}
          {showTutorial && (
            <>
              {/* First Tutorial Card - Step 1 */}
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
              
              {/* Second Tutorial Card - Step 2 */}
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
          
          {/* Header - Fixed */}
          <header className="flex-shrink-0 flex items-center justify-between px-6 py-6">
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-800 text-white' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Image 
                  src="/side-bar.svg" 
                  alt="Menu" 
                  width={24}
                  height={24}
                />
              </button>
            </div>
            <div className="hidden lg:block w-8" />
            
            <div className="flex justify-center mb-2">
              <div className="relative">
                <Image 
                  src={isDarkMode ? "/vizzy-logo-dark.svg" : "/vizzy-logo.svg"} 
                  alt="Vizzy Logo" 
                  width={220}
                  height={200}
                  className="w-48 h-auto lg:w-[220px]"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 relative">
              {/* Pro Badge */}
              <Badge 
                className="text-white border-0"
                style={{
                  background: 'linear-gradient(90deg, #FF4A19 0%, #4248FF 100%)',
                  borderRadius: '18px',
                  fontWeight: 900,
                  fontStyle: 'italic',
                  fontSize: '16px',
                  padding: '4px 12px'
                }}
              >
                Pro
              </Badge>
              {/* Avatar Dropdown */}
              <div className="relative">
                <AvatarDropdown 
                  currentUser={currentUser}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          </header>

          {/* Main Content Area - Flexible */}
          {!hasMessages ? (
            // Initial State - Welcome Screen
            <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
              <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-[57px] font-medium text-center leading-none mb-8 sm:mb-12 lg:mb-16 ${isDarkMode ? 'text-white' : 'text-[#11002E]'}`}>
                {"What's on your agenda today?"}
              </h1>

{/* Search Input */}
<div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mb-6 sm:mb-8 lg:mb-10">
  <div
    className="w-full relative"
  >

    {/* Third Tutorial Card - Step 3 - positioned relative to input container */}
    {showTutorial && tutorialStep === 3 && (
      <TutorialCard
        title="Speak up your ideas"
        subtitle="Just chat and transform your ideas into a visuals!"
        onNext={nextTutorialStep}
        onSkip={skipTutorial}
        className="absolute z-50"
        style={{ top: '-90px', left: '-150px' }}
        borderRadius="third"
      />
    )}

    <div className="relative p-[2px] backdrop-blur-xl rounded-[50px]" style={{
      background: 'conic-gradient(from -46.15deg at 50.76% 47.25%, #4248FF -40.22deg, #7FCAFE 50.49deg, #FFEB77 104.02deg, #4248FF 158.81deg, #FF4A19 224.78deg, #4248FF 319.78deg, #7FCAFE 410.49deg)',
      boxShadow: isDarkMode ? '0px 0px 12px 0px #4248ff54' : '0px 0px 27px 0px rgba(255, 255, 255, 0.75)'
    }}>
      <div className={`relative rounded-[48px] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 ${
        isDarkMode 
          ? 'bg-[#181819]' 
          : 'bg-white'
      }`} style={{ 
        backgroundColor: isDarkMode ? '#181819' : '#ffffff'
      }}>
      
      {/* Selected Image Preview */}
      {(selectedImage || isImageUploading) && (
        <div className="mb-4 relative inline-block">
          {isImageUploading ? (
            <ImageUploadLoader isDarkMode={isDarkMode} />
          ) : (
            <>
              <img src={selectedImage!} alt="Selected" className="h-20 rounded-lg" width={80} height={80} />
              <button
                onClick={handleRemoveImage}
                className={`absolute -top-2 -right-2 rounded-full p-1 ${
                  isDarkMode 
                    ? 'bg-[#D9D9D9] text-black' 
                    : 'bg-[#7FCAFE] text-white'
                }`}
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      )}
      
      {/* Input Field Container with Custom Placeholder */}
      <div className="relative w-full mb-4 sm:mb-6 lg:mb-8">
        {/* Custom Gradient Placeholder */}
        {!inputValue && (
          <TypewriterPlaceholder fontSize="clamp(18px, 4vw, 26px)" isDarkMode={isDarkMode} />
        )}
        
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            // Auto-resize
            const target = e.target
            target.style.height = 'auto'
            target.style.height = `${Math.min(target.scrollHeight, 120)}px`
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder=""
          className={`w-full font-thin border-none bg-transparent px-0 focus:ring-0 focus:outline-none resize-none overflow-y-auto no-scrollbar relative z-10 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}
          rows={1}
          style={{ 
            fontSize: 'clamp(18px, 4vw, 26px)',
            minHeight: '32px', 
            maxHeight: '120px'
          }}
        />
      </div>


      {/* Bottom bar with buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Image Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <Plus 
            size={24} 
            className={`sm:w-6 sm:h-6 lg:w-8 lg:h-8 cursor-pointer hover:opacity-80 transition-opacity ${
              isDarkMode ? 'text-white' : 'text-[#4248FF]'
            }`}
            onClick={() => fileInputRef.current?.click()}
          />

          {/* Tools Button */}
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <Image 
              src="/tool-icon.svg" 
              alt="Tool Icon" 
              width={24} 
              height={24} 
              className="w-6 h-6 lg:w-8 lg:h-8"
              style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'none' }}
            />
          </div>
        </div>

        {/* Voice Recording Button */}
        <div className="flex items-center gap-4">
          {isRecording && (
            <button 
              onClick={cancelRecording}
              className="hover:scale-105 transition-transform cursor-pointer"
              title="Cancel Recording"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-400 rounded-full flex items-center justify-center">
                <X size={20} className="sm:w-6 sm:h-6 text-white" />
              </div>
            </button>
          )}
          <button 
            onClick={toggleRecording}
            disabled={isLoading || isCreatingSession}
            className={`hover:scale-105 transition-transform cursor-pointer ${isRecording ? 'animate-pulse' : ''}`}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isRecording ? (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 rounded-full flex items-center justify-center">
                <MicOff size={20} className="sm:w-6 sm:h-6 text-white" />
              </div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" className="sm:w-12 sm:h-12" viewBox="0 0 58 53" fill="none">
                <g clipPath="url(#clip0_489_1814)">
                  <path fillRule="evenodd" clipRule="evenodd" d="M37.8361 1.58398C39.0162 1.58398 39.9729 2.54065 39.9729 3.72074V49.3048C39.9729 50.4848 39.0162 51.4415 37.8361 51.4415C36.6561 51.4415 35.6994 50.4848 35.6994 49.3048V3.72074C35.6994 2.54065 36.6561 1.58398 37.8361 1.58398ZM29.2891 10.131C30.4692 10.131 31.4259 11.0877 31.4259 12.2677V40.7578C31.4259 41.9378 30.4692 42.8945 29.2891 42.8945C28.109 42.8945 27.1523 41.9378 27.1523 40.7578V12.2677C27.1523 11.0877 28.109 10.131 29.2891 10.131ZM12.1951 12.98C13.3752 12.98 14.3318 13.9367 14.3318 15.1167V37.9088C14.3318 39.0888 13.3752 40.0455 12.1951 40.0455C11.015 40.0455 10.0583 39.0888 10.0583 37.9088V15.1167C10.0583 13.9367 11.015 12.98 12.1951 12.98ZM46.3831 15.829C47.5632 15.829 48.5199 16.7857 48.5199 17.9658V35.0598C48.5199 36.2398 47.5632 37.1965 46.3831 37.1965C45.2031 37.1965 44.2464 36.2398 44.2464 35.0598V17.9658C44.2464 16.7857 45.2031 15.829 46.3831 15.829ZM20.7421 18.678C21.9222 18.678 22.8788 19.6347 22.8788 20.8148V32.2108C22.8788 33.3908 21.9222 34.3475 20.7421 34.3475C19.562 34.3475 18.6053 33.3908 18.6053 32.2108V20.8148C18.6053 19.6347 19.562 18.678 20.7421 18.678ZM3.64807 21.527C4.82816 21.527 5.78483 22.4837 5.78483 23.6638V29.3618C5.78483 30.5418 4.82816 31.4985 3.64807 31.4985C2.46799 31.4985 1.51132 30.5418 1.51132 29.3618V23.6638C1.51132 22.4837 2.46799 21.527 3.64807 21.527ZM54.9301 21.527C56.1102 21.527 57.0669 22.4837 57.0669 23.6638V29.3618C57.0669 30.5418 56.1102 31.4985 54.9301 31.4985C53.7501 31.4985 52.7934 30.5418 52.7934 29.3618V23.6638C52.7934 22.4837 53.7501 21.527 54.9301 21.527Z" fill={isDarkMode ? "#FFFFFF" : "#4248FF"}/>
                </g>
                <defs>
                  <clipPath id="clip0_489_1814">
                    <rect width="56.9801" height="51.2821" fill="white" transform="translate(0.799072 0.87207)"/>
                  </clipPath>
                </defs>
              </svg>
            )}
          </button>
        </div>
      </div>
      
      </div>
    </div>
  </div>
</div>

            </main>
          ) : (
            // Chat State - Messages Interface with proper layout
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Messages Container - Scrollable */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar"
              >
                <div className="flex justify-center">
                  <div className="w-full max-w-4xl space-y-6">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {/* Assistant or System Messages */}
                        {(message.sender === 'assistant' || message.sender === 'system') && (
                          <div className="flex items-start space-x-4">
                            <div className="w-8 h-8 flex items-center justify-center">
                              <Image
                                src="/vizzy-chat-icon.svg"
                                alt="Vizzy AI"
                                width={24}
                                height={24}
                                style={isDarkMode ? { filter: 'invert(87%) sepia(13%) saturate(1042%) hue-rotate(176deg) brightness(104%) contrast(97%)' } : {}}
                              />
                            </div>
                            <div className="max-w-2xl">
                              {/* Message content */}
                              <div  className={`text-base leading-relaxed whitespace-pre-line chat-message-content ${
                                   isDarkMode ? 'text-white' : 'text-[#11002E]'
                                 } ${TextDirectionHandler.getTextDirectionClasses(message.content)}`}
                               dir="auto"
                               style={{
                                textAlign: 'start',
                                unicodeBidi: 'plaintext',
                                wordBreak: 'break-word'
                               }}>
                                {message.content}
                              </div>
                              
                              {/* Show visual content */}
                              {message.visual && (
                                <div 
                                  className="mt-4 backdrop-blur-xl rounded-3xl p-6 flex items-center justify-center cursor-pointer relative" 
                                  style={{ 
                                    width: '370px', 
                                    background: isDarkMode 
                                      ? 'linear-gradient(109.03deg, rgba(190, 220, 255, 0.1) -35.22%, rgba(255, 255, 255, 0.05) 17.04%, rgba(255, 232, 228, 0.05) 57.59%, rgba(190, 220, 255, 0.1) 97.57%)'
                                      : 'linear-gradient(109.03deg, #BEDCFF -35.22%, rgba(255, 255, 255, 0.9) 17.04%, rgba(255, 232, 228, 0.4) 57.59%, #BEDCFF 97.57%)',
                                    boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.2)'
                                  }}
                                  onClick={() => setExpandedImage(message.visual || null)}
                                >
                                  {isVideoUrl(message.visual) ? (
                                    <video 
                                      controls 
                                      preload="metadata"
                                      playsInline
                                      muted={false}
                                      className="max-w-full max-h-full rounded-lg object-contain"
                                      style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
                                      crossOrigin="anonymous"
                                    >
                                      <source src={`/api/video-proxy?videoUrl=${encodeURIComponent(message.visual)}`} type={getVideoMimeType(message.visual)} />
                                      <source src={`/api/video-proxy?videoUrl=${encodeURIComponent(message.visual)}`} type="video/mp4" />
                                      Your browser does not support the video tag.
                                    </video>
                                  ) : isBase64Image(message.visual) ? (
                                    <div className="relative inline-block">
                                      <img 
                                        src={message.visual} 
                                        alt="Generated visual content" 
                                        className="rounded-lg max-w-full max-h-full object-contain"
                                        style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
                                        onError={(e) => {
                                          console.error('Image failed to load:', message.visual);
                                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                      {/* Download button for base64 images */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          downloadImage(message.visual!, `vizzy-image-${Date.now()}.png`)
                                        }}
                                        className="absolute transition-all duration-200 transform hover:scale-110 z-10"
                                        style={{ top: '8px', right: '8px' }}
                                        title="Download image"
                                      >
                                        <Image 
                                          src="/download.svg" 
                                          alt="Download" 
                                          width={20} 
                                          height={20} 
                                          className="text-gray-700" 
                                        />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="relative inline-block">
                                      <StableImage
                                        src={`/api/image-proxy?imageUrl=${encodeURIComponent(message.visual)}`}
                                        alt="Generated visual content"
                                        className="rounded-lg max-w-full max-h-full object-contain"
                                        style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
                                      />
                                      {/* Download button for proxy images */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          downloadImage(`/api/image-proxy?imageUrl=${encodeURIComponent(message.visual!)}`, `vizzy-image-${Date.now()}.png`)
                                        }}
                                        className="cursor-pointer absolute transition-all duration-200 transform hover:scale-110 z-10"
                                        style={{ top: '8px', right: '8px' }}
                                        title="Download image"
                                      >
                                        <Image 
                                          src="/download.svg" 
                                          alt="Download" 
                                          width={20} 
                                          height={20} 
                                          className="text-gray-700" 
                                        />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* User Messages */}
                        {message.sender === 'user' && (
                          <div className="flex justify-end">
                            <div className="max-w-2xl">
                              <div 
                                className="px-6 py-4"
                                style={{
                                  background: 'linear-gradient(90.26deg, rgba(255, 255, 255, 0.65) -46.71%, rgba(127, 202, 254, 0.65) 145.13%)',
                                  backdropFilter: 'blur(16px)',
                                  boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.2)',
                                  borderRadius: '25px 25px 4px 25px'
                                }}
                              >
                                {/* Show voice indicator if it's a voice message */}
                                {message.isVoice ? (
                                  <div className="flex items-center gap-2">
                                    <Mic size={20} className={isDarkMode ? 'text-black' : 'text-[#4248FF]'} />
                                    <div  className="text-base leading-relaxed text-black chat-message-content" dir="auto" style={{  textAlign: 'start',  unicodeBidi: 'plaintext' }}>
                                      Voice message
                                    </div>
                                  </div>
                                ) : (
                                  <div  className="text-base leading-relaxed text-black chat-message-content" dir="auto" style={{  textAlign: 'start',  unicodeBidi: 'plaintext', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                    {message.content}
                                  </div>
                                )}
                                
                                {/* Show image if attached to user message */}
                                {message.visual && (
                                  <div className="mt-3 relative">
                                    <img 
                                      src={message.visual} 
                                      alt="Uploaded image" 
                                      className="rounded-lg max-w-full"
                                      style={{ maxWidth: '200px', height: 'auto' }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Loading Animation */}
                    {(isLoading || isCreatingSession) && (
                      <div className="flex justify-start">
                        <div className="flex items-start space-x-4">
                          <div className="w-8 h-8 flex items-center justify-center">
                            <Image 
                              src="/vizzy-chat-icon.svg" 
                              alt="Vizzy AI" 
                              width={24}
                              height={24}
                            />
                          </div>
                          <div className="max-w-2xl">
                            <div className={`backdrop-blur-xl rounded-3xl rounded-tl-lg px-4 py-4 border ${
                              isDarkMode ? 'bg-[#181819]/60 border-white/30' : 'bg-white/60 border-white/30'
                            }`}>
                              <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-[#4248FF] rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-[#A2498A] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-[#FF4A19] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Invisible element for scrolling reference */}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>

{/* Bottom Input - Fixed at bottom */}
<div className={`flex-shrink-0 backdrop-blur-sm p-6 pt-0 relative ${
  isDarkMode ? 'bg-gradient-to-t from-[#181819]/20 to-transparent' : 'bg-gradient-to-t from-white/20 to-transparent'
}`}>
  <div className="max-w-4xl mx-auto relative">
    <div className="relative p-[2px] backdrop-blur-xl rounded-[50px]" style={{
      background: 'conic-gradient(from -46.15deg at 50.76% 47.25%, #4248FF -40.22deg, #7FCAFE 50.49deg, #FFEB77 104.02deg, #4248FF 158.81deg, #FF4A19 224.78deg, #4248FF 319.78deg, #7FCAFE 410.49deg)',
      boxShadow: isDarkMode ? '0px 0px 12px 0px #4248ff54' : '0px 0px 27px 0px rgba(255, 255, 255, 0.75)'
    }}>
      <div className={`relative rounded-[48px] px-8 py-7 transition-all duration-500 ease-in-out ${
        isDarkMode 
          ? 'bg-[#181819]' 
          : 'bg-white'
      }`} style={{ 
        backgroundColor: isDarkMode ? '#181819' : '#ffffff'
      }}>
      
      {/* Selected Image Preview */}
      {(selectedImage || isImageUploading) && (
        <div className="mb-2 relative inline-block">
          {isImageUploading ? (
            <div 
              className="h-16 w-16 rounded-lg flex items-center justify-center"
              style={{
                background: isDarkMode 
                  ? '#20262D' 
                  : 'linear-gradient(109.03deg, #BEDCFF -35.22%, rgba(255, 255, 255, 0.9) 17.04%, rgba(255, 232, 228, 0.4) 57.59%, #BEDCFF 97.57%)'
              }}
            >
              <div className="relative">
                <div 
                  className="w-6 h-6 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: 'transparent',
                    borderTopColor: isDarkMode ? '#78758E' : '#7FCAFE',
                    borderRightColor: isDarkMode ? '#FFFFFF' : '#D3E6FC',
                    animationDuration: '1s'
                  }}
                />
              </div>
            </div>
          ) : (
            <>
              <img src={selectedImage!} alt="Selected" className="h-16 rounded-lg" width={64} height={64} />
              <button
                onClick={handleRemoveImage}
                className={`absolute -top-1 -right-1 rounded-full p-0.5 ${
                  isDarkMode 
                    ? 'bg-[#D9D9D9] text-black' 
                    : 'bg-[#7FCAFE] text-white'
                }`}
              >
                <X size={12} />
              </button>
            </>
          )}
        </div>
      )}
      
      <div className="flex items-start gap-4 flex-1">
        {/* Custom Gradient Placeholder for Compact Mode */}
        <div className="relative flex-1">
          {!inputValue && (
            <div 
              className="absolute inset-0 pointer-events-none flex items-start"
              style={{ 
                background: 'linear-gradient(90deg, #4248FF -34.62%, #C3BFE6 130.34%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                fontSize: '24px',
                fontWeight: '300',
                paddingTop: '0px'
              }}
            >
              Ask me anything
            </div>
          )}
          
          <textarea
            ref={compactInputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              // Auto-resize
              const target = e.target
              target.style.height = 'auto'
              target.style.height = `${Math.min(target.scrollHeight, 72)}px`
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder=""
            className={`w-full text-[24px] font-thin border-none bg-transparent px-0 focus:ring-0 focus:outline-none resize-none overflow-y-auto no-scrollbar relative z-10 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}
            rows={1}
            style={{ 
              minHeight: '24px', 
              maxHeight: '72px'
            }}
          />
        </div>
      </div>
      
      {/* Bottom bar with buttons */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          {/* Image Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <Plus 
            size={24} 
            className={`cursor-pointer hover:opacity-80 transition-opacity ${
              isDarkMode ? 'text-white' : 'text-[#4248FF]'
            }`}
            onClick={() => fileInputRef.current?.click()}
          />

          {/* Tools Button */}
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <Image 
              src="/tool-icon.svg" 
              alt="Tool Icon" 
              width={24} 
              height={24}
              style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'none' }}
            />
          </div>
        </div>

        {/* Voice Recording Button */}
        <div className="flex items-center gap-4">
          {isRecording && (
            <button 
              onClick={cancelRecording}
              className="hover:scale-105 transition-transform cursor-pointer"
              title="Cancel Recording"
            >
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                <X size={16} className="text-white" />
              </div>
            </button>
          )}
          <button 
            onClick={toggleRecording}
            disabled={isLoading || isCreatingSession}
            className={`hover:scale-105 transition-transform cursor-pointer ${isRecording ? 'animate-pulse' : ''} ${isLoading || isCreatingSession ? 'opacity-50' : ''}`}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isRecording ? (
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <MicOff size={16} className="text-white" />
              </div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 58 53" fill="none">
                <g clipPath="url(#clip0_489_1814)">
                  <path fillRule="evenodd" clipRule="evenodd" d="M37.8361 1.58398C39.0162 1.58398 39.9729 2.54065 39.9729 3.72074V49.3048C39.9729 50.4848 39.0162 51.4415 37.8361 51.4415C36.6561 51.4415 35.6994 50.4848 35.6994 49.3048V3.72074C35.6994 2.54065 36.6561 1.58398 37.8361 1.58398ZM29.2891 10.131C30.4692 10.131 31.4259 11.0877 31.4259 12.2677V40.7578C31.4259 41.9378 30.4692 42.8945 29.2891 42.8945C28.109 42.8945 27.1523 41.9378 27.1523 40.7578V12.2677C27.1523 11.0877 28.109 10.131 29.2891 10.131ZM12.1951 12.98C13.3752 12.98 14.3318 13.9367 14.3318 15.1167V37.9088C14.3318 39.0888 13.3752 40.0455 12.1951 40.0455C11.015 40.0455 10.0583 39.0888 10.0583 37.9088V15.1167C10.0583 13.9367 11.015 12.98 12.1951 12.98ZM46.3831 15.829C47.5632 15.829 48.5199 16.7857 48.5199 17.9658V35.0598C48.5199 36.2398 47.5632 37.1965 46.3831 37.1965C45.2031 37.1965 44.2464 36.2398 44.2464 35.0598V17.9658C44.2464 16.7857 45.2031 15.829 46.3831 15.829ZM20.7421 18.678C21.9222 18.678 22.8788 19.6347 22.8788 20.8148V32.2108C22.8788 33.3908 21.9222 34.3475 20.7421 34.3475C19.562 34.3475 18.6053 33.3908 18.6053 32.2108V20.8148C18.6053 19.6347 19.562 18.678 20.7421 18.678ZM3.64807 21.527C4.82816 21.527 5.78483 22.4837 5.78483 23.6638V29.3618C5.78483 30.5418 4.82816 31.4985 3.64807 31.4985C2.46799 31.4985 1.51132 30.5418 1.51132 29.3618V23.6638C1.51132 22.4837 2.46799 21.527 3.64807 21.527ZM54.9301 21.527C56.1102 21.527 57.0669 22.4837 57.0669 23.6638V29.3618C57.0669 30.5418 56.1102 31.4985 54.9301 31.4985C53.7501 31.4985 52.7934 30.5418 52.7934 29.3618V23.6638C52.7934 22.4837 53.7501 21.527 54.9301 21.527Z" fill={isDarkMode ? "#FFFFFF" : "#4248FF"}/>
                </g>
                <defs>
                  <clipPath id="clip0_489_1814">
                    <rect width="56.9801" height="51.2821" fill="white" transform="translate(0.799072 0.87207)"/>
                  </clipPath>
                </defs>
              </svg>
            )}
          </button>
        </div>
      </div>
      
      </div>
    </div>
  </div>
</div>
            </div>
          )}

          {/* Expanded Image Modal */}
          {expandedImage && (
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setExpandedImage(null)}
            >
              <div className="relative max-w-4xl max-h-[90vh]">
                <button
                  onClick={() => setExpandedImage(null)}
                  className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors"
                                                                                                                        
                               >
                  <X size={24} className="text-white" />
                </button>
                {isVideoUrl(expandedImage) ? (
                  <video 
                    controls 
                    autoPlay
                    className="max-w-full max-h-[90vh] rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <source src={`/api/video-proxy?videoUrl=${encodeURIComponent(expandedImage)}`} type={getVideoMimeType(expandedImage)} />
                    Your browser does not support the video tag.
                  </video>
                ) : isBase64Image(expandedImage) ? (
                  <img 
                    src={expandedImage} 
                    alt="Expanded view" 
                    className="max-w-full max-h-[90vh] rounded-lg object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <StableImage
                        src={`/api/image-proxy?imageUrl=${encodeURIComponent(expandedImage)}`}
                        alt="Expanded view"
                        className="max-w-full max-h-[90vh] rounded-lg object-contain"
                        onClick={(e) => e.stopPropagation()} style={{}} />
                )}
              </div>
            </div>
          )}
        </div>
      </GradientBackground>
      
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