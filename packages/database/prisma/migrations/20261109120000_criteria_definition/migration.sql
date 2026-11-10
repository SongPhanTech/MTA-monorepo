-- Danh mục tiêu chí đánh giá (CriteriaDefinition) cho quy tắc hạ bậc tốt nghiệp.
-- Chuyển GraduationRankDowngradeCondition.field (enum) sang criteriaId (FK tới danh mục).
-- Cột "field" được giữ lại (nullable) để đối chiếu; sẽ xoá ở migration sau khi xác nhận dữ liệu.
-- Chạy trong 1 transaction: lỗi ở bước nào thì không có thay đổi nào được ghi.

BEGIN;

-- 1. Enum nguồn tiêu chí
CREATE TYPE "ql-dao-tao"."CriteriaSource" AS ENUM ('SYSTEM', 'CUSTOM');

-- 2. Bảng danh mục
CREATE TABLE "ql-dao-tao"."CriteriaDefinition" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "dNgayTao" TIMESTAMP(6),
    "dNgaySua" TIMESTAMP(6),
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,
    "name" TEXT NOT NULL,
    "source" "ql-dao-tao"."CriteriaSource" NOT NULL,
    "systemField" "ql-dao-tao"."CriteriaField",
    "calcType" TEXT,
    "params" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "CriteriaDefinition_pkey" PRIMARY KEY ("id"),
    -- SYSTEM: chỉ có systemField; CUSTOM: chỉ có calcType
    CONSTRAINT "CriteriaDefinition_source_chk" CHECK (
        ("source" = 'SYSTEM' AND "systemField" IS NOT NULL AND "calcType" IS NULL)
        OR ("source" = 'CUSTOM' AND "systemField" IS NULL AND "calcType" IS NOT NULL)
    )
);

CREATE UNIQUE INDEX "CriteriaDefinition_code_key" ON "ql-dao-tao"."CriteriaDefinition"("code");
CREATE UNIQUE INDEX "CriteriaDefinition_systemField_key" ON "ql-dao-tao"."CriteriaDefinition"("systemField");

