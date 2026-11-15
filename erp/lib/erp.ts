import { seedFactory, applyFactoryCommand, type FactoryData } from "./factory.ts";
export type Metal = "silver" | "gold";
export type Session = { id: string; operatorId: string; role: string; stage: number; start: string; end?: string };
export type Batch = { id: string; metal: Metal; source: string; owner: string; weight: number; assay: number; stage: number; priority: string; created: string; note: string; sessions: Session[]; output?: number; outputAssay?: number; recoverable?: number };
export type Material = { id: string; name: string; category: string; quantity: number; unit: string; minimum: number; metal?: Metal; assay?: number };
export type Asset = { id: string; name: string; kind: string; tag: string; heat: boolean; status: "active" | "retired" | "maintenance"; cycles: number; grams: number; maxCycles: number; reason?: string; retiredAt?: string; replaces?: string };
export type Product = { id: string; serial: string; collection: string; weight: number; assay: number; metal: Metal; batchId: string; packaging: string; nfc: string; front: string; back: string; created: string };
export type Operator = { id: string; name: string; role: string; initials: string };
export type Log = { id: string; time: string; text: string; type: "production" | "inventory" | "asset" | "product" | "warning"; batchId?: string; actor: string };
export type Movement = { id: string; materialId: string; delta: number; batchId: string; note: string; time: string };
export type AssetUse = { id: string; assetId: string; batchId: string; grams: number; operatorId: string; time: string };
export type Workspace = { factory?: FactoryData; schema: 1; batches: Batch[]; inventory: Material[]; assets: Asset[]; products: Product[]; operators: Operator[]; logs: Log[]; movements: Movement[]; assetUses: AssetUse[] };
export type Command = { type: string; data: Record<string, unknown> };
export const stages = ["ورود و توزین", "عیارسنجی", "پالایش", "ذوب و ریخته‌گری", "کنترل کیفیت", "تکمیل‌شده"];
export const metalName = (m: Metal) => m === "gold" ? "طلا" : "نقره";
export const fine = (weight: number, assay: number) => weight * assay / 1000;
export const collections = [
  { name: "Celestial", fa: "شمش ضربی طلا", metal: "gold" as Metal, assay: 995, weights: [1, 5, 10, 20, 31.1034768] },
  { name: "Artwork", fa: "شمش هنری طلا", metal: "gold" as Metal, assay: 995, weights: [50, 100] },
  { name: "Courtyard", fa: "شمش ریختگی طلا", metal: "gold" as Metal, assay: 995, weights: [250, 500, 1000] },
  { name: "Constellation", fa: "شمش ضربی نقره", metal: "silver" as Metal, assay: 999.9, weights: [10, 20, 31.1034768, 50, 100] },
  { name: "Argentum", fa: "گرانول نقره", metal: "silver" as Metal, assay: 999.9, weights: [1000, 2000, 5000, 10000] },
  { name: "Investment", fa: "تبلت سرمایه‌گذاری نقره", metal: "silver" as Metal, assay: 990, weights: [100] },
  { name: "Bespoke Edition", fa: "سفارش اختصاصی", metal: "gold" as Metal, assay: 995, weights: [1, 5, 10, 20, 31.1034768, 50, 100] },
];

