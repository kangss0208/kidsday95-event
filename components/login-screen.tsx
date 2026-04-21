"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Baby,
  GraduationCap,
  ArrowLeft,
  Sparkles,
  User,
  Lock,
  Clock
} from "lucide-react"
import {
  getChildren,
  saveChild,
  findChildByNameAndPassword,
  setCurrentChild,
  setIsTeacher,
  TEACHER_PASSWORD
} from "@/lib/store"
import type { Child } from "@/lib/types"

type LoginMode = 'select' | 'child-login' | 'child-register' | 'teacher'

interface LoginScreenProps {
  onLoginSuccess: (isTeacher: boolean) => void
  teacherOnly?: boolean
  isEventStarted?: boolean
  onBack?: () => void
}

export function LoginScreen({ onLoginSuccess, teacherOnly = false, isEventStarted = true, onBack }: LoginScreenProps) {
  const [mode, setMode] = useState<LoginMode>(teacherOnly ? 'teacher' : 'select')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleChildLogin = async () => {
    setError('')
    if (!name.trim() || !password.trim()) {
      setError('이름과 비밀번호를 입력해주세요')
      return
    }

    setBusy(true)
    try {
      const child = await findChildByNameAndPassword(name.trim(), password)
      if (child) {
        setCurrentChild(child)
        onLoginSuccess(false)
      } else {
        setError('일치하는 정보가 없어요. 처음이라면 등록해주세요!')
      }
    } catch (err) {
      console.error(err)
      setError('로그인 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setBusy(false)
    }
  }

  const handleChildRegister = async () => {
    setError('')
    if (!name.trim()) {
      setError('이름을 입력해주세요')
      return
    }
    if (password.length !== 4 || !/^\d{4}$/.test(password)) {
      setError('비밀번호는 숫자 4자리로 입력해주세요')
      return
    }

    setBusy(true)
    try {
      const existingChildren = await getChildren()
      if (existingChildren.some(c => c.name === name.trim() && c.password === password)) {
        setError('이미 등록된 이름과 비밀번호예요')
        return
      }

      const newChild: Child = {
        id: crypto.randomUUID(),
        name: name.trim(),
        password,
        className: '',
        teacherName: '',
        createdAt: new Date().toISOString(),
      }

      await saveChild(newChild)
      setCurrentChild(newChild)
      onLoginSuccess(false)
    } catch (err) {
      console.error(err)
      setError('등록 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setBusy(false)
    }
  }

  const handleTeacherLogin = () => {
    setError('')
    if (password === TEACHER_PASSWORD) {
      setIsTeacher(true)
      onLoginSuccess(true)
    } else {
      setError('비밀번호가 틀렸어요')
    }
  }

  const resetForm = () => {
    setName('')
    setPassword('')
    setError('')
  }

  if (mode === 'select') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-primary/10 via-background to-secondary/10">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>돌아가기</span>
          </button>
        )}

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            환영합니다!
          </h1>
          <p className="text-muted-foreground">누구신가요?</p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          {/* 어린이 카드 - 이벤트 전에는 기다려야해요 메시지 */}
          {!isEventStarted ? (
            <Card className="rounded-3xl border-2 border-primary/20 opacity-80">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground">어린이</h3>
                  <p className="text-sm text-primary font-medium">조금만 기다려주세요!</p>
                  <p className="text-xs text-muted-foreground mt-1">이벤트가 시작되면 입장할 수 있어요</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card 
              className="rounded-3xl border-2 border-primary/20 cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all"
              onClick={() => { resetForm(); setMode('child-login') }}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Baby className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground">어린이</h3>
                  <p className="text-sm text-muted-foreground">재미있는 미션을 하러 왔어요!</p>
                </div>
                <Sparkles className="w-5 h-5 text-secondary-foreground" />
              </CardContent>
            </Card>
          )}

          <Card 
            className="rounded-3xl border-2 border-secondary/30 cursor-pointer hover:border-secondary/50 hover:shadow-lg transition-all"
            onClick={() => { resetForm(); setMode('teacher') }}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-secondary/30 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground">선생님</h3>
                <p className="text-sm text-muted-foreground">어린이들을 관리해요</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (mode === 'child-login') {
    return (
      <div className="min-h-screen flex flex-col p-4 bg-gradient-to-b from-primary/10 via-background to-secondary/10">
        <button 
          onClick={() => setMode('select')}
          className="flex items-center gap-2 text-muted-foreground mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>돌아가기</span>
        </button>

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Baby className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">어린이 로그인</h2>
            <p className="text-muted-foreground mt-1">이름과 비밀번호를 입력해주세요</p>
          </div>

          <Card className="rounded-3xl border-2 border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  이름
                </label>
                <Input
                  type="text"
                  placeholder="이름을 입력해주세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl h-12"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  비밀번호 (숫자 4자리)
                </label>
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="****"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="rounded-xl h-12 text-center text-2xl tracking-widest"
                />
              </div>

              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}

              <Button
                onClick={handleChildLogin}
                disabled={busy}
                className="w-full h-12 rounded-xl text-lg font-semibold"
              >
                {busy ? '확인 중...' : '로그인'}
              </Button>

              <div className="text-center">
                <button
                  onClick={() => { resetForm(); setMode('child-register') }}
                  className="text-sm text-primary hover:underline"
                >
                  처음이에요! 등록하기
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (mode === 'child-register') {
    return (
      <div className="min-h-screen flex flex-col p-4 bg-gradient-to-b from-primary/10 via-background to-secondary/10">
        <button 
          onClick={() => setMode('child-login')}
          className="flex items-center gap-2 text-muted-foreground mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>돌아가기</span>
        </button>

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-secondary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">새 친구 등록</h2>
            <p className="text-muted-foreground mt-1">정보를 입력해주세요</p>
          </div>

          <Card className="rounded-3xl border-2 border-secondary/30">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  이름
                </label>
                <Input
                  type="text"
                  placeholder="이름을 입력해주세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl h-12"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  비밀번호 (숫자 4자리)
                </label>
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="****"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="rounded-xl h-12 text-center text-2xl tracking-widest"
                />
              </div>

              <p className="text-xs text-muted-foreground text-center">
                반은 선생님이 배정해주실 거예요.
              </p>

              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}

              <Button
                onClick={handleChildRegister}
                disabled={busy}
                className="w-full h-12 rounded-xl text-lg font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                {busy ? '등록 중...' : '등록하기'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Teacher login
  return (
    <div className="min-h-screen flex flex-col p-4 bg-gradient-to-b from-secondary/10 via-background to-primary/10">
      <button 
        onClick={() => setMode('select')}
        className="flex items-center gap-2 text-muted-foreground mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>돌아가기</span>
      </button>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-10 h-10 text-secondary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">선생님 로그인</h2>
          <p className="text-muted-foreground mt-1">관리자 비밀번호를 입력해주세요</p>
        </div>

        <Card className="rounded-3xl border-2 border-secondary/30">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Lock className="w-4 h-4" />
                비밀번호
              </label>
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="****"
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="rounded-xl h-12 text-center text-2xl tracking-widest"
              />
            </div>

            {error && (
              <p className="text-destructive text-sm text-center">{error}</p>
            )}

            <Button 
              onClick={handleTeacherLogin}
              className="w-full h-12 rounded-xl text-lg font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              로그인
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
