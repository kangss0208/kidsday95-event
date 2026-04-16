"use client"

import { useState, useCallback } from "react"
import { IntroScreen } from "@/components/intro-screen"
import { Header } from "@/components/header"
import { CountdownTimer } from "@/components/countdown-timer"
import { NoticeBoard } from "@/components/notice-board"
import { ActivityCards } from "@/components/activity-cards"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Baby, Heart, Flower2 } from "lucide-react"

export default function Home() {
  const [showIntro, setShowIntro] = useState(true)

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false)
  }, [])

  // 이벤트 날짜 설정 (예: 2026년 5월 5일 어린이날)
  const eventDate = new Date("2026-05-05T10:00:00")

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 인트로 화면 */}
      {showIntro && <IntroScreen onComplete={handleIntroComplete} />}

      {/* 메인 컨텐츠 */}
      <div
        className={`transition-opacity duration-500 ${
          showIntro ? "opacity-0" : "opacity-100"
        }`}
      >
        <Header />

        <main className="mx-auto max-w-md">
          {/* 환영 배너 */}
          <section className="relative mx-4 mt-4 overflow-hidden rounded-3xl bg-primary p-5">
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2">
                <Baby className="h-5 w-5 text-primary-foreground" />
                <span className="text-sm font-semibold text-primary-foreground/80">
                  2026 봄 현장학습
                </span>
              </div>
              <h2 className="text-xl font-bold text-primary-foreground leading-relaxed">
                우리 아이들과 함께하는
                <br />
                특별한 봄 나들이
              </h2>
              <p className="mt-2 text-sm text-primary-foreground/70">
                동물원에서 만나는 신기한 동물 친구들!
              </p>
            </div>
            {/* 장식 요소 */}
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary-foreground/10" />
            <div className="absolute -bottom-2 right-8 h-16 w-16 rounded-full bg-primary-foreground/10" />
            <Flower2 className="absolute bottom-4 right-4 h-8 w-8 text-primary-foreground/30" />
          </section>

          {/* 디데이 카운트다운 */}
          <section className="mt-6">
            <CountdownTimer targetDate={eventDate} eventName="어린이날 특별 행사" />
          </section>

          {/* 오늘의 활동 카드 */}
          <section className="mt-6">
            <ActivityCards />
          </section>

          {/* 공지사항 (원아 수첩) */}
          <section className="mt-6">
            <NoticeBoard />
          </section>

          {/* 원아 모집 배너 */}
          <section className="mx-4 mt-6">
            <div className="relative overflow-hidden rounded-3xl bg-secondary p-5">
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    신입 원아 모집
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  2026년 5월 신입 원아를
                  <br />
                  모집합니다!
                </h3>
                <button className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105 active:scale-95">
                  자세히 보기
                </button>
              </div>
              {/* 장식 요소 */}
              <div className="absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-primary/10" />
              <div className="absolute right-16 bottom-2 h-12 w-12 rounded-full bg-accent/30" />
            </div>
          </section>

          {/* 하단 여백 */}
          <div className="h-8" />
        </main>

        <BottomNavigation />
      </div>
    </div>
  )
}
