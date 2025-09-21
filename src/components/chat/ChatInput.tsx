"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, MicOff, X, Mic, Send } from 'lucide-react'
import Image from 'next/image'
import TypewriterPlaceholder from '@/components/chat/TypewriterPlaceholder'

// Types
interface ChatInputProps {
  mode: 'initial' | 'compact'
  isDarkMode: boolean
  isLoading: boolean
  isCreatingSession: boolean
  onSend: (message: string, image?: string | null) => Promise<void>
  onVoiceMessage: (audioBase64: string) => Promise<void>
  showTutorial?: boolean
  tutorialStep?: number
  onTutorialNext?: () => void
  onTutorialSkip?: () => void
}

// Tutorial Card Component (internal)
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

// Image Upload Loader Component (internal)
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
  )
}

// Main ChatInput Component
const ChatInput: React.FC<ChatInputProps> = ({
  mode,
  isDarkMode,
  isLoading,
  isCreatingSession,
  onSend,
  onVoiceMessage,
  showTutorial = false,
  tutorialStep = 1,
  onTutorialNext,
  onTutorialSkip
}) => {
  // State
  const [inputValue, setInputValue] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isImageUploading, setIsImageUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isInputExpanded, setIsInputExpanded] = useState(false)

  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const compactInputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Auto-expand input when there's content
  useEffect(() => {
    if (mode === 'compact' && (inputValue.trim() || selectedImage || isImageUploading)) {
      setIsInputExpanded(true)
    }
  }, [inputValue, selectedImage, isImageUploading, mode])

  // Focus correct input on mount/mode change
  useEffect(() => {
    if (mode === 'initial') {
      inputRef.current?.focus()
    } else {
      compactInputRef.current?.focus()
    }
  }, [mode])

  // Handle sending message
  const handleSend = async () => {
    if (isLoading || isCreatingSession) return
    const messageToSend = inputValue.trim()
    
    if (!messageToSend && !selectedImage) return

    await onSend(messageToSend, selectedImage)
    
    // Clear state after sending
    setInputValue("")
    setSelectedImage(null)
    setIsInputExpanded(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle image selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImageUploading(true)
    
    // Here you would normally upload to your backend
    // For now, we'll use FileReader for local preview
    const reader = new FileReader()
    reader.onload = () => {
      setSelectedImage(reader.result as string)
      setIsImageUploading(false)
    }
    reader.onerror = () => {
      setIsImageUploading(false)
      console.error('Failed to read file')
    }
    reader.readAsDataURL(file)
  }

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Voice Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1]
          if (base64Audio) {
            await onVoiceMessage(base64Audio)
          }
        }
        reader.readAsDataURL(audioBlob)
        
        // Clean up
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
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
      mediaRecorderRef.current.stop()
      const stream = mediaRecorderRef.current.stream
      stream.getTracks().forEach(track => track.stop())
      audioChunksRef.current = []
      setIsRecording(false)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Input expansion handlers for compact mode
  const handleInputExpand = () => setIsInputExpanded(true)
  const handleInputCollapse = () => {
    if (!inputValue.trim()) {
      setIsInputExpanded(false)
    }
  }
  const handleInputFocus = () => handleInputExpand()
  const handleInputBlur = () => handleInputCollapse()
  const handleInputClick = () => {
    handleInputExpand()
    setTimeout(() => compactInputRef.current?.focus(), 0)
  }

  // Render Initial Mode (Welcome Screen Input)
  if (mode === 'initial') {
    return (
      <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mb-6 sm:mb-8 lg:mb-10">
        <div className="w-full relative">
          {/* Tutorial Card for Initial Mode */}
          {showTutorial && tutorialStep === 3 && onTutorialNext && onTutorialSkip && (
            <TutorialCard
              title="Speak up your ideas"
              subtitle="Just chat and transform your ideas into a visuals!"
              onNext={onTutorialNext}
              onSkip={onTutorialSkip}
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
              isDarkMode ? 'bg-[#181819]' : 'bg-white'
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
                          isDarkMode ? 'bg-[#D9D9D9] text-black' : 'bg-[#7FCAFE] text-white'
                        }`}
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                </div>
              )}
              
              {/* Input Field Container */}
              <div className="relative w-full mb-4 sm:mb-6 lg:mb-8">
                {!inputValue && (
                  <TypewriterPlaceholder fontSize="clamp(18px, 4vw, 26px)" isDarkMode={isDarkMode} />
                )}
                
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
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

                {/* Voice Recording and Send Button */}
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
                  {inputValue ? (
                    <button
                      onClick={handleSend}
                      disabled={isLoading || isCreatingSession}
                      className="hover:scale-105 transition-transform cursor-pointer"
                      title="Send"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <Send size={20} className="sm:w-6 sm:h-6 text-white" />
                      </div>
                    </button>
                  ) : (
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
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render Compact Mode (Bottom Chat Input)
  return (
    <div className={`flex-shrink-0 backdrop-blur-sm p-6 pt-0 relative ${
      isDarkMode ? 'bg-gradient-to-t from-[#181819]/20 to-transparent' : 'bg-gradient-to-t from-white/20 to-transparent'
    }`}>
      <div className="max-w-4xl mx-auto relative">
        <div className="relative p-[2px] backdrop-blur-xl rounded-[50px]" style={{
          background: 'conic-gradient(from -46.15deg at 50.76% 47.25%, #4248FF -40.22deg, #7FCAFE 50.49deg, #FFEB77 104.02deg, #4248FF 158.81deg, #FF4A19 224.78deg, #4248FF 319.78deg, #7FCAFE 410.49deg)',
          boxShadow: isDarkMode ? '0px 0px 12px 0px #4248ff54' : '0px 0px 27px 0px rgba(255, 255, 255, 0.75)'
        }}>
          <div className={`relative rounded-[48px] transition-all duration-300 ease-in-out ${
            isDarkMode ? 'bg-[#181819]' : 'bg-white'
          }`} style={{ 
            backgroundColor: isDarkMode ? '#181819' : '#ffffff',
            padding: isInputExpanded ? '32px' : '16px 32px',
            paddingTop: isInputExpanded ? '28px' : '16px',
            paddingBottom: isInputExpanded ? '28px' : '16px'
          }}>
            
            {/* Selected Image Preview */}
            {(selectedImage || isImageUploading) && isInputExpanded && (
              <div className="mb-2 relative inline-block transition-opacity duration-300 ease-in-out"
                   style={{ opacity: isInputExpanded ? 1 : 0 }}>
                {isImageUploading ? (
                  <ImageUploadLoader isDarkMode={isDarkMode} />
                ) : (
                  <>
                    <img src={selectedImage!} alt="Selected" className="h-16 rounded-lg" width={64} height={64} />
                    <button
                      onClick={handleRemoveImage}
                      className={`absolute -top-1 -right-1 rounded-full p-0.5 ${
                        isDarkMode ? 'bg-[#D9D9D9] text-black' : 'bg-[#7FCAFE] text-white'
                      }`}
                    >
                      <X size={12} />
                    </button>
                  </>
                )}
              </div>
            )}
            
            {/* Main Input Container - Conditional Layout */}
            {isInputExpanded ? (
              // EXPANDED STATE
              <>
                <div className="flex items-start gap-4 flex-1">
                  <div className="relative flex-1">
                    {!inputValue && (
                      <div 
                        className="absolute inset-0 pointer-events-none flex items-start transition-opacity duration-300 ease-in-out"
                        style={{ 
                          background: 'linear-gradient(90deg, #4248FF -34.62%, #C3BFE6 130.34%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          color: 'transparent',
                          fontSize: '24px',
                          fontWeight: '300',
                          paddingTop: '0px',
                          opacity: 1
                        }}
                      >
                        Ask me anything
                      </div>
                    )}
                    
                    <textarea
                      ref={compactInputRef}
                      value={inputValue}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      onChange={(e) => {
                        setInputValue(e.target.value)
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
                      className={`w-full text-[24px] font-thin border-none bg-transparent px-0 focus:ring-0 focus:outline-none resize-none overflow-y-auto no-scrollbar relative z-10 transition-all duration-300 ease-in-out ${
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
                
                {/* Bottom bar - EXPANDED */}
                <div className="flex items-center justify-between mt-4 transition-all duration-300 ease-in-out">
                  <div className="flex items-center gap-4">
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
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-all duration-300 ease-in-out opacity-100">
                      <Image 
                        src="/tool-icon.svg" 
                        alt="Tool Icon" 
                        width={24} 
                        height={24}
                        style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'none' }}
                      />
                    </div>
                  </div>

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
                    {inputValue ? (
                      <button
                        onClick={handleSend}
                        disabled={isLoading || isCreatingSession}
                        className={`hover:scale-105 transition-transform cursor-pointer ${isLoading || isCreatingSession ? 'opacity-50' : ''}`}
                        title="Send"
                      >
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Send size={16} className="text-white" />
                        </div>
                      </button>
                    ) : (
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
                    )}
                  </div>
                </div>
              </>
            ) : (
              // COLLAPSED STATE
              <div className="flex flex-col gap-2 w-full">
                {(selectedImage || isImageUploading) && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-black/10 backdrop-blur-sm">
                    {isImageUploading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Uploading image...
                        </span>
                      </div>
                    ) : (
                      <>
                        <img src={selectedImage!} alt="Selected" className="h-12 w-12 rounded-lg object-cover" />
                        <span className={`text-sm flex-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Image ready to send
                        </span>
                        <button
                          onClick={() => setSelectedImage(null)}
                          className="hover:scale-105 transition-transform cursor-pointer"
                          title="Remove Image"
                        >
                          <div className="w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center">
                            <X size={12} className="text-white" />
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 w-full">
                  <div className="relative flex-1">
                    {!inputValue && (
                      <div 
                        className="absolute inset-0 pointer-events-none flex items-center transition-opacity duration-300 ease-in-out"
                        style={{ 
                          background: 'linear-gradient(90deg, #4248FF -34.62%, #C3BFE6 130.34%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          color: 'transparent',
                          fontSize: '24px',
                          fontWeight: '300',
                          paddingTop: '0px',
                          opacity: 1
                        }}
                      >
                        Ask me anything
                      </div>
                    )}
                    
                    <textarea
                      ref={compactInputRef}
                      value={inputValue}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      onClick={handleInputClick}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') {
                          handleInputExpand()
                        }
                      }}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSend()
                        }
                      }}
                      placeholder=""
                      className={`w-full text-[20px] font-thin border-none bg-transparent px-0 focus:ring-0 focus:outline-none resize-none overflow-hidden relative z-10 transition-all duration-300 ease-in-out ${
                        isDarkMode ? 'text-white' : 'text-black'
                      }`}
                      rows={1}
                      style={{ 
                        minHeight: '24px', 
                        maxHeight: '24px'
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
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

                    {isRecording && (
                      <button
                        onClick={cancelRecording}
                        className="hover:scale-105 transition-transform cursor-pointer"
                        title="Cancel Recording"
                      >
                        <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                          <X size={14} className="text-white" />
                        </div>
                      </button>
                    )}

                    {inputValue ? (
                      <button
                        onClick={handleSend}
                        disabled={isLoading || isCreatingSession}
                        className={`hover:scale-105 transition-transform cursor-pointer ${isLoading || isCreatingSession ? 'opacity-50' : ''}`}
                        title="Send"
                      >
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Send size={16} className="text-white" />
                        </div>
                      </button>
                    ) : (
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
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatInput