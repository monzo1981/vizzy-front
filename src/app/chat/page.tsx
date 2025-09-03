"use client"

import { useState, useRef, useEffect, memo, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, LogOut, MicOff, X, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { GradientBackground } from "../../components/gradient-background"
import { Sidebar, useSidebar } from "../../components/sidebar"
import Image from "next/image"
import { isAuthenticated, getUser, logout, type User } from "@/lib/auth"
import { N8NWebhook } from "@/lib/n8n-webhook"
import { ResponseNormalizer } from "@/lib/response-normalizer"
import { isVideoUrl, getVideoMimeType } from "@/lib/videoUtils"
import { TextDirectionHandler } from "@/lib/text-direction-handler"
import { supabase, type ChatMessage, type ChatMessageDB } from "@/lib/supabase-client"
import { RealtimeChannel } from "@supabase/supabase-js"

export const dynamic = 'force-dynamic'  // Add this line

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

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

export default function Chat() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isOpen, toggle } = useSidebar()
  
  // State Management
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  
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

  // Function to create AI chat session
  const createAIChatSession = async (initialMessage?: string): Promise<string | undefined> => {
    try {
      setIsCreatingSession(true)
      
      const token = localStorage.getItem('access_token')
      if (!token) {
        console.error('No auth token found')
        return undefined
      }
      
      const response = await fetch(`${API_BASE_URL}/ai-chat-session/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          initial_message: initialMessage || ''
        })
      })
      
      if (!response.ok) {
        try {
          const errorData = await response.json()
          console.error('Failed to create session:', response.status, errorData)
          
          if (response.status === 403) {
            console.error('Permission denied. User might not be a client or token expired.')
          }
        } catch (e) {
          console.error('Failed to create session:', response.status)
        }
        return undefined
      }
      
      const data = await response.json()
      const newSessionId = data.session_id
      setSessionId(newSessionId)
      
      sessionStorage.setItem('ai_chat_session_id', newSessionId)
      console.log('🎯 Created new AI chat session:', newSessionId)
      
      return newSessionId
    } catch (error) {
      console.error('Error creating AI chat session:', error)
      return undefined
    } finally {
      setIsCreatingSession(false)
    }
  }

  // Polling function for first message (fallback)
  const pollForFirstMessage = useCallback(async (sessionId: string, userMessageId: string) => {
    let retries = 0;
    const maxRetries = 10;
    const interval = 1000; // 1 second

    const poll = async () => {
      if (retries >= maxRetries) {
        console.log('⏱️ Polling timeout reached');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('core_aichatsession')
          .select('chat_messages')
          .eq('id', sessionId)
          .single();

        if (error) {
          console.error('❌ Error polling for message:', error);
          retries++;
          setTimeout(poll, interval);
          return;
        }

        const allMessages = data?.chat_messages || [];
        
        // Look for new assistant messages after our user message
        const newAssistantMessages = allMessages.filter((msg: ChatMessageDB, index: number) => {
          // Generate a unique ID for this message
          const messageId = `${sessionId}-${index}-${msg.timestamp}`;
          
          return msg.role === 'assistant' && 
                 !processedMessageIds.current.has(messageId) &&
                 index >= lastProcessedCount.current;
        });

        if (newAssistantMessages.length > 0) {
          console.log(`✅ Found ${newAssistantMessages.length} new assistant messages via polling`);
          
          // Process new messages
          const normalizedMessages: ChatMessage[] = newAssistantMessages.map((msg: ChatMessageDB, idx: number) => {
            const messageIndex = allMessages.indexOf(msg);
            const messageId = `${sessionId}-${messageIndex}-${msg.timestamp}`;
            processedMessageIds.current.add(messageId);
            
            const normalizer = new ResponseNormalizer(msg.content);
            const { text, mediaUrl } = normalizer.normalize();
            
            return {
              id: `poll-${Date.now()}-${idx}`,
              content: text || msg.content,
              sender: 'assistant' as const,
              timestamp: new Date(msg.timestamp),
              visual: mediaUrl || msg.visual,
              serviceType: msg.service_type,
              isProcessing: false,
              isVoice: false
            };
          });
          
          setMessages(prev => [...prev, ...normalizedMessages]);
          lastProcessedCount.current = allMessages.length;
          setIsLoading(false);
        } else {
          retries++;
          setTimeout(poll, interval);
        }
      } catch (error) {
        console.error('❌ Polling error:', error);
        retries++;
        setTimeout(poll, interval);
      }
    };

    // Start polling
    poll();
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

  // Save dark mode preference
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem('darkMode', String(newDarkMode))
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
        process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://monzology.app.n8n.cloud/webhook/2fe03fcd-7ff3-4a55-9d38-064722b844ab',
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
            
            return {
              id: `existing-${index}-${Date.now()}`,
              content: text || msg.content,
              sender: msg.role === 'user' ? 'user' : 'assistant',
              timestamp: new Date(msg.timestamp),
              visual: mediaUrl || msg.visual,
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

  const handleLogout = () => {
    sessionStorage.removeItem('ai_chat_session_id')
    logout()
    router.push('/')
  }

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setSelectedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isBase64Image = (url: string | undefined): boolean => {
    if (!url) return false
    return url.startsWith('data:image')
  }

  // Helper function to convert messages to chat history format
  const messagesToChatHistory = (messages: ChatMessage[]) => {
    return messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' as const : 
            msg.sender === 'assistant' ? 'assistant' as const : 
            'system' as const,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
      visual: msg.visual
    }));
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
    setSelectedImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsLoading(true)

    try {
      const chatHistory = messagesToChatHistory(messages);
      
      if (selectedImage && selectedImageFile) {
        const reader = new FileReader()
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(selectedImageFile)
        })
        await n8nWebhook.current.sendImageMessage(base64, messageToSend, currentSessionId, chatHistory)
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Image size must be less than 10MB")
        return
      }
      
      if (!file.type.startsWith('image/')) {
        alert("Please select an image file")
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
        setSelectedImageFile(file)
      }
      reader.readAsDataURL(file)
    }

    if (e.target) {
      e.target.value = "";
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm'
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        if (audioBlob.size > 0) {
          const reader = new FileReader()
          
          reader.onloadend = async () => {
            const base64AudioWithPrefix = reader.result as string
            const base64Audio = base64AudioWithPrefix.split(',')[1]
            
            let currentSessionId = sessionId
            const isFirstMessage = !currentSessionId;
            
            if (isFirstMessage && !isCreatingSession) {
              currentSessionId = await createAIChatSession('Voice message')
              if (!currentSessionId) {
                console.error('Failed to create AI chat session for voice')
                return
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
            }
            setMessages(prev => [...prev, voiceMessage])
            
            setIsLoading(true)
            
            try {
              if (n8nWebhook.current) {
                const chatHistory = messagesToChatHistory(messages);
                await n8nWebhook.current.sendVoiceMessage(base64Audio, currentSessionId, chatHistory)
                console.log("🎤 Voice message sent to N8N successfully");
                
                // Use polling for first message
                if (isFirstMessage || !isSubscribed) {
                  console.log("📊 Using polling for voice message");
                  pollForFirstMessage(currentSessionId!, voiceMessage.id);
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
          
          reader.readAsDataURL(audioBlob)
        }
        
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      alert("Could not access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => { 
        console.log("Recording cancelled.");
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      audioChunksRef.current = [];
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <GradientBackground opacity={hasMessages ? 0.6 : 1} isDarkMode={isDarkMode}>
        {/* Sidebar */}
        <Sidebar isOpen={isOpen} onToggle={toggle} isDarkMode={isDarkMode} onDarkModeToggle={toggleDarkMode} />

        {/* Main Content */}
        <div className={`h-screen flex flex-col transition-all duration-300 ${isOpen ? 'lg:ml-20' : 'lg:ml-20'}`}>
          {/* Header - Fixed */}
          <header className="flex-shrink-0 flex items-center justify-between px-10 py-4">
            <div className="w-8" />
            <div className="flex justify-center mb-2">
              <div className="relative">
                <Image 
                  src={isDarkMode ? "/vizzy-logo-dark.svg" : "/vizzy-logo.svg"} 
                  alt="Vizzy Logo" 
                  width={300}
                  height={200}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-600'}`}
              >
                <LogOut size={16} />
                Logout
              </Button>
              <Avatar fallback={currentUser ? `${currentUser.first_name.charAt(0)}${currentUser.last_name.charAt(0)}`.toUpperCase() : ''} alt="User" size="md" />
            </div>
          </header>

          {/* Main Content Area - Flexible */}
          {!hasMessages ? (
            // Initial State - Welcome Screen
            <main className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
              <h1 className={`text-[57px] font-medium text-center leading-none mb-16 ${isDarkMode ? 'text-white' : 'text-[#11002E]'}`}>
                {"What's on the agenda today?"}
              </h1>

              {/* Search Input */}
              <div className="w-full max-w-3xl sm:max-w-4xl mb-10">
                <div className={`relative backdrop-blur-xl rounded-[50px] border px-8 py-6 ${
                  isDarkMode 
                    ? 'bg-[#181819] border-white/30' 
                    : 'bg-white/60 border-white/30'
                }`}>
                  
                  {/* Selected Image Preview */}
                  {selectedImage && (
                    <div className="mb-4 relative inline-block">
                      <img src={selectedImage} alt="Selected" className="h-20 rounded-lg" width={80} height={80} />
                      <button
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  
                  {/* Input Field Container with Custom Placeholder */}
                  <div className="relative w-full mb-8">
                    {/* Custom Gradient Placeholder */}
                    {!inputValue && (
                      <div 
                        className="absolute inset-0 pointer-events-none flex items-start"
                        style={{ 
                          background: 'linear-gradient(to right, #4248FF, #C3BFE6)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          color: 'transparent',
                          fontSize: '40px',
                          fontWeight: '100',
                          paddingTop: '0px'
                        }}
                      >
                        Ask me anything
                      </div>
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
                      className={`w-full text-[40px] font-thin border-none bg-transparent px-0 focus:ring-0 focus:outline-none resize-none overflow-y-auto relative z-10 ${
                        isDarkMode ? 'text-white' : 'text-black'
                      }`}
                      rows={1}
                      style={{ 
                        minHeight: '40px', 
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
                        size={32} 
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
                          width={32} 
                          height={32} 
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
                          <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center">
                            <X size={24} className="text-white" />
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
                          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                            <MicOff size={24} className="text-white" />
                          </div>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 58 53" fill="none">
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
                                  className="mt-4 backdrop-blur-xl rounded-3xl p-6 flex items-center justify-center cursor-pointer" 
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
                                  ) : (
                                    <StableImage
                                      src={`/api/image-proxy?imageUrl=${encodeURIComponent(message.visual)}`}
                                      alt="Generated visual content"
                                      className="rounded-lg max-w-full max-h-full object-contain"
                                      style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
                                    />
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
                                  <div  className="text-base leading-relaxed text-black chat-message-content" dir="auto" style={{  textAlign: 'start',  unicodeBidi: 'plaintext', wordBreak: 'break-word' }}>
                                    {message.content}
                                  </div>
                                )}
                                
                                {/* Show image if attached to user message */}
                                {message.visual && (
                                  <div className="mt-3">
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
              <div className={`flex-shrink-0 backdrop-blur-sm p-6 pt-0 ${
                isDarkMode ? 'bg-gradient-to-t from-[#181819]/20 to-transparent' : 'bg-gradient-to-t from-white/20 to-transparent'
              }`}>
                <div className="max-w-4xl mx-auto">
                  <div className={`relative backdrop-blur-xl border px-8 py-7 transition-all duration-500 ease-in-out ${
                    isDarkMode 
                      ? 'bg-[#181819] border-white/30' 
                      : 'bg-white/60 border-white/30'
                  }`} style={{ borderRadius: '50px' }}>
                    
                    {/* Selected Image Preview */}
                    {selectedImage && (
                      <div className="mb-2 relative inline-block">
                        <img src={selectedImage} alt="Selected" className="h-16 rounded-lg" width={64} height={64} />
                        <button
                          onClick={handleRemoveImage}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4 flex-1">
                      {/* Custom Gradient Placeholder for Compact Mode */}
                      <div className="relative flex-1">
                        {!inputValue && (
                          <div 
                            className="absolute inset-0 pointer-events-none flex items-start"
                            style={{ 
                              background: 'linear-gradient(to right, #4248FF, #C3BFE6)',
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                              color: 'transparent',
                              fontSize: '24px',
                              fontWeight: '100',
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
                          className={`w-full text-[24px] font-thin border-none bg-transparent px-0 focus:ring-0 focus:outline-none resize-none overflow-y-auto relative z-10 ${
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
    </div>
  )
}