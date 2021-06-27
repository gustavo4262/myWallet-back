import express from "express";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcrypt";
import { userSignInSchema, userSignUpSchema } from "./schemas.js";
import { v4 } from "uuid";

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

    res.status(200).send(token);
  } catch (err) {
    if (err.message === "Unauthorized") return res.sendStatus(401);
    console.log(err.message);
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

app.listen(4000, () => {
  console.log("Listening on port 4000");
});

console.log(v4());
