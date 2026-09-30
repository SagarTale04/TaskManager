import http from "http";
import app from "../src/app.js";
import { initSocketServer, getIO, emitToProject, emitToTask, emitToUser } from "../src/socket.js";

describe("Socket.IO Real-time Events", () => {
  let server;

  beforeAll(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    await initSocketServer(server, ["*"]);
  });

  afterAll((done) => {
    const io = getIO();
    if (io) {
      io.close(() => {
        if (server && server.listening) {
          server.close(done);
        } else {
          done();
        }
      });
    } else if (server && server.listening) {
      server.close(done);
    } else {
      done();
    }
  });

  test("Socket server initializes and attaches to HTTP server", () => {
    const io = getIO();
    expect(io).toBeDefined();
    expect(typeof io.to).toBe("function");
  });

  test("emitToProject broadcasts without throwing errors", () => {
    expect(() => {
      emitToProject(1, "task:created", { id: 101, title: "Real-time task" });
    }).not.toThrow();
  });

  test("emitToTask broadcasts without throwing errors", () => {
    expect(() => {
      emitToTask(101, "comment:created", { id: 201, content: "Real-time comment" });
    }).not.toThrow();
  });

  test("emitToUser sends notification without throwing errors", () => {
    expect(() => {
      emitToUser(1, "notification:new", { message: "Task assigned" });
    }).not.toThrow();
  });
});
