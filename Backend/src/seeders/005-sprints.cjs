"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("sprints", [
      {
        project_id: 1,
        name: "Sprint 1",
        goal: "Build authentication and project management",
        start_date: "2026-08-01",
        end_date: "2026-08-14",
        status: "COMPLETED",
        created_by: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        project_id: 1,
        name: "Sprint 2",
        goal: "Build task management",
        start_date: "2026-08-15",
        end_date: "2026-08-28",
        status: "ACTIVE",
        created_by: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("sprints", {
      project_id: 1,
    });
  },
};