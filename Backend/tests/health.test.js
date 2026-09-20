import request from "supertest";
import app from "../src/app.js";

describe("Health API", () => {
  test("GET /api/health should return API health status", async () => {
    const response = await request(app)
      .get("/api/health");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "SyncSprint API is running",
    });
  });
});