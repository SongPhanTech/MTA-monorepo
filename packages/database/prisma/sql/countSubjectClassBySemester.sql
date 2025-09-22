-- @param {Int} $1:semesterYear
-- @param {Int} $2:semesterType
-- @param {String} $3:trainingCourseId?
-- @param {String} $4:search?
-- @param {String} $5:trainingMajorId?

WITH FCS AS (
    SELECT
        sv.id as subject_version_id,
        sv.code as subject_version_code,
        sv.credit as subject_version_credit,
        cv.id as curriculum_version_id,
        cv.name as curriculum_version_name,
        sv.name as subject_version_name,
        tbs.semester as training_block_subject_semester,
        (($1 - fc."startYear") * 2 + $2) as fixed_class_semester,
        sc.id as subject_class_id,
        sc.code as subject_class_code,
        sc.name as subject_class_name,
        fc."startYear" as fixed_class_start_year,
        fc.id as fixed_class_id,
        fc.name as fixed_class_name,
        fc.code as fixed_class_code,
        fc.active as active,
        fc.graduated as graduated,
        fc."trainingCourseId" as training_course_id,
        c."trainingMajorId" as training_major_id,
        c."managementOrganizationId" as management_organization_id,
        dv."sTen" as management_organization_name,
        COUNT(fc.id) as fixed_class_count
    FROM "ql-dao-tao"."SubjectVersion" sv
    JOIN "ql-dao-tao"."TrainingBlockSubject" tbs ON sv.id = tbs."subjectId"
    JOIN "ql-dao-tao"."TrainingBlockOnCurriculumVersion" tbocv ON tbs."trainingBlockOnCurriculumVersionId" = tbocv.id
    JOIN "ql-dao-tao"."CurriculumVersion" cv ON tbocv."curriculumVersionId" = cv.id
    JOIN "ql-dao-tao"."Curriculum" c ON cv."curriculumId" = c.id
    JOIN "ql-dao-tao"."FixedClass" fc ON cv.id = fc."curriculumVersionId"
    JOIN "ql-dao-tao"."Student" s ON fc.id = s."fixedClassId"
    LEFT JOIN "ql-dao-tao"."SubjectClass" sc ON sv.id = sc."subjectId" AND sc."deletedAt" IS NULL
    LEFT JOIN "mta"."DM_DonVi" dv ON c."managementOrganizationId" = dv."Id"
    WHERE fc.active = TRUE
      AND tbs."deletedAt" IS NULL
      AND tbocv."deletedAt" IS NULL
      AND cv."deletedAt" IS NULL
      AND fc."deletedAt" IS NULL
    GROUP BY
        cv.id, cv.name, fc.id, fc."startYear", fc.name, sv.id, sv.code, sv.credit, sv.name,
        tbs.semester, training_course_id, training_major_id, sc.id, c."managementOrganizationId", management_organization_name
)
SELECT COUNT(*) AS "total"
FROM (
    SELECT 1
    FROM FCS
    WHERE
        training_block_subject_semester = fixed_class_semester
        AND active = TRUE
        AND graduated = FALSE
        AND (
            ($3::TEXT IS NULL OR training_course_id = $3) AND
            ($5::TEXT IS NULL OR training_major_id = $5) AND
            ($4::TEXT IS NULL OR subject_version_name ILIKE $4 OR subject_version_code ILIKE $4 OR fixed_class_name ILIKE $4 OR fixed_class_code ILIKE $4)
        )
    GROUP BY
        subject_version_id, subject_version_code, subject_version_credit, subject_version_name,
        training_major_id, training_course_id, management_organization_id, management_organization_name
) AS result_groups;