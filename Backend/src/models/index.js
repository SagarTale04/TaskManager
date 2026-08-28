import User from "./User.js";
import Team from "./Team.js";
import TeamMember from "./TeamMember.js";
import Project from "./Project.js";
import Sprint from "./Sprint.js";
import Task from "./Task.js";
import Comment from "./Comment.js";

// =====================================================
// User ↔ Team through TeamMember
// =====================================================

User.belongsToMany(Team, {
  through: TeamMember,
  foreignKey: "userId",
  otherKey: "teamId",
  as: "teams",
});

Team.belongsToMany(User, {
  through: TeamMember,
  foreignKey: "teamId",
  otherKey: "userId",
  as: "members",
});

// =====================================================
// TeamMember ↔ Team
// =====================================================

Team.hasMany(TeamMember, {
  foreignKey: "teamId",
  as: "teamMembers",
});

TeamMember.belongsTo(Team, {
  foreignKey: "teamId",
  as: "team",
});

// =====================================================
// TeamMember ↔ User
// =====================================================

User.hasMany(TeamMember, {
  foreignKey: "userId",
  as: "teamMemberships",
});

TeamMember.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// =====================================================
// Team ↔ Project
// =====================================================

Team.hasMany(Project, {
  foreignKey: "teamId",
  as: "projects",
});

Project.belongsTo(Team, {
  foreignKey: "teamId",
  as: "team",
});

// =====================================================
// User ↔ Project (created by)
// =====================================================

User.hasMany(Project, {
  foreignKey: "createdBy",
  as: "createdProjects",
});

Project.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

// =====================================================
// Project ↔ Sprint
// =====================================================

Project.hasMany(Sprint, {
  foreignKey: "projectId",
  as: "sprints",
});

Sprint.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

// =====================================================
// Project ↔ Task
// =====================================================

Project.hasMany(Task, {
  foreignKey: "projectId",
  as: "tasks",
});

Task.belongsTo(Project, {
  foreignKey: "projectId",
  as: "project",
});

// =====================================================
// Sprint ↔ Task
// =====================================================

Sprint.hasMany(Task, {
  foreignKey: "sprintId",
  as: "tasks",
});

Task.belongsTo(Sprint, {
  foreignKey: "sprintId",
  as: "sprint",
});

// =====================================================
// User ↔ Task (created by)
// =====================================================

User.hasMany(Task, {
  foreignKey: "createdBy",
  as: "createdTasks",
});

Task.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
});

// =====================================================
// User ↔ Task (assigned to)
// =====================================================

User.hasMany(Task, {
  foreignKey: "assignedTo",
  as: "assignedTasks",
});

Task.belongsTo(User, {
  foreignKey: "assignedTo",
  as: "assignee",
});

// =====================================================
// Task ↔ Comment
// =====================================================

Task.hasMany(Comment, {
  foreignKey: "taskId",
  as: "comments",
});

Comment.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
});

// =====================================================
// User ↔ Comment
// =====================================================

User.hasMany(Comment, {
  foreignKey: "userId",
  as: "comments",
});

Comment.belongsTo(User, {
  foreignKey: "userId",
  as: "author",
});

// =====================================================
// Exports
// =====================================================

export {
  User,
  Team,
  TeamMember,
  Project,
  Sprint,
  Task,
  Comment,
};