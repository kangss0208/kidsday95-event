"use client"

import { useState } from "react"
import { Cookie, Palette, Music, TreePine, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Activity {
  id: string
  type: "snack" | "activity"
  title: string
  description: string
  time: string
  icon: React.ReactNode
  color: string
  items?: string[]
}

const activities: Activity[] = [
  {
    id: "1",
    type: "snack",
    title: "오늘의 간식",
    description: "맛있는 과일과 우유",
    time: "오전 10:00",
    icon: <Cookie className="h-6 w-6" />,
    color: "bg-accent",
    items: ["사과", "바나나", "딸기 우유"],
  },
  {
    id: "2",
    type: "activity",
    title: "오늘의 활동",
    description: "봄꽃 그리기",
    time: "오전 10:30",
    icon: <Palette className="h-6 w-6" />,
    color: "bg-primary",
    items: ["크레파스", "도화지", "봄꽃 사진"],
  },
  {
    id: "3",
    type: "activity",
    title: "음악 시간",
    description: "동요 배우기",
    time: "오후 2:00",
    icon: <Music className="h-6 w-6" />,
    color: "bg-secondary",
    items: ["나비야", "곰 세 마리", "작은 별"],
  },
  {
    id: "4",
    type: "activity",
    title: "야외 활동",
    description: "봄나들이 준비",
    time: "오후 3:30",
    icon: <TreePine className="h-6 w-6" />,
    color: "bg-chart-4",
    items: ["모자", "물병", "돗자리"],
  },
]

export function ActivityCards() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % activities.length)
  }

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + activities.length) % activities.length)
  }

  const currentActivity = activities[currentIndex]

  return (
    <div className="mx-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Sparkles className="h-5 w-5 text-accent" />
          오늘의 하루
        </h2>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-2 border-primary/30"
            onClick={prevCard}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-2 border-primary/30"
            onClick={nextCard}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden rounded-3xl border-2 border-primary/20">
        <CardHeader className={`${currentActivity.color} pb-3 pt-4`}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card/80 text-foreground shadow-sm">
              {currentActivity.icon}
            </div>
            <div>
              <CardTitle className="text-base text-foreground">
                {currentActivity.title}
              </CardTitle>
              <p className="text-sm text-foreground/70">{currentActivity.time}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="mb-3 text-xl font-bold text-foreground">
            {currentActivity.description}
          </h3>
          
          {currentActivity.items && (
            <div className="flex flex-wrap gap-2">
              {currentActivity.items.map((item, index) => (
                <span
                  key={index}
                  className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 카드 인디케이터 */}
      <div className="mt-3 flex justify-center gap-2">
        {activities.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? "w-6 bg-primary"
                : "w-2 bg-primary/30"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
