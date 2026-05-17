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

const statusStyles = {
  present: {
    label: "Present",
    row: "bg-green-50",
    text: "text-green-700",
    badge: "bg-green-100 text-green-700",
    avatar: "bg-green-100 text-green-700",
  },
  absent: {
    label: "Absent",
    row: "hover:bg-gray-50",
    text: "text-red-600",
    badge: "bg-red-100 text-red-700",
    avatar: "bg-gray-100 text-gray-600",
  },
  leave: {
    label: "Leave",
    row: "bg-amber-50",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
    avatar: "bg-amber-100 text-amber-700",
  },
};

export default function Attendance() {
  const navigate = useNavigate();

  const [pageType, setPageType] = useState("students");

  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [standard, setStandard] = useState("");
  const [search, setSearch] = useState("");

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [attendance, setAttendance] = useState({});
  const [originalAttendance, setOriginalAttendance] = useState({});

  const [summary, setSummary] = useState({
    total: 0,
    present: 0,
    absent: 0,
    leave: 0,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [wsConnected, setWsConnected] = useState(false);

  const wsRef = useRef(null);

  // ─────────────────────────────────────────────
  // WebSocket
  // ─────────────────────────────────────────────

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
            data.date === selectedDate &&
            pageType === "students"
          ) {
            await loadData(selectedDate, standard, pageType);
          }

          if (
            data.event === "teacher_attendance_saved" &&
            data.date === selectedDate &&
            pageType === "teachers"
          ) {
            await loadData(selectedDate, standard, pageType);
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
  }, [selectedDate, standard, pageType]);

  // ─────────────────────────────────────────────
  // Load Student Attendance
  // ─────────────────────────────────────────────

  async function loadStudentAttendance(dateStr, std) {
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
      }
    );

    if (!res.ok) {
      throw new Error("Failed to load student attendance");
    }

    const data = await res.json();

    setStudents(data.records || []);
    setTeachers([]);

    setSummary({
      total: data.total || 0,
      present: data.present || 0,
      absent: data.absent || 0,
      leave: data.leave || 0,
    });

    const map = {};

    (data.records || []).forEach((record) => {
      map[record.student_id] = record.status || "absent";
    });

    setAttendance(map);
    setOriginalAttendance(map);
  }

  // ─────────────────────────────────────────────
  // Load Teacher Attendance
  // ─────────────────────────────────────────────

  async function loadTeacherAttendance(dateStr) {
    const token = localStorage.getItem("token");

    const params = new URLSearchParams({
      date: dateStr,
    });

    const res = await fetch(
      `${API_BASE_URL}/teachers/attendance/daily?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to load teacher attendance");
    }

    const data = await res.json();

    setTeachers(data.records || []);
    setStudents([]);

    setSummary({
      total: data.total || 0,
      present: data.present || 0,
      absent: data.absent || 0,
      leave: data.leave || 0,
    });

    const map = {};

    (data.records || []).forEach((record) => {
      map[record.teacher_id] = record.status || "absent";
    });

    setAttendance(map);
    setOriginalAttendance(map);
  }

  // ─────────────────────────────────────────────
  // Main Load Function
  // ─────────────────────────────────────────────

  async function loadData(dateStr, std, type) {
    setLoading(true);
    setError("");
    setSaved(false);

    try {
      if (type === "students") {
        await loadStudentAttendance(dateStr, std);
      } else {
        await loadTeacherAttendance(dateStr);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");

      setSummary({
        total: 0,
        present: 0,
        absent: 0,
        leave: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(selectedDate, standard, pageType);
  }, [selectedDate, standard, pageType]);

  // ─────────────────────────────────────────────
  // Status Change
  // ─────────────────────────────────────────────

  function changeStatus(id, status) {
    setAttendance((prev) => {
      const updated = {
        ...prev,
        [id]: status,
      };

      const values = Object.values(updated);

      setSummary({
        total: values.length,
        present: values.filter((v) => v === "present").length,
        absent: values.filter((v) => v === "absent").length,
        leave: values.filter((v) => v === "leave").length,
      });

      return updated;
    });

    setSaved(false);
  }

  // ─────────────────────────────────────────────
  // Mark All
  // ─────────────────────────────────────────────

  function markAll(status) {
    const updated = {};

    const list = pageType === "students" ? students : teachers;

    list.forEach((item) => {
      const id =
        pageType === "students"
          ? item.student_id
          : item.teacher_id;

      updated[id] = status;
    });

    setAttendance(updated);

    setSummary({
      total: list.length,
      present: status === "present" ? list.length : 0,
      absent: status === "absent" ? list.length : 0,
      leave: status === "leave" ? list.length : 0,
    });

    setSaved(false);
  }

  // ─────────────────────────────────────────────
  // Save Attendance
  // ─────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (pageType === "students") {
        const records = students.map((student) => ({
          student_id: student.student_id,
          status: attendance[student.student_id] || "absent",
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
          }
        );

        if (!res.ok) {
          throw new Error("Failed to save student attendance");
        }
      } else {
        const records = teachers.map((teacher) => ({
          teacher_id: teacher.teacher_id,
          status: attendance[teacher.teacher_id] || "absent",
        }));

        const res = await fetch(
          `${API_BASE_URL}/teachers/attendance/save`,
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
          }
        );

        if (!res.ok) {
          throw new Error("Failed to save teacher attendance");
        }
      }

      await loadData(selectedDate, standard, pageType);

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

  // ─────────────────────────────────────────────
  // Reset
  // ─────────────────────────────────────────────

  function handleReset() {
    setAttendance(originalAttendance);

    const values = Object.values(originalAttendance);

    setSummary({
      total: values.length,
      present: values.filter((v) => v === "present").length,
      absent: values.filter((v) => v === "absent").length,
      leave: values.filter((v) => v === "leave").length,
    });

    setSaved(false);
  }

  // ─────────────────────────────────────────────
  // Filter
  // ─────────────────────────────────────────────

  const list = pageType === "students" ? students : teachers;

  const filtered = list.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const hasUnsavedChanges =
    JSON.stringify(attendance) !==
    JSON.stringify(originalAttendance);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Attendance Management
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage student and teacher attendance
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Switch */}
            <div className="rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => {
                  setPageType("students");
                  setSearch("");
                  setError("");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  pageType === "students"
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Students
              </button>

              <button
                onClick={() => {
                  setPageType("teachers");
                  setSearch("");
                  setError("");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  pageType === "teachers"
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Teachers
              </button>
            </div>

            {/* Live Status */}
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

              {wsConnected ? "Live" : "Offline"}
            </div>

            {/* Date */}
            <input
              type="date"
              value={selectedDate}
              max={todayStr()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm outline-none"
            />

            {/* Student Grade Filter */}
            {pageType === "students" && (
              <select
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm outline-none"
              >
                <option value="">All Grades</option>

                {[6, 7, 8, 9, 10, 11, 12].map((grade) => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => markAll("present")}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Mark All Present
            </button>

            <button
              onClick={() => markAll("absent")}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Mark All Absent
            </button>

            <button
              onClick={() => markAll("leave")}
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 shadow-sm hover:bg-amber-100"
            >
              Mark All Leave
            </button>
          </div>
        </div>

        {/* Search and Separate Stats */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white px-4 py-4 shadow-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              pageType === "students"
                ? "Search student..."
                : "Search teacher..."
            }
            className="min-w-[220px] flex-1 text-sm outline-none"
          />

          <div className="flex flex-wrap gap-3 text-sm">
            <span className="font-semibold text-gray-700">
              {summary.total} Total
            </span>

            <span className="font-semibold text-green-600">
              {summary.present} Present
            </span>

            <span className="font-semibold text-red-500">
              {summary.absent} Absent
            </span>

            <span className="font-semibold text-amber-600">
              {summary.leave} Leave
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* List */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500">
              Loading attendance...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              {pageType === "students"
                ? "No students found"
                : "No teachers found"}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((item) => {
                const id =
                  pageType === "students"
                    ? item.student_id
                    : item.teacher_id;

                const status = attendance[id] || "absent";
                const style = statusStyles[status];

                const initials = item.name
                  .split(" ")
                  .map((name) => name[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={id}
                    className={`flex flex-wrap items-center justify-between gap-4 px-4 py-4 transition ${style.row}`}
                  >
                    {/* Left */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${style.avatar}`}
                      >
                        {initials}
                      </div>

                      <div>
                        {pageType === "students" ? (
                          <button
                            onClick={() =>
                              navigate(`/attendance/${id}`)
                            }
                            className="text-left text-sm font-semibold text-gray-900 hover:text-indigo-600"
                          >
                            {item.name}
                          </button>
                        ) : (
                          <p className="text-sm font-semibold text-gray-900">
                            {item.name}
                          </p>
                        )}

                        <p className="text-xs text-gray-400">
                          {pageType === "students"
                            ? `Grade ${item.standard}`
                            : item.email || "Teacher"}
                        </p>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}
                      >
                        {style.label}
                      </span>

                      <button
                        onClick={() =>
                          changeStatus(id, "present")
                        }
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          status === "present"
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700"
                        }`}
                      >
                        Present
                      </button>

                      <button
                        onClick={() =>
                          changeStatus(id, "absent")
                        }
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          status === "absent"
                            ? "bg-red-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700"
                        }`}
                      >
                        Absent
                      </button>

                      <button
                        onClick={() =>
                          changeStatus(id, "leave")
                        }
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          status === "leave"
                            ? "bg-amber-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700"
                        }`}
                      >
                        Leave
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Save */}
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
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      )}

      {/* Saved Toast */}
      {saved && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-green-600 px-6 py-3 shadow-2xl">
          <p className="text-sm font-semibold text-white">
            {pageType === "students" ? "Student" : "Teacher"} attendance saved
            for {formatDisplay(selectedDate)}
          </p>
        </div>
      )}
    </div>
  );
}