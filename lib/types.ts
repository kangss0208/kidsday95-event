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

export interface AppState {
  currentChild: Child | null;
  isTeacher: boolean;
  children: Child[];
  missions: Mission[];
  classes: ClassInfo[];
}
