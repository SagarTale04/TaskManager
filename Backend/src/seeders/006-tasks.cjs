"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("tasks", [
      {
        project_id: 1,
        sprint_id: 1,
        title: "Design database schema",
        description: "Design and finalize the PostgreSQL database schema for SyncSprint.",
        status: "DONE",
        priority: "HIGH",
        story_points: 5,
        assigned_to: 3,
        created_by: 1,
        due_date: "2026-08-10",
        created_at: new Date(),
        updated_at: new Date(),
      },

      {
        project_id: 1,
        sprint_id: 1,
        title: "Create Sequelize migrations",
        description: "Create migrations for users, teams, projects, sprints and tasks.",
        status: "DONE",
        priority: "HIGH",
        story_points: 5,
        assigned_to: 3,
        created_by: 1,
        due_date: "2026-08-12",
        created_at: new Date(),
        updated_at: new Date(),
      },

      {
        project_id: 1,
        sprint_id: 2,
        title: "Implement JWT authentication",
        description: "Implement user registration, login and JWT authentication.",
        status: "IN_PROGRESS",
        priority: "URGENT",
        story_points: 8,
        assigned_to: 3,
        created_by: 1,
        due_date: "2026-08-20",
        created_at: new Date(),
        updated_at: new Date(),
      },

      {
        project_id: 1,
        sprint_id: 2,
        title: "Build project management API",
        description: "Create APIs for creating, updating, deleting and fetching projects.",
        status: "TODO",
        priority: "HIGH",
        story_points: 5,
        assigned_to: 4,
        created_by: 1,
        due_date: "2026-08-22",
        created_at: new Date(),
        updated_at: new Date(),
      },

      {
        project_id: 1,
        sprint_id: 2,
        title: "Build task management API",
        description: "Implement CRUD operations for tasks and task assignments.",
        status: "TODO",
        priority: "HIGH",
        story_points: 8,
        assigned_to: 3,
        created_by: 2,
        due_date: "2026-08-25",
        created_at: new Date(),
        updated_at: new Date(),
      },

      {
        project_id: 1,
        sprint_id: null,
        title: "Create SyncSprint dashboard",
        description: "Build the main dashboard showing projects, sprints and task statistics.",
        status: "TODO",
        priority: "MEDIUM",
        story_points: 8,
        assigned_to: 4,
        created_by: 2,
        due_date: "2026-08-30",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("tasks", null, {});
  },
};