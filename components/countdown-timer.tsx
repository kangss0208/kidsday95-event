"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface CountdownTimerProps {
  targetDate: Date
  eventName: string
}

export function CountdownTimer({ targetDate, eventName }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime()

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        }
      }

      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
        <span className="text-2xl font-bold">{String(value).padStart(2, "0")}</span>
      </div>
      <span className="mt-2 text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  )

  if (!isClient) {
    return (
      <Card className="mx-4 overflow-hidden rounded-3xl border-2 border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Calendar className="h-5 w-5" />
            <span className="font-semibold">{eventName}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-4 overflow-hidden rounded-3xl border-2 border-primary/20 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-center gap-2 text-primary">
          <Calendar className="h-5 w-5" />
          <span className="font-semibold">{eventName}</span>
        </div>
        
        <div className="flex items-center justify-center gap-3">
          <TimeBlock value={timeLeft.days} label="일" />
          <div className="flex flex-col gap-2 pb-6">
            <div className="h-2 w-2 rounded-full bg-primary/60" />
            <div className="h-2 w-2 rounded-full bg-primary/60" />
          </div>
          <TimeBlock value={timeLeft.hours} label="시간" />
          <div className="flex flex-col gap-2 pb-6">
            <div className="h-2 w-2 rounded-full bg-primary/60" />
            <div className="h-2 w-2 rounded-full bg-primary/60" />
          </div>
          <TimeBlock value={timeLeft.minutes} label="분" />
          <div className="flex flex-col gap-2 pb-6">
            <div className="h-2 w-2 rounded-full bg-primary/60" />
            <div className="h-2 w-2 rounded-full bg-primary/60" />
          </div>
          <TimeBlock value={timeLeft.seconds} label="초" />
        </div>

        <div className="mt-4 flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>이벤트까지 남은 시간</span>
        </div>
      </CardContent>
    </Card>
  )
}
