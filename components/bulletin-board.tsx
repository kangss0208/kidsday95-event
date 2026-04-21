"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  MessageSquare,
  Plus,
  Trash2,
  Send,
  GraduationCap,
  Baby,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react"
import type { Post, AuthorRole } from "@/lib/types"
import {
  getPosts,
  createPost,
  deletePost,
  addComment,
  deleteComment,
} from "@/lib/store"
import { childFontStack } from "@/lib/child-fonts"

interface BulletinBoardProps {
  authorId: string
  authorName: string
  authorRole: AuthorRole
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`
}

export function BulletinBoard({ authorId, authorName, authorRole }: BulletinBoardProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [openPost, setOpenPost] = useState<string | null>(null)
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    setPosts(getPosts())
  }, [])

  const canPost = authorRole === 'teacher'

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) return
    const updated = createPost({
      title: title.trim(),
      content: content.trim(),
      authorId,
      authorName,
    })
    setPosts(updated)
    setTitle('')
    setContent('')
    setShowForm(false)
  }

  const handleDelete = (postId: string) => {
    if (!confirm('이 게시글을 삭제할까요?')) return
    setPosts(deletePost(postId))
  }

  const handleAddComment = (postId: string) => {
    const draft = (commentDrafts[postId] || '').trim()
    if (!draft) return
    const updated = addComment(postId, {
      content: draft,
      authorId,
      authorName,
      authorRole,
    })
    setPosts(updated)
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }))
  }

  const handleDeleteComment = (postId: string, commentId: string) => {
    setPosts(deleteComment(postId, commentId))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          게시판
        </h2>
        {canPost && (
          <Button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-xl h-10"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            새 글
          </Button>
        )}
      </div>

      {canPost && showForm && (
        <Card className="rounded-3xl border-2 border-secondary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">새 게시글 작성</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl"
            />
            <Textarea
              placeholder="내용을 입력해주세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="rounded-xl min-h-[120px]"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                disabled={!title.trim() || !content.trim()}
                className="flex-1 rounded-xl"
              >
                등록하기
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setTitle('')
                  setContent('')
                }}
                className="rounded-xl"
              >
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {posts.length === 0 ? (
        <Card className="rounded-3xl border-2 border-dashed border-border">
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">아직 게시글이 없어요</p>
            {canPost && (
              <p className="text-xs text-muted-foreground mt-1">
                첫 게시글을 작성해보세요!
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const isOpen = openPost === post.id
            const isMine = post.authorId === authorId && authorRole === 'teacher'
            return (
              <Card key={post.id} className="rounded-2xl border-2 border-border overflow-hidden">
                <CardContent className="p-0">
                  <button
                    onClick={() => setOpenPost(isOpen ? null : post.id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <GraduationCap className="w-4 h-4 text-secondary-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground truncate">
                            {post.authorName}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground truncate">
                          {post.title}
                        </h3>
                        {!isOpen && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {post.content}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {post.comments.length}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {isMine && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-xs text-destructive hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          게시글 삭제
                        </button>
                      )}

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          댓글 {post.comments.length}
                        </p>
                        {post.comments.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            첫 댓글을 남겨보세요!
                          </p>
                        )}
                        {post.comments.map((c) => {
                          const isMyComment = c.authorId === authorId
                          const Icon = c.authorRole === 'teacher' ? GraduationCap : Baby
                          return (
                            <div
                              key={c.id}
                              className={`p-3 rounded-xl ${
                                c.authorRole === 'teacher'
                                  ? 'bg-secondary/20'
                                  : 'bg-primary/10'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Icon className="w-3 h-3" />
                                  <span className="font-medium">{c.authorName}</span>
                                  <span>·</span>
                                  <span>{formatDate(c.createdAt)}</span>
                                </div>
                                {(isMyComment || authorRole === 'teacher') && (
                                  <button
                                    onClick={() => handleDeleteComment(post.id, c.id)}
                                    className="text-muted-foreground hover:text-destructive"
                                    aria-label="댓글 삭제"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p
                                className="text-sm text-foreground whitespace-pre-wrap"
                                style={
                                  c.authorRole === 'child'
                                    ? { fontFamily: childFontStack(c.id) }
                                    : undefined
                                }
                              >
                                {c.content}
                              </p>
                            </div>
                          )
                        })}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          placeholder="댓글을 남겨주세요"
                          value={commentDrafts[post.id] || ''}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleAddComment(post.id)
                            }
                          }}
                          className="rounded-xl"
                        />
                        <Button
                          onClick={() => handleAddComment(post.id)}
                          disabled={!(commentDrafts[post.id] || '').trim()}
                          className="rounded-xl"
                          size="icon"
                          aria-label="댓글 등록"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
