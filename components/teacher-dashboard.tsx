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
} from "lucide-react"
import type { Child, Mission } from "@/lib/types"
import {
  getChildren,
  getMissions,
  saveMissions,
  toggleMissionForChild,
  logout,
} from "@/lib/store"
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

interface TeacherDashboardProps {
  onLogout: () => void
}

export function TeacherDashboard({ onLogout }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('children')
  const [children, setChildren] = useState<Child[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedChild, setExpandedChild] = useState<string | null>(null)
  const [newMissionTitle, setNewMissionTitle] = useState('')
  const [newMissionDesc, setNewMissionDesc] = useState('')

  useEffect(() => {
    setChildren(getChildren())
    setMissions(getMissions())
  }, [])

  const handleLogout = () => {
    logout()
    onLogout()
  }

  const handleToggleMissionForChild = (missionId: string, childId: string) => {
    const updated = toggleMissionForChild(missionId, childId)
    setMissions(updated)
  }

  const handleAddMission = () => {
    if (!newMissionTitle.trim()) return

    const newMission: Mission = {
      id: Date.now().toString(),
      title: newMissionTitle.trim(),
      description: newMissionDesc.trim() || '미션을 완료해주세요!',
      completed: false,
      completedBy: [],
    }

    const updated = [...missions, newMission]
    saveMissions(updated)
    setMissions(updated)
    setNewMissionTitle('')
    setNewMissionDesc('')
  }

  const handleDeleteMission = (missionId: string) => {
    const updated = missions.filter(m => m.id !== missionId)
    saveMissions(updated)
    setMissions(updated)
  }

  const filteredChildren = children.filter(child =>
    child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    child.className.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getChildMissionProgress = (childId: string) => {
    const completed = missions.filter(m => m.completedBy.includes(childId)).length
    return { completed, total: missions.length }
  }

  const tabs: { key: Tab; label: string; Icon: typeof Users }[] = [
    { key: 'children', label: `어린이 (${children.length})`, Icon: Users },
    { key: 'missions', label: `미션 (${missions.length})`, Icon: ListTodo },
    { key: 'applications', label: '신청서', Icon: FileText },
    { key: 'bulletin', label: '게시판', Icon: MessageSquare },
    { key: 'prep', label: '준비물', Icon: Backpack },
    { key: 'settings', label: '설정', Icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/10 via-background to-primary/5 pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">선생님 관리자</h1>
              <p className="text-sm text-muted-foreground">CARAT 9559</p>
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

      {/* Tab Navigation (scrollable on overflow) */}
      <div className="bg-card border-b border-border">
        <div className="max-w-2xl mx-auto flex overflow-x-auto">
          {tabs.map(({ key, label, Icon }) => {
            const isActive = activeTab === key
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`shrink-0 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4 inline mr-1.5" />
                {label}
              </button>
            )
          })}
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
                  const progress = getChildMissionProgress(child.id)
                  const isExpanded = expandedChild === child.id

                  return (
                    <Card
                      key={child.id}
                      className="rounded-2xl border-2 border-border overflow-hidden"
                    >
                      <CardContent className="p-0">
                        <button
                          onClick={() => setExpandedChild(isExpanded ? null : child.id)}
                          className="w-full p-4 flex items-center gap-3 text-left"
                        >
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-primary">{child.name[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{child.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {child.className
                                ? `${child.className} / ${child.teacherName}`
                                : '미배정 — 신청서 탭에서 배정해주세요'}
                            </p>
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
                          <div className="px-4 pb-4 border-t border-border pt-4 space-y-2">
                            <p className="text-sm font-medium text-muted-foreground mb-2">미션 현황</p>
                            {missions.map((mission) => {
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
                            })}
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
              {missions.map((mission) => {
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
    </div>
  )
}
