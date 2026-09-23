import { apiClient } from "@/src/lib/api";
import { Project, ProjectStatus } from "@/src/types";

interface ProjectsResponse {
  success: boolean;
  data: {
    projects: Project[];
  };
}

interface ProjectResponse {
  success: boolean;
  message?: string;
  data: {
    project: Project;
  };
}

export async function getTeamProjects(teamId: number): Promise<Project[]> {
  const response = await apiClient.get<ProjectsResponse>(`/teams/${teamId}/projects`);
  return response.data.projects;
}

export async function getProjectById(projectId: number): Promise<Project> {
  const response = await apiClient.get<ProjectResponse>(`/projects/${projectId}`);
  return response.data.project;
}

export async function createProject(
  teamId: number,
  payload: { name: string; description?: string }
): Promise<Project> {
  const response = await apiClient.post<ProjectResponse>(`/teams/${teamId}/projects`, payload);
  return response.data.project;
}

export async function updateProject(
  projectId: number,
  payload: { name?: string; description?: string; status?: ProjectStatus }
): Promise<Project> {
  const response = await apiClient.patch<ProjectResponse>(`/projects/${projectId}`, payload);
  return response.data.project;
}

export async function archiveProject(projectId: number): Promise<Project> {
  const response = await apiClient.delete<ProjectResponse>(`/projects/${projectId}`);
  return response.data.project;
}
