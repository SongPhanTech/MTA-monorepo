/**
 * Phase 1: Scan all .doc/.docx files, match to DB subjects, output import-catalog.json
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." bun scripts/bulk-import-catalog.mjs [--root /path/to/root]
 *
 * The root defaults to the well-known "Convert ngân hàng câu hỏi" folder.
 */
import { readdirSync, statSync, writeFileSync } from "node:fs"
import { basename, join, relative } from "node:path"
import { PrismaClient } from "../generated/prisma-client/index.js"

const DEFAULT_ROOT =
  "/Users/minhah/Downloads/Convert ngân hàng câu hỏi/Ngân hàng câu hỏi thi"

const rootArg = process.argv.indexOf("--root")
const ROOT = rootArg !== -1 ? process.argv[rootArg + 1] : DEFAULT_ROOT

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL required")
  process.exit(1)
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: url.includes("?")
        ? `${url}&connection_limit=1`
        : `${url}?connection_limit=1`,
    },
  },
})

// ── Training object type mapping from folder names ──────────────────
// Folder prefix -> TrainingObjectType.id in DB (mta_in)
const TRAINING_TYPE_MAP = {
  "01": "01", // Đại học dân sự
  "02": "12", // Cao học dân sự
  "03": "07", // Cao đẳng -> Liên thông quân sự CĐ
  "04": "15", // Liên thông, CC, VB2 -> Liên thông quân sự TC
  "05": "05", // Đại học quân sự
}

// Additional keywords that appear in K-series folders without numeric prefix
const TRAINING_TYPE_KEYWORDS = {
  "đại học": "01",
  "cao học": "12",
  "sau đại học": "12",
  "cao đẳng": "07",
  "liên thông": "15",
  "tiến sĩ": "14",
  "nghiên cứu sinh": "14",
  "chỉ huy tham mưu": "09",
  "chủ nhiệm hckt": "17",
  "chủ nhiệm hậu cần kỹ thuật": "17",
  "chủ nhiệm kho": "20",
  "chỉ huy tham mưu kỹ thuật": "09",
}

const NON_SUBJECT_FOLDER_PATTERNS = [
  /^nhch[\s_-]?/i,
  /^part\s*\d+$/i,
  /^nh(ó|o)m/i,
  /^c(â|a)u\s*\d+/i,
  /^page\s*\d+/i,
  /đ(ã|a)\s*s(ử|u)a/i,
  /^ch[uư][oơ]ng\s*\d+/i,        // CHƯƠNG 1, CHƯƠNG 2...
  /^CLO\d+$/i,                     // CLO1, CLO2
  /^t[uự]\s*lu[aậ]n$/i,           // Tự luận
  /^tr[aắ]c\s*nghi[eệ]m$/i,      // Trắc nghiệm
  /^baitap$/i,                     // Baitap
  /^Lythuyet$/i,                   // Lythuyet
  /^Phan\s*tu\s*luan$/i,          // Phan tu luan
  /^Tu\s*luan$/i,                  // Tu luan
  /^TN$/i,                         // TN (trắc nghiệm)
  /^0\s*TN$/i,                     // 0 TN
  /^\d+$/,                         // pure number: 60, 40, 00
  /^TL\d/i,                        // TL1, TL2
  /^thi\s*v[aấ]n\s*đ[aá]p$/i,    // Thi vấn đáp
  /^đ[aá]p\s*[aá]n/i,             // ĐÁP ÁN ...
  /^dua\s*v[aà]o\s*form/i,        // dua vào form ...
  /^Nh[oó]m\s*c[aâ]u\s*h[oỏ]i/i, // Nhóm câu hỏi tự luận
  /^Ng[aâ]n\s*h[aà]ng\s*đ[eề]\s*thi/i, // Ngân hàng đề thi
  /^C[aâ]u\s*h[oỏ]i\s*nh[oó]m/i, // Câu hỏi nhóm
  /^Nh[oó]m\s*\d+/i,              // Nhóm 1, Nhóm 2
  /^\d+[._]/,                      // 05_Chuỗi, 08.LaptrinhVaoRa, 10_Truyen nhiet...
  /^\d+\.\s/,                       // 1. Từ vựng, 2. Điền từ...
  /^\d+-/,                          // 1-Sắp xếp, 2-Đặt câu, 2-Ghép phụ âm...
  /^B[aà]i\s*đ[oọ]c\s*CN/i,       // Bài đọc CN 1_10, Bài đọc CN 2_1...
  /^NH\s*(DE|ĐỀ)/i,               // NH DE TNGA..., NH ĐỀ TNGA...
  /^Ngan[_\s]*hang/i,              // Ngan_hang_de_thi, NganHangNL_CTM...
  /^NHCH_/i,                        // NHCH_CTM_TRACNGHIEM...
  /^Cambien\s/i,                    // Cambien PLC...
  /^Thiet_ke_/i,                    // Thiet_ke_VLSI
  /^\d+[A-Z]{2,}$/,                // 65AB
  /^C[aâ]u\s*h[oỏ]i\s*thi/i,     // Câu hỏi thi_2024
  /^Quang\s*sai/i,                  // Quang sai & TKQH
  /^C[aâ]u\s+\d+/i,               // Câu 3. Dẻo 4 điểm
  /^PH[AẦ]N\s+\d+/i,              // PHẦN 2 TRANG BỊ...
  /^Tu\s*luan/i,                    // Tu luan (BT)
  /^Trac\s*nghiem/i,               // Trac nghiem
  /^NHDT/i,                         // NHDT_UD CAD...
  /^2022_final$/i,
  /^Ngan\s*hang\s*NL/i,            // NganHangNL_CTM_2024
]

