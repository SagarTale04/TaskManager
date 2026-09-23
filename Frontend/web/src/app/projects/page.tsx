"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import AppShell from "@/src/components/layout/AppShell";
import { Project, Team } from "@/src/types";
import { getMyTeams } from "@/src/services/teamService";
import { getTeamProjects, createProject } from "@/src/services/projectService";
import { Plus, Search, ArrowUpRight, Loader2, AlertCircle, X, Users2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";

function ProjectsContent() {
  const router = useRouter();
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const teamIdParam = searchParams.get("teamId");

  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "ARCHIVED">("ALL");
  const [selectedTeamId, setSelectedTeamId] = useState<number | "ALL">(
    teamIdParam ? Number(teamIdParam) : "ALL"
  );

  useEffect(() => {
    if (teamIdParam) {
      setSelectedTeamId(Number(teamIdParam));
    }
  }, [teamIdParam]);

  // Create Project Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTeamId, setCreateTeamId] = useState<number | "">("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setError(null);
      const myTeams = await getMyTeams();
      setTeams(myTeams);

      let allProjects: Project[] = [];
      for (const team of myTeams) {
        const teamProjects = await getTeamProjects(team.id);
        allProjects = [...allProjects, ...teamProjects];
      }
      setProjects(allProjects);

      setCreateTeamId((prev) => (prev === "" && myTeams.length > 0 ? myTeams[0].id : prev));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load projects";
      setError(msg);
      console.error("Error loading projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(async () => {
      if (!ignore) {
        await loadProjects();
      }
    });
    return () => {
      ignore = true;
    };
  }, [loadProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTeamId || !projectName.trim()) {
      setModalError("Please select a team and provide a project name.");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      await createProject(Number(createTeamId), {
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
      });
      setShowCreateModal(false);
      setProjectName("");
      setProjectDescription("");
      loadProjects();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to create project. Ensure you have OWNER or ADMIN role in this team.";
      setModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesTeam = selectedTeamId === "ALL" || p.teamId === selectedTeamId;
    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    return matchesTeam && matchesStatus && matchesSearch;
  });

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-5">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <span className="text-xs font-semibold text-emerald-600 tracking-wide uppercase">
              Workspaces & Repositories
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 mt-0.5">
              Projects
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter Pills */}
            <div className="flex items-center bg-stone-100 rounded-full p-0.5 border border-stone-200/60">
              {(["ALL", "ACTIVE", "ARCHIVED"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${filterStatus === st
                      ? "bg-white text-stone-900 shadow-2xs font-semibold"
                      : "text-stone-500 hover:text-stone-900 font-medium"
                    }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-200 rounded-full pl-8 pr-3 py-1.5 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-emerald-500 w-36 sm:w-48"
              />
            </div>

            {/* "+ New Project" Button */}
            {(isAdmin || isSuperAdmin) && (
              <button
                onClick={() => {
                  setModalError(null);
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            )}
          </div>
        </div>

        {/* Team Filter Banner */}
        {selectedTeam && (
          <div className="flex items-center justify-between p-2.5 px-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <Users2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Filtering projects for team: <strong className="font-semibold">{selectedTeam.name}</strong> (Team ID #{selectedTeam.id})
              </span>
            </div>
            <button
              onClick={() => setSelectedTeamId("ALL")}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
            >
              Show all projects
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadProjects()}
              className="text-rose-800 font-semibold underline hover:text-rose-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs text-stone-400">Loading projects from database...</span>
          </div>
        ) : filteredProjects.length > 0 ? (
          /* Projects Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((project) => {
              const team = teams.find((t) => t.id === project.teamId);

              return (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="border border-stone-200 rounded-2xl p-5 bg-white hover:border-stone-300 hover:shadow-xs transition-all flex flex-col justify-between shadow-2xs cursor-pointer group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                          {`PRJ-${project.id}`}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${project.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                              : "bg-stone-100 text-stone-600 border-stone-200"
                            }`}
                        >
                          {project.status}
                        </span>
                      </div>

                      <div
                        className="w-7 h-7 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-500 group-hover:text-stone-900 group-hover:bg-stone-100 transition-colors"
                        title="Open Project"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
                      {project.name}
                    </h3>

                    <p className="text-xs text-stone-500 mt-1 leading-relaxed line-clamp-2">
                      {project.description || "No description provided."}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                    <span className="font-medium text-stone-600">
                      {team ? team.name : `Team #${project.teamId}`}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
                      Open Workspace →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 border border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center text-stone-400 text-xs text-center p-6">
            <span className="font-semibold text-stone-700 text-sm mb-1">No Projects Found</span>
            <p className="max-w-sm mb-4">
              {search
                ? `No projects matched "${search}".`
                : "You don't have any projects in your teams yet. Click '+ New Project' to create one."}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4 py-1.5 text-xs font-semibold shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Project</span>
            </button>
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/30 backdrop-blur-[1px]">
            <div
              className="fixed inset-0"
              onClick={() => !isSubmitting && setShowCreateModal(false)}
            />
            <div className="relative w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-xl p-5 sm:p-6 z-10 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
                <h3 className="text-base font-bold text-stone-900">Create New Project</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {modalError && (
                <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleCreateProject} className="space-y-3.5">
                {/* Team Selector */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Select Team
                  </label>
                  <select
                    value={createTeamId}
                    onChange={(e) => setCreateTeamId(Number(e.target.value))}
                    required
                    disabled={isSubmitting}
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-emerald-500"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Team #{t.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Project Name */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NextGen Microservices"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Project mission, scope, and objectives..."
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isSubmitting}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !projectName.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-2xs disabled:opacity-50"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Create Project</span>
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

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs text-stone-400">Loading projects...</span>
          </div>
        </AppShell>
      }
    >
      <ProjectsContent />
    </Suspense>
  );
}
