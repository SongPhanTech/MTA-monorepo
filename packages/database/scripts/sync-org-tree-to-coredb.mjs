/**
 * Đồng bộ cây đơn vị DM_DonVi từ POSTGRES_URL (mta_internet) → MTA_COREDB_URL (mta_coredb).
 *
 * - Nguồn (source): mta."DM_DonVi" trên POSTGRES_URL (cây đã dọn)
 * - Đích (target): public."DM_DonVi" trên MTA_COREDB_URL
 *
 * Nếu target có bản trùng / Id khác nguồn:
 *  1) Map Id cũ → Id canonical trên nguồn (theo sMa+tên, ưu tiên mã chữ)
 *  2) Remap FK trên coredb
 *  3) Xóa cứng bản cũ
 *  4) Upsert toàn bộ cây từ nguồn vào target
 *
 * Usage:
 *   cd packages/database
 *   POSTGRES_URL="postgres://.../mta_internet" \
 *   MTA_COREDB_URL="postgresql://.../mta_coredb" \
 *     bun scripts/sync-org-tree-to-coredb.mjs --dry-run
 *
 *   POSTGRES_URL="..." MTA_COREDB_URL="..." bun scripts/sync-org-tree-to-coredb.mjs
 *
 * Options:
 *   --dry-run
 *   --quiet
 */
import { PrismaClient } from "../generated/prisma-client/index.js"

const dryRun = process.argv.includes("--dry-run")
const quiet = process.argv.includes("--quiet")

const SOURCE_SCHEMA = "mta"
const TARGET_SCHEMA = "public"

/** Cột đồng bộ từ nguồn → đích */
const ORG_COLS = [
  "Id",
  "sMa",
  "sTen",
  "sGhiChu",
  "iSTT",
  "bActive",
  "bDeleted",
  "bSystem",
  "iDictionaryKey",
  "dNgayTao",
  "dNgaySua",
  "sNguoiTao",
  "sNguoiSua",
  "sThietBiTao",
  "sThietBiSua",
  "sCode",
  "sTKBUCode",
  "sTenVietTat",
  "sParentId",
  "sTruongDonVi",
  "sChucNangNhiemVu",
  "sDiaChi",
  "iNhomDonVi",
  "iCapDonVi",
  "iLoaiDonVi",
]

/** FK trên coredb tham chiếu DM_DonVi.Id (không gồm menu/nhóm người dùng) */
const TARGET_FK = [
  { table: "DM_DonVi", column: "sParentId" },
  { table: "DM_DonVi", column: "sTruongDonVi" },
  { table: "DM_NhanVien", column: "sDM_DonViId" },
  { table: "DM_Employee", column: "sDM_DonViId" },
  { table: "DM_ViTriCongViec_DonViCT", column: "sDM_DonViId" },
  { table: "MucTruyCapDuLieu", column: "sDM_DonViId" },
]

function withLimit(url) {
  return url.includes("?") ? `${url}&connection_limit=1` : `${url}?connection_limit=1`
}

function createClient(url) {
  return new PrismaClient({ datasources: { db: { url: withLimit(url) } } })
}

function normName(name) {
  return (name || "").trim().toLowerCase().replace(/\s+/g, " ")
}

function normMa(ma) {
  return (ma || "").trim().toUpperCase()
}

function codeScore(sMa) {
  const ma = (sMa || "").trim()
  if (!ma) return 0
  if (/^OLD_/i.test(ma)) return 50
  if (/[A-Za-z]/.test(ma)) return 1000
  return 10
}

