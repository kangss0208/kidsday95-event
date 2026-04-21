"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Backpack,
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react"
import type { PrepGuide as PrepGuideData } from "@/lib/types"
import { getPrepGuide, addPrepItem, removePrepItem } from "@/lib/store"
import { getSupabase } from "@/lib/supabase/client"

interface PrepGuideProps {
  editable?: boolean
}

export function PrepGuide({ editable = false }: PrepGuideProps) {
  const [guide, setGuide] = useState<PrepGuideData | null>(null)
  const [newItem, setNewItem] = useState('')
  const [newCaution, setNewCaution] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const g = await getPrepGuide()
        if (!cancelled) setGuide(g)
      } catch (err) {
        console.error('Failed to load prep guide', err)
      }
    }
    load()

    const sb = getSupabase()
    const channel = sb
      .channel('prep-guide')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prep_items' }, load)
      .subscribe()

    return () => {
      cancelled = true
      sb.removeChannel(channel)
    }
  }, [])

  if (!guide) return null

  const handleAddItem = async () => {
    if (!newItem.trim()) return
    try {
      setGuide(await addPrepItem('items', newItem.trim()))
      setNewItem('')
    } catch (err) {
      console.error('Failed to add prep item', err)
    }
  }

  const handleAddCaution = async () => {
    if (!newCaution.trim()) return
    try {
      setGuide(await addPrepItem('cautions', newCaution.trim()))
      setNewCaution('')
    } catch (err) {
      console.error('Failed to add caution', err)
    }
  }

  const handleRemove = async (kind: 'items' | 'cautions', id: string) => {
    try {
      setGuide(await removePrepItem(kind, id))
    } catch (err) {
      console.error('Failed to remove prep item', err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Backpack className="w-6 h-6 text-primary" />
          준비물 & 안전수칙
        </h2>
      </div>

      <Card className="rounded-3xl border-2 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Backpack className="w-5 h-5 text-primary" />
            꼭 챙겨와요!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {guide.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">등록된 준비물이 없어요.</p>
          ) : (
            guide.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-primary/5"
              >
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="flex-1 text-sm text-foreground">{item.text}</p>
                {editable && (
                  <button
                    onClick={() => handleRemove('items', item.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}

          {editable && (
            <div className="flex gap-2 pt-2">
              <Input
                placeholder="새 준비물"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddItem()
                  }
                }}
                className="rounded-xl"
              />
              <Button
                onClick={handleAddItem}
                disabled={!newItem.trim()}
                className="rounded-xl"
                size="icon"
                aria-label="추가"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-2 border-destructive/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-destructive" />
            유의할 점
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {guide.cautions.length === 0 ? (
            <p className="text-sm text-muted-foreground">등록된 안전수칙이 없어요.</p>
          ) : (
            guide.cautions.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5"
              >
                <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0" />
                <p className="flex-1 text-sm text-foreground">{item.text}</p>
                {editable && (
                  <button
                    onClick={() => handleRemove('cautions', item.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}

          {editable && (
            <div className="flex gap-2 pt-2">
              <Input
                placeholder="새 안전수칙"
                value={newCaution}
                onChange={(e) => setNewCaution(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCaution()
                  }
                }}
                className="rounded-xl"
              />
              <Button
                onClick={handleAddCaution}
                disabled={!newCaution.trim()}
                className="rounded-xl"
                size="icon"
                aria-label="추가"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
