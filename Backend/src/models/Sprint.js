import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Sprint = sequelize.define(
  "Sprint",
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

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    goal: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "start_date",
    },

    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "end_date",
    },

    status: {
      type: DataTypes.ENUM(
        "PLANNED",
        "ACTIVE",
        "COMPLETED",
        "CANCELLED"
      ),
      allowNull: false,
      defaultValue: "PLANNED",
    },

    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "created_by",
    },
  },
  {
    tableName: "sprints",

    timestamps: true,

    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Sprint;