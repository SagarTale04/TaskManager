"use client";

import React from "react";
import Header from "./Header";
import TaskDetailModal from "../task/TaskDetailModal";
import ProtectedRoute from "../auth/ProtectedRoute";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f7f6f2] p-3 sm:p-4 md:p-5 flex flex-col">
        <div className="w-full max-w-[1520px] mx-auto flex-1 flex flex-col">
          {/* Floating Top Pill Navigation */}
          <Header />

          {/* Main Workspace - Expanded and Centered */}
          <main className="w-full flex-1 min-w-0 bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 md:p-6 shadow-none">
            {children}
          </main>
        </div>

        {/* Global Task Detail Drawer / Modal */}
        <TaskDetailModal />
      </div>
    </ProtectedRoute>
  );
}