async function getTableColumns(prisma, schema, table) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2`,
    schema,
    table
  )
  return new Set(rows.map((r) => r.column_name))
}

async function loadOrgs(prisma, schema) {
  const cols = await getTableColumns(prisma, schema, "DM_DonVi")
  const selectCols = ORG_COLS.filter((c) => cols.has(c))
  if (!selectCols.includes("Id")) throw new Error(`${schema}.DM_DonVi missing Id`)
  const rows = await prisma.$queryRawUnsafe(
    `SELECT ${selectCols.map((c) => `"${c}"`).join(", ")}
     FROM "${schema}"."DM_DonVi"
     WHERE COALESCE("bDeleted", false) = false`
  )
  return rows.map((r) => ({
    ...r,
    Id: String(r.Id),
    sParentId: r.sParentId ? String(r.sParentId) : null,
    sTruongDonVi: r.sTruongDonVi ? String(r.sTruongDonVi) : null,
  }))
}

async function tableExists(prisma, schema, table) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = $1 AND table_name = $2 LIMIT 1`,
    schema,
    table
  )
  return rows.length > 0
}

async function columnExists(prisma, schema, table, column) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2 AND column_name = $3 LIMIT 1`,
    schema,
    table,
    column
  )
  return rows.length > 0
}

async function resolveTargetFks(prisma) {
  const out = []
  for (const fk of TARGET_FK) {
    if (await tableExists(prisma, TARGET_SCHEMA, fk.table)) {
      if (await columnExists(prisma, TARGET_SCHEMA, fk.table, fk.column)) {
        out.push(fk)
      }
    }
  }
  return out
}

async function countRefs(prisma, fks, id) {
  let n = 0
  for (const fk of fks) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS n FROM "${TARGET_SCHEMA}"."${fk.table}" WHERE "${fk.column}" = $1::uuid`,
      id
    )
    n += Number(rows[0]?.n || 0)
  }
  return n
}

/**
 * Map target-only Id → source Id
 */
function buildIdMap(sourceOrgs, targetOrgs) {
  const sourceById = new Map(sourceOrgs.map((o) => [o.Id, o]))
  const targetById = new Map(targetOrgs.map((o) => [o.Id, o]))

  const sourceByMaName = new Map()
  const sourceByName = new Map()
  for (const o of sourceOrgs) {
    const name = normName(o.sTen)
    if (!name) continue
    const ma = normMa(o.sMa)
    if (ma) {
      const k = `${ma}||${name}`
      if (!sourceByMaName.has(k)) sourceByMaName.set(k, [])
      sourceByMaName.get(k).push(o)
    }
    if (!sourceByName.has(name)) sourceByName.set(name, [])
    sourceByName.get(name).push(o)
  }

  /** @type {Map<string, string>} oldTargetId -> sourceId */
  const map = new Map()
  const targetOnly = []
  const matchedSameId = []

  for (const t of targetOrgs) {
    if (sourceById.has(t.Id)) {
      matchedSameId.push(t.Id)
      continue
    }
    targetOnly.push(t)
  }

  for (const t of targetOnly) {
    const name = normName(t.sTen)
    const ma = normMa(t.sMa)
    let candidates = []
    if (ma && name) candidates = sourceByMaName.get(`${ma}||${name}`) || []
    if (!candidates.length && name) {
      const byName = sourceByName.get(name) || []
      if (byName.length === 1) candidates = byName
      else if (byName.length > 1) {
        // ưu tiên mã chữ; nếu nhiều thì chọn score cao hơn / trùng chữ cái với target
        const scored = [...byName].sort((a, b) => {
          const ds = codeScore(b.sMa) - codeScore(a.sMa)
          if (ds) return ds
          // nếu target mã số "31" và source có "K31" — ưu tiên contains
          const ta = normMa(t.sMa)
          const preferA = ta && normMa(a.sMa).endsWith(ta) ? 1 : 0
          const preferB = ta && normMa(b.sMa).endsWith(ta) ? 1 : 0
          return preferB - preferA
        })
        candidates = [scored[0]]
      }
    }
    if (candidates.length >= 1) {
      map.set(t.Id, candidates[0].Id)
    }
  }

  return { map, targetOnly, matchedSameId, sourceById, targetById, unmapped: targetOnly.filter((t) => !map.has(t.Id)) }
}

