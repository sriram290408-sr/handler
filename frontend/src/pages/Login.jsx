import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await login(email, password);

      if (!data?.access_token) {
        throw new Error("Login failed: No token received");
      }

      if (data?.username) {
        localStorage.setItem("username", data.username);
        onLogin(data.username);
      }

      navigate("/dashboard");

    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <form
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Teacher Login
        </h2>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="off"
          className="mb-3 w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400"
          required
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="new-password"
          className="mb-3 w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400"
          required
        />

        {error && (
          <p className="mb-3 text-sm text-red-500">{error}</p>
        )}

        <button
          disabled={loading}
          className="w-full rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}