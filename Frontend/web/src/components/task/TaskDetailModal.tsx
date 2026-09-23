"use client";

import React, { useState, useEffect } from "react";
import { useTaskInteraction } from "@/src/context/TaskInteractionContext";
import { useAuth } from "@/src/context/AuthContext";
import { User, TaskStatus, TaskPriority } from "@/src/types";
import { getAllUsers } from "@/src/services/userService";
import { updateTask } from "@/src/services/taskService";
import { addTeamMember } from "@/src/services/teamService";
import { 
  X, 
  Send,
  MessageSquare,
  Trash2,
  AlertCircle,
  Loader2,
  UserCheck
} from "lucide-react";

export default function TaskDetailModal() {
  const { user } = useAuth();
  const {
    selectedTask,
    loadingTaskDetail,
    closeTaskDetail,
    updateTaskStatus,
    addComment,
    deleteComment,
    openTaskDetail,
    notifyTasksChanged,
  } = useTaskInteraction();

  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingAssignee, setUpdatingAssignee] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTask) {
      getAllUsers()
        .then((users) => setAllUsers(users))
        .catch(() => {});
    }
  }, [selectedTask]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTaskDetail();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeTaskDetail]);

  if (!selectedTask && !loadingTaskDetail) return null;

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;
    setSubmittingComment(true);
    setErrorMessage(null);
    try {
      await addComment(selectedTask.id, commentText);
      setCommentText("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to post comment";
      setErrorMessage(msg);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!selectedTask) return;
    setUpdatingStatus(true);
    setErrorMessage(null);
    try {
      await updateTaskStatus(selectedTask.id, newStatus);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "You do not have permission to update this task";
      setErrorMessage(msg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteComment(commentId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete comment";
      setErrorMessage(msg);
    }
  };

  const handleAssigneeChange = async (newUserIdStr: string) => {
    if (!selectedTask) return;
    const newUserId = newUserIdStr === "" ? null : Number(newUserIdStr);
    setUpdatingAssignee(true);
    setErrorMessage(null);

    try {
      if (newUserId !== null && selectedTask.project?.teamId) {
        try {
          await addTeamMember(selectedTask.project.teamId, {
            userId: newUserId,
            role: "MEMBER",
          });
        } catch {
          // ignore if already in team
        }
      }

      await updateTask(selectedTask.id, { assignedTo: newUserId });
      notifyTasksChanged();
      await openTaskDetail(selectedTask.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update assignee";
      setErrorMessage(msg);
    } finally {
      setUpdatingAssignee(false);
    }
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/25 transition-all">
      <div 
        className="fixed inset-0" 
        onClick={closeTaskDetail} 
        aria-hidden="true"
      />

      <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden flex flex-col max-h-[88vh] z-10 animate-in fade-in zoom-in-95 duration-100">
        {loadingTaskDetail ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs text-stone-500 font-medium">Loading issue details...</span>
          </div>
        ) : selectedTask ? (
          <>
            {/* Header Bar */}
            <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-stone-800 bg-stone-200/80 px-2 py-0.5 rounded">
                  {`SS-${selectedTask.id}`}
                </span>
                <span className="text-xs text-stone-400">•</span>
                <span className="text-xs font-medium text-stone-600">
                  {selectedTask.project?.name || "Project Issue"}
                </span>
              </div>

              <button
                onClick={closeTaskDetail}
                className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error banner if any action failed */}
            {errorMessage && (
              <div className="mx-5 mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Content Body: Split between Main Details (Left) and Property Inspector (Right) */}
            <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Main Details (8 cols) */}
              <div className="md:col-span-8 space-y-4">
                {/* Title */}
                <h2 className="text-lg font-bold text-stone-900 leading-snug">
                  {selectedTask.title}
                </h2>

                {/* Description */}
                <div>
                  <h3 className="text-xs font-semibold text-stone-500 mb-1.5">
                    Description
                  </h3>
                  <div className="bg-stone-50/70 rounded-xl p-3.5 border border-stone-200/80 text-xs text-stone-700 leading-relaxed min-h-[60px]">
                    {selectedTask.description || "No description provided."}
                  </div>
                </div>

                {/* Comments Thread */}
                <div className="pt-2">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                    <h3 className="text-xs font-semibold text-stone-800">
                      Activity & Discussion ({selectedTask.comments?.length || 0})
                    </h3>
                  </div>

                  <div className="space-y-2 mb-3 max-h-60 overflow-y-auto pr-1">
                    {selectedTask.comments && selectedTask.comments.length > 0 ? (
                      selectedTask.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-2.5 p-2.5 rounded-lg bg-stone-50 border border-stone-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=face"
                            alt={comment.author?.name || "User"}
                            className="w-5 h-5 rounded-full object-cover ring-1 ring-stone-200 shrink-0 mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-xs font-semibold text-stone-900">
                                {comment.author?.name || "Team Member"}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-stone-400">
                                  {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ""}
                                </span>
                                {user && comment.userId === user.id && (
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-stone-400 hover:text-rose-600 transition-colors"
                                    title="Delete comment"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-stone-400 italic py-1">
                        No comments yet. Start the discussion below.
                      </p>
                    )}
                  </div>

                  {/* Comment Input */}
                  <form onSubmit={handleSendComment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Leave a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      disabled={submittingComment}
                      className="flex-1 text-xs bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim() || submittingComment}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {submittingComment ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      <span>Reply</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Property Inspector (4 cols) */}
              <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-stone-100 pt-3 md:pt-0 md:pl-5 space-y-3.5 text-xs">
                <div>
                  <span className="text-stone-400 block font-medium mb-1">Status</span>
                  {(() => {
                    const isDeveloper = user?.role === "DEVELOPER";
                    const isAssignedToMe =
                      selectedTask.assignee?.id === user?.id || selectedTask.assignedTo === user?.id;
                    const canEdit = !isDeveloper || isAssignedToMe;

                    return (
                      <div>
                        <div className="relative">
                          <select
                            value={selectedTask.status}
                            disabled={updatingStatus || !canEdit}
                            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                            className={`w-full text-xs font-semibold rounded-lg px-2.5 py-1.5 border focus:outline-none transition-all ${
                              canEdit
                                ? "bg-stone-50 border-stone-200 text-stone-800 focus:border-emerald-500 cursor-pointer"
                                : "bg-stone-100 border-stone-200 text-stone-500 cursor-not-allowed opacity-80"
                            }`}
                          >
                            <option value="TODO">TODO</option>
                            <option value="IN_PROGRESS">IN PROGRESS</option>
                            <option value="IN_REVIEW">IN REVIEW</option>
                            <option value="DONE">DONE</option>
                          </select>
                          {updatingStatus && (
                            <Loader2 className="w-3 h-3 animate-spin text-stone-400 absolute right-2 top-1/2 -translate-y-1/2" />
                          )}
                        </div>
                        {!canEdit && (
                          <span className="text-[10px] text-stone-400 mt-1 block">
                            Read-only: Assigned to another developer
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <span className="text-stone-400 block font-medium mb-1">Priority</span>
                  <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getPriorityBadge(selectedTask.priority)}`}>
                    {selectedTask.priority}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-stone-400 font-medium">Assignee</span>
                    {updatingAssignee && (
                      <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                    )}
                  </div>
                  {user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" ? (
                    <div className="space-y-1.5">
                      <select
                        value={selectedTask.assignedTo ?? selectedTask.assignee?.id ?? ""}
                        disabled={updatingAssignee}
                        onChange={(e) => handleAssigneeChange(e.target.value)}
                        className="w-full text-xs font-medium bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-60"
                      >
                        <option value="">Unassigned</option>
                        {allUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email})
                          </option>
                        ))}
                      </select>
                      {selectedTask.assignee && (
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 px-1">
                          <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Assigned to <strong className="text-stone-700">{selectedTask.assignee.name}</strong></span>
                        </div>
                      )}
                    </div>
                  ) : selectedTask.assignee ? (
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=face"
                        alt={selectedTask.assignee.name}
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-stone-200"
                      />
                      <div>
                        <span className="font-semibold text-stone-800 block text-xs">
                          {selectedTask.assignee.name}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {selectedTask.assignee.email}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-stone-400 italic">Unassigned</span>
                  )}
                </div>

                <div>
                  <span className="text-stone-400 block font-medium mb-1">Sprint</span>
                  <span className="font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                    {selectedTask.sprint?.name || "No Sprint Assigned"}
                  </span>
                </div>

                <div>
                  <span className="text-stone-400 block font-medium mb-1">Story Points</span>
                  <span className="font-semibold text-stone-800 text-xs">
                    {selectedTask.storyPoints !== null && selectedTask.storyPoints !== undefined
                      ? `${selectedTask.storyPoints} points`
                      : "Not estimated"}
                  </span>
                </div>

                <div>
                  <span className="text-stone-400 block font-medium mb-1">Due Date</span>
                  <span className="font-mono text-stone-700 text-xs">
                    {selectedTask.dueDate || "No due date"}
                  </span>
                </div>

                <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-400">
                  Created {selectedTask.created_at ? new Date(selectedTask.created_at).toLocaleDateString() : ""}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