// Manual mapping: abbreviated folder name -> actual Subject name in DB
const MANUAL_SUBJECT_MAP = {
  "1-TVNP": "Tiếng Việt chuyên ngành Tên lửa phòng không",
  "TV CN Ten lua2": "Tiếng Việt chuyên ngành Tên lửa",
  "3-Viết luận": "Tiếng Việt cơ sở A2.2",
  "4-Viết luận": "Tiếng Việt cơ sở A2.2",
  "Trang bị VK, KTQ trên xe QS - 30t": "Trang bị VK, KTQ trên xe QS",
  "Tính toán hệ thống quang học vùng hồng ngoại ảnh nhiệt - CH": "Tính toán hệ thống quang học vùng hồng ngoại ảnh nhiệt",
  "Nguyên lý tính toán và TKLP - Vấn đáp": "Nguyên lý tính toán và TKLP",
  "Kết cấu tính toánTTG - CDR 4+1 - Vấn đáp": "Kết cấu tính toán TTG",
  "Cấu tạo TTG - CDR 4+1 - Vấn đáp": "Cấu tạo TTG",
  "Chẩn đoán HTCK bang rung dong_CDR 4+1 - Vấn đáp": "Chẩn đoán HTCK bằng rung động",
  "Lý thuyết+Thi nghiem TTG_ CDR 4+1 - Vấn đáp": "Lý thuyết và thí nghiệm TTG",
  "Nung kim loại - chỉ dùng cho GCAL": "Nung kim loại",
  "Ứng dụng CAD,CAE trong GCAL - THỰC HÀNH": "Ứng dụng CAD,CAE trong GCAL",
  "Những NLCB của CM M_L 2 90p": "Những nguyên lý cơ bản của chủ nghĩa Mác - Lênin 2",
  "Cơ sở DL phân tán": "Cơ sở dữ liệu phân tán",
}

function detectTrainingType(folderName) {
  const prefix = folderName.substring(0, 2)
  if (TRAINING_TYPE_MAP[prefix]) return TRAINING_TYPE_MAP[prefix]

  const lower = folderName.toLowerCase()
  for (const [kw, code] of Object.entries(TRAINING_TYPE_KEYWORDS)) {
    if (lower.includes(kw)) return code
  }
  return null
}

function stripDiacritics(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
}

