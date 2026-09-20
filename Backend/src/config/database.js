import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const isTest = process.env.NODE_ENV === "test";
const dbUrl = isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;

const sequelize = new Sequelize(dbUrl, {
  dialect: "postgres",
  logging: false,
});

export default sequelize;