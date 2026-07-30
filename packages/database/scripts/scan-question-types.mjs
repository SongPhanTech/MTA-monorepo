/**
 * Scan import docs for advanced question-type markers used by import-word-modal.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { execSync } from "node:child_process"
import { join } from "node:path"

const cat = JSON.parse(
  readFileSync(join(import.meta.dir, "import-catalog.json"), "utf8")
)
const entries = cat.matched.filter((e) => e.filePath)

const patterns = {
  header_TN: /Câu\s*\d+\s*:\s*\(\s*TN\s*-/i,
  header_TNN: /Câu\s*\d+\s*:\s*\(\s*TNN\s*-/i,
  header_DK: /Câu\s*\d+\s*:\s*\(\s*DK\s*-/i,
  header_SX: /Câu\s*\d+\s*:\s*\(\s*SX\s*-/i,
  header_CH: /Câu\s*\d+\s*:\s*\(\s*CH\s*-/i,
  header_TL: /Câu\s*\d+\s*:\s*\(\s*TL\s*-/i,
  dapAnStar: /\*\s*Đáp\s*án\s*:/i,
  fillBlankPlaceholder: /\{\$\d+\}|điền vào chỗ trống/i,
  orderingArrow: /[A-D]\s*(?:→|->)\s*[A-D]/i,
  subQuestion_a: /^a\)\s*\(/im,
  subQuestion_ab: /^a\)\s+.+\nb\)\s+/ims,
  clusterHint: /câu hỏi chùm|đề bài chung/i,
}

const counts = Object.fromEntries(Object.keys(patterns).map((k) => [k, 0]))
const samples = Object.fromEntries(Object.keys(patterns).map((k) => [k, []]))

const TMP = "/tmp/nhch-type-scan"
if (!existsSync(TMP)) mkdirSync(TMP, { recursive: true })

const preferred = entries.filter((e) =>
  /\bTNN\b|\bTN\b|trắc|trac|điền|dien|sắp xếp|sap xep|chùm|chum|\bDK\b|\bSX\b|\(TN|\(TNN|\(DK|\(SX|\(CH|\(TL/i.test(
    `${e.relativePath} ${e.bankName}`
  )
)
const rest = entries.filter((e) => !preferred.includes(e))
const step = Math.max(1, Math.floor(rest.length / 350))
const sample = [
  ...preferred.slice(0, 250),
  ...rest.filter((_, i) => i % step === 0).slice(0, 350),
]

console.log(
  `Scanning ${sample.length} files (preferred=${Math.min(250, preferred.length)}) of ${entries.length}`
)

let scanned = 0
let failed = 0
for (const e of sample) {
  const out = join(TMP, `${scanned}.txt`)
  try {
    execSync(`textutil -convert txt -output "${out}" "${e.filePath}"`, {
      timeout: 20000,
      stdio: "pipe",
    })
    const text = readFileSync(out, "utf8").replace(/\u0000/g, "")
    scanned++
    for (const [name, re] of Object.entries(patterns)) {
      if (re.test(text)) {
        counts[name]++
        if (samples[name].length < 8) samples[name].push(e.relativePath)
      }
    }
  } catch {
    failed++
  }
  if (scanned % 80 === 0) console.log(`... scanned ${scanned}`)
}

const result = { scanned, failed, preferredTotal: preferred.length, counts, samples }
console.log(JSON.stringify(result, null, 2))
writeFileSync("/tmp/nhch-type-scan-result.json", JSON.stringify(result, null, 2))
