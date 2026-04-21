'use client';

import { getSupabase } from './supabase/client';
import type {
  Child,
  Mission,
  ClassInfo,
  Post,
  Comment,
  AuthorRole,
  PrepGuide,
} from './types';

// ─── Session (stays in localStorage — per-device) ─────────────

const STORAGE_KEYS = {
  CURRENT_CHILD: 'carat9559_current_child',
  IS_TEACHER: 'carat9559_is_teacher',
};

function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const item = localStorage.getItem(key);
  if (!item) return defaultValue;
  try {
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getCurrentChild(): Child | null {
  return getItem<Child | null>(STORAGE_KEYS.CURRENT_CHILD, null);
}
export function setCurrentChild(child: Child | null): void {
  setItem(STORAGE_KEYS.CURRENT_CHILD, child);
}
export function getIsTeacher(): boolean {
  return getItem<boolean>(STORAGE_KEYS.IS_TEACHER, false);
}
export function setIsTeacher(isTeacher: boolean): void {
  setItem(STORAGE_KEYS.IS_TEACHER, isTeacher);
}
export function logout(): void {
  setCurrentChild(null);
  setIsTeacher(false);
}

export const TEACHER_PASSWORD = '9559';
const DEFAULT_EVENT_DATE_ISO = '2026-05-05T10:00:00';

// ─── Row → domain mappers ─────────────────────────────────────

type ChildRow = {
  id: string;
  name: string;
  password: string;
  class_name: string;
  teacher_name: string;
  created_at: string;
};
const childFromRow = (r: ChildRow): Child => ({
  id: r.id,
  name: r.name,
  password: r.password,
  className: r.class_name,
  teacherName: r.teacher_name,
  createdAt: r.created_at,
});

type ClassRow = {
  name: string;
  teacher: string;
  meeting_location: string;
  display_order: number;
};

type MissionRow = {
  id: string;
  title: string;
  description: string;
  class_names: string[];
  created_at: string;
};

type PostRow = {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
};

type CommentRow = {
  id: string;
  post_id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_role: AuthorRole;
  created_at: string;
};

// ─── Classes ──────────────────────────────────────────────────

export async function getClasses(): Promise<ClassInfo[]> {
  const { data, error } = await getSupabase()
    .from('classes')
    .select('*')
    .order('display_order');
  if (error) throw error;
  return (data as ClassRow[]).map((r) => ({
    name: r.name,
    teacher: r.teacher,
    children: [],
    meetingLocation: r.meeting_location,
  }));
}

// ─── Children ─────────────────────────────────────────────────

export async function getChildren(): Promise<Child[]> {
  const { data, error } = await getSupabase()
    .from('children')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as ChildRow[]).map(childFromRow);
}

export async function saveChild(child: Child): Promise<void> {
  const row = {
    id: child.id,
    name: child.name,
    password: child.password,
    class_name: child.className,
    teacher_name: child.teacherName,
  };
  // upsert by id; if id is empty Supabase will generate one
  const { error } = await getSupabase()
    .from('children')
    .upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteChild(id: string): Promise<void> {
  // mission_completions rows cascade via FK (ON DELETE CASCADE)
  const { error } = await getSupabase().from('children').delete().eq('id', id);
  if (error) throw error;
}

export async function findChildByNameAndPassword(
  name: string,
  password: string
): Promise<Child | null> {
  const { data, error } = await getSupabase()
    .from('children')
    .select('*')
    .eq('name', name)
    .eq('password', password)
    .maybeSingle();
  if (error) throw error;
  return data ? childFromRow(data as ChildRow) : null;
}

// ─── Missions ─────────────────────────────────────────────────

export async function getMissions(): Promise<Mission[]> {
  const sb = getSupabase();
  const [missionsRes, completionsRes] = await Promise.all([
    sb.from('missions').select('*').order('created_at', { ascending: true }),
    sb.from('mission_completions').select('mission_id, child_id'),
  ]);
  if (missionsRes.error) throw missionsRes.error;
  if (completionsRes.error) throw completionsRes.error;

  const byMission = new Map<string, string[]>();
  for (const row of completionsRes.data as { mission_id: string; child_id: string }[]) {
    const arr = byMission.get(row.mission_id) ?? [];
    arr.push(row.child_id);
    byMission.set(row.mission_id, arr);
  }

  return (missionsRes.data as MissionRow[]).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    classNames: r.class_names ?? [],
    completed: false,
    completedBy: byMission.get(r.id) ?? [],
  }));
}

export async function createMission(input: {
  title: string;
  description: string;
  classNames: string[];
}): Promise<Mission[]> {
  const { error } = await getSupabase().from('missions').insert({
    title: input.title,
    description: input.description,
    class_names: input.classNames,
  });
  if (error) throw error;
  return getMissions();
}

export async function deleteMission(id: string): Promise<Mission[]> {
  const { error } = await getSupabase().from('missions').delete().eq('id', id);
  if (error) throw error;
  return getMissions();
}

