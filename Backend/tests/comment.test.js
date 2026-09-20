import request from "supertest";
import app from "../src/app.js";
import {
  createTestUser,
  createTestTeam,
  addTeamMember,
  truncateTables,
  closeDb,
} from "./helpers.js";
import { Project, Task, Comment } from "../src/models/index.js";

describe("Comment API", () => {
  beforeEach(async () => {
    await truncateTables();
  });

  afterAll(async () => {
    await closeDb();
  });

  describe("POST /api/tasks/:taskId/comments (Create Comment)", () => {
    test("Team member can add a comment to a task", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const member = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: member.user.id, role: "MEMBER" });

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
        .set("Authorization", member.authHeader)
        .send({
          content: "This is a test comment",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment.content).toBe("This is a test comment");
      expect(res.body.data.comment.author.id).toBe(member.user.id);
    });

    test("Non-team member receives 403 when attempting to comment", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const outsider = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });

      const project = await Project.create({
        teamId: team.id,
        name: "Restricted Comment Project",
        createdBy: owner.user.id,
      });

      const task = await Task.create({
        projectId: project.id,
        title: "Restricted Task",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .post(`/api/tasks/${task.id}/comments`)
        .set("Authorization", outsider.authHeader)
        .send({
          content: "Outsider comment attempt",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test("Should return 400 when comment content is empty", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const project = await Project.create({
        teamId: team.id,
        name: "Empty Comment Project",
        createdBy: owner.user.id,
      });

      const task = await Task.create({
        projectId: project.id,
        title: "Task",
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
    });

    test("Should return 400 when commenting on a task in an ARCHIVED project", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const project = await Project.create({
        teamId: team.id,
        name: "Archived Project",
        status: "ARCHIVED",
        createdBy: owner.user.id,
      });

      const task = await Task.create({
        projectId: project.id,
        title: "Archived Task",
        createdBy: owner.user.id,
      });

      const res = await request(app)
        .post(`/api/tasks/${task.id}/comments`)
        .set("Authorization", owner.authHeader)
        .send({
          content: "Comment on archived task",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/tasks/:taskId/comments (List Task Comments)", () => {
    test("Team member can list comments for a task", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const project = await Project.create({
        teamId: team.id,
        name: "List Comments Project",
        createdBy: owner.user.id,
      });

      const task = await Task.create({
        projectId: project.id,
        title: "Task with Multiple Comments",
        createdBy: owner.user.id,
      });

      await Comment.create({
        taskId: task.id,
        userId: owner.user.id,
        content: "First Comment",
      });

      const res = await request(app)
        .get(`/api/tasks/${task.id}/comments`)
        .set("Authorization", owner.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comments.length).toBe(1);
      expect(res.body.data.comments[0].content).toBe("First Comment");
    });
  });

  describe("PATCH /api/comments/:commentId (Update Comment)", () => {
    test("Author can update their own comment", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const member = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: member.user.id, role: "MEMBER" });

      const project = await Project.create({
        teamId: team.id,
        name: "Update Comment Project",
        createdBy: owner.user.id,
      });

      const task = await Task.create({
        projectId: project.id,
        title: "Task for Comment Update",
        createdBy: owner.user.id,
      });

      const comment = await Comment.create({
        taskId: task.id,
        userId: member.user.id,
        content: "Original Content",
      });

      const res = await request(app)
        .patch(`/api/comments/${comment.id}`)
        .set("Authorization", member.authHeader)
        .send({
          content: "Updated Content",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comment.content).toBe("Updated Content");
    });

    test("Non-author receives 403 when updating another user's comment", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const author = await createTestUser({ role: "DEVELOPER" });
      const otherUser = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: author.user.id, role: "MEMBER" });
      await addTeamMember({ teamId: team.id, userId: otherUser.user.id, role: "MEMBER" });

      const project = await Project.create({
        teamId: team.id,
        name: "Protected Comment Project",
        createdBy: owner.user.id,
      });

      const task = await Task.create({
        projectId: project.id,
        title: "Task",
        createdBy: owner.user.id,
      });

      const comment = await Comment.create({
        taskId: task.id,
        userId: author.user.id,
        content: "Author's Content",
      });

      const res = await request(app)
        .patch(`/api/comments/${comment.id}`)
        .set("Authorization", otherUser.authHeader)
        .send({
          content: "Malicious Edit Attempt",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/only edit your own comments/i);
    });
  });

  describe("DELETE /api/comments/:commentId (Delete Comment)", () => {
    test("Author can delete their own comment", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const member = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: member.user.id, role: "MEMBER" });

      const project = await Project.create({
        teamId: team.id,
        name: "Delete Comment Project",
        createdBy: owner.user.id,
      });

      const task = await Task.create({
        projectId: project.id,
        title: "Task",
        createdBy: owner.user.id,
      });

      const comment = await Comment.create({
        taskId: task.id,
        userId: member.user.id,
        content: "Content to Delete",
      });

      const res = await request(app)
        .delete(`/api/comments/${comment.id}`)
        .set("Authorization", member.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await Comment.findByPk(comment.id);
      expect(check).toBeNull();
    });

    test("Team ADMIN can delete another user's comment (moderation)", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const adminMember = await createTestUser({ role: "DEVELOPER" });
      const member = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: adminMember.user.id, role: "ADMIN" });
      await addTeamMember({ teamId: team.id, userId: member.user.id, role: "MEMBER" });

      const project = await Project.create({
        teamId: team.id,
        name: "Moderation Project",
        createdBy: owner.user.id,
      });

      const task = await Task.create({
        projectId: project.id,
        title: "Task",
        createdBy: owner.user.id,
      });

      const comment = await Comment.create({
        taskId: task.id,
        userId: member.user.id,
        content: "Member Comment to be moderated",
      });

      const res = await request(app)
        .delete(`/api/comments/${comment.id}`)
        .set("Authorization", adminMember.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test("Another MEMBER cannot delete someone else's comment", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const author = await createTestUser({ role: "DEVELOPER" });
      const bystander = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: author.user.id, role: "MEMBER" });
      await addTeamMember({ teamId: team.id, userId: bystander.user.id, role: "MEMBER" });

      const project = await Project.create({
        teamId: team.id,
        name: "No Permission Delete Project",
        createdBy: owner.user.id,
      });

      const task = await Task.create({
        projectId: project.id,
        title: "Task",
        createdBy: owner.user.id,
      });

      const comment = await Comment.create({
        taskId: task.id,
        userId: author.user.id,
        content: "Author's Comment",
      });

      const res = await request(app)
        .delete(`/api/comments/${comment.id}`)
        .set("Authorization", bystander.authHeader);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
