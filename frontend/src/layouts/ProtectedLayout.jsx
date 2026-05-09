import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function ProtectedLayout() {
  const navigate = useNavigate();

  const [username, setUsername] = useState(
    localStorage.getItem("username") || ""
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUsername("");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar username={username} onLogout={handleLogout} />

      <main className="ml-[220px] p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}