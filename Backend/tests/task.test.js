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

describe("Task API", () => {
  beforeEach(async () => {
    await truncateTables();
  });

  afterAll(async () => {
    await closeDb();
  });

  describe("POST /api/projects/:projectId/tasks (Create Task)", () => {
    test("Team OWNER can create a task", async () => {
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
          title: "Implement Login Feature",
          description: "OAuth and password login",
          status: "TODO",
          priority: "HIGH",
          storyPoints: 5,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.title).toBe("Implement Login Feature");
      expect(res.body.data.task.status).toBe("TODO");
      expect(res.body.data.task.priority).toBe("HIGH");
    });

    test("Team MEMBER receives 403 when attempting to create a task", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const member = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: member.user.id, role: "MEMBER" });

      const project = await Project.create({
        teamId: team.id,
        name: "Member Task Project",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .post(`/api/projects/${project.id}/tasks`)
        .set("Authorization", member.authHeader)
        .send({
          title: "Unauthorized Task",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test("Should return 400 when task title is missing", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });
      const project = await Project.create({
        teamId: team.id,
        name: "Missing Title Project",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .post(`/api/projects/${project.id}/tasks`)
        .set("Authorization", owner.authHeader)
        .send({
          description: "Missing title",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test("Should assign task to a team member successfully", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const member = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: member.user.id, role: "MEMBER" });

      const project = await Project.create({
        teamId: team.id,
        name: "Assignee Project",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .post(`/api/projects/${project.id}/tasks`)
        .set("Authorization", owner.authHeader)
        .send({
          title: "Assigned Task",
          assignedTo: member.user.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.assignedTo).toBe(member.user.id);
    });

    test("Should return 400 when assigning task to a user outside the project team", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const outsider = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });

      const project = await Project.create({
        teamId: team.id,
        name: "Outsider Assignee Project",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .post(`/api/projects/${project.id}/tasks`)
        .set("Authorization", owner.authHeader)
        .send({
          title: "Invalid Assignment Task",
          assignedTo: outsider.user.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not a member of this project's team/i);
    });

    test("Should return 400 when assigning task to a sprint of a different project", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const project1 = await Project.create({
        teamId: team.id,
        name: "Project 1",
        createdBy: owner.user.id,
      });

      const project2 = await Project.create({
        teamId: team.id,
        name: "Project 2",
        createdBy: owner.user.id,
      });

      const foreignSprint = await Sprint.create({
        projectId: project2.id,
        name: "Sprint in Project 2",
        startDate: "2026-10-01",
        endDate: "2026-10-15",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .post(`/api/projects/${project1.id}/tasks`)
        .set("Authorization", owner.authHeader)
        .send({
          title: "Mismatched Sprint Task",
          sprintId: foreignSprint.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/does not belong to this project/i);
    });

    test("Should return 400 when creating task in an ARCHIVED project", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const project = await Project.create({
        teamId: team.id,
        name: "Archived Task Project",
        status: "ARCHIVED",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .post(`/api/projects/${project.id}/tasks`)
        .set("Authorization", owner.authHeader)
        .send({
          title: "Task in Archived Project",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/projects/:projectId/tasks (List Project Tasks with Filters & Sorting)", () => {
    test("Team member can list tasks with sorting and pagination", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const member = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: member.user.id, role: "MEMBER" });

      const project = await Project.create({
        teamId: team.id,
        name: "Filter Project",
        createdBy: owner.user.id,
      });

      await Task.create({
        projectId: project.id,
        title: "Task A",
        status: "TODO",
        priority: "LOW",
        createdBy: owner.user.id,
      });

      await Task.create({
        projectId: project.id,
        title: "Task B",
        status: "DONE",
        priority: "URGENT",
        createdBy: owner.user.id,
      });

      // Fetch all
      const res = await request(app)
        .get(`/api/projects/${project.id}/tasks?page=1&limit=10&sortBy=createdAt&order=DESC`)
        .set("Authorization", member.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tasks.length).toBe(2);
      expect(res.body.data.pagination.totalItems).toBe(2);

      // Filter by status=TODO
      const filteredRes = await request(app)
        .get(`/api/projects/${project.id}/tasks?status=TODO`)
        .set("Authorization", member.authHeader);

      expect(filteredRes.status).toBe(200);
      expect(filteredRes.body.data.tasks.length).toBe(1);
      expect(filteredRes.body.data.tasks[0].title).toBe("Task A");
    });
  });

  describe("GET /api/sprints/:sprintId/tasks (List Sprint Tasks)", () => {
    test("Team member can list tasks belonging to a sprint", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const project = await Project.create({
        teamId: team.id,
        name: "Sprint Tasks Project",
        createdBy: owner.user.id,
      });

      const sprint = await Sprint.create({
        projectId: project.id,
        name: "Active Sprint",
        startDate: "2026-10-01",
        endDate: "2026-10-15",
        createdBy: owner.user.id,
      });

      await Task.create({
        projectId: project.id,
        sprintId: sprint.id,
        title: "Sprint Task 1",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .get(`/api/sprints/${sprint.id}/tasks`)
        .set("Authorization", owner.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].title).toBe("Sprint Task 1");
    });
  });

  describe("GET /api/tasks/:taskId (Get Task by ID)", () => {
    test("Team member can fetch task by ID with associations", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const project = await Project.create({
        teamId: team.id,
        name: "Task Details Project",
        createdBy: owner.user.id,
      });

      const task = await Task.create({
        projectId: project.id,
        title: "Detailed Task",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .get(`/api/tasks/${task.id}`)
        .set("Authorization", owner.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.id).toBe(task.id);
      expect(res.body.data.task.creator.id).toBe(owner.user.id);
    });

    test("Should return 404 for non-existent task", async () => {
      const owner = await createTestUser({ role: "ADMIN" });

      const res = await request(app)
        .get("/api/tasks/99999")
        .set("Authorization", owner.authHeader);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PATCH /api/tasks/:taskId (Update Task)", () => {
    test("Team OWNER can update task status and priority", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const project = await Project.create({
        teamId: team.id,
        name: "Task Update Project",
        createdBy: owner.user.id,
      });

      const task = await Task.create({
        projectId: project.id,
        title: "Original Task Title",
        status: "TODO",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .patch(`/api/tasks/${task.id}`)
        .set("Authorization", owner.authHeader)
        .send({
          status: "IN_PROGRESS",
          priority: "URGENT",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.status).toBe("IN_PROGRESS");
      expect(res.body.data.task.priority).toBe("URGENT");
    });
  });

  describe("DELETE /api/tasks/:taskId (Delete Task)", () => {
    test("Team OWNER can delete task", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const project = await Project.create({
        teamId: team.id,
        name: "Delete Task Project",
        createdBy: owner.user.id,
      });

      const task = await Task.create({
        projectId: project.id,
        title: "Task to Delete",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .delete(`/api/tasks/${task.id}`)
        .set("Authorization", owner.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const findRes = await Task.findByPk(task.id);
      expect(findRes).toBeNull();
    });

    test("Team MEMBER receives 403 when attempting to delete a task", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const member = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: member.user.id, role: "MEMBER" });

      const project = await Project.create({
        teamId: team.id,
        name: "Protected Task Project",
        createdBy: owner.user.id,
      });

      const task = await Task.create({
        projectId: project.id,
        title: "Task Member Cannot Delete",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .delete(`/api/tasks/${task.id}`)
        .set("Authorization", member.authHeader);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
