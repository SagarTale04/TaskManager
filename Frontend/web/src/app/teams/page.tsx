"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AppShell from "@/src/components/layout/AppShell";
import { Team, TeamMemberRole, User } from "@/src/types";
import { getMyTeams, createTeam, addTeamMember, updateTeamMemberRole, removeTeamMember } from "@/src/services/teamService";
import { getAllUsers } from "@/src/services/userService";
import { useAuth } from "@/src/context/AuthContext";
import { Users2, Plus, UserPlus, Trash2, Loader2, AlertCircle, X, ExternalLink } from "lucide-react";

export default function TeamsPage() {
  const { user, isSuperAdmin, isAdmin } = useAuth();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Team Modal
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Add Member Modal
  const [selectedTeamForMember, setSelectedTeamForMember] = useState<Team | null>(null);
  const [memberUserId, setMemberUserId] = useState("");
  const [memberRole, setMemberRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const loadTeams = useCallback(async () => {
    try {
      const data = await getMyTeams();
      setTeams(data);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load teams";
      setError(msg);
      console.error("Error loading teams:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    getMyTeams()
      .then((data) => {
        if (!ignore) {
          setTeams(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Failed to load teams";
          setError(msg);
          setLoading(false);
        }
      });

    getAllUsers()
      .then((users) => {
        if (!ignore) {
          setAllUsers(users);
        }
      })
      .catch((err) => {
        console.error("Failed to load users for directory:", err);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setCreateLoading(true);
    setCreateError(null);

    try {
      await createTeam({
        name: newTeamName.trim(),
        description: newTeamDesc.trim() || undefined,
      });
      setShowCreateTeam(false);
      setNewTeamName("");
      setNewTeamDesc("");
      loadTeams();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create team. Only admins can create teams.";
      setCreateError(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamForMember || !memberUserId.trim()) return;
    setAddMemberLoading(true);
    setAddMemberError(null);

    try {
      await addTeamMember(selectedTeamForMember.id, {
        userId: Number(memberUserId),
        role: memberRole,
      });
      setSelectedTeamForMember(null);
      setMemberUserId("");
      loadTeams();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add team member";
      setAddMemberError(msg);
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleUpdateRole = async (teamId: number, memberUserId: number, newRole: "ADMIN" | "MEMBER") => {
    try {
      await updateTeamMemberRole(teamId, memberUserId, newRole);
      loadTeams();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleRemoveMember = async (teamId: number, memberUserId: number) => {
    if (!confirm("Are you sure you want to remove this member from the team?")) return;
    try {
      await removeTeamMember(teamId, memberUserId);
      loadTeams();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const getMyRoleInTeam = (team: Team): TeamMemberRole => {
    if (!user) return "MEMBER";
    const myMembership = team.teamMembers?.find((m) => m.userId === user.id);
    return myMembership?.role || team.teamMembers?.[0]?.role || "MEMBER";
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <span className="text-xs font-semibold text-emerald-600 tracking-wide uppercase">
              Directory & Roles
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 mt-0.5">
              Team Workspaces & RBAC
            </h1>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setCreateError(null);
                setShowCreateTeam(true);
              }}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Team</span>
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                loadTeams();
              }}
              className="font-semibold underline hover:text-rose-900"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs text-stone-400">Loading teams from database...</span>
          </div>
        ) : teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team) => {
              const myRole = getMyRoleInTeam(team);
              const canManageTeam = myRole === "OWNER" || myRole === "ADMIN" || isSuperAdmin;

              return (
                <div
                  key={team.id}
                  className="border border-stone-200 rounded-2xl p-5 bg-white flex flex-col justify-between shadow-2xs hover:border-stone-300 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700 font-bold text-xs">
                          T{team.id}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-stone-900">{team.name}</h3>
                          <span className="text-[10px] text-stone-400">Team ID #{team.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            myRole === "OWNER"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : myRole === "ADMIN"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-stone-100 text-stone-700 border-stone-200"
                          }`}
                        >
                          {myRole}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 mt-2 mb-4 leading-relaxed">
                      {team.description || "No team description provided."}
                    </p>

                    {/* Members Roster */}
                    <div className="pt-3 border-t border-stone-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                          Members ({team.teamMembers?.length || 0})
                        </span>
                        {canManageTeam && (
                          <button
                            onClick={() => {
                              setAddMemberError(null);
                              setSelectedTeamForMember(team);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Add Member</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {team.teamMembers && team.teamMembers.length > 0 ? (
                          team.teamMembers.map((m) => {
                            const isMe = user?.id === m.userId;
                            const isMemberOwner = m.role === "OWNER";
                            const canEditThisMember = (myRole === "OWNER" || isSuperAdmin) && !isMemberOwner && !isMe;
                            const canRemoveThisMember = canManageTeam && !isMemberOwner && !isMe;

                            return (
                              <div
                                key={m.userId}
                                className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg bg-stone-50/70 hover:bg-stone-50 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {m.user?.name ? m.user.name.charAt(0).toUpperCase() : "U"}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-medium text-stone-900 truncate block text-xs">
                                      {m.user?.name || `User #${m.userId}`} {isMe && "(You)"}
                                    </span>
                                    <span className="text-[10px] text-stone-400 block truncate">
                                      {m.user?.email}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {canEditThisMember ? (
                                    <select
                                      value={m.role}
                                      onChange={(e) => handleUpdateRole(team.id, m.userId, e.target.value as "ADMIN" | "MEMBER")}
                                      className="text-[10px] font-semibold py-0.5 px-1.5 rounded border border-stone-200 bg-white text-stone-700 cursor-pointer"
                                    >
                                      <option value="MEMBER">MEMBER</option>
                                      <option value="ADMIN">ADMIN</option>
                                    </select>
                                  ) : (
                                    <span
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                        m.role === "OWNER"
                                          ? "bg-amber-50 text-amber-800 border-amber-200"
                                          : m.role === "ADMIN"
                                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                          : "bg-stone-100 text-stone-700 border-stone-200"
                                      }`}
                                    >
                                      {m.role}
                                    </span>
                                  )}

                                  {canRemoveThisMember && (
                                    <button
                                      onClick={() => handleRemoveMember(team.id, m.userId)}
                                      title="Remove member"
                                      className="w-5 h-5 rounded flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-stone-400 text-xs italic">No members found</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-400 text-[11px]">
                      Created: {team.created_at ? new Date(team.created_at).toLocaleDateString() : "—"}
                    </span>
                    <Link
                      href={`/projects?teamId=${team.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                    >
                      <span>View Team Projects</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 border border-dashed border-stone-200 rounded-2xl text-center text-xs text-stone-400 p-6">
            <Users2 className="w-8 h-8 mx-auto mb-2 text-stone-300" />
            <span className="font-semibold text-stone-700 text-sm block mb-1">No Teams Found</span>
            <p className="max-w-sm mx-auto mb-4">
              You are not a member of any teams yet. If you are an administrator, click &quot;Create Team&quot; above to start.
            </p>
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/30 backdrop-blur-[1px]">
            <div
              className="fixed inset-0"
              onClick={() => !createLoading && setShowCreateTeam(false)}
            />
            <div className="relative w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-xl p-5 sm:p-6 z-10 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
                <h3 className="text-base font-bold text-stone-900">Create New Team</h3>
                <button
                  onClick={() => setShowCreateTeam(false)}
                  disabled={createLoading}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {createError && (
                <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleCreateTeam} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Team Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Core Infrastructure Squad"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    disabled={createLoading}
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Team mandate and scope..."
                    value={newTeamDesc}
                    onChange={(e) => setNewTeamDesc(e.target.value)}
                    disabled={createLoading}
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateTeam(false)}
                    disabled={createLoading}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading || !newTeamName.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-2xs disabled:opacity-50"
                  >
                    {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Create Team</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {selectedTeamForMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/30 backdrop-blur-[1px]">
            <div
              className="fixed inset-0"
              onClick={() => !addMemberLoading && setSelectedTeamForMember(null)}
            />
            <div className="relative w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-xl p-5 sm:p-6 z-10 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
                <div>
                  <h3 className="text-base font-bold text-stone-900">Add Team Member</h3>
                  <p className="text-xs text-stone-500">{selectedTeamForMember.name}</p>
                </div>
                <button
                  onClick={() => setSelectedTeamForMember(null)}
                  disabled={addMemberLoading}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {addMemberError && (
                <div className="mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{addMemberError}</span>
                </div>
              )}

              <form onSubmit={handleAddMember} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Select Member User
                  </label>
                  {allUsers.length > 0 ? (
                    <select
                      value={memberUserId}
                      onChange={(e) => setMemberUserId(e.target.value)}
                      disabled={addMemberLoading}
                      required
                      className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="">-- Choose registered user --</option>
                      {allUsers
                        .filter(
                          (u) =>
                            !selectedTeamForMember?.teamMembers?.some(
                              (m) => Number(m.userId) === Number(u.id)
                            )
                        )
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email}) — System Role: {u.role}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      required
                      placeholder="e.g. 3"
                      value={memberUserId}
                      onChange={(e) => setMemberUserId(e.target.value)}
                      disabled={addMemberLoading}
                      className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-emerald-500"
                    />
                  )}
                  <span className="text-[11px] text-stone-400 mt-1 block">
                    Select an existing registered platform user to add to this team workspace.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Team Role
                  </label>
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value as "ADMIN" | "MEMBER")}
                    disabled={addMemberLoading}
                    className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="MEMBER">MEMBER (View and comment)</option>
                    <option value="ADMIN">ADMIN (Full project and task management)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setSelectedTeamForMember(null)}
                    disabled={addMemberLoading}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addMemberLoading || !memberUserId.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-2xs disabled:opacity-50"
                  >
                    {addMemberLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Add to Team</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
