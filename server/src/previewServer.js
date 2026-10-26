
const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const { spawn } = require("child_process");

const app = express();
const PORT = 5001;
const WORKSPACE = path.resolve(__dirname, "workspace");
const processes = new Map();

app.use(express.json());

app.post("/start", async (req, res) => {
  const { websiteId } = req.body || {};

  if (
    typeof websiteId !== "string" ||
    !/^[a-f0-9-]{36}$/i.test(websiteId)
  ) {
    return res.status(400).json({ message: "Invalid website ID" });
  }

  const projectDir = path.join(WORKSPACE, `website-${websiteId}`);

  try {
    await fs.access(path.join(projectDir, "package.json"));
  } catch {
    return res.status(400).json({
      message:
        "Generated project needs package.json before it can run. Preview server setup is incomplete.",
    });
  }

  if (processes.has(websiteId)) {
    return res.json({
      success: true,
      message: "Preview process already started",
    });
  }

  const child = spawn(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "dev", "--", "--host", "127.0.0.1"],
    {
      cwd: projectDir,
      shell: process.platform === "win32",
      windowsHide: true,
      stdio: "ignore",
    }
  );

  processes.set(websiteId, child);

  child.on("error", () => processes.delete(websiteId));
  child.on("exit", () => processes.delete(websiteId));

  return res.status(202).json({
    success: true,
    message: "Preview process starting",
  });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Preview manager listening on http://127.0.0.1:${PORT}`);
});
