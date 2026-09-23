import { apiClient } from "@/src/lib/api";
import { Sprint, SprintStatus, Task } from "@/src/types";

interface SprintsResponse {
  success: boolean;
  data: {
    sprints: Sprint[];
  };
}

interface SprintResponse {
  success: boolean;
  message?: string;
  data: {
    sprint: Sprint;
  };
}

interface SprintTasksResponse {
  success: boolean;
  data: Task[];
}

export async function getProjectSprints(projectId: number): Promise<Sprint[]> {
  const response = await apiClient.get<SprintsResponse>(`/projects/${projectId}/sprints`);
  return response.data.sprints;
}

export async function getSprintById(sprintId: number): Promise<Sprint> {
  const response = await apiClient.get<SprintResponse>(`/sprints/${sprintId}`);
  return response.data.sprint;
}

export async function createSprint(
  projectId: number,
  payload: { name: string; goal?: string; startDate: string; endDate: string }
): Promise<Sprint> {
  const response = await apiClient.post<SprintResponse>(`/projects/${projectId}/sprints`, payload);
  return response.data.sprint;
}

export async function updateSprint(
  sprintId: number,
  payload: { name?: string; goal?: string; startDate?: string; endDate?: string; status?: SprintStatus }
): Promise<Sprint> {
  const response = await apiClient.patch<SprintResponse>(`/sprints/${sprintId}`, payload);
  return response.data.sprint;
}

export async function getSprintTasks(sprintId: number): Promise<Task[]> {
  const response = await apiClient.get<SprintTasksResponse | { data: { tasks: Task[] } }>(`/sprints/${sprintId}/tasks`);
  const data = response.data as any;
  return Array.isArray(data) ? data : data?.tasks || [];
}
