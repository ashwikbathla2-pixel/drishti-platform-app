import axios from "axios";

const BASE = `${process.env.REACT_APP_BACKEND_URL}/api/v1`;

const client = axios.create({ baseURL: BASE });

export const TOKEN_KEY = "drishti_token";
export const USER_KEY = "drishti_user";

client.interceptors.request.use((config) => {
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export function uploadUrl(path) {
  return `${BASE}${path}`;
}

// ---- auth ----
export async function login(role) {
  const { data } = await client.post("/auth/login", { role });
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}
export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
export function isAuthed() {
  return !!localStorage.getItem(TOKEN_KEY);
}

// ---- dashboard / queue / stats ----
export async function fetchStats() { return (await client.get("/stats")).data; }
export async function fetchQueue() { return (await client.get("/queue")).data.items; }
export async function fetchScheme() { return (await client.get("/scheme")).data; }
export async function fetchDevices() { return (await client.get("/devices")).data.items; }

// ---- bundle / marking ----
export async function fetchBundleDetail(id) { return (await client.get(`/bundle/${id}`)).data; }
export function bundlePageImageUrl(id, pageNo) { return `${BASE}/bundle/${id}/page/${pageNo}/image`; }
export async function aiReadBundle(id) { return (await client.post(`/ai-read/${id}`)).data; }
export async function submitEvaluation(id, marks, pagesViewed, final) {
  return (await client.post(`/evaluate/${id}`, { marks, pages_viewed: pagesViewed, final })).data;
}

// ---- deviations / audit ----
export async function fetchDeviations(status = "open") {
  return (await client.get(`/deviations`, { params: { status } })).data.items;
}
export async function approveDeviation(id) { return (await client.post(`/deviations/${id}/approve`)).data; }
export async function reevaluateDeviation(id) { return (await client.post(`/deviations/${id}/reevaluate`)).data; }
export async function fetchAudit(id) { return (await client.get(`/audit/${id}`)).data; }

// ---- pdf pipeline ----
export async function uploadPdf(file, candidate, subject) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("candidate", candidate);
  fd.append("subject", subject);
  return (await client.post("/pdf/upload", fd, { headers: { "Content-Type": "multipart/form-data" } })).data;
}
export async function getPdfJob(jobId) { return (await client.get(`/pdf/${jobId}`)).data; }
export async function replacePdfPage(jobId, pageNo, imageFile) {
  const fd = new FormData();
  fd.append("file", imageFile);
  return (await client.post(`/pdf/${jobId}/page/${pageNo}/replace`, fd, { headers: { "Content-Type": "multipart/form-data" } })).data;
}
export async function finalizePdfJob(jobId) { return (await client.post(`/pdf/${jobId}/finalize`)).data; }
export function jobPageImageUrl(jobId, pageNo) { return `${BASE}/pdf/${jobId}/page/${pageNo}/image`; }
export function finalPdfUrl(jobId) { return `${BASE}/pdf/${jobId}/final.pdf`; }

// ---- generations ----
export async function generateAnswer(prompt, subject) {
  return (await client.post("/generate", { prompt, subject })).data;
}
export async function fetchGenerations() { return (await client.get("/generations")).data.items; }
export async function fetchGeneration(id) { return (await client.get(`/generations/${id}`)).data; }

export default client;
