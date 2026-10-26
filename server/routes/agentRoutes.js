
const express = require("express");
const rateLimit = require("express-rate-limit");
const authMiddleware = require("../middleware/authMiddleware");
const { generateWebsite } = require("../controllers/agentController");

const {
  createWebsite,
  listWebsites,
  listFiles,
  readFile,
  createOrUpdateFile,
} = require("../tools/fileTools");

const router = express.Router();

const generateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit:  10,
  standardHeaders: true,
  legacyHeaders: false,

  // Auth middleware sets req.userId from the verified JWT
  keyGenerator: (req) => `user:${req.userId}`,

  message: {
    success: false,
    message: "Daily limit reached. Try again later.",
  },
});

// All agent endpoints require a valid login.
router.use(authMiddleware);

router.get("/websites", async (req, res) => {
  try {
    res.json({
      success: true,
      websites: await listWebsites(req.userId),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/websites", async (req, res) => {
  try {
    const website = await createWebsite(req.body?.name, req.userId);
    res.status(201).json({ success: true, website });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/generate", generateLimiter, generateWebsite);

router.get("/files", async (req, res) => {
  try {
    res.json(
      await listFiles(
        req.query.websiteId,
        req.query.directory || ".",
        req.userId
      )
    );
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get("/file", async (req, res) => {
  try {
    res.json(await readFile(req.query.websiteId, req.query.path, req.userId));
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put("/file", async (req, res) => {
  try {
    const { websiteId, path: filePath, content } = req.body;

    const result = await createOrUpdateFile(
      websiteId,
      filePath,
      content,
      req.userId
    );

    res.json({
      success: true,
      message: "File saved successfully",
      path: result.path,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
