"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("team_members", {
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,

        references: {
          model: "users",
          key: "id",
        },

        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,

        references: {
          model: "teams",
          key: "id",
        },

        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      role: {
        type: Sequelize.ENUM(
          "OWNER",
          "ADMIN",
          "MEMBER"
        ),
        allowNull: false,
        defaultValue: "MEMBER",
      },

      joined_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("team_members");

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_team_members_role";'
    );
  },
};