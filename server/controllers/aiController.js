
const { generateText } = require("../services/geminiService");

async function testGemini(req, res) {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    const result = await generateText(prompt);

    return res.json({ success: true, result });
  } catch (error) {
    console.error("Gemini API error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
      status: error.status || null,
      code: error.code || null,
    });
  }
}

module.exports = { testGemini };
