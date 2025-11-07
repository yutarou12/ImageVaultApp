import axios from "axios";

export interface ImageMeta {
  id: string; // local id or google drive file id
  name: string;
  mimeType: string;
  size: number;
  createdTime?: string;
}

const api = axios.create({
  baseURL: "/api",
  withCredentials: false,
});

export async function listImages(): Promise<ImageMeta[]> {
  const r = await api.get("/images");
  return r.data;
}

export async function uploadImage(file: File): Promise<ImageMeta> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await api.post("/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return r.data;
}

export function downloadImage(id: string) {
  // open in new tab
  const href = `/api/download/${id}`;
  window.open(href, "_blank");
}

export async function deleteImage(id: string) {
  const r = await api.delete(`/images/${id}`);
  return r.data;
}

export default api;
