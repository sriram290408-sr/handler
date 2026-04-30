import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useState } from "react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Sidebar from "./components/Sidebar";

function ProtectedLayout({ username, onLogout, children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar username={username} onLogout={onLogout} />
      <main className="ml-[220px] p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const token = localStorage.getItem("token");

  const handleLogin = (name) => {
    setUsername(name);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUsername("");
    navigate("/login");
  };

  if (!token) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout username={username} onLogout={handleLogout}>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/students"
        element={
          <ProtectedLayout username={username} onLogout={handleLogout}>
            <Students />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}