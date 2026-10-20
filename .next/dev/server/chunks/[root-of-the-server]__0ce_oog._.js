module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/src/db/index.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "db",
    ()=>db,
    "pool",
    ()=>pool
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$node$2d$postgres$2f$driver$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/node-postgres/driver.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__ = __turbopack_context__.i("[externals]/pg [external] (pg, esm_import, [project]/node_modules/pg)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$node$2d$postgres$2f$driver$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$node$2d$postgres$2f$driver$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
}
const globalForDb = globalThis;
const pool = globalForDb.__arenaNextJsPostgresqlPool ?? new __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__["Pool"]({
    connectionString: databaseUrl
});
if ("TURBOPACK compile-time truthy", 1) {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
}
const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$node$2d$postgres$2f$driver$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["drizzle"])(pool);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/db/schema.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "appSettings",
    ()=>appSettings,
    "chunks",
    ()=>chunks,
    "events",
    ()=>events,
    "geminiKeys",
    ()=>geminiKeys,
    "jobs",
    ()=>jobs
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/table.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/text.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/integer.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$real$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/real.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/boolean.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/jsonb.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/timestamp.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$bigserial$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/bigserial.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/indexes.js [app-route] (ecmascript)");
;
const jobs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["pgTable"])("jobs", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("id").primaryKey(),
    filename: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("filename").notNull(),
    sizeBytes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("size_bytes").notNull().default(0),
    mediaPath: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("media_path"),
    mediaUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("media_url"),
    durationSec: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$real$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["real"])("duration_sec"),
    fingerprint: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("fingerprint"),
    status: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("status").notNull().default("queued"),
    stage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("stage").notNull().default("queued"),
    progress: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$real$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["real"])("progress").notNull().default(0),
    error: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("error"),
    simulated: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["boolean"])("simulated").notNull().default(false),
    wordCount: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("word_count").notNull().default(0),
    sentenceCount: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("sentence_count").notNull().default(0),
    coverage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$real$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["real"])("coverage"),
    longestMissSec: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$real$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["real"])("longest_miss_sec"),
    anchoredCount: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("anchored_count"),
    alignedTotal: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("aligned_total"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["timestamp"])("created_at", {
        withTimezone: true
    }).notNull().defaultNow(),
    startedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["timestamp"])("started_at", {
        withTimezone: true
    }),
    completedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["timestamp"])("completed_at", {
        withTimezone: true
    }),
    settings: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsonb"])("settings").$type(),
    stageLog: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsonb"])("stage_log").$type(),
    onsets: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsonb"])("onsets").$type(),
    onsetStrengths: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsonb"])("onset_strengths").$type(),
    silences: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsonb"])("silences").$type(),
    energy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsonb"])("energy").$type(),
    transcript: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsonb"])("transcript").$type()
});
const chunks = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["pgTable"])("chunks", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$bigserial$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bigserial"])("id", {
        mode: "number"
    }).primaryKey(),
    jobId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("job_id").notNull().references(()=>jobs.id, {
        onDelete: "cascade"
    }),
    idx: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("idx").notNull(),
    coreStart: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$real$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["real"])("core_start").notNull(),
    coreEnd: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$real$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["real"])("core_end").notNull(),
    clipStart: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$real$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["real"])("clip_start").notNull(),
    clipEnd: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$real$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["real"])("clip_end").notNull(),
    status: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("status").notNull().default("pending"),
    wordCount: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("word_count").notNull().default(0),
    coverage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$real$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["real"])("coverage"),
    longestMissSec: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$real$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["real"])("longest_miss_sec"),
    attempts: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("attempts").notNull().default(0),
    model: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("model"),
    keyIndex: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("key_index"),
    error: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("error")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["index"])("chunks_job_idx").on(t.jobId)
    ]);
