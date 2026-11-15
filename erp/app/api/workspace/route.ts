import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { applyCommand, createSeed, type Command, type Workspace } from "@/lib/erp";
export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "برای ذخیرهٔ اطلاعات، وارد حساب شو." }, 401);
  if (!env.DB) return json({ error: "پایگاه داده در دسترس نیست." }, 503);
  const existing = await env.DB.prepare("SELECT payload, revision FROM erp_workspaces WHERE owner_id = ?").bind(user.userId).first<{ payload: string; revision: number }>();
  if (existing) return json({ state: JSON.parse(existing.payload), revision: existing.revision });
  await env.DB.prepare("INSERT OR IGNORE INTO erp_workspaces (owner_id, payload, revision, updated_at) VALUES (?, ?, 0, ?)").bind(user.userId, JSON.stringify(createSeed()), new Date().toISOString()).run();
  const row = await env.DB.prepare("SELECT payload, revision FROM erp_workspaces WHERE owner_id = ?").bind(user.userId).first<{ payload: string; revision: number }>();
  return json({ state: JSON.parse(row!.payload), revision: row!.revision });
}
export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "ابتدا وارد حساب شو." }, 401);
  if (!env.DB) return json({ error: "پایگاه داده در دسترس نیست." }, 503);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "مبدأ درخواست معتبر نیست." }, 403);
  try {
    const raw = await request.text();
    if (raw.length > 10000) return json({ error: "درخواست بیش از حد بزرگ است." }, 413);
    const body = JSON.parse(raw) as { revision: number; command: Command };
    if (!Number.isInteger(body.revision) || !body.command || typeof body.command.type !== "string") return json({ error: "درخواست معتبر نیست." }, 400);
    const row = await env.DB.prepare("SELECT payload, revision FROM erp_workspaces WHERE owner_id = ?").bind(user.userId).first<{ payload: string; revision: number }>();
    if (!row || row.revision !== body.revision) return json({ error: "اطلاعات در دستگاه دیگری تغییر کرده؛ صفحه همگام شد. دوباره ثبت کن.", conflict: true }, 409);
    const result = applyCommand(JSON.parse(row.payload) as Workspace, body.command, user.fullName || "مدیر سامانه");
    const write = await env.DB.prepare("UPDATE erp_workspaces SET payload = ?, revision = revision + 1, updated_at = ? WHERE owner_id = ? AND revision = ?").bind(JSON.stringify(result.state), new Date().toISOString(), user.userId, body.revision).run();
    if (write.meta.changes !== 1) return json({ error: "اطلاعات تغییر کرده؛ دوباره تلاش کن.", conflict: true }, 409);
    return json({ ...result, revision: body.revision + 1 });
  } catch (error) { return json({ error: error instanceof Error ? error.message : "ثبت اطلاعات انجام نشد." }, 400); }
}
