"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Heart, Star } from "lucide-react"

const teachers = [
  {
    name: "김뮤우",
    title: "원장님",
    className: "홍랑해",
    message: "아이들의 밝은 미소가 저의 행복이에요!",
    color: "bg-primary/20",
  },
  {
    name: "강금쪽",
    title: "선생님",
    className: "논랑해",
    message: "함께 꿈을 키워가요!",
    color: "bg-secondary/40",
  },
  {
    name: "김쫑하",
    title: "선생님",
    className: "하니해",
    message: "매일매일 즐거운 하루를 만들어요!",
    color: "bg-accent/40",
  },
]

interface TeacherIntroProps {
  onClose: () => void
}

export function TeacherIntro({ onClose }: TeacherIntroProps) {
  return (
    <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm overflow-auto">
      <div className="min-h-full p-4 pb-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6 pt-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Heart className="w-6 h-6 text-primary fill-primary" />
              선생님 소개
              <Heart className="w-6 h-6 text-primary fill-primary" />
            </h2>
            <p className="text-muted-foreground mt-2">우리 어린이집 선생님들을 만나보세요!</p>
          </div>

          <div className="space-y-4">
            {teachers.map((teacher, index) => (
              <Card 
                key={teacher.name} 
                className="rounded-3xl border-2 border-primary/10 overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className={`${teacher.color} p-4`}>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center text-2xl font-bold text-primary shadow-md">
                        {teacher.name[0]}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">
                          {teacher.name} {teacher.title}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="w-4 h-4 text-secondary-foreground fill-secondary" />
                          <span>{teacher.className} 담임</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-card">
                    <p className="text-foreground/80 text-sm italic">
                      &ldquo;{teacher.message}&rdquo;
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg shadow-lg hover:bg-primary/90 transition-colors"
          >
            돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}
