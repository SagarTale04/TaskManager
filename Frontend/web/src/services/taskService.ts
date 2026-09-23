import { apiClient } from "@/src/lib/api";
import { Task, TaskStatus, TaskPriority, PaginatedTasksResult, Comment } from "@/src/types";

interface TasksResponse {
  success: boolean;
  data: PaginatedTasksResult;
}

interface TaskResponse {
  success: boolean;
  message?: string;
  data: {
    task: Task;
  };
}

interface SingleTaskResponse {
  success: boolean;
  data: Task;
}

interface CommentsResponse {
  success: boolean;
  data: {
    comments: Comment[];
  };
}

interface CommentResponse {
  success: boolean;
  message?: string;
  data: {
    comment: Comment;
  };
}

export interface TaskQueryParams {
  sprintId?: number | string | null;
  status?: TaskStatus | string;
  priority?: TaskPriority | string;
  assignedTo?: number | string;
  search?: string;
  sortBy?: "createdAt" | "created_at" | "dueDate" | "due_date" | "priority" | "status" | "title";
  order?: "ASC" | "DESC" | "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  storyPoints?: number | null;
  assignedTo?: number | null;
  dueDate?: string | null;
  sprintId?: number | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  storyPoints?: number | null;
  assignedTo?: number | null;
  dueDate?: string | null;
  sprintId?: number | null;
}

export async function getProjectTasks(
  projectId: number,
  params?: TaskQueryParams
): Promise<PaginatedTasksResult> {
  const query = new URLSearchParams();
  if (params) {
    if (params.sprintId !== undefined && params.sprintId !== null) {
      query.append("sprintId", String(params.sprintId));
    }
    if (params.status && params.status !== "ALL") {
      query.append("status", params.status);
    }
    if (params.priority && params.priority !== "ALL") {
      query.append("priority", params.priority);
    }
    if (params.assignedTo) {
      query.append("assignedTo", String(params.assignedTo));
    }
    if (params.search?.trim()) {
      query.append("search", params.search.trim());
    }
    if (params.sortBy) {
      query.append("sortBy", params.sortBy);
    }
    if (params.order) {
      query.append("order", params.order);
    }
    if (params.page) {
      query.append("page", String(params.page));
    }
    if (params.limit) {
      query.append("limit", String(params.limit));
    }
  }

  const queryString = query.toString() ? `?${query.toString()}` : "";
  const response = await apiClient.get<TasksResponse>(`/projects/${projectId}/tasks${queryString}`);
  return response.data;
}

export async function getTaskById(taskId: number): Promise<Task> {
  const response = await apiClient.get<SingleTaskResponse | { data: { task: Task } }>(`/tasks/${taskId}`);
  const resData = response.data as any;
  return resData?.task || resData;
}

export async function createTask(projectId: number, payload: CreateTaskPayload): Promise<Task> {
  const response = await apiClient.post<TaskResponse>(`/projects/${projectId}/tasks`, payload);
  return response.data.task;
}

export async function updateTask(taskId: number, payload: UpdateTaskPayload): Promise<Task> {
  const response = await apiClient.patch<TaskResponse>(`/tasks/${taskId}`, payload);
  return response.data.task;
}

export async function deleteTask(taskId: number): Promise<void> {
  await apiClient.delete(`/tasks/${taskId}`);
}

export async function getTaskComments(taskId: number): Promise<Comment[]> {
  const response = await apiClient.get<CommentsResponse>(`/tasks/${taskId}/comments`);
  return response.data.comments;
}

export async function createComment(taskId: number, content: string): Promise<Comment> {
  const response = await apiClient.post<CommentResponse>(`/tasks/${taskId}/comments`, { content });
  return response.data.comment;
}

export async function updateComment(commentId: number, content: string): Promise<Comment> {
  const response = await apiClient.patch<CommentResponse>(`/comments/${commentId}`, { content });
  return response.data.comment;
}

export async function deleteComment(commentId: number): Promise<void> {
  await apiClient.delete(`/comments/${commentId}`);
}
