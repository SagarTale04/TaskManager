"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex("tasks", ["project_id"], {
      name: "idx_tasks_project_id",
    });

    await queryInterface.addIndex("tasks", ["sprint_id"], {
      name: "idx_tasks_sprint_id",
    });

    await queryInterface.addIndex("projects", ["team_id"], {
      name: "idx_projects_team_id",
    });

    await queryInterface.addIndex("sprints", ["project_id"], {
      name: "idx_sprints_project_id",
    });

    await queryInterface.addIndex("comments", ["task_id"], {
      name: "idx_comments_task_id",
    });

    await queryInterface.addIndex("team_members", ["team_id"], {
      name: "idx_team_members_team_id",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("team_members", "idx_team_members_team_id");
    await queryInterface.removeIndex("comments", "idx_comments_task_id");
    await queryInterface.removeIndex("sprints", "idx_sprints_project_id");
    await queryInterface.removeIndex("projects", "idx_projects_team_id");
    await queryInterface.removeIndex("tasks", "idx_tasks_sprint_id");
    await queryInterface.removeIndex("tasks", "idx_tasks_project_id");
  },
};
