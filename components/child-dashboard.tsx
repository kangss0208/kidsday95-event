"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  User,
  Users,
  MapPin,
  ListTodo,
  LogOut,
  CheckCircle2,
  Circle,
  Star,
  Heart,
  Sparkles,
  MessageSquare,
  Backpack,
  Navigation,
  Menu,
} from "lucide-react"
import type { Child, Mission, ClassInfo } from "@/lib/types"
import { getMissions, getClasses, getChildren, logout } from "@/lib/store"
import { getSupabase } from "@/lib/supabase/client"
import { BulletinBoard } from "@/components/bulletin-board"
import { PrepGuide } from "@/components/prep-guide"
import { LocationMap } from "@/components/location-map"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

type Tab = 'info' | 'class' | 'location' | 'missions' | 'bulletin' | 'prep'

interface ChildDashboardProps {
  child: Child
  onLogout: () => void
}

export function ChildDashboard({ child, onLogout }: ChildDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('missions')
  const [moreOpen, setMoreOpen] = useState(false)
  const [missions, setMissions] = useState<Mission[]>([])
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [children, setChildren] = useState<Child[]>([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [m, c, ch] = await Promise.all([getMissions(), getClasses(), getChildren()])
        if (!cancelled) {
          setMissions(m)
          setClasses(c)
          setChildren(ch)
        }
      } catch (err) {
        console.error('Failed to load child dashboard data', err)
      }
    }
    load()

    // Realtime: refresh when teacher edits missions or completions change
    const sb = getSupabase()
    const channel = sb
      .channel('child-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_completions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'children' }, load)
      .subscribe()

    return () => {
      cancelled = true
      sb.removeChannel(channel)
    }
  }, [])

  const myClass = classes.find(c => c.name === child.className)
  const isUnassigned = !child.className
  const myMissions = missions.filter(m => m.classNames.includes(child.className))
  const completedMissions = myMissions.filter(m => m.completedBy.includes(child.id)).length

  const handleLogout = () => {
    logout()
    onLogout()
  }

  const mainTabs = [
    { id: 'info' as Tab, label: '내 정보', icon: User },
    { id: 'missions' as Tab, label: '미션', icon: ListTodo },
    { id: 'bulletin' as Tab, label: '게시판', icon: MessageSquare },
    { id: 'location' as Tab, label: '만나는 곳', icon: MapPin },
  ]

  const moreTabs = [
    { id: 'class' as Tab, label: '우리 반', icon: Users },
    { id: 'prep' as Tab, label: '준비물', icon: Backpack },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-secondary/10 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border p-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">{child.name[0]}</span>
            </div>
            <div>
              <h1 className="font-bold text-foreground">{child.name}</h1>
              <p className="text-sm text-muted-foreground">
                {child.className || '반 배정 대기 중'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-lg mx-auto">
        {isUnassigned && (
          <Card className="rounded-2xl border-2 border-secondary/40 bg-secondary/10 mb-4">
            <CardContent className="p-4 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-secondary-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">반 배정을 기다리고 있어요</p>
                <p className="text-sm text-muted-foreground mt-1">
                  선생님이 곧 우리 반을 배정해주실 거예요. 조금만 기다려주세요!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        {activeTab === 'info' && (
          <div className="space-y-4">
            <Card className="rounded-3xl border-2 border-primary/20 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-6 text-center">
                <div className="w-24 h-24 rounded-full bg-card mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <span className="text-4xl font-bold text-primary">{child.name[0]}</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground">{child.name}</h2>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Star className="w-4 h-4 text-secondary-foreground fill-secondary" />
                  <span className="text-muted-foreground">
                    {child.className || '반 배정 대기 중'}
                  </span>
                </div>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">담임 선생님</p>
                    <p className="font-semibold text-foreground">
                      {child.teacherName || '배정 전이에요'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50">
                  <ListTodo className="w-5 h-5 text-secondary-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">완료한 미션</p>
                    <p className="font-semibold text-foreground">{completedMissions} / {myMissions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress */}
            <Card className="rounded-3xl border-2 border-secondary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-secondary-foreground" />
                  <h3 className="font-bold text-foreground">미션 진행률</h3>
                </div>
                <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                    style={{ width: `${myMissions.length > 0 ? (completedMissions / myMissions.length) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  {myMissions.length > 0 ? Math.round((completedMissions / myMissions.length) * 100) : 0}% 완료!
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'class' && (
          <div className="space-y-4">
            {isUnassigned ? (
              <Card className="rounded-3xl border-2 border-dashed border-border">
                <CardContent className="p-8 text-center space-y-2">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="font-semibold text-foreground">아직 반이 정해지지 않았어요</p>
                  <p className="text-sm text-muted-foreground">
                    선생님이 배정해주시면 우리 반 정보를 볼 수 있어요.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-3xl border-2 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary fill-primary" />
                    {child.className}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-2xl bg-primary/10">
                    <p className="text-sm text-muted-foreground mb-1">담임 선생님</p>
                    <p className="text-lg font-bold text-foreground">{myClass?.teacher || child.teacherName}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      우리 반 친구들 ({children.filter((c) => c.className === child.className).length}명)
                    </p>
                    {children.filter((c) => c.className === child.className).length === 0 ? (
                      <p className="text-sm text-muted-foreground">아직 친구가 없어요</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {children
                          .filter((c) => c.className === child.className)
                          .map((c) => (
                            <span
                              key={c.id}
                              className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 ${
                                c.id === child.id
                                  ? 'bg-primary/20 text-primary font-semibold'
                                  : 'bg-secondary/30 text-secondary-foreground'
                              }`}
                            >
                              <span className="w-5 h-5 rounded-full bg-card flex items-center justify-center text-xs font-bold">
                                {c.name[0]}
                              </span>
                              {c.name}
                              {c.id === child.id && <span className="text-xs">(나)</span>}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'location' && (
          <div className="space-y-4">
            <Card className="rounded-3xl border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  만나는 위치
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LocationMap childId={child.id} />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'missions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <ListTodo className="w-6 h-6 text-primary" />
                미션 리스트
              </h2>
              <span className="text-sm text-muted-foreground">
                {completedMissions}/{myMissions.length} 완료
              </span>
            </div>

            {myMissions.length === 0 && (
              <Card className="rounded-3xl border-2 border-dashed border-border">
                <CardContent className="p-8 text-center">
                  <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-semibold text-foreground">
                    {isUnassigned ? '반 배정 후 미션이 나와요' : '아직 우리 반 미션이 없어요'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isUnassigned
                      ? '선생님이 반을 정해주시면 미션이 여기 표시돼요.'
                      : '선생님이 곧 미션을 준비해주실 거예요!'}
                  </p>
                </CardContent>
              </Card>
            )}

            {myMissions.length > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                선생님이 미션 완료를 체크해주실 거예요.
              </p>
            )}

            <div className="space-y-3">
              {myMissions.map((mission) => {
                const isCompleted = mission.completedBy.includes(child.id)
                return (
                  <Card
                    key={mission.id}
                    className="rounded-2xl border-2 transition-all"
                    style={
                      isCompleted
                        ? { borderColor: '#dbe8ff', backgroundColor: '#fff' }
                        : undefined
                    }
                  >
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="mt-0.5">
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        ) : (
                          <Circle className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${isCompleted ? 'text-primary line-through' : 'text-foreground'}`}>
                          {mission.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {mission.description}
                        </p>
                        {mission.location && (
                          <div className="mt-2 space-y-1.5">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              <p className="text-xs font-medium text-primary">{mission.location}</p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => {
                                  const q = encodeURIComponent(mission.location!)
                                  const iframe = document.createElement('iframe')
                                  iframe.style.display = 'none'
                                  iframe.src = `kakaomap://search?q=${q}`
                                  document.body.appendChild(iframe)
                                  const t = setTimeout(() => window.open(`https://map.kakao.com/link/search/${q}`, '_blank'), 1500)
                                  window.addEventListener('blur', () => clearTimeout(t), { once: true })
                                  setTimeout(() => document.body.removeChild(iframe), 2000)
                                }}
                                className="px-4 py-2 rounded-xl text-[13px] font-semibold border transition-colors"
                                style={{ background: '#FEE50030', borderColor: '#FEE50099', color: '#7a6000' }}
                              >
                                카카오맵
                              </button>
                              <button
                                onClick={() => {
                                  const q = encodeURIComponent(mission.location!)
                                  const iframe = document.createElement('iframe')
                                  iframe.style.display = 'none'
                                  iframe.src = `nmap://search?query=${q}&appname=kr.co.caratEvent`
                                  document.body.appendChild(iframe)
                                  const t = setTimeout(() => window.open(`https://map.naver.com/p/search/${q}`, '_blank'), 1500)
                                  window.addEventListener('blur', () => clearTimeout(t), { once: true })
                                  setTimeout(() => document.body.removeChild(iframe), 2000)
                                }}
                                className="px-4 py-2 rounded-xl text-[13px] font-semibold border transition-colors"
                                style={{ background: '#03C75A20', borderColor: '#03C75A80', color: '#016632' }}
                              >
                                네이버맵
                              </button>
                              <button
                                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(mission.location!)}`, '_blank')}
                                className="px-4 py-2 rounded-xl text-[13px] font-semibold border transition-colors"
                                style={{ background: '#4285F420', borderColor: '#4285F480', color: '#1a3a6e' }}
                              >
                                구글맵
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'bulletin' && (
          <BulletinBoard
            authorId={child.id}
            authorName={child.name}
            authorRole="child"
          />
        )}

        {activeTab === 'prep' && <PrepGuide />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-card border-t border-border pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        <div className="flex justify-around max-w-lg mx-auto px-2">
          {mainTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-3 px-2 min-w-0 flex-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[11px] mt-1 font-medium whitespace-nowrap">{tab.label}</span>
              </button>
            )
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center py-3 px-2 min-w-0 flex-1 transition-colors ${moreTabs.some(t => t.id === activeTab) ? 'text-primary' : 'text-muted-foreground'
              }`}
          >
            <Menu className="w-5 h-5 transition-transform" />
            <span className="text-[11px] mt-1 font-medium">더보기</span>
          </button>
        </div>
      </div>

      {/* More Menu Sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-left">메뉴</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3 px-2">
            {moreTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setMoreOpen(false) }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-colors ${
                    isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
                  }`}
                  style={{ borderColor: '#dbe8ff', backgroundColor: '#fff' }}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-semibold">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
