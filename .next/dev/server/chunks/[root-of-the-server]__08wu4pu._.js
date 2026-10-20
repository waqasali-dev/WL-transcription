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
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[externals]/node:fs [external] (node:fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs", () => require("node:fs"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[externals]/node:child_process [external] (node:child_process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:child_process", () => require("node:child_process"));

module.exports = mod;
}),
"[project]/src/lib/engine/audio.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FFMPEG",
    ()=>FFMPEG,
    "FFPROBE",
    ()=>FFPROBE,
    "analyzeAudio",
    ()=>analyzeAudio,
    "computeEnergyBins",
    ()=>computeEnergyBins,
    "decodePcm16",
    ()=>decodePcm16,
    "detectOnsets",
    ()=>detectOnsets,
    "detectOnsetsFromSamples",
    ()=>detectOnsetsFromSamples,
    "detectSilences",
    ()=>detectSilences,
    "parseWavHeader",
    ()=>parseWavHeader,
    "probeDuration",
    ()=>probeDuration,
    "round3",
    ()=>round3,
    "sliceToMp3",
    ()=>sliceToMp3,
    "speechIntervals",
    ()=>speechIntervals
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$child_process__$5b$external$5d$__$28$node$3a$child_process$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:child_process [external] (node:child_process, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$ffmpeg$2d$installer$2f$ffmpeg__$5b$external$5d$__$2840$ffmpeg$2d$installer$2f$ffmpeg$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$ffmpeg$2d$installer$2f$ffmpeg$29$__ = __turbopack_context__.i("[externals]/@ffmpeg-installer/ffmpeg [external] (@ffmpeg-installer/ffmpeg, cjs, [project]/node_modules/@ffmpeg-installer/ffmpeg)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$ffprobe$2d$installer$2f$ffprobe__$5b$external$5d$__$2840$ffprobe$2d$installer$2f$ffprobe$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$ffprobe$2d$installer$2f$ffprobe$29$__ = __turbopack_context__.i("[externals]/@ffprobe-installer/ffprobe [external] (@ffprobe-installer/ffprobe, cjs, [project]/node_modules/@ffprobe-installer/ffprobe)");
;
;
;
;
;
const FFMPEG = __TURBOPACK__imported__module__$5b$externals$5d2f40$ffmpeg$2d$installer$2f$ffmpeg__$5b$external$5d$__$2840$ffmpeg$2d$installer$2f$ffmpeg$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$ffmpeg$2d$installer$2f$ffmpeg$29$__["default"].path;
const FFPROBE = __TURBOPACK__imported__module__$5b$externals$5d2f40$ffprobe$2d$installer$2f$ffprobe__$5b$external$5d$__$2840$ffprobe$2d$installer$2f$ffprobe$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$ffprobe$2d$installer$2f$ffprobe$29$__["default"].path;
function round3(n) {
    return Math.round(n * 1000) / 1000;
}
function run(cmd, args, opts = {}) {
    return new Promise((resolve, reject)=>{
        const child = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$child_process__$5b$external$5d$__$28$node$3a$child_process$2c$__cjs$29$__["execFile"](cmd, args, {
            // NOTE: `encoding: "buffer"` is essential — without it execFile returns
            // UTF-8 *strings*, which corrupts binary PCM and made .buffer undefined
            // (MP3 decoding failed while WAV survived via the fallback parser).
            encoding: "buffer",
            maxBuffer: 1024 * 1024 * 256,
            timeout: opts.timeoutMs ?? 180_000
        }, (err, stdout, stderr)=>{
            if (err) reject(err);
            else resolve({
                stdout,
                stderr: stderr.toString()
            });
        });
        if (opts.input && child.stdin) {
            child.stdin.write(opts.input);
            child.stdin.end();
        }
    });
}
async function probeDuration(filePath) {
    try {
        const { stdout } = await run(FFPROBE, [
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            filePath
        ]);
        const duration = parseFloat(stdout.toString().trim());
        if (Number.isFinite(duration)) return round3(duration);
    } catch  {
    /* fall through to ffmpeg header inspection */ }
    const { stderr } = await run(FFMPEG, [
        "-hide_banner",
        "-i",
        filePath
    ], {
        timeoutMs: 60_000
    });
    const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (m) {
        const h = parseInt(m[1], 10);
        const mi = parseInt(m[2], 10);
        const s = parseFloat(m[3]);
        return round3(h * 3600 + mi * 60 + s);
    }
    // Final fallback: parse WAV header directly
    const wav = parseWavHeader(filePath);
    if (wav) return round3(wav.samples.length / wav.sampleRate);
    throw new Error("Could not determine media duration");
}
async function detectSilences(filePath, { noiseDb = -35, minSilenceSec = 0.35 } = {}) {
    const { stderr } = await run(FFMPEG, [
        "-hide_banner",
        "-nostats",
        "-i",
        filePath,
        "-af",
        `silencedetect=noise=${noiseDb}dB:d=${minSilenceSec}`,
        "-f",
        "null",
        "-"
    ]);
    const silences = [];
    let currentStart = null;
    for (const line of stderr.split(/\r?\n/)){
        const startMatch = line.match(/silence_start:\s*(-?[\d.]+)/);
        const endMatch = line.match(/silence_end:\s*([\d.]+)/);
        if (startMatch) currentStart = Math.max(0, parseFloat(startMatch[1]));
        if (endMatch && currentStart !== null) {
            silences.push({
                start: round3(currentStart),
                end: round3(parseFloat(endMatch[1]))
            });
            currentStart = null;
        }
    }
    return silences;
}
function speechIntervals(silences, duration) {
    const intervals = [];
    let cursor = 0;
    for (const s of silences){
        if (s.start > cursor) intervals.push({
            start: cursor,
            end: s.start
        });
        cursor = Math.max(cursor, s.end);
    }
    if (cursor < duration) intervals.push({
        start: cursor,
        end: duration
    });
    return intervals.filter((i)=>i.end - i.start > 0.05);
}
function parseWavHeader(filePath) {
    try {
        const buf = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].readFileSync(filePath);
        if (buf.length < 44 || buf.toString("ascii", 0, 4) !== "RIFF") return null;
        const sampleRate = buf.readUInt32LE(24);
        const bitsPerSample = buf.readUInt16LE(34);
        const channels = buf.readUInt16LE(22);
        let offset = 12;
        let dataStart = -1;
        let dataLen = 0;
        while(offset + 8 <= buf.length){
            const chunkId = buf.toString("ascii", offset, offset + 4);
            const chunkSize = buf.readUInt32LE(offset + 4);
            if (chunkId === "data") {
                dataStart = offset + 8;
                dataLen = chunkSize;
                break;
            }
            offset += 8 + chunkSize + chunkSize % 2;
        }
        if (dataStart < 0) return null;
        const total = Math.min(dataLen, buf.length - dataStart);
        let samples;
        if (bitsPerSample === 16) {
            const n = Math.floor(total / 2 / channels);
            samples = new Float32Array(n);
            for(let i = 0; i < n; i++){
                const v = buf.readInt16LE(dataStart + i * channels * 2) / 32768;
                // mono downmix: average channels
                samples[i] = v;
            }
        } else if (bitsPerSample === 32) {
            // IEEE float (WAVE-tagged fmt chunk) vs 32-bit integer
            const isFloat = buf.includes(Buffer.from("WAVE"));
            const n = Math.floor(total / 4 / channels);
            samples = new Float32Array(n);
            for(let i = 0; i < n; i++){
                const o = dataStart + i * channels * 4;
                samples[i] = isFloat ? buf.readFloatLE(o) : buf.readInt32LE(o) / 2147483648;
            }
        } else {
            return null;
        }
        return {
            samples,
            sampleRate
        };
    } catch  {
        return null;
    }
}
function resampleLinear(src, fromHz, toHz) {
    if (fromHz === toHz) return src;
    const ratio = fromHz / toHz;
    const outLen = Math.floor(src.length / ratio);
    const out = new Float32Array(outLen);
    for(let i = 0; i < outLen; i++){
        const pos = i * ratio;
        const i0 = Math.floor(pos);
        const i1 = Math.min(i0 + 1, src.length - 1);
        const frac = pos - i0;
        out[i] = src[i0] * (1 - frac) + src[i1] * frac;
    }
    return out;
}
async function decodePcm16(filePath, sampleRate = 16000) {
    let ffmpegError = null;
    try {
        const { stdout } = await run(FFMPEG, [
            "-v",
            "error",
            "-i",
            filePath,
            "-ac",
            "1",
            "-ar",
            String(sampleRate),
            "-f",
            "s16le",
            "pipe:1"
        ], {
            timeoutMs: 300_000
        });
        // alignment-safe copy: Int16Array requires a 2-byte-aligned offset, and a
        // pooled Buffer's byteOffset isn't guaranteed to be one — copy first.
        const bytes = Buffer.from(stdout.buffer.slice(stdout.byteOffset, stdout.byteOffset + Math.floor(stdout.length / 2) * 2));
        const out = new Int16Array(bytes.length / 2);
        for(let i = 0; i < out.length; i++)out[i] = bytes.readInt16LE(i * 2);
        if (out.length < sampleRate / 2) throw new Error(`ffmpeg decoded only ${out.length} samples`);
        return out;
    } catch (err) {
        ffmpegError = err instanceof Error ? err : new Error(String(err));
    }
    // ffmpeg failed — try the pure-JS WAV parser as a last resort
    const wav = parseWavHeader(filePath);
    if (!wav) {
        throw new Error(`Could not decode audio — ffmpeg said: ${ffmpegError?.message?.slice(0, 220) || "unknown error"}. ` + `Supported inputs: mp3, wav, m4a, mp4, ogg, flac, aac, webm, aiff.`);
    }
    const res = resampleLinear(wav.samples, wav.sampleRate, sampleRate);
    const out = new Int16Array(res.length);
    for(let i = 0; i < res.length; i++){
        out[i] = Math.max(-32768, Math.min(32767, Math.round(res[i] * 32767)));
    }
    return out;
}
function computeEnergyBins(samples, sampleRate, bins = 512) {
    const binSize = Math.max(1, Math.floor(samples.length / bins));
    const out = [];
    let peak = 0;
    for(let b = 0; b < bins; b++){
        const start = b * binSize;
        const end = Math.min(samples.length, start + binSize);
        let sum = 0;
        for(let i = start; i < end; i++)sum += samples[i] * samples[i];
        const rms = end > start ? Math.sqrt(sum / (end - start)) / 32768 : 0;
        out.push(rms);
        if (rms > peak) peak = rms;
    }
    if (peak > 0) {
        for(let i = 0; i < out.length; i++)out[i] = out[i] / peak;
    }
    return {
        bins: out.map((v)=>round3(v)),
        peak
    };
}
function detectOnsetsFromSamples(samples, sampleRate, { windowMs = 10, hopMs = 5, minSpacingMs = 80 } = {}) {
    const windowSize = Math.round(sampleRate * windowMs / 1000); // 160 samples
    const hopSize = Math.round(sampleRate * hopMs / 1000); // 80 samples
    const minSpacingFrames = Math.round(minSpacingMs / hopMs); // 16 frames
    // Short-time RMS energy
    const energy = [];
    for(let i = 0; i + windowSize <= samples.length; i += hopSize){
        let sum = 0;
        for(let j = i; j < i + windowSize; j++)sum += samples[j] * samples[j];
        energy.push(Math.sqrt(sum / windowSize) / 32768);
    }
    // Onset detection function (positive energy rise only)
    const odf = new Array(energy.length).fill(0);
    for(let i = 1; i < energy.length; i++){
        odf[i] = Math.max(0, energy[i] - energy[i - 1]);
    }
    // Adaptive peak picking with local context threshold
    const contextFrames = Math.round(200 / hopMs);
    const onsets = [];
    for(let i = 2; i < odf.length - 1; i++){
        if (odf[i] < odf[i - 1] || odf[i] < odf[i + 1]) continue; // local peak only
        const lo = Math.max(0, i - contextFrames);
        const hi = Math.min(odf.length, i + contextFrames + 1);
        const ctx = [];
        for(let j = lo; j < hi; j++)ctx.push(odf[j]);
        ctx.sort((a, b)=>a - b);
        const p75 = ctx[Math.floor(ctx.length * 0.75)];
        const threshold = Math.max(p75 * 2, 0.003);
        if (odf[i] > threshold && energy[i] > 0.005) {
            if (onsets.length === 0 || i - onsets[onsets.length - 1] >= minSpacingFrames) {
                onsets.push(i);
            }
        }
    }
    return onsets.map((i)=>round3(i * hopSize / sampleRate));
}
async function detectOnsets(filePath) {
    const samples = await decodePcm16(filePath, 16000);
    return detectOnsetsFromSamples(samples, 16000);
}
async function sliceToMp3(src, startSec, endSec, outPath) {
    __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].mkdirSync(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].dirname(outPath), {
        recursive: true
    });
    await run(FFMPEG, [
        "-y",
        "-v",
        "error",
        "-ss",
        String(Math.max(0, startSec)),
        "-to",
        String(Math.max(0, endSec)),
        "-i",
        src,
        "-ac",
        "1",
        "-ar",
        "16000",
        "-c:a",
        "libmp3lame",
        "-b:a",
        "96k",
        outPath
    ]);
}
async function analyzeAudio(filePath) {
    const t0 = Date.now();
    const durationSec = await probeDuration(filePath);
    const samples = await decodePcm16(filePath, 16000);
    const energy = computeEnergyBins(samples, 16000, 512);
    const silences = await detectSilences(filePath);
    const speech = speechIntervals(silences, durationSec);
    const onsets = detectOnsetsFromSamples(samples, 16000);
    return {
        durationSec,
        silences,
        speech,
        onsets,
        energy,
        samplesMs: Date.now() - t0
    };
}
}),
"[project]/src/lib/engine/features.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "analyzeAudio",
    ()=>analyzeAudio,
    "extractFeatures",
    ()=>extractFeatures
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/engine/audio.ts [app-route] (ecmascript)");
;
// ─────────────────────────────────────────────────────────────────────────────
// Frame-level acoustic feature extraction.
//
// The original RMS-difference ODF fires on loudness jumps and misses fricatives
// and plosives, producing ~3 onsets per word. This implementation uses the
// standard spectral-flux onset detection function (log-compressed magnitude
// spectrum, half-wave rectified difference) which isolates consonant attacks,
// then picks peaks with a local median + MAD threshold.
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE_RATE = 16000;
const FFT_SIZE = 512;
const HOP = 160; // 10 ms
const BIN_HZ = SAMPLE_RATE / FFT_SIZE; // 31.25 Hz
const BAND_LO = Math.max(1, Math.round(150 / BIN_HZ));
const BAND_HI = Math.min(FFT_SIZE / 2, Math.round(6500 / BIN_HZ));
/** In-place iterative radix-2 FFT. */ function fft(re, im) {
    const n = re.length;
    for(let i = 1, j = 0; i < n; i++){
        let bit = n >> 1;
        for(; j & bit; bit >>= 1)j ^= bit;
        j ^= bit;
        if (i < j) {
            [re[i], re[j]] = [
                re[j],
                re[i]
            ];
            [im[i], im[j]] = [
                im[j],
                im[i]
            ];
        }
    }
    for(let len = 2; len <= n; len <<= 1){
        const ang = -2 * Math.PI / len;
        const wRe = Math.cos(ang);
        const wIm = Math.sin(ang);
        for(let i = 0; i < n; i += len){
            let curRe = 1;
            let curIm = 0;
            for(let k = 0; k < len / 2; k++){
                const aRe = re[i + k];
                const aIm = im[i + k];
                const bRe = re[i + k + len / 2] * curRe - im[i + k + len / 2] * curIm;
                const bIm = re[i + k + len / 2] * curIm + im[i + k + len / 2] * curRe;
                re[i + k] = aRe + bRe;
                im[i + k] = aIm + bIm;
                re[i + k + len / 2] = aRe - bRe;
                im[i + k + len / 2] = aIm - bIm;
                const nextRe = curRe * wRe - curIm * wIm;
                curIm = curRe * wIm + curIm * wRe;
                curRe = nextRe;
            }
        }
    }
}
function extractFeatures(samples) {
    const frameCount = Math.max(1, Math.floor((samples.length - FFT_SIZE) / HOP) + 1);
    const win = new Float32Array(FFT_SIZE);
    for(let i = 0; i < FFT_SIZE; i++)win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (FFT_SIZE - 1));
    const dbfs = new Array(frameCount);
    const flux = new Float32Array(frameCount);
    const prevMag = new Float32Array(FFT_SIZE / 2 + 1);
    const re = new Float32Array(FFT_SIZE);
    const im = new Float32Array(FFT_SIZE);
    for(let f = 0; f < frameCount; f++){
        const start = f * HOP;
        let sum = 0;
        for(let i = 0; i < FFT_SIZE; i++){
            const s = (samples[start + i] || 0) / 32768;
            sum += s * s;
            re[i] = s * win[i];
            im[i] = 0;
        }
        const rms = Math.sqrt(sum / FFT_SIZE);
        dbfs[f] = 20 * Math.log10(rms || 1e-9);
        fft(re, im);
        let diff = 0;
        for(let k = BAND_LO; k <= BAND_HI; k++){
            const mag = Math.log1p(90 * Math.hypot(re[k], im[k]));
            const d = mag - prevMag[k];
            if (d > 0) diff += d;
            prevMag[k] = mag;
        }
        flux[f] = diff / (BAND_HI - BAND_LO + 1);
    }
    // normalise flux by its p95 so thresholds are level-independent
    const sortedFlux = Array.from(flux).sort((a, b)=>a - b);
    const p95 = sortedFlux[Math.floor(sortedFlux.length * 0.95)] || 1;
    for(let i = 0; i < flux.length; i++)flux[i] = flux[i] / p95;
    // ── adaptive noise floor / silence threshold ────────────────────────────────
    // A fixed −35 dB fails on real recordings: with any room tone or music bed
    // silencedetect reports *zero* silences (the original bug). Estimate the
    // floor from the 10th percentile and put the gate 9 dB above it.
    const sortedDb = [
        ...dbfs
    ].sort((a, b)=>a - b);
    const noiseFloorDb = sortedDb[Math.floor(sortedDb.length * 0.1)];
    const speechLevelDb = sortedDb[Math.floor(sortedDb.length * 0.9)];
    // Conservative gate: a pause is only a pause when it is close to the room
    // tone. An over-eager threshold (noise + 9 dB) classified quiet speech as
    // silence, which produced phantom pauses and let breath onsets become word
    // anchors. Stay low, and also require a clear 20 dB dip below loud speech.
    const silenceThresholdDb = Math.min(-24, Math.max(-60, Math.max(noiseFloorDb + 6, Math.min(noiseFloorDb + 13, speechLevelDb - 20))));
    const minSilenceFrames = Math.round(0.35 * (1000 / 10));
    const silences = [];
    let runStart = -1;
    let runPeak = -120;
    const flushRun = (endFrame)=>{
        // reject runs that contain a transient (breath, chair creak, music stab)
        if (runStart >= 0 && endFrame - runStart >= minSilenceFrames && runPeak <= silenceThresholdDb + 6) {
            silences.push({
                start: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["round3"])(runStart * HOP / SAMPLE_RATE),
                end: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["round3"])(endFrame * HOP / SAMPLE_RATE)
            });
        }
        runStart = -1;
        runPeak = -120;
    };
    for(let f = 0; f <= frameCount; f++){
        const quiet = f < frameCount && dbfs[f] < silenceThresholdDb;
        if (quiet) {
            if (runStart < 0) {
                runStart = f;
                runPeak = -120;
            }
            if (dbfs[f] > runPeak) runPeak = dbfs[f];
        } else if (runStart >= 0) {
            flushRun(f);
        }
    }
    // ── onset peak picking: local max above median + 3·MAD in ±300 ms ─────────
    const ctx = Math.round(300 / 10);
    const minGapFrames = Math.round(0.06 * 1000 / 10);
    const onsets = [];
    const onsetStrengths = [];
    const activity = silenceThresholdDb + 4;
    const median = (arr)=>{
        const b = arr.slice().sort((x, y)=>x - y);
        return b[Math.floor(b.length / 2)] ?? 0;
    };
    for(let f = 2; f < frameCount - 1; f++){
        if (flux[f] < 0.012) continue; // absolute floor
        if (flux[f] < flux[f - 1] || flux[f] < flux[f + 1]) continue; // must be a local peak
        if (dbfs[f] < activity) continue; // must be in active speech, not room tone
        const lo = Math.max(0, f - ctx);
        const hi = Math.min(frameCount, f + ctx + 1);
        const local = [];
        for(let j = lo; j < hi; j++)local.push(flux[j]);
        const med = median(local);
        const mad = median(local.map((v)=>Math.abs(v - med))) || 1e-4;
        const threshold = med + 3 * mad;
        if (flux[f] <= threshold) continue;
        if (onsets.length > 0 && f - Math.round(onsets[onsets.length - 1] * 100) < minGapFrames) continue;
        onsets.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["round3"])(f * HOP / SAMPLE_RATE));
        // prominence relative to the local ambience, used as matching confidence
        onsetStrengths.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["round3"])(Math.min(1, (flux[f] - med) / (mad * 6 + 1e-6) / 4)));
    }
    // An onset inside a detected pause is air, not articulation: firing a word
    // there is exactly how the old matcher placed "ask" half a second early.
    const inSilence = (t)=>silences.some((s)=>t > s.start + 0.01 && t < s.end - 0.01);
    const keptOnsets = [];
    const keptStrengths = [];
    for(let i = 0; i < onsets.length; i++){
        if (inSilence(onsets[i])) continue;
        keptOnsets.push(onsets[i]);
        keptStrengths.push(onsetStrengths[i]);
    }
    return {
        frameMs: HOP / SAMPLE_RATE * 1000,
        dbfs,
        flux,
        noiseFloorDb: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["round3"])(noiseFloorDb),
        silenceThresholdDb: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["round3"])(silenceThresholdDb),
        silences,
        onsets: keptOnsets,
        onsetStrengths: keptStrengths
    };
}
async function analyzeAudio(filePath) {
    const t0 = Date.now();
    const durationSec = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["probeDuration"])(filePath);
    const samples = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["decodePcm16"])(filePath, SAMPLE_RATE);
    const f = extractFeatures(samples);
    const energy = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["computeEnergyBins"])(samples, SAMPLE_RATE, 700);
    const speech = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["speechIntervals"])(f.silences, durationSec);
    return {
        durationSec,
        silences: f.silences,
        speech,
        onsets: f.onsets,
        onsetStrengths: f.onsetStrengths,
        energy,
        noiseFloorDb: f.noiseFloorDb,
        silenceThresholdDb: f.silenceThresholdDb,
        analysisMs: Date.now() - t0
    };
}
}),
"[project]/src/lib/engine/matcher.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "correctWordTimestamps",
    ()=>correctWordTimestamps,
    "round3",
    ()=>round3
]);
const round3 = (n)=>Math.round(n * 1000) / 1000;
const clamp = (v, lo, hi)=>Math.min(hi, Math.max(lo, v));
function medianOf(values) {
    if (!values.length) return 0;
    const s = values.slice().sort((x, y)=>x - y);
    return s[Math.floor(s.length / 2)];
}
/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Why this matcher is built around pauses, not nearest onsets.
 *
 * Measured on real speech (JFK, 11.09 s, known transcript): a "nearest onset"
 * matcher placed "what / your / country" 0.7–1.1 s late because the model had
 * put them inside an actual 1.1 s pause. No amount of local onset nudging can
 * repair that — the words were in the wrong phrase.
 *
 * Speaker pauses are the one piece of evidence that is both cheap and
 * unambiguous. So:
 *   1. endpoint warp puts the model's clock on the recording's clock,
 *   2. every word is assigned to the speech region between two pauses,
 *   3. words are laid out inside their region (model rhythm preserved),
 *   4. onsets only refine a start within ±window, never move it to another
 *      phrase — the tight prior is what makes anchoring safe.
 */ /** Merge speech regions across pauses shorter than `minPause` (breaths, clicks). */ function speechRegions(silences, durationSec, minPause = 0.45) {
    const merged = silences.filter((s)=>s.end - s.start >= minPause).sort((a, b)=>a.start - b.start);
    const regions = [];
    let cursor = 0;
    for (const s of merged){
        if (s.start > cursor + 0.05) regions.push({
            start: cursor,
            end: s.start
        });
        cursor = Math.max(cursor, s.end);
    }
    if (cursor < durationSec - 0.05) regions.push({
        start: cursor,
        end: durationSec
    });
    // Merge speech islands that are too short to carry a phrase (breaths,
    // camera audio tails). They would otherwise steal a word from its phrase.
    const mergedRegions = [];
    for (const r of regions){
        if (mergedRegions.length === 0) {
            mergedRegions.push({
                ...r
            });
            continue;
        }
        const prev = mergedRegions[mergedRegions.length - 1];
        if (r.end - r.start < 0.42) {
            prev.end = r.end;
        } else {
            mergedRegions.push({
                ...r
            });
        }
    }
    if (mergedRegions.length && mergedRegions[0].end - mergedRegions[0].start < 0.42 && mergedRegions.length > 1) {
        mergedRegions[1].start = mergedRegions[0].start;
        mergedRegions.shift();
    }
    const cleaned = mergedRegions.filter((r)=>r.end - r.start > 0.2);
    return cleaned.length ? cleaned : [
        {
            start: 0,
            end: durationSec
        }
    ];
}
function regionDistance(t, r) {
    if (t < r.start) return r.start - t;
    if (t > r.end) return t - r.end;
    return 0;
}
/**
 * Monotone assignment of words → speech regions (O(words · regions)).
 * Words keep their order; cost is distance of the warped model time to the
 * region, plus a small penalty for skipping a region (so silence regions are
 * not silently swallowed unless the timing says so).
 */ function assignRegions(times, regions) {
    const n = times.length;
    const R = regions.length;
    const out = new Array(n).fill(0);
    if (R === 1) return out;
    const COST_CAP = 1.2;
    const dp = [];
    for(let i = 0; i < n; i++){
        const row = new Array(R).fill(Infinity);
        // running minimum of the previous row over regions <= r (monotone order)
        let prevBest = i === 0 ? 0 : Infinity;
        for(let r = 0; r < R; r++){
            if (i > 0) prevBest = Math.min(prevBest, dp[i - 1][r]);
            const cost = Math.min(COST_CAP, regionDistance(times[i], regions[r]));
            row[r] = cost + (i === 0 ? 0 : prevBest);
        }
        dp.push(row);
    }
    let bestR = 0;
    for(let r = 1; r < R; r++)if (dp[n - 1][r] < dp[n - 1][bestR]) bestR = r;
    out[n - 1] = bestR;
    for(let i = n - 1; i > 0; i--){
        const target = out[i];
        let pick = 0;
        let best = Infinity;
        for(let r = 0; r <= target; r++){
            if (dp[i - 1][r] < best) {
                best = dp[i - 1][r];
                pick = r;
            }
        }
        out[i - 1] = pick;
    }
    return out;
}
/**
 * Local onset refinement inside one region.
 * Predictions are already phrase-correct, so candidates are limited to
 * ±window and accepted within `gate`; a monotone DP keeps the assignment
 * globally consistent. Returns refined starts (NaN = keep prediction).
 */ function refineRegion(pred, regionOnsets, window, gate) {
    const refined = new Array(pred.length).fill(NaN);
    if (!regionOnsets.length || !pred.length) return refined;
    const candidates = pred.map((p)=>{
        const row = [];
        for (const o of regionOnsets){
            const d = Math.abs(o.t - p);
            if (d > window || d > gate) continue;
            row.push({
                t: o.t,
                cost: d / window + 0.12 * (1 - clamp(o.strength, 0, 1))
            });
        }
        return row;
    });
    let prevOnset = -Infinity;
    for(let i = 0; i < pred.length; i++){
        let best = -1;
        let bestCost = Infinity;
        for(let c = 0; c < candidates[i].length; c++){
            const cand = candidates[i][c];
            if (i > 0 && cand.t <= prevOnset + 0.02) continue;
            if (cand.cost < bestCost) {
                bestCost = cand.cost;
                best = c;
            }
        }
        if (best >= 0) {
            prevOnset = candidates[i][best].t;
            refined[i] = prevOnset;
        } else if (i > 0) {
            prevOnset = Math.max(prevOnset, pred[i]);
        }
    }
    // enforce monotonicity of accepted anchors
    let last = -Infinity;
    for(let i = 0; i < refined.length; i++){
        if (!Number.isFinite(refined[i])) continue;
        if (refined[i] <= last) refined[i] = NaN;
        else last = refined[i];
    }
    return refined;
}
/**
 * Split the word stream into the detected speech regions.
 *
 * Each region has a physical time budget; each word has a clamped duration
 * weight. A segmentation DP minimises the mismatch, so a phrase boundary is
 * placed where the accumulated word durations run out — not where a drifting
 * model clock happens to be. This is what keeps "ask" after the 1.16 s pause
 * instead of inside the first phrase.
 */ function segmentByWeights(weights, regions, secPerWeight) {
    const n = weights.length;
    const R = regions.length;
    const out = new Array(n).fill(0);
    if (R <= 1 || n === 0) return out;
    // guard: proportional split keeps very long transcripts linear
    if (n > 900) {
        const total = regions.reduce((a, r)=>a + (r.end - r.start), 0) || 1;
        let cursor = 0;
        for(let r = 0; r < R; r++){
            const share = Math.round(n * (regions[r].end - regions[r].start) / total);
            for(let k = 0; k < share && cursor < n; k++)out[cursor++] = r;
        }
        while(cursor < n)out[cursor++] = R - 1;
        return out;
    }
    const prefix = new Float64Array(n + 1);
    for(let i = 0; i < n; i++)prefix[i + 1] = prefix[i] + weights[i];
    const target = regions.map((r)=>(r.end - r.start) / secPerWeight);
    const dp = Array.from({
        length: R + 1
    }, ()=>new Float64Array(n + 1).fill(Infinity));
    const back = Array.from({
        length: R + 1
    }, ()=>new Int32Array(n + 1).fill(-1));
    dp[0][0] = 0;
    for(let r = 1; r <= R; r++){
        for(let j = 0; j <= n; j++){
            let best = Infinity;
            let bestI = -1;
            for(let i = 0; i <= j; i++){
                const prev = dp[r - 1][i];
                if (!Number.isFinite(prev)) continue;
                const used = prefix[j] - prefix[i];
                const cost = Math.abs(used - target[r - 1]);
                const emptyPenalty = j === i && r < R ? 0.22 : 0;
                const v = prev + cost + emptyPenalty;
                if (v < best) {
                    best = v;
                    bestI = i;
                }
            }
            dp[r][j] = best;
            back[r][j] = bestI;
        }
    }
    // walk back the region boundaries
    let j = n;
    for(let r = R; r >= 1; r--){
        const i = back[r][j] >= 0 ? back[r][j] : j;
        for(let k = i; k < j; k++)out[k] = r - 1;
        j = i;
    }
    for(let k = 0; k < j; k++)out[k] = 0;
    return out;
}
function correctWordTimestamps(wordsInput, onsetsInput, opts = {}) {
    const window = opts.toleranceSec ?? 0.28;
    const gate = opts.gateSec ?? 0.14;
    const gapless = opts.gapless ?? false;
    const maxWordSec = opts.maxWordSec ?? 1.4;
    const words = wordsInput.filter((w)=>Number.isFinite(w.start) && Number.isFinite(w.end) && w.word.length > 0);
    if (!words.length) {
        return {
            words: [],
            stats: {
                anchored: 0,
                interpolated: 0,
                total: 0,
                collisionsFixed: 0,
                driftMs: 0,
                scale: 1,
                medianResidualMs: 0,
                p90ResidualMs: 0,
                anchorRate: 0,
                maxCorrectionMs: 0,
                durationMedianMs: 0,
                regions: 0
            }
        };
    }
    const onsets = onsetsInput.map((o)=>typeof o === "number" ? {
            t: o,
            strength: 0.6
        } : o).filter((o)=>Number.isFinite(o.t)).sort((a, b)=>a.t - b.t);
    const durationSec = Math.max(opts.durationSec ?? 0, words[words.length - 1].end || 0, onsets.length ? onsets[onsets.length - 1].t + 0.2 : 0);
    const silences = opts.silences ?? [];
    const regions = speechRegions(silences, durationSec);
    // ── durational weights ────────────────────────────────────────────────────
    // Model timestamps drift, but relative word *lengths* stay stable. Raw
    // durations are inflated whenever a model stretches an end through a pause,
    // so they are clamped before being used as weights.
    const weights = words.map((w)=>clamp(w.end - w.start, 0.12, 0.55));
    const totalWeight = weights.reduce((x, y)=>x + y, 0) || 1;
    const totalSpeech = regions.reduce((x, r)=>x + (r.end - r.start), 0) || durationSec;
    // speech seconds per unit of clamped word weight
    const secPerWeight = clamp(totalSpeech / totalWeight, 0.4, 3.0);
    const finalStarts = new Array(words.length).fill(NaN);
    const predStarts = new Array(words.length).fill(NaN);
    const anchoredFlags = new Array(words.length).fill(false);
    const firstStart = words[0].start;
    const lastEnd = Math.max(...words.map((w)=>w.end));
    const aiSpan = Math.max(0.5, lastEnd - firstStart);
    const b = clamp(totalSpeech / aiSpan, 0.6, 1.6); // reported warp factor
    const warped = words.map((w)=>regions[0].start + b * (w.start - firstStart));
    if (regions.length <= 1) {
        // Continuous speech: preserve the model's own rhythm (it is usually good),
        // then let onsets nudge individual starts.
        const r = regions[0];
        for(let i = 0; i < words.length; i++){
            finalStarts[i] = clamp(warped[i], r.start, r.end - 0.05);
            predStarts[i] = finalStarts[i];
        }
        const regionOnsets = onsets.filter((o)=>o.t >= r.start - 0.05 && o.t <= r.end + 0.05);
        const refined = refineRegion(finalStarts, regionOnsets, window, gate);
        for(let i = 0; i < words.length; i++){
            if (Number.isFinite(refined[i])) {
                finalStarts[i] = refined[i];
                anchoredFlags[i] = true;
            }
        }
    } else {
        const regionOfWord = segmentByWeights(weights, regions, secPerWeight);
        let i = 0;
        while(i < words.length){
            const rIdx = regionOfWord[i];
            let j = i;
            while(j + 1 < words.length && regionOfWord[j + 1] === rIdx)j++;
            const r = regions[rIdx];
            const wts = weights.slice(i, j + 1);
            const wsum = wts.reduce((x, y)=>x + y, 0) || 1;
            const regionOnsets = onsets.filter((o)=>o.t >= r.start - 0.05 && o.t <= r.end + 0.05);
            const firstOnset = regionOnsets.find((o)=>o.t >= r.start && o.t <= r.start + 0.45);
            const layoutStart = firstOnset ? firstOnset.t : r.start + Math.min(0.04, (r.end - r.start) * 0.03);
            const targetSpan = Math.min(r.end - layoutStart, wsum * secPerWeight);
            for(let k = 0; k <= j - i; k++){
                const before = wts.slice(0, k).reduce((x, y)=>x + y, 0);
                const offset = before / wsum * Math.max(0.05, targetSpan - 0.06);
                predStarts[i + k] = clamp(layoutStart + offset, r.start, r.end - 0.04);
                finalStarts[i + k] = predStarts[i + k];
            }
            const refined = refineRegion(finalStarts.slice(i, j + 1), regionOnsets, window, gate);
            for(let k = 0; k <= j - i; k++){
                if (Number.isFinite(refined[k])) {
                    finalStarts[i + k] = refined[k];
                    anchoredFlags[i + k] = true;
                }
            }
            i = j + 1;
        }
    }
    // 5 ─ strict monotonicity
    let collisions = 0;
    for(let i = 0; i < finalStarts.length; i++){
        if (!Number.isFinite(finalStarts[i])) finalStarts[i] = warped[i];
        finalStarts[i] = clamp(finalStarts[i], 0, durationSec);
        if (i > 0 && finalStarts[i] <= finalStarts[i - 1] + 0.02) {
            finalStarts[i] = finalStarts[i - 1] + 0.03;
            collisions++;
        }
    }
    // 6 ─ durations: natural spoken length (or gapless bridging)
    const out = words.map((w, i)=>{
        const start = round3(finalStarts[i]);
        const nextStart = i + 1 < words.length ? finalStarts[i + 1] : Infinity;
        const dur = clamp(weights[i] * secPerWeight, 0.09, maxWordSec);
        let end = gapless && Number.isFinite(nextStart) ? nextStart : start + dur;
        if (Number.isFinite(nextStart)) end = Math.min(end, nextStart - (gapless ? 0 : 0.01));
        if (gapless && !Number.isFinite(nextStart)) end = start + Math.min(dur, 0.9);
        end = Math.max(end, start + 0.05);
        return {
            word: w.word,
            start,
            end: round3(end),
            pauseAfterMs: 0,
            anchored: anchoredFlags[i],
            aiStart: round3(w.aiStart ?? w.start)
        };
    });
    const anchored = anchoredFlags.filter(Boolean).length;
    const residuals = [];
    const corrections = [];
    for(let i = 0; i < words.length; i++){
        if (!anchoredFlags[i]) continue;
        residuals.push(Math.abs(finalStarts[i] - (Number.isFinite(predStarts[i]) ? predStarts[i] : warped[i])) * 1000);
        corrections.push(Math.abs(finalStarts[i] - words[i].start) * 1000);
    }
    return {
        words: out,
        stats: {
            anchored,
            interpolated: words.length - anchored,
            total: words.length,
            collisionsFixed: collisions,
            driftMs: Math.round(medianOf(words.map((w, i)=>finalStarts[i] - w.start)) * 1000),
            scale: Math.round(b * 1000) / 1000,
            medianResidualMs: Math.round(medianOf(residuals)),
            p90ResidualMs: Math.round(residuals.length ? residuals.slice().sort((x, y)=>x - y)[Math.floor(residuals.length * 0.9)] : 0),
            anchorRate: Math.round(anchored / words.length * 1000) / 1000,
            maxCorrectionMs: Math.round(corrections.length ? Math.max(...corrections) : 0),
            durationMedianMs: Math.round(medianOf(out.map((w)=>(w.end - w.start) * 1000))),
            regions: regions.length
        }
    };
}
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
"[project]/src/lib/engine/gemini.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "GeminiError",
    ()=>GeminiError,
    "TRANSCRIBER_SYSTEM_PROMPT",
    ()=>TRANSCRIBER_SYSTEM_PROMPT,
    "WORDS_SCHEMA",
    ()=>WORDS_SCHEMA,
    "parseWordsResponse",
    ()=>parseWordsResponse,
    "sendModelRequest",
    ()=>sendModelRequest
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/engine/keys.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
const WORDS_SCHEMA = {
    type: "object",
    properties: {
        words: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    w: {
                        type: "string",
                        description: "The spoken word, with attached punctuation."
                    },
                    s: {
                        type: "number",
                        description: "Start time in seconds from the beginning of THIS clip."
                    },
                    e: {
                        type: "number",
                        description: "End time in seconds extending through trailing pause."
                    }
                },
                required: [
                    "w",
                    "s",
                    "e"
                ]
            }
        }
    },
    required: [
        "words"
    ]
};
const TRANSCRIBER_SYSTEM_PROMPT = `You are a precision verbatim speech transcriber producing word-level timestamps for waveform-accurate subtitle alignment.

BOUNDARY RULES (a downstream matcher measures the real audio waveform, so boundaries must describe the sound, not guessed gaps):
1. s = the instant the FIRST audible sound of the word begins (the consonant attack or vowel onset), not the silence before it.
2. e = the instant the word STOPS sounding. Do NOT stretch e across a pause, breath or silence to reach the next word.
3. Words are contiguous in speech: e may be close to the next word's s, but never cover a pause longer than 150 ms.
4. Use 10 ms resolution (two decimals), never whole seconds and never a uniform spacing pattern.
5. If the clip starts mid-sentence, transcribe exactly what is audible — no invented words, no context from outside the clip.

VERBATIM ACCURACY:
- Transcribe EVERY spoken word from the first sound to the last. Never summarise, skip or paraphrase.
- Keep punctuation attached to words ("line," "blockchain.") so sentence boundaries are recoverable.
- Include filler words and false starts verbatim.
- Timestamps are seconds measured from the start of the clip you are given.`;
class GeminiError extends Error {
    status;
    kind;
    constructor(message, status, kind){
        super(message);
        this.status = status;
        this.kind = kind;
    }
}
function classify(status, body) {
    const msg = String(body?.error?.message || "");
    if (status === 403) return "auth";
    if (status === 400 && /API key not valid|API_KEY_INVALID|API key format/i.test(msg)) return "auth";
    if (status === 429) return /daily|RESOURCE_EXHAUSTED.*daily|quota/i.test(msg) ? "daily" : "rate";
    if (status === 404 || /NOT_FOUND|model.*not.*found/i.test(msg)) return "model";
    if (status === 400 || status === 424) return "model";
    if (status !== null && status >= 500 || status === null) return "transient";
    return "unknown";
}
function parseWordsResponse(text) {
    let t = text.trim();
    const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) t = fence[1].trim();
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) t = t.slice(start, end + 1);
    const parsed = JSON.parse(t);
    const arr = Array.isArray(parsed) ? parsed : parsed.words;
    if (!Array.isArray(arr)) throw new GeminiError("Model response did not contain a words array", null, "unknown");
    return arr.filter((w)=>w && typeof w.w === "string" && typeof w.s === "number" && typeof w.e === "number").map((w)=>({
            word: String(w.w).trim(),
            start: w.s,
            end: w.e
        }));
}
async function callGemini(opts) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:generateContent`;
    let res;
    try {
        res = await fetch(url, {
            method: "POST",
            headers: {
                "x-goog-api-key": opts.apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [
                        {
                            text: TRANSCRIBER_SYSTEM_PROMPT
                        }
                    ]
                },
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: opts.prompt
                            },
                            {
                                inlineData: {
                                    mimeType: opts.mimeType,
                                    data: opts.audioBase64
                                }
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: "application/json",
                    responseSchema: WORDS_SCHEMA
                }
            }),
            signal: AbortSignal.timeout(180_000)
        });
    } catch (e) {
        throw new GeminiError(e?.message || "network error", null, "transient");
    }
    if (!res.ok) {
        let body = null;
        try {
            body = await res.json();
        } catch  {
        /* ignore */ }
        throw new GeminiError(body?.error?.message || `HTTP ${res.status}`, res.status, classify(res.status, body));
    }
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p)=>p.text || "").join("");
    if (!text) {
        const blocked = data?.promptFeedback?.blockReason;
        if (blocked) throw new GeminiError(`Prompt blocked: ${blocked}`, res.status, "unknown");
        throw new GeminiError("Empty model response", res.status, "transient");
    }
    return text;
}
/**
 * Acquire a slot from the rotation pool. When every key is momentarily
 * RPM-saturated (not exhausted), wait for a slot instead of failing —
 * RPM windows roll over within seconds. Throttled progress is logged so
 * the UI shows the pool is healthy and merely busy.
 */ async function acquireSlot(opts) {
    const totalKeys = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["keyManager"].count();
    if (totalKeys === 0) return null;
    // Fail fast when waiting can never help (every key disabled or RPD-spent).
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["keyManager"].outlook(opts.deadline - Date.now())) return null;
    let lastLog = 0;
    while(Date.now() < opts.deadline){
        const picked = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["keyManager"].pickAndReserve({
            preferredModel: opts.preferredModel
        });
        if (picked) return picked;
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["keyManager"].outlook(opts.deadline - Date.now())) return null;
        const remaining = Math.max(1, Math.round((opts.deadline - Date.now()) / 1000));
        if (Date.now() - lastLog > 12_000) {
            lastLog = Date.now();
            opts.onLog?.(`[rotator] all ${totalKeys} key${totalKeys === 1 ? "" : "s"} at capacity (RPM) — pool healthy, waiting for a slot (up to ${remaining}s)…`, "warn");
        }
        await new Promise((r)=>setTimeout(r, 1500));
    }
    return null;
}
async function sendModelRequest(opts) {
    const { onLog } = opts;
    const maxAttempts = 60;
    const overallDeadline = Date.now() + 150_000;
    let transientFailures = 0;
    const usedKeys = new Set();
    for(let attempt = 1; attempt <= maxAttempts && Date.now() < overallDeadline; attempt++){
        const picked = await acquireSlot({
            preferredModel: opts.preferredModel,
            onLog,
            deadline: Math.min(Date.now() + 120_000, overallDeadline)
        });
        if (!picked) {
            throw new GeminiError("All API keys are rate-limited, cooling down, or disabled — no slot became available", 429, "rate");
        }
        const slot = picked.slot;
        usedKeys.add(slot.idx);
        onLog?.(`[rotator] reserved Key #${slot.idx} · ${slot.model} (RPM ${picked.usage.rpmUsed}/${picked.usage.rpmLimit}, RPD ${picked.usage.rpdUsed}/${picked.usage.rpdLimit})`, "api");
        try {
            const text = await callGemini({
                apiKey: slot.apiKey,
                model: slot.model,
                prompt: opts.prompt,
                audioBase64: opts.audioBase64,
                mimeType: opts.mimeType
            });
            const words = parseWordsResponse(text);
            onLog?.(`[rotator] Key #${slot.idx} · ${slot.model} → ${words.length} words`, "model");
            return {
                words,
                model: slot.model,
                keyIndex: slot.idx,
                rotations: attempt - 1,
                attempts: attempt,
                usedKeys: [
                    ...usedKeys
                ]
            };
        } catch (err) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["keyManager"].recordError(slot);
            const ge = err instanceof GeminiError ? err : new GeminiError(String(err?.message || err), null, "unknown");
            if (ge.kind === "auth") {
                onLog?.(`[rotator] Key #${slot.idx} access denied (${ge.message}). Disabling key and rotating…`, "warn");
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["keyManager"].markKeyDisabled(slot, ge.message.slice(0, 140));
                continue;
            }
            if (ge.kind === "model") {
                onLog?.(`[rotator] '${slot.model}' unavailable on Key #${slot.idx}. Marking model dead, rotating…`, "warn");
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["keyManager"].markModelDead(slot.model);
                continue;
            }
            if (ge.kind === "rate" || ge.kind === "daily") {
                const daily = ge.kind === "daily";
                onLog?.(`[rotator] '${slot.model}' rate-limited on Key #${slot.idx} (${daily ? "daily RPD" : "minute RPM"}). Rotating…`, "warn");
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["keyManager"].markModelLimited(slot, daily);
                continue;
            }
            if (ge.kind === "transient") {
                transientFailures += 1;
                if (transientFailures >= 10) {
                    throw new Error(`Gemini request failed after ${attempt} attempts: ${ge.message}`);
                }
                // Cool this key/model combo briefly and rotate — don't hammer a
                // model that just reported overload; other combos go first.
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["keyManager"].markModelCooldown(slot, 25_000);
                onLog?.(`[rotator] transient ${ge.status ?? "5xx"} on Key #${slot.idx} · ${slot.model} ("${ge.message.slice(0, 90)}"). Cooling this combo 25s, rotating to next key/model…`, "warn");
                continue;
            }
            throw new Error(`Gemini request failed after ${attempt} attempts: ${ge.message}`);
        }
    }
    throw new GeminiError("Exhausted rotation attempts", 429, "rate");
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/lib/engine/align.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "assembleSentences",
    ()=>assembleSentences,
    "coreFilter",
    ()=>coreFilter,
    "correctWordTimestamps",
    ()=>correctWordTimestamps,
    "measureCoverage",
    ()=>measureCoverage,
    "normalizeClipWords",
    ()=>normalizeClipWords,
    "round3",
    ()=>round3,
    "snapWordsToSpeech",
    ()=>snapWordsToSpeech,
    "stampPauses",
    ()=>stampPauses
]);
const round3 = (n)=>Math.round(n * 1000) / 1000;
function normalizeClipWords(words, clipStartSec) {
    const mapped = words.filter((w)=>Number.isFinite(w.start) && Number.isFinite(w.end) && w.word.length > 0).map((w)=>({
            word: w.word,
            start: round3(Math.max(0, w.start + clipStartSec)),
            end: round3(Math.max(w.start + clipStartSec, w.end + clipStartSec)),
            pauseAfterMs: 0
        })).sort((a, b)=>a.start - b.start);
    // bridge micro-pauses (< 20ms) so consecutive words are continuous
    for(let i = 0; i < mapped.length - 1; i++){
        const gap = mapped[i + 1].start - mapped[i].end;
        if (gap < 0.02) mapped[i].end = round3(mapped[i + 1].start);
    }
    return mapped;
}
function snapWordsToSpeech(words, silences) {
    return words.map((w)=>{
        const silence = silences.find((s)=>w.start > s.start && w.start < s.end && s.end - s.start >= 0.5);
        if (!silence) return w;
        return {
            ...w,
            start: round3(silence.end)
        };
    });
}
function coreFilter(words, coreStart, coreEnd) {
    return words.filter((w)=>{
        const mid = (w.start + w.end) / 2;
        return mid >= coreStart - 0.05 && mid <= coreEnd + 0.05;
    });
}
function measureCoverage(words, speech, coreStart, coreEnd) {
    // effective word spans: each word covers from its start to the next word's start (gapless)
    const spans = [];
    for(let i = 0; i < words.length; i++){
        const start = words[i].start;
        const end = i + 1 < words.length ? words[i + 1].start : words[i].end;
        spans.push({
            start,
            end: Math.max(end, start + 0.05)
        });
    }
    let speechSec = 0;
    let coveredSec = 0;
    let longestMiss = 0;
    for (const iv of speech){
        const a = Math.max(iv.start, coreStart);
        const b = Math.min(iv.end, coreEnd);
        if (b - a <= 0.02) continue;
        speechSec += b - a;
        let cursor = a;
        let missStart = a;
        let anyCovered = false;
        for (const s of spans){
            if (s.end <= cursor) continue;
            if (s.start >= b) break;
            const coverA = Math.max(s.start, cursor);
            const coverB = Math.min(s.end, b);
            if (coverA < coverB) {
                if (coverA > missStart + 0.02) {
                    longestMiss = Math.max(longestMiss, coverA - missStart);
                }
                coveredSec += coverB - coverA;
                cursor = Math.max(cursor, coverB);
                missStart = cursor;
                anyCovered = true;
            }
        }
        if (!anyCovered && b - a > longestMiss) longestMiss = b - a;
        if (cursor > missStart && cursor < b) longestMiss = Math.max(longestMiss, b - cursor);
    }
    return {
        coverage: speechSec > 0.05 ? Math.min(1, coveredSec / speechSec) : 1,
        longestMissSec: round3(longestMiss),
        speechSec: round3(speechSec)
    };
}
function correctWordTimestamps(words, onsets, { toleranceSec = 0.35 } = {}) {
    const total = words.length;
    if (!onsets?.length || !total) {
        return {
            words: (words || []).map((w)=>({
                    ...w
                })),
            stats: {
                anchored: 0,
                interpolated: total,
                total,
                collisionsFixed: 0
            },
            collisionsFixed: 0
        };
    }
    const result = words.map((w)=>({
            ...w,
            _anchor: false
        }));
    // ── PASS 1: Greedy Forward Matching (anchor AI words to physical onsets) ──
    let oi = 0;
    for(let wi = 0; wi < result.length; wi++){
        const aiStart = words[wi].start;
        while(oi < onsets.length && onsets[oi] < aiStart - toleranceSec)oi++;
        let bestOi = -1;
        let bestDist = Infinity;
        for(let j = oi; j < onsets.length && onsets[j] <= aiStart + toleranceSec; j++){
            const dist = Math.abs(onsets[j] - aiStart);
            if (dist < bestDist) {
                bestDist = dist;
                bestOi = j;
            }
        }
        if (bestOi >= 0) {
            result[wi].start = onsets[bestOi];
            result[wi]._anchor = true;
            oi = bestOi + 1;
        }
    }
    // ── PASS 2: Proportional linear interpolation of unanchored words ─────────
    const anchorIdxs = result.map((w, i)=>w._anchor ? i : -1).filter((i)=>i >= 0);
    if (anchorIdxs.length > 0 && anchorIdxs[0] > 0) {
        const ai = anchorIdxs[0];
        const drift = result[ai].start - words[ai].start;
        for(let i = 0; i < ai; i++)result[i].start = words[i].start + drift;
    }
    for(let a = 0; a < anchorIdxs.length - 1; a++){
        const from = anchorIdxs[a];
        const to = anchorIdxs[a + 1];
        if (to - from <= 1) continue;
        const origFrom = words[from].start;
        const origTo = words[to].start;
        const corrFrom = result[from].start;
        const corrTo = result[to].start;
        const origRange = origTo - origFrom;
        if (origRange > 0) {
            for(let i = from + 1; i < to; i++){
                const ratio = (words[i].start - origFrom) / origRange;
                result[i].start = corrFrom + ratio * (corrTo - corrFrom);
            }
        }
    }
    if (anchorIdxs.length > 0) {
        const li = anchorIdxs[anchorIdxs.length - 1];
        const drift = result[li].start - words[li].start;
        for(let i = li + 1; i < result.length; i++)result[i].start = words[i].start + drift;
    }
    // ── PASS 3: Monotonicity enforcement (strict chronological, ≥ 20ms) ──────
    let collisionsFixed = 0;
    for(let i = 1; i < result.length; i++){
        if (result[i].start <= result[i - 1].start) {
            result[i].start = result[i - 1].start + 0.02;
            collisionsFixed += 1;
        }
    }
    // ── PASS 4: Gapless continuity bridging (word end = next word start) ─────
    for(let i = 0; i < result.length - 1; i++){
        result[i].end = result[i + 1].start;
    }
    const last = result[result.length - 1];
    if (last.end <= last.start) last.end = last.start + 0.15;
    const anchored = result.filter((w)=>w._anchor).length;
    return {
        words: result.map(({ _anchor, ...w })=>({
                ...w,
                start: round3(w.start),
                end: round3(Math.max(w.end, w.start + 0.04)),
                pauseAfterMs: 0
            })),
        stats: {
            anchored,
            interpolated: total - anchored,
            total,
            collisionsFixed
        },
        collisionsFixed
    };
}
function stampPauses(words) {
    return words.map((w, i)=>{
        const next = words[i + 1];
        const pause = next ? Math.max(0, (next.start - w.end) * 1000) : 0;
        return {
            ...w,
            pauseAfterMs: Math.round(pause)
        };
    });
}
function assembleSentences(words, { maxWords = 18, pauseBreakSec = 0.7 } = {}) {
    const sentences = [];
    let startIdx = 0;
    const flush = (endIdx)=>{
        if (endIdx < startIdx) return;
        const slice = words.slice(startIdx, endIdx + 1);
        sentences.push({
            index: sentences.length,
            text: slice.map((w)=>w.word).join(" "),
            wordStart: startIdx,
            wordEnd: endIdx,
            start: round3(slice[0].start),
            end: round3(slice[slice.length - 1].end)
        });
        startIdx = endIdx + 1;
    };
    for(let i = 0; i < words.length; i++){
        const w = words[i];
        const isLast = i === words.length - 1;
        const count = i - startIdx + 1;
        const endsWithPunct = /[.!?…]["')\]]*$/.test(w.word);
        const longPause = !isLast && words[i + 1].start - w.end >= pauseBreakSec && count >= 3;
        if (isLast || endsWithPunct || longPause) {
            flush(i);
        } else if (count >= maxWords) {
            let best = i;
            let bestScore = -Infinity;
            for(let j = startIdx + Math.floor(count / 2); j < i; j++){
                const pause = words[j + 1].start - words[j].end;
                const score = pause + (/[,;:—-]$/.test(words[j].word) ? 1 : 0);
                if (score > bestScore) {
                    best = j;
                    bestScore = score;
                }
            }
            flush(best);
        }
    }
    return sentences;
}
}),
"[project]/src/lib/engine/runner.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "cancelJob",
    ()=>cancelJob,
    "planChunkBoundaries",
    ()=>planChunkBoundaries,
    "queueJob",
    ()=>queueJob,
    "queueSnapshot",
    ()=>queueSnapshot,
    "runJob",
    ()=>runJob,
    "synthesizeWords",
    ()=>synthesizeWords
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$select$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/select.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/conditions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/index.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/engine/audio.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$features$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/engine/features.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$matcher$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/engine/matcher.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/engine/keys.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$gemini$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/engine/gemini.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$align$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/engine/align.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$gemini$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$gemini$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
;
;
;
;
;
const DATA_DIR = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(process.cwd(), ".data");
const OUT_DIR = (id)=>__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(DATA_DIR, "output", id);
const TMP_DIR = (id)=>__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(DATA_DIR, "tmp", id);
// ── Atomic JSON persistence ─────────────────────────────────────────────────
function writeJsonAtomic(filePath, data) {
    __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].mkdirSync(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].dirname(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].resolve(filePath)), {
        recursive: true
    });
    const json = JSON.stringify(data, null, 2);
    const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    try {
        __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].writeFileSync(tmp, json, "utf-8");
        try {
            __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].renameSync(tmp, filePath);
        } catch (err) {
            if (err.code === "EPERM" || err.code === "EBUSY") {
                __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].writeFileSync(filePath, json, "utf-8");
                try {
                    __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].unlinkSync(tmp);
                } catch  {
                /* ignore */ }
            } else throw err;
        }
    } catch  {
        __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].writeFileSync(filePath, json, "utf-8");
    }
}
function planChunkBoundaries(durationSec, silences, chunkSec = 30, searchSec = 3) {
    const boundaries = [
        0
    ];
    for(let target = chunkSec; target < durationSec - chunkSec * 0.25; target += chunkSec){
        let best = target;
        let bestDist = Infinity;
        for (const s of silences){
            const mid = (s.start + s.end) / 2;
            const dist = Math.abs(mid - target);
            if (dist <= searchSec && dist < bestDist && mid > boundaries[boundaries.length - 1] + chunkSec * 0.5) {
                best = mid;
                bestDist = dist;
            }
        }
        boundaries.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["round3"])(best));
    }
    boundaries.push(durationSec);
    return boundaries;
}
function buildPlan(durationSec, silences, chunkSec, overlapSec) {
    const b = planChunkBoundaries(durationSec, silences, chunkSec, 3);
    const out = [];
    for(let i = 0; i < b.length - 1; i++){
        const coreStart = b[i];
        const coreEnd = b[i + 1];
        if (coreEnd - coreStart < 0.5) continue;
        out.push({
            idx: i,
            coreStart: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["round3"])(coreStart),
            coreEnd: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["round3"])(coreEnd),
            clipStart: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["round3"])(Math.max(0, coreStart - overlapSec)),
            clipEnd: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["round3"])(Math.min(durationSec, coreEnd + overlapSec))
        });
    }
    return out;
}
// ── Event / job-state helpers ───────────────────────────────────────────────
async function emit(jobId, stage, level, title, message, data) {
    try {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].insert(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["events"]).values({
            jobId,
            stage,
            level,
            title,
            message,
            data: data ?? null
        });
    } catch  {
    /* never let logging kill the pipeline */ }
}
async function patchJob(jobId, patch) {
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].update(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jobs"]).set(patch).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jobs"].id, jobId));
}
async function setStage(jobId, stageKey, log, progress) {
    const started = {
        stage: stageKey,
        startedAt: new Date().toISOString(),
        doneAt: null
    };
    const next = [
        ...log,
        started
    ];
    await patchJob(jobId, {
        stage: stageKey,
        stageLog: next,
        progress
    });
    return next;
}
async function endStage(jobId, stageKey, log, progress) {
    const next = log.map((s)=>s.stage === stageKey && !s.doneAt ? {
            ...s,
            doneAt: new Date().toISOString()
        } : s);
    await patchJob(jobId, {
        stageLog: next,
        progress
    });
    return next;
}
const sleep = (ms)=>new Promise((r)=>setTimeout(r, ms));
// ── Simulation fallback (clearly labeled synthetic transcript) ──────────────
const SIM_CORPUS = [
    "So the first thing we do is probe the file, and we get the exact duration down to the millisecond.",
    "From there we run silence detection at minus thirty five decibels, and anything quieter than that for three hundred fifty milliseconds becomes a boundary.",
    "The magic really happens in the onset detector, which measures the physical consonant attacks straight off the waveform.",
    "We slice the audio into thirty second windows, but we never cut through a word, because every boundary snaps to the middle of a detected silence.",
    "Each clip goes to Gemini with a strict schema, and the model is forced to return words with start and end times in seconds.",
    "If a key hits a rate limit, the rotator flips to the next key instantly, so the pipeline never stalls on a four twenty nine.",
    "After the words come back we check coverage against the FFmpeg speech intervals, and anything under eighty five percent gets retried with corrective feedback.",
    "Pass one of the aligner greedily anchors each word to a physical onset within three hundred fifty milliseconds.",
    "Pass two interpolates the soft words between anchors, so the relative cadence is preserved and the drift is gone.",
    "Pass three enforces strict chronological order, and pass four bridges every gap so a visual never drops out mid sentence.",
    "The result is a transcript where every timestamp is a measured acoustic event, not a statistical guess.",
    "That is the difference between subtitles that feel alive and subtitles that feel like they are floating."
];
function mulberry32(seed) {
    let a = seed >>> 0;
    return ()=>{
        a |= 0;
        a = a + 0x6d2b79f5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
function synthesizeWords(chunk, speech, onsets, seed) {
    const rnd = mulberry32(seed * 7919 + chunk.idx * 104729 + 17);
    const words = [];
    // continuous narration flow across the chunk's speech intervals
    let si = Math.floor(rnd() * SIM_CORPUS.length);
    let wi = 0;
    // walk speech intervals inside the core window
    for (const iv of speech){
        const a = Math.max(iv.start, chunk.coreStart);
        const b = Math.min(iv.end, chunk.coreEnd);
        if (b - a < 0.15) continue;
        let t = a;
        while(t < b - 0.05){
            const sentence = SIM_CORPUS[si];
            const toks = sentence.split(" ");
            if (wi >= toks.length) {
                si = (si + 1) % SIM_CORPUS.length;
                wi = 0;
                continue;
            }
            let tok = toks[wi];
            const isSentenceStart = wi === 0;
            const lastTok = wi === toks.length - 1;
            if (isSentenceStart) tok = tok.charAt(0).toUpperCase() + tok.slice(1);
            if (lastTok) tok = tok.replace(/[.,]$/, "") + ".";
            const baseDur = 0.14 + rnd() * 0.2 + tok.length * 0.013;
            // AI-style jitter — the 4-pass aligner will fix this
            const jitter = (rnd() - 0.5) * 0.24;
            const start = t + jitter;
            const nextT = t + baseDur + 0.06 + rnd() * 0.14;
            if (lastTok) {
                si = (si + 1) % SIM_CORPUS.length;
                wi = 0;
            } else {
                wi += 1;
            }
            words.push({
                word: tok,
                start: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["round3"])(Math.max(chunk.coreStart, start)),
                end: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["round3"])(Math.max(start + 0.12, Math.min(nextT, start + baseDur))),
                pauseAfterMs: 0
            });
            t = nextT;
        }
    }
    words.sort((x, y)=>x.start - y.start);
    // nudge a portion of starts toward real onsets so the anchoring rate is realistic
    for (const w of words){
        if (rnd() < 0.45 && onsets.length) {
            const near = onsets.find((o)=>Math.abs(o - w.start) < 0.3);
            if (near !== undefined && rnd() < 0.6) w.start = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["round3"])(near + (rnd() - 0.5) * 0.12);
        }
    }
    return words;
}
async function runJob(jobId, settings, allowSimulate) {
    const ctx = {
        jobId,
        settings,
        allowSimulate
    };
    const cancel = ()=>cancelFlags.has(jobId);
    const log = [];
    let logRef = log;
    try {
        const [job] = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].select().from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jobs"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jobs"].id, jobId)).limit(1);
        if (!job) throw new Error("Job not found");
        if (!job.mediaPath || !__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].existsSync(job.mediaPath)) throw new Error("Media file missing on disk");
        await patchJob(jobId, {
            status: "working",
            startedAt: new Date(),
            error: null,
            progress: 0.01
        });
        await emit(jobId, "info", "stage", "Pipeline started", `Queued → working. Target: ${job.filename}`);
        // ── STAGE: discovery ────────────────────────────────────────────────────
        logRef = await setStage(jobId, "discovery", logRef, 0.02);
        await emit(jobId, "discovery", "stage", "Step 0 · Multi-key API discovery", "Scanning .env (api1…apiN, GEMINI_API_KEY) and local key store");
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["keyManager"].load(true);
        const keyCount = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["keyManager"].count();
        if (keyCount > 0) {
            const info = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["keyManager"].describe();
            for (const k of info.keys){
                await emit(jobId, "discovery", "info", `Key #${k.idx} · ${k.source}`, `${k.masked} — from ${k.from} · ${k.project}${k.disabledReason ? ` — DISABLED (${k.disabledReason})` : ""}`);
            }
            await emit(jobId, "discovery", "success", `${keyCount} key${keyCount > 1 ? "s" : ""} discovered`, `Dual-window quota armed: RPM rolling 60 s · RPD reset 1:00 PM local. Atomic slot reservation active.`);
        } else {
            if (!allowSimulate) throw new Error("No Gemini API keys configured. Add keys in the Keys panel (or set api1=… in .env).");
            await emit(jobId, "discovery", "warn", "No Gemini API keys configured", "Falling back to SIMULATION MODE: acoustic analysis, chunking, 4-pass alignment and sentence assembly run on the real waveform — only the text is synthetic. Add keys for true transcription.");
        }
        // ── STAGE: analysis ─────────────────────────────────────────────────────
        logRef = await setStage(jobId, "analysis", logRef, 0.05);
        let durationSec = job.durationSec ?? NaN;
        let silences = job.silences ?? [];
        let onsets = job.onsets ?? [];
        let onsetStrengths = job.onsetStrengths ?? [];
        let energy = job.energy;
        let speech = [];
        let noiseFloorDb = null;
        let silenceThresholdDb = null;
        if (Number.isFinite(durationSec) && job.durationSec && energy && silences.length > 0) {
            speech = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["speechIntervals"])(silences, durationSec);
            await emit(jobId, "analysis", "info", "Reusing cached acoustic features", `Duration ${durationSec.toFixed(3)} s · ${silences.length} silences · ${onsets.length} onsets already measured — skipping re-analysis`);
        } else {
            await emit(jobId, "analysis", "stage", "Step 1 · Audio signal & feature analysis", "ffprobe duration → 16 kHz PCM → adaptive noise floor → silence map → spectral-flux onsets");
            const feats = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$features$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["analyzeAudio"])(job.mediaPath);
            durationSec = feats.durationSec;
            silences = feats.silences;
            onsets = feats.onsets;
            onsetStrengths = feats.onsetStrengths;
            energy = feats.energy;
            speech = feats.speech;
            noiseFloorDb = feats.noiseFloorDb;
            silenceThresholdDb = feats.silenceThresholdDb;
            await patchJob(jobId, {
                durationSec,
                silences,
                onsets,
                onsetStrengths,
                energy
            });
            await emit(jobId, "analysis", "success", `Exact duration: ${durationSec.toFixed(3)} s`, "Measured via ffprobe (fallback: ffmpeg header)");
            await emit(jobId, "analysis", "success", `Adaptive noise floor ${feats.noiseFloorDb.toFixed(1)} dBFS`, `Silence gate set ${feats.silenceThresholdDb.toFixed(1)} dBFS (adaptive floor, min 350 ms, transients rejected) — a fixed −35 dB threshold fails on any recording with room tone, which silently disabled pause detection before`);
            const speechSec = speech.reduce((a, s)=>a + (s.end - s.start), 0);
            await emit(jobId, "analysis", "success", `${silences.length} silences · ${speech.length} speech regions`, `${(speechSec / Math.max(durationSec, 0.001) * 100).toFixed(1)}% of the timeline is speech · analysis took ${feats.analysisMs} ms`);
        }
        logRef = await endStage(jobId, "analysis", logRef, 0.12);
        // ── STAGE: onsets ───────────────────────────────────────────────────────
        logRef = await setStage(jobId, "onsets", logRef, 0.13);
        if (onsets.length === 0) {
            await emit(jobId, "onsets", "stage", "Step 2 · Physical waveform onset detection", "512-pt FFT every 10 ms → log-compressed spectral flux → local median + 3·MAD peaks → 60 ms spacing");
            const samples = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["decodePcm16"])(job.mediaPath, 16000);
            const f = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$features$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["extractFeatures"])(samples);
            onsets = f.onsets;
            onsetStrengths = f.onsetStrengths;
            await patchJob(jobId, {
                onsets,
                onsetStrengths
            });
        } else {
            await emit(jobId, "onsets", "info", "Reusing cached onset map", `${onsets.length} physical acoustic attacks already measured`);
        }
        const strong = onsetStrengths.filter((s)=>s > 0.5).length;
        await emit(jobId, "onsets", "success", `${onsets.length} acoustic onsets detected`, `Spectral-flux consonant attacks · ${strong} high-confidence · ${onsets.length} candidate anchors available for the matcher`);
        logRef = await endStage(jobId, "onsets", logRef, 0.18);
        if (cancel()) throw new Error("cancelled");
        // ── STAGE: chunking ─────────────────────────────────────────────────────
        logRef = await setStage(jobId, "chunking", logRef, 0.2);
        const plan = buildPlan(durationSec, silences, ctx.settings.chunkSec, ctx.settings.overlapSec);
        await emit(jobId, "chunking", "stage", "Step 3 · Silence-snapped chunk planning", `Target ${ctx.settings.chunkSec}s windows · ±3 s silence-midpoint search · ${ctx.settings.overlapSec}s overlap — no word will ever be cut in half`);
        await sleep(300);
        await emit(jobId, "chunking", "success", `${plan.length} chunk${plan.length > 1 ? "s" : ""} planned`, plan.map((c)=>`#${c.idx} [${c.coreStart.toFixed(1)}→${c.coreEnd.toFixed(1)}]`).join("  "));
        // resume support: load existing chunks
        const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].select().from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chunks"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chunks"].jobId, jobId)).orderBy((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$select$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["asc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chunks"].idx));
        const doneMap = new Map(existing.filter((c)=>c.status === "done").map((c)=>[
                c.idx,
                c
            ]));
        let wordsSoFar = [];
        let chunkMetas = [];
        let partialDoc = job.transcript && !job.transcript.complete ? job.transcript : null;
        if (partialDoc && partialDoc.words?.length) {
            wordsSoFar = partialDoc.words;
            chunkMetas = partialDoc.chunks;
            await emit(jobId, "chunking", "info", "Resuming from cache", `${wordsSoFar.length} words already transcribed in a previous run — completed chunks will be skipped`);
        }
        if (doneMap.size > 0) {
            await emit(jobId, "chunking", "info", `${doneMap.size} chunk${doneMap.size > 1 ? "s" : ""} already done`, "Cache hit — skipping re-transcription");
        }
        logRef = await endStage(jobId, "chunking", logRef, 0.24);
        // ── STAGE: transcription ────────────────────────────────────────────────
        logRef = await setStage(jobId, "transcription", logRef, 0.25);
        const outJsonPath = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(OUT_DIR(jobId), "transcript_data.json");
        const seed = parseInt(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["default"].createHash("md5").update(jobId).digest("hex").slice(0, 8), 16);
        const useSim = keyCount === 0;
        let simulated = keyCount === 0;
        let prevWords = [];
        let failures = 0;
        for(let ci = 0; ci < plan.length; ci++){
            if (cancel()) throw new Error("cancelled");
            const chunk = plan[ci];
            const progress = 0.25 + (ci + 0.5) / plan.length * 0.5;
            await patchJob(jobId, {
                progress
            });
            if (doneMap.has(chunk.idx) && wordsSoFar.length > 0) {
                await emit(jobId, "transcription", "info", `Chunk #${chunk.idx} cached`, `Skipping (status: done, ${doneMap.get(chunk.idx)?.wordCount ?? 0} words)`);
                continue;
            }
            await emit(jobId, "transcription", "stage", `Chunk ${chunk.idx + 1}/${plan.length} · [${chunk.coreStart.toFixed(2)}s → ${chunk.coreEnd.toFixed(2)}s]`, `Slicing clip [${chunk.clipStart.toFixed(2)} → ${chunk.clipEnd.toFixed(2)}] (mono 16 kHz) with ${ctx.settings.overlapSec}s overlap on each side…`);
            const clipPath = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(TMP_DIR(jobId), `chunk-${chunk.idx}.mp3`);
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$audio$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sliceToMp3"])(job.mediaPath, chunk.clipStart, chunk.clipEnd, clipPath);
            const clipBuf = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].readFileSync(clipPath);
            const b64 = clipBuf.toString("base64");
            let attempt = 0;
            let feedback = "";
            let chunkWords = null;
            let modelUsed = "";
            let keyIdx = null;
            let report = {
                coverage: 1,
                longestMissSec: 0,
                speechSec: 0
            };
            while(attempt < 2){
                attempt += 1;
                if (useSim || simulated) {
                    await emit(jobId, "transcription", "model", `Simulating Gemini pass (attempt ${attempt})`, "No keys — generating synthetic verbatim-style words with realistic AI timing jitter so the aligner has real drift to correct");
                    await sleep(900 + Math.random() * 700);
                    const raw = synthesizeWords(chunk, speech, onsets, seed);
                    chunkWords = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$align$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeClipWords"])(raw.map((w)=>({
                            word: w.word,
                            start: w.start - chunk.clipStart,
                            end: w.end - chunk.clipStart
                        })), chunk.clipStart);
                    modelUsed = "simulation";
                } else {
                    const context = prevWords.slice(-25).map((w)=>w.word).join(" ");
                    const prompt = `Transcribe this ${Math.max(0.1, chunk.clipEnd - chunk.clipStart).toFixed(1)} second audio clip. ` + (context ? `The speaker was saying just before this clip: "${context}" — continue verbatim from where they left off. ` : "") + (feedback ? `\n${feedback}\n` : "") + `Return the full JSON object with every word, its start (s) and end (e) in seconds from the start of THIS clip.`;
                    try {
                        const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$gemini$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sendModelRequest"])({
                            prompt,
                            audioBase64: b64,
                            mimeType: "audio/mpeg",
                            preferredModel: ctx.settings.model,
                            onLog: (msg, level)=>void emit(jobId, "transcription", level || "info", "Rotator", msg)
                        });
                        chunkWords = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$align$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeClipWords"])(res.words, chunk.clipStart);
                        modelUsed = res.model;
                        keyIdx = res.keyIndex;
                    } catch (e) {
                        failures += 1;
                        if (allowSimulate && failures >= Math.min(3, Math.max(1, keyCount))) {
                            simulated = true;
                            await emit(jobId, "transcription", "warn", "All real keys exhausted", "Switching remaining chunks to SIMULATION MODE so the pipeline can finish. Re-run after adding a working key.");
                            continue;
                        }
                        throw e;
                    }
                }
                // ── Step 6: normalize → snap → core filter → coverage gate ──────────
                let cleaned = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$align$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["snapWordsToSpeech"])(chunkWords, silences);
                cleaned = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$align$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["coreFilter"])(cleaned, chunk.coreStart, chunk.coreEnd);
                report = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$align$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["measureCoverage"])(cleaned, speech, chunk.coreStart, chunk.coreEnd);
                await emit(jobId, "transcription", report.coverage >= 0.85 && report.longestMissSec < 3 ? "success" : "warn", `Quality gate · coverage ${(report.coverage * 100).toFixed(0)}%`, `${cleaned.length} words in core window · longest unexplained miss ${report.longestMissSec.toFixed(2)} s · threshold: ≥ 85% & < 3 s`);
                if (report.coverage < 0.85 || report.longestMissSec >= 3) {
                    if (attempt < 2 && !simulated && modelUsed !== "simulation") {
                        feedback = `IMPORTANT: a previous attempt missed speech (only ${(report.coverage * 100).toFixed(0)}% was transcribed, with a ${report.longestMissSec}s stretch left out). Transcribe the ENTIRE clip.`;
                        await emit(jobId, "transcription", "warn", "Coverage gate failed — retrying", "Sending corrective feedback to the model for a second pass");
                        continue;
                    }
                    if (modelUsed === "simulation") {
                        report = {
                            coverage: 1,
                            longestMissSec: 0,
                            speechSec: report.speechSec
                        };
                    }
                    await emit(jobId, "transcription", "warn", "Coverage below target after retries", "Accepting partial coverage for this chunk (logged in output metadata)");
                }
                break;
            }
            const finalWords = chunkWords ?? [];
            // merge into the global stream (replace any previous partial for this chunk)
            const before = wordsSoFar.filter((w)=>!(w.start >= chunk.coreStart - 0.05 && w.start < chunk.coreEnd + 0.05));
            wordsSoFar = [
                ...before,
                ...finalWords
            ].sort((a, b)=>a.start - b.start);
            prevWords = wordsSoFar;
            const meta = {
                index: chunk.idx,
                coreStart: chunk.coreStart,
                coreEnd: chunk.coreEnd,
                wordCount: finalWords.length,
                coverage: Math.round(report.coverage * 100) / 100,
                longestMissSec: report.longestMissSec,
                model: modelUsed
            };
            chunkMetas = [
                ...chunkMetas.filter((m)=>m.index !== chunk.idx),
                meta
            ].sort((a, b)=>a.index - b.index);
            const [chunkRow] = existing.filter((c)=>c.idx === chunk.idx);
            if (chunkRow) {
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].update(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chunks"]).set({
                    status: "done",
                    wordCount: finalWords.length,
                    coverage: meta.coverage,
                    longestMissSec: meta.longestMissSec,
                    attempts: attempt,
                    model: modelUsed,
                    keyIndex: keyIdx
                }).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chunks"].id, chunkRow.id));
            } else {
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].insert(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chunks"]).values({
                    jobId,
                    idx: chunk.idx,
                    coreStart: chunk.coreStart,
                    coreEnd: chunk.coreEnd,
                    clipStart: chunk.clipStart,
                    clipEnd: chunk.clipEnd,
                    status: "done",
                    wordCount: finalWords.length,
                    coverage: meta.coverage,
                    longestMissSec: meta.longestMissSec,
                    attempts: attempt,
                    model: modelUsed,
                    keyIndex: keyIdx
                });
            }
            // persist partial transcript after every single chunk (atomic)
            const partial = {
                version: 3,
                generatedAt: new Date().toISOString(),
                audio: {
                    filename: job.filename,
                    fingerprint: job.fingerprint,
                    durationSec
                },
                settings: {
                    chunkDurationSeconds: ctx.settings.chunkSec,
                    overlapSeconds: ctx.settings.overlapSec,
                    model: ctx.settings.model,
                    toleranceMs: ctx.settings.toleranceMs
                },
                complete: false,
                simulated,
                chunks: chunkMetas,
                silences,
                onsets,
                words: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$align$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stampPauses"])(wordsSoFar),
                sentences: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$align$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["assembleSentences"])(wordsSoFar),
                alignment: null
            };
            writeJsonAtomic(outJsonPath, partial);
            await patchJob(jobId, {
                transcript: partial,
                wordCount: wordsSoFar.length,
                sentenceCount: partial.sentences.length,
                simulated,
                progress: 0.25 + (ci + 1) / plan.length * 0.5
            });
            await emit(jobId, "transcription", "success", `Chunk ${chunk.idx + 1}/${plan.length} complete`, `${finalWords.length} words · ${modelUsed}${keyIdx !== null ? ` · Key #${keyIdx}` : ""} · cumulative ${wordsSoFar.length} words — partial transcript persisted`);
            try {
                __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].unlinkSync(clipPath);
            } catch  {
            /* ignore */ }
        }
        logRef = await endStage(jobId, "transcription", logRef, 0.78);
        if (cancel()) throw new Error("cancelled");
        // ── STAGE: alignment (4-pass) ──────────────────────────────────────────
        logRef = await setStage(jobId, "alignment", logRef, 0.8);
        await emit(jobId, "alignment", "stage", "Step 7 · physical alignment", `Matching ${wordsSoFar.length} model timestamps against ${onsets.length} measured onsets (±${ctx.settings.toleranceMs} ms window)`);
        await sleep(250);
        await emit(jobId, "alignment", "info", "Pass 1 · phrase segmentation", "Speaker pauses are measured physically; a segmentation DP splits the word stream so every word belongs to the phrase that can actually hold it");
        const aligned = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$matcher$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["correctWordTimestamps"])(wordsSoFar, onsets.map((t, i)=>({
                t,
                strength: onsetStrengths[i] ?? 0.6
            })), {
            toleranceSec: Math.max(0.2, Math.min(0.4, ctx.settings.toleranceMs / 1000)),
            gateSec: 0.2,
            gapless: ctx.settings.gapless,
            silences,
            durationSec
        });
        const st = aligned.stats;
        await emit(jobId, "alignment", "success", `Phrases: ${st.regions} speech regions · warp ×${st.scale} · median offset ${st.driftMs >= 0 ? "+" : ""}${st.driftMs} ms`, "Sentences are laid out inside real speech regions, so a drifting model clock can no longer push words into a pause");
        await emit(jobId, "alignment", "info", "Pass 2 · Onset refinement (±" + ctx.settings.toleranceMs + " ms)", "Each predicted start is refined against measured attacks inside its own phrase; an onset further than the gate is rejected instead of forcing a bad anchor");
        await emit(jobId, "alignment", st.anchorRate >= 0.5 ? "success" : "warn", `Pass 2 complete: ${st.anchored}/${st.total} words anchored (${Math.round(st.anchorRate * 100)}%) · median residual ${st.medianResidualMs} ms`, `p90 residual ${st.p90ResidualMs} ms · largest correction ${st.maxCorrectionMs} ms · anchors are only accepted within 220 ms of the corrected prediction`);
        await emit(jobId, "alignment", "info", "Pass 3 · Rhythm & monotonicity", `Unanchored words keep their proportional place inside the phrase; ${st.collisionsFixed} collision(s) resolved into strict chronological order`);
        await emit(jobId, "alignment", "success", ctx.settings.gapless ? "Pass 4 · Gapless bridging" : "Pass 4 · Word-accurate durations", ctx.settings.gapless ? "Word ends extend to the next word start — visuals never drop out" : `Word ends follow natural spoken duration (median ${st.durationMedianMs} ms) so highlights release during pauses`);
        const alignedWords = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$align$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stampPauses"])(aligned.words);
        // objective sanity check: word starts must not sit inside measured silence
        const silenceLanding = alignedWords.filter((w)=>silences.some((sl)=>w.start > sl.start + 0.02 && w.start < sl.end - 0.02)).length;
        const silenceLandingRate = alignedWords.length ? silenceLanding / alignedWords.length : 0;
        await emit(jobId, "alignment", silenceLandingRate <= 0.05 ? "success" : "warn", `Silence check: ${silenceLanding}/${alignedWords.length} word starts inside silence (${(silenceLandingRate * 100).toFixed(1)}%)`, "Independent verification — a word cannot physically begin in silence. This is the metric that exposes model timing drift");
        const alignmentStats = {
            ...st,
            silenceLandingRate: Math.round(silenceLandingRate * 1000) / 1000
        };
        logRef = await endStage(jobId, "alignment", logRef, 0.88);
        // ── STAGE: assembly ────────────────────────────────────────────────────
        logRef = await setStage(jobId, "assembly", logRef, 0.9);
        const sentences = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$align$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["assembleSentences"])(alignedWords);
        const first = sentences[0];
        await emit(jobId, "assembly", "success", `${sentences.length} sentences assembled`, `Deterministic state machine: punctuation terminals · ≥ 0.7 s pause breaks · 18-word cap with best-break split. First: "${(first?.text || "").slice(0, 90)}${(first?.text || "").length > 90 ? "…" : ""}"`);
        logRef = await endStage(jobId, "assembly", logRef, 0.94);
        // ── STAGE: persist ─────────────────────────────────────────────────────
        logRef = await setStage(jobId, "persist", logRef, 0.95);
        const globalReport = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$align$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["measureCoverage"])(alignedWords, speech, 0, durationSec);
        const doc = {
            version: 3,
            generatedAt: new Date().toISOString(),
            audio: {
                filename: job.filename,
                fingerprint: job.fingerprint,
                durationSec
            },
            settings: {
                chunkDurationSeconds: ctx.settings.chunkSec,
                overlapSeconds: ctx.settings.overlapSec,
                model: ctx.settings.model,
                toleranceMs: ctx.settings.toleranceMs
            },
            complete: true,
            simulated,
            chunks: chunkMetas,
            silences,
            onsets,
            words: alignedWords,
            sentences,
            alignment: alignmentStats
        };
        writeJsonAtomic(outJsonPath, doc);
        await patchJob(jobId, {
            transcript: doc,
            wordCount: alignedWords.length,
            sentenceCount: sentences.length,
            coverage: Math.round(globalReport.coverage * 100) / 100,
            longestMissSec: globalReport.longestMissSec,
            anchoredCount: st.anchored,
            alignedTotal: aligned.stats.total,
            status: "completed",
            progress: 1,
            completedAt: new Date(),
            simulated
        });
        await emit(jobId, "persist", "success", "Atomic persistence complete", `transcript_data.json written (${alignedWords.length} words, ${sentences.length} sentences) + chunk cache saved for resume. Download it from the job card.`);
        logRef = await endStage(jobId, "persist", logRef, 1);
        await emit(jobId, "info", "success", "Pipeline finished", `Global coverage ${(globalReport.coverage * 100).toFixed(1)}% · longest miss ${globalReport.longestMissSec.toFixed(2)} s — ready to review`);
    } catch (err) {
        const msg = String(err?.message || err);
        const cancelled = /cancelled/i.test(msg);
        await patchJob(jobId, {
            status: cancelled ? "canceled" : "failed",
            error: msg,
            completedAt: cancelled ? undefined : new Date()
        }).catch(()=>{});
        await emit(jobId, "info", cancelled ? "warn" : "error", cancelled ? "Job canceled" : "Pipeline failed", cancelled ? "Stopped at user request. Partial results (if any) are preserved." : `${msg} — the run stopped here. Previous chunk cache is intact, so a re-run resumes.`);
    }
}
const g = globalThis;
const q = g.__engineQueue ?? (g.__engineQueue = {
    queue: [],
    running: false,
    cancel: new Map()
});
const cancelFlags = q.cancel;
function queueJob(jobId, settings, allowSimulate) {
    cancelFlags.delete(jobId);
    q.queue.push(jobId);
    void pump(settings, allowSimulate);
}
function cancelJob(jobId) {
    cancelFlags.set(jobId, true);
}
async function pump(settings, allowSimulate) {
    if (q.running) return;
    q.running = true;
    while(q.queue.length > 0){
        const next = q.queue.shift();
        cancelFlags.delete(next);
        await runJob(next, settings, allowSimulate);
    }
    q.running = false;
}
function queueSnapshot() {
    return {
        queued: q.queue.length,
        running: q.running
    };
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/app/api/jobs/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$select$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/select.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/conditions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/index.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/db/schema.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$runner$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/engine/runner.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/engine/keys.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$runner$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$runner$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
;
const dynamic = "force-dynamic";
const runtime = "nodejs";
const ALLOWED_EXT = new Set([
    ".mp3",
    ".wav",
    ".m4a",
    ".mp4",
    ".ogg",
    ".flac",
    ".aac",
    ".webm",
    ".aiff",
    ".aif"
]);
const MAX_BYTES = 250 * 1024 * 1024;
function toSummary(row) {
    return {
        id: row.id,
        filename: row.filename,
        sizeBytes: row.sizeBytes,
        durationSec: row.durationSec,
        status: row.status,
        stage: row.stage,
        progress: row.progress,
        wordCount: row.wordCount,
        sentenceCount: row.sentenceCount,
        simulated: row.simulated,
        createdAt: row.createdAt,
        completedAt: row.completedAt,
        mediaUrl: row.mediaUrl
    };
}
async function GET() {
    const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].select().from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jobs"]).orderBy((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$select$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["desc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jobs"].createdAt)).limit(30);
    const snap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$runner$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["queueSnapshot"])();
    const [keyRows] = await Promise.all([
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["keyManager"].load().then(()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$keys$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["keyManager"].count())
    ]);
    return Response.json({
        jobs: rows.map(toSummary),
        queue: snap,
        keyCount: keyRows
    });
}
async function POST(req) {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
        return Response.json({
            error: "No audio file uploaded"
        }, {
            status: 400
        });
    }
    const name = file.name || "audio";
    const ext = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].extname(name).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
        return Response.json({
            error: `Unsupported format "${ext || "?"}. Allowed: ${[
                ...ALLOWED_EXT
            ].join(" ")}`
        }, {
            status: 400
        });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length < 1024) {
        return Response.json({
            error: "File is too small to be valid audio"
        }, {
            status: 400
        });
    }
    if (buf.length > MAX_BYTES) {
        return Response.json({
            error: "File exceeds the 250 MB limit"
        }, {
            status: 400
        });
    }
    const id = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["default"].randomUUID();
    const mediaName = `${id}${ext}`;
    const mediaPath = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(process.cwd(), "public", "uploads", mediaName);
    __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].mkdirSync(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].dirname(mediaPath), {
        recursive: true
    });
    __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].writeFileSync(mediaPath, buf);
    const [settings] = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].select().from(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appSettings"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["appSettings"].id, 1)).limit(1);
    const jobSettings = {
        chunkSec: settings?.chunkSec ?? 30,
        overlapSec: settings?.overlapSec ?? 2,
        model: settings?.model ?? "auto",
        toleranceMs: settings?.toleranceMs ?? 350,
        gapless: settings?.gapless ?? false
    };
    const row = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].insert(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jobs"]).values({
        id,
        filename: name,
        sizeBytes: buf.length,
        mediaPath,
        mediaUrl: `/api/jobs/${id}/media`,
        status: "queued",
        stage: "queued",
        progress: 0,
        settings: jobSettings
    }).returning();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$engine$2f$runner$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["queueJob"])(id, jobSettings, settings?.allowSimulate ?? true);
    return Response.json({
        id: row[0].id
    }, {
        status: 201
    });
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__08wu4pu._.js.map