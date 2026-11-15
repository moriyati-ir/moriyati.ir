import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return new Response(null, { status: 401 });
  const { id } = await context.params;
  if (!/^[a-f0-9-]{36}$/.test(id) || !env.BUCKET) return new Response(null, { status: 404 });
  const object = await env.BUCKET.get(`${user.userId}/${id}`);
  if (!object) return new Response(null, { status: 404 });
  return new Response(object.body, { headers: { "Content-Type": object.httpMetadata?.contentType || "image/jpeg", "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" } });
}
