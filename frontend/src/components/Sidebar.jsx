import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/handler.png";

export default function Sidebar({ username }) {
  const navigate = useNavigate();

  const baseClass =
    "block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100";

  const activeClass = "bg-indigo-100 text-indigo-600";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");

    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-[220px] flex-col border-r border-gray-200 bg-white p-5">
      <div className="mb-6 flex items-center gap-3">
        <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />

        <h2 className="text-lg font-semibold text-gray-900">Handler</h2>
      </div>

      <p className="mb-4 rounded bg-gray-100 px-3 py-2 text-sm text-gray-700">
        Logged in: {username}
      </p>

      <nav className="space-y-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : ""}`
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/students"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : ""}`
          }
        >
          Students
        </NavLink>

        <NavLink
          to="/teachers"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : ""}`
          }
        >
          Teachers
        </NavLink>

        <NavLink
          to="/attendance"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : ""}`
          }
        >
          Attendance
        </NavLink>
      </nav>

      <button
        onClick={handleLogout}
        className="mt-auto rounded bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
      >
        Logout
      </button>
    </aside>
  );
}