export async function toggleMissionForChild(
  missionId: string,
  childId: string
): Promise<Mission[]> {
  const sb = getSupabase();
  const { data: existing, error: selErr } = await sb
    .from('mission_completions')
    .select('mission_id')
    .eq('mission_id', missionId)
    .eq('child_id', childId)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing) {
    const { error } = await sb
      .from('mission_completions')
      .delete()
      .eq('mission_id', missionId)
      .eq('child_id', childId);
    if (error) throw error;
  } else {
    const { error } = await sb
      .from('mission_completions')
      .insert({ mission_id: missionId, child_id: childId });
    if (error) throw error;
  }
  return getMissions();
}

// ─── Posts & Comments ─────────────────────────────────────────

export async function getPosts(): Promise<Post[]> {
  const sb = getSupabase();
  const [postsRes, commentsRes] = await Promise.all([
    sb.from('posts').select('*').order('created_at', { ascending: false }),
    sb.from('comments').select('*').order('created_at', { ascending: true }),
  ]);
  if (postsRes.error) throw postsRes.error;
  if (commentsRes.error) throw commentsRes.error;

  const commentsByPost = new Map<string, Comment[]>();
  for (const row of commentsRes.data as CommentRow[]) {
    const c: Comment = {
      id: row.id,
      content: row.content,
      authorId: row.author_id,
      authorName: row.author_name,
      authorRole: row.author_role,
      createdAt: row.created_at,
    };
    const arr = commentsByPost.get(row.post_id) ?? [];
    arr.push(c);
    commentsByPost.set(row.post_id, arr);
  }

  return (postsRes.data as PostRow[]).map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    authorId: r.author_id,
    authorName: r.author_name,
    createdAt: r.created_at,
    comments: commentsByPost.get(r.id) ?? [],
  }));
}

export async function createPost(input: {
  title: string;
  content: string;
  authorId: string;
  authorName: string;
}): Promise<Post[]> {
  const { error } = await getSupabase().from('posts').insert({
    title: input.title,
    content: input.content,
    author_id: input.authorId,
    author_name: input.authorName,
  });
  if (error) throw error;
  return getPosts();
}

export async function deletePost(postId: string): Promise<Post[]> {
  const { error } = await getSupabase().from('posts').delete().eq('id', postId);
  if (error) throw error;
  return getPosts();
}

export async function addComment(
  postId: string,
  input: {
    content: string;
    authorId: string;
    authorName: string;
    authorRole: AuthorRole;
  }
): Promise<Post[]> {
  const { error } = await getSupabase().from('comments').insert({
    post_id: postId,
    content: input.content,
    author_id: input.authorId,
    author_name: input.authorName,
    author_role: input.authorRole,
  });
  if (error) throw error;
  return getPosts();
}

export async function deleteComment(
  _postId: string,
  commentId: string
): Promise<Post[]> {
  const { error } = await getSupabase().from('comments').delete().eq('id', commentId);
  if (error) throw error;
  return getPosts();
}

// ─── Prep guide ───────────────────────────────────────────────

export async function getPrepGuide(): Promise<PrepGuide> {
  const { data, error } = await getSupabase()
    .from('prep_items')
    .select('*')
    .order('display_order');
  if (error) throw error;
  const items = (data as { id: string; kind: 'items' | 'cautions'; text: string }[]).filter(
    (r) => r.kind === 'items'
  );
  const cautions = (data as { id: string; kind: 'items' | 'cautions'; text: string }[]).filter(
    (r) => r.kind === 'cautions'
  );
  return {
    items: items.map((r) => ({ id: r.id, text: r.text })),
    cautions: cautions.map((r) => ({ id: r.id, text: r.text })),
  };
}

export async function addPrepItem(
  kind: 'items' | 'cautions',
  text: string
): Promise<PrepGuide> {
  // naive display_order: use count+1 for this kind
  const sb = getSupabase();
  const { count } = await sb
    .from('prep_items')
    .select('*', { count: 'exact', head: true })
    .eq('kind', kind);
  const { error } = await sb.from('prep_items').insert({
    kind,
    text,
    display_order: (count ?? 0) + 1,
  });
  if (error) throw error;
  return getPrepGuide();
}

export async function removePrepItem(
  _kind: 'items' | 'cautions',
  id: string
): Promise<PrepGuide> {
  const { error } = await getSupabase().from('prep_items').delete().eq('id', id);
  if (error) throw error;
  return getPrepGuide();
}

// ─── Event date (app_settings) ────────────────────────────────

export async function getEventDate(): Promise<Date> {
  const { data, error } = await getSupabase()
    .from('app_settings')
    .select('value')
    .eq('key', 'event_date')
    .maybeSingle();
  if (error) throw error;
  const iso = (data?.value as string | undefined) ?? DEFAULT_EVENT_DATE_ISO;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date(DEFAULT_EVENT_DATE_ISO) : d;
}

export async function setEventDate(d: Date): Promise<void> {
  const { error } = await getSupabase()
    .from('app_settings')
    .upsert({ key: 'event_date', value: d.toISOString(), updated_at: new Date().toISOString() });
  if (error) throw error;
}
