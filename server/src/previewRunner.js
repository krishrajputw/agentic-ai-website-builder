
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const WORKSPACE = path.resolve(__dirname, "../workspace");

function createSignature(websiteId, expires) {
  const secret = process.env.PREVIEW_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error("PREVIEW_SECRET is missing");
  return crypto
    .createHmac("sha256", secret)
    .update(`${websiteId}:${expires}`)
    .digest("hex");
}

async function startPreview(websiteId, userId) {
  if (!websiteId || !userId) {
    throw new Error("Website ID and login are required");
  }

  const { listWebsites } = require("../tools/fileTools");
  const websites = await listWebsites(userId);
  const website = websites.find((item) => item.id === websiteId);

  if (!website) throw new Error("Website not found or access denied");

  const root = path.resolve(WORKSPACE, `website-${websiteId}`);
  const appFile = path.join(root, "src", "App.jsx");
  const stats = await fs.stat(appFile).catch(() => null);

  if (!stats?.isFile()) {
    throw new Error("src/App.jsx not found. Generate the website first.");
  }

  const srcDir = path.join(root, "src");
  await fs.mkdir(srcDir, { recursive: true });

  const mainPath = path.join(srcDir, "main.jsx");
  if (!(await fs.stat(mainPath).catch(() => null))) {
    await fs.writeFile(
      mainPath,
      'import React from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App.jsx";\nimport "./index.css";\ncreateRoot(document.getElementById("root")).render(<App />);'
    );
  }

  const cssPath = path.join(srcDir, "index.css");
  if (!(await fs.stat(cssPath).catch(() => null))) {
    await fs.writeFile(cssPath, "body{margin:0;font-family:Arial,sans-serif}");
  }

  const indexPath = path.join(root, "index.html");
  if (!(await fs.stat(indexPath).catch(() => null))) {
    await fs.writeFile(
      indexPath,
      '<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Preview</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>'
    );
  }

  // Vite is ESM in current versions, so use dynamic import.
  const { build } = await import("vite");

  const expires = Math.floor(Date.now() / 1000) + 3600;
  const token = `${expires}.${createSignature(websiteId, expires)}`;

  await build({
    configFile: false,
    root,
    base: `/api/preview/site/${websiteId}/${token}/`,
    esbuild: { jsx: "automatic" },
    build: { outDir: "dist", emptyOutDir: true }
  });

  const backend = (process.env.PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
  if (!backend) throw new Error("PUBLIC_BACKEND_URL is missing in Render");

  return {
    success: true,
    url: `${backend}/api/preview/site/${websiteId}/${token}/`
  };
}

module.exports = { startPreview, createSignature };
