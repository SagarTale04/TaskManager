"use strict"

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("projects", [
      {
        team_id: 1,
        name: "SyncSprint",
        description: "Team collaboration and sprint management platform",
        status: "ACTIVE",
        created_by: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },

      {
        team_id: 1,
        name: "Career Catalyst",
        description: "AI-powered career guidance platform",
        status: "ACTIVE",
        created_by: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("projects", null, {});
  },
};