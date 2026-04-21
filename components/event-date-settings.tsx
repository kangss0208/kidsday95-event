"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, Settings, CheckCircle2, AlertCircle } from "lucide-react"
import { getEventDate, setEventDate } from "@/lib/store"

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toTimeInput(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatPretty(d: Date): string {
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

function formatRemaining(target: Date): string {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return '이벤트가 이미 시작됐어요'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / 1000 / 60) % 60)
  if (days > 0) return `${days}일 ${hours}시간 ${minutes}분 남음`
  if (hours > 0) return `${hours}시간 ${minutes}분 남음`
  return `${minutes}분 남음`
}

export function EventDateSettings() {
  const [current, setCurrent] = useState<Date | null>(null)
  const [dateInput, setDateInput] = useState('')
  const [timeInput, setTimeInput] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const d = getEventDate()
    setCurrent(d)
    setDateInput(toDateInput(d))
    setTimeInput(toTimeInput(d))
  }, [])

  const handleSave = () => {
    setError('')
    setSaveMessage('')
    if (!dateInput || !timeInput) {
      setError('날짜와 시간을 모두 입력해주세요')
      return
    }
    const combined = new Date(`${dateInput}T${timeInput}:00`)
    if (isNaN(combined.getTime())) {
      setError('올바른 날짜/시간을 입력해주세요')
      return
    }
    setEventDate(combined)
    setCurrent(combined)
    setSaveMessage('저장되었어요. 다음 진입부터 반영됩니다.')
  }

  if (!current) return null

  const hasChanges =
    dateInput !== toDateInput(current) || timeInput !== toTimeInput(current)
  const started = new Date() >= current

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          설정
        </h2>
      </div>

      <Card className="rounded-3xl border-2 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            이벤트 D-day
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`p-4 rounded-2xl ${
              started ? 'bg-secondary/20' : 'bg-primary/10'
            }`}
          >
            <p className="text-xs text-muted-foreground mb-1">현재 설정</p>
            <p className="text-lg font-bold text-foreground">
              {formatPretty(current)}
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="w-3.5 h-3.5" />
              {formatRemaining(current)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                날짜
              </label>
              <Input
                type="date"
                value={dateInput}
                onChange={(e) => {
                  setDateInput(e.target.value)
                  setSaveMessage('')
                }}
                className="rounded-xl h-12"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                시간
              </label>
              <Input
                type="time"
                value={timeInput}
                onChange={(e) => {
                  setTimeInput(e.target.value)
                  setSaveMessage('')
                }}
                className="rounded-xl h-12"
              />
            </div>
          </div>

          {error && (
            <p className="text-destructive text-sm flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}

          {saveMessage && (
            <p className="text-primary text-sm flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              {saveMessage}
            </p>
          )}

          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="w-full rounded-xl h-12"
          >
            저장하기
          </Button>

          <p className="text-xs text-muted-foreground">
            저장 후 로그아웃하면 카운트다운과 입장 화면에 새 D-day가 반영됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
