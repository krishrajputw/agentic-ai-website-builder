
const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { startPreview } = require("../src/previewRunner");
const { createSignature } = require("../src/previewRunner");

const WORKSPACE = path.resolve(__dirname, "../workspace");

// Authenticated endpoint: generates and builds the preview.
router.post("/start", authMiddleware, async (req, res) => {
  try {
    const { websiteId } = req.body || {};
    const result = await startPreview(websiteId, req.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Preview failed"
    });
  }
});

// Signed, time-limited URL: the iframe doesn't need a bearer header.
router.get("/site/:websiteId/:token/*path", (req, res) => {
  try {
    const { websiteId, token } = req.params;
    const [expiryText, signature] = token.split(".");
    const expires = Number(expiryText);

    if (
      !Number.isFinite(expires) ||
      expires < Math.floor(Date.now() / 1000) ||
      !signature
    ) {
      return res.status(401).send("Preview link expired. Generate it again.");
    }

    const expected = createSignature(websiteId, expires);

    const suppliedBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    if (
      suppliedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
    ) {
      return res.status(403).send("Invalid preview link");
    }

    const root = path.resolve(
      WORKSPACE,
      `website-${websiteId}`,
      "dist"
    );

    const requestedPath = req.params.path?.join("/") || "index.html";
    const filePath = path.resolve(root, requestedPath);

    if (filePath !== root && !filePath.startsWith(root + path.sep)) {
      return res.status(403).send("Forbidden");
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return res.status(404).send("Preview file not found");
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error("Preview serving error:", error.message);
    res.status(500).send("Preview failed");
  }
});

module.exports = router;
