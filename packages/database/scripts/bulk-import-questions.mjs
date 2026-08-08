/**
 * Phase 3: Bulk import questions from .doc files into matched QuestionBanks.
 *
 * Detects ESSAY vs SINGLE_CHOICE (A–D options), upserts questions in parallel
 * batches, and syncs MultipleChoiceOption rows for MC questions.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." bun scripts/bulk-import-questions.mjs [--dry-run] [--limit N] [--concurrency N] [--batch N]
 *   DATABASE_URL="postgresql://..." bun scripts/bulk-import-questions.mjs --errors-only --via-word
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { join, basename } from "node:path"
import { execFileSync, execSync } from "node:child_process"
import { PrismaClient } from "../generated/prisma-client/index.js"

const dryRun = process.argv.includes("--dry-run")
const errorsOnly = process.argv.includes("--errors-only")
const viaWord = process.argv.includes("--via-word")
const limitArg = process.argv.indexOf("--limit")
const limit = limitArg !== -1 ? Number(process.argv[limitArg + 1]) : Infinity
const offsetArg = process.argv.indexOf("--offset")
const offset = offsetArg !== -1 ? Number(process.argv[offsetArg + 1]) : 0
const concurrencyArg = process.argv.indexOf("--concurrency")
// Word automation must be sequential (single Word app)
const FILE_CONCURRENCY = viaWord
  ? 1
  : concurrencyArg !== -1
    ? Number(process.argv[concurrencyArg + 1])
    : 8
const batchArg = process.argv.indexOf("--batch")
const UPSERT_BATCH = batchArg !== -1 ? Number(process.argv[batchArg + 1]) : 20
const CONNECTION_LIMIT = Math.max(FILE_CONCURRENCY + 2, 12)
const MAX_QUESTIONS_PER_FILE = 2000
const MAX_TEXT_CHARS = 2_000_000
const WORD_SCRIPT = join(import.meta.dir || ".", "word-extract-text.applescript")

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL required")
  process.exit(1)
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: url.includes("?")
        ? `${url}&connection_limit=${CONNECTION_LIMIT}`
        : `${url}?connection_limit=${CONNECTION_LIMIT}`,
    },
  },
})

const CATALOG_PATH = join(import.meta.dir || ".", "import-catalog.json")
const TMP_DIR = "/tmp/nhch-convert"

const TYPE_MAP = {
  TL: "ESSAY",
  TN: "SINGLE_CHOICE",
  TNN: "MULTIPLE_CHOICE",
  DK: "FILL_IN_BLANK",
  SX: "ORDERING",
  CH: "CLUSTER",
}
const DIFF_MAP = { NB: "D1", TH: "D2", VD: "D3", VDC: "D4" }

function extractDifficulty(bankName) {
  const clamp = (n) => `D${Math.min(4, Math.max(1, Number(n)))}`
  const m = bankName.match(/(\d)D[_-]|\bD([1-9])\b/i)
  if (m) return clamp(m[1] || m[2])
  return "D3"
}

function extractPointHint(name) {
  const m = String(name).match(/(\d+[.,]?\d*)\s*d(?:iem|iem|\b)/i)
  if (m) return Number.parseFloat(m[1].replace(",", "."))
  return null
}

function sanitizeText(text) {
  return String(text ?? "").replace(/\u0000/g, "")
}

function questionCode(questionBankId, num) {
  return `${questionBankId}-C${String(num).padStart(4, "0")}`
}

function looksLikeBinaryGarbage(text) {
  if (!text || text.length < 20) return true
  const sample = text.slice(0, 4000)
  let weird = 0
  for (let i = 0; i < sample.length; i++) {
    const c = sample.charCodeAt(i)
    if (c === 0 || (c < 9 && c !== 9) || (c > 14 && c < 32 && c !== 10 && c !== 13)) weird++
  }
  // High ratio of control/NUL bytes => failed .doc decode
  if (weird / sample.length > 0.02) return true
  // No printable Vietnamese/ASCII letters in first chunk
  const letters = (sample.match(/[A-Za-zÀ-ỹ]/g) || []).length
  if (letters < 30 && sample.length > 200) return true
  return false
}

function isUsableConvertedText(text) {
  if (!text || text.trim().length < 30) return false
  // Huge dumps are almost always failed OLE decode
  if (text.length > 500_000) return false
  const sample = text.slice(0, 4000)
  let weird = 0
  for (let i = 0; i < sample.length; i++) {
    const c = sample.charCodeAt(i)
    if (c === 0 || (c < 32 && c !== 9 && c !== 10 && c !== 13)) weird++
  }
  if (weird / sample.length > 0.08) return false
  const letters = (sample.match(/[A-Za-zÀ-ỹ]/g) || []).length
  if (letters < 60) return false
  return /Câu|câu hỏi|Đáp án|\bA[\.\s]|Trắc nghiệm|NHÓM CÂU/i.test(text)
}

function textutilToText(docPath) {
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true })
  const outFile = join(
    TMP_DIR,
    `${Date.now()}_${Math.random().toString(36).slice(2)}_${basename(docPath)}.txt`
  )
  execSync(`textutil -convert txt -output "${outFile}" "${docPath}"`, {
    timeout: 45000,
    stdio: "pipe",
  })
  return sanitizeText(readFileSync(outFile, "utf8"))
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .normalize("NFC")
}

function docToTextViaWord(docPath) {
  if (!existsSync(WORD_SCRIPT)) {
    throw new Error(`Missing Word extract script: ${WORD_SCRIPT}`)
  }
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true })

  // Copy to ASCII path — NFD Vietnamese paths break Word automation intermittently
  const ext = basename(docPath).toLowerCase().endsWith(".docx") ? ".docx" : ".doc"
  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`
  const tmpDoc = join(TMP_DIR, `word_in_${id}${ext}`)
  const tmpTxt = join(TMP_DIR, `word_out_${id}.txt`)
  try {
    execSync(`cp "${docPath}" "${tmpDoc}"`, { timeout: 60000, stdio: "pipe" })
  } catch (e) {
    throw new Error(`Cannot copy for Word: ${e.message.split("\n")[0]}`)
  }

  try {
    execFileSync("osascript", [WORD_SCRIPT, tmpDoc, tmpTxt], {
      timeout: 320000,
      maxBuffer: 4 * 1024 * 1024,
      encoding: "utf8",
    })
    if (!existsSync(tmpTxt)) {
      throw new Error("Word did not write output txt")
    }
    const buf = readFileSync(tmpTxt)
    let raw
    // Detect encoding: UTF-16 BOM, UTF-8 BOM, else UTF-8 (do NOT treat table BEL as UTF-16)
    if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
      raw = buf.slice(2).toString("utf16le")
    } else if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
      // UTF-16 BE — swap
      const swapped = Buffer.alloc(buf.length - 2)
      for (let i = 2; i + 1 < buf.length; i += 2) {
        swapped[i - 2] = buf[i + 1]
        swapped[i - 1] = buf[i]
      }
      raw = swapped.toString("utf16le")
    } else if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
      raw = buf.slice(3).toString("utf8")
    } else {
      // Heuristic: lots of NULs in first chunk ⇒ UTF-16LE without BOM
      const sample = buf.slice(0, Math.min(buf.length, 400))
      let nuls = 0
      for (const b of sample) if (b === 0) nuls++
      if (nuls > sample.length * 0.1) {
        raw = buf.toString("utf16le")
      } else {
        raw = buf.toString("utf8")
      }
    }
    let text = sanitizeText(String(raw))
      .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .normalize("NFC")
    const keepFile = join(TMP_DIR, `word_${id}_${basename(docPath)}.txt`)
    writeFileSync(keepFile, text, "utf8")
    if (text.trim().length < 20) {
      throw new Error("Word returned empty text")
    }
    // Reject mojibake from wrong encoding (CJK dense with no Vietnamese markers)
    const letters = (text.slice(0, 2000).match(/[A-Za-zÀ-ỹ]/g) || []).length
    if (letters < 40 && !/Câu|câu hỏi|Đáp án/i.test(text.slice(0, 5000))) {
      throw new Error("Word text looks wrongly decoded")
    }
    if (text.length > MAX_TEXT_CHARS) text = text.slice(0, MAX_TEXT_CHARS)
    return text
  } catch (e) {
    // Reset Word only after failure
    try {
      execSync(`osascript -e 'tell application "Microsoft Word" to quit'`, {
        timeout: 20000,
        stdio: "pipe",
      })
    } catch {
      try {
        execSync(`pkill -9 "Microsoft Word"`, { stdio: "pipe" })
      } catch {
        /* ignore */
      }
    }
    throw new Error(`Word convert failed: ${e.message.split("\n")[0]}`)
  } finally {
    try {
      execSync(`rm -f "${tmpDoc}" "${tmpTxt}"`, { stdio: "pipe" })
    } catch {
      /* ignore */
    }
  }
}

