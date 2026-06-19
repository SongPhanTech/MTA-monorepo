-- @param {String} $1:questionBankId
-- @param {String} $2:questionType
-- @param {Float} $3:point
-- @param {String} $4:knowledgeBlockId?
-- @param {Int} $5:limit
SELECT "khao-thi"."Question"."id"
FROM "khao-thi"."Question"
where "khao-thi"."Question"."questionBankId" = $1
and "khao-thi"."Question"."type" = $2::"khao-thi"."QuestionType"
and "khao-thi"."Question"."point" = $3
and ($4::TEXT IS NULL AND "khao-thi"."Question"."knowledgeBlockId" IS NOT NULL OR "Question"."knowledgeBlockId" = $4)
and "khao-thi"."Question"."deletedAt" IS NULL
and "khao-thi"."Question"."parentQuestionId" IS NULL
ORDER BY RANDOM()
LIMIT $5