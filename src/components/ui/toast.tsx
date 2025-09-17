"use client"

import React, { useState, useEffect } from 'react'

export interface Toast {
  id: string
  type: 'success' | 'error'
  title: string
  description?: string
  duration?: number
}

interface ToastProps extends Toast {
  onRemove: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({ id, type, title, description, duration = 3000, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Show animation
    const showTimer = setTimeout(() => setIsVisible(true), 100)
    
    // Auto remove
    const hideTimer = setTimeout(() => {
      setIsLeaving(true)
      setTimeout(() => onRemove(id), 300)
    }, duration)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [id, duration, onRemove])

  const icons = {
    success: <img src="/success-icon.svg" alt="Success" className="h-5 w-5" />,
    error: <img src="/error-icon.svg" alt="Error" className="h-5 w-5" />
  }

  const bgColors = {
    success: 'bg-green-50/90 border-green-200 dark:bg-green-900/40 dark:border-green-800',
    error: 'bg-red-50/90 border-red-200 dark:bg-red-900/40 dark:border-red-800'
  }

  return (
    <div
      className={`
        relative flex items-start gap-3 p-4 border backdrop-blur-sm
        ${(type !== 'success' && type !== 'error') ? bgColors[type] : 'border-gray-200'}
        transition-all duration-300 ease-out
        ${isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
        max-w-sm w-full shadow-lg
      `}
      style={{
        ...((type === 'success' || type === 'error') ? { background: 'linear-gradient(270.24deg, #FFFFFF -10.7%, #D3E6FC 104.21%)' } : {}),
        borderTopLeftRadius: '14px',
        borderTopRightRadius: '6px',
        borderBottomRightRadius: '6px',
        borderBottomLeftRadius: '14px'
      }}
    >
      {icons[type]}
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${(type === 'success' || type === 'error') ? '' : 'font-medium text-gray-900 dark:text-gray-100'}`} 
           style={(type === 'success' || type === 'error') ? { color: '#000', fontWeight: 300 } : {}}>
          {title}
        </p>
        {description && (
          <p className={`mt-1 text-sm ${(type === 'success' || type === 'error') ? '' : 'text-gray-600 dark:text-gray-300'}`}
             style={(type === 'success' || type === 'error') ? { color: '#000', fontWeight: 200 } : {}}>
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

// Hook للاستخدام السهل
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const toast = {
    success: (title: string, description?: string) => 
      addToast({ type: 'success', title, description }),
    error: (title: string, description?: string) => 
      addToast({ type: 'error', title, description })
  }

  return {
    toasts,
    toast,
    removeToast
  }
}
