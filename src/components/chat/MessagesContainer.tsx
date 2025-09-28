"use client"

import React, { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { Mic } from 'lucide-react'
import { TextDirectionHandler } from '@/lib/text-direction-handler'
import { ResponseTextCleaner } from '@/lib/response-normalizer'
import { isVideoUrl, getVideoMimeType } from '@/lib/videoUtils'
import { downloadMedia, isVideoUrl as isVideoUrlHelper } from '@/lib/chat/imageHelpers'
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
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Adjusted responsiveMediaStyle to fix type error
  const responsiveMediaStyle = {
    maxWidth: '100%' as const,
    height: 'auto' as const,
    objectFit: 'contain' as const,
  };

  // Handle media download
  const handleDownload = async (mediaUrl: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the image click
    
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      // Get the original URL if it's a proxied URL
      let originalUrl = mediaUrl;
      if (mediaUrl.includes('/api/image-proxy?imageUrl=') || mediaUrl.includes('/api/video-proxy?videoUrl=')) {
        // Extract original URL from proxy
        const urlMatch = mediaUrl.match(/[?&](imageUrl|videoUrl)=([^&]+)/);
        if (urlMatch && urlMatch[2]) {
          originalUrl = decodeURIComponent(urlMatch[2]);
        }
      }
      
      // For user uploaded images or direct URLs, use them as is
      if (!mediaUrl.includes('/api/')) {
        originalUrl = mediaUrl;
      }
      
      await downloadMedia(originalUrl); // Use the original URL for download
      console.log('Media downloaded successfully');
    } catch (error) {
      console.error('Failed to download media:', error);
    } finally {
      setIsDownloading(false);
    }
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
              <div className="mt-3 relative flex justify-end">
                <div 
                  className="cursor-pointer relative group"
                  onClick={() => onImageClick && onImageClick(message.visual || '')}
                >
                  <Image 
                    src={message.visual} 
                    alt="Uploaded image" 
                    className="rounded-lg"
                    style={responsiveMediaStyle}
                    width={200}
                    height={200}
                  />
                  
                  {/* Download button for user images - shows on hover */}
                  <button
                    onClick={(e) => handleDownload(message.visual!, e)}
                    disabled={isDownloading}
                    className="cursor-pointer absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 disabled:opacity-70 z-20 bg-black/70 rounded-full p-2 hover:bg-black/80"
                    title="Download Image"
                  >
                    <Image
                      src="/download.svg"
                      alt="Download"
                      width={16}
                      height={16}
                    />
                  </button>
                </div>
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
              className="mt-4 backdrop-blur-xl rounded-3xl p-6 flex items-center justify-center cursor-pointer relative group" 
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
              <div className="relative">
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

                {/* Download button - positioned over the media - only shows on hover */}
                <button
                  onClick={(e) => handleDownload(message.visual!, e)}
                  disabled={isDownloading}
                  className="cursor-pointer absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 disabled:opacity-70 z-20 bg-black/70 rounded-full p-2 hover:bg-black/80"
                  title={isVideoUrl(message.visual) ? "Download Video" : "Download Image"}
                >
                  <Image
                    src="/download.svg"
                    alt="Download"
                    width={20}
                    height={20}
                  />
                </button>
              </div>
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
  const [isDownloading, setIsDownloading] = useState(false);

  // Handle media download in modal
  const handleModalDownload = async () => {
    if (!imageUrl || isDownloading) return;
    
    setIsDownloading(true);
    try {
      // Get the original URL if it's a proxied URL  
      let originalUrl = imageUrl;
      if (imageUrl.includes('/api/image-proxy?imageUrl=') || imageUrl.includes('/api/video-proxy?videoUrl=')) {
        // Extract original URL from proxy
        const urlMatch = imageUrl.match(/[?&](imageUrl|videoUrl)=([^&]+)/);
        if (urlMatch && urlMatch[2]) {
          originalUrl = decodeURIComponent(urlMatch[2]);
        }
      }
      
      // For user uploaded images, use the URL directly
      if (!imageUrl.includes('/api/')) {
        originalUrl = imageUrl;
      }
      
      await downloadMedia(originalUrl);
      console.log('Media downloaded successfully from modal');
    } catch (error) {
      console.error('Failed to download media from modal:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex flex-col"
      onClick={onClose}
    >
      {/* Top Controls Bar */}
      <div className="flex justify-between items-center p-6 z-10 flex-shrink-0">
        {/* Back/Close Arrow - Left Side */}
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors cursor-pointer"
          aria-label="Back"
        >
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>

        {/* Download Button - Right Side */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleModalDownload();
          }}
          disabled={isDownloading}
          className="transition-opacity duration-200 disabled:opacity-50 cursor-pointer hover:opacity-80"
          title={isVideoUrl(imageUrl) ? "Download Video" : "Download Image"}
        >
          <Image
            src="/download.svg"
            alt="Download"
            width={32}
            height={32}
            style={{ filter: 'brightness(0) invert(1) sepia(1)' }}
          />
        </button>
      </div>

      {/* Media Content - Absolutely Centered */}
      <div className="absolute inset-0 flex items-center justify-center p-20">
        {isVideoUrl(imageUrl) ? (
          <video 
            controls 
            autoPlay
            className="max-w-[90vw] max-h-[70vh]"
            style={{ borderRadius: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <source 
              src={`/api/video-proxy?videoUrl=${encodeURIComponent(imageUrl)}`} 
              type={getVideoMimeType(imageUrl)} 
            />
            Your browser does not support the video tag.
          </video>
        ) : (
          <StableImage
            src={imageUrl.includes('/api/') ? imageUrl : `/api/image-proxy?imageUrl=${encodeURIComponent(imageUrl)}`}
            alt="Expanded view"
            className="max-w-[90vw] max-h-[70vh]"
            style={{ 
              borderRadius: '20px',
              objectFit: 'contain'
            }}
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