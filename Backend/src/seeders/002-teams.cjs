"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("teams", [
      {
        name: "Engineering",
        description: "Software engineering team",
        created_by: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },

      {
        name: "Product",
        description: "Product and planning team",
        created_by: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("teams", null, {});
  },
};