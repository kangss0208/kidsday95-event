"use client"

import { useState, useEffect } from "react"
import { Sun, Cloud, Star } from "lucide-react"

interface IntroScreenProps {
  onComplete: () => void
}

export function IntroScreen({ onComplete }: IntroScreenProps) {
  const [phase, setPhase] = useState<"logo" | "welcome" | "done">("logo")

  useEffect(() => {
    const logoTimer = setTimeout(() => {
      setPhase("welcome")
    }, 2000)

    const welcomeTimer = setTimeout(() => {
      setPhase("done")
      onComplete()
    }, 4500)

    return () => {
      clearTimeout(logoTimer)
      clearTimeout(welcomeTimer)
    }
  }, [onComplete])

  if (phase === "done") return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* 배경 장식 요소들 */}
      <div className="absolute inset-0 overflow-hidden">
        <Cloud className="absolute top-10 left-10 h-12 w-12 text-secondary animate-bounce" style={{ animationDelay: "0s" }} />
        <Star className="absolute top-20 right-16 h-8 w-8 text-accent animate-pulse" style={{ animationDelay: "0.5s" }} />
        <Cloud className="absolute bottom-32 right-10 h-10 w-10 text-secondary animate-bounce" style={{ animationDelay: "1s" }} />
        <Star className="absolute bottom-20 left-16 h-6 w-6 text-accent animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      {/* 로고 페이즈 */}
      <div
        className={`flex flex-col items-center gap-6 transition-opacity duration-1000 ${
          phase === "logo" ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="relative">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary shadow-lg">
            <Sun className="h-16 w-16 text-primary-foreground animate-spin" style={{ animationDuration: "8s" }} />
          </div>
          <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-accent" />
          <div className="absolute -bottom-1 -left-3 h-6 w-6 rounded-full bg-secondary" />
        </div>
        <h1 className="text-3xl font-extrabold text-primary">햇살 어린이집</h1>
      </div>

      {/* 환영 메시지 페이즈 */}
      <div
        className={`absolute flex flex-col items-center gap-4 px-8 text-center transition-opacity duration-1000 ${
          phase === "welcome" ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-2">
          <Star className="h-6 w-6 text-accent animate-pulse" />
          <Star className="h-8 w-8 text-primary animate-pulse" style={{ animationDelay: "0.3s" }} />
          <Star className="h-6 w-6 text-accent animate-pulse" style={{ animationDelay: "0.6s" }} />
        </div>
        <h2 className="text-2xl font-bold text-foreground leading-relaxed">
          햇살 어린이집에
          <br />
          오신 것을 환영합니다!
        </h2>
        <p className="text-muted-foreground">우리 아이들의 꿈이 자라는 곳</p>
      </div>
    </div>
  )
}
