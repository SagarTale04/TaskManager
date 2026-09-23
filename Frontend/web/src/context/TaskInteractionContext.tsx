"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Task, TaskStatus } from "@/src/types";
import { getTaskById, updateTask, createComment, deleteComment as apiDeleteComment } from "@/src/services/taskService";

interface TaskInteractionContextType {
  selectedTask: Task | null;
  loadingTaskDetail: boolean;
  taskError: string | null;
  tasksRevision: number;
  openTaskDetail: (taskId: number) => Promise<void>;
  closeTaskDetail: () => void;
  updateTaskStatus: (taskId: number, status: TaskStatus) => Promise<Task | null>;
  addComment: (taskId: number, content: string) => Promise<void>;
  deleteComment: (commentId: number) => Promise<void>;
  notifyTasksChanged: () => void;
}

const TaskInteractionContext = createContext<TaskInteractionContextType | undefined>(undefined);

export function TaskInteractionProvider({ children }: { children: React.ReactNode }) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [tasksRevision, setTasksRevision] = useState(0);

  const notifyTasksChanged = useCallback(() => {
    setTasksRevision((prev) => prev + 1);
  }, []);

  const openTaskDetail = useCallback(async (taskId: number) => {
    setLoadingTaskDetail(true);
    setTaskError(null);
    try {
      const task = await getTaskById(taskId);
      setSelectedTask(task);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load task details";
      setTaskError(msg);
      console.error("Failed to load task:", err);
    } finally {
      setLoadingTaskDetail(false);
    }
  }, []);

  const closeTaskDetail = useCallback(() => {
    setSelectedTask(null);
    setTaskError(null);
  }, []);

  const updateTaskStatus = useCallback(
    async (taskId: number, status: TaskStatus): Promise<Task | null> => {
      try {
        const updated = await updateTask(taskId, { status });
        setSelectedTask((prev) => (prev && prev.id === taskId ? { ...prev, status } : prev));
        notifyTasksChanged();
        return updated;
      } catch (err) {
        console.error("Failed to update task status:", err);
        throw err;
      }
    },
    [notifyTasksChanged]
  );

  const addComment = useCallback(
    async (taskId: number, content: string) => {
      if (!content.trim()) return;
      try {
        const newComment = await createComment(taskId, content.trim());
        setSelectedTask((prev) => {
          if (!prev || prev.id !== taskId) return prev;
          return {
            ...prev,
            comments: [...(prev.comments || []), newComment],
          };
        });
      } catch (err) {
        console.error("Failed to add comment:", err);
        throw err;
      }
    },
    []
  );

  const deleteComment = useCallback(
    async (commentId: number) => {
      try {
        await apiDeleteComment(commentId);
        setSelectedTask((prev) => {
          if (!prev || !prev.comments) return prev;
          return {
            ...prev,
            comments: prev.comments.filter((c) => c.id !== commentId),
          };
        });
      } catch (err) {
        console.error("Failed to delete comment:", err);
        throw err;
      }
    },
    []
  );

  return (
    <TaskInteractionContext.Provider
      value={{
        selectedTask,
        loadingTaskDetail,
        taskError,
        tasksRevision,
        openTaskDetail,
        closeTaskDetail,
        updateTaskStatus,
        addComment,
        deleteComment,
        notifyTasksChanged,
      }}
    >
      {children}
    </TaskInteractionContext.Provider>
  );
}

export function useTaskInteraction() {
  const context = useContext(TaskInteractionContext);
  if (!context) {
    throw new Error("useTaskInteraction must be used within a TaskInteractionProvider");
  }
  return context;
}