function docToText(docPath) {
  // --via-word: always use Word (soft textutil often under-parses OLE .doc as 1 blob)
  if (viaWord) return docToTextViaWord(docPath)

  // Soft textutil first (works for many "false garbage" files with control chars)
  try {
    const t = textutilToText(docPath)
    if (isUsableConvertedText(t)) {
      return t.length > MAX_TEXT_CHARS ? t.slice(0, MAX_TEXT_CHARS) : t
    }
  } catch {
    /* fall through */
  }

  // Strict path for normal bulk import
  try {
    const text = textutilToText(docPath)
    if (looksLikeBinaryGarbage(text) || !isUsableConvertedText(text)) {
      throw new Error("textutil output looks binary/garbage")
    }
    return text.length > MAX_TEXT_CHARS ? text.slice(0, MAX_TEXT_CHARS) : text
  } catch (e) {
    throw new Error(`Cannot convert ${docPath}: ${e.message}`)
  }
}

function splitAnswerSection(body) {
  const idx = body.search(/\n?\s*\*?\s*Đáp\s*án\s*:/i)
  if (idx < 0) return { body, answerText: "" }
  return {
    body: body.slice(0, idx).trim(),
    answerText: body
      .slice(idx)
      .replace(/^\s*\*?\s*Đáp\s*án\s*:\s*/i, "")
      .trim(),
  }
}

