
import { useCallback, useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import JSZip from "jszip";

const API = "http://localhost:5000/api/agent";
const PREVIEW_API = "http://localhost:5000/api/preview";

async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("token");

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

const EXAMPLES = [
  "Create a modern developer portfolio with projects and contact section",
  "Build an ecommerce homepage with product cards and a navbar",
  "Create a premium SaaS landing page with pricing cards",
];

function normalizePath(file) {
  const value =
    typeof file === "string" ? file : file?.path || file?.name || "";

  return value.replace(/\\/g, "/").replace(/^\/+/, "");
}

function getLanguage(path = "") {
  const extension = path.split(".").pop()?.toLowerCase();

  const languages = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    css: "css",
    html: "html",
    json: "json",
    md: "markdown",
  };

  return languages[extension] || "plaintext";
}

function getFileContent(data) {
  if (typeof data?.content === "string") return data.content;
  if (typeof data?.file?.content === "string") return data.file.content;
  return "";
}

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [websites, setWebsites] = useState([]);
  const [websiteId, setWebsiteId] = useState("");
  const [newWebsiteName, setNewWebsiteName] = useState("");

  const [files, setFiles] = useState([]);
  const [fileContents, setFileContents] = useState({});
  const [selectedFile, setSelectedFile] = useState("");
  const [fileContent, setFileContent] = useState("");

  const [previewUrl, setPreviewUrl] = useState("");
  const [previewVersion, setPreviewVersion] = useState(0);

  const [generating, setGenerating] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [creatingWebsite, setCreatingWebsite] = useState(false);
  const [startingPreview, setStartingPreview] = useState(false);

  const [activeTab, setActiveTab] = useState("preview");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatError, setChatError] = useState("");
  const [chatHistory, setChatHistory] = useState({});

  const selectedWebsite = websites.find((site) => site.id === websiteId);

  const loadWebsites = useCallback(async () => {
    try {
      setError("");

      const response = await fetchWithAuth(`${API}/websites`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load websites");
      }

      let available = data.websites || [];

      if (!available.length) {
        const createResponse = await fetchWithAuth(`${API}/websites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "My First Website" }),
        });

        const created = await createResponse.json();

        if (!createResponse.ok || !created.success) {
          throw new Error(created.message || "Could not create website");
        }

        available = [created.website];
      }

      setWebsites(available);

      setWebsiteId((current) =>
        available.some((site) => site.id === current)
          ? current
          : available[0]?.id || ""
      );
    } catch (err) {
      setError(err.message || "Could not connect to backend");
    }
  }, []);


const handleLogout = async () => {
  const confirmed = window.confirm(
    "Are you sure you want to logout? All your generated websites will be deleted permanently."
  );

  if (!confirmed) return;

  try {
    const token = localStorage.getItem("token");

    if (token) {
      const response = await fetch(
        "http://localhost:5000/api/auth/logout",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Logout failed. Please try again.");
      }
    }
  } catch (error) {
    alert(error.message || "Could not logout.");
    return;
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};



  const loadFiles = useCallback(
    async (preferredPath = "") => {
      if (!websiteId) return;

      const requestedId = websiteId;

      setLoadingFiles(true);
      setError("");

      try {
        const response = await fetchWithAuth(
          `${API}/files?websiteId=${encodeURIComponent(requestedId)}`
        );

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(data.message || "Could not load files");
        }

        const entries = (data.files || [])
          .filter((entry) => entry.type === "file")
          .map(normalizePath)
          .filter((path) =>
            /\.(jsx?|tsx?|css|html|json|md|svg)$/.test(path)
          )
          .sort();

        const pairs = await Promise.all(
          entries.map(async (path) => {
            try {
              const result = await fetchWithAuth(
                `${API}/file?websiteId=${encodeURIComponent(
                  requestedId
                )}&path=${encodeURIComponent(path)}`
              );

              const fileData = await result.json();

              if (!result.ok || fileData.success === false) {
                if (result.status === 401) {
                  throw new Error(
                    fileData.message || "Please log in again."
                  );
                }

                return [path, ""];
              }

              return [path, getFileContent(fileData)];
            } catch (err) {
              if (err.message?.toLowerCase().includes("log in again")) {
                throw err;
              }

              return [path, ""];
            }
          })
        );

        if (requestedId !== websiteId) return;

        const contentMap = Object.fromEntries(pairs);

        setFiles(entries);
        setFileContents(contentMap);

        const nextPath =
          (preferredPath && entries.includes(preferredPath)
            ? preferredPath
            : "") ||
          entries.find((path) =>
            /^src\/App\.(jsx|tsx|js|ts)$/.test(path)
          ) ||
          entries.find((path) =>
            /^src\/.*\.(jsx|tsx|js|ts)$/.test(path)
          ) ||
          entries[0] ||
          "";

        setSelectedFile(nextPath);
        setFileContent(nextPath ? contentMap[nextPath] || "" : "");

        if (!entries.length) {
          setMessage(
            "No source files yet. Generate a website to get started."
          );
        }
      } catch (err) {
        if (requestedId === websiteId) {
          setError(err.message || "Could not load files");
        }
      } finally {
        if (requestedId === websiteId) setLoadingFiles(false);
      }
    },
    [websiteId]
  );

  useEffect(() => {
    loadWebsites();
  }, [loadWebsites]);

  useEffect(() => {
    if (!websiteId) return;

    setFiles([]);
    setFileContents({});
    setSelectedFile("");
    setFileContent("");
    setPreviewUrl("");
    setPreviewVersion(0);
    setMessage("");
    setError("");
    setChatError("");
    setChatMessages(chatHistory[websiteId] || []);

    loadFiles();
  }, [websiteId, loadFiles]);

  const createWebsite = async () => {
    if (creatingWebsite) return;

    setCreatingWebsite(true);
    setError("");
    setMessage("");

    try {
      const response = await fetchWithAuth(`${API}/websites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newWebsiteName.trim() || `Website ${websites.length + 1}`,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not create website");
      }

      setWebsites((previous) => [...previous, data.website]);
      setNewWebsiteName("");
      setPrompt("");
      setMessage(`Created "${data.website.name}".`);
      setWebsiteId(data.website.id);
    } catch (err) {
      setError(err.message || "Could not create website");
    } finally {
      setCreatingWebsite(false);
    }
  };

  const openFile = useCallback(
    async (path) => {
      if (!path || !websiteId) return;

      setError("");
      setSelectedFile(path);

      if (typeof fileContents[path] === "string") {
        setFileContent(fileContents[path]);
        return;
      }

      const requestedId = websiteId;

      try {
        const response = await fetchWithAuth(
          `${API}/file?websiteId=${encodeURIComponent(
            requestedId
          )}&path=${encodeURIComponent(path)}`
        );

        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(data.message || `Could not read ${path}`);
        }

        if (requestedId !== websiteId) return;

        const content = getFileContent(data);

        setFileContent(content);
        setFileContents((previous) => ({
          ...previous,
          [path]: content,
        }));
      } catch (err) {
        setError(err.message || "Could not open file");
      }
    },
    [fileContents, websiteId]
  );

  
const generateWebsite = async (submittedPrompt = prompt) => {
  const request = submittedPrompt.trim();

  if (!request || generating || !websiteId) return;

  const targetWebsiteId = websiteId;

  const userMessage = {
    id: `${Date.now()}-user`,
    role: "user",
    content: request,
  };

  const previousMessages =
    chatHistory[targetWebsiteId] || chatMessages;

  const updatedMessages = [...previousMessages, userMessage];

  setChatMessages(updatedMessages);
  setChatHistory((previous) => ({
    ...previous,
    [targetWebsiteId]: updatedMessages,
  }));

  setPrompt("");
  setGenerating(true);
  setActiveTab("preview");
  setError("");
  setChatError("");
  setMessage("");

  try {
    const response = await fetchWithAuth(`${API}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: request,
        websiteId: targetWebsiteId,
      }),
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error("Server returned an invalid response. Please try again.");
    }

    if (!response.ok || data.success === false) {
      if (response.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }

      if (response.status === 429) {
        throw new Error(
          data.message || "AI usage limit reached. Please try again later."
        );
      }

      if (response.status === 503 || response.status === 502) {
        throw new Error(
          data.message || "AI service is temporarily unavailable. Try again shortly."
        );
      }

      if (response.status === 400) {
        throw new Error(data.message || "Please check your prompt and try again.");
      }

      if (response.status >= 500) {
        throw new Error("Server error. Please try again later.");
      }

      throw new Error(data.message || "Website generation failed.");
    }

    const assistantMessage = {
      id: `${Date.now()}-assistant`,
      role: "assistant",
      content:
        data.message ||
        "Website updated successfully. Check your preview.",
    };

    setChatMessages((previous) => {
      const next = [...previous, assistantMessage];

      setChatHistory((history) => ({
        ...history,
        [targetWebsiteId]: next,
      }));

      return next;
    });

    await loadFiles();

    setPreviewVersion((version) => version + 1);
    setActiveTab("preview");
    setMessage("Website updated successfully.");
  } catch (err) {
    setChatError(
      err.message || "Website generation failed. Please try again."
    );
  } finally {
    setGenerating(false);
  }
};


  const saveFile = async () => {
    if (!selectedFile || !websiteId || saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetchWithAuth(`${API}/file`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          path: selectedFile,
          content: fileContent,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Could not save file");
      }

      setFileContents((previous) => ({
        ...previous,
        [selectedFile]: fileContent,
      }));

      setMessage(
        `Saved ${selectedFile}. Restart or refresh preview if needed.`
      );
    } catch (err) {
      setError(err.message || "Could not save file");
    } finally {
      setSaving(false);
    }
  };

  const startPreview = async () => {
    if (!websiteId || startingPreview) return;

    setStartingPreview(true);
    setError("");
    setMessage("Starting local preview...");

    try {
      const response = await fetchWithAuth(`${PREVIEW_API}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not start preview");
      }

      if (!data.url || typeof data.url !== "string") {
        throw new Error(
          "Preview API did not return a URL. Check the backend preview route."
        );
      }

      setPreviewUrl(data.url);
      setPreviewVersion((version) => version + 1);
      setMessage("Preview started.");
    } catch (err) {
      setError(err.message || "Could not start preview");
      setMessage("");
    } finally {
      setStartingPreview(false);
    }
  };

  const downloadProject = async () => {
    if (!files.length || downloading) return;

    setDownloading(true);
    setError("");

    try {
      const zip = new JSZip();

      for (const path of files) {
        const content =
          path === selectedFile ? fileContent : fileContents[path];

        if (typeof content === "string") {
          zip.file(path, content);
        }
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${(selectedWebsite?.name || "website")
        .replace(/[^a-z0-9-_]/gi, "-")
        .toLowerCase()}.zip`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setMessage("Project ZIP downloaded.");
    } catch (err) {
      setError(err.message || "Could not export project");
    } finally {
      setDownloading(false);
    }
  };

  const clearChat = () => {
    if (!websiteId || generating) return;

    setChatMessages([]);

    setChatHistory((previous) => ({
      ...previous,
      [websiteId]: [],
    }));

    setChatError("");
  };

  return (
    <div className="min-h-screen bg-[#111110] text-[#e9e4dc]">
      <header className="flex min-h-[68px] flex-wrap items-center justify-between gap-3 border-b border-[#302d28] px-5 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c17b49] font-bold text-[#17130f]">
            W
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide">WORKSHOP</h1>
            <p className="text-xs text-[#8d877e]">AI Website Builder</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Select website"
            value={websiteId}
            onChange={(event) => setWebsiteId(event.target.value)}
            className="max-w-44 rounded-lg border border-[#484038] bg-[#191816] px-3 py-2 text-sm outline-none"
          >
            {websites.map((website) => (
              <option key={website.id} value={website.id}>
                {website.name}
              </option>
            ))}
          </select>

          <input
            value={newWebsiteName}
            onChange={(event) => setNewWebsiteName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") createWebsite();
            }}
            placeholder="Website name"
            className="w-32 rounded-lg border border-[#484038] bg-[#191816] px-3 py-2 text-sm outline-none"
          />

          <button
            onClick={createWebsite}
            disabled={creatingWebsite}
            className="rounded-lg border border-[#76563d] px-3 py-2 text-sm text-[#e6ad80] disabled:opacity-50"
          >
            {creatingWebsite ? "Creating..." : "+ New"}
          </button>

          <span className="hidden text-xs text-[#8d877e] sm:inline">
            {files.length} source files
          </span>

          
          <button
  onClick={handleLogout}
  className="rounded-lg border border-red-900 px-3 py-2 text-sm text-red-400"
>
  Logout
</button>



          <button
            onClick={downloadProject}
            disabled={!files.length || downloading}
            className="rounded-lg border border-[#484038] px-3 py-2 text-sm disabled:opacity-50"
          >
            {downloading ? "Exporting..." : "↓ Export ZIP"}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1800px] grid-cols-1 gap-4 p-4 lg:grid-cols-[350px_minmax(0,1fr)] lg:p-5">
        <aside className="flex min-w-0 flex-col gap-4">
          <section className="flex min-h-[480px] flex-col overflow-hidden rounded-xl border border-[#302d28] bg-[#191816]">
            <div className="flex items-center justify-between border-b border-[#302d28] px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">AI Assistant</h2>
                <p className="mt-1 text-xs text-[#827b71]">
                  {selectedWebsite?.name || "Your website"}
                </p>
              </div>

              <button
                onClick={clearChat}
                disabled={generating || !chatMessages.length}
                className="rounded-md border border-[#39352f] px-2 py-1 text-xs text-[#aaa195] disabled:opacity-40"
              >
                Clear chat
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-3">
              {chatMessages.length === 0 ? (
                <div className="py-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#38291f] text-lg text-[#e6ad80]">
                    ✦
                  </div>

                  <h3 className="mb-2 text-base font-semibold">
                    What are we building?
                  </h3>

                  <p className="mb-5 text-xs leading-5 text-[#999187]">
                    Describe your website. After generation, ask for changes
                    here without creating a new website.
                  </p>

                  <p className="mb-2 text-[10px] uppercase tracking-wider text-[#777168]">
                    Try an example
                  </p>

                  {EXAMPLES.map((example) => (
                    <button
                      key={example}
                      onClick={() => setPrompt(example)}
                      className="mb-2 block w-full rounded-lg border border-[#302d28] px-3 py-2 text-left text-xs leading-5 text-[#b7afa3] hover:border-[#76563d] hover:bg-[#211e1a]"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              ) : (
                chatMessages.map((item) => (
                  <div
                    key={item.id}
                    className={`flex ${
                      item.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[94%] rounded-xl px-3 py-2.5 text-xs leading-5 ${
                        item.role === "user"
                          ? "bg-[#38291f] text-[#f1d7c3]"
                          : "border border-[#302d28] bg-[#111110] text-[#d5cec3]"
                      }`}
                    >
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#c18b62]">
                        {item.role === "user" ? "You" : "Workshop AI"}
                      </p>

                      <p className="whitespace-pre-wrap break-words">
                        {item.content}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {generating && (
                <div className="flex justify-start">
                  <div className="rounded-xl border border-[#302d28] bg-[#111110] px-3 py-3 text-xs text-[#c5a487]">
                    <span className="mr-2 inline-block animate-pulse">●</span>
                    Thinking and updating your website...
                  </div>
                </div>
              )}

              {chatError && (
                <div className="rounded-lg border border-[#623b35] bg-[#2b1b18] p-3 text-xs leading-5 text-[#e4a49a]">
                  {chatError}
                  <button
                    onClick={() => setChatError("")}
                    className="ml-2 underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            <form
              className="border-t border-[#302d28] p-3"
              onSubmit={(event) => {
                event.preventDefault();
                generateWebsite();
              }}
            >
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    generateWebsite();
                  }
                }}
                placeholder={
                  chatMessages.length
                    ? "Ask for a change to your website..."
                    : "Describe the website you want..."
                }
                rows={3}
                maxLength={4000}
                disabled={generating || !websiteId}
                className="w-full resize-y rounded-lg border border-[#39352f] bg-[#111110] p-3 text-sm leading-6 outline-none focus:border-[#76563d] disabled:opacity-50"
              />

              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-[#777168]">
                  Enter to send · Shift+Enter for new line
                </span>

                <button
                  type="submit"
                  disabled={!prompt.trim() || generating || !websiteId}
                  className="rounded-lg bg-[#c17b49] px-4 py-2 text-xs font-semibold text-[#17130f] disabled:opacity-40"
                >
                  {generating ? "Working..." : "Send ↑"}
                </button>
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-xl border border-[#302d28] bg-[#191816]">
            <div className="flex items-center justify-between border-b border-[#302d28] px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">Project files</h2>
                <p className="mt-1 text-xs text-[#827b71]">
                  {files.length} files
                </p>
              </div>

              <button
                onClick={() => loadFiles(selectedFile)}
                disabled={loadingFiles || !websiteId}
                className="rounded-md px-2 py-1 text-sm disabled:opacity-50"
              >
                {loadingFiles ? "…" : "↻ Refresh"}
              </button>
            </div>

            <div className="max-h-[360px] overflow-auto p-2">
              {loadingFiles && files.length === 0 ? (
                <p className="p-3 text-xs text-[#8d877e]">
                  Loading files...
                </p>
              ) : files.length === 0 ? (
                <p className="p-3 text-xs leading-5 text-[#8d877e]">
                  No source files yet. Ask the AI to generate a website.
                </p>
              ) : (
                files.map((path) => (
                  <button
                    key={path}
                    onClick={() => {
                      openFile(path);
                      setActiveTab("editor");
                    }}
                    className={`flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-xs ${
                      selectedFile === path
                        ? "bg-[#38291f] text-[#e6ad80]"
                        : "text-[#b6aea2] hover:bg-[#25221e]"
                    }`}
                  >
                    <span className="text-[#b17c51]">
                      {path.endsWith(".css")
                        ? "◈"
                        : path.endsWith(".json")
                          ? "{}"
                          : path.endsWith(".html")
                            ? "◇"
                            : "⌘"}
                    </span>

                    <span className="break-all">{path}</span>
                  </button>
                ))
              )}
            </div>
          </section>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-xl border border-[#302d28] bg-[#191816]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#302d28] px-4 py-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">Workspace</h2>
              <p className="mt-1 truncate text-xs text-[#827b71]">
                {selectedFile || "Select a file to edit"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-[#302d28] p-1">
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`rounded-md px-3 py-1.5 text-xs ${
                    activeTab === "preview"
                      ? "bg-[#38291f] text-[#e6ad80]"
                      : "text-[#aaa195]"
                  }`}
                >
                  Preview
                </button>

                <button
                  onClick={() => setActiveTab("editor")}
                  className={`rounded-md px-3 py-1.5 text-xs ${
                    activeTab === "editor"
                      ? "bg-[#38291f] text-[#e6ad80]"
                      : "text-[#aaa195]"
                  }`}
                >
                  Code editor
                </button>
              </div>

              <button
                onClick={saveFile}
                disabled={!selectedFile || !websiteId || saving}
                className="rounded-lg bg-[#c17b49] px-3 py-2 text-xs font-semibold text-[#17130f] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>

          {(error || message) && (
            <div
              className={`border-b px-4 py-2 text-xs ${
                error
                  ? "border-[#623b35] bg-[#2b1b18] text-[#e4a49a]"
                  : "border-[#354332] bg-[#1c251b] text-[#b6d0a8]"
              }`}
            >
              {error || message}
            </div>
          )}

          {activeTab === "editor" ? (
            <div className="h-[580px]">
              {selectedFile ? (
                <Editor
                  height="580px"
                  path={selectedFile}
                  language={getLanguage(selectedFile)}
                  value={fileContent}
                  onChange={(value) => setFileContent(value ?? "")}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    wordWrap: "on",
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    padding: { top: 16 },
                  }}
                />
              ) : (
                <div className="flex h-[580px] items-center justify-center text-sm text-[#827b71]">
                  Generate a website or select a file.
                </div>
              )}
            </div>
          ) : (
            <div className="relative h-[580px] overflow-hidden bg-[#100f0e]">
              {previewUrl && (
                <iframe
                  key={`${previewUrl}-${previewVersion}`}
                  title="Generated website preview"
                  src={previewUrl}
                  className="h-full w-full border-0 bg-white"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              )}

              {(!previewUrl || generating || startingPreview) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-[#100f0e] px-6 text-center">
                  <div className="pointer-events-none absolute h-64 w-64 animate-ping rounded-full border border-[#c17b49]/20 [animation-duration:3s]" />

                  <div className="pointer-events-none absolute h-44 w-44 animate-pulse rounded-full border border-[#c17b49]/30" />

                  <div className="relative mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#76563d] bg-[#241b15] text-3xl text-[#e6ad80] shadow-[0_0_45px_rgba(193,123,73,0.15)]">
                    <span className="animate-pulse">✦</span>
                  </div>

                  <p className="mb-2 text-[10px] uppercase tracking-[0.35em] text-[#c17b49]">
                    Workshop AI
                  </p>

                  <h3 className="mb-3 text-xl font-semibold text-[#eee5da]">
                    {generating
                      ? "Crafting your website"
                      : startingPreview
                        ? "Preparing your preview"
                        : files.length
                          ? "Your website is ready"
                          : "Your canvas awaits"}
                  </h3>

                  <p className="mb-7 max-w-sm text-sm leading-6 text-[#958b7f]">
                    {generating
                      ? "Writing components, styling layouts and bringing your idea to life..."
                      : startingPreview
                        ? "Starting your development environment..."
                        : files.length
                          ? "Launch the preview to see your website in action."
                          : "Describe your idea to start building something amazing."}
                  </p>

                  {(generating || startingPreview) && (
                    <div className="mb-7 flex items-center gap-2">
                      {[0, 1, 2, 3, 4].map((item) => (
                        <span
                          key={item}
                          className="h-1.5 w-5 rounded-full bg-[#c17b49] animate-pulse"
                          style={{ animationDelay: `${item * 150}ms` }}
                        />
                      ))}
                    </div>
                  )}

                  {!generating && !startingPreview && (
                    <button
                      onClick={startPreview}
                      disabled={!websiteId || !files.length}
                      className="rounded-lg bg-[#c17b49] px-5 py-3 text-sm font-semibold text-[#17130f] transition hover:bg-[#d49361] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {files.length
                        ? "Launch preview →"
                        : "Generate a website first"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#302d28] px-4 py-3 text-[11px] text-[#827b71]">
            <span>AI chat · Code editing · Live preview</span>
            <span>{selectedFile ? getLanguage(selectedFile) : "Ready"}</span>
          </div>
        </section>
      </main>
    </div>
  );
}
