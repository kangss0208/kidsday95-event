'use client';

import type {
  Child,
  Mission,
  ClassInfo,
  Post,
  Comment,
  AuthorRole,
  PrepGuide,
  PrepItem,
} from './types';

const STORAGE_KEYS = {
  CHILDREN: 'carat9559_children',
  MISSIONS: 'carat9559_missions',
  CLASSES: 'carat9559_classes',
  CURRENT_CHILD: 'carat9559_current_child',
  IS_TEACHER: 'carat9559_is_teacher',
  POSTS: 'carat9559_posts',
  PREP_GUIDE: 'carat9559_prep_guide',
  EVENT_DATE: 'carat9559_event_date',
};

const DEFAULT_EVENT_DATE_ISO = '2026-05-05T10:00:00';

const DEFAULT_PREP_GUIDE: PrepGuide = {
  items: [
    { id: 'p1', text: '이름표와 명찰' },
    { id: 'p2', text: '편한 운동화' },
    { id: 'p3', text: '물통과 간식' },
  ],
  cautions: [
    { id: 'c1', text: '선생님이 안내하는 장소에서 벗어나지 않아요' },
    { id: 'c2', text: '친구들과 사이좋게 지내요' },
    { id: 'c3', text: '미끄러운 곳에서는 뛰지 않아요' },
  ],
};

// Default missions - empty; teachers add per-class missions themselves
const DEFAULT_MISSIONS: Mission[] = [];

// Default classes
const DEFAULT_CLASSES: ClassInfo[] = [
  {
    name: '홍랑해',
    teacher: '김뮤우 원장님',
    children: [],
    meetingLocation: '1층 로비 - 홍랑해 깃발 앞',
  },
  {
    name: '논랑해',
    teacher: '강금쪽 선생님',
    children: [],
    meetingLocation: '1층 로비 - 논랑해 깃발 앞',
  },
  {
    name: '하니해',
    teacher: '김쫑하 선생님',
    children: [],
    meetingLocation: '2층 복도 - 하니해 깃발 앞',
  },
];

// Teacher credentials
export const TEACHER_PASSWORD = '9559';

// Helper functions
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

// Children
export function getChildren(): Child[] {
  const children = getItem<Child[]>(STORAGE_KEYS.CHILDREN, []);
  // Migrate: if a child's className no longer matches an active class,
  // reset them to unassigned so the teacher can re-assign from current list.
  const validNames = new Set(getClasses().map((c) => c.name));
  let changed = false;
  const fixed = children.map((c) => {
    if (c.className && !validNames.has(c.className)) {
      changed = true;
      return { ...c, className: '', teacherName: '' };
    }
    return c;
  });
  if (changed) setItem(STORAGE_KEYS.CHILDREN, fixed);
  return fixed;
}

export function saveChild(child: Child): void {
  const children = getChildren();
  const existingIndex = children.findIndex((c) => c.id === child.id);
  if (existingIndex >= 0) {
    children[existingIndex] = child;
  } else {
    children.push(child);
  }
  setItem(STORAGE_KEYS.CHILDREN, children);
}

export function deleteChild(id: string): void {
  const children = getChildren().filter((c) => c.id !== id);
  setItem(STORAGE_KEYS.CHILDREN, children);
  // Also scrub id from mission completedBy lists so analytics stay accurate
  const missions = getItem<Mission[]>(STORAGE_KEYS.MISSIONS, []);
  if (missions.length > 0) {
    const cleaned = missions.map((m) => ({
      ...m,
      completedBy: m.completedBy.filter((cid) => cid !== id),
    }));
    setItem(STORAGE_KEYS.MISSIONS, cleaned);
  }
}

export function findChildByNameAndPassword(name: string, password: string): Child | null {
  const children = getChildren();
  return children.find((c) => c.name === name && c.password === password) || null;
}

// Missions
export function getMissions(): Mission[] {
  const missions = getItem<Mission[]>(STORAGE_KEYS.MISSIONS, []);
  // Migrate legacy missions (pre class-scoped). If any record lacks classNames,
  // clear the list — per-class missions are added fresh by the teacher.
  if (missions.some((m) => !Array.isArray((m as Mission).classNames))) {
    setItem(STORAGE_KEYS.MISSIONS, []);
    return [];
  }
  // Drop class names no longer present; remove missions with zero valid classes.
  const validNames = new Set(getClasses().map((c) => c.name));
  let changed = false;
  const cleaned = missions
    .map((m) => {
      const kept = m.classNames.filter((n) => validNames.has(n));
      if (kept.length !== m.classNames.length) changed = true;
      return { ...m, classNames: kept };
    })
    .filter((m) => m.classNames.length > 0);
  if (changed || cleaned.length !== missions.length) {
    setItem(STORAGE_KEYS.MISSIONS, cleaned);
  }
  return cleaned;
}

