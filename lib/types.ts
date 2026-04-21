export interface Child {
  id: string;
  name: string;
  password: string;
  className: string;
  teacherName: string;
  createdAt: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedBy: string[];
}

export interface ClassInfo {
  name: string;
  teacher: string;
  children: string[];
  meetingLocation: string;
}

export type UserRole = 'child' | 'teacher' | null;

export type AuthorRole = 'child' | 'teacher';

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: AuthorRole;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  comments: Comment[];
}

export interface PrepItem {
  id: string;
  text: string;
}

export interface PrepGuide {
  items: PrepItem[];
  cautions: PrepItem[];
}

export interface AppState {
  currentChild: Child | null;
  isTeacher: boolean;
  children: Child[];
  missions: Mission[];
  classes: ClassInfo[];
}
