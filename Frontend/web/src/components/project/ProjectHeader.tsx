"use client";

import React from "react";
import { Project, Sprint } from "@/src/types";
import { Plus, Layers } from "lucide-react";

interface ProjectHeaderProps {
  project: Project;
  activeSprint?: Sprint | null;
  activeTab: "overview" | "board" | "sprints" | "tasks";
  onTabChange: (tab: "overview" | "board" | "sprints" | "tasks") => void;
  onNewTaskClick?: () => void;
  canManage?: boolean;
}

export default function ProjectHeader({
  project,
  activeSprint,
  activeTab,
  onTabChange,
  onNewTaskClick,
  canManage = true,
}: ProjectHeaderProps) {
  const tabs = [
    { id: "board", label: "Board" },
    { id: "overview", label: "Overview" },
    { id: "sprints", label: "Sprints" },
    { id: "tasks", label: "Tasks" },
  ] as const;

  const projectTag = `PRJ-${project.id}`;

  return (
    <div className="border border-stone-200 rounded-2xl p-4 sm:p-5 bg-white mb-4 shadow-none">
      {/* Top row: Project Title & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono font-semibold px-2 py-0.2 rounded bg-stone-100 text-stone-700">
              {projectTag}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${project.status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                  : "bg-stone-100 text-stone-600 border-stone-200"
                }`}
            >
              {project.status}
            </span>
            {activeSprint && (
              <div className="flex items-center gap-1 text-xs text-stone-500 bg-stone-50 px-2.5 py-0.5 rounded-full border border-stone-200">
                <Layers className="w-3 h-3 text-stone-400" />
                <span>{activeSprint.name}</span>
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">
            {project.name}
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 max-w-2xl">
            {project.description || "No project description provided."}
          </p>
        </div>

        {/* Right actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {canManage && onNewTaskClick && (
            <button
              onClick={onNewTaskClick}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation row */}
      <div className="pt-3 flex items-center justify-between">
        <div className="flex items-center bg-stone-100/90 rounded-full p-0.5 border border-stone-200/60">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${activeTab === tab.id
                  ? "bg-white text-stone-900 shadow-2xs font-semibold"
                  : "text-stone-500 hover:text-stone-900"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeSprint && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-400 font-medium">
            <span>
              Sprint Window: {activeSprint.startDate} → {activeSprint.endDate}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