// ── Extract subject name from folder ────────────────────────────────
// Strategy: split by " - ", classify each segment, keep only subject-name segments.
const NOISE_SEGMENT_PATTERNS = [
  /^\d{1,2}[./]\d{1,2}[./]\d{2,4}$/,           // date: 30.12.2019
  /^\d{1,2}[./]\d{4}$/,                          // date: 5.2021
  /^\d+\s*ph[uú]t$/i,                            // duration: 30 phút
  /^\d+p$/i,                                      // duration: 90p
  /^(SDTL|CHDS|CHTMKT|CNHCKT|CHQS|NCS|TS|DS)$/i, // training codes
  /^CH\d*$/i,                                      // CH35, CH32
  /^(vi[eế]t|ng[aắ]n\s*h[aạ]n|d[aà]i\s*h[aạ]n)$/i, // exam mode
  /^(m[oớ]i|c[uũ]|New)$/i,
  /^(đ[uư][oợ]c\s*s[uử]\s*d[uụ]ng\s*t[aà]i\s*li[eệ]u)$/i,
  /^c[aậ]p\s*nh[aậ]t/i,                          // cập nhật ...
  /^d[uù]ng\s+(l[oớ]p|t[aạ]m)/i,                // dùng lớp/tạm ...
  /^ch[uư]a\s+đ[uủ]/i,                           // chưa đủ ...
  /^sai\s*m[aẫ]u/i,
  /^d[aâ]n\s*s[uự]/i,
  /^ph[aầ]n\s*b[aà]i\s*t[aậ]p/i,
  /^Cao\s*h[oọ]c$/i,
  /^đ[aạ]i\s*h[oọ]c$/i,
  /^\d{1,2}[./]\d{1,2}[./]\d{2,4}\s*$/,
]

function isNoiseSegment(seg) {
  const s = seg.trim()
  if (!s) return true
  const sNorm = s.normalize("NFC")
  const sAscii = stripDiacritics(s).toLowerCase().trim()
  // Pure date
  if (/^\d{1,2}[./]\d{1,4}([./]\d{2,4})?$/.test(s)) return true
  // Duration (ascii-safe): "30 phut", "90 phut", "60p"
  if (/^\d+\s*phut$/i.test(sAscii) || /^\d+p$/i.test(sAscii)) return true
  // Starts with known noise keyword
  if (/^(SDTL|CHDS|CHTMKT|CNHCKT|CHQS|NCS|CH\d)/i.test(s)) return true
  if (/^cap\s*nhat/i.test(sAscii)) return true
  if (/^thuc\s*hanh$/i.test(sAscii)) return true
  if (/^chi\s*dung\s*cho/i.test(sAscii)) return true
  if (/^(viet|ngan\s*han|dai\s*han)$/i.test(sAscii)) return true
  if (/^(moi|cu|new)$/i.test(sAscii)) return true
  if (/^(duoc\s*su\s*dung\s*tai\s*lieu)$/i.test(sAscii)) return true
  if (/^dung\s+(lop|tam)/i.test(sAscii)) return true
  if (/^chua\s+du/i.test(sAscii)) return true
  if (/^sai\s*mau/i.test(sAscii)) return true
  if (/^dan\s*su$/i.test(sAscii)) return true
  if (/^phan\s*bai\s*tap$/i.test(sAscii)) return true
  if (/^(cao\s*hoc|dai\s*hoc)$/i.test(sAscii)) return true
  if (/^(SDTL|CHDS|CHTMKT|CNHCKT|CHQS|NCS|TS|DS)$/i.test(s)) return true
  if (/^CH\d*$/i.test(s)) return true
  return false
}

function extractSubjectName(folderName) {
  // Remove parenthesized content first
  let cleaned = folderName.replace(/\s*\([^)]*\)\s*/g, " ").trim()
  // Normalize "-90p" / "-30 phút" without space: insert space before dash
  cleaned = cleaned.replace(/-(\d+p)\b/gi, " - $1")
  // Split by " - " (the common delimiter)
  const segments = cleaned.split(/\s+-\s+/)
  const kept = segments.filter((seg) => !isNoiseSegment(seg))
  let name = kept.join(" - ").trim()
  // Final cleanup: inline dates, trailing dashes
  name = name
    .replace(/\b\d{1,2}[./]\d{1,4}([./]\d{2,4})?\b/g, " ")
    .replace(/\s*-\s*-\s*/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*$/, "")
    .trim()
  return name
}

