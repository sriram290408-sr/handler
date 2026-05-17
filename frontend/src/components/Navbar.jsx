import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  GraduationCap,
  LogOut,
} from "lucide-react";

const navItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    name: "Students",
    path: "/students",
    icon: <Users size={18} />,
  },
  {
    name: "Teachers",
    path: "/teachers",
    icon: <GraduationCap size={18} />,
  },
  {
    name: "Attendance",
    path: "/attendance",
    icon: <ClipboardCheck size={18} />,
  },
];

export default function Navbar({ username, onLogout }) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <GraduationCap size={24} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Handler
            </h1>

            <p className="text-sm text-gray-500">
              Student Management System
            </p>
          </div>
        </div>

        {/* Center Nav */}
        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-4">
          <div className="hidden rounded-2xl bg-gray-100 px-4 py-2 md:block">
            <p className="text-xs text-gray-500">
              Logged in as
            </p>

            <p className="text-sm font-semibold text-gray-900">
              {username}
            </p>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-100 transition hover:bg-red-600"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}