function parseOptionBlock(optionLines) {
  const options = []
  let i = 0
  while (i < optionLines.length && options.length < 8) {
    const line = optionLines[i]
    const sameLine = line.match(/^([A-D])\.\s*(.+)$/i)
    const labelOnly = line.match(/^([A-D])\.?\s*$/i)
    // "A 56 %" — only when label is A-D and rest is not a long sentence start
    const labelSpace = line.match(/^([A-D])\s+(.+)$/i)

    if (sameLine) {
      options.push({ label: sameLine[1].toUpperCase(), content: sameLine[2].trim() })
      i++
      continue
    }
    if (labelOnly) {
      const label = labelOnly[1].toUpperCase()
      const contentParts = []
      i++
      while (i < optionLines.length && !/^([A-D])(?:\.?\s*$|\.\s+\S)/i.test(optionLines[i])) {
        // stop if next line looks like a new question
        if (/^Câu(?:\s*hỏi)?\s*\d+/i.test(optionLines[i])) break
        contentParts.push(optionLines[i])
        i++
      }
      options.push({ label, content: contentParts.join(" ").trim() })
      continue
    }
    // Only accept "A content" form when content is short-ish option text
    if (labelSpace && labelSpace[2].length <= 200) {
      const expected = "ABCD"[options.length]
      if (expected && labelSpace[1].toUpperCase() === expected) {
        options.push({
          label: labelSpace[1].toUpperCase(),
          content: labelSpace[2].trim(),
        })
        i++
        continue
      }
    }
    break
  }
  return options
}

