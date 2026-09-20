import request from "supertest";
import app from "../src/app.js";
import {
  createTestUser,
  createTestTeam,
  addTeamMember,
  truncateTables,
  closeDb,
} from "./helpers.js";

describe("Team API & Member RBAC", () => {
  beforeEach(async () => {
    await truncateTables();
  });

  afterAll(async () => {
    await closeDb();
  });

  describe("POST /api/teams (Create Team)", () => {
    test("ADMIN should be allowed to create a team", async () => {
      const admin = await createTestUser({ role: "ADMIN" });

      const res = await request(app)
        .post("/api/teams")
        .set("Authorization", admin.authHeader)
        .send({
          name: "Engineering Team",
          description: "Core engineering team",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.team.name).toBe("Engineering Team");
    });

    test("SUPER_ADMIN should be allowed to create a team", async () => {
      const superAdmin = await createTestUser({ role: "SUPER_ADMIN" });

      const res = await request(app)
        .post("/api/teams")
        .set("Authorization", superAdmin.authHeader)
        .send({
          name: "DevOps Team",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test("DEVELOPER should receive 403 when attempting to create a team", async () => {
      const dev = await createTestUser({ role: "DEVELOPER" });

      const res = await request(app)
        .post("/api/teams")
        .set("Authorization", dev.authHeader)
        .send({
          name: "Unauthorized Team",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test("Should return 400 when team name is missing", async () => {
      const admin = await createTestUser({ role: "ADMIN" });

      const res = await request(app)
        .post("/api/teams")
        .set("Authorization", admin.authHeader)
        .send({
          description: "No name team",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/teams (List My Teams)", () => {
    test("Should return only teams the logged-in user belongs to", async () => {
      const user1 = await createTestUser({ role: "ADMIN" });
      const user2 = await createTestUser({ role: "ADMIN" });

      const team1 = await createTestTeam({ name: "User1 Team", creator: user1.user });
      await createTestTeam({ name: "User2 Team", creator: user2.user });

      const res = await request(app)
        .get("/api/teams")
        .set("Authorization", user1.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.teams.length).toBe(1);
      expect(res.body.data.teams[0].id).toBe(team1.id);
    });
  });

  describe("POST /api/teams/:teamId/members (Add Team Member)", () => {
    test("Team OWNER should be allowed to add a member", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const newMember = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });

      const res = await request(app)
        .post(`/api/teams/${team.id}/members`)
        .set("Authorization", owner.authHeader)
        .send({
          userId: newMember.user.id,
          role: "MEMBER",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.member.userId).toBe(newMember.user.id);
    });

    test("Team MEMBER should receive 403 when attempting to add a member", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const member = await createTestUser({ role: "DEVELOPER" });
      const outsider = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: member.user.id, role: "MEMBER" });

      const res = await request(app)
        .post(`/api/teams/${team.id}/members`)
        .set("Authorization", member.authHeader)
        .send({
          userId: outsider.user.id,
          role: "MEMBER",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test("Should return 404 when adding a non-existent user", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const res = await request(app)
        .post(`/api/teams/${team.id}/members`)
        .set("Authorization", owner.authHeader)
        .send({
          userId: 99999,
          role: "MEMBER",
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test("Should return 409 when user is already a member", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const member = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: member.user.id, role: "MEMBER" });

      const res = await request(app)
        .post(`/api/teams/${team.id}/members`)
        .set("Authorization", owner.authHeader)
        .send({
          userId: member.user.id,
          role: "MEMBER",
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PATCH /api/teams/:teamId/members/:userId (Update Member Role)", () => {
    test("Team OWNER can update member role to ADMIN", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const member = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: member.user.id, role: "MEMBER" });

      const res = await request(app)
        .patch(`/api/teams/${team.id}/members/${member.user.id}`)
        .set("Authorization", owner.authHeader)
        .send({
          role: "ADMIN",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.member.role).toBe("ADMIN");
    });

    test("Team ADMIN cannot update member roles (only OWNER is allowed)", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const adminMember = await createTestUser({ role: "DEVELOPER" });
      const targetMember = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: adminMember.user.id, role: "ADMIN" });
      await addTeamMember({ teamId: team.id, userId: targetMember.user.id, role: "MEMBER" });

      const res = await request(app)
        .patch(`/api/teams/${team.id}/members/${targetMember.user.id}`)
        .set("Authorization", adminMember.authHeader)
        .send({
          role: "ADMIN",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test("Should receive 403 when trying to change the OWNER's role", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const res = await request(app)
        .patch(`/api/teams/${team.id}/members/${owner.user.id}`)
        .set("Authorization", owner.authHeader)
        .send({
          role: "MEMBER",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe("DELETE /api/teams/:teamId/members/:userId (Remove Member)", () => {
    test("Team OWNER can remove a team member", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const member = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: member.user.id, role: "MEMBER" });

      const res = await request(app)
        .delete(`/api/teams/${team.id}/members/${member.user.id}`)
        .set("Authorization", owner.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test("Cannot remove the team OWNER", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const adminMember = await createTestUser({ role: "DEVELOPER" });
      const team = await createTestTeam({ creator: owner.user });
      await addTeamMember({ teamId: team.id, userId: adminMember.user.id, role: "ADMIN" });

      const res = await request(app)
        .delete(`/api/teams/${team.id}/members/${owner.user.id}`)
        .set("Authorization", adminMember.authHeader);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test("Should return 404 when removing non-member", async () => {
      const owner = await createTestUser({ role: "ADMIN" });
      const team = await createTestTeam({ creator: owner.user });

      const res = await request(app)
        .delete(`/api/teams/${team.id}/members/99999`)
        .set("Authorization", owner.authHeader);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
