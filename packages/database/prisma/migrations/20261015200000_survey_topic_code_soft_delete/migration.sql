-- DropIndex
DROP INDEX "khao-thi"."SurveyTopic_code_key";

-- CreateIndex
CREATE UNIQUE INDEX "SurveyTopic_code_active_key"
ON "khao-thi"."SurveyTopic"("code")
WHERE "deletedAt" IS NULL;
