-- @param {String} $1:questionBankId
-- @param {QuestionType} $2:knowledgeBlockId?
-- @param {Float} $3:limit
-- @param {String} $4:knowledgeBlockId?
-- @param {Int} $5:limit
SELECT "Question"."id"
FROM "Question"
where "Question"."questionBankId" = $1
and "Question"."type" = $2
and "Question"."point" = $3
($4::TEXT IS NULL AND "khao-thi"."Question"."knowledgeBlockId" IS NOT NULL OR "Question"."knowledgeBlockId" = $4)
and "khao-thi"."Question"."deletedAt" IS NULL
ORDER BY RANDOM()
LIMIT $5