import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Task = sequelize.define(
  "Task",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "project_id",
    },

    sprintId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "sprint_id",
    },

    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "TODO",
        "IN_PROGRESS",
        "IN_REVIEW",
        "DONE"
      ),
      allowNull: false,
      defaultValue: "TODO",
    },

    priority: {
      type: DataTypes.ENUM(
        "LOW",
        "MEDIUM",
        "HIGH",
        "URGENT"
      ),
      allowNull: false,
      defaultValue: "MEDIUM",
    },

    storyPoints: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "story_points",
    },

    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "assigned_to",
    },

    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "created_by",
    },

    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "due_date",
    },
  },
  {
    tableName: "tasks",

    timestamps: true,

    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Task;