import request from "supertest";
import app from "../src/app.js";
import {
  createTestUser,
  createTestTeam,
  addTeamMember,
  truncateTables,
  closeDb,
} from "./helpers.js";
import { Project, Sprint } from "../src/models/index.js";

describe("Sprint API", () => {
  beforeEach(async () => {
    await truncateTables();
  });

  afterAll(async () => {
    await closeDb();
  });

  describe("POST /api/projects/:projectId/sprints (Create Sprint)", () => {
    test("Team OWNER should be allowed to create a sprint", async () => {
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
          goal: "Core authentication",
          startDate: "2026-10-01",
          endDate: "2026-10-15",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sprint.name).toBe("Sprint 1");
      expect(res.body.data.sprint.status).toBe("PLANNED");
    });

    test("Team MEMBER should receive 403 when creating a sprint", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const member = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: member.user.id, role: "MEMBER" });

      const project = await Project.create({
        teamId: team.id,
        name: "Sprint Project",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .post(`/api/projects/${project.id}/sprints`)
        .set("Authorization", member.authHeader)
        .send({
          name: "Unauthorized Sprint",
          startDate: "2026-10-01",
          endDate: "2026-10-15",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test("Should return 400 when end date is before start date", async () => {
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
          name: "Invalid Date Sprint",
          startDate: "2026-10-15",
          endDate: "2026-10-01",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test("Should return 400 when creating a sprint in an ARCHIVED project", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });
      const project = await Project.create({
        teamId: team.id,
        name: "Archived Project",
        status: "ARCHIVED",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .post(`/api/projects/${project.id}/sprints`)
        .set("Authorization", owner.authHeader)
        .send({
          name: "Sprint in Archived Project",
          startDate: "2026-10-01",
          endDate: "2026-10-15",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/projects/:projectId/sprints (List Project Sprints)", () => {
    test("Team member can list all sprints for a project", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const member = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: member.user.id, role: "MEMBER" });

      const project = await Project.create({
        teamId: team.id,
        name: "Project Sprints",
        createdBy: owner.user.id,
      });

      await Sprint.create({
        projectId: project.id,
        name: "Sprint Alpha",
        startDate: "2026-10-01",
        endDate: "2026-10-15",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .get(`/api/projects/${project.id}/sprints`)
        .set("Authorization", member.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sprints.length).toBe(1);
      expect(res.body.data.sprints[0].name).toBe("Sprint Alpha");
    });
  });

  describe("GET /api/sprints/:sprintId (Get Sprint by ID)", () => {
    test("Team member can fetch sprint by ID", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });
      const project = await Project.create({
        teamId: team.id,
        name: "Sprint Details",
        createdBy: owner.user.id,
      });

      const sprint = await Sprint.create({
        projectId: project.id,
        name: "Sprint Details Test",
        startDate: "2026-10-01",
        endDate: "2026-10-15",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .get(`/api/sprints/${sprint.id}`)
        .set("Authorization", owner.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sprint.id).toBe(sprint.id);
    });

    test("Should return 404 for non-existent sprint", async () => {
      const owner = await createTestUser({ role: "ADMIN" });

      const res = await request(app)
        .get("/api/sprints/99999")
        .set("Authorization", owner.authHeader);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PATCH /api/sprints/:sprintId (Update Sprint)", () => {
    test("Team OWNER can update sprint status and goal", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });
      const project = await Project.create({
        teamId: team.id,
        name: "Sprint Update Project",
        createdBy: owner.user.id,
      });

      const sprint = await Sprint.create({
        projectId: project.id,
        name: "Sprint to Update",
        startDate: "2026-10-01",
        endDate: "2026-10-15",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .patch(`/api/sprints/${sprint.id}`)
        .set("Authorization", owner.authHeader)
        .send({
          status: "ACTIVE",
          goal: "Updated Sprint Goal",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sprint.status).toBe("ACTIVE");
      expect(res.body.data.sprint.goal).toBe("Updated Sprint Goal");
    });

    test("Should return 400 for invalid sprint status", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });
      const project = await Project.create({
        teamId: team.id,
        name: "Sprint Invalid Status Project",
        createdBy: owner.user.id,
      });

      const sprint = await Sprint.create({
        projectId: project.id,
        name: "Sprint Status Test",
        startDate: "2026-10-01",
        endDate: "2026-10-15",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .patch(`/api/sprints/${sprint.id}`)
        .set("Authorization", owner.authHeader)
        .send({
          status: "INVALID_STATUS",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
