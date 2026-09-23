"use client";

import React from "react";
import { Task } from "@/src/types";
import { Users2, CheckCircle2, Clock, CircleDot, AlertTriangle } from "lucide-react";

interface DeveloperWorkloadCardProps {
  tasks: Task[];
  title?: string;
  subtitle?: string;
  selectedDeveloperId?: number | "unassigned" | null;
  onSelectDeveloper?: (developerId: number | "unassigned" | null) => void;
}

interface DeveloperStats {
  id: number | "unassigned";
  name: string;
  email?: string;
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

export default function DeveloperWorkloadCard({
  tasks,
  title = "Developer Workload Allocation",
  subtitle = "Team issue distribution across active developers",
  selectedDeveloperId,
  onSelectDeveloper,
}: DeveloperWorkloadCardProps) {
  // Aggregate stats by assignee
  const developerMap = new Map<number | "unassigned", DeveloperStats>();

  for (const task of tasks) {
    const key = task.assignee?.id ?? task.assignedTo ?? "unassigned";
    const name = task.assignee?.name || (key === "unassigned" ? "Unassigned Issues" : `User #${key}`);
    const email = task.assignee?.email;

    if (!developerMap.has(key)) {
      developerMap.set(key, {
        id: key,
        name,
        email,
        total: 0,
        todo: 0,
        inProgress: 0,
        done: 0,
      });
    }

    const stat = developerMap.get(key)!;
    stat.total += 1;
    if (task.status === "DONE") {
      stat.done += 1;
    } else if (task.status === "IN_PROGRESS" || task.status === "IN_REVIEW") {
      stat.inProgress += 1;
    } else {
      stat.todo += 1;
    }
  }

  const developerList = Array.from(developerMap.values()).sort((a, b) => {
    // Unassigned at the end
    if (a.id === "unassigned") return 1;
    if (b.id === "unassigned") return -1;
    return b.total - a.total;
  });

  const totalTasks = tasks.length;

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-7 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-stone-900 tracking-tight">{title}</h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
            {developerList.filter((d) => d.id !== "unassigned").length} Developers
          </span>
        </div>
        <p className="text-xs text-stone-500 mb-4">{subtitle}</p>

        {developerList.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400">
            No tasks found to calculate workload.
          </div>
        ) : (
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {developerList.map((dev) => {
              const isUnassigned = dev.id === "unassigned";
              const isSelected = selectedDeveloperId === dev.id;
              const percentOfTotal = totalTasks > 0 ? Math.round((dev.total / totalTasks) * 100) : 0;

              return (
                <div
                  key={String(dev.id)}
                  onClick={() => onSelectDeveloper && onSelectDeveloper(isSelected ? null : dev.id)}
                  className={`p-3 rounded-2xl border transition-all ${
                    onSelectDeveloper ? "cursor-pointer hover:shadow-xs" : ""
                  } ${
                    isSelected
                      ? "ring-2 ring-emerald-600 bg-emerald-50/80 border-emerald-300"
                      : isUnassigned
                      ? "bg-amber-50/50 border-amber-200/60 hover:border-amber-300"
                      : "bg-stone-50/70 border-stone-200/60 hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                          isSelected
                            ? "bg-emerald-600 text-white"
                            : isUnassigned
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isUnassigned ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : (
                          dev.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-stone-900 truncate">
                            {dev.name}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-600 text-white">
                              Active Filter
                            </span>
                          )}
                        </div>
                        {dev.email && (
                          <span className="text-[10px] text-stone-400 block truncate">
                            {dev.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-stone-900">
                        {dev.total} {dev.total === 1 ? "task" : "tasks"}
                      </span>
                      <span className="text-[10px] text-stone-400 block font-medium">
                        {percentOfTotal}% load
                      </span>
                    </div>
                  </div>

                  {/* Task Status Breakdown Tags */}
                  <div className="flex items-center gap-2 text-[10px] font-medium pt-1 border-t border-stone-200/40">
                    <span className="inline-flex items-center gap-1 text-stone-600">
                      <CircleDot className="w-2.5 h-2.5 text-stone-400" />
                      {dev.todo} Todo
                    </span>
                    <span className="inline-flex items-center gap-1 text-amber-700">
                      <Clock className="w-2.5 h-2.5 text-amber-500" />
                      {dev.inProgress} In Progress
                    </span>
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                      {dev.done} Done
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
        <span>Real-time workload from PostgreSQL</span>
        <span className="font-semibold text-stone-600">{totalTasks} Total Issues</span>
      </div>
    </div>
  );
}