function tryExtractOptionsFromLines(main, answerText) {
  const lines = main
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  for (let start = 0; start < lines.length; start++) {
    // Prefer label-only "A" or "A. content" — avoid matching "C" inside prose
    if (!/^(A)(?:\.?\s*$|\.\s+\S)/i.test(lines[start])) continue

    const options = parseOptionBlock(lines.slice(start))
    const labels = options.map((o) => o.label).join("")
    const isMc =
      options.length >= 2 && /^AB/.test(labels) && options.every((o) => o.content.length > 0)

    if (!isMc) continue

    const contentLines = lines.slice(0, start).filter((l) => !/^\d{1,4}$/.test(l))
    const correct = new Set()
    if (answerText) {
      for (const m of answerText.matchAll(/\b([A-D])\b/gi)) {
        correct.add(m[1].toUpperCase())
      }
    }
    for (const o of options) o.isCorrect = correct.has(o.label)

    return {
      content: contentLines.join("\n").trim(),
      options,
      answerText,
      isMc: true,
    }
  }

  return { content: main.trim(), options: [], answerText, isMc: false }
}

/**
 * Extract A–D options from question body.
 * Supports:
 *   A\n56 %\nB\n12 %
 *   A. 56 %\nB. 12 %
 *   inline "... là: A. 56 % B. 12 % C. 44 % D. 8 %"
 */
function extractMcOptions(rawBody) {
  const cleaned = rawBody.replace(/\r/g, "").replace(/\u00A0/g, " ")
  const { body: main0, answerText } = splitAnswerSection(cleaned)

  // 1) As-is (label on its own line — common after textutil)
  let result = tryExtractOptionsFromLines(main0, answerText)
  if (result.isMc) return result

  // 2) Split inline "A. … B. …" onto separate lines (do NOT split bare "C" in prose)
  const withDots = main0.replace(/([^\n])([A-D])\.\s+/g, "$1\n$2. ")
  result = tryExtractOptionsFromLines(withDots, answerText)
  if (result.isMc) return result

  // 3) Inline bare labels only when A..D all appear as a clear option run after ":" or "?"
  const inline = main0.replace(
    /([:?])\s*A\s+(.+?)\s+B\s+(.+?)\s+C\s+(.+?)\s+D\s+(.+?)\s*$/i,
    "$1\nA\n$2\nB\n$3\nC\n$4\nD\n$5"
  )
  if (inline !== main0) {
    result = tryExtractOptionsFromLines(inline, answerText)
    if (result.isMc) return result
  }

  return { content: main0.trim(), options: [], answerText, isMc: false }
}

function parseStandardHeader(line) {
  const m = line.match(
    /^Câu\s*(\d+)\s*:\s*\(\s*(TNN|TN|DK|SX|TL|CH)\s*-\s*(NB|TH|VD|VDC)\s*\)\s*\(\s*([\d.,]+)\s*đ\s*\)\s*(.*)$/i
  )
  if (!m) return null
  return {
    num: Number(m[1]),
    type: TYPE_MAP[m[2].toUpperCase()] || "ESSAY",
    difficult: DIFF_MAP[m[3].toUpperCase()] || "D3",
    point: Number.parseFloat(m[4].replace(",", ".")),
    rest: (m[5] || "").trim(),
  }
}

