/*
  Warnings:

  - A unique constraint covering the columns `[name,trainingCourseId,curriculumVersionId]` on the table `FixedClass` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FixedClass_name_trainingCourseId_curriculumVersionId_key" ON "ql-dao-tao"."FixedClass"("name", "trainingCourseId", "curriculumVersionId");
