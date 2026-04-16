'use client';

import type { Child, Mission, ClassInfo } from './types';

const STORAGE_KEYS = {
  CHILDREN: 'carat9559_children',
  MISSIONS: 'carat9559_missions',
  CLASSES: 'carat9559_classes',
  CURRENT_CHILD: 'carat9559_current_child',
  IS_TEACHER: 'carat9559_is_teacher',
};

// Default missions
const DEFAULT_MISSIONS: Mission[] = [
  {
    id: '1',
    title: '친구와 인사하기',
    description: '새로운 친구 3명에게 인사해요!',
    completed: false,
    completedBy: [],
  },
  {
    id: '2',
    title: '선생님 찾기',
    description: '우리 반 선생님을 찾아서 하이파이브해요!',
    completed: false,
    completedBy: [],
  },
  {
    id: '3',
    title: '간식 먹기',
    description: '맛있는 간식을 먹고 행복해지기!',
    completed: false,
    completedBy: [],
  },
  {
    id: '4',
    title: '사진 찍기',
    description: '친구들과 함께 재미있는 사진을 찍어요!',
    completed: false,
    completedBy: [],
  },
  {
    id: '5',
    title: '게임 참여하기',
    description: '신나는 게임에 참여해서 즐거운 시간을 보내요!',
    completed: false,
    completedBy: [],
  },
];

// Default classes
const DEFAULT_CLASSES: ClassInfo[] = [
  {
    name: '햇살반',
    teacher: '김사랑 선생님',
    children: [],
    meetingLocation: '1층 로비 - 햇살반 깃발 앞',
  },
  {
    name: '별빛반',
    teacher: '이하늘 선생님',
    children: [],
    meetingLocation: '1층 로비 - 별빛반 깃발 앞',
  },
  {
    name: '무지개반',
    teacher: '박구름 선생님',
    children: [],
    meetingLocation: '2층 복도 - 무지개반 깃발 앞',
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
  return getItem<Child[]>(STORAGE_KEYS.CHILDREN, []);
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

export function findChildByNameAndPassword(name: string, password: string): Child | null {
  const children = getChildren();
  return children.find((c) => c.name === name && c.password === password) || null;
}

// Missions
export function getMissions(): Mission[] {
  const missions = getItem<Mission[]>(STORAGE_KEYS.MISSIONS, []);
  if (missions.length === 0) {
    setItem(STORAGE_KEYS.MISSIONS, DEFAULT_MISSIONS);
    return DEFAULT_MISSIONS;
  }
  return missions;
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
