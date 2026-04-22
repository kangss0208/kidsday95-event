'use client';

import { useState, useEffect, useCallback } from 'react';
import { SplashScreen } from '@/components/splash-screen';
import { CountdownTimer } from '@/components/countdown-timer';
import { TeacherIntro } from '@/components/teacher-intro';
import { LoginScreen, type LoginRole } from '@/components/login-screen';
import { ChildDashboard } from '@/components/child-dashboard';
import { TeacherDashboard } from '@/components/teacher-dashboard';
import { AdminDashboard } from '@/components/admin-dashboard';
import { Button } from '@/components/ui/button';
import { getCurrentChild, getIsAdmin, getTeacherClass, getEventDate } from '@/lib/store';
import { Users, Sparkles } from 'lucide-react';
import type { Child } from '@/lib/types';

// Default fallback — actual value is loaded from store on mount (see useEffect)
const DEFAULT_EVENT_DATE = new Date('2026-04-20T10:00:00');

type AppScreen = 'splash' | 'pre-event' | 'login' | 'admin-login' | 'child-dashboard' | 'teacher-dashboard' | 'admin-dashboard';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash');
  const [screenStack, setScreenStack] = useState<AppScreen[]>([]);
  const [showTeacherIntro, setShowTeacherIntro] = useState(false);
  const [currentChild, setCurrentChildState] = useState<Child | null>(null);
  const [isAdmin, setIsAdminState] = useState(false);
  const [teacherClass, setTeacherClassState] = useState<string | null>(null);
  const [isEventStarted, setIsEventStarted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [eventDate, setEventDateState] = useState<Date>(DEFAULT_EVENT_DATE);

  // push=true: 히스토리 추가 (스와이프백 가능), push=false: replace (스와이프백 불가)
  const navigateTo = useCallback((screen: AppScreen, push = false) => {
    setCurrentScreen(screen);
    if (push) {
      window.history.pushState({ screen }, '');
      setScreenStack((prev) => [...prev, screen]);
    } else {
      window.history.replaceState({ screen }, '');
      setScreenStack([screen]);
    }
  }, []);

  // iOS 스와이프-백 / 브라우저 뒤로가기 처리
  useEffect(() => {
    const onPop = () => {
      setScreenStack((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev[prev.length - 2];
        setCurrentScreen(next);
        return prev.slice(0, -1);
      });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Load event date + check existing session on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const storedDate = await getEventDate();
        if (cancelled) return;
        setEventDateState(storedDate);
        if (new Date() >= storedDate) {
          setIsEventStarted(true);
        }
      } catch (err) {
        console.error('Failed to load event date', err);
      }

      const child = getCurrentChild();
      const admin = getIsAdmin();
      const tClass = getTeacherClass();
      if (cancelled) return;
      if (child) {
        setCurrentChildState(child);
      } else if (tClass) {
        setTeacherClassState(tClass);
      } else if (admin) {
        setIsAdminState(true);
      }
      setIsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSplashComplete = useCallback(() => {
    const child = getCurrentChild();
    const admin = getIsAdmin();
    const tClass = getTeacherClass();

    if (child) {
      setCurrentChildState(child);
      navigateTo('child-dashboard');
    } else if (tClass) {
      setTeacherClassState(tClass);
      navigateTo('teacher-dashboard');
    } else if (admin) {
      setIsAdminState(true);
      navigateTo('admin-dashboard');
    } else if (isEventStarted) {
      navigateTo('login');
    } else {
      navigateTo('pre-event');
    }
  }, [isEventStarted, navigateTo]);

  const handleEventStart = useCallback(() => {
    setIsEventStarted(true);
  }, []);

  const handleLoginSuccess = (role: LoginRole) => {
    if (role === 'admin') {
      setIsAdminState(true);
      navigateTo('admin-dashboard');
    } else if (role === 'teacher') {
      const tClass = getTeacherClass();
      setTeacherClassState(tClass);
      navigateTo('teacher-dashboard');
    } else {
      const child = getCurrentChild();
      if (child) {
        setCurrentChildState(child);
        navigateTo('child-dashboard');
      }
    }
  };

  const handleLogout = () => {
    setCurrentChildState(null);
    setIsAdminState(false);
    setTeacherClassState(null);
    if (isEventStarted) {
      navigateTo('login');
    } else {
      navigateTo('pre-event');
    }
  };

  // Don't render until loaded to avoid hydration mismatch
  if (!isLoaded) {
    return null;
  }

  // Splash screen
  if (currentScreen === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Pre-event screen with countdown
  if (currentScreen === 'pre-event') {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/10 via-background to-secondary/10">
        {/* Teacher Intro Modal */}
        {showTeacherIntro && <TeacherIntro onClose={() => setShowTeacherIntro(false)} />}

        {/* Header */}
        <div className="text-center pt-12 pb-8 px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border-2 border-primary/20 mb-4">
            <Sparkles className="w-4 h-4 text-secondary-foreground" />
            <span className="text-sm font-medium text-muted-foreground">제1회 뮤우어린이집 현장학습</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="text-primary" style={{ textShadow: '#adadad 1px 1px 1px' }}>95들</span>
            <span className='text-3xl'>과</span>
            <span
              className="text-[rgb(219,_232,_255)] ml-2 max-[380px]:block max-[380px]:ml-0"
              style={{ textShadow: '#adadad 1px 1px 1px' }}
            >
              키링언니들
            </span>
          </h1>
          <p className="text-muted-foreground mt-2"></p>
        </div>

        {/* Countdown */}
        <div className="flex-1 flex flex-col justify-center">
          <CountdownTimer targetDate={eventDate} eventName="이벤트 시작까지" onEventStart={handleEventStart} />

          {/* Enter button - always visible */}
          <div className="mt-6 px-4">
            <Button
              onClick={() => navigateTo('login', true)} // push: 로그인에서 스와이프백 → pre-event
              className="w-full max-w-md mx-auto block h-14 rounded-2xl text-lg font-semibold">
              {isEventStarted ? '입장하기' : '로그인하기'}
            </Button>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="p-4 pb-8 space-y-3 max-w-md mx-auto w-full">
          <Button
            variant="outline"
            onClick={() => setShowTeacherIntro(true)}
            className="w-full h-12 rounded-2xl border-2">
            <Users className="w-5 h-5 mr-2" />
            선생님 소개
          </Button>
        </div>
      </div>
    );
  }

  // Login screen
  if (currentScreen === 'login') {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        isEventStarted={isEventStarted}
        onBack={!isEventStarted ? () => navigateTo('pre-event') : undefined}
      />
    );
  }

  // Admin-only login screen (before event, backstage access)
  if (currentScreen === 'admin-login') {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} adminOnly onBack={() => navigateTo('pre-event')} />;
  }

  // Child dashboard
  if (currentScreen === 'child-dashboard' && currentChild) {
    return <ChildDashboard child={currentChild} onLogout={handleLogout} />;
  }

  // Teacher dashboard (class-scoped)
  if (currentScreen === 'teacher-dashboard' && teacherClass) {
    return <TeacherDashboard teacherClass={teacherClass} onLogout={handleLogout} />;
  }

  // Admin dashboard (full access)
  if (currentScreen === 'admin-dashboard' && isAdmin) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  // Fallback - should not happen
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Button onClick={() => navigateTo('splash')}>다시 시작</Button>
    </div>
  );
}
