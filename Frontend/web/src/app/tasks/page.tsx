"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/src/components/layout/AppShell";
import RecentTasksTable from "@/src/components/dashboard/RecentTasksTable";
import { Project } from "@/src/types";
import { getMyTeams } from "@/src/services/teamService";
import { getTeamProjects } from "@/src/services/projectService";
import { FolderKanban, Loader2 } from "lucide-react";

function TasksView() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status") || undefined;

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    try {
      const teams = await getMyTeams();
      let allProjects: Project[] = [];
      for (const team of teams) {
        const projs = await getTeamProjects(team.id);
        allProjects = [...allProjects, ...projs];
      }
      setProjects(allProjects);
      if (allProjects.length > 0) {
        const active = allProjects.find((p) => p.status === "ACTIVE") || allProjects[0];
        setSelectedProjectId(active.id);
      }
    } catch (err) {
      console.error("Failed to load user projects for tasks view:", err);
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div>
          <span className="text-xs font-semibold text-emerald-600 tracking-wide uppercase">
            Sprint & Project Backlog
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 mt-0.5">
            Task Management
          </h1>
        </div>

        {projects.length > 1 && (
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-stone-400" />
            <select
              value={selectedProjectId || ""}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
              className="text-xs bg-stone-50 border border-stone-200 rounded-full px-3 py-1.5 text-stone-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-xs text-stone-400">Loading project backlog...</span>
        </div>
      ) : selectedProjectId ? (
        <RecentTasksTable
          projectId={selectedProjectId}
          enablePagination={true}
          initialStatus={statusParam}
          title="Project Backlog & Issues"
          subtitle={`Server-side filtered and paginated tasks for Project #${selectedProjectId}`}
        />
      ) : (
        <div className="py-16 text-center border border-dashed border-stone-200 rounded-2xl text-xs text-stone-400">
          No projects found. Create a project first to manage tasks.
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      }>
        <TasksView />
      </Suspense>
    </AppShell>
  );
}
