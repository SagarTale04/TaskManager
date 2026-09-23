"use client";

import React, { useState } from "react";
import { Task, TaskPriority, TaskStatus } from "@/src/types";
import { useTaskInteraction } from "@/src/context/TaskInteractionContext";
import { createTask } from "@/src/services/taskService";
import { 
  Plus, 
  Calendar, 
  ArrowRight, 
  ArrowLeft,
  CircleDot,
  Clock,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
  Loader2
} from "lucide-react";

interface KanbanBoardProps {
  projectId: number;
  tasks: Task[];
  sprintId?: number | null;
  canManage?: boolean;
  onRefresh?: () => void;
}

export default function KanbanBoard({
  projectId,
  tasks: initialTasks,
  sprintId,
  canManage = true,
  onRefresh,
}: KanbanBoardProps) {
  const { openTaskDetail, updateTaskStatus } = useTaskInteraction();

  const [quickAddColumn, setQuickAddColumn] = useState<TaskStatus | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const columns: { id: TaskStatus; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
    { id: "TODO", label: "TODO", icon: CircleDot, color: "text-stone-400" },
    { id: "IN_PROGRESS", label: "IN PROGRESS", icon: Clock, color: "text-amber-500" },
    { id: "DONE", label: "DONE", icon: CheckCircle2, color: "text-emerald-500" },
  ];

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "URGENT":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "HIGH":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "MEDIUM":
        return "bg-stone-100 text-stone-700 border-stone-200";
      case "LOW":
        return "bg-stone-50 text-stone-500 border-stone-200";
      default:
        return "bg-stone-100 text-stone-700 border-stone-200";
    }
  };

  const handleQuickAdd = async (columnId: TaskStatus) => {
    if (!quickAddTitle.trim()) {
      setQuickAddColumn(null);
      return;
    }
    setIsSubmitting(true);
    setActionError(null);
    try {
      await createTask(projectId, {
        title: quickAddTitle.trim(),
        status: columnId,
        sprintId: sprintId || undefined,
      });
      setQuickAddTitle("");
      setQuickAddColumn(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create task";
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveTask = async (taskId: number, newStatus: TaskStatus) => {
    setActionError(null);
    try {
      await updateTaskStatus(taskId, newStatus);
      if (onRefresh) onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "You do not have permission to update task status";
      setActionError(msg);
    }
  };

  return (
    <div className="space-y-3">
      {actionError && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-stone-400 hover:text-stone-700 text-xs px-2"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => {
          const columnTasks = initialTasks.filter((t) => t.status === column.id);
          const Icon = column.icon;

          return (
            <div
              key={column.id}
              className="border border-stone-200 rounded-2xl p-3.5 bg-stone-50/70 flex flex-col min-h-[520px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-stone-200/80">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${column.color}`} />
                  <h3 className="text-xs font-bold text-stone-900 tracking-tight">
                    {column.label}
                  </h3>
                  <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded-full bg-white border border-stone-200 text-stone-600">
                    {columnTasks.length}
                  </span>
                </div>

                {canManage && (
                  <button
                    onClick={() => {
                      setQuickAddColumn(column.id);
                      setQuickAddTitle("");
                    }}
                    className="w-5 h-5 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                    title={`Add task to ${column.label}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Quick Add Form if triggered */}
              {quickAddColumn === column.id && (
                <div className="mb-2.5 p-2 bg-white rounded-xl border border-stone-300 shadow-2xs animate-in fade-in">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Task title..."
                    value={quickAddTitle}
                    onChange={(e) => setQuickAddTitle(e.target.value)}
                    disabled={isSubmitting}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleQuickAdd(column.id);
                      if (e.key === "Escape") setQuickAddColumn(null);
                    }}
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-1.5 outline-none focus:border-emerald-500 text-stone-800 disabled:opacity-50"
                  />
                  <div className="flex items-center justify-end gap-1.5 mt-2">
                    <button
                      onClick={() => setQuickAddColumn(null)}
                      disabled={isSubmitting}
                      className="text-[11px] text-stone-500 hover:text-stone-700 px-2 py-0.5 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleQuickAdd(column.id)}
                      disabled={isSubmitting || !quickAddTitle.trim()}
                      className="text-[11px] bg-emerald-600 text-white font-medium rounded-full px-3 py-1 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Cards Container */}
              <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => openTaskDetail(task.id)}
                    className="bg-white rounded-xl border border-stone-200 p-3 hover:border-stone-300 transition-all cursor-pointer group flex flex-col justify-between shadow-2xs"
                  >
                    {/* Card Header: Task Code, Priority, & Quick Move Arrows */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-semibold text-stone-600 group-hover:text-emerald-700">
                          {`SS-${task.id}`}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${getPriorityBadge(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {/* Quick Move Action Buttons */}
                      <div
                        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {column.id !== "TODO" && (
                          <button
                            onClick={() => {
                              const prevStatus =
                                column.id === "DONE" ? "IN_PROGRESS" : "TODO";
                              handleMoveTask(task.id, prevStatus);
                            }}
                            className="w-5 h-5 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
                            title="Move Back"
                          >
                            <ArrowLeft className="w-2.5 h-2.5" />
                          </button>
                        )}
                        {column.id !== "DONE" && (
                          <button
                            onClick={() => {
                              const nextStatus =
                                column.id === "TODO" ? "IN_PROGRESS" : "DONE";
                              handleMoveTask(task.id, nextStatus);
                            }}
                            className="w-5 h-5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors cursor-pointer"
                            title="Move Forward"
                          >
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Task Title */}
                    <h4 className="text-xs font-medium text-stone-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug mb-2.5">
                      {task.title}
                    </h4>

                    {/* Card Footer: Assignee, Comments, Story Points */}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px] text-stone-400">
                      <div className="flex items-center gap-1.5">
                        {task.assignee ? (
                          <div className="flex items-center gap-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=face"
                              alt={task.assignee.name}
                              title={task.assignee.name}
                              className="w-4 h-4 rounded-full object-cover ring-1 ring-stone-200"
                            />
                            <span className="text-[10px] text-stone-600 font-medium truncate max-w-[80px]">
                              {task.assignee.name.split(" ")[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] italic text-stone-400">Unassigned</span>
                        )}

                        {task.dueDate && (
                          <span className="text-[10px] text-stone-400 flex items-center gap-0.5 font-mono ml-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {task.dueDate.split("-").slice(1).join("/")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {task.comments && task.comments.length > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-stone-400">
                            <MessageSquare className="w-2.5 h-2.5" />
                            {task.comments.length}
                          </span>
                        )}
                        {task.storyPoints !== null && task.storyPoints !== undefined && (
                          <span className="font-semibold text-stone-700 text-[10px] bg-stone-100 px-1.5 py-0.5 rounded">
                            {task.storyPoints}p
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {columnTasks.length === 0 && (
                  <div className="h-28 border border-dashed border-stone-200 rounded-xl flex flex-col items-center justify-center text-stone-400 text-xs">
                    <span>No issues in {column.label}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
