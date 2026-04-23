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
  MessageSquare,
  Backpack,
} from "lucide-react"
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
import { BulletinBoard } from "@/components/bulletin-board"
import { PrepGuide } from "@/components/prep-guide"

type MainTab = 'class' | 'bulletin' | 'prep'
type ClassSubTab = 'members' | 'missions'

interface TeacherDashboardProps {
  teacherClass: string
  onLogout: () => void
}

export function TeacherDashboard({ teacherClass, onLogout }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('class')
  const [classSubTab, setClassSubTab] = useState<ClassSubTab>('members')
  const [children, setChildren] = useState<Child[]>([])
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
  const [meetingPoints, setMeetingPoints] = useState<MeetingPoint[]>([])
  const [expandedChild, setExpandedChild] = useState<string | null>(null)
  const [newMissionTitle, setNewMissionTitle] = useState('')
  const [newMissionDesc, setNewMissionDesc] = useState('')

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
        console.error('Failed to load teacher dashboard data', err)
      }
    }
    load()

    const sb = getSupabase()
    const channel = sb
      .channel('class-teacher-dashboard')
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

  const myChildren = children.filter((c) => c.className === teacherClass)
  const myMissions = missions.filter((m) => m.classNames.includes(teacherClass))
  const myClassInfo = classes.find((c) => c.name === teacherClass)

  const getChildMissionProgress = (childId: string) => {
    const completed = myMissions.filter((m) => m.completedBy.includes(childId)).length
    return { completed, total: myMissions.length }
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
    if (!newMissionTitle.trim()) return
    try {
      const updated = await createMission({
        title: newMissionTitle.trim(),
        description: newMissionDesc.trim() || '미션을 완료해주세요!',
        classNames: [teacherClass],
      })
      setMissions(updated)
      setNewMissionTitle('')
      setNewMissionDesc('')
    } catch (err) {
      console.error('Failed to add mission', err)
      alert('미션 추가에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleDeleteMission = async (missionId: string) => {
    try {
      const updated = await deleteMission(missionId)
      setMissions(updated)
    } catch (err) {
      console.error('Failed to delete mission', err)
    }
  }

  const mainTabs: { key: MainTab; label: string; Icon: typeof Users }[] = [
    { key: 'class', label: '우리반', Icon: Users },
    { key: 'bulletin', label: '우리들의 기록', Icon: MessageSquare },
    { key: 'prep', label: '준비물', Icon: Backpack },
  ]

  const teacherAuthorId = `teacher_class_${teacherClass}`
  const teacherAuthorName = myClassInfo?.teacher || `${teacherClass} 선생님`

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/10 via-background to-primary/5 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border p-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">{teacherAuthorName}</h1>
              <p className="text-sm text-muted-foreground">{teacherClass}</p>
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
        {activeTab === 'class' && (
          <div className="space-y-4">
            {/* Sub-tabs */}
            <div className="flex gap-2 p-1 rounded-2xl bg-muted/50">
              {([
                { key: 'members', label: `구성원 (${myChildren.length})` },
                { key: 'missions', label: `미션 (${myMissions.length})` },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setClassSubTab(key)}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                    classSubTab === key
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {classSubTab === 'members' && (
              <>
                {myChildren.length === 0 ? (
                  <Card className="rounded-3xl border-2 border-dashed border-border">
                    <CardContent className="p-8 text-center">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">아직 배정된 어린이가 없어요</p>
                      <p className="text-xs text-muted-foreground mt-1">관리자에게 반 배정을 요청해주세요</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {myChildren.map((child) => {
                      const progress = getChildMissionProgress(child.id)
                      const isExpanded = expandedChild === child.id
                      const meetingPoint = pickMeetingPointForChild(child.id, meetingPoints)
                      return (
                        <Card key={child.id} className={`rounded-2xl border-2 border-border overflow-hidden ${child.isAbsent ? 'opacity-50' : ''}`}>
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
                                <p className="text-sm text-muted-foreground">{child.className}</p>
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
                                {myMissions.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">등록된 미션이 없어요</p>
                                ) : (
                                  myMissions.map((mission) => {
                                    const isCompleted = mission.completedBy.includes(child.id)
                                    return (
                                      <button
                                        key={mission.id}
                                        onClick={() => handleToggleMissionForChild(mission.id, child.id)}
                                        className={`w-full flex items-center gap-2 p-2 rounded-xl transition-colors ${
                                          isCompleted ? 'bg-primary/10' : 'bg-muted/50 hover:bg-muted'
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
              </>
            )}

            {classSubTab === 'missions' && (
              <>
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
                    <p className="text-xs text-muted-foreground">
                      {teacherClass} 전용 미션으로 추가됩니다.
                    </p>
                    <Button
                      onClick={handleAddMission}
                      disabled={!newMissionTitle.trim()}
                      className="w-full rounded-xl"
                    >
                      미션 추가하기
                    </Button>
                  </CardContent>
                </Card>

                {/* Mission List */}
                <div className="space-y-3">
                  {myMissions.length === 0 && (
                    <Card className="rounded-3xl border-2 border-dashed border-border">
                      <CardContent className="p-8 text-center">
                        <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">아직 등록된 미션이 없어요</p>
                      </CardContent>
                    </Card>
                  )}
                  {myMissions.map((mission) => {
                    const completedCount = mission.completedBy.length
                    return (
                      <Card key={mission.id} className="rounded-2xl border-2 border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">{mission.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{mission.description}</p>
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
              </>
            )}
          </div>
        )}

        {activeTab === 'bulletin' && (
          <BulletinBoard
            authorId={teacherAuthorId}
            authorName={teacherAuthorName}
            authorRole="teacher"
          />
        )}

        {activeTab === 'prep' && <PrepGuide />}
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
                className={`flex flex-col items-center py-3 px-2 min-w-0 flex-1 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[11px] mt-1 font-medium whitespace-nowrap">{label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
