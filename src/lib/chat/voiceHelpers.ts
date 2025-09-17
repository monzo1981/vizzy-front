// Voice recording helper functions extracted from chat page
// Provides reusable voice recording functionality with proper TypeScript types

import React from 'react';

// Type definitions
export interface VoiceRecordingHandlers {
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  audioChunksRef: React.MutableRefObject<Blob[]>;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  onRecordingStart?: () => void;
  onRecordingComplete?: (base64Audio: string) => Promise<void>;
  onError?: (error: string) => void;
}

export interface VoiceRecordingOptions {
  mimeType?: string;
}

// Function to start voice recording
export const startRecording = async (
  handlers: VoiceRecordingHandlers,
  options: VoiceRecordingOptions = {}
): Promise<void> => {
  const {
    mediaRecorderRef,
    audioChunksRef,
    setIsRecording,
    onRecordingStart,
    onRecordingComplete,
    onError
  } = handlers;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = options.mimeType || 
      (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm');
    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    
    audioChunksRef.current = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      if (audioBlob.size > 0) {
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          const base64AudioWithPrefix = reader.result as string;
          const base64Audio = base64AudioWithPrefix.split(',')[1];
          
          if (onRecordingComplete) {
            await onRecordingComplete(base64Audio);
          }
        };
        
        reader.readAsDataURL(audioBlob);
      }
      
      stream.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    
    if (onRecordingStart) {
      onRecordingStart();
    }
  } catch (error) {
    console.error("Error accessing microphone:", error);
    const errorMessage = "Could not access microphone. Please check permissions.";
    if (onError) {
      onError(errorMessage);
    }
  }
};

// Function to stop voice recording
export const stopRecording = (handlers: VoiceRecordingHandlers): void => {
  const { mediaRecorderRef, isRecording, setIsRecording } = handlers;
  
  if (mediaRecorderRef.current && isRecording) {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  }
};

// Function to cancel voice recording
export const cancelRecording = (handlers: VoiceRecordingHandlers): void => {
  const { mediaRecorderRef, audioChunksRef, isRecording, setIsRecording } = handlers;
  
  if (mediaRecorderRef.current && isRecording) {
    mediaRecorderRef.current.onstop = () => { 
      console.log("Recording cancelled.");
      mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
    };
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    audioChunksRef.current = [];
  }
};

// Function to toggle voice recording
export const toggleRecording = async (
  handlers: VoiceRecordingHandlers,
  options: VoiceRecordingOptions = {}
): Promise<void> => {
  const { isRecording } = handlers;
  
  if (isRecording) {
    stopRecording(handlers);
  } else {
    await startRecording(handlers, options);
  }
};