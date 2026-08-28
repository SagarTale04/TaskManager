import sequelize from "./config/database.js";
import {
  Project,
  Team,
  Sprint,
  Task,
  User,
} from "./models/index.js";

try {
  await sequelize.authenticate();

  console.log("Database connected successfully.");

  const projects = await Project.findAll({
    include: [
      {
        model: Team,
        as: "team",
      },
      {
        model: Sprint,
        as: "sprints",
        include: [
          {
            model: Task,
            as: "tasks",
            include: [
              {
                model: User,
                as: "assignee",
                attributes: ["id", "name", "email"],
              },
            ],
          },
        ],
      },
    ],
  });

  console.dir(
    projects.map((project) => project.toJSON()),
    { depth: null }
  );

  await sequelize.close();
} catch (error) {
  console.error("Database test failed:", error);
}