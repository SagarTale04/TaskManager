import request from "supertest";
import bcrypt from "bcrypt";

import app from "../src/app.js";
import { User } from "../src/models/index.js";
import { closeDb } from "./helpers.js";

describe("Auth API", () => {
  beforeAll(async () => {
    await User.destroy({
      where: {
        email: "test@syncsprint.com",
      },
    });

    const passwordHash = await bcrypt.hash(
      "Password123!",
      10
    );

    await User.create({
      name: "Test User",
      email: "test@syncsprint.com",
      passwordHash,
      role: "DEVELOPER",
    });
  });

  test("POST /api/auth/login should login a valid user", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@syncsprint.com",
        password: "Password123!",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("POST /api/auth/login should reject login with wrong password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@syncsprint.com",
        password: "WrongPassword123!",
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("DEVELOPER should not be allowed to create a team", async () => {
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@syncsprint.com",
        password: "Password123!",
      });

    const token =
      loginResponse.body.data?.token ??
      loginResponse.body.token;

    expect(token).toBeDefined();

    const response = await request(app)
      .post("/api/teams")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Unauthorized Test Team",
        description: "This team should not be created",
      });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  afterAll(async () => {
    await User.destroy({
      where: {
        email: "test@syncsprint.com",
      },
    });
    await closeDb();
  });
});