export type UserRole = "SUPER_ADMIN" | "ADMIN" | "DEVELOPER";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
}

export type TeamMemberRole = "OWNER" | "ADMIN" | "MEMBER";

export interface TeamMember {
  userId: number;
  teamId: number;
  role: TeamMemberRole;
  joinedAt?: string;
  user?: User;
}

export interface Team {
  id: number;
  name: string;
  description?: string | null;
  createdBy: number;
  created_at?: string;
  updated_at?: string;
  teamMembers?: {
    userId: number;
    role: TeamMemberRole;
    joinedAt?: string;
    user?: {
      id: number;
      name: string;
      email: string;
      role?: string;
    };
  }[];
}

export type ProjectStatus = "ACTIVE" | "ARCHIVED";

export interface Project {
  id: number;
  teamId: number;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  createdBy: number;
  created_at?: string;
  updated_at?: string;
  team?: Team;
}

export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface Sprint {
  id: number;
  projectId: number;
  name: string;
  goal?: string | null;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  createdBy?: number;
  created_at?: string;
  updated_at?: string;
}

// Aligned strictly with backend Task model: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Comment {
  id: number;
  taskId: number;
  userId: number;
  content: string;
  author?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface Task {
  id: number;
  projectId: number;
  sprintId?: number | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  storyPoints?: number | null;
  assignedTo?: number | null;
  createdBy: number;
  dueDate?: string | null;
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  assignee?: {
    id: number;
    name: string;
    email: string;
  } | null;
  sprint?: {
    id: number;
    name: string;
    status: SprintStatus;
  } | null;
  project?: {
    id: number;
    name: string;
    teamId: number;
    status: ProjectStatus;
  };
  comments?: Comment[];
}

export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedTasksResult {
  tasks: Task[];
  pagination: Pagination;
}
