import bcrypt from "bcrypt";
import sequelize from "../src/config/database.js";
import {
  User,
  Team,
  TeamMember,
  Project,
  Sprint,
  Task,
  Comment,
} from "../src/models/index.js";
import generateToken from "../src/utils/generateToken.js";

/**
 * Truncates all tables in the test database.
 */
export const truncateTables = async () => {
  await sequelize.query(
    "TRUNCATE TABLE comments, tasks, sprints, projects, team_members, teams, users RESTART IDENTITY CASCADE;"
  );
};

/**
 * Creates a test user and returns user model, plain password, JWT token, and auth header.
 */
export const createTestUser = async ({
  name = "Test User",
  email = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@syncsprint.com`,
  password = "Password123!",
  role = "DEVELOPER",
} = {}) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
  });

  const token = generateToken(user);
  return {
    user,
    token,
    authHeader: `Bearer ${token}`,
    password,
  };
};

/**
 * Creates a test team with creator assigned as OWNER.
 */
export const createTestTeam = async ({
  name = "Test Team",
  description = "Test Team Description",
  creator,
}) => {
  const team = await Team.create({
    name,
    description,
    createdBy: creator.id,
  });

  await TeamMember.create({
    teamId: team.id,
    userId: creator.id,
    role: "OWNER",
  });

  return team;
};

/**
 * Adds a member to a team with a specific role.
 */
export const addTeamMember = async ({ teamId, userId, role = "MEMBER" }) => {
  return await TeamMember.create({
    teamId,
    userId,
    role,
  });
};

/**
 * Safely closes the Sequelize connection pool.
 */
export const closeDb = async () => {
  await sequelize.close();
};
