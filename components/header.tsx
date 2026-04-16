"use client"

import { Sun, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-primary/10 bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-md">
            <Sun className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">햇살 어린이집</h1>
            <p className="text-[10px] text-muted-foreground">우리 아이들의 꿈이 자라는 곳</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