async function remapId(prisma, fks, fromId, toId) {
  if (fromId === toId) return 0
  let updated = 0
  for (const fk of fks) {
    const n = await prisma.$executeRawUnsafe(
      `UPDATE "${TARGET_SCHEMA}"."${fk.table}" SET "${fk.column}" = $1::uuid WHERE "${fk.column}" = $2::uuid`,
      toId,
      fromId
    )
    updated += Number(n) || 0
  }
  return updated
}

async function hardDeleteOrg(prisma, id) {
  await prisma.$executeRawUnsafe(
    `UPDATE "${TARGET_SCHEMA}"."DM_DonVi" SET "sParentId" = NULL WHERE "sParentId" = $1::uuid`,
    id
  )
  await prisma.$executeRawUnsafe(
    `UPDATE "${TARGET_SCHEMA}"."DM_DonVi" SET "sTruongDonVi" = NULL WHERE "sTruongDonVi" = $1::uuid`,
    id
  )
  // M2M if exists
  const m2m = await tableExists(prisma, TARGET_SCHEMA, "_DM_DonViToSurveyObjectType")
  if (m2m) {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "${TARGET_SCHEMA}"."_DM_DonViToSurveyObjectType" WHERE "A" = $1::uuid`,
      id
    )
  }
  await prisma.$executeRawUnsafe(`DELETE FROM "${TARGET_SCHEMA}"."DM_DonVi" WHERE "Id" = $1::uuid`, id)
}

async function getTargetColumns(prisma) {
  return getTableColumns(prisma, TARGET_SCHEMA, "DM_DonVi")
}

function sqlPlaceholder(col, i) {
  if (col === "Id" || col === "sParentId" || col === "sTruongDonVi") return `$${i}::uuid`
  return `$${i}`
}

async function upsertSourceOrg(prisma, org, targetCols) {
  const cols = ORG_COLS.filter((c) => targetCols.has(c) && c !== "sParentId" && c !== "sTruongDonVi")
  const exists = await prisma.$queryRawUnsafe(
    `SELECT 1 FROM "${TARGET_SCHEMA}"."DM_DonVi" WHERE "Id" = $1::uuid`,
    org.Id
  )

  const valueOf = (c) => {
    let v = org[c] ?? null
    // coredb: sMa/sTen NOT NULL
    if ((c === "sMa" || c === "sTen") && (v === null || v === undefined)) v = c === "sTen" ? "Unknown" : ""
    if ((c === "bActive" || c === "bDeleted" || c === "bSystem") && v === null) {
      v = c === "bActive"
    }
    return v
  }

  if (!exists.length) {
    const colList = cols.map((c) => `"${c}"`).join(", ")
    const placeholders = cols.map((c, i) => sqlPlaceholder(c, i + 1)).join(", ")
    const values = cols.map(valueOf)
    await prisma.$executeRawUnsafe(
      `INSERT INTO "${TARGET_SCHEMA}"."DM_DonVi" (${colList}) VALUES (${placeholders})`,
      ...values
    )
    return "insert"
  }

  const setParts = []
  const setParams = []
  let p = 1
  for (const c of cols) {
    if (c === "Id") continue
    setParts.push(`"${c}" = ${sqlPlaceholder(c, p)}`)
    setParams.push(valueOf(c))
    p++
  }
  if (!setParts.length) return "update"
  setParams.push(org.Id)
  await prisma.$executeRawUnsafe(
    `UPDATE "${TARGET_SCHEMA}"."DM_DonVi" SET ${setParts.join(", ")} WHERE "Id" = $${p}::uuid`,
    ...setParams
  )
  return "update"
}

async function syncParents(prisma, sourceOrgs, targetCols) {
  if (!targetCols.has("sParentId") && !targetCols.has("sTruongDonVi")) return 0
  let n = 0
  for (const org of sourceOrgs) {
    const sets = []
    const params = []
    let p = 1
    if (targetCols.has("sParentId")) {
      sets.push(`"sParentId" = $${p}::uuid`)
      params.push(org.sParentId)
      p++
    }
    if (targetCols.has("sTruongDonVi")) {
      sets.push(`"sTruongDonVi" = $${p}::uuid`)
      params.push(org.sTruongDonVi)
      p++
    }
    params.push(org.Id)
    await prisma.$executeRawUnsafe(
      `UPDATE "${TARGET_SCHEMA}"."DM_DonVi" SET ${sets.join(", ")} WHERE "Id" = $${p}::uuid`,
      ...params
    )
    n++
  }
  return n
}

async function main() {
  const sourceUrl = process.env.POSTGRES_URL
  const targetUrl = process.env.MTA_COREDB_URL
  if (!sourceUrl) throw new Error("POSTGRES_URL is required (source / mta_internet)")
  if (!targetUrl) throw new Error("MTA_COREDB_URL is required (target / mta_coredb)")

  const source = createClient(sourceUrl)
  const target = createClient(targetUrl)
  const started = Date.now()

  try {
    console.log(`Mode: ${dryRun ? "DRY-RUN" : "APPLY"}`)
    console.log(`Source: POSTGRES_URL → ${SOURCE_SCHEMA}.DM_DonVi`)
    console.log(`Target: MTA_COREDB_URL → ${TARGET_SCHEMA}.DM_DonVi`)

    const sourceOrgs = await loadOrgs(source, SOURCE_SCHEMA)
    const targetOrgs = await loadOrgs(target, TARGET_SCHEMA)
    const fks = await resolveTargetFks(target)
    const targetCols = await getTargetColumns(target)

    console.log(`Source active orgs: ${sourceOrgs.length}`)
    console.log(`Target active orgs: ${targetOrgs.length}`)
    console.log(`Target FK columns: ${fks.map((f) => `${f.table}.${f.column}`).join(", ")}`)

    const { map, targetOnly, matchedSameId, unmapped } = buildIdMap(sourceOrgs, targetOrgs)

    console.log(`Same Id: ${matchedSameId.length}`)
    console.log(`Target-only (need remap→source): ${targetOnly.length}`)
    console.log(`Mapped: ${map.size}`)
    console.log(`Unmapped target-only: ${unmapped.length}`)

    const letterPreferred = []
    for (const [oldId, newId] of map) {
      const t = targetOrgs.find((o) => o.Id === oldId)
      const s = sourceOrgs.find((o) => o.Id === newId)
      if (codeScore(s?.sMa) > codeScore(t?.sMa)) {
        letterPreferred.push(`  ${t?.sMa} → ${s?.sMa} | "${s?.sTen}"`)
      }
    }
    console.log(`Letter-code preferred: ${letterPreferred.length}`)
    for (const line of letterPreferred.slice(0, 25)) console.log(line)
    if (letterPreferred.length > 25) console.log(`  … +${letterPreferred.length - 25}`)

    if (!quiet && unmapped.length) {
      console.log("Unmapped samples (will force-delete after nulling FK / or skip if refs):")
      for (const u of unmapped.slice(0, 15)) {
        const refs = dryRun ? "?" : await countRefs(target, fks, u.Id)
        console.log(`  ${u.sMa} "${u.sTen}" (${u.Id.slice(0, 8)}) refs=${refs}`)
      }
    }

    const sourceOnly = sourceOrgs.filter((s) => !targetOrgs.some((t) => t.Id === s.Id))
    console.log(`Source-only (will insert): ${sourceOnly.length}`)

    if (dryRun) {
      console.log("\nDry-run only. No changes.")
      console.log(`Elapsed: ${((Date.now() - started) / 1000).toFixed(1)}s`)
      return
    }

    let remapped = 0
    let deleted = 0
    let inserted = 0
    let updated = 0
    let failed = 0

    // 1) Insert missing source orgs first (so remap targets exist)
    console.log("\n[1/4] Upsert source orgs (without parents)…")
    for (const org of sourceOrgs) {
      try {
        const action = await upsertSourceOrg(target, org, targetCols)
        if (action === "insert") inserted++
        else updated++
      } catch (e) {
        failed++
        console.error(`FAIL upsert ${org.Id} ${org.sMa}:`, e.message)
      }
    }

    // 2) Remap FK old → source, hard-delete old
    console.log("[2/4] Remap FK + hard-delete target-only mapped…")
    for (const [oldId, newId] of map) {
      try {
        remapped += await remapId(target, fks, oldId, newId)
        await hardDeleteOrg(target, oldId)
        deleted++
        if (!quiet && deleted % 40 === 0) console.log(`  deleted ${deleted}/${map.size}`)
      } catch (e) {
        failed++
        console.error(`FAIL remap/delete ${oldId}→${newId}:`, e.message)
      }
    }

    // 3) Unmapped: remap refs to KEEP-like fallback (first HV root on source) then delete
    const fallbackRoot =
      sourceOrgs.find((o) => normName(o.sTen) === "học viện kỹ thuật quân sự")?.Id ||
      sourceOrgs.find((o) => !o.sParentId)?.Id

    console.log(`[3/4] Unmapped target-only (${unmapped.length}), fallback=${fallbackRoot?.slice(0, 8)}…`)
    for (const u of unmapped) {
      try {
        const refs = await countRefs(target, fks, u.Id)
        if (refs > 0 && fallbackRoot) {
          remapped += await remapId(target, fks, u.Id, fallbackRoot)
        } else {
          // null out FKs
          for (const fk of fks) {
            if (fk.table === "DM_DonVi") continue
            await target.$executeRawUnsafe(
              `UPDATE "${TARGET_SCHEMA}"."${fk.table}" SET "${fk.column}" = NULL WHERE "${fk.column}" = $1::uuid`,
              u.Id
            )
          }
        }
        await hardDeleteOrg(target, u.Id)
        deleted++
      } catch (e) {
        failed++
        console.error(`FAIL unmapped ${u.Id}:`, e.message)
      }
    }

    // Also hard-delete soft-deleted leftovers on target
    const soft = await target.$queryRawUnsafe(
      `SELECT "Id"::text AS id FROM "${TARGET_SCHEMA}"."DM_DonVi" WHERE "bDeleted" = true`
    )
    for (const row of soft) {
      try {
        if (fallbackRoot) remapped += await remapId(target, fks, row.id, fallbackRoot)
        await hardDeleteOrg(target, row.id)
        deleted++
      } catch (e) {
        // ignore if already gone
      }
    }

    // 4) Sync parent pointers from source
    console.log("[4/4] Sync sParentId / sTruongDonVi from source…")
    await syncParents(target, sourceOrgs, targetCols)

    // Verify counts
    const finalTarget = await loadOrgs(target, TARGET_SCHEMA)
    const orphanNv = await target.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS n FROM "${TARGET_SCHEMA}"."DM_NhanVien" n
       WHERE n."sDM_DonViId" IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM "${TARGET_SCHEMA}"."DM_DonVi" d WHERE d."Id" = n."sDM_DonViId")`
    )

    console.log("\n--- Summary ---")
    console.log(`Upserted: insert=${inserted}, update=${updated}`)
    console.log(`FK remapped: ${remapped}`)
    console.log(`Hard-deleted: ${deleted}`)
    console.log(`Failed: ${failed}`)
    console.log(`Target active now: ${finalTarget.length} (source=${sourceOrgs.length})`)
    console.log(`DM_NhanVien orphan FKs: ${orphanNv[0]?.n ?? "?"}`)
    console.log(`Elapsed: ${((Date.now() - started) / 1000).toFixed(1)}s`)
  } finally {
    await source.$disconnect()
    await target.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