export function saveMissions(missions: Mission[]): void {
  setItem(STORAGE_KEYS.MISSIONS, missions);
}

export function toggleMissionForChild(missionId: string, childId: string): Mission[] {
  const missions = getMissions();
  const updatedMissions = missions.map((mission) => {
    if (mission.id === missionId) {
      const isCompleted = mission.completedBy.includes(childId);
      return {
        ...mission,
        completedBy: isCompleted
          ? mission.completedBy.filter((id) => id !== childId)
          : [...mission.completedBy, childId],
      };
    }
    return mission;
  });
  saveMissions(updatedMissions);
  return updatedMissions;
}

// Classes
export function getClasses(): ClassInfo[] {
  const classes = getItem<ClassInfo[]>(STORAGE_KEYS.CLASSES, []);
  if (classes.length === 0) {
    setItem(STORAGE_KEYS.CLASSES, DEFAULT_CLASSES);
    return DEFAULT_CLASSES;
  }
  // Migrate: if stored classes don't match current defaults by name, replace.
  const defaultNames = new Set(DEFAULT_CLASSES.map((c) => c.name));
  const storedNames = new Set(classes.map((c) => c.name));
  const mismatch =
    storedNames.size !== defaultNames.size ||
    [...storedNames].some((n) => !defaultNames.has(n));
  if (mismatch) {
    setItem(STORAGE_KEYS.CLASSES, DEFAULT_CLASSES);
    return DEFAULT_CLASSES;
  }
  return classes;
}

export function saveClasses(classes: ClassInfo[]): void {
  setItem(STORAGE_KEYS.CLASSES, classes);
}

// Session
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

// Bulletin board — Posts & Comments
export function getPosts(): Post[] {
  return getItem<Post[]>(STORAGE_KEYS.POSTS, []);
}

function savePosts(posts: Post[]): Post[] {
  setItem(STORAGE_KEYS.POSTS, posts);
  return posts;
}

export function createPost(input: {
  title: string;
  content: string;
  authorId: string;
  authorName: string;
}): Post[] {
  const posts = getPosts();
  const newPost: Post = {
    id: Date.now().toString(),
    title: input.title,
    content: input.content,
    authorId: input.authorId,
    authorName: input.authorName,
    createdAt: new Date().toISOString(),
    comments: [],
  };
  return savePosts([newPost, ...posts]);
}

export function deletePost(postId: string): Post[] {
  return savePosts(getPosts().filter((p) => p.id !== postId));
}

export function addComment(
  postId: string,
  input: {
    content: string;
    authorId: string;
    authorName: string;
    authorRole: AuthorRole;
  }
): Post[] {
  const newComment: Comment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    content: input.content,
    authorId: input.authorId,
    authorName: input.authorName,
    authorRole: input.authorRole,
    createdAt: new Date().toISOString(),
  };
  const updated = getPosts().map((p) =>
    p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
  );
  return savePosts(updated);
}

export function deleteComment(postId: string, commentId: string): Post[] {
  const updated = getPosts().map((p) =>
    p.id === postId
      ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
      : p
  );
  return savePosts(updated);
}

// Prep guide
export function getPrepGuide(): PrepGuide {
  const stored = getItem<PrepGuide | null>(STORAGE_KEYS.PREP_GUIDE, null);
  if (!stored) {
    setItem(STORAGE_KEYS.PREP_GUIDE, DEFAULT_PREP_GUIDE);
    return DEFAULT_PREP_GUIDE;
  }
  return stored;
}

function savePrepGuide(guide: PrepGuide): PrepGuide {
  setItem(STORAGE_KEYS.PREP_GUIDE, guide);
  return guide;
}

export function addPrepItem(kind: 'items' | 'cautions', text: string): PrepGuide {
  const guide = getPrepGuide();
  const newItem: PrepItem = {
    id: `${kind}-${Date.now()}`,
    text,
  };
  return savePrepGuide({ ...guide, [kind]: [...guide[kind], newItem] });
}

export function removePrepItem(kind: 'items' | 'cautions', id: string): PrepGuide {
  const guide = getPrepGuide();
  return savePrepGuide({
    ...guide,
    [kind]: guide[kind].filter((it) => it.id !== id),
  });
}

// Event date
export function getEventDate(): Date {
  const stored = getItem<string | null>(STORAGE_KEYS.EVENT_DATE, null);
  if (!stored) return new Date(DEFAULT_EVENT_DATE_ISO);
  const d = new Date(stored);
  return isNaN(d.getTime()) ? new Date(DEFAULT_EVENT_DATE_ISO) : d;
}

export function setEventDate(d: Date): void {
  setItem(STORAGE_KEYS.EVENT_DATE, d.toISOString());
}
