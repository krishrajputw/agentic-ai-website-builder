
const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { startPreview, createSignature } = require("../src/previewRunner");

const WORKSPACE = path.resolve(__dirname, "../workspace");

router.post("/start", authMiddleware, async (req, res) => {
  try {
    const { websiteId } = req.body || {};
    const result = await startPreview(websiteId, req.userId);
    res.json(result);
  } catch (error) {
    console.error("Preview start error:", error.message);
    res.status(400).json({
      success: false,
      message: error.message || "Preview failed"
    });
  }
});

router.get("/site/:websiteId/:token/*path", (req, res) => {
  try {
    const { websiteId, token } = req.params;
    const [expiryText, signature] = token.split(".");
    const expires = Number(expiryText);

    if (
      !Number.isSafeInteger(expires) ||
      expires < Math.floor(Date.now() / 1000) ||
      !signature
    ) {
      return res.status(401).send("Preview expired. Start preview again.");
    }

    const expected = createSignature(websiteId, expires);
    const actualBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return res.status(403).send("Invalid preview link");
    }

    const dist = path.resolve(WORKSPACE, `website-${websiteId}`, "dist");
    const requested = req.params.path?.join("/") || "index.html";
    const file = path.resolve(dist, requested);

    if (file !== dist && !file.startsWith(dist + path.sep)) {
      return res.status(403).send("Forbidden");
    }

    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      return res.status(404).send("Preview file not found");
    }

    // Allow the deployed Vercel frontend to display this preview in an iframe.
    res.removeHeader("X-Frame-Options");
    res.setHeader(
      "Content-Security-Policy",
      "frame-ancestors https://agentic-ai-website-builder-teal.vercel.app https://agentic-ai-website-builder-6bm7kjjia-krishrajputws-projects.vercel.app"
    );

    res.sendFile(file);
  } catch (error) {
    console.error("Preview serving error:", error.message);
    res.status(500).send("Preview failed");
  }
});

module.exports = router;
