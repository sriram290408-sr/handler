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

export function getTeachers(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  return request(`/teachers?${query.toString()}`);
}

export async function createTeacher(payload) {
  const formattedPayload = {
    name: String(payload.name || "").trim(),

    gender: String(payload.gender || "").trim(),

    qualification: String(payload.qualification || "").trim(),

    experience: Number(payload.experience || 0),

    phone_number: String(payload.phone_number || payload.phone || "").trim(),

    email: String(payload.email || "").trim(),

    address: String(payload.address || "").trim(),

    subjects: Array.isArray(payload.subjects)
      ? payload.subjects.map((s) => String(s).trim())
      : [],

    assigned_classes: Array.isArray(payload.assigned_classes)
      ? payload.assigned_classes.map((cls) =>
          String(cls).replace("Std ", "").trim(),
        )
      : [],
  };

  console.log("CREATING TEACHER PAYLOAD:", formattedPayload);

  return request("/teachers", {
    method: "POST",

    body: JSON.stringify(formattedPayload),
  });
}

export async function patchTeacher(id, payload) {
  if (!id) {
    throw new Error("Teacher ID is required");
  }

  const formattedPayload = {
    ...payload,
  };

  // FIX PHONE FIELD
  if (payload.phone) {
    formattedPayload.phone_number = payload.phone;

    delete formattedPayload.phone;
  }

  // EXPERIENCE => NUMBER
  if (payload.experience !== undefined) {
    formattedPayload.experience = Number(payload.experience);
  }

  // SUBJECTS => STRING ARRAY
  if (Array.isArray(payload.subjects)) {
    formattedPayload.subjects = payload.subjects.map((s) => String(s).trim());
  }

  // CLASSES => STRING ARRAY
  if (Array.isArray(payload.assigned_classes)) {
    formattedPayload.assigned_classes = payload.assigned_classes.map((cls) =>
      String(cls).replace("Std ", "").trim(),
    );
  }

  console.log("UPDATING TEACHER PAYLOAD:", formattedPayload);

  return request(`/teachers/${id}`, {
    method: "PATCH",

    body: JSON.stringify(formattedPayload),
  });
}

export async function deleteTeacher(id) {
  if (!id) {
    throw new Error("Teacher ID is required");
  }

  return request(`/teachers/${id}`, {
    method: "DELETE",
  });
}
