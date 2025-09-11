/*
  Warnings:

  - A unique constraint covering the columns `[standardId,name]` on the table `CriterionCatalog` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[periodId,name]` on the table `EvaluationStandard` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[criterionCatalogId,name]` on the table `RequirementCriterionCatalog` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CriterionCatalog_standardId_name_key" ON "khao-thi"."CriterionCatalog"("standardId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationStandard_periodId_name_key" ON "khao-thi"."EvaluationStandard"("periodId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "RequirementCriterionCatalog_criterionCatalogId_name_key" ON "khao-thi"."RequirementCriterionCatalog"("criterionCatalogId", "name");
