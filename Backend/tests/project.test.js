import request from "supertest";
import app from "../src/app.js";
import {
  createTestUser,
  createTestTeam,
  addTeamMember,
  truncateTables,
  closeDb,
} from "./helpers.js";
import { Project } from "../src/models/index.js";

describe("Project API", () => {
  beforeEach(async () => {
    await truncateTables();
  });

  afterAll(async () => {
    await closeDb();
  });

  describe("POST /api/teams/:teamId/projects (Create Project)", () => {
    test("Team OWNER should be allowed to create a project", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const res = await request(app)
        .post(`/api/teams/${team.id}/projects`)
        .set("Authorization", owner.authHeader)
        .send({
          name: "Website Redesign",
          description: "New modern frontend",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project.name).toBe("Website Redesign");
      expect(res.body.data.project.status).toBe("ACTIVE");
    });

    test("Team ADMIN should be allowed to create a project", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const adminMember = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: adminMember.user.id, role: "ADMIN" });

      const res = await request(app)
        .post(`/api/teams/${team.id}/projects`)
        .set("Authorization", adminMember.authHeader)
        .send({
          name: "Mobile App",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test("Team MEMBER should receive 403 when creating a project", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const member = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: member.user.id, role: "MEMBER" });

      const res = await request(app)
        .post(`/api/teams/${team.id}/projects`)
        .set("Authorization", member.authHeader)
        .send({
          name: "Unauthorized Project",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test("Should return 400 when project name is missing", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const res = await request(app)
        .post(`/api/teams/${team.id}/projects`)
        .set("Authorization", owner.authHeader)
        .send({
          description: "Missing name",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/teams/:teamId/projects (List Team Projects)", () => {
    test("Team member can list all projects in the team", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const member = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: member.user.id, role: "MEMBER" });

      await Project.create({
        teamId: team.id,
        name: "Project Alpha",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .get(`/api/teams/${team.id}/projects`)
        .set("Authorization", member.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.projects.length).toBe(1);
      expect(res.body.data.projects[0].name).toBe("Project Alpha");
    });

    test("Non-team member receives 403 when listing team projects", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const outsider = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });

      const res = await request(app)
        .get(`/api/teams/${team.id}/projects`)
        .set("Authorization", outsider.authHeader);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/projects/:projectId (Get Project by ID)", () => {
    test("Team member can fetch project by ID", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const project = await Project.create({
        teamId: team.id,
        name: "Project Beta",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .get(`/api/projects/${project.id}`)
        .set("Authorization", owner.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project.id).toBe(project.id);
    });

    test("Should return 404 for non-existent project", async () => {
      const owner = await createTestUser({ role: "ADMIN" });

      const res = await request(app)
        .get("/api/projects/99999")
        .set("Authorization", owner.authHeader);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PATCH /api/projects/:projectId (Update Project)", () => {
    test("Team OWNER can update project details", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const project = await Project.create({
        teamId: team.id,
        name: "Old Project Name",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set("Authorization", owner.authHeader)
        .send({
          name: "Updated Project Name",
          description: "Updated description",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project.name).toBe("Updated Project Name");
    });

    test("Team MEMBER receives 403 when updating project", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const member = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: member.user.id, role: "MEMBER" });

      const project = await Project.create({
        teamId: team.id,
        name: "Protected Project",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set("Authorization", member.authHeader)
        .send({
          name: "Hacked Name",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test("Should return 400 when no update fields are provided", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const project = await Project.create({
        teamId: team.id,
        name: "Empty Update Project",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set("Authorization", owner.authHeader)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("DELETE /api/projects/:projectId (Archive Project)", () => {
    test("Team OWNER can archive project (status set to ARCHIVED)", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const project = await Project.create({
        teamId: team.id,
        name: "Project to Archive",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .delete(`/api/projects/${project.id}`)
        .set("Authorization", owner.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project.status).toBe("ARCHIVED");
    });

    test("Team MEMBER receives 403 when archiving project", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const member = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: member.user.id, role: "MEMBER" });

      const project = await Project.create({
        teamId: team.id,
        name: "Member Protected Project",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .delete(`/api/projects/${project.id}`)
        .set("Authorization", member.authHeader);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
