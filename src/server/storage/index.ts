import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Stockage des fichiers (photos de lots). Prototype : disque local (storage/uploads),
 * servi par /api/uploads/[file]. Production : implémenter un StorageProvider S3 / R2 /
 * Cloudinary et retourner une URL CDN.
 */
export interface StorageProvider {
  save(data: Buffer, ext: string): Promise<string>; // retourne l'URL publique
}

const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");
const MAX_BYTES = 3 * 1024 * 1024;

const SIGNATURES: { ext: string; mime: string; test: (b: Buffer) => boolean }[] = [
  { ext: "jpg", mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", mime: "image/png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "webp", mime: "image/webp", test: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
];

export const MIME_BY_EXT: Record<string, string> = Object.fromEntries(SIGNATURES.map((s) => [s.ext, s.mime]));

class LocalStorage implements StorageProvider {
  async save(data: Buffer, ext: string) {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${Date.now().toString(36)}-${randomBytes(8).toString("hex")}.${ext}`;
    await writeFile(path.join(UPLOAD_DIR, name), data);
    return `/api/uploads/${name}`;
  }
}

export const storage: StorageProvider = new LocalStorage();

/** Valide un fichier image envoyé (taille + signature binaire réelle, pas seulement l'extension) */
export async function saveImageUpload(file: File): Promise<string> {
  if (file.size === 0) throw new Error("Fichier vide");
  if (file.size > MAX_BYTES) throw new Error("Image trop lourde (3 Mo maximum)");
  const buf = Buffer.from(await file.arrayBuffer());
  const sig = SIGNATURES.find((s) => s.test(buf));
  if (!sig) throw new Error("Format non supporté (JPEG, PNG ou WebP uniquement)");
  return storage.save(buf, sig.ext);
}

export async function readUpload(name: string): Promise<{ data: Buffer; mime: string } | null> {
  if (!/^[a-z0-9]+-[a-f0-9]{16}\.(jpg|png|webp)$/.test(name)) return null;
  try {
    const data = await readFile(path.join(UPLOAD_DIR, name));
    return { data, mime: MIME_BY_EXT[name.split(".").pop()!] };
  } catch {
    return null;
  }
}
