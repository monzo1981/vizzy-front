"use client"

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Plus, MicOff, X } from 'lucide-react'
import Image from 'next/image'
import TypewriterPlaceholder from '@/components/chat/TypewriterPlaceholder'
import TutorialCard from '@/components/chat/TutorialCard'
import { handleImageSelect as uploadImage } from '@/lib/chat/imageHelpers'

// Types
export interface ChatInputHandle {
  isInputFocused: () => boolean
  focusAndInsertText: (text: string) => void
}

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
const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(({
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
}, ref) => {
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
  const isCancelledRef = useRef<boolean>(false) // New ref to track cancellation

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

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    isInputFocused: () => {
      const activeElement = document.activeElement
      return activeElement === inputRef.current || activeElement === compactInputRef.current
    },
    focusAndInsertText: (text: string) => {
      const currentInput = mode === 'initial' ? inputRef.current : compactInputRef.current
      if (currentInput) {
        currentInput.focus()
        const currentValue = inputValue
        const cursorPosition = currentInput.selectionStart || currentValue.length
        const newValue = currentValue.slice(0, cursorPosition) + text + currentValue.slice(cursorPosition)
        setInputValue(newValue)
        
        // Set cursor position after the inserted text
        setTimeout(() => {
          const newCursorPosition = cursorPosition + text.length
          currentInput.setSelectionRange(newCursorPosition, newCursorPosition)
        }, 0)
      }
    }
  }), [mode, inputValue])

  // Handle sending message
  const handleSend = async () => {
    if (isLoading || isCreatingSession) return
    const messageToSend = inputValue.trim()
    
    if (!messageToSend && !selectedImage) return

    // Clear state immediately before sending
    setInputValue("")
    setSelectedImage(null)
    setIsInputExpanded(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    
    // Send message after clearing (no await to avoid blocking)
    onSend(messageToSend, selectedImage)
  }

  // Handle image selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const token = localStorage.getItem('access_token')
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
    
    if (!token || !apiBaseUrl) {
      console.error('No auth token or API URL found')
      return
    }

    await uploadImage(
      e,
      {
        setSelectedImage,
        setIsImageUploading,
        toast: {
          success: (msg) => console.log('Success:', msg),
          error: (msg) => console.error('Error:', msg)
        }
      },
      {
        token,
        apiBaseUrl
      }
    )
  }

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Voice Recording Functions - FIXED VERSION
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      isCancelledRef.current = false // Reset cancelled flag when starting new recording

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Clean up the stream first
        stream.getTracks().forEach(track => track.stop())
        
        // Check if recording was cancelled
        if (isCancelledRef.current) {
          console.log("Recording cancelled - not processing audio")
          audioChunksRef.current = [] // Clear audio chunks
          return // Exit without processing
        }
        
        // Only process if not cancelled
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        if (audioBlob.size > 0) {
          const reader = new FileReader()
          reader.onloadend = async () => {
            const base64Audio = reader.result?.toString().split(',')[1]
            if (base64Audio) {
              await onVoiceMessage(base64Audio)
            }
          }
          reader.readAsDataURL(audioBlob)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      isCancelledRef.current = false // Not cancelled, normal stop
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      isCancelledRef.current = true // Set cancelled flag BEFORE stopping
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      audioChunksRef.current = [] // Clear chunks immediately
      console.log("Recording cancelled")
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
      <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mb-6 sm:mb-6 lg:mb-8">
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

          <div className="relative p-[2px] backdrop-blur-xl" style={{
            borderRadius: 'clamp(30px, 7vw, 50px)',
            background: 'conic-gradient(from -46.15deg at 50.76% 47.25%, #4248FF -40.22deg, #7FCAFE 50.49deg, #FFEB77 104.02deg, #4248FF 158.81deg, #FF4A19 224.78deg, #4248FF 319.78deg, #7FCAFE 410.49deg)',
            boxShadow: isDarkMode ? '0px 0px 12px 0px #4248ff54' : '0px 0px 27px 0px rgba(255, 255, 255, 0.75)'
          }}>
            <div className={`relative px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 ${
              isDarkMode ? 'bg-[#181819]' : 'bg-white'
            }`} style={{ 
              backgroundColor: isDarkMode ? '#181819' : '#ffffff',
              borderRadius: 'clamp(28px, 6.8vw, 48px)'
            }}>
              
              {/* Selected Image Preview */}
              {(selectedImage || isImageUploading) && (
                <div className="mb-4 relative inline-block">
                  {isImageUploading ? (
                    <ImageUploadLoader isDarkMode={isDarkMode} />
                  ) : (
                    <>
                      <Image 
                        src={selectedImage!} 
                        alt="Selected" 
                        className="h-20 rounded-lg" 
                        width={80} 
                        height={80} 
                      />
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
                    className={`sm:w-4 sm:h-4 lg:w-6 lg:h-6 cursor-pointer hover:opacity-80 transition-opacity ${
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
                      className="w-4 h-4 lg:w-6 lg:h-6"
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
                      <div
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                          isDarkMode ? 'bg-[#4248FF]' : 'bg-[#D3E6FC4D]'
                        }`}
                      >
                        <Image
                          src="/SendVector.svg"
                          alt="Send"
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          width={24}
                          height={24}
                        />
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
                          <Image 
                            src="/MIC.svg" 
                            alt="MIC Icon" 
                            width={16}
                            height={16}
                            style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'none' }} 
                          />
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
        <div className="relative p-[2px] backdrop-blur-xl" style={{
          borderRadius: 'clamp(30px, 7vw, 50px)',
          background: 'conic-gradient(from -46.15deg at 50.76% 47.25%, #4248FF -40.22deg, #7FCAFE 50.49deg, #FFEB77 104.02deg, #4248FF 158.81deg, #FF4A19 224.78deg, #4248FF 319.78deg, #7FCAFE 410.49deg)',
          boxShadow: isDarkMode ? '0px 0px 12px 0px #4248ff54' : '0px 0px 27px 0px rgba(255, 255, 255, 0.75)'
        }}>
          <div className={`relative rounded-[48px] transition-all duration-300 ease-in-out ${
            isDarkMode ? 'bg-[#181819]' : 'bg-white'
          }`} style={{ 
            backgroundColor: isDarkMode ? '#181819' : '#ffffff',
            borderRadius: 'clamp(28px, 6.8vw, 48px)',
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
                    <Image 
                      src={selectedImage!} 
                      alt="Selected" 
                      className="h-16 rounded-lg" 
                      width={64} 
                      height={64} 
                    />
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
                      className={`w-full text-[20px] font-thin border-none bg-transparent px-0 focus:ring-0 focus:outline-none resize-none overflow-y-auto no-scrollbar relative z-10 transition-all duration-300 ease-in-out ${
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
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isDarkMode ? 'bg-[#4248FF]' : 'bg-[#D3E6FC4D]'
                          }`}
                        >
                          <Image
                            src="/SendVector.svg"
                            alt="Send"
                            className="w-3 h-3 sm:w-6 sm:h-4"
                            width={24}
                            height={24}
                          />
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
                          <Image 
                            src="/MIC.svg" 
                            alt="MIC Icon" 
                            width={16}
                            height={16}
                            style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'none' }} 
                          />
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
                        <Image 
                          src={selectedImage!} 
                          alt="Selected" 
                          className="h-12 w-12 rounded-lg object-cover" 
                          width={48}
                          height={48}
                        />
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
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isDarkMode ? 'bg-[#4248FF]' : 'bg-[#D3E6FC4D]'
                          }`}
                        >
                          <Image
                            src="/SendVector.svg"
                            alt="Send"
                            className="w-3 h-3 sm:w-6 sm:h-4"
                            width={24}
                            height={24}
                          />
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
                          <Image 
                            src="/MIC.svg" 
                            alt="MIC Icon" 
                            width={14}
                            height={14}
                            style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'none' }} 
                          />
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
})

ChatInput.displayName = 'ChatInput'

export default ChatInput