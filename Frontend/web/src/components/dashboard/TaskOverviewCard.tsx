"use client";

import React from "react";
import Link from "next/link";
import { CircleDot, Clock, CheckCircle2, ArrowRight } from "lucide-react";

interface TaskOverviewCardProps {
  title?: string;
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
  projectId?: number;
}

export default function TaskOverviewCard({
  title = "Task Overview",
  todoCount,
  inProgressCount,
  doneCount,
  projectId,
}: TaskOverviewCardProps) {
  const total = todoCount + inProgressCount + doneCount || 1;
  const todoPct = Math.round((todoCount / total) * 100);
  const inProgressPct = Math.round((inProgressCount / total) * 100);
  const donePct = Math.round((doneCount / total) * 100);

  const statuses = [
    {
      label: "TODO",
      count: todoCount,
      percent: todoPct,
      color: "bg-stone-400",
      textColor: "text-stone-700",
      bgBadge: "bg-stone-100",
      icon: CircleDot,
    },
    {
      label: "IN PROGRESS",
      count: inProgressCount,
      percent: inProgressPct,
      color: "bg-amber-500",
      textColor: "text-amber-700",
      bgBadge: "bg-amber-50",
      icon: Clock,
    },
    {
      label: "DONE",
      count: doneCount,
      percent: donePct,
      color: "bg-emerald-500",
      textColor: "text-emerald-700",
      bgBadge: "bg-emerald-50",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-stone-900 tracking-tight">
            {title}
          </h3>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600">
            {total} Total
          </span>
        </div>

        {/* Segmented Distribution Bar */}
        <div className="w-full h-2.5 rounded-full bg-stone-100 overflow-hidden flex gap-0.5 mb-6">
          <div
            style={{ width: `${donePct}%` }}
            className="h-full bg-emerald-500 transition-all duration-500"
            title={`DONE: ${doneCount}`}
          />
          <div
            style={{ width: `${inProgressPct}%` }}
            className="h-full bg-amber-400 transition-all duration-500"
            title={`IN PROGRESS: ${inProgressCount}`}
          />
          <div
            style={{ width: `${todoPct}%` }}
            className="h-full bg-stone-300 transition-all duration-500"
            title={`TODO: ${todoCount}`}
          />
        </div>

        {/* Breakdown Items */}
        <div className="space-y-3">
          {statuses.map((s) => {
            const Icon = s.icon;
            const statusKey = s.label.replace(" ", "_");
            const href = `/tasks?status=${statusKey}`;

            return (
              <Link
                key={s.label}
                href={href}
                className="flex items-center justify-between p-3 rounded-2xl bg-stone-50/70 border border-stone-100 hover:border-stone-300 hover:bg-stone-50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full ${s.bgBadge} flex items-center justify-center`}>
                    <Icon className={`w-3.5 h-3.5 ${s.textColor}`} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-stone-800 group-hover:text-emerald-700 transition-colors block">
                      {s.label}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {s.percent}% of sprint
                    </span>
                  </div>
                </div>

                <span className="text-sm font-bold text-stone-900 px-2.5 py-0.5 rounded-full bg-white border border-stone-200 shadow-2xs group-hover:border-emerald-200">
                  {s.count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Navigation link to Kanban */}
      <div className="mt-6 pt-4 border-t border-stone-100">
        <Link
          href={projectId ? `/projects/${projectId}` : "/projects"}
          className="flex items-center justify-between text-xs font-semibold text-stone-700 hover:text-emerald-700 transition-colors group"
        >
          <span>View Kanban Board</span>
          <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
