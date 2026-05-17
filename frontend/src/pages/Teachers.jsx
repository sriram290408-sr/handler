import { useEffect, useState } from "react";

import {
  Plus,
  Search,
  User,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  School,
  Pencil,
  Trash2,
  Eye,
  X,
} from "lucide-react";

import {
  getTeachers,
  createTeacher,
  patchTeacher,
  deleteTeacher,
} from "../services/api";

/* =========================================================
   OPTIONS
========================================================= */

const subjectOptions = [
  "Tamil",
  "English",
  "Maths",
  "Physics",
  "Chemistry",
  "Biology",
  "Botany",
  "Zoology",
  "Computer Science",
  "Commerce",
  "Accountancy",
  "Economics",
  "History",
  "Geography",
  "Political Science",
  "Statistics",
  "Business Maths",
];

const classOptions = [
  "Std 6",
  "Std 7",
  "Std 8",
  "Std 9",
  "Std 10",
  "Std 11",
  "Std 12",
];

/* =========================================================
   INITIAL FORM
========================================================= */

const initialForm = {
  name: "",
  gender: "",
  email: "",
  phone_number: "",
  qualification: "",
  experience: "",
  address: "",
  subjects: [],
  assigned_classes: [],
};

/* =========================================================
   COMPONENT
========================================================= */

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [subjectFilter, setSubjectFilter] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const [editingTeacher, setEditingTeacher] = useState(null);

  const [form, setForm] = useState(initialForm);

  const [saveLoading, setSaveLoading] = useState(false);

  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  /* =========================================================
     LOAD TEACHERS
  ========================================================= */

  const loadTeachers = async () => {
    try {
      setLoading(true);

      setError("");

      const response = await getTeachers({
        search,
        subject: subjectFilter,
      });

      if (Array.isArray(response?.data)) {
        setTeachers(response.data);
      } else {
        setTeachers([]);
      }
    } catch (err) {
      console.error(err);

      setError(err.message || "Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, [search, subjectFilter]);

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaveLoading(true);

      setError("");

      const payload = {
        name: form.name.trim(),

        gender: form.gender.trim(),

        email: form.email.trim(),

        phone_number: form.phone_number.trim(),

        qualification: form.qualification.trim(),

        experience: Number(form.experience),

        address: form.address.trim(),

        subjects: form.subjects.map((s) => String(s)),

        assigned_classes: form.assigned_classes.map((c) =>
          c.replace("Std ", ""),
        ),
      };

      console.log("PAYLOAD:", payload);

      if (editingTeacher) {
        await patchTeacher(editingTeacher.id, payload);
      } else {
        await createTeacher(payload);
      }

      closeModal();

      loadTeachers();
    } catch (err) {
      console.error(err);

      setError(err.message || "Failed to save teacher");
    } finally {
      setSaveLoading(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this teacher?");

    if (!confirmDelete) return;

    try {
      setDeleteLoadingId(id);

      await deleteTeacher(id);

      loadTeachers();
    } catch (err) {
      console.error(err);

      setError(err.message);
    } finally {
      setDeleteLoadingId(null);
    }
  };

  /* =========================================================
     EDIT
  ========================================================= */

  const openEdit = (teacher) => {
    setEditingTeacher(teacher);

    setForm({
      name: teacher.name || "",

      gender: teacher.gender || "",

      email: teacher.email || "",

      phone_number: teacher.phone_number || "",

      qualification: teacher.qualification || "",

      experience: teacher.experience || "",

      address: teacher.address || "",

      subjects: teacher.subjects || [],

      assigned_classes: teacher.assigned_classes?.map((c) => `Std ${c}`) || [],
    });

    setShowModal(true);
  };

  /* =========================================================
     TOGGLE SUBJECT
  ========================================================= */

  const toggleSubject = (subject) => {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  /* =========================================================
     TOGGLE CLASS
  ========================================================= */

  const toggleClass = (cls) => {
    setForm((prev) => ({
      ...prev,
      assigned_classes: prev.assigned_classes.includes(cls)
        ? prev.assigned_classes.filter((c) => c !== cls)
        : [...prev.assigned_classes, cls],
    }));
  };

  /* =========================================================
     CLOSE
  ========================================================= */

  const closeModal = () => {
    setShowModal(false);

    setEditingTeacher(null);

    setForm(initialForm);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Teachers</h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage teachers and classes
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTeacher(null);

            setForm(initialForm);

            setShowModal(true);
          }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-white transition hover:bg-indigo-700"
        >
          <Plus size={18} />
          Add Teacher
        </button>
      </div>

      {/* FILTER */}
      <div className="mb-6 rounded-3xl bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-3.5 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search teacher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">All Subjects</option>

            {subjectOptions.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-5 rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          Loading...
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="rounded-3xl bg-white p-5 shadow-sm"
            >
              {/* TOP */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                    <User size={24} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold">
                      {teacher.name}
                    </h2>

                    <p className="mt-1 flex items-center gap-2 truncate text-sm text-gray-500">
                      <Mail size={14} />
                      {teacher.email}
                    </p>

                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                      <Phone size={14} />
                      {teacher.phone_number}
                    </p>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setSelectedTeacher(teacher)}
                    className="rounded-xl bg-blue-100 p-2 text-blue-600"
                  >
                    <Eye size={16} />
                  </button>

                  <button
                    onClick={() => openEdit(teacher)}
                    className="rounded-xl bg-indigo-100 p-2 text-indigo-600"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(teacher.id)}
                    disabled={deleteLoadingId === teacher.id}
                    className="rounded-xl bg-red-100 p-2 text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* INFO */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-gray-50 p-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <GraduationCap size={14} />
                    <span className="text-xs">Qualification</span>
                  </div>

                  <p className="mt-2 text-sm font-semibold">
                    {teacher.qualification}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Experience</p>

                  <p className="mt-2 text-sm font-semibold">
                    {teacher.experience} Years
                  </p>
                </div>
              </div>

              {/* SUBJECTS */}
              <div className="mt-5">
                <div className="mb-2 flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-600" />

                  <h3 className="text-sm font-semibold">Subjects</h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {teacher.subjects?.map((subject) => (
                    <span
                      key={subject}
                      className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              {/* CLASSES */}
              <div className="mt-5">
                <div className="mb-2 flex items-center gap-2">
                  <School size={16} className="text-cyan-600" />

                  <h3 className="text-sm font-semibold">Classes</h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {teacher.assigned_classes?.map((cls) => (
                    <span
                      key={cls}
                      className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-700"
                    >
                      Std {cls}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
          <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-5 sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold sm:text-2xl">
                {editingTeacher ? "Edit Teacher" : "Add Teacher"}
              </h2>

              <button
                onClick={closeModal}
                className="rounded-xl bg-gray-100 p-2"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                {[
                  ["Full Name", "name", "text"],
                  ["Email", "email", "email"],
                  ["Phone Number", "phone_number", "text"],
                  ["Qualification", "qualification", "text"],
                  ["Experience", "experience", "number"],
                ].map(([label, field, type]) => (
                  <div key={field}>
                    <label className="mb-2 block text-sm font-medium">
                      {label}
                    </label>

                    <input
                      required
                      type={type}
                      value={form[field]}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [field]: e.target.value,
                        })
                      }
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}

                {/* GENDER */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Gender
                  </label>

                  <select
                    required
                    value={form.gender}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        gender: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Gender</option>

                    <option value="Male">Male</option>

                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* ADDRESS */}
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium">
                  Address
                </label>

                <textarea
                  rows={4}
                  required
                  value={form.address}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </div>

              {/* SUBJECTS */}
              <div className="mt-7">
                <h3 className="mb-3 text-lg font-semibold">Subjects</h3>

                <div className="flex flex-wrap gap-3">
                  {subjectOptions.map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        form.subjects.includes(subject)
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              {/* CLASSES */}
              <div className="mt-7">
                <h3 className="mb-3 text-lg font-semibold">Classes</h3>

                <div className="flex flex-wrap gap-3">
                  {classOptions.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => toggleClass(cls)}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        form.assigned_classes.includes(cls)
                          ? "bg-cyan-600 text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-gray-200 px-5 py-3"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saveLoading}
                  className="rounded-2xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
                >
                  {saveLoading
                    ? "Saving..."
                    : editingTeacher
                      ? "Save Changes"
                      : "Add Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
