import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field:"password_hash"
    },

    role: {
      type: DataTypes.ENUM(
        "SUPERADMIN",
        "ADMIN",
        "DEVELOPER"
      ),
      allowNull: false,
      defaultValue: "DEVELOPER",
    },
  },
  {
    tableName: "users",

    timestamps: true,

    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default User;