function parseQuestions(text, bankName, bankId) {
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  text = text.replace(/\nGhi chú:[\s\S]*$/i, "")

  const defaultDifficult = extractDifficulty(bankName)
  const pointHint = extractPointHint(bankName)
  const questions = []
  const seenNums = new Set()

  const pushQ = (q) => {
    if (!q.content || q.content.length < 2) return
    const num = q.num
    if (seenNums.has(num)) return
    seenNums.add(num)
    questions.push({
      num,
      content: sanitizeText(q.content),
      point: q.point ?? pointHint ?? 1,
      explanation: q.explanation ? sanitizeText(q.explanation) : null,
      type: q.type || "ESSAY",
      difficult: q.difficult || defaultDifficult,
      isAutoGraded: q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE",
      questionBankId: bankId,
      code: questionCode(bankId, num),
      options: q.options || [],
    })
  }

  // ── Strategy A: standard Word format "Câu N: (TN - VD) (1 đ)" ──
  const stdParts = text.split(/\n(?=Câu\s*\d+\s*:\s*\()/i)
  let usedStd = false
  for (const part of stdParts) {
    const firstLine = part.split("\n")[0] || ""
    const header = parseStandardHeader(firstLine.trim())
    if (!header) continue
    usedStd = true
    const restBody = [header.rest, ...part.split("\n").slice(1)].join("\n")
    const mc = extractMcOptions(restBody)
    if (header.type === "SINGLE_CHOICE" || header.type === "MULTIPLE_CHOICE" || mc.isMc) {
      pushQ({
        num: header.num,
        content: mc.content || restBody.trim(),
        point: header.point,
        difficult: header.difficult,
        type: header.type === "ESSAY" && mc.isMc ? "SINGLE_CHOICE" : header.type,
        explanation: mc.answerText || null,
        options: mc.options,
      })
    } else {
      pushQ({
        num: header.num,
        content: (mc.content || restBody).trim(),
        point: header.point,
        difficult: header.difficult,
        type: header.type,
        explanation: mc.answerText || null,
      })
    }
  }
  if (usedStd && questions.length > 0) return questions

  // ── Strategy B: "Câu N:" / "Câu hỏi N:" with optional MC options ──
  const colonParts = text.split(/\n(?=\s*Câu(?:\s*hỏi)?\s*\d+\s*[:.])/i)
  for (const part of colonParts) {
    const m = part.match(/^\s*Câu(?:\s*hỏi)?\s*(\d+)\s*[:.]\s*([\s\S]*)/i)
    if (!m) continue
    const num = Number(m[1])
    const body = m[2].trim()
    const mc = extractMcOptions(body)
    if (mc.isMc) {
      pushQ({
        num,
        content: mc.content,
        type: "SINGLE_CHOICE",
        explanation: mc.answerText || null,
        options: mc.options,
        point: pointHint ?? 1,
      })
    } else if (body.length > 10) {
      // essay-ish under Câu N:
      let content = body
      let point = pointHint ?? 1
      const pointMatch = content.match(/\((\d+[.,]?\d*)\s*(?:điểm|đ)\)\s*$/i)
      if (pointMatch) {
        point = Number.parseFloat(pointMatch[1].replace(",", "."))
        content = content.slice(0, pointMatch.index).trim()
      }
      pushQ({ num, content, type: "ESSAY", point })
    }
  }
  if (questions.length > 0) return questions

  // ── Strategy C: essay "Câu N\n...Câu hỏi:...\nX đ" (allow leading spaces) ──
  const essayParts = text.split(/\n(?=\s*Câu\s+\d+\s*\n)/)
  for (const part of essayParts) {
    const m = part.match(/^\s*Câu\s+(\d+)\s*\n([\s\S]*)/)
    if (!m) continue
    const num = Number(m[1])
    const body = m[2]
    const idx = body.search(/Câu hỏi:\s*/i)
    if (idx < 0) {
      // maybe MC without "Câu hỏi:"
      const mc = extractMcOptions(body)
      if (mc.isMc) {
        pushQ({
          num,
          content: mc.content,
          type: "SINGLE_CHOICE",
          options: mc.options,
          explanation: mc.answerText || null,
        })
      }
      continue
    }

    const after = body.slice(idx).replace(/^Câu hỏi:\s*/i, "")
    const mc = extractMcOptions(after)
    if (mc.isMc) {
      pushQ({
        num,
        content: mc.content,
        type: "SINGLE_CHOICE",
        options: mc.options,
        explanation: mc.answerText || null,
      })
      continue
    }

    const lines = after.split("\n")
    const contentLines = []
    let point = null
    let explanation = null
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*[\d.,]+\s*đ\s*$/i.test(lines[i])) {
        point = Number.parseFloat(lines[i].replace(/đ/gi, "").replace(",", ".").trim())
        explanation =
          lines
            .slice(i + 1)
            .filter(
              (l) =>
                l.trim().length &&
                !/^PAGE\s+\d+/i.test(l.trim()) &&
                !/^NHÓM CÂU HỎI/i.test(l.trim())
            )
            .join("\n")
            .trim() || null
        break
      }
      contentLines.push(lines[i])
    }
    pushQ({
      num,
      content: contentLines.join("\n").trim(),
      point: point ?? 1,
      explanation,
      type: "ESSAY",
    })
  }
  if (questions.length > 0) return questions

  // ── Strategy D: paragraph fallback ──
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20)
  let num = 0
  for (const p of paragraphs) {
    num++
    const mc = extractMcOptions(p)
    if (mc.isMc) {
      pushQ({
        num,
        content: mc.content,
        type: "SINGLE_CHOICE",
        options: mc.options,
      })
    } else {
      pushQ({ num, content: p, type: "ESSAY" })
    }
  }

  return questions
}

