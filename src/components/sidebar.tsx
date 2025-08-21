"use client"

import { useState } from "react"
import { Menu, Settings, Edit3, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

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
    "create a presentation for"
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
        fixed left-0 top-0 h-full bg-white/60 backdrop-blur-xl border-r border-white/30 z-50 transition-all duration-300 ease-in-out
        ${isExpanded ? 'w-80' : 'w-20'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="pt-10 pb-6 px-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handleToggle}
                className="hover:bg-white/40 transition-colors rounded-lg p-1"
              >
                <Menu size={32} className="text-[#11002E]" />
              </button>
              
              {isExpanded && (
                <button className="hover:bg-white/40 transition-colors rounded-lg p-1">
                  <Search size={24} className="text-[#11002E]" />
                </button>
              )}
            </div>
          </div>

          {isExpanded ? (
            // Expanded Content
            <div className="flex flex-col flex-1 px-6">
              {/* New Chat */}
              <button className="flex items-center gap-3 p-3 hover:bg-white/40 transition-colors rounded-lg mb-6">
                <Edit3 size={20} className="text-[#11002E]" />
                <span className="text-[#11002E] font-medium">New Chat</span>
              </button>

              {/* Divider */}
              <div className="h-px bg-white/30 mb-4" />

              {/* Recent Section */}
              <div className="flex-1">
                <h3 className="text-[#11002E] font-medium mb-4">Recent</h3>
                <div className="space-y-2">
                  {recentChats.map((chat, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-3 hover:bg-white/40 transition-colors rounded-lg text-[#11002E]/70 text-sm"
                    >
                      {chat}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings Button */}
              <div className="pb-6">
                <button className="flex items-center gap-3 p-3 hover:bg-white/40 transition-colors rounded-lg w-full">
                  <Settings size={20} className="text-[#11002E]" />
                  <span className="text-[#11002E] font-medium">Settings & help</span>
                </button>
              </div>
            </div>
          ) : (
            // Collapsed Content
            <div className="flex flex-col items-center h-full">
              {/* New Chat Icon */}
              <div className="pb-6">
                <button className="hover:bg-white/40 transition-colors rounded-lg p-1">
                  <Edit3 size={24} className="text-[#11002E]" />
                </button>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Settings Button */}
              <div className="pb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 rounded-xl hover:bg-white/40 transition-colors"
                >
                  <Settings size={24} className="text-[#11002E]" />
                </Button>
              </div>
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