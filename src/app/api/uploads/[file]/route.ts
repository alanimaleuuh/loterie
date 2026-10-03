import { readUpload } from "@/server/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const f = await readUpload(file);
  if (!f) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(f.data), {
    headers: {
      "Content-Type": f.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
