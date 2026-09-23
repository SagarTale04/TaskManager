"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, ChevronDown, FolderKanban, CheckCircle2, Loader2, X } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useTaskInteraction } from "@/src/context/TaskInteractionContext";
import { getMyTeams } from "@/src/services/teamService";
import { getTeamProjects } from "@/src/services/projectService";
import { getProjectTasks } from "@/src/services/taskService";
import { Project, Task } from "@/src/types";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { openTaskDetail } = useTaskInteraction();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ projects: Project[]; tasks: Task[] }>({
    projects: [],
    tasks: [],
  });

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotificationMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Live search across projects and tasks
  useEffect(() => {
    if (!showSearchModal || !searchQuery.trim()) {
      setSearchResults({ projects: [], tasks: [] });
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const teams = await getMyTeams();
        let allProjects: Project[] = [];
        for (const t of teams) {
          const projs = await getTeamProjects(t.id);
          allProjects = [...allProjects, ...projs];
        }

        const q = searchQuery.toLowerCase().trim();
        const matchedProjects = allProjects.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
        );

        let matchedTasks: Task[] = [];
        if (allProjects.length > 0) {
          // Search tasks in the first few active projects
          const activeProj = allProjects[0];
          const taskRes = await getProjectTasks(activeProj.id, { search: q, limit: 10 }).catch(
            () => ({ tasks: [] })
          );
          matchedTasks = taskRes.tasks || [];
        }

        setSearchResults({
          projects: matchedProjects.slice(0, 5),
          tasks: matchedTasks.slice(0, 5),
        });
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, showSearchModal]);

  const navLinks = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "My Tasks", href: "/tasks" },
    { label: "Projects", href: "/projects" },
    { label: "Teams", href: "/teams" },
  ];

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";
  const displayAvatar =
    user?.avatar ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=face";

  const roleLabel =
    user?.role === "SUPER_ADMIN"
      ? "Super Admin"
      : user?.role === "ADMIN"
      ? "Admin"
      : "Developer";

  return (
    <>
      <header className="w-full mb-4">
        <div className="bg-white rounded-full border border-stone-200/90 px-4 py-2 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs tracking-tight transition-transform group-hover:scale-105">
              SS
            </div>
            <span className="font-semibold text-stone-900 tracking-tight text-sm hidden sm:inline-block">
              Sync<span className="text-emerald-600 font-bold">Sprint</span>
            </span>
          </Link>

          {/* Centered Pill Navigation */}
          <nav className="flex items-center bg-stone-100/90 rounded-full p-0.5 border border-stone-200/60 overflow-x-auto no-scrollbar">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/dashboard" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-white text-stone-900 font-semibold shadow-2xs"
                      : "text-stone-500 hover:text-stone-900 hover:bg-stone-200/40 font-medium"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search circular button */}
            <button
              onClick={() => {
                setSearchQuery("");
                setShowSearchModal(true);
              }}
              className="w-7 h-7 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Quick Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Notification circular button with real popover */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotificationMenu(!showNotificationMenu)}
                className="relative w-7 h-7 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-3.5 h-3.5" />
              </button>

              {showNotificationMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-stone-200 shadow-md p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100 mb-2.5">
                    <span className="text-xs font-bold text-stone-900">Notifications</span>
                    <span className="text-[10px] text-stone-400 font-medium">All caught up</span>
                  </div>
                  <div className="py-4 text-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-stone-800">No unread notifications</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      You are up to date with all team activities and sprint milestones.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill Menu */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-all cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-stone-200"
                />
                <span className="text-xs font-medium text-stone-800 hidden md:inline-block">
                  {displayName}
                </span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-stone-200 shadow-sm p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2.5 py-1.5 border-b border-stone-100">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-stone-900">{displayName}</p>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600">
                        {roleLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 truncate mt-0.5">{displayEmail}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/tasks"
                      onClick={() => setShowProfileMenu(false)}
                      className="block px-2.5 py-1 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg"
                    >
                      My Assigned Tasks
                    </Link>
                    <Link
                      href="/projects"
                      onClick={() => setShowProfileMenu(false)}
                      className="block px-2.5 py-1 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg"
                    >
                      Project Workspaces
                    </Link>
                    <Link
                      href="/teams"
                      onClick={() => setShowProfileMenu(false)}
                      className="block px-2.5 py-1 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-lg"
                    >
                      Teams Directory
                    </Link>
                  </div>
                  <div className="pt-1 border-t border-stone-100">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="w-full text-left block px-2.5 py-1 text-xs text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Quick Search Modal with live search */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-stone-900/15 backdrop-blur-[1px]">
          <div
            className="fixed inset-0"
            onClick={() => setShowSearchModal(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-xl p-4 z-10 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 px-2 py-1.5 border-b border-stone-100">
              <Search className="w-4 h-4 text-stone-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search issues, projects, or tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-transparent outline-none text-stone-800 placeholder-stone-400 font-medium"
              />
              {searching && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />}
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-[11px] font-mono text-stone-400 hover:text-stone-600 px-1.5 py-0.5 rounded bg-stone-100 cursor-pointer"
              >
                ESC
              </button>
            </div>

            {/* Results or Helper */}
            <div className="p-2 pt-3 text-xs max-h-72 overflow-y-auto">
              {searchQuery.trim() ? (
                searchResults.projects.length === 0 && searchResults.tasks.length === 0 ? (
                  !searching && (
                    <p className="text-center py-4 text-stone-400">
                      No matching projects or tasks found.
                    </p>
                  )
                ) : (
                  <div className="space-y-3">
                    {searchResults.projects.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                          Projects
                        </span>
                        <div className="space-y-1">
                          {searchResults.projects.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setShowSearchModal(false);
                                router.push(`/projects/${p.id}`);
                              }}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <FolderKanban className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="font-semibold text-stone-800">{p.name}</span>
                              </div>
                              <span className="text-[10px] text-stone-400">#{p.id}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.tasks.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                          Tasks
                        </span>
                        <div className="space-y-1">
                          {searchResults.tasks.map((t) => (
                            <div
                              key={t.id}
                              onClick={() => {
                                setShowSearchModal(false);
                                openTaskDetail(t.id);
                              }}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold text-stone-600 bg-stone-100 px-1 py-0.5 rounded">
                                  SS-{t.id}
                                </span>
                                <span className="font-medium text-stone-800 truncate max-w-xs">
                                  {t.title}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                                {t.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="text-stone-400 text-[11px] py-2">
                  Type project names or task titles above to quickly navigate.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
