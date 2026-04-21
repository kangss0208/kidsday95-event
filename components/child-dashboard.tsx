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
} from "lucide-react"
import type { Child, Mission, ClassInfo } from "@/lib/types"
import { getMissions, toggleMissionForChild, getClasses, logout } from "@/lib/store"
import { BulletinBoard } from "@/components/bulletin-board"
import { PrepGuide } from "@/components/prep-guide"

type Tab = 'info' | 'class' | 'location' | 'missions' | 'bulletin' | 'prep'

interface ChildDashboardProps {
  child: Child
  onLogout: () => void
}

export function ChildDashboard({ child, onLogout }: ChildDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [missions, setMissions] = useState<Mission[]>([])
  const [classes, setClasses] = useState<ClassInfo[]>([])

  useEffect(() => {
    setMissions(getMissions())
    setClasses(getClasses())
  }, [])

  const handleToggleMission = (missionId: string) => {
    const updated = toggleMissionForChild(missionId, child.id)
    setMissions(updated)
  }

  const myClass = classes.find(c => c.name === child.className)
  const isUnassigned = !child.className
  const completedMissions = missions.filter(m => m.completedBy.includes(child.id)).length

  const handleLogout = () => {
    logout()
    onLogout()
  }

  const tabs = [
    { id: 'info' as Tab, label: '내 정보', icon: User },
    { id: 'class' as Tab, label: '우리 반', icon: Users },
    { id: 'location' as Tab, label: '만나는 곳', icon: MapPin },
    { id: 'missions' as Tab, label: '미션', icon: ListTodo },
    { id: 'bulletin' as Tab, label: '게시판', icon: MessageSquare },
    { id: 'prep' as Tab, label: '준비물', icon: Backpack },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-secondary/10 pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
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
                    <p className="font-semibold text-foreground">{completedMissions} / {missions.length}</p>
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
                    style={{ width: `${missions.length > 0 ? (completedMissions / missions.length) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  {missions.length > 0 ? Math.round((completedMissions / missions.length) * 100) : 0}% 완료!
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
                    <p className="text-sm text-muted-foreground mb-2">우리 반 친구들도 미션 중!</p>
                    <div className="flex flex-wrap gap-2">
                      {['미션 열심히!', '화이팅!', '함께해요!'].map((msg, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full bg-secondary/30 text-sm text-secondary-foreground"
                        >
                          {msg}
                        </span>
                      ))}
                    </div>
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
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center mb-4">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">지도 영역</p>
                  </div>
                </div>

                {isUnassigned ? (
                  <div className="p-4 rounded-2xl bg-muted/50 border-2 border-dashed border-border text-center">
                    <p className="font-bold text-foreground mb-1">반 배정 후 안내돼요</p>
                    <p className="text-sm text-muted-foreground">
                      선생님이 반을 정해주시면 집합 장소를 볼 수 있어요.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-accent/30 border-2 border-accent">
                    <p className="font-bold text-foreground mb-1">{child.className} 집합 장소</p>
                    <p className="text-muted-foreground">
                      {myClass?.meetingLocation || '1층 로비'}
                    </p>
                  </div>
                )}
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
                {completedMissions}/{missions.length} 완료
              </span>
            </div>

            <div className="space-y-3">
              {missions.map((mission) => {
                const isCompleted = mission.completedBy.includes(child.id)
                return (
                  <Card
                    key={mission.id}
                    className={`rounded-2xl border-2 transition-all cursor-pointer ${
                      isCompleted
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border hover:border-primary/20'
                    }`}
                    onClick={() => handleToggleMission(mission.id)}
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
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-3 px-2 min-w-0 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[11px] mt-1 font-medium whitespace-nowrap">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
