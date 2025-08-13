-- @param {Int} $1:semesterYear
-- @param {Int} $2:semesterType
-- @param {String} $3:trainingCourseId?
-- @param {String} $4:search?
-- @param {String} $5:trainingMajorId?
-- @param {Int} $6:page
-- @param {Int} $7:pageSize
with FCS as (select "ql-dao-tao"."SubjectVersion".id     as subject_version_id,
                    "ql-dao-tao"."SubjectVersion".code   as subject_version_code,
                    "ql-dao-tao"."SubjectVersion".credit as subject_version_credit,
                    CV.id                                as curriculum_version_id,
                    CV.name                              as curriculum_version_name,
                    "ql-dao-tao"."SubjectVersion".name   as subject_version_name,
                    TBS.semester                         as training_block_subject_semester,
                    (($1 - FC."startYear") * 2 + $2)    as fixed_class_semester,
                    SC.id                                as subject_class_id,
                    SC.code                              as subject_class_code,
                    SC.name                              as subject_class_name,
                    FC."startYear"                       as fixed_class_start_year,
                    FC.id                                as fixed_class_id,
                    FC.name                              as fixed_class_name,
                    FC.code                              as fixed_class_code,
                    FC.active                            as active,
                    FC.graduated                         as graduated,
                    FC."trainingCourseId"                as training_course_id,
                    C."trainingMajorId"                  as training_major_id,
                    C."managementOrganizationId"         as management_organization_id,
                    count(FC.id)                         as fixed_class_count
             from "ql-dao-tao"."SubjectVersion"
                      join "ql-dao-tao"."TrainingBlockSubject" TBS
                           on "ql-dao-tao"."SubjectVersion".id = TBS."subjectId"
                      join "ql-dao-tao"."TrainingBlockOnCurriculumVersion" TBOCV
                           on TBS."trainingBlockOnCurriculumVersionId" = TBOCV.id
                      join "ql-dao-tao"."CurriculumVersion" CV on TBOCV."curriculumVersionId" = CV.id
                      join "ql-dao-tao"."Curriculum" C on CV."curriculumId" = C.id
                      join "ql-dao-tao"."FixedClass" FC on CV.id = FC."curriculumVersionId"
                      join "ql-dao-tao"."Student" S on FC.id = S."fixedClassId"
                      left join "ql-dao-tao"."SubjectClass" SC on "SubjectVersion".id = SC."subjectId"
             where FC.active = true
               and TBS."deletedAt" is null
               and TBOCV."deletedAt" is null
               and CV."deletedAt" is null
               and FC."deletedAt" is null
               and SC."deletedAt" is null
             group by CV.id, CV.name, FC.id, FC."startYear",
                      FC."name", "ql-dao-tao"."SubjectVersion".id, "ql-dao-tao"."SubjectVersion".code,
                      "ql-dao-tao"."SubjectVersion".credit,
                      "ql-dao-tao"."SubjectVersion".name, TBS.semester, training_course_id, training_major_id,SC.id)
select json_build_object('subjectVersionCode', subject_version_code,'trainingMajorId', training_major_id, 'trainingCourseId', training_course_id, 'managementOrganizationId', management_organization_id, 'subjectVersionId', subject_version_id, 'subjectVersionName', subject_version_name,
                         'subjectVersionCredit', subject_version_credit,
                           'subjectClass', json_agg(
                                 json_build_object(
                                         'subjectClassId', subject_class_id,
                                         'subjectClassCode', subject_class_code,
                                         'subjectClassName', subject_class_name
                                 )
                                         ),
                         'curriculumVersion', json_agg(
                                 json_build_object(
                                         'curriculumVersionId', curriculum_version_id,
                                         'curriculumVersionName', curriculum_version_name
                                 )
                                              ),
                         'fixedClass', json_agg(
                                 json_build_object(
                                         'fixedClassId', fixed_class_id, 'fixedClassName', fixed_class_name,'fixedClassCount', fixed_class_count,'fixedClassSemester', fixed_class_semester
                                 )
                                       )
       ) as data
from FCS
where training_block_subject_semester = fixed_class_semester and active = true and graduated = false and
(($3::TEXT IS NULL AND 1=1 OR training_course_id = $3) or
($4::TEXT IS NULL AND 1=1 OR subject_version_name ilike $4) or
($4::TEXT IS NULL AND 1=1 OR subject_version_code ilike $4) or
($4::TEXT IS NULL AND 1=1 OR fixed_class_name ilike $4) or
($4::TEXT IS NULL AND 1=1 OR fixed_class_code ilike $4) or
($5::TEXT IS NULL AND 1=1 OR training_major_id = $5))
group by subject_version_id, subject_version_code,
         subject_version_credit, subject_version_name, training_major_id, training_course_id
         limit $7 offset ($6 - 1) * $7