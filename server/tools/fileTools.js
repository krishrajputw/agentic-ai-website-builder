
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const WORKSPACE = path.resolve(__dirname, "../workspace");
const REGISTRY = path.join(WORKSPACE, "websites.json");

async function readRegistry() {
  await fs.mkdir(WORKSPACE, { recursive: true });

  try {
    return JSON.parse(await fs.readFile(REGISTRY, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await fs.writeFile(REGISTRY, "[]", "utf8");
    return [];
  }
}

async function writeRegistry(websites) {
  await fs.writeFile(REGISTRY, JSON.stringify(websites, null, 2), "utf8");
}

function validateId(id) {
  if (typeof id !== "string" || !/^[a-f0-9-]{36}$/i.test(id)) {
    throw new Error("Invalid website ID");
  }
}

function websiteRoot(id) {
  validateId(id);
  return path.join(WORKSPACE, `website-${id}`);
}

function resolveSafePath(id, filePath = ".") {
  const root = websiteRoot(id);

  if (typeof filePath !== "string" || !filePath.trim()) {
    throw new Error("Valid file path is required");
  }

  const target = path.resolve(root, filePath);
  const relative = path.relative(root, target);

  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error("Access outside website folder is forbidden");
  }

  return target;
}

async function createWebsite(name = "Untitled Website", userId) {
  if (!userId) throw new Error("User ID is required");

  const websites = await readRegistry();
  const id = crypto.randomUUID();
  const safeName = String(name).trim().slice(0, 80) || "Untitled Website";

  await fs.mkdir(websiteRoot(id), { recursive: true });

  const website = {
    id,
    name: safeName,
    userId: String(userId),
    createdAt: new Date().toISOString(),
  };

  websites.push(website);
  await writeRegistry(websites);

  return website;
}

async function listWebsites(userId) {
  if (!userId) throw new Error("User ID is required");

  const websites = await readRegistry();
  return websites.filter((site) => site.userId === String(userId));
}

async function requireWebsite(id, userId) {
  const websites = await readRegistry();

  const website = websites.find(
    (site) => site.id === id && site.userId === String(userId)
  );

  if (!website) throw new Error("Website not found or access denied");

  return websiteRoot(id);
}

async function createOrUpdateFile(id, filePath, content, userId) {
  if (typeof content !== "string") throw new Error("File content must be a string");
  if (content.length > 500_000) throw new Error("File content exceeds 500 KB limit");

  await requireWebsite(id, userId);

  const target = resolveSafePath(id, filePath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content, "utf8");

  return { success: true, path: filePath };
}

async function readFile(id, filePath, userId) {
  await requireWebsite(id, userId);

  const target = resolveSafePath(id, filePath);
  const stats = await fs.stat(target);

  if (!stats.isFile()) throw new Error("Selected path is not a file");

  return {
    success: true,
    path: filePath,
    content: await fs.readFile(target, "utf8"),
  };
}

async function listFiles(id, directory = ".", userId) {
  await requireWebsite(id, userId);

  const target = resolveSafePath(id, directory);
  const stats = await fs.stat(target);

  if (!stats.isDirectory()) throw new Error("Selected path is not a directory");

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const results = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path
        .relative(websiteRoot(id), fullPath)
        .replace(/\\/g, "/");

      if (entry.isDirectory()) {
        results.push({ name: entry.name, path: relativePath, type: "directory" });
        results.push(...await walk(fullPath));
      } else if (entry.isFile()) {
        results.push({ name: entry.name, path: relativePath, type: "file" });
      }
    }

    return results;
  }

  return { success: true, files: await walk(target) };
}

async function deleteUserWebsites(userId) {
  if (!userId) throw new Error("User ID is required");

  const websites = await readRegistry();
  const owned = websites.filter((site) => site.userId === String(userId));

  for (const site of owned) {
    await fs.rm(websiteRoot(site.id), { recursive: true, force: true });
  }

  const remaining = websites.filter((site) => site.userId !== String(userId));
  await writeRegistry(remaining);

  return { deleted: owned.length };
}

module.exports = {
  createWebsite,
  listWebsites,
  createOrUpdateFile,
  readFile,
  listFiles,
  deleteUserWebsites,
};
