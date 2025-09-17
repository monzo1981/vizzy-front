// Session and messaging helper functions extracted from chat page
// Provides reusable session management and message processing functionality

import { ResponseNormalizer } from "@/lib/response-normalizer"
import { supabase, type ChatMessage, type ChatMessageDB } from "@/lib/supabase-client"

// Type definitions
export interface SessionCallbacks {
  setIsCreatingSession: (loading: boolean) => void;
  setSessionId: (id: string | undefined) => void;
}

export interface PollingCallbacks {
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIsLoading: (loading: boolean) => void;
}

export interface PollingRefs {
  processedMessageIds: React.RefObject<Set<string>>;
  lastProcessedCount: React.RefObject<number>;
}

export interface SessionConfig {
  apiBaseUrl: string;
  token: string;
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  visual?: string;
}

// Function to create AI chat session
export const createAIChatSession = async (
  initialMessage: string | undefined,
  config: SessionConfig,
  callbacks: SessionCallbacks
): Promise<string | undefined> => {
  const { apiBaseUrl, token } = config;
  const { setIsCreatingSession, setSessionId } = callbacks;

  try {
    setIsCreatingSession(true)
    
    if (!token) {
      console.error('No auth token found')
      return undefined
    }
    
    const response = await fetch(`${apiBaseUrl}/ai-chat-session/`, {
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
      } catch {
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
export const pollForFirstMessage = async (
  sessionId: string,
  userMessageId: string,
  callbacks: PollingCallbacks,
  refs: PollingRefs
): Promise<void> => {
  const { setMessages, setIsLoading } = callbacks;
  const { processedMessageIds, lastProcessedCount } = refs;

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
               !processedMessageIds.current?.has(messageId) &&
               index >= (lastProcessedCount.current || 0);
      });

      if (newAssistantMessages.length > 0) {
        console.log(`✅ Found ${newAssistantMessages.length} new assistant messages via polling`);
        
        // Process new messages
        const normalizedMessages: ChatMessage[] = newAssistantMessages.map((msg: ChatMessageDB, idx: number) => {
          const messageIndex = allMessages.indexOf(msg);
          const messageId = `${sessionId}-${messageIndex}-${msg.timestamp}`;
          processedMessageIds.current?.add(messageId);
          
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
        if (lastProcessedCount.current !== undefined) {
          lastProcessedCount.current = allMessages.length;
        }
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
};

// Helper function to convert messages to chat history format
export const messagesToChatHistory = (messages: ChatMessage[]): ChatHistoryItem[] => {
  return messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' as const : 
          msg.sender === 'assistant' ? 'assistant' as const : 
          'system' as const,
    content: msg.content,
    timestamp: msg.timestamp.toISOString(),
    visual: msg.visual
  }));
};