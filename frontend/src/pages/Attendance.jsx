import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const WS_URL = API_BASE_URL.replace(/^http/, "ws") + "/attendance/ws";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatDisplay(dateStr) {
  const d = new Date(dateStr + "T00:00:00");

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Attendance() {
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [standard, setStandard] = useState("");
  const [search, setSearch] = useState("");

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [originalAttendance, setOriginalAttendance] = useState({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [wsConnected, setWsConnected] = useState(false);

  const wsRef = useRef(null);

  // ─────────────────────────────────────────────────────────────
  // WebSocket
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let reconnectTimeout;

    function connect() {
      const ws = new WebSocket(WS_URL);

      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onclose = () => {
        setWsConnected(false);

        reconnectTimeout = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onmessage = async (e) => {
        try {
          const data = JSON.parse(e.data);

          if (
            data.event === "attendance_saved" &&
            data.date === selectedDate
          ) {
            await loadAttendance(selectedDate, standard);
          }
        } catch {
          //
        }
      };
    }

    connect();

    const ping = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send("ping");
      }
    }, 20000);

    return () => {
      clearInterval(ping);

      clearTimeout(reconnectTimeout);

      if (
        wsRef.current &&
        wsRef.current.readyState === WebSocket.OPEN
      ) {
        wsRef.current.close();
      }
    };
  }, [selectedDate, standard]);

  // ─────────────────────────────────────────────────────────────
  // Load attendance
  // ─────────────────────────────────────────────────────────────
  async function loadAttendance(dateStr, std) {
    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const token = localStorage.getItem("token");

      const params = new URLSearchParams({
        date: dateStr,
      });

      if (std) {
        params.set("standard", std);
      }

      const res = await fetch(
        `${API_BASE_URL}/attendance/daily?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("Failed to load attendance");
      }

      const data = await res.json();

      setStudents(data.records);

      const map = {};

      data.records.forEach((r) => {
        map[r.student_id] = r.status;
      });

      setAttendance(map);
      setOriginalAttendance(map);

    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance(selectedDate, standard);
  }, [selectedDate, standard]);

  // ─────────────────────────────────────────────────────────────
  // Toggle attendance
  // ─────────────────────────────────────────────────────────────
  function toggle(studentId) {
    setAttendance((prev) => ({
      ...prev,
      [studentId]:
        prev[studentId] === "present"
          ? "absent"
          : "present",
    }));

    setSaved(false);
  }

  // ─────────────────────────────────────────────────────────────
  // Mark all present
  // ─────────────────────────────────────────────────────────────
  function markAllPresent() {
    const updated = {};

    students.forEach((s) => {
      updated[s.student_id] = "present";
    });

    setAttendance(updated);

    setSaved(false);
  }

  // ─────────────────────────────────────────────────────────────
  // Save attendance
  // ─────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const records = students.map((s) => ({
        student_id: s.student_id,
        status: attendance[s.student_id] || "absent",
      }));

      const res = await fetch(
        `${API_BASE_URL}/attendance/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: selectedDate,
            records,
          }),
        },
      );

      if (!res.ok) {
        throw new Error("Failed to save attendance");
      }

      setOriginalAttendance(attendance);

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 3000);

    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Reset
  // ─────────────────────────────────────────────────────────────
  function handleReset() {
    setAttendance(originalAttendance);
    setSaved(false);
  }

  // ─────────────────────────────────────────────────────────────
  // Search filter
  // ─────────────────────────────────────────────────────────────
  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  // ─────────────────────────────────────────────────────────────
  // Stats
  // ─────────────────────────────────────────────────────────────
  const presentCount = Object.values(attendance).filter(
    (v) => v === "present",
  ).length;

  const absentCount = students.length - presentCount;

  // SHOW BUTTON ONLY WHEN CHANGED
  const hasUnsavedChanges =
    JSON.stringify(attendance) !==
    JSON.stringify(originalAttendance);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="mx-auto max-w-5xl p-6">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Attendance Management
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Daily attendance tracking
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            {/* Live status */}
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                wsConnected
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  wsConnected
                    ? "bg-green-500"
                    : "bg-yellow-500"
                }`}
              />

              {wsConnected ? "Live" : "Reconnecting"}
            </div>

            {/* Date */}
            <input
              type="date"
              value={selectedDate}
              max={todayStr()}
              onChange={(e) =>
                setSelectedDate(e.target.value)
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm outline-none"
            />

            {/* Grade */}
            <select
              value={standard}
              onChange={(e) =>
                setStandard(e.target.value)
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm outline-none"
            >
              <option value="">All Grades</option>

              {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>

            {/* Mark all */}
            <button
              onClick={markAllPresent}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Mark All Present
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white px-4 py-4 shadow-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student..."
            className="flex-1 text-sm outline-none"
          />

          <div className="text-sm text-gray-500">
            <span className="font-semibold text-green-600">
              {presentCount} Present
            </span>

            {" · "}

            <span className="font-semibold text-red-500">
              {absentCount} Absent
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Student List */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Loading attendance...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              No students found
            </div>
          ) : (
            <div className="divide-y divide-gray-100">

              {filtered.map((student) => {
                const isPresent =
                  attendance[student.student_id] ===
                  "present";

                const initials = student.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={student.student_id}
                    className={`flex items-center justify-between px-4 py-4 transition ${
                      isPresent
                        ? "bg-green-50"
                        : "hover:bg-gray-50"
                    }`}
                  >

                    {/* Left */}
                    <div className="flex items-center gap-3">

                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                          isPresent
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {initials}
                      </div>

                      <div>
                        <button
                          onClick={() =>
                            navigate(
                              `/attendance/${student.student_id}`,
                            )
                          }
                          className="text-left text-sm font-semibold text-gray-900 hover:text-indigo-600"
                        >
                          {student.name}
                        </button>

                        <p className="text-xs text-gray-400">
                          Grade {student.standard}
                        </p>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-3">

                      <span
                        className={`text-xs font-semibold ${
                          isPresent
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {isPresent
                          ? "Present"
                          : "Absent"}
                      </span>

                      <button
                        onClick={() =>
                          toggle(student.student_id)
                        }
                        className={`relative h-6 w-11 rounded-full transition ${
                          isPresent
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                            isPresent
                              ? "left-6"
                              : "left-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Save Modal */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-2xl bg-gray-900 px-6 py-4 shadow-2xl">

          <div>
            <p className="text-sm font-semibold text-white">
              Attendance Modified
            </p>

            <p className="text-xs text-gray-400">
              Save the changes now
            </p>
          </div>

          <button
            onClick={handleReset}
            className="rounded-lg px-4 py-2 text-sm text-gray-300 hover:text-white"
          >
            Reset
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : "Save Attendance"}
          </button>
        </div>
      )}

      {/* Saved Toast */}
      {saved && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-green-600 px-6 py-3 shadow-2xl">
          <p className="text-sm font-semibold text-white">
            Attendance saved for{" "}
            {formatDisplay(selectedDate)}
          </p>
        </div>
      )}
    </div>
  );
}