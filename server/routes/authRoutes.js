
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { deleteUserWebsites } = require("../tools/fileTools");

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 60) {
      return res.status(400).json({ message: "Name must be 2–60 characters" });
    }

    if (!validEmail(cleanEmail)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({
        message: "Password must be 8–128 characters",
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "Account created successfully",
      token: createToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already registered" });
    }

    console.error("Signup error:", error.message);
    return res.status(500).json({ message: "Could not create account" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Email and password required" });
    }

    if (!validEmail(email.trim()) || password.length > 128) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json({
      message: "Login successful",
      token: createToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Could not log in" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!mongoose.isValidObjectId(payload.userId)) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await User.findById(payload.userId).select("name email");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    return res.json({
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const result = await deleteUserWebsites(req.userId);

    return res.json({
      success: true,
      message: "Logged out and generated websites deleted",
      deletedWebsites: result.deleted,
    });
  } catch (error) {
    console.error("Logout cleanup error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not clean up generated websites",
    });
  }
});

module.exports = router;
