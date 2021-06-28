import app from "../src/app.js";
import supertest from "supertest";
import connection from "../src/database";

beforeEach(async () => {
  await connection.query("DELETE FROM users");
});

describe("POST /sign-up", () => {
  it("returns 201 for valid params", async () => {
    const body = {
      username: "John",
      email: "john@email.com",
      password: "goias",
    };
    const result = await supertest(app).post("/sign-up").send(body);
    expect(result.status).toEqual(201);
  });

  it("returns 409 for duplicated email", async () => {
    const body = {
      username: "marco",
      email: "marco@email.com",
      password: "figue",
    };
    const firstTry = await supertest(app).post("/sign-up").send(body);
    expect(firstTry.status).toEqual(201);

    const secondTry = await supertest(app).post("/sign-up").send(body);
    expect(secondTry.status).toEqual(409);
  });

  it("returns 400 for invalid params", async () => {
    const noUsername = {
      email: "luo@email.com",
      password: "usae",
    };
    const noUsernameQuery = await supertest(app)
      .post("/sign-up")
      .send(noUsername);
    expect(noUsernameQuery.status).toEqual(400);

    const noEmail = {
      username: "luo",
      password: "usae",
    };
    const noEmailQuery = await supertest(app).post("/sign-up").send(noEmail);
    expect(noEmailQuery.status).toEqual(400);

    const noPassword = {
      username: "luo",
      password: "usae",
    };
    const noPasswordQuery = await supertest(app)
      .post("/sign-up")
      .send(noPassword);
    expect(noPasswordQuery.status).toEqual(400);
  });
});

afterAll(() => {
  connection.end();
});
