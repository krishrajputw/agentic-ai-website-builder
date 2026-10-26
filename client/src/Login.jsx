
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api/auth";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

 
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (mode === "signup" && (cleanName.length < 2 || cleanName.length > 60)) {
      setError("Name must be between 2 and 60 characters.");
      return;
    }

    if (password.length < 8 || password.length > 128) {
      setError("Password must be between 8 and 128 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/${mode === "login" ? "login" : "signup"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            mode === "login"
              ? { email: cleanEmail, password }
              : { name: cleanName, email: cleanEmail, password }
          ),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Request failed (${response.status})`);
      }

      if (!data.token || !data.user) {
        throw new Error("Server response is incomplete. Please try again.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/builder", { replace: true });
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot connect to server. Check that the backend is running."
          : err.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="min-h-screen bg-[#11100e] text-white flex items-center justify-center p-5">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1b1916] p-7 sm:p-9">
        <Link to="/" className="text-sm text-orange-400">← Back to home</Link>

        <h1 className="mt-7 text-3xl font-bold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Sign in to continue building websites with AI.
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-lg bg-black/30 p-1">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={`rounded-md p-2 ${mode === "login" ? "bg-orange-500 text-black" : "text-white/60"}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); }}
            className={`rounded-md p-2 ${mode === "signup" ? "bg-orange-500 text-black" : "text-white/60"}`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <label className="block text-sm">
              Full name
              <input
                required
                minLength={2}
                maxLength={60}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/25 p-3 outline-none focus:border-orange-400"
                placeholder="Your name"
              />
            </label>
          )}

          <label className="block text-sm">
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/25 p-3 outline-none focus:border-orange-400"
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm">
            Password
            <input
              required
              type="password"
              minLength={8}
              maxLength={128}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-black/25 p-3 outline-none focus:border-orange-400"
              placeholder="At least 8 characters"
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-400">{error}</p>
          )}

          <button
            disabled={loading}
            className="w-full rounded-lg bg-orange-500 p-3 font-semibold text-black hover:bg-orange-400 disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}
