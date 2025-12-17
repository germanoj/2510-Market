import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "#db/client";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
const SALT_ROUNDS = 10;

router.post("/register", async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {};
    if (!username || !password) return res.sendStatus(400);

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await db.query(
      `INSERT INTO users (username, password)
       VALUES ($1, $2)
       RETURNING id, username`,
      [username, hashedPassword]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { encoding: "base64" }
    );
    res.status(201).send(token);
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {};
    if (!username || !password) return res.sendStatus(400);

    const result = await db.query(
      `SELECT id, username, password FROM users WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];
    if (!user) return res.sendStatus(401);

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.sendStatus(401);

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET
    );
    res.status(200).send(token);
  } catch (err) {
    next(err);
  }
});

export default router;
