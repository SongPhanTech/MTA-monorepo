-- CreateTable
CREATE TABLE "ql-dao-tao"."_FixedClassToSubjectClass" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FixedClassToSubjectClass_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FixedClassToSubjectClass_B_index" ON "ql-dao-tao"."_FixedClassToSubjectClass"("B");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_FixedClassToSubjectClass" ADD CONSTRAINT "_FixedClassToSubjectClass_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."FixedClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_FixedClassToSubjectClass" ADD CONSTRAINT "_FixedClassToSubjectClass_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
