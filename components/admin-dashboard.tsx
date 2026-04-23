"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Users,
  ListTodo,
  LogOut,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Search,
  FileText,
  MessageSquare,
  Backpack,
  Settings,
  MapPin,
  Menu,
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { Child, ClassInfo, Mission, MeetingPoint } from "@/lib/types"
import {
  getChildren,
  getClasses,
  getMissions,
  getMeetingPoints,
  createMission,
  deleteMission,
  toggleMissionForChild,
  pickMeetingPointForChild,
  setChildAbsent,
  logout,
} from "@/lib/store"
import { getSupabase } from "@/lib/supabase/client"
import { ApplicationsView } from "@/components/applications-view"
import { BulletinBoard } from "@/components/bulletin-board"
import { PrepGuide } from "@/components/prep-guide"
import { EventDateSettings } from "@/components/event-date-settings"

type Tab = 'children' | 'missions' | 'applications' | 'bulletin' | 'prep' | 'settings'

const TEACHER_AUTHOR = {
  id: 'teacher_admin',
  name: '선생님',
  role: 'teacher' as const,
}

interface AdminDashboardProps {
  onLogout: () => void
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('children')
  const [moreOpen, setMoreOpen] = useState(false)
  const [children, setChildren] = useState<Child[]>([])
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
  const [meetingPoints, setMeetingPoints] = useState<MeetingPoint[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedChild, setExpandedChild] = useState<string | null>(null)
  const [newMissionTitle, setNewMissionTitle] = useState('')
  const [newMissionDesc, setNewMissionDesc] = useState('')
  const [newMissionLocation, setNewMissionLocation] = useState('')
  const [newMissionClasses, setNewMissionClasses] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [ch, cl, ms, mp] = await Promise.all([
          getChildren(),
          getClasses(),
          getMissions(),
          getMeetingPoints(),
        ])
        if (!cancelled) {
          setChildren(ch)
          setClasses(cl)
          setMissions(ms)
          setMeetingPoints(mp)
        }
      } catch (err) {
        console.error('Failed to load admin dashboard data', err)
      }
    }
    load()

    const sb = getSupabase()
    const channel = sb
      .channel('teacher-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'children' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_completions' }, load)
      .subscribe()

    return () => {
      cancelled = true
      sb.removeChannel(channel)
    }
  }, [])

  const handleLogout = () => {
    logout()
    onLogout()
  }

  const handleToggleMissionForChild = async (missionId: string, childId: string) => {
    try {
      const updated = await toggleMissionForChild(missionId, childId)
      setMissions(updated)
    } catch (err) {
      console.error('Failed to toggle mission', err)
    }
  }

  const handleAddMission = async () => {
    if (!newMissionTitle.trim() || newMissionClasses.length === 0) return
    try {
      const updated = await createMission({
        title: newMissionTitle.trim(),
        description: newMissionDesc.trim() || '미션을 완료해주세요!',
        location: newMissionLocation.trim() || undefined,
        classNames: newMissionClasses,
      })
      setMissions(updated)
      setNewMissionTitle('')
      setNewMissionDesc('')
      setNewMissionLocation('')
      setNewMissionClasses([])
    } catch (err) {
      console.error('Failed to add mission', err)
      alert('미션 추가에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const toggleNewMissionClass = (name: string) => {
    setNewMissionClasses((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const missionsForChild = (child: Child) =>
    missions.filter((m) => m.classNames.includes(child.className))

  const handleDeleteMission = async (missionId: string) => {
    try {
      const updated = await deleteMission(missionId)
      setMissions(updated)
    } catch (err) {
      console.error('Failed to delete mission', err)
    }
  }

  const filteredChildren = children.filter(child =>
    child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    child.className.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getChildMissionProgress = (child: Child) => {
    const applicable = missionsForChild(child)
    const completed = applicable.filter((m) => m.completedBy.includes(child.id)).length
    return { completed, total: applicable.length }
  }

  const mainTabs: { key: Tab; label: string; Icon: typeof Users }[] = [
    { key: 'children', label: '어린이', Icon: Users },
    { key: 'missions', label: '미션', Icon: ListTodo },
    { key: 'bulletin', label: '우리들의 기록', Icon: MessageSquare },
    { key: 'settings', label: '설정', Icon: Settings },
  ]

  const moreTabs: { key: Tab; label: string; Icon: typeof Users }[] = [
    { key: 'applications', label: '신청서', Icon: FileText },
    { key: 'prep', label: '준비물', Icon: Backpack },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/10 via-background to-primary/5 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border p-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">관리자</h1>
              <p className="text-sm text-muted-foreground"></p>
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
      <div className="p-4 max-w-2xl mx-auto">
        {activeTab === 'children' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="이름 또는 반으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl h-12"
              />
            </div>

            {filteredChildren.length === 0 ? (
              <Card className="rounded-3xl border-2 border-dashed border-border">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? '검색 결과가 없어요' : '아직 등록된 어린이가 없어요'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredChildren.map((child) => {
                  const progress = getChildMissionProgress(child)
                  const childMissions = missionsForChild(child)
                  const isExpanded = expandedChild === child.id
                  const meetingPoint = pickMeetingPointForChild(child.id, meetingPoints)

                  return (
                    <Card
                      key={child.id}
                      className={`rounded-2xl border-2 overflow-hidden ${child.isAbsent ? '' : 'border-border'}`}
                      style={child.isAbsent ? { borderColor: '#7a99cf' } : undefined}
                    >
                      <CardContent className="p-0">
                        <button
                          onClick={() => setExpandedChild(isExpanded ? null : child.id)}
                          className="w-full p-4 flex items-center gap-3 text-left"
                        >
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 "
                            style={{ backgroundColor: '#dbe8ff', border: '2px solid #7a99cf' }}
                          >
                            <span className="text-lg font-bold" style={{ color: '#7a99cf' }}>{child.name[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate flex items-center gap-2">
                              {child.name}
                              {child.isAbsent && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">결석</span>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {child.className
                                ? `${child.className} / ${child.teacherName}`
                                : '미배정 — 신청서 탭에서 배정해주세요'}
                            </p>
                            {meetingPoint && (
                              <p className="text-xs text-muted-foreground truncate">
                                만날 곳: {meetingPoint.name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {progress.completed}/{progress.total}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
                            <button
                              onClick={async () => {
                                try {
                                  await setChildAbsent(child.id, !child.isAbsent)
                                } catch (err) {
                                  console.error('Failed to toggle absent', err)
                                }
                              }}
                              className={`w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                                child.isAbsent
                                  ? 'bg-muted text-muted-foreground'
                                  : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                              }`}
                            >
                              {child.isAbsent ? '출석으로 되돌리기' : '결석 처리'}
                            </button>
                            <p className="text-sm font-medium text-muted-foreground mb-2">미션 현황</p>
                            {childMissions.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                {child.className
                                  ? `${child.className}에 등록된 미션이 없어요`
                                  : '반 배정 후 해당 반 미션이 표시돼요'}
                              </p>
                            ) : (
                              childMissions.map((mission) => {
                                const isCompleted = mission.completedBy.includes(child.id)
                                return (
                                  <button
                                    key={mission.id}
                                    onClick={() => handleToggleMissionForChild(mission.id, child.id)}
                                    className={`w-full flex items-center gap-2 p-2 rounded-xl transition-colors ${isCompleted ? 'bg-primary/10' : 'bg-muted/50 hover:bg-muted'
                                      }`}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <span className={`text-sm ${isCompleted ? 'text-primary' : 'text-foreground'}`}>
                                      {mission.title}
                                    </span>
                                  </button>
                                )
                              })
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'missions' && (
          <div className="space-y-4">
            {/* Add Mission */}
            <Card className="rounded-3xl border-2 border-secondary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  새 미션 추가
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="미션 제목"
                  value={newMissionTitle}
                  onChange={(e) => setNewMissionTitle(e.target.value)}
                  className="rounded-xl"
                />
                <Input
                  placeholder="미션 설명 (선택)"
                  value={newMissionDesc}
                  onChange={(e) => setNewMissionDesc(e.target.value)}
                  className="rounded-xl"
                />
                <Input
                  placeholder="장소 이동 주소 (선택) — 예: 서울역 10번 출구"
                  value={newMissionLocation}
                  onChange={(e) => setNewMissionLocation(e.target.value)}
                  className="rounded-xl"
                />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">적용 반 (하나 이상 선택)</p>
                  <div className="flex flex-wrap gap-2">
                    {classes.map((cls) => {
                      const selected = newMissionClasses.includes(cls.name)
                      return (
                        <button
                          key={cls.name}
                          type="button"
                          onClick={() => toggleNewMissionClass(cls.name)}
                          className={`px-3 py-1.5 rounded-full text-sm border-2 transition-colors ${selected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:border-primary/40'
                            }`}
                        >
                          {cls.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <Button
                  onClick={handleAddMission}
                  disabled={!newMissionTitle.trim() || newMissionClasses.length === 0}
                  className="w-full rounded-xl"
                >
                  미션 추가하기
                </Button>
              </CardContent>
            </Card>

            {/* Mission List */}
            <div className="space-y-3">
              {missions.length === 0 && (
                <Card className="rounded-3xl border-2 border-dashed border-border">
                  <CardContent className="p-8 text-center">
                    <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">아직 등록된 미션이 없어요</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      위 폼에서 반을 골라 미션을 추가해주세요
                    </p>
                  </CardContent>
                </Card>
              )}
              {missions.map((mission) => {
                const completedCount = mission.completedBy.length
                return (
                  <Card key={mission.id} className="rounded-2xl border-2 border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{mission.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{mission.description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {mission.classNames.map((name) => (
                              <span
                                key={name}
                                className="px-2 py-0.5 rounded-full bg-secondary/30 text-xs text-secondary-foreground"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                          {mission.location && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">{mission.location}</p>
                            </div>
                          )}
                          <p className="text-xs text-primary mt-2">
                            {completedCount}명 완료
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteMission(mission.id)}
                          className="p-2 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'applications' && <ApplicationsView />}

        {activeTab === 'bulletin' && (
          <BulletinBoard
            authorId={TEACHER_AUTHOR.id}
            authorName={TEACHER_AUTHOR.name}
            authorRole={TEACHER_AUTHOR.role}
          />
        )}

        {activeTab === 'prep' && <PrepGuide editable />}

        {activeTab === 'settings' && <EventDateSettings />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-card border-t border-border pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        <div className="flex justify-around max-w-2xl mx-auto px-2">
          {mainTabs.map(({ key, label, Icon }) => {
            const isActive = activeTab === key
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex flex-col items-center py-3 px-2 min-w-0 flex-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[11px] mt-1 font-medium whitespace-nowrap">{label}</span>
              </button>
            )
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center py-3 px-2 min-w-0 flex-1 transition-colors ${moreTabs.some(t => t.key === activeTab) ? 'text-primary' : 'text-muted-foreground'
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
            {moreTabs.map(({ key, label, Icon }) => {
              const isActive = activeTab === key
              return (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key); setMoreOpen(false) }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-colors ${isActive
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted/30 text-muted-foreground'
                    }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