async function mapPool(items, concurrency, worker) {
  const results = new Array(items.length)
  let next = 0
  async function run() {
    while (true) {
      const i = next++
      if (i >= items.length) return
      results[i] = await worker(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length || 1) }, () => run()))
  return results
}

async function upsertQuestion(q) {
  const data = {
    content: sanitizeText(q.content),
    type: q.type,
    point: q.point,
    explanation: q.explanation ? sanitizeText(q.explanation) : null,
    difficult: q.difficult,
    isAutoGraded: !!q.isAutoGraded,
    questionBankId: q.questionBankId,
    active: true,
    deletedAt: null,
  }

  const row = await prisma.question.upsert({
    where: { code: q.code },
    create: { ...data, code: q.code },
    update: data,
    select: { id: true },
  })

  // Sync MC options (replace set)
  if (q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE") {
    await prisma.multipleChoiceOption.deleteMany({
      where: { questionId: row.id },
    })
    if (q.options?.length) {
      await prisma.multipleChoiceOption.createMany({
        data: q.options.map((o, idx) => ({
          questionId: row.id,
          content: sanitizeText(`${o.label}. ${o.content}`),
          isCorrect: !!o.isCorrect,
          order: idx + 1,
          active: true,
        })),
      })
    }
  } else {
    // Was wrongly MC before? clear leftover options
    await prisma.multipleChoiceOption.deleteMany({
      where: { questionId: row.id },
    })
  }
}

async function upsertQuestionsBatched(questions) {
  let ok = 0
  let failed = 0
  let mc = 0
  for (let i = 0; i < questions.length; i += UPSERT_BATCH) {
    const chunk = questions.slice(i, i + UPSERT_BATCH)
    const settled = await Promise.allSettled(chunk.map((q) => upsertQuestion(q)))
    for (let j = 0; j < settled.length; j++) {
      const r = settled[j]
      if (r.status === "fulfilled") {
        ok++
        if (chunk[j].type === "SINGLE_CHOICE" || chunk[j].type === "MULTIPLE_CHOICE") mc++
      } else {
        failed++
        const msg = String(r.reason?.message || r.reason).split("\n")[0]
        console.warn(`    upsert fail ${chunk[j].code}: ${msg}`)
      }
    }
  }
  return { ok, failed, mc }
}

