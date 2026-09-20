import request from "supertest";
import app from "../src/app.js";
import {
  createTestUser,
  createTestTeam,
  addTeamMember,
  truncateTables,
  closeDb,
} from "./helpers.js";
import { Project, Sprint, Task } from "../src/models/index.js";

describe("Zod Request Validation", () => {
  beforeEach(async () => {
    await truncateTables();
  });

  afterAll(async () => {
    await closeDb();
  });

  describe("Auth Validation", () => {
    test("Should reject registration with invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "not-an-email",
          password: "Password123!",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/valid email/i);
    });

    test("Should reject registration with password shorter than 6 characters", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "valid@syncsprint.com",
          password: "123",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/at least 6 characters/i);
    });

    test("Should reject registration with missing name", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "valid@syncsprint.com",
          password: "Password123!",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/name is required/i);
    });

    test("Should reject login with invalid email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "invalid-email",
          password: "Password123!",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test("Should reject login with missing password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "user@syncsprint.com",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/password is required/i);
    });
  });

  describe("Team Validation", () => {
    test("Should reject team creation with empty name", async () => {
      const admin = await createTestUser({ role: "ADMIN" });

      const res = await request(app)
        .post("/api/teams")
        .set("Authorization", admin.authHeader)
        .send({
          name: "   ",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/team name is required/i);
    });

    test("Should reject adding member with invalid role enum", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const res = await request(app)
        .post(`/api/teams/${team.id}/members`)
        .set("Authorization", owner.authHeader)
        .send({
          userId: 2,
          role: "SUPER_MEMBER",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid team role/i);
    });

    test("Should reject adding member with non-numeric userId", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const res = await request(app)
        .post(`/api/teams/${team.id}/members`)
        .set("Authorization", owner.authHeader)
        .send({
          userId: "abc",
          role: "MEMBER",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test("Should reject updating member role with invalid enum", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const member = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: member.user.id, role: "MEMBER" });

      const res = await request(app)
        .patch(`/api/teams/${team.id}/members/${member.user.id}`)
        .set("Authorization", owner.authHeader)
        .send({
          role: "PRESIDENT",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid team role/i);
    });
  });

  describe("Project Validation", () => {
    test("Should reject project creation with empty name", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const res = await request(app)
        .post(`/api/teams/${team.id}/projects`)
        .set("Authorization", owner.authHeader)
        .send({
          name: "  ",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/project name is required/i);
    });

    test("Should reject project update with empty body", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });
      const project = await Project.create({
        teamId: team.id,
        name: "Test Project",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set("Authorization", owner.authHeader)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/at least one field is required/i);
    });

    test("Should reject project update with invalid status enum", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });
      const project = await Project.create({
        teamId: team.id,
        name: "Test Project",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set("Authorization", owner.authHeader)
        .send({
          status: "DELETED",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid project status/i);
    });
  });

  describe("Sprint Validation", () => {
    test("Should reject sprint creation with missing dates", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });
      const project = await Project.create({
        teamId: team.id,
        name: "Sprint Project",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .post(`/api/projects/${project.id}/sprints`)
        .set("Authorization", owner.authHeader)
        .send({
          name: "Sprint 1",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test("Should reject sprint creation with invalid date format", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });
      const project = await Project.create({
        teamId: team.id,
        name: "Sprint Project",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .post(`/api/projects/${project.id}/sprints`)
        .set("Authorization", owner.authHeader)
        .send({
          name: "Sprint 1",
          startDate: "10-01-2026",
          endDate: "2026-10-15",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/YYYY-MM-DD/i);
    });

    test("Should reject sprint creation where endDate is before startDate", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });
      const project = await Project.create({
        teamId: team.id,
        name: "Sprint Project",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .post(`/api/projects/${project.id}/sprints`)
        .set("Authorization", owner.authHeader)
        .send({
          name: "Sprint 1",
          startDate: "2026-10-20",
          endDate: "2026-10-10",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/end date cannot be before start date/i);
    });

    test("Should reject sprint update with invalid status enum", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });
      const project = await Project.create({
        teamId: team.id,
        name: "Sprint Project",
        createdBy: owner.user.id,
      });
      const sprint = await Sprint.create({
        projectId: project.id,
        name: "Sprint 1",
        startDate: "2026-10-01",
        endDate: "2026-10-15",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .patch(`/api/sprints/${sprint.id}`)
        .set("Authorization", owner.authHeader)
        .send({
          status: "FINISHED",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid sprint status/i);
    });
  });

  describe("Task Validation", () => {
    test("Should reject task creation with missing title", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });
      const project = await Project.create({
        teamId: team.id,
        name: "Task Project",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .post(`/api/projects/${project.id}/tasks`)
        .set("Authorization", owner.authHeader)
        .send({
          description: "No title provided",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/task title is required/i);
    });

    test("Should reject task creation with invalid status enum", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });
      const project = await Project.create({
        teamId: team.id,
        name: "Task Project",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .post(`/api/projects/${project.id}/tasks`)
        .set("Authorization", owner.authHeader)
        .send({
          title: "Task with bad status",
          status: "IN_LIMBO",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid task status/i);
    });

    test("Should reject task creation with invalid priority enum", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });
      const project = await Project.create({
        teamId: team.id,
        name: "Task Project",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .post(`/api/projects/${project.id}/tasks`)
        .set("Authorization", owner.authHeader)
        .send({
          title: "Task with bad priority",
          priority: "CRITICAL",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid task priority/i);
    });

    test("Should reject task creation with negative story points", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });
      const project = await Project.create({
        teamId: team.id,
        name: "Task Project",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .post(`/api/projects/${project.id}/tasks`)
        .set("Authorization", owner.authHeader)
        .send({
          title: "Negative Points Task",
          storyPoints: -5,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot be negative/i);
    });

    test("Should reject task update with empty body", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });
      const project = await Project.create({
        teamId: team.id,
        name: "Task Project",
        createdBy: owner.user.id,
      });
      const task = await Task.create({
        projectId: project.id,
        title: "Task to Update",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .patch(`/api/tasks/${task.id}`)
        .set("Authorization", owner.authHeader)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/at least one field is required/i);
    });
  });

  describe("Comment Validation", () => {
    test("Should reject comment creation with empty whitespace content", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });
      const project = await Project.create({
        teamId: team.id,
        name: "Comment Project",
        createdBy: owner.user.id,
      });
      const task = await Task.create({
        projectId: project.id,
        title: "Task with Comments",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .post(`/api/tasks/${task.id}/comments`)
        .set("Authorization", owner.authHeader)
        .send({
          content: "   ",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/comment content is required/i);
    });

    test("Should reject comment update with empty whitespace content", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });
      const project = await Project.create({
        teamId: team.id,
        name: "Comment Project",
        createdBy: owner.user.id,
      });
      const task = await Task.create({
        projectId: project.id,
        title: "Task with Comments",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .patch("/api/comments/1")
        .set("Authorization", owner.authHeader)
        .send({
          content: "",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/comment content is required/i);
    });
  });
});
