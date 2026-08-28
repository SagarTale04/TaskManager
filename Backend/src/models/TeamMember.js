import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const TeamMember = sequelize.define(
  "TeamMember",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "user_id",
    },

    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "team_id",
    },

    role: {
      type: DataTypes.ENUM(
        "OWNER",
        "ADMIN",
        "MEMBER"
      ),
      allowNull: false,
      defaultValue: "MEMBER",
    },

    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "joined_at",
    },
  },
  {
    tableName: "team_members",

    // Database table does not have
    // created_at and updated_at
    timestamps: false,
  }
);

export default TeamMember;