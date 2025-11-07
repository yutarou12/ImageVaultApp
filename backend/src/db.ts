import fs from "fs/promises";
import path from "path";

export type StoredImage = {
  id: string; // storage key or local id
  name: string;
  mimeType?: string;
  size?: number;
  createdTime?: string;
  // source can be 'r2' (Cloudflare R2) or 'local'
  source: "r2" | "local";
  // when stored in R2
  r2Key?: string;
  publicUrl?: string;
  // when stored locally
  localPath?: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "images.json");

async function ensureDb() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.stat(DB_FILE);
  } catch (e) {
    await fs.writeFile(DB_FILE, JSON.stringify([]));
  }
}

export async function getAll(): Promise<StoredImage[]> {
  await ensureDb();
  const raw = await fs.readFile(DB_FILE, "utf8");
  return JSON.parse(raw) as StoredImage[];
}

export async function save(img: StoredImage): Promise<void> {
  const all = await getAll();
  all.unshift(img);
  await fs.writeFile(DB_FILE, JSON.stringify(all, null, 2));
}

export async function remove(id: string): Promise<StoredImage | null> {
  const all = await getAll();
  const idx = all.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  const [removed] = all.splice(idx, 1);
  await fs.writeFile(DB_FILE, JSON.stringify(all, null, 2));
  return removed;
}

export async function find(id: string): Promise<StoredImage | null> {
  const all = await getAll();
  return all.find((x) => x.id === id) ?? null;
}
