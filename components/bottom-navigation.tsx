"use client"

import { useState } from "react"
import { Home, Calendar, Bell, MessageCircle, User } from "lucide-react"

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { id: "home", label: "홈", icon: <Home className="h-5 w-5" /> },
  { id: "calendar", label: "일정", icon: <Calendar className="h-5 w-5" /> },
  { id: "notice", label: "알림", icon: <Bell className="h-5 w-5" /> },
  { id: "message", label: "소통", icon: <MessageCircle className="h-5 w-5" /> },
  { id: "profile", label: "내 정보", icon: <User className="h-5 w-5" /> },
]

export function BottomNavigation() {
  const [activeId, setActiveId] = useState("home")

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-primary/10 bg-card/95 backdrop-blur-md">
      <div className="mx-auto max-w-md">
        <ul className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = item.id === activeId
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveId(item.id)}
                  className={`flex flex-col items-center gap-1 rounded-2xl px-4 py-2 transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div
                    className={`transition-transform ${
                      isActive ? "scale-110" : ""
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-semibold">{item.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-0.5 h-1 w-8 rounded-full bg-primary" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      {/* 아이폰 홈 인디케이터 영역 */}
      <div className="h-safe-area-inset-bottom bg-card" />
    </nav>
  )
}
