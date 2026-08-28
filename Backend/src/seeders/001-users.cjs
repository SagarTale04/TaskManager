"use strict";

const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    await queryInterface.bulkInsert("users", [
      {
        name: "Super Admin",
        email: "superadmin@syncsprint.com",
        password_hash: passwordHash,
        role: "SUPER_ADMIN",
        created_at: new Date(),
        updated_at: new Date(),
      },

      {
        name: "Admin User",
        email: "admin@syncsprint.com",
        password_hash: passwordHash,
        role: "ADMIN",
        created_at: new Date(),
        updated_at: new Date(),
      },

      {
        name: "Sagar Developer",
        email: "sagar@syncsprint.com",
        password_hash: passwordHash,
        role: "DEVELOPER",
        created_at: new Date(),
        updated_at: new Date(),
      },

      {
        name: "Rahul Developer",
        email: "rahul@syncsprint.com",
        password_hash: passwordHash,
        role: "DEVELOPER",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", null, {});
  },
};