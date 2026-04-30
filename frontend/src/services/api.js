const API_BASE_URL = "http://localhost:8000";

function getToken() {
  return localStorage.getItem("token");
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    throw new Error(data?.detail || `Request failed with status ${response.status}`);
  }
  return data;
}

export function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getDashboard() {
  return request("/dashboard/stats");
}

export function getStudents({ page = 1, limit = 10, search = "", standard = "", bloodGroup = "" }) {
  const query = new URLSearchParams();
  query.set("page", page);
  query.set("limit", limit);
  if (search) query.set("search", search);
  if (standard) query.set("standard", standard);
  if (bloodGroup) query.set("blood_group", bloodGroup);

  return request(`/students?${query.toString()}`);
}

export function getStudentById(id) {
  return request(`/students/${id}`);
}

export function createStudent(payload) {
  return request("/students", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateStudent(id, payload) {
  return request(`/students/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function patchStudent(id, payload) {
  return request(`/students/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteStudent(id) {
  return request(`/students/${id}`, { method: "DELETE" });
}