async function processEntry(entry, index, total) {
  const pct = `[${index + 1}/${total}]`
  try {
    let text
    try {
      text = docToText(entry.filePath)
    } catch (e) {
      console.log(`${pct} SKIP (convert failed): ${entry.relativePath} — ${e.message}`)
      return { status: "failed", questions: 0, error: e.message, file: entry.relativePath }
    }

    if (!text || text.trim().length < 10) {
      console.log(`${pct} SKIP (empty): ${entry.relativePath}`)
      return { status: "skipped", questions: 0, file: entry.relativePath }
    }

    let questions = parseQuestions(text, entry.bankName, entry.questionBankId)
    if (questions.length === 0) {
      console.log(`${pct} SKIP (0 questions parsed): ${entry.relativePath}`)
      return { status: "skipped", questions: 0, file: entry.relativePath }
    }
    if (questions.length > MAX_QUESTIONS_PER_FILE) {
      console.log(
        `${pct} WARN: capping ${questions.length} -> ${MAX_QUESTIONS_PER_FILE}: ${entry.relativePath}`
      )
      questions = questions.slice(0, MAX_QUESTIONS_PER_FILE)
    }

    const mcCount = questions.filter(
      (q) => q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE"
    ).length

    if (dryRun) {
      console.log(`${pct} ${entry.relativePath} -> ${questions.length} q (mc=${mcCount}) [dry-run]`)
      return {
        status: "success",
        questions: questions.length,
        mc: mcCount,
        file: entry.relativePath,
      }
    }

    const { ok, failed, mc } = await upsertQuestionsBatched(questions)
    const suffix = failed ? ` (failed ${failed})` : ""
    console.log(
      `${pct} ${entry.relativePath} -> ${ok}/${questions.length} upserted (mc=${mc})${suffix}`
    )
    return {
      status: failed && ok === 0 ? "failed" : "success",
      questions: ok,
      mc,
      failed,
      file: entry.relativePath,
      error: failed ? `${failed} question upserts failed` : undefined,
    }
  } catch (e) {
    console.error(`${pct} ERROR: ${entry.relativePath} — ${e.message}`)
    return { status: "failed", questions: 0, error: e.message, file: entry.relativePath }
  }
}

async function main() {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"))
  let entries = catalog.matched.filter((e) => e.questionBankId)

  if (errorsOnly) {
    const errPath = join(import.meta.dir || ".", "import-errors.json")
    if (!existsSync(errPath)) {
      console.error(`Missing ${errPath}`)
      process.exit(1)
    }
    const failedPaths = new Set(JSON.parse(readFileSync(errPath, "utf8")).map((e) => e.file))
    entries = entries.filter((e) => failedPaths.has(e.relativePath))
    console.log(`--errors-only: ${entries.length} files from import-errors.json`)
  }

  if (offset > 0) entries = entries.slice(offset)
  if (Number.isFinite(limit)) entries = entries.slice(0, limit)

  console.log(
    `Processing ${entries.length} files (offset=${offset}) via=${viaWord ? "Word" : "textutil"} | fileConcurrency=${FILE_CONCURRENCY} upsertBatch=${UPSERT_BATCH} connection_limit=${CONNECTION_LIMIT}`
  )

  const started = Date.now()
  const outcomes = await mapPool(entries, FILE_CONCURRENCY, (entry, i) =>
    processEntry(entry, i, entries.length)
  )

  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    totalQuestions: 0,
    totalMc: 0,
    errors: [],
  }
  for (const o of outcomes) {
    if (!o) continue
    if (o.status === "success") results.success++
    else if (o.status === "skipped") results.skipped++
    else {
      results.failed++
      if (o.error) results.errors.push({ file: o.file, error: o.error })
    }
    results.totalQuestions += o.questions || 0
    results.totalMc += o.mc || 0
  }

  const secs = ((Date.now() - started) / 1000).toFixed(1)
  console.log("\n=== Import Results ===")
  console.log(`Success:    ${results.success}`)
  console.log(`Failed:     ${results.failed}`)
  console.log(`Skipped:    ${results.skipped}`)
  console.log(`Questions:  ${results.totalQuestions}`)
  console.log(`MC (TN):    ${results.totalMc}`)
  console.log(`Duration:   ${secs}s`)

  if (results.errors.length > 0) {
    const errPath = join(
      import.meta.dir || ".",
      errorsOnly ? "import-errors-word.json" : "import-errors.json"
    )
    writeFileSync(errPath, JSON.stringify(results.errors, null, 2), "utf8")
    console.log(`Errors saved to ${errPath}`)
  } else if (errorsOnly) {
    // clear residual word-error file on full success
    const errPath = join(import.meta.dir || ".", "import-errors-word.json")
    writeFileSync(errPath, "[]", "utf8")
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
