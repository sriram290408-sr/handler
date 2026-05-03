import { useEffect, useState } from "react";
import Papa from "papaparse";
import {
  createStudent,
  deleteStudent,
  getStudents,
  patchStudent,
} from "../services/api";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const communities = ["BC", "OC", "MBC", "SC/ST"];

const initialForm = {
  name: "",
  father_name: "",
  gender: "",
  standard: "",
  medium: "",
  school_name: "",
  dob: "",
  community: "",
  blood_group: "",
  address: "",
  parent_phone_number: "",
  parents_occupation: "",
};

const normalizePhoneNumber = (value) => {
  if (value === null || value === undefined) return "";

  let phone = String(value).trim().replace(/\s+/g, "");

  if (phone.endsWith(".0")) {
    phone = phone.slice(0, -2);
  }

  if (/e/i.test(phone)) {
    const numericPhone = Number(phone);
    if (!Number.isNaN(numericPhone)) {
      phone = numericPhone.toFixed(0);
    }
  }

  phone = phone.replace(/[^\d+]/g, "");

  if (phone.startsWith("+91")) {
    phone = phone.slice(3);
  } else if (phone.startsWith("91") && phone.length === 12) {
    phone = phone.slice(2);
  }

  return phone;
};

const formatDate = (isoString) => {
  if (!isoString) return "-";
  const d = new Date(isoString);
  if (isNaN(d)) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeHeader = (header) =>
  header.trim().toLowerCase().replace(/[\s\-\/\\]+/g, "_");

const CSV_HEADER_MAP = {
  name: "name",
  father_name: "father_name",
  gender: "gender",
  class: "standard",
  medium: "medium",
  school: "school_name",
  dob: "dob",
  community: "community",
  blood_group: "blood_group",
  address: "address",
  mb_parents: "parent_phone_number",
  parents_occupation: "parents_occupation",
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1 });
  const [search, setSearch] = useState("");
  const [standard, setStandard] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [community, setCommunity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [showAddModal, setShowAddModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadReport, setUploadReport] = useState(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [editLoading, setEditLoading] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [replaceSearchValue, setReplaceSearchValue] = useState("");
  const [replaceWithValue, setReplaceWithValue] = useState("");
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [replaceReport, setReplaceReport] = useState("");

  const loadStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getStudents({
        page,
        limit: 10,
        search,
        standard,
        bloodGroup,
        community,
      });
      setStudents(data.data);
      setMeta({ total: data.total, total_pages: data.total_pages });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [page, search, standard, bloodGroup, community]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setCreateLoading(true);
    try {
      await createStudent({
        ...form,
        standard: Number(form.standard),
        parent_phone_number: normalizePhoneNumber(form.parent_phone_number),
      });
      setForm(initialForm);
      setShowAddModal(false);
      setPage(1);
      await loadStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const normalizeRow = (row) => {
    const mapped = {};
    for (const [rawKey, value] of Object.entries(row)) {
      const normalizedKey = normalizeHeader(rawKey);
      const fieldName = CSV_HEADER_MAP[normalizedKey];
      if (fieldName) {
        mapped[fieldName] = value;
      }
    }
    return {
      name: String(mapped.name ?? "").trim(),
      father_name: String(mapped.father_name ?? "").trim(),
      gender: String(mapped.gender ?? "").trim(),
      standard: Number(mapped.standard ?? ""),
      medium: String(mapped.medium ?? "").trim(),
      school_name: String(mapped.school_name ?? "").trim(),
      dob: String(mapped.dob ?? "").trim(),
      community: String(mapped.community ?? "").trim(),
      blood_group: String(mapped.blood_group ?? "").trim(),
      address: String(mapped.address ?? "").trim(),
      parent_phone_number: normalizePhoneNumber(
        mapped.parent_phone_number ?? "",
      ),
      parents_occupation: String(mapped.parents_occupation ?? "").trim(),
    };
  };

  const validateStudent = (student) => {
    if (!student.name) return "Name is required";
    if (
      !Number.isInteger(student.standard) ||
      student.standard < 6 ||
      student.standard > 12
    )
      return "Standard (CLASS) must be between 6 and 12";
    if (!student.gender) return "Gender is required";
    if (!student.medium) return "Medium is required";
    if (!student.school_name) return "School is required";
    if (!student.dob) return "DOB is required";
    if (!student.community) return "Community is required";
    if (!bloodGroups.includes(student.blood_group))
      return "Blood group is invalid";
    if (!student.address) return "Address is required";
    if (!student.parents_occupation) return "Parents occupation is required";
    if (!student.father_name) return "Father name is required";

    const phone = normalizePhoneNumber(student.parent_phone_number);
    if (!/^[6-9]\d{9}$/.test(phone))
      return "MB-PARENTS must be a valid 10-digit Indian number starting with 6, 7, 8, or 9";

    return "";
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadReport(null);
    setCsvPreviewRows([]);
    setError("");

    try {
      const parseResult = await new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => resolve(result),
          error: (parseError) => reject(parseError),
        });
      });

      const rows = parseResult.data || [];
      if (rows.length === 0) throw new Error("Uploaded file is empty");

      setCsvPreviewRows(rows.slice(0, 3));

      let successCount = 0;
      const failedRows = [];

      for (let i = 0; i < rows.length; i += 1) {
        const normalized = normalizeRow(rows[i]);
        const validationError = validateStudent(normalized);
        if (validationError) {
          failedRows.push(`Row ${i + 2}: ${validationError}`);
          continue;
        }
        try {
          await createStudent(normalized);
          successCount += 1;
        } catch (err) {
          failedRows.push(`Row ${i + 2}: ${err.message}`);
        }
      }

      setUploadReport({ total: rows.length, successCount, failedRows });
      setPage(1);
      await loadStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadLoading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    setDeleteLoadingId(id);
    setError("");
    try {
      await deleteStudent(id);
      await loadStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const getAllStudents = async () => {
    let currentPage = 1;
    let totalPages = 1;
    const allStudents = [];
    while (currentPage <= totalPages) {
      const response = await getStudents({
        page: currentPage,
        limit: 100,
        search: "",
        standard: "",
        bloodGroup: "",
        community: "",
      });
      allStudents.push(...response.data);
      totalPages = response.total_pages;
      currentPage += 1;
    }
    return allStudents;
  };

  const replaceInStudent = (student, searchValue, replacementValue) => {
    const fields = [
      "name",
      "father_name",
      "gender",
      "standard",
      "medium",
      "school_name",
      "dob",
      "community",
      "blood_group",
      "address",
      "parent_phone_number",
      "parents_occupation",
    ];
    const updates = {};
    let changed = false;

    for (const field of fields) {
      const value = student[field];
      if (value === null || value === undefined) continue;
      if (typeof value === "number") {
        if (String(value) === searchValue) {
          const replacementNumber = Number(replacementValue);
          if (!Number.isNaN(replacementNumber)) {
            updates[field] = replacementNumber;
            changed = true;
          }
        }
        continue;
      }
      const stringValue = String(value);
      if (stringValue.includes(searchValue)) {
        updates[field] = stringValue.split(searchValue).join(replacementValue);
        changed = true;
      }
    }

    return changed ? updates : null;
  };

  const handleReplaceAll = async () => {
    if (!replaceSearchValue.trim()) {
      setError("Search value is required for replace.");
      return;
    }
    setReplaceLoading(true);
    setReplaceReport("");
    setError("");
    try {
      const allStudents = await getAllStudents();
      let updatedCount = 0;
      let skippedCount = 0;
      for (const student of allStudents) {
        const updates = replaceInStudent(
          student,
          replaceSearchValue,
          replaceWithValue,
        );
        if (!updates) {
          skippedCount += 1;
          continue;
        }
        try {
          await patchStudent(student.id, updates);
          updatedCount += 1;
        } catch (_err) {
          skippedCount += 1;
        }
      }
      setReplaceReport(
        `Updated ${updatedCount} student record(s). Skipped ${skippedCount}.`,
      );
      await loadStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setReplaceLoading(false);
    }
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name || "",
      father_name: student.father_name || "",
      gender: student.gender || "",
      standard: student.standard || "",
      medium: student.medium || "",
      school_name: student.school_name || "",
      dob: student.dob || "",
      community: student.community || "",
      blood_group: student.blood_group || "",
      address: student.address || "",
      parent_phone_number: student.parent_phone_number || "",
      parents_occupation: student.parents_occupation || "",
    });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditLoading(true);
    setError("");
    try {
      await patchStudent(editingStudent.id, {
        ...editForm,
        standard: Number(editForm.standard),
        parent_phone_number: normalizePhoneNumber(editForm.parent_phone_number),
      });
      setEditingStudent(null);
      await loadStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const renderFormFields = (formData, setFormData) => (
    <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">
      {[
        { label: "Name", key: "name", placeholder: "Enter name" },
        {
          label: "Father Name",
          key: "father_name",
          placeholder: "Enter father name",
        },
        {
          label: "Standard (Class)",
          key: "standard",
          type: "number",
          placeholder: "6–12",
          min: 6,
          max: 12,
        },
        {
          label: "Medium",
          key: "medium",
          placeholder: "e.g. Tamil / English",
        },
        {
          label: "School Name",
          key: "school_name",
          placeholder: "Enter school name",
        },
        { label: "DOB", key: "dob", placeholder: "e.g. 01/01/2010" },
        { label: "Address", key: "address", placeholder: "Enter address" },
        {
          label: "Parent Phone (MB-PARENTS)",
          key: "parent_phone_number",
          placeholder: "10-digit Indian number",
        },
        {
          label: "Parents Occupation",
          key: "parents_occupation",
          placeholder: "Enter occupation",
        },
      ].map(({ label, key, type = "text", placeholder, min, max }) => (
        <div key={key}>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {label}
          </label>
          <input
            type={type}
            min={min}
            max={max}
            placeholder={placeholder}
            value={formData[key]}
            onChange={(e) =>
              setFormData({ ...formData, [key]: e.target.value })
            }
            className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400"
            required
          />
        </div>
      ))}
      {/* Gender dropdown */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Gender
        </label>
        <select
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
          className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400"
          required
        >
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>
      {/* Community dropdown */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Community
        </label>
        <select
          value={formData.community}
          onChange={(e) =>
            setFormData({ ...formData, community: e.target.value })
          }
          className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400"
          required
        >
          <option value="">Select</option>
          {communities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      {/* Blood Group dropdown */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Blood Group
        </label>
        <select
          value={formData.blood_group}
          onChange={(e) =>
            setFormData({ ...formData, blood_group: e.target.value })
          }
          className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400"
          required
        >
          <option value="">Select</option>
          {bloodGroups.map((bg) => (
            <option key={bg} value={bg}>
              {bg}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-gray-900">Students</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Add Student
        </button>
      </div>

      <p className="mb-4 text-sm text-gray-500">
        Active filters: {search || "No name search"}, Standard{" "}
        {standard || "All"}, Blood Group {bloodGroup || "All"}, Community{" "}
        {community || "All"}
      </p>

      {/* Search & Filter */}
      <div className="mb-4 rounded-xl bg-white p-4 shadow">
        <h4 className="mb-3 text-lg font-semibold text-gray-900">
          Search & Filter
        </h4>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Search by Name
            </label>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400"
              placeholder="Enter student name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Standard
            </label>
            <select
              value={standard}
              onChange={(e) => {
                setStandard(e.target.value);
                setPage(1);
              }}
              className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All Standards</option>
              {[6, 7, 8, 9, 10, 11, 12].map((std) => (
                <option key={std} value={std}>
                  {std}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Blood Group
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => {
                setBloodGroup(e.target.value);
                setPage(1);
              }}
              className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All Blood Groups</option>
              {bloodGroups.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Community
            </label>
            <select
              value={community}
              onChange={(e) => {
                setCommunity(e.target.value);
                setPage(1);
              }}
              className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All Communities</option>
              {communities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search & Replace */}
        <div className="mt-6">
          <h4 className="mb-3 text-lg font-semibold text-gray-900">
            Search & Replace
          </h4>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Search Value
              </label>
              <input
                value={replaceSearchValue}
                onChange={(e) => setReplaceSearchValue(e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400"
                placeholder="Text or number"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Replace With
              </label>
              <input
                value={replaceWithValue}
                onChange={(e) => setReplaceWithValue(e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400"
                placeholder="Text or number"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleReplaceAll}
                disabled={replaceLoading}
                className="w-full rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {replaceLoading ? "Replacing..." : "Replace All Matches"}
              </button>
            </div>
          </div>
          {replaceReport && (
            <p className="mt-2 text-sm text-green-600">{replaceReport}</p>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Loading students...</p>
      ) : (
        <div className="rounded-xl bg-white p-4 shadow">
          {error && <p className="mb-3 text-red-500">{error}</p>}
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {[
                    "ID",
                    "Name",
                    "Father Name",
                    "Gender",
                    "Standard",
                    "Medium",
                    "Community",
                    "Blood Group",
                    "Phone",
                    "Created Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="border-b border-gray-200 px-3 py-2 text-left text-sm text-gray-900"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="border-b border-gray-200 px-3 py-2">
                      {student.id}
                    </td>
                    <td className="border-b border-gray-200 px-3 py-2">
                      {student.name}
                    </td>
                    <td className="border-b border-gray-200 px-3 py-2">
                      {student.father_name}
                    </td>
                    <td className="border-b border-gray-200 px-3 py-2">
                      {student.gender}
                    </td>
                    <td className="border-b border-gray-200 px-3 py-2">
                      {student.standard}
                    </td>
                    <td className="border-b border-gray-200 px-3 py-2">
                      {student.medium}
                    </td>
                    <td className="border-b border-gray-200 px-3 py-2">
                      {student.community}
                    </td>
                    <td className="border-b border-gray-200 px-3 py-2">
                      {student.blood_group}
                    </td>
                    <td className="border-b border-gray-200 px-3 py-2">
                      {student.parent_phone_number}
                    </td>
                    <td className="border-b border-gray-200 px-3 py-2">
                      {formatDate(student.created_at)}
                    </td>
                    <td className="border-b border-gray-200 px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewingStudent(student)}
                          className="rounded bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEditModal(student)}
                          className="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          disabled={deleteLoadingId === student.id}
                          className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 disabled:opacity-70"
                        >
                          {deleteLoadingId === student.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Prev
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {meta.total_pages} | Total {meta.total}
            </span>
            <button
              disabled={page >= meta.total_pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Next
            </button>
          </div>
          {students.length === 0 && (
            <p className="mt-3 text-sm text-gray-500">No students found.</p>
          )}
        </div>
      )}

      {/* View Modal */}
      {viewingStudent && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Student Details
              </h3>
              <button
                onClick={() => setViewingStudent(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              {[
                ["ID", viewingStudent.id],
                ["Name", viewingStudent.name],
                ["Father Name", viewingStudent.father_name],
                ["Gender", viewingStudent.gender],
                ["Standard", viewingStudent.standard],
                ["Medium", viewingStudent.medium],
                ["School Name", viewingStudent.school_name],
                ["DOB", viewingStudent.dob],
                ["Community", viewingStudent.community],
                ["Blood Group", viewingStudent.blood_group],
                ["Address", viewingStudent.address],
                ["Parent Phone", viewingStudent.parent_phone_number],
                ["Parents Occupation", viewingStudent.parents_occupation],
                ["Created Date", formatDate(viewingStudent.created_at)],
              ].map(([label, value]) => (
                <p key={label}>
                  <span className="font-medium">{label}:</span> {value}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Student
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleEditSave}>
              {renderFormFields(editForm, setEditForm)}
              <div className="flex gap-2">
                <button
                  disabled={editLoading}
                  className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-70"
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Student
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleCreate}>
              {renderFormFields(form, setForm)}
              <button
                disabled={createLoading}
                className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {createLoading ? "Saving..." : "Add Student"}
              </button>
            </form>

            {/* Bulk Upload */}
            <div className="mt-5 rounded-lg border border-gray-200 p-3">
              <h4 className="text-sm font-semibold text-gray-900">
                Bulk Upload (CSV)
              </h4>
              <p className="mt-1 text-xs text-gray-500">
                Required columns: NAME, FATHER NAME, GENDER, CLASS, MEDIUM,
                SCHOOL, DOB, COMMUNITY, BLOOD GROUP, ADDRESS, MB-PARENTS,
                PARENTS OCCUPATION
              </p>
              <label className="mt-3 inline-block cursor-pointer rounded bg-purple-500 px-4 py-2 text-sm text-white hover:bg-purple-600">
                {uploadLoading ? "Uploading..." : "Bulk Upload"}
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleBulkUpload}
                  disabled={uploadLoading}
                />
              </label>
              {csvPreviewRows.length > 0 && (
                <div className="mt-3 rounded bg-gray-50 p-2 text-xs text-gray-700">
                  <p className="mb-1 font-medium">Preview (first 3 rows):</p>
                  <pre className="max-h-28 overflow-y-auto whitespace-pre-wrap">
                    {JSON.stringify(csvPreviewRows, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Report */}
      {uploadReport && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3 text-sm">
          <p className="text-green-600">Success: {uploadReport.successCount}</p>
          <p className="text-gray-600">Total rows: {uploadReport.total}</p>
          <p className="text-red-500">Failed: {uploadReport.failedRows.length}</p>
          {uploadReport.failedRows.length > 0 && (
            <ul className="mt-2 max-h-28 list-disc overflow-y-auto pl-5 text-red-500">
              {uploadReport.failedRows.map((rowError) => (
                <li key={rowError}>{rowError}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
    </div>
  );
}