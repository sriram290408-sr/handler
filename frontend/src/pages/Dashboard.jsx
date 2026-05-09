import { useEffect, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const COLORS = [
  "#4f46e5",
  "#7c3aed",
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      // ─────────────────────────────────────
      // Dashboard Stats
      // ─────────────────────────────────────
      const dashboardRes = await fetch(
        `${API_BASE_URL}/attendance/dashboard-stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!dashboardRes.ok) {
        throw new Error(
          "Failed to load dashboard stats"
        );
      }

      const dashboardData =
        await dashboardRes.json();

      // ─────────────────────────────────────
      // Students List
      // ─────────────────────────────────────
      const studentsRes = await fetch(
        `${API_BASE_URL}/students?page=1&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!studentsRes.ok) {
        throw new Error(
          "Failed to load students"
        );
      }

      const studentsData =
        await studentsRes.json();

      console.log(
        "Dashboard:",
        dashboardData
      );

      console.log(
        "Students:",
        studentsData
      );

      // ─────────────────────────────────────
      // Safe students array
      // ─────────────────────────────────────
      const students = Array.isArray(
        studentsData?.data
      )
        ? studentsData.data
        : [];

      // ─────────────────────────────────────
      // Total Students
      // ─────────────────────────────────────
      const totalStudents =
        studentsData?.total ||
        students.length ||
        0;

      // ─────────────────────────────────────
      // Group Standards
      // ─────────────────────────────────────
      const grouped = {};

      students.forEach((student) => {
        const std = student.standard;

        if (!grouped[std]) {
          grouped[std] = 0;
        }

        grouped[std] += 1;
      });

      // ─────────────────────────────────────
      // Standard Distribution Chart
      // ─────────────────────────────────────
      const standardChart =
        Object.keys(grouped).map((std) => ({
          standard: `Std ${std}`,
          value: grouped[std],
          percentage: totalStudents
            ? Number(
                (
                  (grouped[std] /
                    totalStudents) *
                  100
                ).toFixed(1)
              )
            : 0,
        }));

      // ─────────────────────────────────────
      // Final State
      // ─────────────────────────────────────
      setDashboard({
        ...dashboardData,
        total_enrollment:
          totalStudents,
      });

      setStandards(standardChart);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────
  // Loading
  // ─────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>

          <p className="text-sm text-gray-500">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────
  // Error
  // ─────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-500 shadow-sm">
        {error}
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="min-w-0 p-1">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Overview
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Student analytics and
            attendance insights
          </p>
        </div>

        <div className="rounded-2xl bg-indigo-600 px-6 py-4 text-white shadow-lg shadow-indigo-200">
          <p className="text-xs uppercase tracking-wide text-indigo-100">
            Total Enrollment
          </p>

          <h2 className="mt-1 text-3xl font-bold">
            {dashboard.total_enrollment ||
              0}
          </h2>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Total Students"
          value={
            dashboard.total_enrollment ||
            0
          }
          color="text-indigo-600"
          bg="bg-indigo-100"
          icon="👨‍🎓"
        />

        <Card
          title="Average Attendance"
          value={`${
            dashboard.avg_attendance ||
            0
          }%`}
          color="text-cyan-600"
          bg="bg-cyan-100"
          icon="📈"
        />

        <Card
          title="Today's Present"
          value={
            dashboard?.today
              ?.present || 0
          }
          color="text-green-600"
          bg="bg-green-100"
          icon="✅"
        />

        <Card
          title="Today's Absent"
          value={
            dashboard?.today
              ?.absent || 0
          }
          color="text-red-500"
          bg="bg-red-100"
          icon="❌"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Pie Chart */}
        <div className="min-w-0 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 xl:col-span-2">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-gray-900">
              Standard Distribution
            </h3>

            <p className="text-sm text-gray-500">
              Real backend student
              distribution
            </p>
          </div>

          <div className="h-[360px] w-full min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={standards}
                  dataKey="value"
                  nameKey="standard"
                  cx="50%"
                  cy="50%"
                  outerRadius={115}
                  innerRadius={60}
                  paddingAngle={4}
                  label={({
                    standard,
                    percentage,
                  }) =>
                    `${standard} (${percentage}%)`
                  }
                >
                  {standards.map(
                    (
                      entry,
                      index
                    ) => (
                      <Cell
                        key={
                          entry.standard
                        }
                        fill={
                          COLORS[
                            index %
                              COLORS.length
                          ]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart */}
        <div className="min-w-0 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 xl:col-span-3">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-gray-900">
              Monthly Attendance
              Trend
            </h3>

            <p className="text-sm text-gray-500">
              Real backend attendance
              analytics
            </p>
          </div>

          <div className="h-[360px] w-full min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={
                  dashboard?.monthly_trend ||
                  []
                }
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#4f46e5"
                  strokeWidth={4}
                  dot={{
                    r: 5,
                  }}
                  activeDot={{
                    r: 8,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  color,
  bg,
  icon,
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <h3
            className={`mt-2 text-3xl font-bold ${color}`}
          >
            {value}
          </h3>
        </div>

        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${bg}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}