function looksLikeNonSubjectFolder(name) {
  const n = name.trim()
  if (!n) return true
  if (detectTrainingType(n)) return true
  if (/^(\d+\s+)?BM\s/i.test(n) || /^Bộ\s+môn/i.test(n) || /^BĐTT/i.test(n)) return true
  const nAscii = stripDiacritics(n).toLowerCase()
  for (const re of NON_SUBJECT_FOLDER_PATTERNS) {
    if (re.test(n) || re.test(nAscii)) return true
  }
  // Extra ascii-safe checks for common patterns
  if (/^cau\s+\d+/i.test(nAscii)) return true
  if (/^phan\s+\d+/i.test(nAscii)) return true
  if (/^nhom\s+\d+/i.test(nAscii)) return true
  if (/^tu\s*luan/i.test(nAscii)) return true
  if (/^trac\s*nghiem/i.test(nAscii)) return true
  if (/^dap\s*an/i.test(nAscii)) return true
  if (/^ngan\s*hang\s*(de|cau)/i.test(nAscii)) return true
  if (/^nhom\s*cau\s*hoi/i.test(nAscii)) return true
  if (/^cau\s*hoi\s*nhom/i.test(nAscii)) return true
  return false
}

// ── Recursively find all .doc/.docx files ───────────────────────────
function findDocFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    try {
      const stat = statSync(full)
      if (stat.isDirectory()) {
        findDocFiles(full, files)
      } else if (/\.(doc|docx)$/i.test(entry)) {
        files.push(full)
      }
    } catch {
      // skip unreadable
    }
  }
  return files
}

// ── Parse folder path into metadata ─────────────────────────────────
function parseFilePath(filePath) {
  const rel = relative(ROOT, filePath)
  const parts = rel.split("/")
  // parts[0] = top-level folder (V4, K6, K11, etc.)
  // The rest varies:
  //   V4/01 Đại học/01 BM .../Subject folder/file.doc
  //   K6/Chủ nhiệm HCKT/Subject folder/file.doc
  //   K11/BM Vật lý/Subject folder/file.doc
  //   K11/Cao học/BM .../Subject folder/file.doc

  const topFolder = parts[0]
  const fileName = basename(filePath, /\.docx?$/i.exec(filePath)?.[0] || ".doc")

  let trainingTypeId = null
  let bmName = null
  let subjectFolderName = null

  // Try to find training type and BM from path segments
  for (let i = 1; i < parts.length - 1; i++) {
    const seg = parts[i]
    const tt = detectTrainingType(seg)
    if (tt && !trainingTypeId) {
      trainingTypeId = tt
      continue
    }
    if (/^(\d+\s+)?BM\s/i.test(seg) || /^(\d+\s+)?B[oộ]\s+m[oô]n/i.test(seg) || /^Nh[oó]m\s/i.test(seg) || /^BĐTT/i.test(seg)) {
      bmName = seg
      continue
    }
    if (i === parts.length - 2) subjectFolderName = seg
  }

  // Choose subject folder by scanning backwards:
  // nearest folder before the file that is not helper-folder/BM/training-type.
  for (let i = parts.length - 2; i >= 1; i--) {
    const seg = parts[i]
    if (seg === bmName) continue
    if (looksLikeNonSubjectFolder(seg)) continue
    subjectFolderName = seg
    break
  }

  // For K-series without explicit training type subfolder,
  // if there's no training type detected, default to null (will be "unmatched")
  // For direct BM folders under K-series (e.g., K11/BM Vật lý/Subject/file.doc)
  // training type is ambiguous — default to "01" (Đại học)
  if (!trainingTypeId && topFolder.startsWith("K")) {
    // Direct BM folder under K-series without training type — default to "01" (Đại học)
    if (bmName) {
      trainingTypeId = "01"
    }
  }

  const subjectName = subjectFolderName
    ? extractSubjectName(subjectFolderName)
    : null

  return {
    filePath,
    relativePath: rel,
    topFolder,
    trainingTypeId,
    bmName,
    subjectFolderName,
    subjectName,
    bankName: fileName,
  }
}

