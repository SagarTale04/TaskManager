require("dotenv").config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: "postgres",

    seederStorage: "sequelize",
  },

  test: {
    url: process.env.TEST_DATABASE_URL,
    dialect: "postgres",

    seederStorage: "sequelize",
  },

  production: {
    url: process.env.DATABASE_URL,
    dialect: "postgres",

    seederStorage: "sequelize",

    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};