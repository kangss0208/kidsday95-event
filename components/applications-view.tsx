"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Search,
  Calendar,
  User,
  Lock,
  School,
  GraduationCap,
  Trash2,
  Users,
} from "lucide-react"
import type { Child, ClassInfo } from "@/lib/types"
import { getChildren, getClasses, deleteChild } from "@/lib/store"

type SortKey = 'newest' | 'oldest' | 'class'

function formatDate(iso: string): string {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`
}

export function ApplicationsView() {
  const [children, setChildren] = useState<Child[]>([])
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('newest')

  useEffect(() => {
    setChildren(getChildren())
    setClasses(getClasses())
  }, [])

  const filtered = useMemo(() => {
    let list = [...children]
    if (classFilter !== 'all') {
      list = list.filter((c) => c.className === classFilter)
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.className.toLowerCase().includes(term) ||
          c.teacherName.toLowerCase().includes(term)
      )
    }
    list.sort((a, b) => {
      if (sortKey === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      if (sortKey === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return a.className.localeCompare(b.className, 'ko')
    })
    return list
  }, [children, searchTerm, classFilter, sortKey])

  const byClass = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of children) {
      map[c.className] = (map[c.className] || 0) + 1
    }
    return map
  }, [children])

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`${name} 신청서를 삭제할까요?`)) return
    deleteChild(id)
    setChildren(getChildren())
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          신청서 모아보기
        </h2>
        <span className="text-sm text-muted-foreground">총 {children.length}건</span>
      </div>

      {/* Class summary */}
      <div className="grid grid-cols-3 gap-2">
        {classes.map((cls) => (
          <Card
            key={cls.name}
            className={`rounded-2xl border-2 cursor-pointer transition-colors ${
              classFilter === cls.name
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40'
            }`}
            onClick={() =>
              setClassFilter(classFilter === cls.name ? 'all' : cls.name)
            }
          >
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">{cls.name}</p>
              <p className="text-xl font-bold text-foreground">
                {byClass[cls.name] || 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="이름, 반, 선생님으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl h-12"
          />
        </div>
        <div className="flex gap-2">
          {(
            [
              { key: 'newest', label: '최신순' },
              { key: 'oldest', label: '오래된순' },
              { key: 'class', label: '반별' },
            ] as { key: SortKey; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortKey(key)}
              className={`px-3 py-1 rounded-full text-sm border-2 transition-colors ${
                sortKey === key
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {label}
            </button>
          ))}
          {classFilter !== 'all' && (
            <button
              onClick={() => setClassFilter('all')}
              className="ml-auto text-xs text-muted-foreground hover:underline"
            >
              필터 초기화
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="rounded-3xl border-2 border-dashed border-border">
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {children.length === 0
                ? '아직 접수된 신청서가 없어요'
                : '조건에 맞는 신청서가 없어요'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((child) => (
            <Card key={child.id} className="rounded-2xl border-2 border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-primary">
                        {child.name[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-semibold text-foreground truncate">
                          {child.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <School className="w-3.5 h-3.5" />
                        <span>{child.className}</span>
                        <span>·</span>
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span className="truncate">{child.teacherName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Lock className="w-3 h-3" />
                        <span>비번 {child.password}</span>
                        <span>·</span>
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(child.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(child.id, child.name)}
                    className="p-2 rounded-xl hover:bg-destructive/10 text-destructive transition-colors flex-shrink-0"
                    aria-label="신청서 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
