const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not defined");
}

function getToken() {
  const token = localStorage.getItem("token");
  if (!token || token === "null" || token === "undefined") return null;
  return token;
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

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new Error("Network error. Please check your connection.", err);
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";

  let data = null;
  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        `Request failed with status ${response.status}`,
    );
  }

  return data;
}

// 🔐 AUTH

export async function login(email, password) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data?.access_token) {
    localStorage.setItem("token", data.access_token);
  } else {
    throw new Error("No access token received");
  }

  return data;
}

export function logout() {
  localStorage.removeItem("token");
}

// 📊 Dashboard

export function getDashboard() {
  return request("/dashboard/stats");
}

// 👨‍🎓 Students

export function getStudents({
  page = 1,
  limit = 10,
  search = "",
  standard = "",
  bloodGroup = "",
  community = "", // ✅ was missing
} = {}) {
  const query = new URLSearchParams();

  query.set("page", page);
  query.set("limit", limit);

  if (search) query.set("search", search);
  if (standard) query.set("standard", standard);
  if (bloodGroup) query.set("blood_group", bloodGroup);
  if (community) query.set("community", community); // ✅ was missing

  return request(`/students?${query.toString()}`);
}

export function getStudentById(id) {
  if (!id) throw new Error("Student ID is required");
  return request(`/students/${id}`);
}

export function createStudent(payload) {
  return request("/students", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateStudent(id, payload) {
  if (!id) throw new Error("Student ID is required");
  return request(`/students/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function patchStudent(id, payload) {
  if (!id) throw new Error("Student ID is required");
  return request(`/students/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteStudent(id) {
  if (!id) throw new Error("Student ID is required");
  return request(`/students/${id}`, {
    method: "DELETE",
  });
}