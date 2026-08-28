"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("comments", [
      {
        task_id: 1,
        user_id: 3,
        content: "Database schema has been finalized.",
        created_at: new Date(),
        updated_at: new Date(),
      },

      {
        task_id: 2,
        user_id: 3,
        content: "Migrations have been created and tested.",
        created_at: new Date(),
        updated_at: new Date(),
      },

      {
        task_id: 3,
        user_id: 3,
        content: "JWT authentication implementation is in progress.",
        created_at: new Date(),
        updated_at: new Date(),
      },

      {
        task_id: 3,
        user_id: 4,
        content: "Remember to validate the JWT expiration time.",
        created_at: new Date(),
        updated_at: new Date(),
      },

      {
        task_id: 4,
        user_id: 2,
        content: "Please make sure project authorization is handled.",
        created_at: new Date(),
        updated_at: new Date(),
      },

      {
        task_id: 5,
        user_id: 3,
        content: "Task API should support filtering by sprint and status.",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("comments", null, {});
  },
};