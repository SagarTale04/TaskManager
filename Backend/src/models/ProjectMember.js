import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ProjectMember = sequelize.define(
  "ProjectMember",
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

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },

    role: {
      type: DataTypes.ENUM(
        "ADMIN",
        "DEVELOPER"
      ),
      allowNull: false,
      defaultValue: "DEVELOPER",
    },
  },
  {
    tableName: "project_members",

    timestamps: true,

    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default ProjectMember;