import { PrismaClient } from "../generated/prisma-client/index.js"
const p = new PrismaClient()

const banks = await p.$queryRawUnsafe(`
SELECT qb.id, qb.name, qb.code, qb."subjectVersionId",
  sv.code AS sv_code, sv.name AS sv_name, sv."trainingObjectTypeId",
  s.code AS subject_code, s.name AS subject_name,
  (SELECT COUNT(*)::int FROM "khao-thi"."Question" q WHERE q."questionBankId" = qb.id AND q."deletedAt" IS NULL) AS q_count
FROM "khao-thi"."QuestionBank" qb
JOIN "ql-dao-tao"."SubjectVersion" sv ON sv.id = qb."subjectVersionId"
JOIN "ql-dao-tao"."Subject" s ON s.id = sv."subjectId"
WHERE qb."deletedAt" IS NULL
  AND (
    qb.name ILIKE '%73AN-3D_1%'
    OR qb.name ILIKE '%73AN%'
    OR s.code ILIKE '%1243915%'
    OR s.name ILIKE '%Truyền dữ liệu%'
    OR sv.code ILIKE '%1243915%'
  )
ORDER BY qb.name
`)
console.log(JSON.stringify(banks, null, 2))
await p.$disconnect()
