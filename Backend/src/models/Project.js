import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Project = sequelize.define(
  "Project",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "team_id",
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("ACTIVE", "ARCHIVED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },

    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "created_by",
    },
  },
  {
    tableName: "projects",

    timestamps: true,

    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Project;