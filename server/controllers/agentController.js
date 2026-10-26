
const { runAgent } = require("../services/agentService");

async function generateWebsite(req, res) {
  try {
    const { prompt, websiteId } = req.body || {};

    // Validate request
    if (typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid prompt.",
      });
    }

    if (prompt.length > 4000) {
      return res.status(400).json({
        success: false,
        message: "Prompt must be 4000 characters or fewer.",
      });
    }

    if (typeof websiteId !== "string" || !websiteId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please select a website first.",
      });
    }

    const result = await runAgent(
      prompt.trim(),
      websiteId,
      req.userId
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Agent error:", error);

    const message = String(error.message || "").toLowerCase();

    // Website access / missing website
    if (/access denied|not found/.test(message)) {
      return res.status(404).json({
        success: false,
        message: "Website not found or access denied.",
      });
    }

    // Gemini quota or rate limit
    if (
      error.status === 429 ||
      /resource_exhausted|quota exceeded|rate limit/.test(message)
    ) {
      return res.status(429).json({
        success: false,
        message: "AI usage limit reached. Please try again later.",
      });
    }

    // Gemini unavailable / overloaded
    if (
      error.status === 503 ||
      /service unavailable|overloaded|high demand/.test(message)
    ) {
      return res.status(503).json({
        success: false,
        message: "AI service is busy. Please try again shortly.",
      });
    }

    // Gemini upstream error
    if (
      (error.status >= 500 && error.status <= 599) ||
      /api key|permission denied|unauthorized|invalid api key/.test(message)
    ) {
      return res.status(502).json({
        success: false,
        message: "AI service failed. Please try again later.",
      });
    }

    // Unexpected errors: don't expose internal details
    return res.status(500).json({
      success: false,
      message: "Website generation failed. Please try again.",
    });
  }
}

module.exports = { generateWebsite };
