import express from "express";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcrypt";
import { v4 } from "uuid";
import {
  userSignInSchema,
  userSignUpSchema,
  revenueSchema,
} from "./schemas.js";

const { Pool } = pg;

const connection = new Pool({
  user: "postgres",
  password: "123456",
  host: "127.0.0.1",
  port: 5432,
  database: "myWallet",
});

const app = express();
app.use(express.json());
app.use(cors());

app.post("/sign-in", async (req, res) => {
  try {
    const { email, password } = req.body;

    await userSignInSchema.validateAsync({ email, password });

    const result = await connection.query(
      ` SELECT * FROM users
        WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (!user || (await bcrypt.compare(password, user.password))) {
      console.log(user, user.password, password);
      throw new Error("Unauthorized");
    }

    const token = v4();

    await connection.query(
      ` UPDATE users 
        SET token = $1 
        WHERE email = $2`,
      [token, email]
    );

    res
      .status(200)
      .send({ username: user.username, email: user.email, token: token });
  } catch (err) {
    if (err.message === "Unauthorized") return res.sendStatus(401);
    return res.sendStatus(400);
  }
});

app.post("/sign-up", async (req, res) => {
  try {
    const { username, password, email } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    await userSignUpSchema.validateAsync({
      username,
      password: passwordHash,
      email,
    });

    await connection.query(
      "INSERT INTO users (username, password, email) VALUES ($1, $2, $3)",
      [username, passwordHash, email]
    );

    res.sendStatus(201);
  } catch (err) {
    if (
      err.message ===
      'duplicate key value violates unique constraint "users_email_key"'
    )
      return res.sendStatus(409);

    return res.sendStatus(400);
  }
});

app.get("/registers", async (req, res) => {
  try {
    const authorization = req.headers["authorization"];
    const token = authorization?.replace("Bearer ", "");

    if (!token) throw new Error("Unauthorized");

    const registers = await connection.query(
      `SELECT r.*
       FROM registers AS r
       JOIN users AS u
       ON r."userId" = u.id
       WHERE token = $1`,
      [token]
    );

    if (!registers.rowCount) throw new Error("Unauthorized");

    const balancePrice = await connection.query(
      `SELECT r."userId", SUM(price) as price
      FROM registers AS r
      JOIN users AS u
      ON r."userId" = u.id
      WHERE token = $1
      GROUP BY "userId"`,
      [token]
    );

    res
      .status(200)
      .send({ registers: registers.rows, balancePrice: balancePrice.rows[0] });
  } catch (err) {
    if (err.message === "Unauthorized") return res.sendStatus(401);
    res.sendStatus(400);
  }
});

app.post("/add-revenue", async (req, res) => {
  try {
    const { value, description } = req.body;
    const authorization = req.headers["authorization"];
    const token = authorization?.replace("Bearer ", "");

    if (!token) throw new Error("Unauthorized");

    await revenueSchema.validateAsync({ value, description });

    const date = new Date().toLocaleDateString("pt-br").slice(0, 5);

    await connection.query(
      `INSERT INTO registers
       ("userId", date, name, price)
       VALUES
       ( (SELECT id FROM users WHERE token = $1),
        $2, $3, $4 )`,
      [token, date, description, value]
    );

    res.sendStatus(201);
  } catch (err) {
    if (err.message === "Unauthorized") res.sendStatus(401);
    if (
      err.message ===
      'null value in column "userId" violates not-null constraint'
    )
      res.sendStatus(404);
    console.log(err.message);
    res.sendStatus(400);
  }
});

app.listen(4000, () => {
  console.log("Listening on port 4000");
});

console.log(new Date().toLocaleDateString("pt-br").slice(0, 5));
