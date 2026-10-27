
const fs = require("fs/promises");
const path = require("path");

const WORKSPACE = path.resolve(__dirname, "../workspace");

async function startPreview(websiteId) {
  if (
    typeof websiteId !== "string" ||
    !/^[a-f0-9-]{36}$/i.test(websiteId)
  ) {
    throw new Error("Invalid website ID");
  }

  const root = path.resolve(WORKSPACE, `website-${websiteId}`);
  const relative = path.relative(WORKSPACE, root);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid website path");
  }

  const appFile = path.join(root, "src", "App.jsx");
  const appStats = await fs.stat(appFile).catch(() => null);

  if (!appStats?.isFile()) {
    throw new Error("src/App.jsx not found. Generate the website first.");
  }

  const srcDir = path.join(root, "src");
  await fs.mkdir(srcDir, { recursive: true });

  const indexPath = path.join(root, "index.html");
  const mainPath = path.join(srcDir, "main.jsx");
  const cssPath = path.join(srcDir, "index.css");

  if (!(await fs.stat(mainPath).catch(() => null))) {
    await fs.writeFile(
      mainPath,
      'import React from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App.jsx";\nimport "./index.css";\ncreateRoot(document.getElementById("root")).render(<App />);'
    );
  }

  if (!(await fs.stat(cssPath).catch(() => null))) {
    await fs.writeFile(cssPath, "body { margin: 0; font-family: Arial, sans-serif; }");
  }

  if (!(await fs.stat(indexPath).catch(() => null))) {
    await fs.writeFile(
      indexPath,
      '<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Website Preview</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>'
    );
  }

  const { build } = await import("vite");
  const reactPlugin = (await import("@vitejs/plugin-react")).default;

  await build({
    configFile: false,
    root,
    base: `/api/preview/site/${websiteId}/`,
    plugins: [reactPlugin()],
    esbuild: { jsx: "automatic" },
    build: {
      outDir: "dist",
      emptyOutDir: true
    }
  });

  const backendUrl = (process.env.PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");

  if (!backendUrl) {
    throw new Error("PUBLIC_BACKEND_URL is missing in Render environment variables");
  }

  return {
    success: true,
    url: `${backendUrl}/api/preview/site/${websiteId}/`
  };
}

module.exports = { startPreview };
