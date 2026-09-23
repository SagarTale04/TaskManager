"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import AppShell from "@/src/components/layout/AppShell";
import StatCard from "@/src/components/dashboard/StatCard";
import SprintProgressCard from "@/src/components/dashboard/SprintProgressCard";
import TaskOverviewCard from "@/src/components/dashboard/TaskOverviewCard";
import DeveloperWorkloadCard from "@/src/components/dashboard/DeveloperWorkloadCard";
import RecentTasksTable from "@/src/components/dashboard/RecentTasksTable";
import { Team, Project, Sprint, Task, User } from "@/src/types";
import { getMyTeams } from "@/src/services/teamService";
import { getTeamProjects } from "@/src/services/projectService";
import { getProjectSprints } from "@/src/services/sprintService";
import { getProjectTasks } from "@/src/services/taskService";
import { getAllUsers } from "@/src/services/userService";
import { useAuth } from "@/src/context/AuthContext";
import { useTaskInteraction } from "@/src/context/TaskInteractionContext";
import {
  Plus,
  Calendar,
  FolderKanban,
  Zap,
  CheckCircle2,
  Users2,
  Loader2,
  AlertCircle,
  Briefcase,
  ShieldCheck,
  Code2,
  Clock,
  ArrowUpRight,
  Filter,
  Layers,
  X,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const { tasksRevision } = useTaskInteraction();

  const isDeveloper = user?.role === "DEVELOPER";

  // Data states
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allSprints, setAllSprints] = useState<Sprint[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedTeamId, setSelectedTeamId] = useState<number | "ALL">("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<number | "ALL">("ALL");
  const [selectedDeveloperFilter, setSelectedDeveloperFilter] = useState<number | "unassigned" | null>(null);

  // Load all user's teams, projects, sprints, and tasks concurrently
  const loadDashboardData = useCallback(async () => {
    try {
      setError(null);
      const [myTeams, usersList] = await Promise.all([
        getMyTeams().catch(() => []),
        getAllUsers().catch(() => []),
      ]);

      setTeams(myTeams);
      setAllUsers(usersList);

      let fetchedProjects: Project[] = [];
      for (const team of myTeams) {
        const teamProjects = await getTeamProjects(team.id).catch(() => []);
        fetchedProjects = [...fetchedProjects, ...teamProjects];
      }
      setProjects(fetchedProjects);

      // Concurrently fetch tasks and sprints for all projects
      const tasksPromises = fetchedProjects.map((p) =>
        getProjectTasks(p.id, { limit: 100 })
          .then((res) => res.tasks)
          .catch(() => [] as Task[])
      );
      const sprintsPromises = fetchedProjects.map((p) =>
        getProjectSprints(p.id).catch(() => [] as Sprint[])
      );

      const [tasksArrays, sprintsArrays] = await Promise.all([
        Promise.all(tasksPromises),
        Promise.all(sprintsPromises),
      ]);

      const flatTasks = tasksArrays.flat();
      const flatSprints = sprintsArrays.flat();

      setAllTasks(flatTasks);
      setAllSprints(flatSprints);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard telemetry";
      setError(msg);
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(async () => {
      if (!ignore) {
        await loadDashboardData();
      }
    });
    return () => {
      ignore = true;
    };
  }, [loadDashboardData, tasksRevision]);

  // Scoped data calculations based on filters
  const filteredProjectsByTeam = useMemo(() => {
    if (selectedTeamId === "ALL") return projects;
    return projects.filter((p) => p.teamId === selectedTeamId);
  }, [projects, selectedTeamId]);

  const activeSprints = useMemo(() => {
    return allSprints.filter((s) => {
      const matchesStatus = s.status === "ACTIVE";
      if (selectedProjectId !== "ALL") return matchesStatus && s.projectId === selectedProjectId;
      if (selectedTeamId !== "ALL") {
        const teamProjectIds = filteredProjectsByTeam.map((p) => p.id);
        return matchesStatus && teamProjectIds.includes(s.projectId);
      }
      return matchesStatus;
    });
  }, [allSprints, selectedProjectId, selectedTeamId, filteredProjectsByTeam]);

  // Tasks scoped by selected team / project / developer
  const scopedTasks = useMemo(() => {
    return allTasks.filter((t) => {
      if (selectedProjectId !== "ALL" && t.projectId !== selectedProjectId) {
        return false;
      }
      if (selectedTeamId !== "ALL") {
        const teamProjectIds = filteredProjectsByTeam.map((p) => p.id);
        if (!teamProjectIds.includes(t.projectId)) return false;
      }
      if (selectedDeveloperFilter !== null) {
        if (selectedDeveloperFilter === "unassigned") {
          if (t.assignedTo !== null && t.assignedTo !== undefined) return false;
        } else {
          if (t.assignedTo !== selectedDeveloperFilter && t.assignee?.id !== selectedDeveloperFilter) {
            return false;
          }
        }
      }
      return true;
    });
  }, [allTasks, selectedProjectId, selectedTeamId, filteredProjectsByTeam, selectedDeveloperFilter]);

  // Task status counts from scoped tasks
  const todoTasks = useMemo(() => scopedTasks.filter((t) => t.status === "TODO"), [scopedTasks]);
  const inProgressTasks = useMemo(
    () => scopedTasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW"),
    [scopedTasks]
  );
  const doneTasks = useMemo(() => scopedTasks.filter((t) => t.status === "DONE"), [scopedTasks]);

  const totalTasksCount = scopedTasks.length;
  const completedTasksCount = doneTasks.length;
  const completionPercentage =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Developer-specific scoped tasks (ONLY tasks assigned to logged-in user)
  const myAssignedTasks = useMemo(() => {
    return allTasks.filter((t) => t.assignedTo === user?.id || t.assignee?.id === user?.id);
  }, [allTasks, user?.id]);

  const myTodoTasks = useMemo(() => myAssignedTasks.filter((t) => t.status === "TODO"), [myAssignedTasks]);
  const myInProgressTasks = useMemo(
    () => myAssignedTasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW"),
    [myAssignedTasks]
  );
  const myDoneTasks = useMemo(() => myAssignedTasks.filter((t) => t.status === "DONE"), [myAssignedTasks]);

  // Unique team developers across managed teams
  const teamDevelopers = useMemo(() => {
    const devIds = new Set<number>();
    teams.forEach((t) => {
      t.teamMembers?.forEach((m) => {
        if (m.role === "MEMBER") devIds.add(m.userId);
      });
    });
    return allUsers.filter((u) => devIds.has(u.id));
  }, [teams, allUsers]);

  // Super Admin breakdown
  const adminUsersCount = allUsers.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length;
  const devUsersCount = allUsers.filter((u) => u.role === "DEVELOPER").length;

  const displayName = user?.name || "User";
  const currentDateFormatted = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const selectedProjectObj =
    selectedProjectId !== "ALL" ? projects.find((p) => p.id === selectedProjectId) : null;
  const selectedTeamObj =
    selectedTeamId !== "ALL" ? teams.find((t) => t.id === selectedTeamId) : null;

  return (
    <AppShell>
      <div className="space-y-5 sm:space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-400 mb-1">
              <span>SyncSprint</span>
              <span>/</span>
              <span className="font-semibold text-stone-700">
                {isSuperAdmin
                  ? "Organization Oversight"
                  : isAdmin
                  ? "Engineering Management"
                  : "Developer Workspace"}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isSuperAdmin
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : isAdmin
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {user?.role || "DEVELOPER"}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              Welcome Back, {displayName}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              {isSuperAdmin &&
                "System-wide governance, global team workspaces, and cross-organization telemetry."}
              {isAdmin &&
                "Workspace management, developer workload allocation, active sprint velocity, and task tracking."}
              {isDeveloper &&
                "Your sprint focus, assigned engineering deliverables, and active project issues."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {/* Real Date Pill */}
            <div className="flex items-center gap-1.5 bg-stone-50 rounded-full px-3.5 py-1.5 border border-stone-200 text-xs text-stone-600 font-medium">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>{currentDateFormatted}</span>
            </div>

            {/* Role-Specific Actions */}
            {isSuperAdmin && (
              <>
                <Link
                  href="/teams"
                  className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Users2 className="w-3.5 h-3.5" />
                  <span>Manage Teams</span>
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Project</span>
                </Link>
              </>
            )}

            {isAdmin && !isSuperAdmin && (
              <>
                <Link
                  href="/teams"
                  className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Users2 className="w-3.5 h-3.5" />
                  <span>Manage Teams</span>
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Project</span>
                </Link>
              </>
            )}

            {isDeveloper && projects.length > 0 && (
              <Link
                href={`/projects/${projects[0].id}?tab=board`}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <span>View Kanban Board</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadDashboardData()}
              className="text-rose-800 font-semibold underline underline-offset-2 hover:text-rose-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* ADMIN & SUPER ADMIN: Team & Project Scoping Filter Bar */}
        {(isAdmin || isSuperAdmin) && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                <span>Scope Dashboard:</span>
              </div>

              {/* Team Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500 font-medium">Team:</span>
                <select
                  value={selectedTeamId}
                  onChange={(e) => {
                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                    setSelectedTeamId(val);
                    setSelectedProjectId("ALL");
                  }}
                  className="text-xs font-semibold bg-white border border-stone-200 rounded-xl px-2.5 py-1 text-stone-800 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
                >
                  <option value="ALL">All Managed Teams ({teams.length})</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (ID #{t.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500 font-medium">Project:</span>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                    setSelectedProjectId(val);
                  }}
                  className="text-xs font-semibold bg-white border border-stone-200 rounded-xl px-2.5 py-1 text-stone-800 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
                >
                  <option value="ALL">All Projects ({filteredProjectsByTeam.length})</option>
                  {filteredProjectsByTeam.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filter Indicators & Clear Action */}
            <div className="flex items-center gap-2 flex-wrap">
              {selectedDeveloperFilter !== null && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  <span>
                    Developer:{" "}
                    {selectedDeveloperFilter === "unassigned"
                      ? "Unassigned"
                      : allUsers.find((u) => u.id === selectedDeveloperFilter)?.name ||
                        `User #${selectedDeveloperFilter}`}
                  </span>
                  <button
                    onClick={() => setSelectedDeveloperFilter(null)}
                    className="hover:text-emerald-950 cursor-pointer"
                    title="Clear developer filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {(selectedTeamId !== "ALL" || selectedProjectId !== "ALL") && (
                <button
                  onClick={() => {
                    setSelectedTeamId("ALL");
                    setSelectedProjectId("ALL");
                    setSelectedDeveloperFilter(null);
                  }}
                  className="text-xs font-semibold text-stone-500 hover:text-stone-900 underline cursor-pointer"
                >
                  Reset all filters
                </button>
              )}

              {selectedProjectObj && (
                <Link
                  href={`/projects/${selectedProjectObj.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  <span>Open {selectedProjectObj.name} Workspace</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* StatCards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* SUPER ADMIN STATCARDS */}
          {isSuperAdmin && (
            <>
              <StatCard
                label="System Workspaces"
                value={loading ? "..." : teams.length}
                subtitle={`${teams.length} total organization teams`}
                badge="Global"
                icon={Users2}
                href="/teams"
              />
              <StatCard
                label="Global Projects"
                value={loading ? "..." : projects.length}
                subtitle={`${projects.filter((p) => p.status === "ACTIVE").length} active projects`}
                icon={FolderKanban}
                href="/projects"
              />
              <StatCard
                label="System Task Status"
                value={loading ? "..." : `${completedTasksCount} / ${totalTasksCount}`}
                subtitle={`${completionPercentage}% completed (${todoTasks.length} Todo · ${inProgressTasks.length} In Progress)`}
                icon={CheckCircle2}
                href="/tasks"
              />
              <StatCard
                label="Platform Users"
                value={loading ? "..." : allUsers.length}
                subtitle={`${adminUsersCount} Admins · ${devUsersCount} Developers`}
                badge="Directory"
                icon={ShieldCheck}
                href="/teams"
              />
            </>
          )}

          {/* ADMIN STATCARDS (No 'My Tasks' - Focus on Managed Work) */}
          {isAdmin && !isSuperAdmin && (
            <>
              <StatCard
                label="Managed Workspaces"
                value={loading ? "..." : `${teams.length} Teams`}
                subtitle={`${projects.length} managed project repos`}
                icon={FolderKanban}
                href="/projects"
              />
              <StatCard
                label="Active Sprints"
                value={loading ? "..." : `${activeSprints.length} In Flight`}
                subtitle={
                  activeSprints.length > 0
                    ? activeSprints.map((s) => s.name).slice(0, 2).join(", ")
                    : "No active sprints"
                }
                badge={activeSprints.length > 0 ? "Active" : undefined}
                icon={Zap}
                href={
                  projects.length > 0
                    ? `/projects/${selectedProjectId !== "ALL" ? selectedProjectId : projects[0].id}?tab=board`
                    : "/projects"
                }
              />
              <StatCard
                label="Task Status Breakdown"
                value={loading ? "..." : `${completedTasksCount} / ${totalTasksCount}`}
                subtitle={`${todoTasks.length} Todo · ${inProgressTasks.length} In Progress · ${doneTasks.length} Done`}
                trend={completedTasksCount > 0 ? `${completionPercentage}% closed` : undefined}
                icon={CheckCircle2}
                href="/tasks?status=DONE"
              />
              <StatCard
                label="Team Developers"
                value={loading ? "..." : `${teamDevelopers.length} Engineers`}
                subtitle={`${scopedTasks.filter((t) => t.assignedTo).length} assigned · ${scopedTasks.filter((t) => !t.assignedTo).length} unassigned`}
                badge="Workload"
                icon={Users2}
                href="/teams"
              />
            </>
          )}

          {/* DEVELOPER STATCARDS (Strictly personal assigned work) */}
          {isDeveloper && (
            <>
              <StatCard
                label="My Assigned Tasks"
                value={loading ? "..." : myAssignedTasks.length}
                subtitle="Tasks assigned directly to you"
                badge="My Work"
                icon={Code2}
                href="/tasks"
              />
              <StatCard
                label="In Progress"
                value={loading ? "..." : myInProgressTasks.length}
                subtitle="Active engineering deliverables"
                icon={Clock}
                href="/tasks?status=IN_PROGRESS"
              />
              <StatCard
                label="Completed by Me"
                value={loading ? "..." : myDoneTasks.length}
                subtitle={`${myAssignedTasks.length > 0 ? Math.round((myDoneTasks.length / myAssignedTasks.length) * 100) : 0}% completion rate`}
                trend={myDoneTasks.length > 0 ? `${myDoneTasks.length} closed` : undefined}
                icon={CheckCircle2}
                href="/tasks?status=DONE"
              />
              <StatCard
                label="My Team Projects"
                value={loading ? "..." : projects.length}
                subtitle={`${teams.length} team workspaces`}
                icon={FolderKanban}
                href="/projects"
              />
            </>
          )}
        </div>

        {/* Middle Section: Role-Specific Telemetry */}
        {isDeveloper ? (
          // DEVELOPER MIDDLE: Personal Sprint Focus + Personal Work Breakdown
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
            <div className="lg:col-span-8 flex flex-col">
              {loading ? (
                <div className="bg-white rounded-3xl border border-stone-200/80 p-8 shadow-xs flex flex-col items-center justify-center min-h-[320px]">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
                  <span className="text-xs text-stone-400">Loading sprint telemetry...</span>
                </div>
              ) : (
                <SprintProgressCard
                  sprint={activeSprints[0] || allSprints[0] || null}
                  tasks={myAssignedTasks}
                  completedTasks={myDoneTasks.length}
                  totalTasks={myAssignedTasks.length}
                />
              )}
            </div>

            <div className="lg:col-span-4 flex flex-col">
              <TaskOverviewCard
                title="My Work Breakdown"
                todoCount={myTodoTasks.length}
                inProgressCount={myInProgressTasks.length}
                doneCount={myDoneTasks.length}
                projectId={selectedProjectId !== "ALL" ? selectedProjectId : undefined}
              />
            </div>
          </div>
        ) : (
          // ADMIN & SUPER ADMIN MIDDLE: Sprints Delivery + Developer Workload Allocation
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
            {/* Active Sprints Overview */}
            <div className="lg:col-span-7 flex flex-col">
              {loading ? (
                <div className="bg-white rounded-3xl border border-stone-200/80 p-8 shadow-xs flex flex-col items-center justify-center min-h-[320px]">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
                  <span className="text-xs text-stone-400">Loading sprint telemetry...</span>
                </div>
              ) : activeSprints.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-base font-bold text-stone-900 tracking-tight">
                        Active Sprints ({activeSprints.length})
                      </h3>
                    </div>
                    <span className="text-xs text-stone-400">Live delivery cycles</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5">
                    {activeSprints.map((sp) => {
                      const sprintTasks = allTasks.filter((t) => t.sprintId === sp.id);
                      const spCompleted = sprintTasks.filter((t) => t.status === "DONE").length;
                      const spPct =
                        sprintTasks.length > 0
                          ? Math.round((spCompleted / sprintTasks.length) * 100)
                          : 0;
                      const parentProject = projects.find((p) => p.id === sp.projectId);

                      return (
                        <div
                          key={sp.id}
                          className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-all"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-stone-900">{sp.name}</span>
                                <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ACTIVE
                                </span>
                              </div>
                              <span className="text-[11px] font-semibold text-stone-500">
                                {parentProject?.name || `Project #${sp.projectId}`}
                              </span>
                            </div>

                            <p className="text-xs text-stone-600 mb-3 line-clamp-1">
                              {sp.goal || "Sprint delivery milestone"}
                            </p>

                            {/* Progress bar */}
                            <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden mb-2">
                              <div
                                style={{ width: `${spPct}%` }}
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100 text-stone-400">
                            <span>
                              {spCompleted} of {sprintTasks.length} tasks completed ({spPct}%)
                            </span>
                            <Link
                              href={`/projects/${sp.projectId}?tab=board&sprintId=${sp.id}`}
                              className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                            >
                              <span>Open on Board</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <SprintProgressCard
                  sprint={allSprints[0] || null}
                  tasks={scopedTasks}
                  completedTasks={completedTasksCount}
                  totalTasks={totalTasksCount}
                />
              )}
            </div>

            {/* Developer Workload Allocation (Clickable to drill down) */}
            <div className="lg:col-span-5 flex flex-col">
              <DeveloperWorkloadCard
                tasks={scopedTasks}
                title="Developer Workload"
                subtitle="Click any developer to drill into their assigned issues"
                selectedDeveloperId={selectedDeveloperFilter}
                onSelectDeveloper={(devId) => setSelectedDeveloperFilter(devId)}
              />
            </div>
          </div>
        )}

        {/* Bottom Section: Role-Specific Tasks Table */}
        <div>
          {isDeveloper ? (
            // DEVELOPER BOTTOM: Strictly "My Tasks"
            <RecentTasksTable
              tasks={myAssignedTasks}
              loading={loading}
              title="My Tasks"
              subtitle="Tasks assigned directly to you across your team projects. Click any task to update status (TODO → IN PROGRESS → DONE) or comment."
              assignedToUserId={user?.id}
            />
          ) : (
            // ADMIN & SUPER ADMIN BOTTOM: Team Tasks & Developer Assignments
            <RecentTasksTable
              tasks={scopedTasks}
              loading={loading}
              title={
                isSuperAdmin
                  ? "System-Wide Issues & Backlog"
                  : selectedProjectObj
                  ? `Team Tasks — ${selectedProjectObj.name}`
                  : selectedTeamObj
                  ? `Team Tasks — ${selectedTeamObj.name}`
                  : "Managed Team Tasks & Developer Assignments"
              }
              subtitle={
                selectedDeveloperFilter !== null
                  ? `Showing issues assigned to ${
                      selectedDeveloperFilter === "unassigned"
                        ? "Unassigned"
                        : allUsers.find((u) => u.id === selectedDeveloperFilter)?.name ||
                          `User #${selectedDeveloperFilter}`
                    }. Click any row to inspect or reassign.`
                  : "Review issue status, developer assignments, and priority across managed projects."
              }
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
