import { useEffect, useState } from "react";
import Papa from "papaparse";
import { createStudent, deleteStudent, getStudents, patchStudent } from "../services/api";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const initialForm = {
  name: "",
  standard: "",
  age: "",
  blood_group: "",
  email: "",
  father_name: "",
  father_occupation: "",
  mother_name: "",
  mother_occupation: "",
  school_name: "",
  address: "",
  phone_number: "",
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1 });
  const [search, setSearch] = useState("");
  const [standard, setStandard] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
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

  const loadStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getStudents({ page, limit: 10, search, standard, bloodGroup });
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
  }, [page, search, standard, bloodGroup]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setCreateLoading(true);
    try {
      await createStudent({
        ...form,
        standard: Number(form.standard),
        age: Number(form.age),
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
    const student = {
      name: String(row.name ?? row.Name ?? "").trim(),
      standard: Number(row.standard ?? row.Standard ?? ""),
      age: Number(row.age ?? row.Age ?? ""),
      blood_group: String(row.blood_group ?? row.BloodGroup ?? row["blood group"] ?? "").trim(),
      email: String(row.email ?? row.Email ?? "").trim(),
      father_name: String(row.father_name ?? row.FatherName ?? row["father name"] ?? "").trim(),
      father_occupation: String(row.father_occupation ?? row.FatherOccupation ?? row["father occupation"] ?? "").trim(),
      mother_name: String(row.mother_name ?? row.MotherName ?? row["mother name"] ?? "").trim(),
      mother_occupation: String(row.mother_occupation ?? row.MotherOccupation ?? row["mother occupation"] ?? "").trim(),
      school_name: String(row.school_name ?? row.SchoolName ?? row["school name"] ?? "").trim(),
      address: String(row.address ?? row.Address ?? "").trim(),
      phone_number: String(row.phone_number ?? row.PhoneNumber ?? row["phone number"] ?? "").trim(),
    };
    return student;
  };

  const validateStudent = (student) => {
    if (!student.name) return "Name is required";
    if (!Number.isInteger(student.standard) || student.standard < 6 || student.standard > 12) return "Standard must be between 6 and 12";
    if (!Number.isInteger(student.age) || student.age < 3 || student.age > 30) return "Age must be between 3 and 30";
    if (!bloodGroups.includes(student.blood_group)) return "Blood group is invalid";
    if (!student.email) return "Email is required";
    if (!student.father_name || !student.father_occupation || !student.mother_name || !student.mother_occupation || !student.school_name || !student.address) {
      return "Parent names, occupations, school and address fields are required";
    }
    if (student.phone_number.length < 7 || student.phone_number.length > 15) return "Phone number length must be 7-15";
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

      if (rows.length === 0) {
        throw new Error("Uploaded file is empty");
      }
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

      setUploadReport({
        total: rows.length,
        successCount,
        failedRows,
      });
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
    const shouldDelete = window.confirm("Delete this student?");
    if (!shouldDelete) return;
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

  const openEditModal = (student) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name || "",
      standard: student.standard || "",
      age: student.age || "",
      blood_group: student.blood_group || "",
      email: student.email || "",
      father_name: student.father_name || "",
      father_occupation: student.father_occupation || "",
      mother_name: student.mother_name || "",
      mother_occupation: student.mother_occupation || "",
      school_name: student.school_name || "",
      address: student.address || "",
      phone_number: student.phone_number || "",
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
        age: Number(editForm.age),
      });
      setEditingStudent(null);
      await loadStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-gray-900">Students</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Add Student
          </button>
        </div>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        Active filters: {search || "No name search"}, Standard {standard || "All"}, Blood Group {bloodGroup || "All"}
      </p>
      <div className="mb-4 rounded-xl bg-white p-4 shadow">
        <h4 className="mb-3 text-lg font-semibold text-gray-900">Search & Filter</h4>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Search by Name</label>
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
            <label className="mb-1 block text-sm font-medium text-gray-700">Standard</label>
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
            <label className="mb-1 block text-sm font-medium text-gray-700">Blood Group</label>
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
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading students...</p>
      ) : (
        <div className="rounded-xl bg-white p-4 shadow">
          {error && <p className="mb-3 text-red-500">{error}</p>}
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border-b border-gray-200 px-3 py-2 text-left text-sm text-gray-900">ID</th>
                  <th className="border-b border-gray-200 px-3 py-2 text-left text-sm text-gray-900">Name</th>
                  <th className="border-b border-gray-200 px-3 py-2 text-left text-sm text-gray-900">Standard</th>
                  <th className="border-b border-gray-200 px-3 py-2 text-left text-sm text-gray-900">Blood Group</th>
                  <th className="border-b border-gray-200 px-3 py-2 text-left text-sm text-gray-900">Phone</th>
                  <th className="border-b border-gray-200 px-3 py-2 text-left text-sm text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="border-b border-gray-200 px-3 py-2">{student.id}</td>
                    <td className="border-b border-gray-200 px-3 py-2">{student.name}</td>
                    <td className="border-b border-gray-200 px-3 py-2">{student.standard}</td>
                    <td className="border-b border-gray-200 px-3 py-2">{student.blood_group}</td>
                    <td className="border-b border-gray-200 px-3 py-2">{student.phone_number}</td>
                    <td className="border-b border-gray-200 px-3 py-2">
                      <div className="flex gap-2">
                        <button onClick={() => openEditModal(student)} className="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700">
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          disabled={deleteLoadingId === student.id}
                          className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 disabled:opacity-70"
                        >
                          {deleteLoadingId === student.id ? "Deleting..." : "Delete"}
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
          {students.length === 0 && <p className="mt-3 text-sm text-gray-500">No students found.</p>}
        </div>
      )}

      {editingStudent && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Edit Student</h3>
              <button onClick={() => setEditingStudent(null)} className="text-sm text-gray-500 hover:text-gray-700">
                Cancel
              </button>
            </div>

            <form onSubmit={handleEditSave}>
              <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Standard</label>
                  <input type="number" min="6" max="12" value={editForm.standard} onChange={(e) => setEditForm({ ...editForm, standard: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Age</label>
                  <input type="number" min="3" max="30" value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Blood Group</label>
                  <select value={editForm.blood_group} onChange={(e) => setEditForm({ ...editForm, blood_group: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required>
                    <option value="">Select</option>
                    {bloodGroups.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Father Name</label>
                  <input value={editForm.father_name} onChange={(e) => setEditForm({ ...editForm, father_name: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Father Occupation</label>
                  <input value={editForm.father_occupation} onChange={(e) => setEditForm({ ...editForm, father_occupation: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Mother Name</label>
                  <input value={editForm.mother_name} onChange={(e) => setEditForm({ ...editForm, mother_name: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Mother Occupation</label>
                  <input value={editForm.mother_occupation} onChange={(e) => setEditForm({ ...editForm, mother_occupation: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">School Name</label>
                  <input value={editForm.school_name} onChange={(e) => setEditForm({ ...editForm, school_name: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                  <input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number</label>
                  <input value={editForm.phone_number} onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
              </div>
              <div className="flex gap-2">
                <button disabled={editLoading} className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-70">
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditingStudent(null)} className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Add Student</h3>
              <button onClick={() => setShowAddModal(false)} className="text-sm text-gray-500 hover:text-gray-700">
                Close
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                  <input placeholder="Enter name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Standard</label>
                  <input type="number" min="6" max="12" placeholder="6-12" value={form.standard} onChange={(e) => setForm({ ...form, standard: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Age</label>
                  <input type="number" min="3" max="30" placeholder="Enter age" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Blood Group</label>
                  <select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required>
                    <option value="">Select</option>
                    {bloodGroups.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Father Name</label>
                  <input placeholder="Enter father name" value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Father Occupation</label>
                  <input placeholder="Enter father occupation" value={form.father_occupation} onChange={(e) => setForm({ ...form, father_occupation: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Mother Name</label>
                  <input placeholder="Enter mother name" value={form.mother_name} onChange={(e) => setForm({ ...form, mother_name: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Mother Occupation</label>
                  <input placeholder="Enter mother occupation" value={form.mother_occupation} onChange={(e) => setForm({ ...form, mother_occupation: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" placeholder="Enter email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">School Name</label>
                  <input placeholder="Enter school name" value={form.school_name} onChange={(e) => setForm({ ...form, school_name: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                  <input placeholder="Enter address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number</label>
                  <input placeholder="Enter phone number" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-2 focus:ring-2 focus:ring-indigo-400" required />
                </div>
              </div>
              <button
                disabled={createLoading}
                className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {createLoading ? "Saving..." : "Add Student"}
              </button>
            </form>

            <div className="mt-5 rounded-lg border border-gray-200 p-3">
              <h4 className="text-sm font-semibold text-gray-900">Bulk Upload (CSV)</h4>
              <p className="mt-1 text-xs text-gray-500">
                Required columns: name, standard, age, blood_group, email, father_name, father_occupation, mother_name, mother_occupation, school_name, address, phone_number
              </p>
              <label className="mt-3 inline-block cursor-pointer rounded bg-purple-500 px-4 py-2 text-sm text-white hover:bg-purple-600">
                {uploadLoading ? "Uploading..." : "Bulk Upload"}
                <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} disabled={uploadLoading} />
              </label>

              {csvPreviewRows.length > 0 && (
                <div className="mt-3 rounded bg-gray-50 p-2 text-xs text-gray-700">
                  <p className="mb-1 font-medium">Preview (first 3 rows):</p>
                  <pre className="max-h-28 overflow-y-auto whitespace-pre-wrap">{JSON.stringify(csvPreviewRows, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
