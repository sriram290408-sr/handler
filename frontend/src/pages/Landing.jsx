import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Activity,
  BarChart3,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Landing() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/dashboard-stats`);

      if (!res.ok) {
        throw new Error("Failed to load");
      }

      const data = await res.json();
      setDashboard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const trend = dashboard?.monthly_trend || [];

  return (
    <div className="min-h-screen overflow-hidden bg-[#f4f7fb] text-gray-900">
      {/* Background */}
      <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="absolute bottom-[-140px] right-[-100px] h-[320px] w-[320px] rounded-full bg-cyan-200/40 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {/* Navbar */}
        <nav className="mb-16 flex items-center justify-between rounded-2xl border border-white/40 bg-white/70 px-6 py-4 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <GraduationCap size={22} />
            </div>

            <div>
              <h1 className="text-lg font-bold">Handler</h1>
              <p className="text-xs text-gray-500">
                Student Management System
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/login")}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Login
          </button>
        </nav>

        {/* Hero */}
        <section className="grid items-center gap-14 lg:grid-cols-2">
          {/* Left */}
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow">
              <CheckCircle2 size={16} />
              Real-time School Analytics
            </div>

            <h1 className="max-w-xl text-5xl font-black leading-tight md:text-6xl">
              Smart Student
              <span className="block bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                Management Platform
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Manage attendance, student records, and analytics from one
              professional dashboard built for modern schools.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700"
              >
                Access Dashboard
                <ArrowRight size={18} />
              </button>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle2 size={18} className="text-green-500" />
                Live backend data
              </div>
            </div>

            {/* Real Stats */}
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-5 shadow-lg">
                <p className="text-sm text-gray-500">
                  Total Students
                </p>

                <h3 className="mt-2 text-3xl font-bold text-indigo-600">
                  {loading
                    ? "..."
                    : dashboard?.total_enrollment || 0}
                </h3>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-lg">
                <p className="text-sm text-gray-500">
                  Average Attendance
                </p>

                <h3 className="mt-2 text-3xl font-bold text-cyan-600">
                  {loading
                    ? "..."
                    : `${dashboard?.avg_attendance || 0}%`}
                </h3>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-lg">
                <p className="text-sm text-gray-500">
                  Today's Present
                </p>

                <h3 className="mt-2 text-3xl font-bold text-green-600">
                  {loading
                    ? "..."
                    : dashboard?.today?.present || 0}
                </h3>
              </div>
            </div>
          </div>

          {/* Right Analytics */}
          <div className="rounded-[32px] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Attendance Overview
                </h3>

                <p className="text-sm text-gray-500">
                  Real monthly attendance trend
                </p>
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Live
              </span>
            </div>

            {/* Today's Attendance */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-indigo-50 p-5">
                <p className="text-sm text-gray-500">
                  Present
                </p>

                <h2 className="mt-2 text-3xl font-bold text-indigo-600">
                  {dashboard?.today?.present || 0}
                </h2>
              </div>

              <div className="rounded-2xl bg-red-50 p-5">
                <p className="text-sm text-gray-500">
                  Absent
                </p>

                <h2 className="mt-2 text-3xl font-bold text-red-500">
                  {dashboard?.today?.absent || 0}
                </h2>
              </div>
            </div>

            {/* Real Chart */}
            <div className="rounded-2xl bg-gray-50 p-5">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">
                  Monthly Attendance %
                </p>

                <span className="text-xs text-gray-400">
                  Last 10 Months
                </span>
              </div>

              <div className="flex h-56 items-end justify-between gap-3">
                {trend.map((item) => (
                  <div
                    key={item.month}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div
                      className="w-full rounded-t-2xl bg-gradient-to-t from-indigo-600 to-cyan-400"
                      style={{
                        height: `${Math.max(
                          item.percentage * 1.8,
                          10
                        )}px`,
                      }}
                    />

                    <span className="text-xs text-gray-500">
                      {item.month}
                    </span>

                    <span className="text-[10px] font-medium text-gray-400">
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mt-28">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold">
              Core Features
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-gray-500">
              Everything required for complete student and attendance management.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <Users size={24} />,
                title: "Student Records",
                desc: "Maintain complete student information securely.",
              },
              {
                icon: <Activity size={24} />,
                title: "Attendance Tracking",
                desc: "Monitor daily attendance with realtime updates.",
              },
              {
                icon: <BarChart3 size={24} />,
                title: "Analytics Dashboard",
                desc: "Visualize attendance and performance insights.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl bg-white p-7 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                  {item.icon}
                </div>

                <h3 className="mb-3 text-lg font-semibold">
                  {item.title}
                </h3>

                <p className="text-sm leading-7 text-gray-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 flex flex-col items-center justify-between gap-4 border-t border-gray-200 py-8 text-sm text-gray-500 md:flex-row">
          <p>© 2026 Handler. All rights reserved.</p>

          <div className="flex gap-6">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Support</span>
          </div>
        </footer>
      </div>
    </div>
  );
}