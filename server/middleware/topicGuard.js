
const WEBSITE_KEYWORDS = [
  "website", "web app", "web application", "webpage",
  "landing page", "portfolio", "ecommerce", "e-commerce",
  "navbar", "navigation bar", "footer", "header",
  "frontend", "front-end", "backend", "back-end",
  "react", "vite", "html", "css", "javascript",
  "typescript", "tailwind", "component", "responsive",
  "ui", "ux", "design", "layout", "button", "form",
  "login page", "signup page", "sign up page",
  "dashboard", "product page", "cart page",
  "website builder", "web design", "web development",
  "code", "coding", "debug", "bug", "error",
  "fix", "edit", "modify", "change", "update",
  "generate", "build", "create", "implement",
  "preview", "save project", "export", "api",
];

const WARNING =
  "⚠️ I can only help with AI Website Builder tasks, website creation, website code, design, debugging, and project-related questions. Please ask something related to your website.";

function topicGuard(req, res, next) {
  const prompt = String(
    req.body?.prompt ??
    req.body?.message ??
    req.body?.description ??
    ""
  ).trim().toLowerCase();

  if (!prompt) {
    return res.status(400).json({
      success: false,
      message: "Please enter a website-related request.",
    });
  }

  const isWebsiteRelated = WEBSITE_KEYWORDS.some(keyword =>
    prompt.includes(keyword)
  );

  if (!isWebsiteRelated) {
    return res.status(400).json({
      success: false,
      blocked: true,
      message: WARNING,
    });
  }

  next();
}

module.exports = topicGuard;
