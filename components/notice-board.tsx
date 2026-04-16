"use client"

import { BookOpen, Pin, ChevronRight, Bell } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Notice {
  id: string
  title: string
  date: string
  isNew?: boolean
  isPinned?: boolean
}

const notices: Notice[] = [
  {
    id: "1",
    title: "봄 현장학습 안내 - 동물원 견학",
    date: "2026.04.25",
    isNew: true,
    isPinned: true,
  },
  {
    id: "2",
    title: "신입 원아 모집 안내 (5월)",
    date: "2026.04.20",
    isNew: true,
  },
  {
    id: "3",
    title: "어린이날 특별 행사 프로그램",
    date: "2026.04.18",
    isNew: true,
  },
  {
    id: "4",
    title: "4월 급식 식단표 안내",
    date: "2026.04.01",
  },
  {
    id: "5",
    title: "학부모 상담 주간 일정 안내",
    date: "2026.03.28",
  },
]

export function NoticeBoard() {
  return (
    <Card className="mx-4 overflow-hidden rounded-3xl border-2 border-secondary/50 bg-card">
      <CardHeader className="bg-secondary/30 pb-3 pt-4">
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <BookOpen className="h-4 w-4 text-secondary-foreground" />
          </div>
          원아 수첩
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {notices.map((notice) => (
            <li key={notice.id}>
              <button className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted">
                {notice.isPinned && (
                  <Pin className="h-4 w-4 shrink-0 text-primary" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {notice.title}
                    </span>
                    {notice.isNew && (
                      <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                        NEW
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{notice.date}</span>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
        
        <div className="border-t border-border p-3">
          <button className="flex w-full items-center justify-center gap-1 rounded-2xl bg-secondary/50 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/70">
            <Bell className="h-4 w-4" />
            전체 공지사항 보기
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
