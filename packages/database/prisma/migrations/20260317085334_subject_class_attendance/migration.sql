-- CreateTable
CREATE TABLE "ql-dao-tao"."SubjectClassAttendance" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "time" TIMESTAMP(3) NOT NULL,
    "subjectClassId" TEXT NOT NULL,
    "profileId" UUID,

    CONSTRAINT "SubjectClassAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."SubjectClassAttendanceStudent" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "subjectClassAttendanceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "attendanceStatus" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SubjectClassAttendanceStudent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubjectClassAttendance_code_key" ON "ql-dao-tao"."SubjectClassAttendance"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectClassAttendanceStudent_code_key" ON "ql-dao-tao"."SubjectClassAttendanceStudent"("code");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClassAttendance" ADD CONSTRAINT "SubjectClassAttendance_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClassAttendance" ADD CONSTRAINT "SubjectClassAttendance_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClassAttendanceStudent" ADD CONSTRAINT "SubjectClassAttendanceStudent_subjectClassAttendanceId_fkey" FOREIGN KEY ("subjectClassAttendanceId") REFERENCES "ql-dao-tao"."SubjectClassAttendance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClassAttendanceStudent" ADD CONSTRAINT "SubjectClassAttendanceStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
