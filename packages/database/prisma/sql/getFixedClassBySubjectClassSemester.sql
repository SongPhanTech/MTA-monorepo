-- @param {Int} $1:semesterYear
-- @param {Int} $2:semesterType
-- @param {String} $3:subjectClassId
-- @param {String} $4:trainingObjectTypeId
-- @param {String} $5:search?
-- @param {Int} $6:page
-- @param {Int} $7:pageSize
 with FCS as (select SC.id                             as subject_class_id,
                    FC.id                             as fixed_class_id,
                    FC.name                           as fixed_class_name,
                    FC.code                           as fixed_class_code,
                    FC.active                         as active,
                    FC.graduated                      as graduated,
                    TBS.semester                      as training_block_subject_semester,
                    tc."trainingObjectTypeId" as training_object_type_id,
                    (($1 - FC."startYear") * 2 + $2)    as fixed_class_semester
             from "ql-dao-tao"."SubjectVersion"
                      join "ql-dao-tao"."TrainingBlockSubject" TBS
                           on "ql-dao-tao"."SubjectVersion".id = TBS."subjectId"
                      join "ql-dao-tao"."TrainingBlockOnCurriculumVersion" TBOCV
                           on TBS."trainingBlockOnCurriculumVersionId" = TBOCV.id
                      join "ql-dao-tao"."CurriculumVersion" CV on TBOCV."curriculumVersionId" = CV.id
                      join "ql-dao-tao"."Curriculum" C on CV."curriculumId" = C.id
                      join "ql-dao-tao"."FixedClass" FC on CV.id = FC."curriculumVersionId"
                      JOIN "ql-dao-tao"."TrainingCourse" tc ON fc."trainingCourseId" = tc."id"
                      left join "ql-dao-tao"."SubjectClass" SC on "SubjectVersion".id = SC."subjectId" and SC."deletedAt" is null
             where FC.active = true 
               and TBS."deletedAt" is null
               and TBOCV."deletedAt" is null
               and CV."deletedAt" is null
               and FC."deletedAt" is null
             group by CV.id, CV.name, FC.id, FC."startYear", SC.id,
                      FC."name", "ql-dao-tao"."SubjectVersion".id, 
                      "ql-dao-tao"."SubjectVersion".code,
                      tc."trainingObjectTypeId",
                      "ql-dao-tao"."SubjectVersion".credit,
                      "ql-dao-tao"."SubjectVersion".name,
                       TBS.semester)
select count(*) OVER() AS full_count, fixed_class_id as "fixedClassId" from FCS
where ($2 <=0 OR training_block_subject_semester = fixed_class_semester) AND training_object_type_id = $4 and subject_class_id = $3 and active = true and graduated = false and
(($5::TEXT IS NULL AND 1=1 OR fixed_class_name ilike $5) or
($5::TEXT IS NULL AND 1=1 OR fixed_class_code ilike $5))
group by fixed_class_id
         limit $7 offset ($6 - 1) * $7