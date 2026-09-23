import { apiClient } from "@/src/lib/api";
import { Team, TeamMember } from "@/src/types";

interface TeamsResponse {
  success: boolean;
  data: {
    teams: Team[];
  };
}

interface TeamResponse {
  success: boolean;
  message?: string;
  data: {
    team: Team;
  };
}

interface MemberResponse {
  success: boolean;
  message?: string;
  data: {
    member: TeamMember;
  };
}

export async function getMyTeams(): Promise<Team[]> {
  const response = await apiClient.get<TeamsResponse>("/teams");
  return response.data.teams;
}

export async function createTeam(payload: { name: string; description?: string }): Promise<Team> {
  const response = await apiClient.post<TeamResponse>("/teams", payload);
  return response.data.team;
}

export async function addTeamMember(
  teamId: number,
  payload: { userId: number; role?: "ADMIN" | "MEMBER" }
): Promise<TeamMember> {
  const response = await apiClient.post<MemberResponse>(`/teams/${teamId}/members`, payload);
  return response.data.member;
}

export async function updateTeamMemberRole(
  teamId: number,
  userId: number,
  role: "ADMIN" | "MEMBER"
): Promise<TeamMember> {
  const response = await apiClient.patch<MemberResponse>(`/teams/${teamId}/members/${userId}`, { role });
  return response.data.member;
}

export async function removeTeamMember(teamId: number, userId: number): Promise<void> {
  await apiClient.delete(`/teams/${teamId}/members/${userId}`);
}
