import { auth } from "./firebase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };

  if (auth.currentUser) {
    headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Something went wrong.");
  }

  return response.status === 204 ? null : response.json();
}

export const issueApi = {
  list: () => request("/issues"),
  create: (issue) => request("/issues", { method: "POST", body: JSON.stringify(issue) }),
  update: (id, issue) => request(`/issues/${id}`, { method: "PUT", body: JSON.stringify(issue) }),
  updateStatus: (id, status) => request(`/issues/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }),
  remove: (id) => request(`/issues/${id}`, { method: "DELETE" }),
};

export function searchPlaces(query) {
  return request(`/geocode?q=${encodeURIComponent(query)}`);
}

export function reverseGeocode(latitude, longitude) {
  return request(`/geocode/reverse?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}`);
}

export async function getApproximateLocation() {
  const response = await fetch("https://ipwho.is/");
  const data = await response.json();

  if (!response.ok || !data.success || !Number.isFinite(data.latitude) || !Number.isFinite(data.longitude)) {
    throw new Error("Approximate location is unavailable.");
  }

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    label: [data.city, data.region, data.country].filter(Boolean).join(", "),
  };
}
