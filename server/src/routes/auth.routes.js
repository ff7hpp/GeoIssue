import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/auth.js";
import { query } from "../db/pool.js";

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next({ status: 400, message: "Name, email, and password are required" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role`,
      [name.trim(), email.trim().toLowerCase(), passwordHash],
    );

    const user = rows[0];
    res.status(201).json({ user: publicUser(user), token: signToken(user) });
  } catch (err) {
    if (err.code === "23505") {
      return next({ status: 409, message: "Email is already registered" });
    }

    return next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next({ status: 400, message: "Email and password are required" });
    }

    const { rows } = await query("SELECT * FROM users WHERE email = $1", [
      email.trim().toLowerCase(),
    ]);
    const user = rows[0];
    const isValid = user ? await bcrypt.compare(password, user.password_hash) : false;

    if (!isValid) {
      return next({ status: 401, message: "Invalid email or password" });
    }

    res.json({ user: publicUser(user), token: signToken(user) });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query("SELECT id, name, email, role FROM users WHERE id = $1", [
      req.user.id,
    ]);

    if (!rows[0]) {
      return next({ status: 404, message: "User not found" });
    }

    res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    next(err);
  }
});

export default router;
