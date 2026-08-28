"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("team_members", [
      {
        user_id: 1,
        team_id: 1,
        role: "OWNER",
        joined_at: new Date(),
      },

      {
        user_id: 2,
        team_id: 1,
        role: "ADMIN",
        joined_at: new Date(),
      },

      {
        user_id: 3,
        team_id: 1,
        role: "MEMBER",
        joined_at: new Date(),
      },

      {
        user_id: 4,
        team_id: 1,
        role: "MEMBER",
        joined_at: new Date(),
      },

      {
        user_id: 1,
        team_id: 2,
        role: "OWNER",
        joined_at: new Date(),
      },

      {
        user_id: 2,
        team_id: 2,
        role: "MEMBER",
        joined_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("team_members", null, {});
  },
};