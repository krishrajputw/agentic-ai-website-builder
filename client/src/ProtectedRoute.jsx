
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

const API = `${import.meta.env.VITE_API_BASE_URL}/api/auth`;

export default function ProtectedRoute() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setStatus("unauthorized");
      return;
    }

    const controller = new AbortController();

    async function verifySession() {
      try {
        const response = await fetch(`${API}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setStatus("unauthorized");
          return;
        }

        const data = await response.json();

        if (!data.user) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setStatus("unauthorized");
          return;
        }

        localStorage.setItem("user", JSON.stringify(data.user));
        setStatus("authorized");
      } catch (error) {
        if (error.name !== "AbortError") {
          // Network failure doesn't prove the token is invalid.
          setStatus("error");
        }
      }
    }

    verifySession();

    return () => controller.abort();
  }, []);

  if (status === "checking") {
    return <div className="p-6 text-center">Verifying session...</div>;
  }

  if (status === "unauthorized") {
    return <Navigate to="/login" replace />;
  }

  if (status === "error") {
    return (
      <div className="p-6 text-center">
        Server connection failed. Please check your backend and refresh.
      </div>
    );
  }

  return <Outlet />;
}