// ── Normalize Vietnamese for fuzzy matching ─────────────────────────
function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFC")
    .replace(/[.,;:\-–—()[\]{}'"]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeAscii(s) {
  return stripDiacritics(normalize(s))
}

function strongNormalizeSubjectName(s) {
  return normalizeAscii(s)
    .replace(/\b(cao hoc|dai hoc|cao dang|lien thong|sau dai hoc)\b/g, " ")
    .replace(/\b(chds|sdtl|viet|de cuong|sai mau|dan su|quan su)\b/g, " ")
    .replace(/\b(nhom|cau hoi|ngan hang cau hoi|nhch)\b/g, " ")
    .replace(/\b(copy|da sua|moi|cu)\b/g, " ")
    .replace(/\b\d+\s*phut\b/g, " ")
    .replace(/\b\d{1,2}[./]\d{1,2}[./]\d{2,4}\b/g, " ")
    .replace(/\b(mon|phan|loai)\b/g, " ")
    .replace(/\b[ivx]+\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokenSet(s) {
  return new Set(
    strongNormalizeSubjectName(s)
      .split(" ")
      .filter((t) => t.length >= 3 && !/^\d+$/.test(t))
  )
}

function tokenOverlapScore(a, b) {
  const ta = tokenSet(a)
  const tb = tokenSet(b)
  if (ta.size === 0 || tb.size === 0) return 0
  let common = 0
  for (const t of ta) if (tb.has(t)) common++
  return common / Math.max(ta.size, tb.size)
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log(`Scanning ${ROOT} ...`)
  const docFiles = findDocFiles(ROOT)
  console.log(`Found ${docFiles.length} doc files`)

  // Parse all paths
  const entries = docFiles.map(parseFilePath)

  // Load all subjects and subject versions from DB
  console.log("Loading subjects from DB...")
  const subjects = await prisma.$queryRaw`
    SELECT s.id, s.code, s.name, s."managementOrganizationId"
    FROM "ql-dao-tao"."Subject" s
    WHERE s."deletedAt" IS NULL
  `
  console.log(`Loaded ${subjects.length} subjects`)

  const subjectVersions = await prisma.$queryRaw`
    SELECT sv.id, sv.code, sv.name, sv."subjectId", sv."trainingObjectTypeId",
           sv."managementOrganizationId", sv.credit, sv."examType", sv.type,
           sv.period, sv."schedulePeriod"
    FROM "ql-dao-tao"."SubjectVersion" sv
    WHERE sv."deletedAt" IS NULL
  `
  console.log(`Loaded ${subjectVersions.length} subject versions`)

  const questionBanks = await prisma.$queryRaw`
    SELECT qb.id, qb.name, qb."subjectVersionId"
    FROM "khao-thi"."QuestionBank" qb
    WHERE qb."deletedAt" IS NULL
  `
  console.log(`Loaded ${questionBanks.length} question banks`)

  // Build lookup structures
  // Map: normalized subject name -> Subject[]
  const subjectByName = new Map()
  const subjectByNameAscii = new Map()
  const subjectByStrongName = new Map()
  for (const s of subjects) {
    const key = normalize(s.name)
    if (!subjectByName.has(key)) subjectByName.set(key, [])
    subjectByName.get(key).push(s)
    const keyAscii = normalizeAscii(s.name)
    if (!subjectByNameAscii.has(keyAscii)) subjectByNameAscii.set(keyAscii, [])
    subjectByNameAscii.get(keyAscii).push(s)
    const strongKey = strongNormalizeSubjectName(s.name)
    if (!subjectByStrongName.has(strongKey)) subjectByStrongName.set(strongKey, [])
    subjectByStrongName.get(strongKey).push(s)
  }
  // Also index by code
  const subjectByCode = new Map()
  for (const s of subjects) {
    if (s.code) subjectByCode.set(s.code.toLowerCase(), s)
  }

  // Map: subjectId + trainingObjectTypeId -> SubjectVersion[]
  const svBySubjectAndType = new Map()
  for (const sv of subjectVersions) {
    const key = `${sv.subjectId}::${sv.trainingObjectTypeId}`
    if (!svBySubjectAndType.has(key)) svBySubjectAndType.set(key, [])
    svBySubjectAndType.get(key).push(sv)
  }

  // Map: subjectId -> SubjectVersion[] (all types)
  const svBySubject = new Map()
  for (const sv of subjectVersions) {
    if (!svBySubject.has(sv.subjectId)) svBySubject.set(sv.subjectId, [])
    svBySubject.get(sv.subjectId).push(sv)
  }

  // Map: subjectVersionId + bankName -> QuestionBank
  const qbLookup = new Map()
  for (const qb of questionBanks) {
    qbLookup.set(`${qb.subjectVersionId}::${normalize(qb.name)}`, qb)
  }

  // ── Match each entry ──────────────────────────────────────────────
  const matched = []
  const missingSv = []
  const unmatched = []

  for (const entry of entries) {
    if (!entry.subjectName) {
      unmatched.push({ ...entry, reason: "Could not extract subject name from path" })
      continue
    }
    if (!entry.trainingTypeId) {
      unmatched.push({ ...entry, reason: "Could not determine training object type" })
      continue
    }

    // Check manual mapping first (use original subjectFolderName before extraction)
    const manualName = MANUAL_SUBJECT_MAP[entry.subjectFolderName] || MANUAL_SUBJECT_MAP[entry.subjectName]
    const effectiveName = manualName || entry.subjectName

    const normalizedName = normalize(effectiveName)
    const normalizedNameAscii = normalizeAscii(effectiveName)
    const normalizedNameStrong = strongNormalizeSubjectName(effectiveName)

    // Try exact match
    let matchedSubjects = subjectByName.get(normalizedName)

    // Try accent-insensitive exact match
    if (!matchedSubjects || matchedSubjects.length === 0) {
      matchedSubjects = subjectByNameAscii.get(normalizedNameAscii)
    }
    if ((!matchedSubjects || matchedSubjects.length === 0) && normalizedNameStrong) {
      matchedSubjects = subjectByStrongName.get(normalizedNameStrong)
    }

    // Try partial matching if exact fails
    if (!matchedSubjects || matchedSubjects.length === 0) {
      // Try matching by checking if DB subject name contains the file subject name or vice versa
      const candidates = []
      for (const [dbName, dbSubjects] of subjectByName) {
        const dbNameAscii = normalizeAscii(dbName)
        const includesAccent =
          dbName.includes(normalizedName) || normalizedName.includes(dbName)
        const includesAscii =
          dbNameAscii.includes(normalizedNameAscii) ||
          normalizedNameAscii.includes(dbNameAscii)
        if (includesAccent || includesAscii) {
          candidates.push(...dbSubjects)
        }
      }
      if (candidates.length > 0) {
        // De-duplicate + prefer closest normalized-length
        const seen = new Set()
        const uniqueCandidates = []
        for (const c of candidates) {
          if (seen.has(c.id)) continue
          seen.add(c.id)
          uniqueCandidates.push(c)
        }
        uniqueCandidates.sort((a, b) => {
          const da = Math.abs(normalizeAscii(a.name).length - normalizedNameAscii.length)
          const db = Math.abs(normalizeAscii(b.name).length - normalizedNameAscii.length)
          return da - db
        })
        matchedSubjects = uniqueCandidates
      }
    }

    // Strong fuzzy pass: token-overlap ranking
    if (!matchedSubjects || matchedSubjects.length === 0) {
      const ranked = []
      for (const s of subjects) {
        const score = tokenOverlapScore(entry.subjectName, s.name)
        if (score >= 0.5) ranked.push({ s, score })
      }
      ranked.sort((a, b) => b.score - a.score)
      if (ranked.length > 0) {
        matchedSubjects = ranked.slice(0, 3).map((r) => r.s)
      }
    }

    // Try matching by subject code in bank name (e.g., "73AN" might match code)
    if (!matchedSubjects || matchedSubjects.length === 0) {
      const codeMatch = entry.bankName.match(/^(\d+[A-Z]+)/i)
      if (codeMatch) {
        const code = codeMatch[1].toLowerCase()
        // Look for SV with matching code prefix
        for (const sv of subjectVersions) {
          if (sv.code && sv.code.toLowerCase().startsWith(code)) {
            const subj = subjects.find((s) => s.id === sv.subjectId)
            if (subj) {
              matchedSubjects = [subj]
              break
            }
          }
        }
      }
    }

    if (!matchedSubjects || matchedSubjects.length === 0) {
      unmatched.push({ ...entry, reason: "No matching Subject found in DB" })
      continue
    }

    // Pick the first match (or the one with matching management org)
    const subject = matchedSubjects[0]

    // Check if SubjectVersion exists for this training type
    const svKey = `${subject.id}::${entry.trainingTypeId}`
    const svList = svBySubjectAndType.get(svKey)

    if (!svList || svList.length === 0) {
      // Check if ANY SubjectVersion exists for this subject (to clone from)
      const anySv = svBySubject.get(subject.id)
      missingSv.push({
        ...entry,
        subjectId: subject.id,
        subjectName_db: subject.name,
        subjectCode: subject.code,
        templateSvId: anySv?.[0]?.id || null,
        templateSvTrainingType: anySv?.[0]?.trainingObjectTypeId || null,
      })
      continue
    }

    // Found SubjectVersion — check for QuestionBank
    const sv = svList[0]
    const qbKey = `${sv.id}::${normalize(entry.bankName)}`
    const existingQb = qbLookup.get(qbKey)

    matched.push({
      ...entry,
      subjectId: subject.id,
      subjectName_db: subject.name,
      subjectCode: subject.code,
      subjectVersionId: sv.id,
      subjectVersionCode: sv.code,
      trainingObjectTypeId: sv.trainingObjectTypeId,
      questionBankId: existingQb?.id || null,
      questionBankExists: !!existingQb,
    })
  }

  const catalog = {
    generatedAt: new Date().toISOString(),
    root: ROOT,
    summary: {
      totalFiles: docFiles.length,
      matched: matched.length,
      missingSv: missingSv.length,
      unmatched: unmatched.length,
    },
    matched,
    missingSv,
    unmatched,
  }

  const outPath = join(import.meta.dir || ".", "import-catalog.json")
  writeFileSync(outPath, JSON.stringify(catalog, null, 2), "utf8")
  console.log("\n=== Summary ===")
  console.log(`Total files:  ${catalog.summary.totalFiles}`)
  console.log(`Matched:      ${catalog.summary.matched}`)
  console.log(`Missing SV:   ${catalog.summary.missingSv}`)
  console.log(`Unmatched:    ${catalog.summary.unmatched}`)
  console.log(`\nCatalog written to ${outPath}`)

  // Print some unmatched samples for debugging
  if (unmatched.length > 0) {
    console.log("\n--- Sample unmatched (first 20) ---")
    for (const u of unmatched.slice(0, 20)) {
      console.log(`  ${u.relativePath}`)
      console.log(`    subject: "${u.subjectName}" | reason: ${u.reason}`)
    }
  }
  if (missingSv.length > 0) {
    console.log("\n--- Sample missing SV (first 20) ---")
    for (const m of missingSv.slice(0, 20)) {
      console.log(`  ${m.relativePath}`)
      console.log(`    subject: "${m.subjectName_db}" (${m.subjectId}) | need type: ${m.trainingTypeId} | template: ${m.templateSvId}`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
