export const CATEGORIES = ["Road", "Water", "Electricity", "Traffic", "Environment", "Other"] as const;
export const STATUSES = ["submitted", "in_review", "accepted", "in_progress", "resolved", "rejected"] as const;
export type Category = typeof CATEGORIES[number];
export type Status = typeof STATUSES[number];
export type Role = "user" | "admin";

export const TRANSITIONS: Record<Status, Status[]> = {
  submitted: ["in_review"], in_review: ["accepted", "rejected"], accepted: ["in_progress"],
  in_progress: ["resolved"], resolved: [], rejected: [],
};

export function canTransition(from: Status, to: Status) { return TRANSITIONS[from]?.includes(to) ?? false; }
export function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = 6371000, rad = (n: number) => (n * Math.PI) / 180;
  const dLat = rad(bLat - aLat), dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}
export function hasRole(user: { role: Role } | undefined, role: Role) { return user?.role === role || user?.role === "admin"; }

export type ReportInput = { title: string; description: string; category: Category; latitude: number; longitude: number };
export type Report = ReportInput & { id: string; issueId: string; reporterId: string; createdAt: string };
export type Issue = { id: string; title: string; description: string; category: Category; status: Status; priority: "low" | "normal" | "high"; latitude: number; longitude: number; reportCount: number; createdAt: string; history: { status: Status; changedAt: string; note?: string }[] };

export function validateReport(body: unknown): ReportInput | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const value = body as Record<string, unknown>, title = typeof value.title === "string" ? value.title.trim() : "";
  const description = typeof value.description === "string" ? value.description.trim() : "";
  const category = value.category, latitude = Number(value.latitude), longitude = Number(value.longitude);
  if (!title || title.length > 160 || !description || description.length > 3000 || !CATEGORIES.includes(category as Category) || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;
  return { title, description, category: category as Category, latitude, longitude };
}
