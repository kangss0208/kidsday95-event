"use client"

import { useState, useEffect, useCallback } from "react"
import { SplashScreen } from "@/components/splash-screen"
import { CountdownTimer } from "@/components/countdown-timer"
import { TeacherIntro } from "@/components/teacher-intro"
import { LoginScreen } from "@/components/login-screen"
import { ChildDashboard } from "@/components/child-dashboard"
import { TeacherDashboard } from "@/components/teacher-dashboard"
import { Button } from "@/components/ui/button"
import { getCurrentChild, getIsTeacher } from "@/lib/store"
import { Users, Sparkles, KeyRound } from "lucide-react"
import type { Child } from "@/lib/types"

// Event date - change this to your actual event date
const EVENT_DATE = new Date('2026-05-05T10:00:00')

type AppScreen = 'splash' | 'pre-event' | 'login' | 'teacher-login' | 'child-dashboard' | 'teacher-dashboard'

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash')
  const [showTeacherIntro, setShowTeacherIntro] = useState(false)
  const [currentChild, setCurrentChildState] = useState<Child | null>(null)
  const [isTeacher, setIsTeacherState] = useState(false)
  const [isEventStarted, setIsEventStarted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Check if event has started
  useEffect(() => {
    const checkEventStatus = () => {
      const now = new Date()
      if (now >= EVENT_DATE) {
        setIsEventStarted(true)
      }
    }
    checkEventStatus()
  }, [])

  // Check existing session on mount
  useEffect(() => {
    const child = getCurrentChild()
    const teacher = getIsTeacher()

    if (child) {
      setCurrentChildState(child)
    } else if (teacher) {
      setIsTeacherState(true)
    }
    setIsLoaded(true)
  }, [])

  const handleSplashComplete = useCallback(() => {
    const child = getCurrentChild()
    const teacher = getIsTeacher()

    if (child) {
      setCurrentChildState(child)
      setCurrentScreen('child-dashboard')
    } else if (teacher) {
      setIsTeacherState(true)
      setCurrentScreen('teacher-dashboard')
    } else if (isEventStarted) {
      setCurrentScreen('login')
    } else {
      setCurrentScreen('pre-event')
    }
  }, [isEventStarted])

  const handleEventStart = useCallback(() => {
    setIsEventStarted(true)
  }, [])

  const handleLoginSuccess = (isTeacherLogin: boolean) => {
    if (isTeacherLogin) {
      setIsTeacherState(true)
      setCurrentScreen('teacher-dashboard')
    } else {
      const child = getCurrentChild()
      if (child) {
        setCurrentChildState(child)
        setCurrentScreen('child-dashboard')
      }
    }
  }

  const handleLogout = () => {
    setCurrentChildState(null)
    setIsTeacherState(false)
    if (isEventStarted) {
      setCurrentScreen('login')
    } else {
      setCurrentScreen('pre-event')
    }
  }

  // Don't render until loaded to avoid hydration mismatch
  if (!isLoaded) {
    return null
  }

  // Splash screen
  if (currentScreen === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  // Pre-event screen with countdown
  if (currentScreen === 'pre-event') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/10 via-background to-secondary/10">
        {/* Teacher Intro Modal */}
        {showTeacherIntro && (
          <TeacherIntro onClose={() => setShowTeacherIntro(false)} />
        )}

        {/* Header */}
        <div className="text-center pt-12 pb-8 px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border-2 border-primary/20 mb-4">
            <Sparkles className="w-4 h-4 text-secondary-foreground" />
            <span className="text-sm font-medium text-muted-foreground">특별한 어린이 이벤트</span>
          </div>
          <h1 className="text-4xl font-extrabold">
            <span className="text-primary">CARAT</span>
            <span className="text-foreground ml-2">9559</span>
          </h1>
          <p className="text-muted-foreground mt-2">곧 시작됩니다!</p>
        </div>

        {/* Countdown */}
        <div className="flex-1 flex flex-col justify-center">
          <CountdownTimer 
            targetDate={EVENT_DATE} 
            eventName="이벤트 시작까지"
            onEventStart={handleEventStart}
          />

          {/* Enter button when event starts */}
          {isEventStarted && (
            <div className="mt-6 px-4">
              <Button 
                onClick={() => setCurrentScreen('login')}
                className="w-full max-w-md mx-auto block h-14 rounded-2xl text-lg font-semibold"
              >
                입장하기
              </Button>
            </div>
          )}
        </div>

        {/* Bottom Buttons */}
        <div className="p-4 pb-8 space-y-3 max-w-md mx-auto w-full">
          <Button
            variant="outline"
            onClick={() => setShowTeacherIntro(true)}
            className="w-full h-12 rounded-2xl border-2"
          >
            <Users className="w-5 h-5 mr-2" />
            선생님 소개
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => setCurrentScreen('teacher-login')}
            className="w-full h-10 rounded-2xl text-muted-foreground hover:text-foreground"
          >
            <KeyRound className="w-4 h-4 mr-2" />
            관리자 로그인
          </Button>
        </div>
      </div>
    )
  }

  // Login screen
  if (currentScreen === 'login') {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />
  }

  // Teacher-only login screen (before event)
  if (currentScreen === 'teacher-login') {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} teacherOnly />
  }

  // Child dashboard
  if (currentScreen === 'child-dashboard' && currentChild) {
    return <ChildDashboard child={currentChild} onLogout={handleLogout} />
  }

  // Teacher dashboard
  if (currentScreen === 'teacher-dashboard' && isTeacher) {
    return <TeacherDashboard onLogout={handleLogout} />
  }

  // Fallback - should not happen
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Button onClick={() => setCurrentScreen('splash')}>
        다시 시작
      </Button>
    </div>
  )
}
