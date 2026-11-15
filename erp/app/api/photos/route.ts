import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "ورود لازم است." }, { status: 401 });
  if (!env.BUCKET) return Response.json({ error: "فضای عکس در دسترس نیست." }, { status: 503 });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
  if (Number(request.headers.get("content-length")) > 6 * 1024 * 1024) return Response.json({ error: "حداکثر حجم عکس ۵ مگابایت است." }, { status: 413 });
  const form = await request.formData(), file = form.get("file");
  if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) return Response.json({ error: "عکس JPG، PNG یا WebP تا ۵ مگابایت انتخاب کن." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff, png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!jpeg && !png && !webp) return Response.json({ error: "محتوای فایل تصویر معتبر نیست." }, { status: 400 });
  const id = crypto.randomUUID();
  await env.BUCKET.put(`${user.userId}/${id}`, bytes, { httpMetadata: { contentType: jpeg ? "image/jpeg" : png ? "image/png" : "image/webp" } });
  return Response.json({ url: `/api/photos/${id}` }, { headers: { "Cache-Control": "no-store" } });
}
