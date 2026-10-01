"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { Bell, MessageSquare, X } from "lucide-react";
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  clearAllNotificationsApi,
} from "../services/notificationService";

export interface NotificationItem {
  id: string;
  type: "TASK_ASSIGNED" | "COMMENT_ADDED" | "SYSTEM";
  message: string;
  taskId?: number | string;
  projectId?: number | string;
  timestamp: number;
  read: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  refreshNotifications: () => Promise<void>;
  joinProject: (projectId: number | string) => void;
  leaveProject: (projectId: number | string) => void;
  joinTask: (taskId: number | string) => void;
  leaveTask: (taskId: number | string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token, user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userStorageKey = user?.id
    ? `syncsprint_notifications_user_${user.id}`
    : "syncsprint_notifications";

  // Helper to persist to user-scoped storage
  const persistNotifications = useCallback(
    (items: NotificationItem[]) => {
      setNotifications(items);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(userStorageKey, JSON.stringify(items.slice(0, 40)));
        } catch {
          // ignore
        }
      }
    },
    [userStorageKey]
  );

  // Fetch notifications from server and merge with localStorage cache
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated || !token) return;

    try {
      const serverNotifs = await getNotificationsApi();
      if (serverNotifs && serverNotifs.length > 0) {
        setNotifications((prev) => {
          // Merge server notifications with current local notifications
          const map = new Map<string, NotificationItem>();
          // Server items are priority source of truth
          for (const item of serverNotifs) {
            map.set(item.id, item);
          }
          // Preserve any local unread items not yet synced
          for (const item of prev) {
            if (!map.has(item.id)) {
              map.set(item.id, item);
            }
          }
          const merged = Array.from(map.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 40);

          try {
            localStorage.setItem(userStorageKey, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    } catch (err) {
      console.warn("[SocketContext] refreshNotifications error:", err);
    }
  }, [isAuthenticated, token, userStorageKey]);

  // Load notifications when user changes
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      return;
    }

    // 1. First populate immediately from user-scoped localStorage
    try {
      const cached = localStorage.getItem(userStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setNotifications(parsed);
        }
      }
    } catch {}

    // 2. Refresh from server (Redis / DB)
    refreshNotifications();
  }, [isAuthenticated, user?.id, userStorageKey, refreshNotifications]);

  // Connect / Disconnect socket based on authentication
  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const socketUrl = apiUrl.replace(/\/api\/?$/, "");

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("[Socket Frontend] Connected to real-time server with ID:", newSocket.id);
      setConnected(true);
      if (user?.id) {
        newSocket.emit("join:user", user.id);
      }
    });

    newSocket.on("connect_error", (err) => {
      console.warn("[Socket Frontend] Connection error:", err.message);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("[Socket Frontend] Disconnected:", reason);
      setConnected(false);
    });

    // Initial batch of notifications from server on connect
    newSocket.on("notifications:initial", (items: NotificationItem[]) => {
      if (Array.isArray(items) && items.length > 0) {
        setNotifications((prev) => {
          const map = new Map<string, NotificationItem>();
          for (const item of items) {
            map.set(item.id, item);
          }
          for (const item of prev) {
            if (!map.has(item.id)) {
              map.set(item.id, item);
            }
          }
          const merged = Array.from(map.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 40);
          try {
            localStorage.setItem(userStorageKey, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    });

    // Real-time direct notification
    newSocket.on(
      "notification:new",
      (data: {
        id?: string;
        type?: string;
        message: string;
        taskId?: number | string;
        projectId?: number | string;
        task?: { id?: number; title?: string; projectId?: number };
      }) => {
        console.log("[Socket Frontend] Received notification:new:", data);
        const newNotif: NotificationItem = {
          id: data.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: (data.type as "TASK_ASSIGNED" | "COMMENT_ADDED") || "TASK_ASSIGNED",
          message: data.message || "You have a new update",
          taskId: data.taskId || data.task?.id,
          projectId: data.projectId || data.task?.projectId,
          timestamp: Date.now(),
          read: false,
        };

        setNotifications((prev) => {
          const updated = [newNotif, ...prev.filter((n) => n.id !== newNotif.id).slice(0, 39)];
          try {
            localStorage.setItem(userStorageKey, JSON.stringify(updated));
          } catch {}
          return updated;
        });

        // Show temporary floating toast
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
        setActiveToast(newNotif);
        toastTimeoutRef.current = setTimeout(() => {
          setActiveToast(null);
        }, 6000);
      }
    );

    // Explicitly join user room when user.id is ready
    if (user?.id) {
      newSocket.emit("join:user", user.id);
    }

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [isAuthenticated, token, user?.id, userStorageKey]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      try {
        localStorage.setItem(userStorageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    markAllNotificationsReadApi().catch(() => {});
  }, [userStorageKey]);

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        try {
          localStorage.setItem(userStorageKey, JSON.stringify(updated));
        } catch {}
        return updated;
      });
      markNotificationReadApi(id).catch(() => {});
    },
    [userStorageKey]
  );

  const clearNotifications = useCallback(() => {
    persistNotifications([]);
    clearAllNotificationsApi().catch(() => {});
  }, [persistNotifications]);

  const joinProject = useCallback(
    (projectId: number | string) => {
      socket?.emit("join:project", projectId);
    },
    [socket]
  );

  const leaveProject = useCallback(
    (projectId: number | string) => {
      socket?.emit("leave:project", projectId);
    },
    [socket]
  );

  const joinTask = useCallback(
    (taskId: number | string) => {
      socket?.emit("join:task", taskId);
    },
    [socket]
  );

  const leaveTask = useCallback(
    (taskId: number | string) => {
      socket?.emit("leave:task", taskId);
    },
    [socket]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        notifications,
        unreadCount,
        markAllAsRead,
        markAsRead,
        clearNotifications,
        refreshNotifications,
        joinProject,
        leaveProject,
        joinTask,
        leaveTask,
      }}
    >
      {children}

      {/* Real-time Floating Toast Notification */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white rounded-2xl border border-stone-200/90 shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
              {activeToast.type === "COMMENT_ADDED" ? (
                <MessageSquare className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <span>{activeToast.type === "TASK_ASSIGNED" ? "Task Assigned" : "New Comment"}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </p>
              <p className="text-xs text-stone-600 mt-1 leading-snug line-clamp-2">
                {activeToast.message}
              </p>
              <span className="text-[10px] text-stone-400 mt-1.5 block">Just now</span>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-stone-400 hover:text-stone-600 p-1 -mr-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
