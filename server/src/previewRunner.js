
const fs = require("fs/promises");
const path = require("path");

const WORKSPACE = path.resolve(__dirname, "../workspace");
const runningPreviews = new Map();

async function startPreview(websiteId) {
  if (
    typeof websiteId !== "string" ||
    !/^[a-f0-9-]{36}$/i.test(websiteId)
  ) {
    throw new Error("Invalid website ID");
  }

  const existing = runningPreviews.get(websiteId);
  if (existing) {
    return { success: true, url: existing.url };
  }

  const root = path.join(WORKSPACE, `website-${websiteId}`);
  const relative = path.relative(WORKSPACE, root);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid website path");
  }

  const stats = await fs.stat(root).catch(() => null);
  if (!stats?.isDirectory()) {
    throw new Error("Website folder not found");
  }

  const srcDir = path.join(root, "src");
  await fs.mkdir(srcDir, { recursive: true });

  const appFile = path.join(srcDir, "App.jsx");
  if (!(await fs.stat(appFile).catch(() => null))) {
    throw new Error("src/App.jsx not found. Generate the website first.");
  }

  const mainPath = path.join(srcDir, "main.jsx");
  if (!(await fs.stat(mainPath).catch(() => null))) {
    await fs.writeFile(
      mainPath,
      `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      "utf8"
    );
  }

  const cssPath = path.join(srcDir, "index.css");
  if (!(await fs.stat(cssPath).catch(() => null))) {
    await fs.writeFile(
      cssPath,
      `* { box-sizing: border-box; }
html, body, #root { margin: 0; min-height: 100%; }
body { font-family: Arial, sans-serif; }
`,
      "utf8"
    );
  }

  const indexPath = path.join(root, "index.html");
  if (!(await fs.stat(indexPath).catch(() => null))) {
    await fs.writeFile(
      indexPath,
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Website Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
      "utf8"
    );
  }

  const { createServer } = await import("vite");
  const reactPluginModule = await import("@vitejs/plugin-react");
  const reactPlugin = reactPluginModule.default;

  const viteServer = await createServer({
    configFile: false,
    root,
    plugins: [reactPlugin()],
    server: {
      host: "127.0.0.1",
      port: 0,
      strictPort: false,
      open: false,
    },
    appType: "spa",
  });

  try {
    await viteServer.listen();

    const address = viteServer.httpServer.address();
    if (!address || typeof address === "string") {
      throw new Error("Could not get preview server address");
    }

    const preview = {
      server: viteServer,
      url: `http://127.0.0.1:${address.port}`,
    };

    runningPreviews.set(websiteId, preview);
    return { success: true, url: preview.url };
  } catch (error) {
    await viteServer.close();
    throw error;
  }
}

async function stopPreview(websiteId) {
  const preview = runningPreviews.get(websiteId);
  if (!preview) return { success: true };

  await preview.server.close();
  runningPreviews.delete(websiteId);
  return { success: true };
}

module.exports = { startPreview, stopPreview };
