"use client"

import React from 'react'

interface TutorialCardProps {
  title: string
  subtitle: string
  onNext: () => void
  onSkip: () => void
  className?: string
  style?: React.CSSProperties
  borderRadius?: "default" | "second" | "third"
}

const TutorialCard: React.FC<TutorialCardProps> = ({ 
  title, 
  subtitle, 
  onNext, 
  onSkip, 
  className = "",
  style = {},
  borderRadius = "default"
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

export default TutorialCard