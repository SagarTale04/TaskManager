"use client";

import React from "react";
import { Sprint, Task } from "@/src/types";
import { Clock, CheckCircle2, Sparkles, Target, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface SprintProgressCardProps {
  sprint: Sprint | null;
  tasks?: Task[];
  completedTasks?: number;
  totalTasks?: number;
}

export default function SprintProgressCard({
  sprint,
  tasks = [],
  completedTasks: propCompleted,
  totalTasks: propTotal,
}: SprintProgressCardProps) {
  const [now] = React.useState(() => Date.now());

  if (!sprint) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-7 shadow-xs flex flex-col items-center justify-center text-center min-h-[340px]">
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
          <Target className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-stone-900">No Active Sprint</h3>
        <p className="text-xs text-stone-500 max-w-sm mt-1 mb-4">
          There are no sprints marked as active across your projects. Start or plan a sprint from a project workspace to track live velocity.
        </p>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-2xs transition-colors"
        >
          <span>View Projects</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  const effectiveTotalTasks = propTotal !== undefined ? propTotal : tasks.length;
  const effectiveCompletedTasks =
    propCompleted !== undefined
      ? propCompleted
      : tasks.filter((t) => t.status === "DONE").length;

  const percentage =
    effectiveTotalTasks > 0
      ? Math.round((effectiveCompletedTasks / effectiveTotalTasks) * 100)
      : 0;

  const strokeDashoffset = 364 - (364 * percentage) / 100;

  // Real calculations
  const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const completedPoints = tasks
    .filter((t) => t.status === "DONE")
    .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(sprint.endDate).getTime() - now) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-7 shadow-xs flex flex-col justify-between relative overflow-hidden h-full">
      {/* Top Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              {sprint.status === "ACTIVE" ? "Active Sprint" : sprint.status}
            </span>
            <span className="text-xs text-stone-400 font-medium">
              {sprint.startDate} — {sprint.endDate}
            </span>
          </div>
          <h3 className="text-xl font-bold text-stone-900 tracking-tight">
            {sprint.name}
          </h3>
        </div>

        <Link
          href={`/projects/${sprint.projectId}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200/70 text-xs font-medium text-stone-700 transition-colors self-start sm:self-auto"
        >
          <span>Open Sprint Board</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Goal Snippet */}
      {sprint.goal && (
        <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/60 mb-5 flex items-start gap-2.5">
          <Target className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 block">
              Sprint Objective
            </span>
            <p className="text-xs text-stone-700 leading-relaxed mt-0.5">
              {sprint.goal}
            </p>
          </div>
        </div>
      )}

      {/* Main Visualization & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Circular Progress Arc */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-stone-50/50 rounded-2xl border border-stone-100">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
              <circle
                cx="70"
                cy="70"
                r="58"
                fill="none"
                stroke="#e7e5e4"
                strokeWidth="11"
              />
              <circle
                cx="70"
                cy="70"
                r="58"
                fill="none"
                stroke="#10b981"
                strokeWidth="11"
                strokeDasharray="364"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center text-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                {percentage}%
              </span>
              <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
                Completed
              </span>
            </div>
          </div>
          <span className="mt-2 text-xs text-stone-500 font-medium">
            {effectiveCompletedTasks} of {effectiveTotalTasks} tasks done
          </span>
        </div>

        {/* Detailed KPI Blocks */}
        <div className="md:col-span-7 grid grid-cols-2 gap-3">
          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-100">
            <div className="flex items-center gap-1.5 text-stone-400 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-medium">Tasks Closed</span>
            </div>
            <div className="text-lg font-bold text-stone-900">
              {effectiveCompletedTasks}{" "}
              <span className="text-xs font-normal text-stone-400">
                / {effectiveTotalTasks}
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
              {percentage}% completion
            </span>
          </div>

          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-100">
            <div className="flex items-center gap-1.5 text-stone-400 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-stone-500" />
              <span className="text-xs font-medium">Story Points</span>
            </div>
            <div className="text-lg font-bold text-stone-900">
              {completedPoints}{" "}
              <span className="text-xs font-normal text-stone-400">
                / {totalPoints} pts
              </span>
            </div>
            <span className="text-[11px] text-stone-500 font-medium mt-0.5 block">
              {totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0}% burnup
            </span>
          </div>

          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-100">
            <div className="flex items-center gap-1.5 text-stone-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              <span className="text-xs font-medium">Timeline</span>
            </div>
            <div className="text-lg font-bold text-stone-900">
              {daysRemaining}{" "}
              <span className="text-xs font-normal text-stone-400">
                days left
              </span>
            </div>
            <span className="text-[11px] text-stone-500 font-medium mt-0.5 block truncate">
              Ends {sprint.endDate}
            </span>
          </div>

          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-100">
            <div className="flex items-center gap-1.5 text-stone-400 mb-1">
              <span className={`w-2 h-2 rounded-full ${sprint.status === "ACTIVE" ? "bg-emerald-500" : "bg-stone-400"}`} />
              <span className="text-xs font-medium">Status</span>
            </div>
            <div className="text-lg font-bold text-stone-800">
              {sprint.status}
            </div>
            <span className="text-[11px] text-stone-500 font-medium mt-0.5 block">
              {effectiveTotalTasks - effectiveCompletedTasks} remaining
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
