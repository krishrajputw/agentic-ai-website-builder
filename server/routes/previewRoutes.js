
const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();

const WORKSPACE = path.resolve(__dirname, "../workspace");
const { startPreview } = require("../src/previewRunner");

router.post("/start", async (req, res) => {
  try {
    const { websiteId } = req.body || {};

    if (!websiteId) {
      return res.status(400).json({
        success: false,
        message: "websiteId is required"
      });
    }

    const result = await startPreview(websiteId);
    res.json(result);
  } catch (error) {
    console.error("Preview start error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Preview failed"
    });
  }
});

router.get("/site/:websiteId/*path", (req, res) => {
  try {
    const { websiteId } = req.params;

    if (!/^[a-f0-9-]{36}$/i.test(websiteId)) {
      return res.status(400).send("Invalid website ID");
    }

    const dist = path.resolve(WORKSPACE, `website-${websiteId}`, "dist");
    const requestedPath = req.params.path?.join("/") || "index.html";
    const file = path.resolve(dist, requestedPath);

    if (file !== dist && !file.startsWith(dist + path.sep)) {
      return res.status(403).send("Forbidden");
    }

    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      return res.status(404).send("Preview file not found");
    }

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
