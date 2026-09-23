"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Task, TaskPriority, TaskStatus, Pagination } from "@/src/types";
import { useTaskInteraction } from "@/src/context/TaskInteractionContext";
import { getProjectTasks } from "@/src/services/taskService";
import { Search, MessageSquare, Calendar, ChevronLeft, ChevronRight, Loader2, ArrowUpDown } from "lucide-react";

interface RecentTasksTableProps {
  projectId?: number;
  tasks?: Task[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
  enablePagination?: boolean;
  initialStatus?: string;
  initialPriority?: string;
  assignedToUserId?: number;
}

export default function RecentTasksTable({
  projectId,
  tasks: propTasks,
  loading: propLoading,
  title = "Sprint Tasks & Issues",
  subtitle = "Backlog and active issues",
  enablePagination = true,
  initialStatus,
  initialPriority,
  assignedToUserId,
}: RecentTasksTableProps) {
  const { openTaskDetail, tasksRevision } = useTaskInteraction();

  const [internalTasks, setInternalTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>(initialStatus || "ALL");
  const [filterPriority, setFilterPriority] = useState<string>(initialPriority || "ALL");

  useEffect(() => {
    if (initialStatus !== undefined) {
      setFilterStatus(initialStatus);
    }
  }, [initialStatus]);

  useEffect(() => {
    if (initialPriority !== undefined) {
      setFilterPriority(initialPriority);
    }
  }, [initialPriority]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "due_date" | "priority" | "status" | "title">("created_at");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // If projectId is given, fetch tasks from backend
  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    try {
      setError(null);
      const result = await getProjectTasks(projectId, {
        status: filterStatus === "ALL" ? undefined : filterStatus,
        priority: filterPriority === "ALL" ? undefined : filterPriority,
        search: searchQuery.trim() || undefined,
        assignedTo: assignedToUserId,
        sortBy,
        order: sortOrder,
        page: pagination.page,
        limit: pagination.limit,
      });
      setInternalTasks(result.tasks);
      setPagination(result.pagination);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load tasks";
      setError(msg);
      console.error("Error loading tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, filterStatus, filterPriority, searchQuery, assignedToUserId, sortBy, sortOrder, pagination.page, pagination.limit]);

  useEffect(() => {
    let ignore = false;
    if (projectId) {
      Promise.resolve().then(async () => {
        if (!ignore) {
          await fetchTasks();
        }
      });
    }
    return () => {
      ignore = true;
    };
  }, [projectId, fetchTasks, tasksRevision]);

  // Determine tasks to display: propTasks (client-filtered if provided) or internalTasks
  const displayTasks = projectId
    ? internalTasks
    : (propTasks || []).filter((task) => {
        const matchesStatus = filterStatus === "ALL" || task.status === filterStatus;
        const matchesPriority = filterPriority === "ALL" || task.priority === filterPriority;
        const matchesSearch =
          !searchQuery.trim() ||
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (task.assignee && task.assignee.name.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesAssigned =
          !assignedToUserId ||
          task.assignedTo === assignedToUserId ||
          task.assignee?.id === assignedToUserId;

        return matchesStatus && matchesPriority && matchesSearch && matchesAssigned;
      });

  const isLoading = propLoading !== undefined ? propLoading : loading;

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

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case "TODO":
        return "bg-stone-100 text-stone-700";
      case "IN_PROGRESS":
        return "bg-amber-50 text-amber-800";
      case "IN_REVIEW":
        return "bg-indigo-50 text-indigo-800";
      case "DONE":
        return "bg-emerald-50 text-emerald-800";
      default:
        return "bg-stone-100 text-stone-700";
    }
  };

  const toggleSort = (field: "created_at" | "due_date" | "priority" | "status" | "title") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(field);
      setSortOrder("DESC");
    }
  };

  return (
    <div className="border border-stone-200 rounded-2xl p-4 sm:p-5 bg-white">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-stone-900 tracking-tight">
              {title}
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-stone-100 text-stone-600">
              {projectId ? pagination.totalItems : displayTasks.length}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Pills */}
          <div className="flex items-center bg-stone-100 rounded-full p-0.5 border border-stone-200/60">
            {["ALL", "TODO", "IN_PROGRESS", "DONE"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                  filterStatus === st
                    ? "bg-white text-stone-900 shadow-2xs font-semibold"
                    : "text-stone-500 hover:text-stone-900 font-medium"
                }`}
              >
                {st === "IN_PROGRESS" ? "IN PROGRESS" : st}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-xs bg-stone-50 border border-stone-200 rounded-full px-2.5 py-1 text-stone-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs bg-stone-50 border border-stone-200 rounded-full pl-8 pr-3 py-1.5 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-44"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Task Table */}
      <div className="overflow-x-auto -mx-4 sm:-mx-5">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-stone-100 text-stone-400 font-semibold text-[11px]">
              <th
                onClick={() => toggleSort("title")}
                className="py-2 px-4 cursor-pointer hover:text-stone-700 select-none"
              >
                <span className="flex items-center gap-1">
                  Task
                  <ArrowUpDown className="w-3 h-3 text-stone-300" />
                </span>
              </th>
              <th className="py-2 px-3">Project</th>
              <th className="py-2 px-3">Assignee</th>
              <th
                onClick={() => toggleSort("priority")}
                className="py-2 px-3 cursor-pointer hover:text-stone-700 select-none"
              >
                <span className="flex items-center gap-1">
                  Priority
                  <ArrowUpDown className="w-3 h-3 text-stone-300" />
                </span>
              </th>
              <th
                onClick={() => toggleSort("status")}
                className="py-2 px-3 cursor-pointer hover:text-stone-700 select-none"
              >
                <span className="flex items-center gap-1">
                  Status
                  <ArrowUpDown className="w-3 h-3 text-stone-300" />
                </span>
              </th>
              <th
                onClick={() => toggleSort("due_date")}
                className="py-2 px-4 cursor-pointer hover:text-stone-700 select-none"
              >
                <span className="flex items-center gap-1">
                  Due Date
                  <ArrowUpDown className="w-3 h-3 text-stone-300" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-stone-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Loading tasks...</span>
                  </div>
                </td>
              </tr>
            ) : displayTasks.length > 0 ? (
              displayTasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => openTaskDetail(task.id)}
                  className="hover:bg-stone-50 transition-colors cursor-pointer group"
                >
                  {/* Task (Code + Title) */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                        {`SS-${task.id}`}
                      </span>
                      <span className="font-medium text-stone-900 group-hover:text-emerald-700 transition-colors line-clamp-1 max-w-sm">
                        {task.title}
                      </span>
                      {task.storyPoints !== null && task.storyPoints !== undefined && (
                        <span className="text-[10px] font-semibold text-stone-400 bg-stone-50 px-1 rounded">
                          {task.storyPoints}p
                        </span>
                      )}
                      {task.comments && task.comments.length > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-stone-400 font-medium shrink-0">
                          <MessageSquare className="w-3 h-3" />
                          {task.comments.length}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Project */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="text-xs font-medium text-stone-600">
                      {task.project?.name || "Project"}
                    </span>
                  </td>

                  {/* Assignee */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-[10px] ring-1 ring-stone-300 shrink-0">
                          {task.assignee.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-stone-700 text-xs font-medium truncate max-w-[120px]">
                          {task.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-stone-400 italic text-xs">Unassigned</span>
                    )}
                  </td>

                  {/* Priority Badge */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPriorityBadge(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </td>

                  {/* Status Pill */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadge(
                        task.status
                      )}`}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                  </td>

                  {/* Due Date */}
                  <td className="py-2.5 px-4 text-stone-500 whitespace-nowrap text-xs font-mono">
                    {task.dueDate ? (
                      <div className="flex items-center gap-1 text-stone-600">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>{task.dueDate}</span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-10 text-center text-stone-400 text-xs">
                  No issues found matching query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {enablePagination && projectId && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs text-stone-500">
          <span>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} total)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="p-1 rounded bg-stone-50 border border-stone-200 text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-semibold text-stone-800 px-2">{pagination.page}</span>
            <button
              disabled={!pagination.hasNextPage}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="p-1 rounded bg-stone-50 border border-stone-200 text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-100 cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
