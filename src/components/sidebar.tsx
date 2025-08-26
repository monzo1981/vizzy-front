"use client"

import { useState } from "react"
import { Menu, Search, Edit2, Settings } from "lucide-react"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function Sidebar({ onToggle }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggle = () => {
    if (!isExpanded) {
      setIsExpanded(true)
    } else {
      setIsExpanded(false)
    }
    onToggle()
  }

  const recentChats = [
    "i need a new design for",
    "create a SM calendar for",
    "New ways to market my",
    "analysis my business's",
    "i need a new design for",
    "create a SM calendar for",
    "New ways to market my",
    "analysis my business's",
    "i need a new design for",
    "create a SM calendar for",
    "New ways to market my",
    "analysis my business's",
    "i need a new design for",
    "create a SM calendar for",
    "New ways to market my",
    "analysis my business's",
    "i need a new design for",
    "create a SM calendar for",
    "New ways to market my",
    "analysis my business's"
  ]

  return (
    <>
      {/* Overlay */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-white/40 backdrop-blur-xl border-r border-white/20 z-50 transition-all duration-300 ease-in-out
        ${isExpanded ? 'w-72' : 'w-20'}
      `}>
        <div className="flex flex-col h-full">
          {isExpanded ? (
            // Expanded Content
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-10 pb-4">
                <button
                  onClick={handleToggle}
                  className="p-2 hover:bg-white/40 transition-colors rounded-lg"
                  aria-label="Toggle menu"
                >
                  <Menu size={24} className="text-gray-700" />
                </button>
                
                <button 
                  className="p-2 hover:bg-white/40 transition-colors rounded-lg"
                  aria-label="Search"
                >
                  <Search size={20} className="text-gray-700" />
                </button>
              </div>

              <div className="flex flex-col flex-1 px-4 overflow-hidden">
                {/* New Chat */}
                <button className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/40 transition-colors rounded-lg mb-4">
                  <Edit2 size={18} className="text-gray-700" />
                  <span className="text-gray-700 text-sm font-medium">New Chat</span>
                </button>

                {/* Divider */}
                <div className="h-px bg-white/30 mb-4" />

                {/* Recent Section */}
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-gray-700 text-sm font-medium mb-3 px-3">Recent</h3>
                  <div 
                    className="space-y-1 overflow-y-auto max-h-[calc(100vh-240px)] pr-2"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent'
                    }}
                  >
                    {recentChats.map((chat, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-3 py-2 hover:bg-white/40 transition-colors rounded-lg group"
                      >
                        <span className="text-gray-600 text-sm truncate block">
                          {chat}
                          <span className="text-gray-400">...</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Settings Button */}
                <div className="pt-4 pb-4 border-t border-white/30">
                  <button className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/40 transition-colors rounded-lg w-full">
                    <img src="/settings.svg" alt="Settings" className="w-5 h-5" />
                    <span className="text-gray-700 text-sm font-medium">Settings & help</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            // Collapsed Content
            <div className="flex flex-col items-center h-full pt-10 pb-4 px-2">
              {/* Menu Icon */}
              <button
                onClick={handleToggle}
                className="p-2 hover:bg-white/40 transition-colors rounded-lg mb-4"
                aria-label="Toggle menu"
              >
                <Menu size={24} className="text-gray-700" />
              </button>

              {/* New Chat Icon */}
              <button 
                className="p-2 hover:bg-white/40 transition-colors rounded-lg mb-4"
                aria-label="New chat"
              >
                <Edit2 size={20} className="text-gray-700" />
              </button>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Settings Icon */}
              <button 
                className="p-2 hover:bg-white/40 transition-colors rounded-lg"
                aria-label="Settings"
              >
                <img src="/settings.svg" alt="Settings" className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export function useSidebar() {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => setIsOpen(!isOpen)
  const close = () => setIsOpen(false)
  const open = () => setIsOpen(true)

  return {
    isOpen,
    toggle,
    close,
    open
  }
}