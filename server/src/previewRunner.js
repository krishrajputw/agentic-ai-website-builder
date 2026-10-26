const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { listWebsites } = require("../tools/fileTools");

const WORKSPACE = path.resolve(__dirname, "../workspace");

function createSignature(websiteId, expires) {
  const secret = process.env.PREVIEW_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error("Set PREVIEW_SECRET or JWT_SECRET in the backend environment");
  return crypto.createHmac("sha256", secret).update(`${websiteId}:${expires}`).digest("hex");
}

async function startPreview(websiteId, userId) {
  if (typeof websiteId !== "string" || !/^[a-f0-9-]{36}$/i.test(websiteId)) {
    throw new Error("Invalid website ID");
  }
  if (!userId) throw new Error("Authentication required");

  const websites = await listWebsites(userId);
  if (!websites.some((site) => site.id === websiteId)) {
    throw new Error("Website not found or access denied");
  }

  const root = path.resolve(WORKSPACE, `website-${websiteId}`);
  const appFile = path.join(root, "src", "App.jsx");
  const appStats = await fs.stat(appFile).catch(() => null);
  if (!appStats?.isFile()) throw new Error("src/App.jsx not found. Generate the website first.");

  const srcDir = path.join(root, "src");
  await fs.mkdir(srcDir, { recursive: true });

  const indexPath = path.join(root, "index.html");
  const mainPath = path.join(srcDir, "main.jsx");
  const cssPath = path.join(srcDir, "index.css");

  if (!(await fs.stat(indexPath).catch(() => null))) {
    await fs.writeFile(indexPath, '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Website Preview</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>', "utf8");
  }
  if (!(await fs.stat(mainPath).catch(() => null))) {
    await fs.writeFile(mainPath, 'import React from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App.jsx";\nimport "./index.css";\ncreateRoot(document.getElementById("root")).render(<App />);', "utf8");
  }
  if (!(await fs.stat(cssPath).catch(() => null))) {
    await fs.writeFile(cssPath, '*,*::before,*::after{box-sizing:border-box}html,body,#root{margin:0;min-height:100%;}body{font-family:Arial,sans-serif}', "utf8");
  }

  const expires = Math.floor(Date.now() / 1000) + 60 * 60;
  const token = `${expires}.${createSignature(websiteId, expires)}`;
  const base = `/api/preview/site/${websiteId}/${token}/`;
  const { build } = require("vite");
  const reactModule = await import("@vitejs/plugin-react");

  await build({
    configFile: false,
    root,
    base,
    plugins: [reactModule.default()],
    build: { outDir: "dist", emptyOutDir: true },
  });

  const backendUrl = process.env.PUBLIC_BACKEND_URL;
  if (!backendUrl) throw new Error("Set PUBLIC_BACKEND_URL in Render environment variables");
  return { success: true, url: `${backendUrl.replace(/\/+$/, "")}${base}`, expiresAt: expires };
}

module.exports = { startPreview, createSignature };
