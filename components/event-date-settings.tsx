"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, Settings, CheckCircle2, AlertCircle, MapPin, Trash2, Plus, FileText, Upload } from "lucide-react"
import { getEventDate, setEventDate, getMeetingPoints, saveMeetingPoints, getConsentFormUrl, uploadConsentForm } from "@/lib/store"
import type { MeetingPoint } from "@/lib/types"

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
  // ── 이벤트 날짜 ──────────────────────────────────────────────
  const [current, setCurrent] = useState<Date | null>(null)
  const [dateInput, setDateInput] = useState('')
  const [timeInput, setTimeInput] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [error, setError] = useState('')

  // ── 집합 장소 ────────────────────────────────────────────────
  const [meetingPoints, setMeetingPoints] = useState<MeetingPoint[]>([])
  const [newName, setNewName] = useState('')
  const [newLat, setNewLat] = useState('')
  const [newLng, setNewLng] = useState('')
  const [pointSaveMsg, setPointSaveMsg] = useState('')
  const [pointError, setPointError] = useState('')

  // ── 동의서 업로드 ────────────────────────────────────────────
  const [consentUrl, setConsentUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [d, points, url] = await Promise.all([getEventDate(), getMeetingPoints(), getConsentFormUrl()])
        if (cancelled) return
        setCurrent(d)
        setDateInput(toDateInput(d))
        setTimeInput(toTimeInput(d))
        setMeetingPoints(points)
        setConsentUrl(url)
      } catch (err) {
        console.error('Failed to load settings', err)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const handleSaveDate = async () => {
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
    try {
      await setEventDate(combined)
      setCurrent(combined)
      setSaveMessage('저장되었어요. 다음 진입부터 반영됩니다.')
    } catch (err) {
      console.error('Failed to save event date', err)
      setError('저장 중 오류가 발생했어요.')
    }
  }

  const handleAddPoint = async () => {
    setPointError('')
    setPointSaveMsg('')
    const lat = parseFloat(newLat)
    const lng = parseFloat(newLng)
    if (!newName.trim()) { setPointError('장소 이름을 입력해주세요'); return }
    if (isNaN(lat) || isNaN(lng)) { setPointError('위도/경도를 올바르게 입력해주세요'); return }
    const next: MeetingPoint[] = [
      ...meetingPoints,
      { id: Date.now().toString(), name: newName.trim(), lat, lng },
    ]
    try {
      await saveMeetingPoints(next)
      setMeetingPoints(next)
      setNewName('')
      setNewLat('')
      setNewLng('')
      setPointSaveMsg('장소가 추가되었어요!')
    } catch (err) {
      console.error('Failed to save meeting points', err)
      setPointError('저장 중 오류가 발생했어요.')
    }
  }

  const handleDeletePoint = async (id: string) => {
    const next = meetingPoints.filter(p => p.id !== id)
    try {
      await saveMeetingPoints(next)
      setMeetingPoints(next)
    } catch (err) {
      console.error('Failed to delete meeting point', err)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadMsg('')
    setUploadError('')
    try {
      const url = await uploadConsentForm(file)
      setConsentUrl(url)
      setUploadMsg('동의서가 업로드되었어요!')
    } catch (err) {
      console.error('Failed to upload consent form', err)
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      setUploadError('업로드 실패: ' + msg)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (!current) return null

  const hasChanges = dateInput !== toDateInput(current) || timeInput !== toTimeInput(current)
  const started = new Date() >= current

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          설정
        </h2>
      </div>

      {/* 이벤트 D-day */}
      <Card className="rounded-3xl border-2 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            이벤트 D-day
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`p-4 rounded-2xl ${started ? 'bg-secondary/20' : 'bg-primary/10'}`}>
            <p className="text-xs text-muted-foreground mb-1">현재 설정</p>
            <p className="text-lg font-bold text-foreground">{formatPretty(current)}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="w-3.5 h-3.5" />
              {formatRemaining(current)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">날짜</label>
              <Input type="date" value={dateInput} onChange={(e) => { setDateInput(e.target.value); setSaveMessage('') }} className="rounded-xl h-12" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">시간</label>
              <Input type="time" value={timeInput} onChange={(e) => { setTimeInput(e.target.value); setSaveMessage('') }} className="rounded-xl h-12" />
            </div>
          </div>

          {error && <p className="text-destructive text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{error}</p>}
          {saveMessage && <p className="text-primary text-sm flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{saveMessage}</p>}

          <Button onClick={handleSaveDate} disabled={!hasChanges} className="w-full rounded-xl h-12">저장하기</Button>
          <p className="text-xs text-muted-foreground">저장 후 로그아웃하면 카운트다운과 입장 화면에 새 D-day가 반영됩니다.</p>
        </CardContent>
      </Card>

      {/* 집합 장소 관리 */}
      <Card className="rounded-3xl border-2 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            집합 장소 관리
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">아이마다 자동으로 다른 장소가 배정돼요. 장소가 1개면 모두 같은 곳으로 배정됩니다.</p>

          {meetingPoints.length > 0 && (
            <div className="space-y-2">
              {meetingPoints.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 p-3 rounded-2xl bg-muted/50">
                  <span className="text-xs font-bold text-primary w-5 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.lat}, {p.lng}</p>
                  </div>
                  <button onClick={() => handleDeletePoint(p.id)} className="p-1.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground">장소 추가</p>
            <Input placeholder="장소 이름 (예: 서울역 10번 출구)" value={newName} onChange={e => { setNewName(e.target.value); setPointSaveMsg(''); setPointError('') }} className="rounded-xl h-11" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="위도 (예: 37.5544)" value={newLat} onChange={e => setNewLat(e.target.value)} className="rounded-xl h-11" />
              <Input placeholder="경도 (예: 126.9717)" value={newLng} onChange={e => setNewLng(e.target.value)} className="rounded-xl h-11" />
            </div>
            {pointError && <p className="text-destructive text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{pointError}</p>}
            {pointSaveMsg && <p className="text-primary text-sm flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{pointSaveMsg}</p>}
            <Button onClick={handleAddPoint} className="w-full rounded-xl h-11" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              장소 추가
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 동의서 업로드 */}
      <Card className="rounded-3xl border-2 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            현장학습 동의서 양식
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">업로드한 이미지가 아이들의 '신청서' 탭에 표시됩니다.</p>

          {consentUrl && (
            <img src={consentUrl} alt="현재 동의서" className="w-full rounded-2xl border border-border" />
          )}

          {uploadError && <p className="text-destructive text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{uploadError}</p>}
          {uploadMsg && <p className="text-primary text-sm flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{uploadMsg}</p>}

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full rounded-xl h-12">
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? '업로드 중...' : consentUrl ? '다시 업로드' : '동의서 업로드'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