export function createSeed(): Workspace {
  const now = new Date();
  const at = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();
  return {
    schema: 1, factory: seedFactory(),
    operators: [
      { id: "OP-01", name: "اپراتور نمونه ۱", role: "پالایش", initials: "پ۱" },
      { id: "OP-02", name: "اپراتور نمونه ۲", role: "ذوب و ریخته‌گری", initials: "ذ۲" },
      { id: "OP-03", name: "اپراتور نمونه ۳", role: "آزمایشگاه و عیارسنجی", initials: "آ۳" },
      { id: "OP-04", name: "اپراتور نمونه ۴", role: "کنترل کیفیت و بسته‌بندی", initials: "ک۴" },
    ],
    batches: [
      { id: "MOR-AG-0048", metal: "silver", source: "نقرهٔ ورودی نمونه", owner: "موجودی موریاتی · نمونه", weight: 40000, assay: 850, stage: 2, priority: "عادی", created: at(5), note: "بچ نمونه برای بررسی مسیر پالایش و ثبت کار افراد.", sessions: [{ id: "S-01", operatorId: "OP-03", role: "عیارسنج", stage: 1, start: at(4), end: at(3.5) }, { id: "S-02", operatorId: "OP-01", role: "اپراتور پالایش", stage: 2, start: at(2) }] },
      { id: "MOR-AU-0012", metal: "gold", source: "طلای ورودی نمونه", owner: "سفارش آزمایشی", weight: 620, assay: 995, stage: 3, priority: "فوری", created: at(8), note: "نمونهٔ مسیر تولید مجموعهٔ Celestial.", sessions: [{ id: "S-03", operatorId: "OP-02", role: "اپراتور ذوب", stage: 3, start: at(1) }] },
      { id: "MOR-AG-0047", metal: "silver", source: "نقرهٔ پالایش‌شده نمونه", owner: "موجودی موریاتی · نمونه", weight: 15000, assay: 999.9, stage: 4, priority: "عادی", created: at(28), note: "در انتظار ثبت نتیجهٔ کنترل کیفیت.", sessions: [] },
      { id: "MOR-AG-0049", metal: "silver", source: "نقرهٔ ورودی نمونه", owner: "محمولهٔ نمونه ۲", weight: 12500, assay: 920, stage: 1, priority: "عادی", created: at(1.5), note: "", sessions: [] },
      { id: "MOR-AG-0046", metal: "silver", source: "نقرهٔ ورودی نمونه", owner: "موجودی موریاتی · نمونه", weight: 10100, assay: 995, stage: 5, priority: "عادی", created: at(54), note: "بچ تکمیل‌شدهٔ نمونه؛ تراز برحسب گرم فلز خالص.", sessions: [{ id: "S-04", operatorId: "OP-02", role: "اپراتور ذوب", stage: 3, start: at(30), end: at(28) }], output: 10000, outputAssay: 999.9, recoverable: 48.5 },
    ],
    inventory: [
      { id: "MAT-AG-9999", name: "نقرهٔ خالص 999.9", category: "فلز گرانبها", quantity: 8000, unit: "گرم", minimum: 2000, metal: "silver", assay: 999.9 },
      { id: "MAT-AU-995", name: "طلای 995.0", category: "فلز گرانبها", quantity: 1250, unit: "گرم", minimum: 500, metal: "gold", assay: 995 },
      { id: "MAT-HNO3", name: "اسید نیتریک ۵۵٪", category: "مواد شیمیایی", quantity: 120, unit: "لیتر", minimum: 150 },
      { id: "MAT-WATER", name: "آب دیونیزه", category: "مواد شیمیایی", quantity: 850, unit: "لیتر", minimum: 200 },
      { id: "MAT-CARD", name: "کارت بسته‌بندی Constellation", category: "بسته‌بندی", quantity: 280, unit: "عدد", minimum: 100 },
      { id: "MAT-GLOVE", name: "دستکش مصرفی", category: "ملزومات", quantity: 24, unit: "جفت", minimum: 30 },
    ],
    assets: [
      { id: "EQ-CR-001", name: "بوته گرافیتی شماره ۱", kind: "بوته", tag: "CR-001", heat: true, status: "active", cycles: 18, grams: 246000, maxCycles: 25 },
      { id: "EQ-CR-002", name: "بوته گرافیتی شماره ۲", kind: "بوته", tag: "CR-002", heat: true, status: "active", cycles: 0, grams: 0, maxCycles: 25 },
      { id: "EQ-MO-001", name: "قالب ریخته‌گری نقره", kind: "قالب", tag: "RFID-DEMO-003", heat: false, status: "active", cycles: 72, grams: 710000, maxCycles: 150 },
      { id: "EQ-SC-001", name: "ترازوی آزمایشگاه", kind: "تجهیزات", tag: "RFID-DEMO-004", heat: false, status: "active", cycles: 126, grams: 0, maxCycles: 0 },
      { id: "EQ-CR-000", name: "بوته گرافیتی بازنشسته", kind: "بوته", tag: "CR-000", heat: true, status: "retired", cycles: 27, grams: 384000, maxCycles: 25, reason: "ترک بدنه · نمونه", retiredAt: at(48) },
    ],
    products: [
      { id: "PR-001", serial: "MOR-AG-000001", collection: "Argentum", weight: 1000, assay: 999.9, metal: "silver", batchId: "MOR-AG-0046", packaging: "PKG-000001", nfc: "DEMO-NFC-001", front: "", back: "", created: at(24) },
      { id: "PR-002", serial: "MOR-AG-000002", collection: "Argentum", weight: 1000, assay: 999.9, metal: "silver", batchId: "MOR-AG-0046", packaging: "PKG-000002", nfc: "DEMO-NFC-002", front: "", back: "", created: at(24) },
    ],
    logs: [
      { id: "L-01", time: at(1), text: "شروع ذوب بچ MOR-AU-0012 توسط اپراتور نمونه ۲", type: "production", batchId: "MOR-AU-0012", actor: "دادهٔ نمونه" },
      { id: "L-02", time: at(1.5), text: "ورود محمولهٔ نقره؛ ۱۲٫۵ کیلوگرم با عیار ۹۲۰", type: "production", batchId: "MOR-AG-0049", actor: "دادهٔ نمونه" },
      { id: "L-03", time: at(2), text: "آغاز پالایش بچ MOR-AG-0048", type: "production", batchId: "MOR-AG-0048", actor: "دادهٔ نمونه" },
      { id: "L-04", time: at(3), text: "موجودی اسید نیتریک پایین‌تر از حد سفارش است", type: "warning", actor: "دادهٔ نمونه" },
      { id: "L-05", time: at(24), text: "دو شناسنامهٔ محصول Argentum ثبت شد", type: "product", batchId: "MOR-AG-0046", actor: "دادهٔ نمونه" },
    ],
    movements: [], assetUses: [],
  };
}

