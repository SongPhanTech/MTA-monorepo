/**
 * Import essay questions from converted NHCH .doc/.txt into QuestionBank.
 *
 * Usage:
 *   DATABASE_URL=... bun scripts/import-essay-nhch.mjs [--dry-run] [--replace]
 */
import { readFileSync } from "node:fs"
import { PrismaClient } from "../generated/prisma-client/index.js"

const BANK_ID = "cms5jz1sf0001sh3196x8vxp4"
const TXT = process.env.TXT_PATH || "/tmp/73AN-3D_1.txt"

const dryRun = process.argv.includes("--dry-run")
const replace = process.argv.includes("--replace")

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL required")
  process.exit(1)
}

// Limit pool — mta_in often hits max clients
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: url.includes("?") ? `${url}&connection_limit=1` : `${url}?connection_limit=1`,
    },
  },
})

function parseEssayDoc(text) {
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  // Drop trailing notes
  text = text.replace(/\nGhi chú:[\s\S]*$/i, "")

  const parts = text.split(/\n(?=Câu\s+\d+\s*\n)/)
  const questions = []

  for (const part of parts) {
    const m = part.match(/^Câu\s+(\d+)\s*\n([\s\S]*)/)
    if (!m) continue
    const num = Number(m[1])
    const body = m[2]
    const idx = body.search(/Câu hỏi:\s*/i)
    if (idx < 0) {
      console.warn(`Skip Câu ${num}: missing "Câu hỏi:"`)
      continue
    }
    const after = body.slice(idx).replace(/^Câu hỏi:\s*/i, "")
    const lines = after.split("\n")
    const contentLines = []
    let point = null
    let i = 0
    for (; i < lines.length; i++) {
      if (/^\s*[\d.,]+\s*đ\s*$/i.test(lines[i])) {
        point = Number.parseFloat(lines[i].replace(/đ/gi, "").replace(",", ".").trim())
        break
      }
      contentLines.push(lines[i])
    }
    if (point == null || Number.isNaN(point)) {
      console.warn(`Skip Câu ${num}: missing total point`)
      continue
    }
    const content = contentLines.join("\n").trim()
    const rubricLines = lines.slice(i + 1).filter((l) => l.trim().length)
    // Drop page footers
    const cleanedRubric = rubricLines.filter(
      (l) => !/^PAGE\s+\d+/i.test(l.trim()) && !/^NHÓM CÂU HỎI/i.test(l.trim())
    )
    const explanation = cleanedRubric.join("\n").trim() || null

    questions.push({
      num,
      content: content.startsWith("<") ? content : content, // plain text OK
      point,
      explanation,
      type: "ESSAY",
      difficult: "D3", // filename 73AN-3D_1
      isAutoGraded: false,
      questionBankId: BANK_ID,
      active: true,
    })
  }

  return questions
}

async function main() {
  const text = readFileSync(TXT, "utf8")
  const parsed = parseEssayDoc(text)
  console.log(`Parsed ${parsed.length} questions from ${TXT}`)
  console.log(
    "Nums:",
    parsed.map((q) => q.num).join(", "),
    "| points:",
    [...new Set(parsed.map((q) => q.point))].join(", ")
  )

  if (dryRun) {
    console.log("DRY RUN sample[0]:", JSON.stringify(parsed[0], null, 2))
    return
  }

  const bank = await prisma.questionBank.findUnique({
    where: { id: BANK_ID },
    select: { id: true, name: true, subjectVersionId: true },
  })
  if (!bank) {
    throw new Error(`QuestionBank ${BANK_ID} not found`)
  }
  console.log("Bank:", bank)

  if (replace) {
    const soft = await prisma.question.updateMany({
      where: { questionBankId: BANK_ID, deletedAt: null },
      data: { deletedAt: new Date() },
    })
    console.log(`Soft-deleted existing: ${soft.count}`)
  }

  // Insert one-by-one to get cuid defaults reliably
  let ok = 0
  for (const q of parsed) {
    await prisma.question.create({
      data: {
        content: q.content,
        type: q.type,
        point: q.point,
        explanation: q.explanation,
        difficult: q.difficult,
        isAutoGraded: q.isAutoGraded,
        questionBankId: q.questionBankId,
        active: true,
        code: `73AN-3D_1-C${String(q.num).padStart(3, "0")}`,
      },
    })
    ok++
  }
  console.log(`Imported ${ok} questions into bank ${bank.name}`)

  const count = await prisma.question.count({
    where: { questionBankId: BANK_ID, deletedAt: null },
  })
  console.log(`Bank now has ${count} active questions`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
