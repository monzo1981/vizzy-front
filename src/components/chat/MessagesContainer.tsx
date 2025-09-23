"use client"

import React, { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { X, Mic } from 'lucide-react'
import { TextDirectionHandler } from '@/lib/text-direction-handler'
import { ResponseTextCleaner } from '@/lib/response-normalizer'
import { isVideoUrl, getVideoMimeType } from '@/lib/videoUtils'
import type { ChatMessage } from '@/lib/supabase-client'

// FormattedText Component for rendering bold text
interface FormattedTextProps {
  content: string;
  className?: string;
  dir?: string;
  style?: React.CSSProperties;
}

const FormattedText: React.FC<FormattedTextProps> = ({ 
  content, 
  className = '', 
  dir = 'auto',
  style = {}
}) => {
  const formatResult = ResponseTextCleaner.formatBoldText(content);
  
  if (!formatResult.formatted) {
    return (
      <div className={className} dir={dir} style={style}>
        {content}
      </div>
    );
  }
  
  return (
    <div className={className} dir={dir} style={style}>
      {formatResult.parts.map((part, index) => 
        part.bold ? (
          <strong key={index} className="font-bold">{part.text}</strong>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </div>
  );
};

// MessageBubble Component (internal)
interface MessageBubbleProps {
  message: ChatMessage
  isDarkMode: boolean
  onImageClick?: (imageUrl: string) => void
  StableImage: React.ComponentType<{
    src: string
    alt: string
    className: string
    style: React.CSSProperties
  }>
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isDarkMode, 
  onImageClick,
  StableImage 
}) => {
  const isUserMessage = message.sender === 'user';
  const isAssistant = message.sender === 'assistant' || message.sender === 'system';
  
  // Adjusted responsiveMediaStyle to fix type error
  const responsiveMediaStyle = {
    maxWidth: '100%' as const,
    height: 'auto' as const,
    objectFit: 'contain' as const,
  };

  if (isUserMessage) {
    return (
      <div className="flex justify-end">
        <div className="max-w-2xl">
          <div 
            className="px-6 py-4"
            style={{
              background: 'linear-gradient(90.26deg, rgba(255, 255, 255, 0.65) -46.71%, rgba(127, 202, 254, 0.65) 145.13%)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.2)',
              borderRadius: '25px 25px 4px 25px',
            }}
          >
            {message.isVoice ? (
              <div className="flex items-center gap-2">
                <Mic size={20} className={isDarkMode ? 'text-black' : 'text-[#4248FF]'} />
                <FormattedText
                  content="Voice message"
                  className="text-base leading-relaxed text-black chat-message-content"
                  style={{ textAlign: 'start', unicodeBidi: 'plaintext' }}
                />
              </div>
            ) : (
              <FormattedText
                content={message.content}
                className="text-base leading-relaxed text-black chat-message-content"
                style={{ 
                  textAlign: 'start', 
                  unicodeBidi: 'plaintext', 
                  wordBreak: 'break-word', 
                  whiteSpace: 'pre-wrap',
                }}
              />
            )}

            {message.visual && (
              <div className="mt-3 relative">
                <Image 
                  src={message.visual} 
                  alt="Uploaded image" 
                  className="rounded-lg"
                  style={responsiveMediaStyle}
                  width={200}
                  height={200}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isAssistant) {
    return (
      <div className="flex items-start space-x-4">
        <div className="w-8 h-8 flex items-center justify-center">
          <Image
            src="/vizzy-chat-icon.svg"
            alt="Vizzy AI"
            width={24}
            height={24}
            style={isDarkMode ? { 
              filter: 'invert(87%) sepia(13%) saturate(1042%) hue-rotate(176deg) brightness(104%) contrast(97%)',
            } : {}}
          />
        </div>
        <div className="max-w-2xl">
          <FormattedText
            content={message.content}
            className={`text-base leading-relaxed whitespace-pre-line chat-message-content ${
              isDarkMode ? 'text-white' : 'text-[#11002E]'
            } ${TextDirectionHandler.getTextDirectionClasses(message.content)}`}
            style={{
              textAlign: 'start',
              unicodeBidi: 'plaintext',
              wordBreak: 'break-word',
            }}
          />

          {message.visual && (
            <div 
              className="mt-4 backdrop-blur-xl rounded-3xl p-6 flex items-center justify-center cursor-pointer relative" 
              style={{ 
                width: '100%',
                maxWidth: '370px',
                background: isDarkMode 
                  ? 'linear-gradient(109.03deg, rgba(190, 220, 255, 0.1) -35.22%, rgba(255, 255, 255, 0.05) 17.04%, rgba(255, 232, 228, 0.05) 57.59%, rgba(190, 220, 255, 0.1) 97.57%)'
                  : 'linear-gradient(109.03deg, #BEDCFF -35.22%, rgba(255, 255, 255, 0.9) 17.04%, rgba(255, 232, 228, 0.4) 57.59%, #BEDCFF 97.57%)',
                boxShadow: '0px 0px 6px 0px rgba(0, 0, 0, 0.2)',
              }}
              onClick={() => onImageClick && onImageClick(message.visual || '')}
            >
              {isVideoUrl(message.visual) ? (
                <video 
                  controls 
                  preload="metadata"
                  playsInline
                  muted={false}
                  className="rounded-lg"
                  style={responsiveMediaStyle}
                  crossOrigin="anonymous"
                >
                  <source src={`/api/video-proxy?videoUrl=${encodeURIComponent(message.visual)}`} 
                          type={getVideoMimeType(message.visual)} />
                  <source src={`/api/video-proxy?videoUrl=${encodeURIComponent(message.visual)}`} 
                          type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <StableImage
                  src={`/api/image-proxy?imageUrl=${encodeURIComponent(message.visual)}`}
                  alt="Generated visual content"
                  className="rounded-lg"
                  style={responsiveMediaStyle}
                />
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
  
  return null
}

// LoadingIndicator Component (internal)
const LoadingIndicator: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  return (
    <div className="flex justify-start">
      <div className="flex items-start space-x-4">
        <div className="w-8 h-8 flex items-center justify-center">
          <Image 
            src="/vizzy-chat-icon.svg" 
            alt="Vizzy AI" 
            width={24}
            height={24}
            style={isDarkMode ? { 
              filter: 'invert(87%) sepia(13%) saturate(1042%) hue-rotate(176deg) brightness(104%) contrast(97%)' 
            } : {}}
          />
        </div>
        <div className="max-w-2xl">
          <div className={`backdrop-blur-xl rounded-3xl rounded-tl-lg px-4 py-4 border ${
            isDarkMode ? 'bg-[#181819]/60 border-white/30' : 'bg-white/60 border-white/30'
          }`}>
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-[#4248FF] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[#A2498A] rounded-full animate-bounce" 
                   style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-[#FF4A19] rounded-full animate-bounce" 
                   style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ExpandedImageModal Component (internal)
interface ExpandedImageModalProps {
  imageUrl: string | null
  onClose: () => void
  StableImage: React.ComponentType<{
    src: string
    alt: string
    className: string
    style: React.CSSProperties
    onClick?: (e: React.MouseEvent<HTMLImageElement>) => void
  }>
}

const ExpandedImageModal: React.FC<ExpandedImageModalProps> = ({ 
  imageUrl, 
  onClose,
  StableImage 
}) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors"
          aria-label="Close image"
        >
          <X size={24} className="text-white" />
        </button>

        {isVideoUrl(imageUrl) ? (
          <video 
            controls 
            autoPlay
            className="max-w-full max-h-[90vh] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <source 
              src={`/api/video-proxy?videoUrl=${encodeURIComponent(imageUrl)}`} 
              type={getVideoMimeType(imageUrl)} 
            />
            Your browser does not support the video tag.
          </video>
        ) : (
          <Image
            src={imageUrl}
            alt="Expanded view"
            className="max-w-full max-h-[90vh] rounded-lg object-contain"
            width={800}
            height={600}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
    </div>
  );
}

// Main MessagesContainer Component
interface MessagesContainerProps {
  messages: ChatMessage[]
  isLoading: boolean
  isCreatingSession: boolean
  isDarkMode: boolean
  StableImage: React.ComponentType<{
    src: string
    alt: string
    className: string
    style: React.CSSProperties
  }>
}

const MessagesContainer: React.FC<MessagesContainerProps> = ({
  messages,
  isLoading,
  isCreatingSession,
  isDarkMode,
  StableImage
}) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages]);

  // Ensure proper scroll on initial render with messages
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'auto',
            block: 'end'
          });
        }
      }, 100);
    }
  }, [messages.length]);

  return (
    <>
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar"
      >
        <div className="flex justify-center">
          <div className="w-full max-w-4xl space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <MessageBubble 
                  message={message}
                  isDarkMode={isDarkMode}
                  onImageClick={(imageUrl) => setExpandedImage(imageUrl)}
                  StableImage={StableImage}
                />
              </div>
            ))}

            {/* Loading Animation */}
            {(isLoading || isCreatingSession) && (
              <LoadingIndicator isDarkMode={isDarkMode} />
            )}

            {/* Invisible element for scrolling reference */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Expanded Image Modal */}
      <ExpandedImageModal
        imageUrl={expandedImage}
        onClose={() => setExpandedImage(null)}
        StableImage={StableImage}
      />
    </>
  );
}

export default MessagesContainer