-- 3. Phạm vi môn của tiêu chí CUSTOM (quan hệ n-n ngầm định của Prisma: A = CriteriaDefinition)
CREATE TABLE "ql-dao-tao"."_CriteriaDefinitionToTrainingBlock" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CriteriaDefinitionToTrainingBlock_AB_pkey" PRIMARY KEY ("A", "B")
);
CREATE INDEX "_CriteriaDefinitionToTrainingBlock_B_index" ON "ql-dao-tao"."_CriteriaDefinitionToTrainingBlock"("B");
ALTER TABLE "ql-dao-tao"."_CriteriaDefinitionToTrainingBlock" ADD CONSTRAINT "_CriteriaDefinitionToTrainingBlock_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."CriteriaDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ql-dao-tao"."_CriteriaDefinitionToTrainingBlock" ADD CONSTRAINT "_CriteriaDefinitionToTrainingBlock_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."TrainingBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ql-dao-tao"."_CriteriaDefinitionToSubject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CriteriaDefinitionToSubject_AB_pkey" PRIMARY KEY ("A", "B")
);
CREATE INDEX "_CriteriaDefinitionToSubject_B_index" ON "ql-dao-tao"."_CriteriaDefinitionToSubject"("B");
ALTER TABLE "ql-dao-tao"."_CriteriaDefinitionToSubject" ADD CONSTRAINT "_CriteriaDefinitionToSubject_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."CriteriaDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ql-dao-tao"."_CriteriaDefinitionToSubject" ADD CONSTRAINT "_CriteriaDefinitionToSubject_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Tạo sẵn 27 tiêu chí hệ thống (id cố định để các môi trường giống nhau). Tên lấy từ criteriaFieldLabels.
INSERT INTO "ql-dao-tao"."CriteriaDefinition" ("id", "code", "name", "source", "systemField")
SELECT 'crit_sys_' || lower(v.field), v.field, v.name, 'SYSTEM', v.field::"ql-dao-tao"."CriteriaField"
FROM (VALUES
    ('SEMESTER_GPA', 'Điểm trung bình học kỳ'),
    ('YEARLY_GPA', 'Điểm trung bình năm học'),
    ('CUMULATIVE_GPA', 'Điểm trung bình tích lũy'),
    ('ENTRY_SCORE', 'Điểm thi đầu vào (xét cho tân sinh viên)'),
    ('COURSE_GRADE_LOWEST', 'Điểm học phần thấp nhất'),
    ('GRADUATION_COURSE_GRADE_LOWEST', 'Điểm học phần tốt nghiệp thấp nhất'),
    ('SEMESTER_REGISTERED_CREDITS', 'Tín chỉ đã đăng ký trong học kỳ'),
    ('SEMESTER_PASSED_CREDITS', 'Tín chỉ đã đạt trong học kỳ'),
    ('SEMESTER_FAILED_CREDITS', 'Tín chỉ không đạt trong học kỳ'),
    ('YEAR_FAILED_CREDITS', 'Tín chỉ không đạt trong năm học'),
    ('FAILED_CREDITS_PERCENT', 'Tỷ lệ % tín chỉ không đạt trong kỳ'),
    ('CUMULATIVE_PASSED_CREDITS', 'Tín chỉ tích lũy'),
    ('CUMULATIVE_DEBT_CREDITS', 'Tín chỉ còn nợ tích lũy'),
    ('CUMULATIVE_PROGRESS_PERCENT', 'Tỷ lệ % tiến độ tích lũy'),
    ('CUMULATIVE_RETAKE_PERCENT', 'Tỷ lệ % tín chỉ học lại, thi lại'),
    ('ACADEMIC_WARNING_LEVEL', 'Mức cảnh báo học tập'),
    ('DISCIPLINARY_WARNING_LEVEL', 'Mức cảnh cáo học đường'),
    ('REPEAT_YEAR_COUNT', 'Số lần lưu ban'),
    ('SUSPENSION_COUNT', 'Số lần bị đình chỉ'),
    ('CONDUCT_SCORE', 'Điểm rèn luyện (0-10)'),
    ('HAS_PASSED_FOREIGN_LANGUAGE', 'Đã đạt chuẩn ngoại ngữ'),
    ('HAS_REGISTERED_FOR_SEMESTER', 'Đã đăng ký học kỳ hiện tại'),
    ('IS_PRIORITY_STUDENT', 'Đối tượng ưu tiên'),
    ('IS_CLASS_MONITOR_OR_LEADER', 'Cán bộ lớp/đoàn'),
    ('IS_STUDY_DURATION_EXCEEDED', 'Vượt quá thời gian đào tạo'),
    ('IS_DEBT_SUBJECT_CONSECUTIVE', 'Nợ môn 2 kỳ liên tiếp'),
    ('HAS_IMPROVEMENT_REGISTRATION', 'Đăng ký học cải thiện')
) AS v(field, name);

-- 5. Chuyển GraduationRankDowngradeCondition sang criteriaId
ALTER TABLE "ql-dao-tao"."GraduationRankDowngradeCondition" ADD COLUMN "criteriaId" TEXT;

UPDATE "ql-dao-tao"."GraduationRankDowngradeCondition" c
SET "criteriaId" = d."id"
FROM "ql-dao-tao"."CriteriaDefinition" d
WHERE d."systemField" = c."field";

-- Mọi dòng đều phải được gán (field đang NOT NULL và danh mục đủ 27 giá trị enum);
-- nếu còn sót thì SET NOT NULL dưới đây sẽ lỗi và cả transaction bị huỷ.
ALTER TABLE "ql-dao-tao"."GraduationRankDowngradeCondition" ALTER COLUMN "criteriaId" SET NOT NULL;
ALTER TABLE "ql-dao-tao"."GraduationRankDowngradeCondition" ALTER COLUMN "field" DROP NOT NULL;

CREATE INDEX "GraduationRankDowngradeCondition_criteriaId_idx" ON "ql-dao-tao"."GraduationRankDowngradeCondition"("criteriaId");
-- RESTRICT: không xoá cứng được tiêu chí đang được dùng trong quy tắc (dùng xoá mềm deletedAt)
ALTER TABLE "ql-dao-tao"."GraduationRankDowngradeCondition" ADD CONSTRAINT "GraduationRankDowngradeCondition_criteriaId_fkey" FOREIGN KEY ("criteriaId") REFERENCES "ql-dao-tao"."CriteriaDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
