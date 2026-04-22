"use client"

import { useState, useEffect, useRef } from "react"
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
  ImagePlus,
  X,
} from "lucide-react"
import type { Post, AuthorRole } from "@/lib/types"
import {
  getPosts,
  createPost,
  deletePost,
  addComment,
  deleteComment,
  uploadPostImage,
} from "@/lib/store"
import { getSupabase } from "@/lib/supabase/client"
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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [openPost, setOpenPost] = useState<string | null>(null)
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const p = await getPosts()
        if (!cancelled) setPosts(p)
      } catch (err) {
        console.error('Failed to load posts', err)
      }
    }
    load()

    const sb = getSupabase()
    const channel = sb
      .channel('bulletin-board')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, load)
      .subscribe()

    return () => {
      cancelled = true
      sb.removeChannel(channel)
    }
  }, [])

  const canPost = authorRole === 'teacher'

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleImageRemove = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const resetForm = () => {
    setTitle('')
    setContent('')
    handleImageRemove()
    setShowForm(false)
  }

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) return
    setUploading(true)
    try {
      let imageUrl: string | undefined
      if (imageFile) {
        imageUrl = await uploadPostImage(imageFile)
      }
      const updated = await createPost({
        title: title.trim(),
        content: content.trim(),
        authorId,
        authorName,
        imageUrl,
      })
      setPosts(updated)
      resetForm()
    } catch (err) {
      console.error('Failed to create post', err)
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      alert('게시글 등록에 실패했어요.\n\n' + msg)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('이 게시글을 삭제할까요?')) return
    try {
      setPosts(await deletePost(postId))
    } catch (err) {
      console.error('Failed to delete post', err)
    }
  }

  const handleAddComment = async (postId: string) => {
    const draft = (commentDrafts[postId] || '').trim()
    if (!draft) return
    try {
      const updated = await addComment(postId, {
        content: draft,
        authorId,
        authorName,
        authorRole,
      })
      setPosts(updated)
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }))
    } catch (err) {
      console.error('Failed to add comment', err)
    }
  }

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      setPosts(await deleteComment(postId, commentId))
    } catch (err) {
      console.error('Failed to delete comment', err)
    }
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

            {/* 이미지 첨부 (최대 1장) */}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImagePick}
              />
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="첨부 이미지 미리보기" className="w-full max-h-64 object-contain" />
                  <button
                    type="button"
                    onClick={handleImageRemove}
                    className="absolute top-2 right-2 bg-background/90 rounded-full p-1.5 shadow hover:bg-background"
                    aria-label="이미지 삭제"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl"
                >
                  <ImagePlus className="w-4 h-4 mr-2" />
                  이미지 첨부 (선택)
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                disabled={!title.trim() || !content.trim() || uploading}
                className="flex-1 rounded-xl"
              >
                {uploading ? '등록 중...' : '등록하기'}
              </Button>
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={uploading}
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
                      {post.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.imageUrl}
                          alt="게시글 이미지"
                          className="w-full rounded-2xl border border-border"
                        />
                      )}
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
                              className={`p-3 rounded-xl ${c.authorRole === 'teacher'
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