const uid = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
function str(d: Record<string, unknown>, key: string, fallback = "") {
  const value = d[key] ?? fallback;
  if (typeof value !== "string" || value.length > 1000) throw new Error("متن واردشده معتبر نیست.");
  return value.trim();
}
function num(d: Record<string, unknown>, key: string, minimum = 0, maximum = 1e9) {
  const raw = d[key];
  if (raw === "" || raw === null || raw === undefined || typeof raw === "boolean") throw new Error("همهٔ مقادیر عددی لازم را وارد کن.");
  const value = Number(raw);
  if (!Number.isFinite(value) || value < minimum || value > maximum) throw new Error("مقدار عددی خارج از محدوده است.");
  return value;
}
const required = (value: string, label: string) => { if (!value) throw new Error(`${label} را وارد کن.`); return value; };
const round = (value: number) => Math.round(value * 1e6) / 1e6;

export function applyCommand(input: Workspace, command: Command, actor = "مدیر سامانه"): { state: Workspace; message: string } {
  if (command.type.startsWith("factory/")) {
    const result = applyFactoryCommand(input.factory || seedFactory(), command, actor);
    return { state: { ...structuredClone(input), factory: result.factory }, message: result.message };
  }
  const state = structuredClone(input), d = command.data;
  if (!d || typeof d !== "object" || Array.isArray(d)) throw new Error("درخواست معتبر نیست.");
  const now = new Date().toISOString();
  const log = (text: string, type: Log["type"], batchId?: string) => state.logs.unshift({ id: uid("EV"), time: now, text, type, batchId, actor });
  const getBatch = () => { const b = state.batches.find(x => x.id === d.batchId); if (!b) throw new Error("بچ پیدا نشد."); return b; };
  let message = "با موفقیت ثبت شد.";
  switch (command.type) {
    case "create_batch": {
      const metal = str(d, "metal");
      if (metal !== "silver" && metal !== "gold") throw new Error("نوع فلز معتبر نیست.");
      const b: Batch = { id: uid(metal === "silver" ? "MOR-AG" : "MOR-AU"), metal, source: required(str(d, "source"), "شرح ورودی"), owner: required(str(d, "owner"), "مالک محموله"), weight: num(d, "weight", 0.001), assay: num(d, "assay", 0.001, 1000), stage: 0, priority: str(d, "priority", "عادی"), created: now, note: str(d, "note"), sessions: [] };
      state.batches.unshift(b); log(`دریافت محموله و ایجاد بچ ${b.id}؛ ${b.weight} گرم ${metalName(b.metal)}`, "production", b.id);
      message = `بچ ${b.id} ایجاد شد؛ ورودی در مواد در جریان ثبت شد.`; break;
    }
    case "start_session": {
      const b = getBatch(), op = state.operators.find(x => x.id === d.operatorId);
      if (!op) throw new Error("اپراتور را انتخاب کن.");
      if (b.stage === 5) throw new Error("بچ تکمیل شده است.");
      if (state.batches.some(x => x.sessions.some(s => s.operatorId === op.id && !s.end))) throw new Error("این اپراتور یک کار باز دارد؛ ابتدا پایان آن را ثبت کن.");
      b.sessions.push({ id: uid("SES"), operatorId: op.id, role: required(str(d, "role"), "نقش در بچ"), stage: b.stage, start: now });
      log(`شروع ${stages[b.stage]} توسط ${op.name} در ${b.id}`, "production", b.id); break;
    }
    case "end_session": {
      const b = getBatch(), session = b.sessions.find(s => s.id === d.sessionId && !s.end);
      if (!session) throw new Error("کار باز پیدا نشد.");
      session.end = now;
      log(`پایان کار ${state.operators.find(o => o.id === session.operatorId)?.name} در ${b.id}؛ تأیید اپراتور`, "production", b.id); break;
    }
    case "advance_batch": {
      const b = getBatch();
      if (b.stage >= 4) throw new Error("برای پایان بچ، نتیجهٔ کنترل کیفیت و وزن خروجی را ثبت کن.");
      if (b.sessions.some(s => !s.end)) throw new Error("ابتدا پایان کار افراد فعال در این مرحله را ثبت کن.");
      b.stage += 1; log(`انتقال بچ ${b.id} به مرحلهٔ ${stages[b.stage]}`, "production", b.id); break;
    }
    case "finalize_batch": {
      const b = getBatch();
      if (b.stage !== 4) throw new Error("بچ باید در مرحلهٔ کنترل کیفیت باشد.");
      if (b.sessions.some(s => !s.end)) throw new Error("ابتدا پایان کار افراد فعال را ثبت کن.");
      const output = num(d, "output", 0.001), assay = num(d, "outputAssay", 0.001, 1000), recoverable = num(d, "recoverable");
      if (fine(output, assay) + recoverable > fine(b.weight, b.assay) + 0.000001) throw new Error("فلز خالص خروجی و قابل‌بازیافت از ورودی بیشتر است؛ وزن و عیار را بررسی کن.");
      Object.assign(b, { output, outputAssay: assay, recoverable, stage: 5 });
      let item = state.inventory.find(i => i.metal === b.metal && i.assay === assay);
      if (!item) { item = { id: uid("MAT"), name: `${metalName(b.metal)} ${assay}`, category: "فلز گرانبها", quantity: 0, unit: "گرم", minimum: 0, metal: b.metal, assay }; state.inventory.push(item); }
      item.quantity = round(item.quantity + output);
      state.movements.unshift({ id: uid("MV"), materialId: item.id, delta: output, batchId: b.id, note: "ورود محصول نهایی پس از کنترل کیفیت", time: now });
      log(`تکمیل بچ ${b.id}؛ ${output} گرم خروجی با عیار ${assay} به انبار اضافه شد`, "production", b.id); break;
    }
    case "inventory_move": {
      const item = state.inventory.find(i => i.id === d.materialId);
      if (!item) throw new Error("کالا پیدا نشد.");
      const operation = str(d, "operation");
      if (!["receipt", "consume", "adjust"].includes(operation)) throw new Error("نوع گردش معتبر نیست.");
      const quantity = num(d, "quantity", operation === "adjust" ? -1e9 : 0.001), note = required(str(d, "note"), "علت گردش"), batchId = str(d, "batchId");
      if (batchId && !state.batches.some(b => b.id === batchId)) throw new Error("بچ انتخاب‌شده وجود ندارد.");
      const delta = operation === "adjust" ? quantity - item.quantity : operation === "consume" ? -quantity : quantity;
      item.quantity = round(item.quantity + delta);
      state.movements.unshift({ id: uid("MV"), materialId: item.id, delta, batchId, note, time: now });
      log(`${operation === "receipt" ? "ورود" : operation === "consume" ? "مصرف" : "اصلاح موجودی"} ${item.name}؛ ${delta} ${item.unit} · ${note}`, "inventory", batchId || undefined);
      if (item.quantity < 0) { log(`هشدار موجودی منفی ${item.name}؛ اگر کالا موجود است، موجودی را اصلاح کن`, "warning", batchId || undefined); message = "گردش ثبت شد؛ موجودی منفی است. اگر کالا موجود است، موجودی را اصلاح کن."; } break;
    }
    case "create_asset": {
      const kind = required(str(d, "kind"), "نوع ابزار"), name = required(str(d, "name"), "نام ابزار"), tag = required(str(d, "tag"), "شناسهٔ ابزار");
      if (state.assets.some(a => a.tag.toLowerCase() === tag.toLowerCase())) throw new Error("شناسهٔ ابزار تکراری است.");
      const replaces = str(d, "replaces");
      if (replaces) {
        const old = state.assets.find(a => a.id === replaces && a.status === "active" && a.kind === kind);
        if (!old) throw new Error("ابزار قبلیِ فعال با نوع یکسان را انتخاب کن.");
        old.reason = required(str(d, "reason"), "علت خروج ابزار قبلی"); old.status = "retired"; old.retiredAt = now;
        log(`خروج ${old.name} از چرخه؛ جایگزینی با ${name} · ${old.reason}`, "asset");
      }
      state.assets.unshift({ id: uid("EQ"), name, kind, tag, heat: d.heat === true, status: "active", cycles: 0, grams: 0, maxCycles: num(d, "maxCycles", 0, 1e6), replaces });
      log(`ثبت ابزار ${name} با شناسهٔ ${tag}`, "asset"); break;
    }
    case "retire_asset": {
      const asset = state.assets.find(a => a.id === d.assetId);
      if (!asset || asset.status !== "active") throw new Error("ابزار فعال پیدا نشد.");
      asset.status = "retired"; asset.reason = required(str(d, "reason"), "علت خروج از چرخه"); asset.retiredAt = now;
      log(`خروج ${asset.name} از چرخه پس از ${asset.cycles} بار و ${asset.grams / 1000} کیلوگرم پردازش؛ ${asset.reason}`, "asset"); break;
    }
    case "use_asset": {
      const b = getBatch();
      if (b.stage === 5) throw new Error("برای بچ تکمیل‌شده، کارکرد جدید ثبت نمی‌شود.");
      const asset = state.assets.find(a => a.id === d.assetId && a.status === "active"), op = state.operators.find(o => o.id === d.operatorId);
      if (!asset) throw new Error("ابزار فعال پیدا نشد.");
      if (!op) throw new Error("اپراتور را انتخاب کن.");
      const grams = num(d, "grams", 0.001, b.weight);
      asset.cycles += 1; asset.grams = round(asset.grams + grams);
      state.assetUses.unshift({ id: uid("USE"), assetId: asset.id, batchId: b.id, operatorId: op.id, grams, time: now });
      log(`کارکرد ${asset.name} برای ${b.id}؛ ${grams} گرم توسط ${op.name}`, "asset", b.id);
      if (asset.maxCycles && asset.cycles >= asset.maxCycles) { log(`بررسی وضعیت ${asset.name}؛ تعداد استفاده به آستانهٔ تعریف‌شده رسیده است`, "warning", b.id); message = "کارکرد ثبت شد؛ ابزار به آستانهٔ بازبینی رسیده است."; } break;
    }
    case "create_product": {
      const b = getBatch();
      if (b.stage !== 5 || !b.output || !b.outputAssay) throw new Error("محصول را به یک بچ تکمیل‌شده متصل کن.");
      const c = collections.find(c => c.name === d.collection);
      if (!c) throw new Error("مجموعه معتبر نیست.");
      const metal = c.name === "Bespoke Edition" ? b.metal : c.metal;
      const assay = c.name === "Argentum" ? num(d, "assay", 995, 999.9) : c.assay;
      if (c.name === "Argentum" && ![995, 999.9].includes(assay)) throw new Error("عیار Argentum باید 995.0 یا 999.9 باشد.");
      const weight = num(d, "weight", 0.001);
      if (c.name !== "Bespoke Edition" && !c.weights.some(w => Math.abs(w - weight) < 0.00001)) throw new Error("وزن محصول در مشخصات این مجموعه وجود ندارد.");
      if (b.metal !== metal || Math.abs(b.outputAssay - assay) > 0.00001) throw new Error("فلز و عیار محصول باید با خروجی بچ یکسان باشد.");
      const issued = state.products.filter(p => p.batchId === b.id).reduce((sum, p) => sum + p.weight, 0);
      if (issued + weight > b.output + 0.000001) throw new Error("وزن محصولات ثبت‌شده از خروجی بچ بیشتر می‌شود.");
      const serial = required(str(d, "serial"), "سریال محصول"), packaging = required(str(d, "packaging"), "سریال بسته‌بندی"), nfc = str(d, "nfc");
      if (state.products.some(p => p.serial.toLowerCase() === serial.toLowerCase() || p.packaging.toLowerCase() === packaging.toLowerCase() || (nfc && p.nfc.toLowerCase() === nfc.toLowerCase()))) throw new Error("سریال محصول، بسته‌بندی یا شناسهٔ تگ تکراری است.");
      const photo = (key: string) => { const value = str(d, key); if (value && !/^\/api\/photos\/[a-f0-9-]+$/.test(value)) throw new Error("نشانی عکس معتبر نیست."); return value; };
      const inventory = state.inventory.find(i => i.metal === metal && i.assay === assay);
      if (!inventory || inventory.quantity < weight) throw new Error("برای تخصیص محصول سریال‌دار، موجودی فلز با عیار یکسان کافی نیست.");
      inventory.quantity = round(inventory.quantity - weight);
      state.products.unshift({ id: uid("PR"), serial, packaging, nfc, collection: c.name, weight, assay, metal, batchId: b.id, front: photo("front"), back: photo("back"), created: now });
      state.movements.unshift({ id: uid("MV"), materialId: inventory.id, delta: -weight, batchId: b.id, note: `تخصیص به محصول سریال‌دار ${serial}`, time: now });
      log(`ثبت شناسنامهٔ ${serial} از مجموعهٔ ${c.name}؛ اتصال به ${b.id}`, "product", b.id);
      message = "شناسنامه ثبت شد؛ محصول از موجودی فلز به محصولات سریال‌دار منتقل شد."; break;
    }
    case "create_operator": {
      const name = required(str(d, "name"), "نام همکار");
      state.operators.push({ id: uid("OP"), name, role: required(str(d, "role"), "مسئولیت"), initials: name.split(" ").slice(0, 2).map(x => x[0]).join("") });
      log(`افزودن ${name} به فهرست همکاران آزمایشی`, "production"); break;
    }
    default: throw new Error("عملیات شناخته‌شده نیست.");
  }
  return { state, message };
}

export function massBalance(b: Batch) {
  const incoming = fine(b.weight, b.assay), outgoing = b.output ? fine(b.output, b.outputAssay || 0) : 0, recoverable = b.recoverable || 0;
  return { incoming, outgoing, recoverable, difference: round(incoming - outgoing - recoverable), recovery: incoming ? outgoing / incoming * 100 : 0 };
}
