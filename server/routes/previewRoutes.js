
const express = require("express");
const router = express.Router();
const { startPreview } = require("../src/previewRunner");

router.post("/start", async (req, res) => {
  try {
    const { websiteId } = req.body || {};
    if (!websiteId) {
      return res.status(400).json({
        success: false,
        message: "websiteId is required",
      });
    }

    const result = await startPreview(websiteId);
    res.json(result);
  } catch (error) {
    console.error("Preview start error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Preview failed to start",
    });
  }
});

module.exports = router;