const events = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["pgTable"])("events", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$bigserial$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bigserial"])("id", {
        mode: "number"
    }).primaryKey(),
    jobId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("job_id").notNull().references(()=>jobs.id, {
        onDelete: "cascade"
    }),
    ts: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["timestamp"])("ts", {
        withTimezone: true
    }).notNull().defaultNow(),
    stage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("stage").notNull().default("info"),
    level: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("level").notNull().default("info"),
    title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("title").notNull().default(""),
    message: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("message").notNull().default(""),
    data: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsonb"])("data")
}, (t)=>[
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["index"])("events_job_idx").on(t.jobId)
    ]);
const geminiKeys = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["pgTable"])("gemini_keys", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$bigserial$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bigserial"])("id", {
        mode: "number"
    }).primaryKey(),
    idx: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("idx").notNull().default(1),
    keyHash: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("key_hash").notNull().unique(),
    secret: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("secret").notNull(),
    from: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("from").notNull().default(""),
    project: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("project").notNull().default(""),
    source: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("source").notNull().default("local"),
    rpdUsed: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("rpd_used").notNull().default(0),
    rpdWindowStart: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("rpd_window_start"),
    disabledReason: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("disabled_reason"),
    lastUsedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["timestamp"])("last_used_at", {
        withTimezone: true
    }),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["timestamp"])("created_at", {
        withTimezone: true
    }).notNull().defaultNow()
});
const appSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["pgTable"])("app_settings", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("id").primaryKey().default(1),
    chunkSec: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("chunk_sec").notNull().default(30),
    overlapSec: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("overlap_sec").notNull().default(2),
    model: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["text"])("model").notNull().default("auto"),
    toleranceMs: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["integer"])("tolerance_ms").notNull().default(350),
    allowSimulate: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["boolean"])("allow_simulate").notNull().default(true),
    gapless: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["boolean"])("gapless").notNull().default(false)
});
}),
"[project]/src/lib/types.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AVAILABLE_MODELS",
    ()=>AVAILABLE_MODELS,
    "STAGES",
    ()=>STAGES,
    "fmtBytes",
    ()=>fmtBytes,
    "fmtClock",
    ()=>fmtClock,
    "fmtSec",
    ()=>fmtSec
]);
const STAGES = [
    {
        key: "discovery",
        label: "Key Discovery & Quota",
        blurb: "Discovering Gemini keys · reserving RPM / RPD slots"
    },
    {
        key: "analysis",
        label: "Acoustic Analysis",
        blurb: "Exact duration · silencedetect · speech intervals"
    },
    {
        key: "onsets",
        label: "Waveform Onset Detection",
        blurb: "16 kHz PCM · 10 ms RMS · ODF peaks · 80 ms spacing"
    },
    {
        key: "chunking",
        label: "Silence-Snapped Chunking",
        blurb: "~30 s clips snapped to silence midpoints + 2 s overlap"
    },
    {
        key: "transcription",
        label: "Gemini Transcription",
        blurb: "Verbatim word JSON · multi-key rotation · coverage gate"
    },
    {
        key: "alignment",
        label: "Physical Alignment",
        blurb: "Robust drift/scale fit → monotone DP → interpolate → durations"
    },
    {
        key: "assembly",
        label: "Sentence Assembly",
        blurb: "Punctuation + pause + 18-word state machine"
    },
    {
        key: "persist",
        label: "Atomic Persistence",
        blurb: "transcript_data.json · resumable chunk cache"
    }
];
const AVAILABLE_MODELS = [
    {
        model: "gemini-3.8-flash",
        rpm: 5,
        rpd: 20
    },
    {
        model: "gemini-3.7-flash",
        rpm: 5,
        rpd: 20
    },
    {
        model: "gemini-3.6-flash",
        rpm: 5,
        rpd: 20
    },
    {
        model: "gemini-3.5-flash",
        rpm: 5,
        rpd: 20
    },
    {
        model: "gemini-3.5-flash-lite",
        rpm: 15,
        rpd: 500
    },
    {
        model: "gemini-3.1-flash-lite",
        rpm: 15,
        rpd: 500
    },
    {
        model: "gemini-flash-latest",
        rpm: 10,
        rpd: 250
    },
    {
        model: "gemini-flash-lite-latest",
        rpm: 15,
        rpd: 500
    }
];
function fmtClock(sec) {
    if (!Number.isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = sec - m * 60;
    return `${String(m).padStart(2, "0")}:${s.toFixed(3).padStart(6, "0")}`;
}
function fmtSec(sec, digits = 2) {
    if (sec == null || !Number.isFinite(sec)) return "—";
    return `${sec.toFixed(digits)}s`;
}
function fmtBytes(n) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
}),
"[project]/src/lib/engine/keys.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "RPD_RESET_HOUR_LOCAL",
    ()=>RPD_RESET_HOUR_LOCAL,
    "keyManager",
    ()=>keyManager,
    "rpdWindowStart",
    ()=>rpdWindowStart
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/conditions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/index.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/types.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
const RPD_RESET_HOUR_LOCAL = 13; // daily window resets at 1:00 PM local
function rpdWindowStart(now = new Date()) {
    const d = new Date(now);
    d.setHours(RPD_RESET_HOUR_LOCAL, 0, 0, 0);
    if (now.getTime() < d.getTime()) d.setDate(d.getDate() - 1);
    return d;
}
function keyIdFor(apiKey) {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["default"].createHash("sha256").update(apiKey).digest("hex").slice(0, 16);
}
function modelState(k, model, now = new Date()) {
    let m = k.models.get(model);
    const win = rpdWindowStart(now).toISOString();
    if (!m || m.rpdWindowStart !== win) {
        m = {
            rpmLog: [],
            rpdUsed: 0,
            rpdWindowStart: win,
            minuteUntil: 0,
            dailyUntil: 0
        };
        k.models.set(model, m);
    }
    return m;
}
class KeyManager {
    keys = [];
    lastLoad = 0;
    /** Discover env keys (api1..N, GEMINI_API_KEY, GEMINI_API_KEY_N) + DB keys */ async load(force = false) {
        const now = Date.now();
        if (!force && now - this.lastLoad < 10_000 && this.keys.length) return;
        this.lastLoad = now;
        const envData = {
            ...process.env
        };
        const indexes = new Set();
        for (const name of Object.keys(envData)){
            const m = name.match(/^api(\d+)$/i) || name.match(/^GEMINI_API_KEY_(\d+)$/i);
            if (m) indexes.add(parseInt(m[1], 10));
        }
        if ((envData["GEMINI_API_KEY"] || "").trim()) indexes.add(0);
        const envKeys = [];
        for (const i of [
            ...indexes
        ].sort((a, b)=>a - b)){
            const raw = (i === 0 ? envData["GEMINI_API_KEY"] : envData[`api${i}`] || envData[`API${i}`] || envData[`GEMINI_API_KEY_${i}`] || "").trim();
            if (!raw) continue;
            envKeys.push({
                idx: i,
                apiKey: raw,
                keyId: keyIdFor(raw),
                from: (i === 0 ? "" : envData[`from${i}`] || envData[`FROM${i}`] || "").trim() || `account_${i}`,
                project: (i === 0 ? "" : envData[`project${i}`] || envData[`PROJECT${i}`] || envData[`GEMINI_PROJECT_${i}`] || "").trim() || `project_${i}`,
                source: "env",
                dbId: null,
                disabledReason: null,
                lastUsedAt: null,
                models: new Map()
            });
        }
        const dbKeys = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].select().from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["geminiKeys"]);
        const dbMap = new Map(dbKeys.map((k)=>[
                k.keyHash,
                k
            ]));
        const localKeys = dbKeys.map((k)=>({
                idx: k.idx,
                apiKey: k.secret,
                keyId: k.keyHash.slice(0, 16),
                from: k.from || `account_${k.idx}`,
                project: k.project || `project_${k.idx}`,
                source: "local",
                dbId: k.id,
                disabledReason: k.disabledReason,
                lastUsedAt: k.lastUsedAt ? k.lastUsedAt.getTime() : null,
                models: new Map()
            }));
        // merge: env first, then local (dedupe by key hash)
        const seen = new Set();
        const merged = [];
        for (const k of [
            ...envKeys,
            ...localKeys
        ]){
            if (seen.has(k.keyId)) continue;
            seen.add(k.keyId);
            merged.push(k);
        }
        merged.sort((a, b)=>a.idx - b.idx);
        this.keys = merged;
    }
    count() {
        return this.keys.length;
    }
    /** Atomic slot reservation — claims RPM+RPD before dispatch */ pickAndReserve(opts = {}) {
        const now = opts.now ?? Date.now();
        const pool = this.modelPool(opts.preferredModel);
        for (const key of this.keys){
            if (key.disabledReason) continue;
            for (const { model, rpm, rpd } of pool){
                const ms = modelState(key, model);
                ms.rpmLog = ms.rpmLog.filter((t)=>now - t < 60_000);
                if (ms.rpmLog.length >= rpm) continue;
                if (ms.rpdUsed >= rpd) continue;
                if (ms.minuteUntil > now || ms.dailyUntil > now) continue;
                // reserve
                ms.rpmLog.push(now);
                ms.rpdUsed += 1;
                key.lastUsedAt = now;
                void this.persist(key);
                return {
                    slot: {
                        idx: key.idx,
                        apiKey: key.apiKey,
                        keyId: key.keyId,
                        from: key.from,
                        project: key.project,
                        source: key.source,
                        dbId: key.dbId,
                        model
                    },
                    usage: {
                        model,
                        rpmUsed: ms.rpmLog.length,
                        rpmLimit: rpm,
                        rpdUsed: ms.rpdUsed,
                        rpdLimit: rpd,
                        limited: false
                    }
                };
            }
        }
        return null;
    }
    modelPool(preferredModel) {
        const all = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AVAILABLE_MODELS"].filter((m)=>!this.deadModels.has(m.model));
        if (preferredModel && preferredModel !== "auto") {
            const pref = all.find((m)=>m.model === preferredModel);
            if (pref) return [
                pref,
                ...all.filter((m)=>m.model !== preferredModel)
            ];
        }
        return all;
    }
    deadModels = new Set();
    markModelDead(model) {
        this.deadModels.add(model);
    }
    markKeyDisabled(slot, reason) {
        const k = this.keys.find((x)=>x.keyId === slot.keyId);
        if (k) {
            k.disabledReason = reason;
            if (k.dbId) void this.persist(k);
        }
    }
    markModelLimited(slot, daily) {
        const k = this.keys.find((x)=>x.keyId === slot.keyId);
        if (!k) return;
        const ms = modelState(k, slot.model);
        if (daily) {
            ms.dailyUntil = rpdWindowStart(new Date(Date.now() + 1000 * 60 * 60 * 24)).getTime();
        } else {
            ms.minuteUntil = Date.now() + 75_000;
        }
    }
    /** Short cooldown used after transient 5xx errors so rotation moves on
   *  to the next key/model combo instead of hammering the hot model. */ markModelCooldown(slot, ms) {
        const k = this.keys.find((x)=>x.keyId === slot.keyId);
        if (!k) return;
        const st = modelState(k, slot.model);
        st.minuteUntil = Math.max(st.minuteUntil, Date.now() + ms);
    }
    /**
   * True when some key could yield a slot within `horizonMs`. RPM saturation
   * and cooldowns count as hopeful (they roll off); disabled keys and
   * RPD-exhausted models do not — in that case waiting cannot help.
   */ outlook(horizonMs = 120_000) {
        const now = Date.now();
        const models = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AVAILABLE_MODELS"].filter((m)=>!this.deadModels.has(m.model));
        for (const k of this.keys){
            if (k.disabledReason) continue;
            for (const m of models){
                const ms = modelState(k, m.model);
                if (ms.rpdUsed >= m.rpd) continue;
                if (ms.dailyUntil > now + horizonMs) continue;
                return true;
            }
        }
        return false;
    }
    recordError(slot) {
        const k = this.keys.find((x)=>x.keyId === slot.keyId);
        if (!k) return;
        const ms = modelState(k, slot.model);
        // return the RPM reservation
        ms.rpmLog.pop();
    }
    async persist(k) {
        if (!k.dbId) return;
        let total = 0;
        let win = "";
        for (const m of k.models.values()){
            total += m.rpdUsed;
            win = m.rpdWindowStart;
        }
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].update(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["geminiKeys"]).set({
                rpdUsed: total,
                rpdWindowStart: win || null,
                disabledReason: k.disabledReason,
                lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt) : null
            }).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["geminiKeys"].id, k.dbId));
        } catch  {
        /* non-fatal */ }
    }
    async addKey(opts) {
        await this.load();
        const apiKey = opts.key.trim();
        const hash = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["default"].createHash("sha256").update(apiKey).digest("hex");
        const existing = this.keys.find((k)=>k.keyId === hash.slice(0, 16));
        if (existing) return existing;
        const idx = opts.idx ?? Math.max(0, ...this.keys.map((k)=>k.idx)) + 1;
        const inserted = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].insert(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["geminiKeys"]).values({
            idx,
            keyHash: hash,
            secret: apiKey,
            from: opts.from.trim(),
            project: opts.project.trim(),
            source: "local"
        }).onConflictDoNothing({
            target: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["geminiKeys"].keyHash
        }).returning();
        let row = inserted[0];
        if (!row) {
            // raced a duplicate insert — fetch the existing row
            const [found] = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].select().from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["geminiKeys"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["geminiKeys"].keyHash, hash)).limit(1);
            if (found) {
                const ks = {
                    idx: found.idx,
                    apiKey: found.secret,
                    keyId: hash.slice(0, 16),
                    from: found.from,
                    project: found.project,
                    source: "local",
                    dbId: found.id,
                    disabledReason: found.disabledReason,
                    lastUsedAt: found.lastUsedAt ? found.lastUsedAt.getTime() : null,
                    models: new Map()
                };
                this.keys.push(ks);
                this.keys.sort((a, b)=>a.idx - b.idx);
                return ks;
            }
            row = {
                idx,
                keyHash: hash,
                secret: apiKey,
                from: opts.from.trim(),
                project: opts.project.trim(),
                source: "local"
            };
        }
        const k = {
            idx: row.idx,
            apiKey,
            keyId: hash.slice(0, 16),
            from: row.from,
            project: row.project,
            source: "local",
            dbId: row.id,
            disabledReason: null,
            lastUsedAt: null,
            models: new Map()
        };
        this.keys.push(k);
        this.keys.sort((a, b)=>a.idx - b.idx);
        return k;
    }
    /** Bulk-add many keys at once (the rotation pool can grow without bound). */ async addKeys(items) {
        await this.load();
        return this.addKeysLoaded(items);
    }
    async addKeysLoaded(items) {
        let added = 0;
        let duplicates = 0;
        let invalid = 0;
        for (const item of items){
            const raw = (item.key || "").trim();
            if (!raw || raw.length < 20) {
                invalid += 1;
                continue;
            }
            const id16 = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["default"].createHash("sha256").update(raw).digest("hex").slice(0, 16);
            if (this.keys.some((k)=>k.keyId === id16)) {
                duplicates += 1;
                continue;
            }
            await this.addKey({
                key: raw,
                from: item.from || "",
                project: item.project || ""
            });
            added += 1;
        }
        return {
            added,
            duplicates,
            invalid,
            total: this.keys.length
        };
    }
    async removeKey(dbId) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].delete(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["geminiKeys"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["geminiKeys"].id, dbId));
        this.keys = this.keys.filter((k)=>k.dbId !== dbId);
    }
    async resetQuotas() {
        for (const k of this.keys){
            k.disabledReason = null;
            k.models.clear();
            if (k.dbId) {
                try {
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].update(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["geminiKeys"]).set({
                        disabledReason: null,
                        rpdUsed: 0
                    }).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["geminiKeys"].id, k.dbId));
                } catch  {
                /* ignore */ }
            }
        }
    }
    async describe() {
        await this.load();
        const keys = this.keys.map((k)=>({
                id: k.dbId,
                idx: k.idx,
                label: `api${k.idx === 0 ? "" : k.idx}`,
                masked: `${k.apiKey.slice(0, 6)}…${k.apiKey.slice(-4)}`,
                from: k.from,
                project: k.project,
                source: k.source,
                models: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AVAILABLE_MODELS"].filter((m)=>!this.deadModels.has(m.model)).map((m)=>{
                    const ms = modelState(k, m.model);
                    const rpmUsed = ms.rpmLog.filter((t)=>Date.now() - t < 60_000).length;
                    const until = Math.max(ms.minuteUntil, ms.dailyUntil);
                    return {
                        model: m.model,
                        rpmUsed,
                        rpmLimit: m.rpm,
                        rpdUsed: ms.rpdUsed,
                        rpdLimit: m.rpd,
                        limited: until > Date.now(),
                        limitedUntil: until > Date.now() ? new Date(until).toISOString() : undefined
                    };
                }),
                disabledReason: k.disabledReason,
                lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt).toISOString() : null
            }));
        return {
            keys,
            models: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AVAILABLE_MODELS"].map((m)=>({
                    ...m
                }))
        };
    }
}
const g = globalThis;
const keyManager = g.__keyManager ?? (g.__keyManager = new KeyManager());
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/app/api/keys/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/engine/keys.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
const dynamic = "force-dynamic";
const runtime = "nodejs";
async function GET() {
    const info = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["keyManager"].describe();
    return Response.json(info);
}
async function POST(req) {
    let body;
    try {
        body = await req.json();
    } catch  {
        return Response.json({
            error: "Invalid JSON body"
        }, {
            status: 400
        });
    }
    // Bulk import: { keys: "key1\nkey2,key3…" } or { keys: [{key,from,project}...] }
    // Each line may be `key` or `key, from email, GCP project`.
    const items = [];
    if (typeof body?.keys === "string" && body.keys.trim().length > 0) {
        const defFrom = String(body?.from || "").trim();
        const defProject = String(body?.project || "").trim();
        for (const line of body.keys.split(/\r?\n/)){
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const parts = trimmed.split(",").map((p)=>p.trim());
            items.push({
                key: parts[0],
                from: parts[1] || defFrom,
                project: parts[2] || defProject
            });
        }
    } else if (Array.isArray(body?.keys)) {
        for (const item of body.keys){
            if (item && typeof item.key === "string") {
                items.push({
                    key: item.key,
                    from: typeof item.from === "string" ? item.from : "",
                    project: typeof item.project === "string" ? item.project : ""
                });
            }
        }
    } else {
        // Single-key form
        const key = String(body?.key || "").trim();
        if (!key || key.length < 20) {
            return Response.json({
                error: "API key looks too short — paste the full key"
            }, {
                status: 400
            });
        }
        items.push({
            key,
            from: String(body?.from || "").trim(),
            project: String(body?.project || "").trim()
        });
    }
    if (items.length === 0) {
        return Response.json({
            error: "No keys found — paste at least one key"
        }, {
            status: 400
        });
    }
    const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["keyManager"].addKeys(items);
    const info = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["keyManager"].describe();
    return Response.json({
        ok: true,
        ...result,
        keys: info.keys
    });
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0ce_oog._.js.map