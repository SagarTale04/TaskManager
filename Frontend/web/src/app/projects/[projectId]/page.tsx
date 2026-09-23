"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/src/components/layout/AppShell";
import ProjectHeader from "@/src/components/project/ProjectHeader";
import KanbanBoard from "@/src/components/project/KanbanBoard";
import RecentTasksTable from "@/src/components/dashboard/RecentTasksTable";
import { User, Project, Sprint, Task, TaskPriority, TaskStatus, SprintStatus } from "@/src/types";
import { getProjectById, archiveProject } from "@/src/services/projectService";
import { getProjectSprints, createSprint, updateSprint } from "@/src/services/sprintService";
import { getProjectTasks, createTask } from "@/src/services/taskService";
import { getMyTeams, addTeamMember } from "@/src/services/teamService";
import { getAllUsers } from "@/src/services/userService";
import { useTaskInteraction } from "@/src/context/TaskInteractionContext";
import { useAuth } from "@/src/context/AuthContext";
import { Plus, Archive, Calendar, Zap, Loader2, AlertCircle, X } from "lucide-react";

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const { tasksRevision, notifyTasksChanged } = useTaskInteraction();

  const projectId = Number(params?.projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTeamRole, setUserTeamRole] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"board" | "overview" | "sprints" | "tasks">("board");
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
  const [teamMembers, setTeamMembers] = useState<{ id: number; name: string; email?: string }[]>([]);
  const [allPlatformUsers, setAllPlatformUsers] = useState<User[]>([]);

  // Create Task Modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("TODO");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("MEDIUM");
  const [taskStoryPoints, setTaskStoryPoints] = useState<number | "">("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskSprintId, setTaskSprintId] = useState<number | "">("");
  const [taskAssignedTo, setTaskAssignedTo] = useState<number | "">("");
  const [taskModalLoading, setTaskModalLoading] = useState(false);
  const [taskModalError, setTaskModalError] = useState<string | null>(null);

  // Create Sprint Modal state
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [sprintName, setSprintName] = useState("");
  const [sprintGoal, setSprintGoal] = useState("");
  const [sprintStart, setSprintStart] = useState("");
  const [sprintEnd, setSprintEnd] = useState("");
  const [sprintModalLoading, setSprintModalLoading] = useState(false);
  const [sprintModalError, setSprintModalError] = useState<string | null>(null);

  // Archive Project state
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    try {
      setError(null);
      const [projData, sprintsData, tasksData, myTeams, usersList] = await Promise.all([
        getProjectById(projectId),
        getProjectSprints(projectId),
        getProjectTasks(projectId, { limit: 100 }),
        getMyTeams().catch(() => []),
        getAllUsers().catch(() => []),
      ]);
      setProject(projData);
      setSprints(sprintsData);
      setTasks(tasksData.tasks);
      setAllPlatformUsers(usersList);

      const currentTeam = myTeams.find((t) => t.id === projData.teamId);
      if (currentTeam?.teamMembers) {
        const myMembership = currentTeam.teamMembers.find((m) => m.userId === user?.id);
        setUserTeamRole(myMembership?.role || null);
        setTeamMembers(
          currentTeam.teamMembers.map((m) => ({
            id: m.userId,
            name: m.user?.name || `User #${m.userId}`,
            email: m.user?.email,
          }))
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load project workspace";
      setError(msg);
      console.error("Workspace load error:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(async () => {
      if (!ignore) {
        await loadData();
      }
    });
    return () => {
      ignore = true;
    };
  }, [loadData, tasksRevision]);

  const activeSprint = sprints.find((s) => s.status === "ACTIVE") || sprints[0] || null;

  const canManage =
    (isSuperAdmin || isAdmin || userTeamRole === "OWNER" || userTeamRole === "ADMIN") &&
    project?.status !== "ARCHIVED";

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !projectId) return;
    setTaskModalLoading(true);
    setTaskModalError(null);

    try {
      const assignedUserId = taskAssignedTo !== "" ? Number(taskAssignedTo) : undefined;

      // If user is not yet a member of current team, auto-enroll them so task assignment succeeds
      if (assignedUserId && project?.teamId) {
        const isCurrentMember = teamMembers.some((m) => m.id === assignedUserId);
        if (!isCurrentMember) {
          try {
            await addTeamMember(project.teamId, {
              userId: assignedUserId,
              role: "MEMBER",
            });
          } catch (teamAddErr) {
            console.warn("Could not automatically add user to team:", teamAddErr);
          }
        }
      }

      await createTask(projectId, {
        title: taskTitle.trim(),
        description: taskDesc.trim() || undefined,
        status: taskStatus,
        priority: taskPriority,
        storyPoints: taskStoryPoints !== "" ? Number(taskStoryPoints) : undefined,
        dueDate: taskDueDate || undefined,
        sprintId: taskSprintId !== "" ? Number(taskSprintId) : undefined,
        assignedTo: assignedUserId,
      });

      setShowTaskModal(false);
      setTaskTitle("");
      setTaskDesc("");
      setTaskStoryPoints("");
      setTaskDueDate("");
      setTaskAssignedTo("");
      notifyTasksChanged();
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create task";
      setTaskModalError(msg);
    } finally {
      setTaskModalLoading(false);
    }
  };

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintName.trim() || !sprintStart || !sprintEnd || !projectId) {
      setSprintModalError("Please provide sprint name, start date, and end date.");
      return;
    }
    setSprintModalLoading(true);
    setSprintModalError(null);

    try {
      await createSprint(projectId, {
        name: sprintName.trim(),
        goal: sprintGoal.trim() || undefined,
        startDate: sprintStart,
        endDate: sprintEnd,
      });

      setShowSprintModal(false);
      setSprintName("");
      setSprintGoal("");
      setSprintStart("");
      setSprintEnd("");
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create sprint";
      setSprintModalError(msg);
    } finally {
      setSprintModalLoading(false);
    }
  };

  const handleUpdateSprintStatus = async (sprintId: number, status: SprintStatus) => {
    try {
      await updateSprint(sprintId, { status });
      loadData();
    } catch (err) {
      console.error("Failed to update sprint status:", err);
    }
  };

  const handleArchiveProject = async () => {
    if (!projectId || !confirm("Are you sure you want to archive this project?")) return;
    setArchiving(true);
    setArchiveError(null);
    try {
      await archiveProject(projectId);
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to archive project";
      setArchiveError(msg);
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="py-24 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-xs text-stone-400">Loading project workspace...</span>
        </div>
      </AppShell>
    );
  }

  if (error || !project) {
    return (
      <AppShell>
        <div className="p-8 border border-stone-200 rounded-2xl bg-white text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-stone-900">Project Not Found or Access Denied</h3>
          <p className="text-xs text-stone-500 mt-1 mb-4">
            {error || "You do not have access to this project, or it does not exist."}
          </p>
          <button
            onClick={() => router.push("/projects")}
            className="px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-800"
          >
            Back to Projects
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div>
        {/* Project Header with Tabs */}
        <ProjectHeader
          project={project}
          activeSprint={activeSprint}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onNewTaskClick={
            canManage
              ? () => {
                setTaskModalError(null);
                setShowTaskModal(true);
              }
              : undefined
          }
          canManage={canManage}
        />

        {/* Tab Contents: Board */}
        {activeTab === "board" && (
          <div className="space-y-3">
            {selectedSprintId && (
              <div className="flex items-center justify-between p-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200/60 text-xs text-emerald-800">
                <span className="font-medium">
                  Showing issues for sprint:{" "}
                  <strong>{sprints.find((s) => s.id === selectedSprintId)?.name || `#${selectedSprintId}`}</strong>
                </span>
                <button
                  onClick={() => setSelectedSprintId(null)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                >
                  Show all project issues
                </button>
              </div>
            )}
            <KanbanBoard
              projectId={project.id}
              tasks={selectedSprintId ? tasks.filter((t) => t.sprintId === selectedSprintId) : tasks}
              sprintId={selectedSprintId || activeSprint?.id}
              canManage={canManage}
              onRefresh={loadData}
            />
          </div>
        )}

        {/* Tab Contents: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 border border-stone-200 rounded-2xl p-5 bg-white space-y-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-1">
                  About {project.name}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {project.description || "No description provided for this project."}
                </p>
              </div>

              {activeSprint && (
                <div>
                  <h4 className="text-xs font-semibold text-stone-500 mb-2">
                    Active Sprint Objective
                  </h4>
                  <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200/60">
                    <span className="text-xs font-semibold text-stone-900 block mb-0.5">
                      {activeSprint.name}
                    </span>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {activeSprint.goal || "No specific goal specified."}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold text-stone-500 mb-2">
                  Project Metadata
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs bg-stone-50 rounded-xl p-3.5 border border-stone-100">
                  <div>
                    <span className="text-stone-400 block text-[11px]">Team ID</span>
                    <span className="font-semibold text-stone-800">Team #{project.teamId}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[11px]">Created By User</span>
                    <span className="font-semibold text-stone-800">User #{project.createdBy}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[11px]">Created Date</span>
                    <span className="font-mono text-stone-800">
                      {project.created_at ? new Date(project.created_at).toLocaleDateString() : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[11px]">Status</span>
                    <span className="font-semibold text-emerald-700">{project.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Sidebar */}
            <div className="space-y-4">
              <div className="border border-stone-200 rounded-2xl p-5 bg-white">
                <h4 className="text-xs font-bold text-stone-900 mb-3">
                  Workspace Administration
                </h4>

                {archiveError && (
                  <div className="mb-3 p-2 rounded-lg bg-rose-50 text-rose-700 text-xs">
                    {archiveError}
                  </div>
                )}

                {canManage ? (
                  project.status === "ACTIVE" ? (
                    <button
                      onClick={handleArchiveProject}
                      disabled={archiving}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>{archiving ? "Archiving..." : "Archive Project"}</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-stone-50 rounded-xl text-center text-xs text-stone-500 font-medium">
                      This project is archived (Read-Only).
                    </div>
                  )
                ) : (
                  <div className="p-3 bg-stone-50 rounded-xl text-center text-xs text-stone-500 font-medium">
                    You have view & task contribution access in this workspace.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Contents: Sprints */}
        {activeTab === "sprints" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Project Sprints</h3>
                <p className="text-xs text-stone-500">Plan and manage milestone sprint cycles</p>
              </div>

              {canManage && (
                <button
                  onClick={() => {
                    setSprintModalError(null);
                    setShowSprintModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Sprint</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sprints.map((sp) => (
                <div
                  key={sp.id}
                  className="border border-stone-200 rounded-2xl p-4 sm:p-5 bg-white flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-sm font-bold text-stone-900">{sp.name}</h4>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sp.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-stone-100 text-stone-600 border-stone-200"
                          }`}
                      >
                        {sp.status}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 mb-3 line-clamp-2">
                      {sp.goal || "No sprint goal specified."}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{sp.startDate} → {sp.endDate}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs pt-2.5 border-t border-stone-100">
                      <span className="text-stone-500 font-medium">
                        {tasks.filter((t) => t.sprintId === sp.id).length} issues in sprint
                      </span>
                      <button
                        onClick={() => {
                          setSelectedSprintId(sp.id);
                          setActiveTab("board");
                        }}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
                      >
                        Open on Board →
                      </button>
                    </div>
                  </div>

                  {canManage && (
                    <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="text-stone-400">Update Status:</span>
                      <div className="flex items-center gap-1">
                        {(["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"] as const).map((st) => (
                          <button
                            key={st}
                            onClick={() => handleUpdateSprintStatus(sp.id, st)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${sp.status === st
                                ? "bg-stone-900 text-white"
                                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                              }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {sprints.length === 0 && (
                <div className="col-span-2 py-12 border border-dashed border-stone-200 rounded-2xl text-center text-stone-400 text-xs">
                  No sprints have been created for this project yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Contents: Tasks */}
        {activeTab === "tasks" && (
          <div>
            <RecentTasksTable
              projectId={project.id}
              enablePagination={true}
              title={`${project.name} Task Backlog`}
              subtitle={`Complete listing of all issues and backlog items`}
            />
          </div>
        )}

        {/* Create Task Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/30 backdrop-blur-[1px]">
            <div
              className="fixed inset-0"
              onClick={() => !taskModalLoading && setShowTaskModal(false)}
            />
            <div className="relative w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-xl p-5 sm:p-6 z-10 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
                <h3 className="text-base font-bold text-stone-900">Create New Issue</h3>
                <button
                  onClick={() => setShowTaskModal(false)}
                  disabled={taskModalLoading}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {taskModalError && (
                <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{taskModalError}</span>
                </div>
              )}

              <form onSubmit={handleCreateTask} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Implement rate limiting on payments route"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    disabled={taskModalLoading}
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Detailed requirements, technical steps, acceptance criteria..."
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    disabled={taskModalLoading}
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Status
                    </label>
                    <select
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                      disabled={taskModalLoading}
                      className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-stone-800 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="TODO">TODO</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="IN_REVIEW">IN REVIEW</option>
                      <option value="DONE">DONE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                      disabled={taskModalLoading}
                      className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-stone-800 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Story Points
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="e.g. 5"
                      value={taskStoryPoints}
                      onChange={(e) =>
                        setTaskStoryPoints(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      disabled={taskModalLoading}
                      className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-stone-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      disabled={taskModalLoading}
                      className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-2 py-1.5 text-stone-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Sprint
                    </label>
                    <select
                      value={taskSprintId}
                      onChange={(e) =>
                        setTaskSprintId(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      disabled={taskModalLoading}
                      className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-stone-800 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">No Sprint</option>
                      {sprints.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Assignee
                  </label>
                  <select
                    value={taskAssignedTo}
                    onChange={(e) =>
                      setTaskAssignedTo(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    disabled={taskModalLoading}
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-stone-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.length > 0 && (
                      <optgroup label="Team Members">
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.email ? `(${m.email})` : ""}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {allPlatformUsers.filter((u) => !teamMembers.some((m) => m.id === u.id)).length > 0 && (
                      <optgroup label="Registered Platform Users">
                        {allPlatformUsers
                          .filter((u) => !teamMembers.some((m) => m.id === u.id))
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.email})
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    disabled={taskModalLoading}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={taskModalLoading || !taskTitle.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-2xs disabled:opacity-50"
                  >
                    {taskModalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Add Task</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Sprint Modal */}
        {showSprintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/30 backdrop-blur-[1px]">
            <div
              className="fixed inset-0"
              onClick={() => !sprintModalLoading && setShowSprintModal(false)}
            />
            <div className="relative w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-xl p-5 sm:p-6 z-10 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
                <h3 className="text-base font-bold text-stone-900">Plan New Sprint</h3>
                <button
                  onClick={() => setShowSprintModal(false)}
                  disabled={sprintModalLoading}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {sprintModalError && (
                <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{sprintModalError}</span>
                </div>
              )}

              <form onSubmit={handleCreateSprint} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Sprint Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sprint 15: Infra & Caching"
                    value={sprintName}
                    onChange={(e) => setSprintName(e.target.value)}
                    disabled={sprintModalLoading}
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Sprint Goal
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Key deliverable objective..."
                    value={sprintGoal}
                    onChange={(e) => setSprintGoal(e.target.value)}
                    disabled={sprintModalLoading}
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={sprintStart}
                      onChange={(e) => setSprintStart(e.target.value)}
                      disabled={sprintModalLoading}
                      className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-stone-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={sprintEnd}
                      onChange={(e) => setSprintEnd(e.target.value)}
                      disabled={sprintModalLoading}
                      className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-stone-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowSprintModal(false)}
                    disabled={sprintModalLoading}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sprintModalLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-2xs disabled:opacity-50"
                  >
                    {sprintModalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Create Sprint</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
