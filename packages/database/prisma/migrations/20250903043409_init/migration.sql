-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "he-thong";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "khao-thi";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "mta";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ql-danh-muc";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ql-dao-tao";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ql-ho-so";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ql-nguoi-dung";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tro-ly-ao";

-- CreateEnum
CREATE TYPE "he-thong"."ConfigKey" AS ENUM ('MANAGEMENT_DEPARTMENT', 'ACADEMY_NAME', 'ACADEMY_CODE', 'DIRECTOR', 'TRAINING_DEPARTMENT', 'HEAD_OF_TRAINING_DEPARTMENT', 'EXAMINATION_DEPARTMENT', 'HEAD_OF_EXAMINATION_DEPARTMENT', 'PROVINCE', 'DISTRICT', 'WARD', 'USER_SESSION_TIMEOUT', 'ACADEMIC_ACTION_RULES');

-- CreateEnum
CREATE TYPE "khao-thi"."QuestionType" AS ENUM ('ESSAY', 'ORAL');

-- CreateEnum
CREATE TYPE "khao-thi"."ExamStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ONGOING', 'FINISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."SemesterType" AS ENUM ('FIRST', 'SECOND');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."TrainingLanguage" AS ENUM ('Vietnamese', 'English');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."ExamType" AS ENUM ('OfflineWritten', 'OnlineWritten', 'OfflineChoices', 'OnlineChoices', 'Oral', 'Practice', 'Project', 'Other');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."SubjectVersionType" AS ENUM ('Normal', 'Project');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."EquivalencySide" AS ENUM ('SOURCE', 'TARGET');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."SubjectRequirementType" AS ENUM ('None', 'Mandatory', 'Optional');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."SubjectClassSchedule" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."PeriodType" AS ENUM ('THEORY', 'PRACTICE', 'LAB', 'SEMINAR', 'EXAM', 'MAKEUP', 'REVIEW');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."TrainingObjectTypes" AS ENUM ('MILITARY', 'CIVILIAN', 'INTERNATIONAL_MILITARY');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."DiplomaTypeEnum" AS ENUM ('MASTER', 'DOCTORATE', 'ENGINEER', 'BACHELOR');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."AcademicRankingBaseType" AS ENUM ('Base10', 'Base4');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."StudentStatus" AS ENUM ('ENROLLED', 'GRADUATED', 'DEFERRED_STUDY', 'SUSPENDED_STUDY', 'WITHDRAWN', 'TRANSFERRED', 'PENDING_GRADUATION_REVIEW', 'ACADEMIC_SUSPENSION');

-- CreateEnum
CREATE TYPE "ql-danh-muc"."NotificationType" AS ENUM ('GENERAL', 'ACADEMIC', 'EXAM', 'EVENT', 'SCHOLARSHIP', 'TUITION', 'URGENT', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "ql-danh-muc"."NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ql-nguoi-dung"."UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "ql-nguoi-dung"."PermissionType" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'DETAIL');

-- CreateEnum
CREATE TYPE "tro-ly-ao"."MessageSender" AS ENUM ('USER', 'BOT');

-- CreateEnum
CREATE TYPE "tro-ly-ao"."DocumentStatus" AS ENUM ('PENDING', 'APPROVE', 'DENY');

-- CreateEnum
CREATE TYPE "tro-ly-ao"."DocumentType" AS ENUM ('GENERAL_ADMISSIONS_INFORMATION', 'ADMISSIONS_RULES_AND_REGULATIONS', 'TRAINING_RULES_AND_REGULATIONS', 'EXAMINATION_RULES_AND_REGULATIONS', 'ACADEMY_INFORMATION', 'TRAINING_PROGRAMS_INFORMATION', 'REGULATIONS_POLICIES_AND_BENEFITS_FOR_MILITARY_CADETS', 'REGULATIONS_POLICIES_AND_BENEFITS_FOR_CIVILIAN_STUDENTS', 'FREQUENTLY_ASKED_QUESTIONS', 'PARTY_WORK_AND_POLITICAL_WORK', 'INTERNAL_GUIDELINES_AND_REGULATIONS_OF_THE_ACADEMY', 'IN_THE_FACULTY_HANDBOOK', 'TRANSLATION_FROM_OTHER_LANGUAGES_INTO_VIETNAMESE', 'DETECTION_AND_CORRECTION_OF_TEXT_ERRORS', 'EXTRACTIVE_TEXT_SUMMARIZATION', 'ABSTRACTIVE_TEXT_SUMMARIZATION');

-- CreateEnum
CREATE TYPE "ql-nguoi-dung"."UserType" AS ENUM ('MILITARY_STUDENT', 'CIVILIAN_STUDENT', 'LECTURER', 'STAFF', 'PROFESSIONAL', 'CONTRACT', 'OTHER');

-- CreateEnum
CREATE TYPE "ql-ho-so"."RelativeType" AS ENUM ('FATHER', 'MOTHER', 'OLDER_BROTHER', 'OLDER_SISTER', 'YOUNGER_BROTHER', 'YOUNGER_SISTER', 'MARRIER', 'FATHER_IN_LOW', 'MOTHER_IN_LOW', 'SON', 'DAUGHTER');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."ResearchProjectStatus" AS ENUM ('OPEN', 'FULL', 'CLOSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."ThesisProjectStatus" AS ENUM ('PROPOSED', 'APPROVED_BY_DEPT', 'ASSIGNED', 'IN_PROGRESS', 'DEFENSE_ELIGIBLE', 'DEFENDED_PASSED', 'DEFENDED_FAILED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."StudentThesisRegistrationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."DecisionType" AS ENUM ('SUPERVISION_GUIDE', 'EVALUATION_COUNCIL');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."CouncilProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."CouncilRole" AS ENUM ('CHAIRMAN', 'SECRETARY', 'REVIEWER_1', 'REVIEWER_2', 'MEMBER');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."AcademicActionType" AS ENUM ('REPEAT_YEAR', 'SUSPENSION', 'EXPULSION');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."DecisionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPEALED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."StudentTrainingType" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'MEDIUM', 'AVERAGE', 'POOR', 'VERY_POOR');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."CriteriaField" AS ENUM ('SEMESTER_GPA', 'YEARLY_GPA', 'CUMULATIVE_GPA', 'ENTRY_SCORE', 'COURSE_GRADE_LOWEST', 'GRADUATION_COURSE_GRADE_LOWEST', 'SEMESTER_REGISTERED_CREDITS', 'SEMESTER_PASSED_CREDITS', 'SEMESTER_FAILED_CREDITS', 'YEAR_FAILED_CREDITS', 'FAILED_CREDITS_PERCENT', 'CUMULATIVE_PASSED_CREDITS', 'CUMULATIVE_DEBT_CREDITS', 'CUMULATIVE_PROGRESS_PERCENT', 'ACADEMIC_WARNING_LEVEL', 'DISCIPLINARY_WARNING_LEVEL', 'REPEAT_YEAR_COUNT', 'SUSPENSION_COUNT', 'CONDUCT_SCORE', 'HAS_PASSED_FOREIGN_LANGUAGE', 'HAS_REGISTERED_FOR_SEMESTER', 'IS_PRIORITY_STUDENT', 'IS_CLASS_MONITOR_OR_LEADER', 'IS_STUDY_DURATION_EXCEEDED', 'IS_DEBT_SUBJECT_CONSECUTIVE', 'HAS_IMPROVEMENT_REGISTRATION');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."CriteriaOperator" AS ENUM ('GT', 'GTE', 'LT', 'LTE', 'EQ', 'IN');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."GraduationSessionStatus" AS ENUM ('PLANNING', 'OPEN_FOR_APPLICATION', 'IN_REVIEW', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."ApplicationStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."RankingContext" AS ENUM ('STUDYING', 'GRADUATION');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."DiplomaVerificationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."ReminderRepeatType" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "khao-thi"."EvaluationMemberRole" AS ENUM ('CHAIRMAN', 'VICE_PRESIDENT', 'HEAD_SECRETARY', 'SECRETARY', 'MEMBER');

-- CreateEnum
CREATE TYPE "khao-thi"."SurveyQuestionType" AS ENUM ('ESSAY', 'SINGLE_CHOICE');

-- CreateEnum
CREATE TYPE "khao-thi"."SurveyObject" AS ENUM ('MILITARY_STUDENT', 'CIVILIAN_STUDENT', 'LECTURER', 'STAFF');

-- CreateEnum
CREATE TYPE "ql-nguoi-dung"."FeedbackStatus" AS ENUM ('Pending', 'InProgress', 'Resolved', 'Closed');

-- CreateEnum
CREATE TYPE "ql-nguoi-dung"."Satisfaction" AS ENUM ('VeryDissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'VerySatisfied');

-- CreateEnum
CREATE TYPE "ql-danh-muc"."TemplateFileType" AS ENUM ('UPLOAD', 'DOWNLOAD', 'LOGS');

-- CreateTable
CREATE TABLE "he-thong"."Config" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "key" "he-thong"."ConfigKey" NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."QuestionBank" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "subjectVersionId" TEXT NOT NULL,

    CONSTRAINT "QuestionBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."Difficulty" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "level" INTEGER,

    CONSTRAINT "Difficulty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."KnowledgeBlock" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subjectVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "KnowledgeBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."Question" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "type" "khao-thi"."QuestionType" NOT NULL DEFAULT 'ESSAY',
    "point" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "explanation" TEXT,
    "isAutoGraded" BOOLEAN NOT NULL DEFAULT false,
    "questionBankId" TEXT NOT NULL,
    "knowledgeBlockId" TEXT,
    "difficultyId" TEXT,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."Answer" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "isCorrect" BOOLEAN,
    "score" DOUBLE PRECISION,
    "comment" TEXT,
    "essayAnswer" TEXT NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."Exam" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "status" "khao-thi"."ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "questionBankId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "passScore" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT true,
    "shuffleAnswers" BOOLEAN NOT NULL DEFAULT true,
    "showResult" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."TestStructureRule" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examId" TEXT NOT NULL,
    "knowledgeBlockId" TEXT NOT NULL,
    "questionPoint" DOUBLE PRECISION NOT NULL,
    "questionType" "khao-thi"."QuestionType" NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "TestStructureRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."ExamBank" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examId" TEXT NOT NULL,
    "examCode" TEXT NOT NULL,

    CONSTRAINT "ExamBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."ExamBankQuestion" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examBankId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER,

    CONSTRAINT "ExamBankQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."ExamFax" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examId" TEXT NOT NULL,
    "fax" TEXT NOT NULL,
    "score" DECIMAL(5,2),

    CONSTRAINT "ExamFax_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."ExamSession" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "studentId" TEXT,
    "examId" TEXT NOT NULL,
    "roomId" TEXT,
    "examBankId" TEXT,
    "examFaxId" TEXT,

    CONSTRAINT "ExamSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentSubjectScore" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subjectClassId" TEXT,
    "subjectVersionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "attendanceScore" DOUBLE PRECISION,
    "midtermScore" DOUBLE PRECISION,
    "examScore" DOUBLE PRECISION,
    "finalScore" DECIMAL(5,1),
    "manualFinalScore" DOUBLE PRECISION,
    "examPostponed" BOOLEAN NOT NULL DEFAULT false,
    "exempted" BOOLEAN NOT NULL DEFAULT false,
    "withdrew" BOOLEAN NOT NULL DEFAULT false,
    "examBanned" BOOLEAN NOT NULL DEFAULT false,
    "suspended" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StudentSubjectScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ArchivedCertificateOnStudentSubjectScore" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentSubjectScoreId" TEXT NOT NULL,
    "archivedCertificateId" TEXT NOT NULL,

    CONSTRAINT "ArchivedCertificateOnStudentSubjectScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ArchivedCertificate" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "englishName" TEXT,
    "finalScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ArchivedCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ArchivedAwardOnStudentSubjectScore" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentSubjectScoreId" TEXT NOT NULL,
    "archivedAwardId" TEXT NOT NULL,

    CONSTRAINT "ArchivedAwardOnStudentSubjectScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ArchivedAward" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "englishName" TEXT,
    "bonusScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ArchivedAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."SchoolYear" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "SchoolYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Semester" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "semesterType" "ql-dao-tao"."SemesterType",
    "schoolYearId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Milestone" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "startPeriod" INTEGER,
    "period" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "schoolYearId" TEXT NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingCourse" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "semesterStartId" TEXT NOT NULL,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "academicYear" TEXT,
    "maxTrainingTime" DOUBLE PRECISION,
    "admissionQuota" INTEGER,
    "baseScore" "ql-dao-tao"."AcademicRankingBaseType" NOT NULL,
    "coef_1" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "coef_2" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "coef_3" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "scoreToTakeExam" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scoreToPass" DOUBLE PRECISION NOT NULL DEFAULT 4,
    "scoreToPassConditional" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "scoreToTakeGraduation" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "scoreToPassGraduation" DOUBLE PRECISION NOT NULL DEFAULT 5.5,
    "trainingObjectTypeId" TEXT NOT NULL,

    CONSTRAINT "TrainingCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."FixedClass" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "startYear" INTEGER,
    "graduated" BOOLEAN DEFAULT false,
    "classMonitorId" TEXT,
    "unionLeaderId" TEXT,
    "trainingCourseId" TEXT NOT NULL,
    "managementOrganizationId" UUID,
    "lecturerManagementId" TEXT,
    "staffManagementId" TEXT,
    "initSize" INTEGER NOT NULL DEFAULT 0,
    "curriculumVersionId" TEXT,

    CONSTRAINT "FixedClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Curriculum" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "englishName" TEXT,
    "managementOrganizationId" UUID NOT NULL,
    "trainingMajorId" TEXT NOT NULL,
    "information" TEXT,
    "renderPath" TEXT,

    CONSTRAINT "Curriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."CurriculumVersion" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "englishName" TEXT,
    "trainingLanguage" "ql-dao-tao"."TrainingLanguage" NOT NULL DEFAULT 'Vietnamese',
    "numberOfSemesters" INTEGER,
    "yearCreation" INTEGER,
    "yearApplication" INTEGER,
    "curriculumId" TEXT NOT NULL,
    "trainingObjectTypeId" TEXT NOT NULL,
    "trainingLevelId" TEXT NOT NULL,
    "trainingTimeId" TEXT NOT NULL,
    "diplomaTypeId" TEXT,
    "requiredCredits" INTEGER,
    "electiveCredits" INTEGER,
    "jobPosition" TEXT,
    "objectives" TEXT,
    "learningOutcome" TEXT,
    "inputStandard" TEXT,
    "time" TEXT,
    "structure" TEXT,
    "matrixLearningOutcome" TEXT,
    "summary" TEXT,
    "learningDiagram" TEXT,
    "guide" TEXT,
    "renderPath" TEXT,

    CONSTRAINT "CurriculumVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Subject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "englishName" TEXT,
    "managementOrganizationId" UUID,
    "information" TEXT,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."SubjectVersion" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "examType" "ql-dao-tao"."ExamType" NOT NULL,
    "type" "ql-dao-tao"."SubjectVersionType" NOT NULL DEFAULT 'Normal',
    "credit" INTEGER NOT NULL,
    "week" INTEGER,
    "period" INTEGER NOT NULL DEFAULT 0,
    "numberOfTheory" INTEGER,
    "numberOfPractical" INTEGER,
    "numberOfSelfStudy" INTEGER,
    "numberOfPractice" INTEGER,
    "numberOfReview" INTEGER,
    "numberOfExam" INTEGER,
    "numberOfOther" INTEGER,
    "objectives" TEXT,
    "learningOutcome" TEXT,
    "structure" TEXT,
    "guild" TEXT,
    "academicResults" TEXT,
    "materials" TEXT,
    "rules" TEXT,
    "managementOrganizationId" UUID,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "SubjectVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."EquivalencyGroup" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquivalencyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."SubjectInGroup" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subjectId" TEXT NOT NULL,
    "equivalencyGroupId" TEXT NOT NULL,
    "side" "ql-dao-tao"."EquivalencySide" NOT NULL,

    CONSTRAINT "SubjectInGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingBlockSubject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subjectId" TEXT NOT NULL,
    "trainingBlockOnCurriculumVersionId" TEXT NOT NULL,
    "semester" INTEGER,
    "type" "ql-dao-tao"."SubjectRequirementType" NOT NULL DEFAULT 'None',
    "useForFinalScore" BOOLEAN NOT NULL,
    "graduation" BOOLEAN NOT NULL,
    "project" BOOLEAN NOT NULL,
    "print" BOOLEAN NOT NULL,

    CONSTRAINT "TrainingBlockSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."SubjectClass" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "subjectId" TEXT NOT NULL,
    "schedule" "ql-dao-tao"."SubjectClassSchedule" NOT NULL,
    "maxStudent" INTEGER NOT NULL,
    "semesterId" TEXT NOT NULL,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "lecturerAssignmentDeadline" TIMESTAMP(3),
    "examDate" TIMESTAMP(3),
    "scoreDeadline" TIMESTAMP(3),
    "examScoreDeadline" TIMESTAMP(3),
    "examType" "ql-dao-tao"."ExamType",
    "examId" TEXT,
    "isLockScore" BOOLEAN NOT NULL DEFAULT false,
    "isLockExamScore" BOOLEAN NOT NULL DEFAULT true,
    "issuedScoreAt" TIMESTAMP(3),
    "roomId" TEXT,
    "lecturerId" TEXT,
    "extraLecturerId" TEXT,
    "enterGradeLecturerId" TEXT,

    CONSTRAINT "SubjectClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ClassSchedule" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subjectClassId" TEXT NOT NULL,
    "periodType" "ql-dao-tao"."PeriodType" NOT NULL DEFAULT 'THEORY',
    "startPeriod" INTEGER NOT NULL,
    "endPeriod" INTEGER NOT NULL,
    "classDate" DATE NOT NULL,
    "roomId" TEXT,
    "lecturerId" TEXT,
    "notes" TEXT,
    "isReplacement" BOOLEAN NOT NULL DEFAULT false,
    "originalScheduleId" TEXT,
    "cancelReason" TEXT,

    CONSTRAINT "ClassSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingObjectType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "type" "ql-dao-tao"."TrainingObjectTypes" NOT NULL,

    CONSTRAINT "TrainingObjectType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."PriorityObject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "PriorityObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingLevel" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingForm" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingLocation" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Building" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "floor" INTEGER,
    "trainingLocationId" TEXT,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Room" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "trainingRoom" BOOLEAN NOT NULL DEFAULT true,
    "computerRoom" BOOLEAN NOT NULL DEFAULT false,
    "laboratoryRoom" BOOLEAN NOT NULL DEFAULT false,
    "examRoom" BOOLEAN NOT NULL DEFAULT false,
    "capacity" INTEGER NOT NULL,
    "examCapacity" INTEGER,
    "buildingId" TEXT,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingField" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "englishName" TEXT NOT NULL,
    "publishDate" TIMESTAMP(3) NOT NULL,
    "organizationId" UUID NOT NULL,

    CONSTRAINT "TrainingField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingFieldOnTrainingObjectType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainingFieldId" TEXT NOT NULL,
    "trainingObjectTypeId" TEXT NOT NULL,

    CONSTRAINT "TrainingFieldOnTrainingObjectType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingMajor" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "englishName" TEXT,
    "summary" TEXT NOT NULL,
    "numberCreditsMajor" INTEGER NOT NULL DEFAULT 0,
    "numberCreditsRequired" INTEGER NOT NULL DEFAULT 0,
    "numberCreditsElective" INTEGER NOT NULL DEFAULT 0,
    "organizationId" UUID NOT NULL,
    "trainingFieldId" TEXT NOT NULL,

    CONSTRAINT "TrainingMajor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingMajorOnTrainingObjectType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainingMajorId" TEXT NOT NULL,
    "trainingObjectTypeId" TEXT NOT NULL,

    CONSTRAINT "TrainingMajorOnTrainingObjectType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingBlock" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TrainingBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingBlockOnCurriculumVersion" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainingBlockId" TEXT NOT NULL,
    "curriculumVersionId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "electiveCreditsRequired" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TrainingBlockOnCurriculumVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingTime" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."DiplomaType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "englishName" TEXT,
    "type" "ql-dao-tao"."DiplomaTypeEnum" NOT NULL,

    CONSTRAINT "DiplomaType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ScoreConvert" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classification" TEXT NOT NULL,
    "base10Min" DOUBLE PRECISION NOT NULL,
    "base10Max" DOUBLE PRECISION NOT NULL,
    "letter" TEXT NOT NULL,
    "base4" DOUBLE PRECISION NOT NULL,
    "pass" BOOLEAN NOT NULL,
    "improvementRegister" BOOLEAN NOT NULL DEFAULT false,
    "trainingCourseId" TEXT NOT NULL,

    CONSTRAINT "ScoreConvert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingKPI" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingKPI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Student" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entryScore" DOUBLE PRECISION,
    "note" TEXT,
    "from" TIMESTAMP(3),
    "to" TIMESTAMP(3),
    "trainingLocationId" TEXT,
    "unionLeader" TEXT,
    "status" "ql-dao-tao"."StudentStatus" NOT NULL DEFAULT 'ENROLLED',
    "fixedClassId" TEXT,
    "userProfileId" TEXT NOT NULL,
    "trainingLevelId" TEXT,
    "trainingObjectTypeId" TEXT,
    "trainingTypeId" TEXT,
    "trainingFormId" TEXT,
    "registrationAreaId" UUID,
    "curriculumVersionId" TEXT,
    "academicWarningLevel" INTEGER NOT NULL DEFAULT 0,
    "disciplinaryWarningLevel" INTEGER NOT NULL DEFAULT 0,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "expelled" BOOLEAN NOT NULL DEFAULT false,
    "foreignLangPass" BOOLEAN NOT NULL DEFAULT false,
    "ITCertificationPass" BOOLEAN NOT NULL DEFAULT false,
    "strengthTrainingPass" BOOLEAN NOT NULL DEFAULT false,
    "militaryTrainingPass" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentSemesterResult" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "studyYear" INTEGER NOT NULL,
    "semesterIndexInCourse" INTEGER NOT NULL,
    "isLastSemester" BOOLEAN NOT NULL,
    "baseScore" "ql-dao-tao"."AcademicRankingBaseType" NOT NULL,
    "gpaBase4" DECIMAL(5,2) NOT NULL,
    "cumulativeGpaBase4" DECIMAL(5,2) NOT NULL,
    "gpaBase10" DECIMAL(5,2) NOT NULL,
    "cumulativeGpaBase10" DECIMAL(5,2) NOT NULL,
    "conductScore" DOUBLE PRECISION,
    "studentTrainingType" "ql-dao-tao"."StudentTrainingType" NOT NULL,
    "lowestFinalScore" DOUBLE PRECISION NOT NULL,
    "lowestGraduationScore" DOUBLE PRECISION,
    "totalCredits" INTEGER NOT NULL,
    "registeredCredits" INTEGER NOT NULL,
    "retakingCredits" INTEGER NOT NULL,
    "passedCredits" INTEGER NOT NULL,
    "failedCredits" INTEGER NOT NULL,
    "accumulatedCredits" INTEGER NOT NULL,
    "totalCreditsByCurriculum" INTEGER NOT NULL,
    "totalFailedCredits" INTEGER NOT NULL,
    "foreignLangPass" BOOLEAN NOT NULL,
    "isClassMonitor" BOOLEAN NOT NULL,
    "isUnionLeader" BOOLEAN NOT NULL,
    "entryScore" DOUBLE PRECISION,
    "isImproving" BOOLEAN NOT NULL,
    "postponeWithReason" BOOLEAN NOT NULL DEFAULT false,
    "academicWarningLevel" INTEGER NOT NULL DEFAULT 0,
    "disciplinaryWarningLevel" INTEGER NOT NULL DEFAULT 0,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "expelled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StudentSemesterResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentYearResult" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,
    "schoolYearId" TEXT NOT NULL,
    "studyYear" INTEGER NOT NULL,
    "isLastStudyYear" BOOLEAN NOT NULL,
    "baseScore" "ql-dao-tao"."AcademicRankingBaseType" NOT NULL,
    "gpaBase4" DECIMAL(5,2) NOT NULL,
    "cumulativeGpaBase4" DECIMAL(5,2) NOT NULL,
    "gpaBase10" DECIMAL(5,2) NOT NULL,
    "cumulativeGpaBase10" DECIMAL(5,2) NOT NULL,
    "conductScore" DOUBLE PRECISION,
    "studentTrainingType" "ql-dao-tao"."StudentTrainingType" NOT NULL,
    "totalCredits" INTEGER NOT NULL,
    "failedCredits" INTEGER NOT NULL,
    "isClassMonitor" BOOLEAN NOT NULL,
    "isUnionLeader" BOOLEAN NOT NULL,
    "academicWarningLevel" INTEGER NOT NULL DEFAULT 0,
    "disciplinaryWarningLevel" INTEGER NOT NULL DEFAULT 0,
    "suspended" BOOLEAN NOT NULL DEFAULT false,
    "expelled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StudentYearResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."Notification" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "ql-danh-muc"."NotificationType" NOT NULL DEFAULT 'GENERAL',
    "priority" "ql-danh-muc"."NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "targetAll" BOOLEAN NOT NULL DEFAULT false,
    "createdById" UUID NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."Group" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."Role" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "permissionType" "ql-nguoi-dung"."PermissionType" NOT NULL,
    "disabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tro-ly-ao"."ChatBotConfig" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ChatBotConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tro-ly-ao"."Document" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,
    "body" TEXT,
    "status" "tro-ly-ao"."DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "uri" TEXT,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "type" "tro-ly-ao"."DocumentType" NOT NULL,
    "reason" TEXT,
    "uploadedById" UUID NOT NULL,
    "approvedById" UUID,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tro-ly-ao"."FAQ" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "question" TEXT,
    "answer" TEXT,
    "status" "tro-ly-ao"."DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "type" "tro-ly-ao"."DocumentType" NOT NULL,
    "reason" TEXT,
    "uploadedById" UUID NOT NULL,
    "approvedById" UUID,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tro-ly-ao"."Prompt" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prompt" TEXT,
    "status" "tro-ly-ao"."DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "type" "tro-ly-ao"."DocumentType" NOT NULL,
    "reason" TEXT,

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tro-ly-ao"."Conversation" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "userId" UUID,
    "type" "tro-ly-ao"."DocumentType",

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tro-ly-ao"."Message" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationId" TEXT,
    "content" TEXT,
    "sender" "tro-ly-ao"."MessageSender" NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mta"."DM_CapBac" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,

    CONSTRAINT "DM_CapBac_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_ChucDanh" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,
    "iLoaiChucDanh" INTEGER DEFAULT 0,

    CONSTRAINT "DM_ChucDanh_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_ChucVu" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,
    "iNhomChucVu" INTEGER DEFAULT 0,

    CONSTRAINT "DM_ChucVu_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_HocHam" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,

    CONSTRAINT "DM_HocHam_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_HocVi" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,

    CONSTRAINT "DM_HocVi_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_ChungChiTinHoc" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,
    "sNguonCap" TEXT,
    "sNoiDung" TEXT,
    "sGiaTri" TEXT,
    "sDoiTuong" TEXT,

    CONSTRAINT "DM_ChungChiTinHoc_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_DanToc" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,
    "sTenKhac" TEXT,
    "sDiaChiCuTru" TEXT,

    CONSTRAINT "DM_DanToc_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_DonVi" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,
    "sCode" TEXT,
    "sTenVietTat" TEXT,
    "sParentId" UUID,
    "sTruongDonVi" UUID,
    "sChucNangNhiemVu" TEXT,
    "sDiaChi" TEXT,

    CONSTRAINT "DM_DonVi_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_DonViHanhChinh" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,
    "sTen_En" TEXT,

    CONSTRAINT "DM_DonViHanhChinh_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_KhuVuc_DiaLy" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,
    "sTen_En" TEXT,

    CONSTRAINT "DM_KhuVuc_DiaLy_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_NgoaiNgu" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,

    CONSTRAINT "DM_NgoaiNgu_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_TonGiao" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,

    CONSTRAINT "DM_TonGiao_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_TrinhDoNgoaiNgu" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,
    "sKhung" TEXT,

    CONSTRAINT "DM_TrinhDoNgoaiNgu_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_TrinhDoTinHoc" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,

    CONSTRAINT "DM_TrinhDoTinHoc_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_GioiTinh" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,

    CONSTRAINT "DM_GioiTinh_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_NhanVien" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,
    "sCCCD" TEXT,
    "sHoVaDem" TEXT,
    "sTenDayDu" TEXT,
    "dNgaySinh" TIMESTAMP(3),
    "iGioiTinh" INTEGER,
    "sDM_QuocGiaId" UUID,
    "sDM_TinhId" UUID,
    "sDM_QuanHuyenId" UUID,
    "sDM_XaPhuongId" UUID,
    "sDiaChi" TEXT,
    "sSDTDiDong" TEXT,
    "sEmail" TEXT,
    "bLaNguoiDung" BOOLEAN,
    "bLaCanBoNhanVien" BOOLEAN,
    "bLaHocVien" BOOLEAN,
    "sDM_DonViId" UUID,
    "sDM_ViTriCongViecId" UUID,
    "sQuanlyTrucTiepId" UUID,
    "sAvatarId" TEXT,
    "groupId" TEXT,

    CONSTRAINT "DM_NhanVien_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_PhanCap_ChatLuong_TrangThietBi" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,

    CONSTRAINT "DM_PhanCap_ChatLuong_TrangThietBi_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_PhanLoai_CSKT" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,

    CONSTRAINT "DM_PhanLoai_CSKT_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_NhomNguoiDung" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,

    CONSTRAINT "DM_NhomNguoiDung_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_NhomUngDung" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,
    "sMoTa" TEXT,

    CONSTRAINT "DM_NhomUngDung_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_QuocGia" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,
    "sLanguage" TEXT,

    CONSTRAINT "DM_QuocGia_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_Tinh" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,
    "sDM_QuocGiaId" UUID,
    "iDM_KhuVucDiaLy_Id" INTEGER,
    "iDM_DonViHanhChinhId" INTEGER,

    CONSTRAINT "DM_Tinh_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_Tinh_New" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,
    "sDM_QuocGiaId" UUID,
    "iDM_KhuVucDiaLy_Id" INTEGER,
    "iDM_DonViHanhChinhId" INTEGER,

    CONSTRAINT "DM_Tinh_New_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_QuanHuyen" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,
    "sDM_TinhId" UUID,
    "sDM_Tinh_Ma" TEXT,
    "iDM_DonViHanhChinhId" INTEGER,

    CONSTRAINT "DM_QuanHuyen_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_XaPhuong" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,
    "sDM_QuanHuyen_Ma" TEXT,
    "sDM_TinhId" UUID,
    "sDM_QuanHuyenId" UUID,
    "iDM_DonViHanhChinhId" INTEGER,

    CONSTRAINT "DM_XaPhuong_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_XaPhuong_New" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,
    "sDM_TinhId_New" UUID,
    "iDM_DonViHanhChinhId" INTEGER,

    CONSTRAINT "DM_XaPhuong_New_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_ViTriCongViec" (
    "Id" UUID NOT NULL,
    "sMa" TEXT,
    "sTen" TEXT,
    "sGhiChu" TEXT,
    "iSTT" INTEGER DEFAULT 0,
    "bActive" BOOLEAN DEFAULT true,
    "bDeleted" BOOLEAN DEFAULT false,
    "bSystem" BOOLEAN DEFAULT false,
    "iDictionaryKey" INTEGER DEFAULT 0,
    "dNgayTao" TIMESTAMP(3),
    "dNgaySua" TIMESTAMP(3),
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,
    "sDM_ChucDanhId" UUID,
    "sDM_NhomViTriId" UUID,

    CONSTRAINT "DM_ViTriCongViec_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."UserProfile" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bLaNguoiDung" BOOLEAN,
    "bLaCanBoNhanVien" BOOLEAN,
    "bLaHocVien" BOOLEAN,
    "groupId" TEXT,
    "sDM_DonViId" UUID,
    "sDM_ViTriCongViecId" UUID,
    "sQuanlyTrucTiepId" UUID,
    "iDictionaryKey" INTEGER,
    "bSystem" BOOLEAN,
    "sNguoiTao" TEXT,
    "sNguoiSua" TEXT,
    "sThietBiTao" TEXT,
    "sThietBiSua" TEXT,
    "avatar" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "idCardNumber" TEXT NOT NULL,
    "placeOfIdCardNumber" TEXT,
    "fullname" TEXT,
    "healthInsuranceNumber" TEXT,
    "bankAccountNumber" TEXT,
    "bankName" TEXT,
    "currentAddress" TEXT,
    "newCurrentAddress" TEXT,
    "occupationWhenRecruiting" TEXT,
    "thuongBinh" TEXT,
    "benh" TEXT,
    "tinhHinhNhaO" TEXT,
    "truocKhiNhapNgu" TEXT,
    "thanhPhanGiaDinh" TEXT,
    "soTruong" TEXT,
    "hoTenThuongDung" TEXT,
    "lichSuBanThan" TEXT,
    "conThuMay" INTEGER,
    "chieuCao" TEXT,
    "canNang" TEXT,
    "soACE" INTEGER,
    "kinhTeGiaDinh" TEXT,
    "chinhTriGiaDinh" TEXT,
    "fSoACE" INTEGER,
    "fKinhTeGiaDinh" TEXT,
    "fThanhPhanGiaDinh" TEXT,
    "fChinhTriGiaDinh" TEXT,
    "fBanThan" TEXT,
    "nationalId" UUID,
    "provinceCurrentAddressId" UUID,
    "districtCurrentAddressId" UUID,
    "communeCurrentAddressId" UUID,
    "newProvinceCurrentAddressId" UUID,
    "newCommuneCurrentAddressId" UUID,
    "dateOfBirth" TIMESTAMP(3),
    "placeOfBirth" TEXT,
    "provinceOfBirthId" UUID,
    "districtOfBirthId" UUID,
    "communeOfBirthId" UUID,
    "newProvinceOfBirthId" UUID,
    "newCommuneOfBirthId" UUID,
    "homeTown" TEXT,
    "idCardDate" TIMESTAMP(3),
    "idCardExpirationDate" TIMESTAMP(3),
    "genderId" UUID,
    "permanentAddress" TEXT,
    "provincePermanentAddressId" UUID,
    "districtPermanentAddressId" UUID,
    "communePermanentAddressId" UUID,
    "newProvincePermanentAddressId" UUID,
    "newCommunePermanentAddressId" UUID,
    "temporaryAddress" TEXT,
    "contactAddress" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "nationalityId" UUID,
    "religionId" UUID,
    "ethnicityId" UUID,
    "provinceHometownId" UUID,
    "districtHometownId" UUID,
    "communeHometownId" UUID,
    "newProvinceHometownId" UUID,
    "newCommuneHometownId" UUID,
    "officerNumber" TEXT,
    "rankId" UUID,
    "rankDate" TIMESTAMP(3),
    "academicDegreeTypeId" UUID,
    "academicDegreeDate" TIMESTAMP(3),
    "academicRankTypeId" UUID,
    "academicRankDate" TIMESTAMP(3),
    "levelId" UUID,
    "chiHuyQuanLyId" TEXT,
    "chuyenMonKyThuatId" TEXT,
    "sucKhoeId" TEXT,
    "nhomMauId" TEXT,
    "unionDate" TIMESTAMP(3),
    "unionPlace" TEXT,
    "CPVJoinDate" TIMESTAMP(3),
    "officialCPVDate" TIMESTAMP(3),
    "CPVJoinPlace" TEXT,
    "positionCPVId" UUID,
    "tenureDate" TIMESTAMP(3),
    "enlistmentDate" TIMESTAMP(3),
    "reEnlistmentDate" TIMESTAMP(3),
    "dischargeDate" TIMESTAMP(3),
    "recruitmentDate" TIMESTAMP(3),
    "recruitmentAgency" TEXT,
    "mainJobAssigned" TEXT,
    "revolutionaryDate" TIMESTAMP(3),
    "originalPlace" TEXT,
    "familyPhone" TEXT,
    "familyName" TEXT,
    "trinhDoHocVanId" TEXT,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."HocHam" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "academicRankTypeId" UUID,
    "noiCap" TEXT,
    "soQuyetDinh" TEXT,
    "from" TIMESTAMP(3),
    "to" TIMESTAMP(3),
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "HocHam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."HocVi" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "academicDegreeTypeId" UUID,
    "nationalityId" UUID,
    "linhVuc" TEXT,
    "truongId" TEXT,
    "year" INTEGER,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "HocVi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."Relative" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "type" "ql-ho-so"."RelativeType" NOT NULL,
    "birthYear" INTEGER,
    "queQuan" TEXT,
    "noiOHienTai" TEXT,
    "job" TEXT,
    "information" TEXT,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "Relative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."TrinhDoLyLuanChinhTri" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hinhThucDaoTao" TEXT,
    "noiDaoTao" TEXT,
    "thoiGianBatDau" TIMESTAMP(3),
    "thoiGianKetThuc" TIMESTAMP(3),
    "userProfileId" TEXT NOT NULL,
    "trinhDoId" TEXT,

    CONSTRAINT "TrinhDoLyLuanChinhTri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."TrinhDoQuanLyNhaNuoc" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hinhThucDaoTao" TEXT,
    "noiDaoTao" TEXT,
    "thoiGianBatDau" TIMESTAMP(3),
    "thoiGianKetThuc" TIMESTAMP(3),
    "userProfileId" TEXT NOT NULL,
    "trinhDoId" TEXT,

    CONSTRAINT "TrinhDoQuanLyNhaNuoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."NgoaiNgu" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngonNguId" UUID,
    "hinhThucDaoTao" TEXT,
    "noiDaoTao" TEXT,
    "thoiGianBatDau" TIMESTAMP(3),
    "thoiGianKetThuc" TIMESTAMP(3),
    "trinhDoId" UUID NOT NULL,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "NgoaiNgu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."TinHoc" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hinhThucDaoTao" TEXT,
    "noiDaoTao" TEXT,
    "thoiGianBatDau" TIMESTAMP(3),
    "thoiGianKetThuc" TIMESTAMP(3),
    "dM_TrinhDoTinHocId" UUID NOT NULL,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "TinHoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."BoiDuongQuocPhongAnNinh" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "thoiGianBatDau" TIMESTAMP(3),
    "thoiGianKetThuc" TIMESTAMP(3),
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "BoiDuongQuocPhongAnNinh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."CapBac" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "noiRaQuyetDinh" TEXT,
    "capRaQuyetDinh" TEXT,
    "ngayNhanQuyetDinh" TIMESTAMP(3),
    "capBacId" UUID NOT NULL,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "CapBac_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."QuaTrinhCongTac" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tuThangNam" TIMESTAMP(3),
    "denThangNam" TIMESTAMP(3),
    "donVi" TEXT,
    "chucDanh" TEXT,
    "chucVuDangDoan" TEXT,
    "soQuyetDinh" TEXT,
    "ngayNhanQuyetDinh" TIMESTAMP(3),
    "chucVuId" UUID NOT NULL,
    "loaiHinhCongTacId" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "QuaTrinhCongTac_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."QuaTrinhCuDiCongTac" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tuThangNam" TIMESTAMP(3),
    "denThangNam" TIMESTAMP(3),
    "donVi" TEXT NOT NULL,
    "chucVuId" UUID NOT NULL,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "QuaTrinhCuDiCongTac_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."QuaTrinhCuDiDaoTao" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ten" TEXT,
    "donViToChuc" TEXT,
    "tuNgay" TIMESTAMP(3),
    "denNgay" TIMESTAMP(3),
    "vanBang" TEXT,
    "loaiId" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "QuaTrinhCuDiDaoTao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."KhenThuong" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hinhThucKhenThuong" TEXT,
    "capKhenThuong" TEXT,
    "soQuyetDinh" TEXT,
    "nguoiKy" TEXT,
    "ngayNhanQuyetDinh" TIMESTAMP(3),
    "lyDo" TEXT,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "KhenThuong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."KyLuat" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hinhThucKyLuat" TEXT,
    "capKyLuat" TEXT,
    "soQuyetDinh" TEXT,
    "nguoiKy" TEXT,
    "ngayNhanQuyetDinh" TIMESTAMP(3),
    "lyDo" TEXT,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "KyLuat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DoiTuongChinhSach" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenDoiTuong" TEXT,
    "ngayBatDau" TIMESTAMP(3),
    "ngayKetThuc" TIMESTAMP(3),
    "ghiChu" TEXT,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "DoiTuongChinhSach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."KeKhaiTaiSan" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loai" TEXT,
    "tenDot" TEXT,
    "thoiGianKeKhai" TIMESTAMP(3),
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "KeKhaiTaiSan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."TiengDanToc" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "danTocId" UUID,
    "nghe" TEXT,
    "noi" TEXT,
    "viet" TEXT,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "TiengDanToc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."ChienDau" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cuongVi" TEXT,
    "donVi" TEXT,
    "diaDiem" TEXT,
    "vaiTro" TEXT,
    "doiTuong" TEXT,
    "thoiGianBatDau" TIMESTAMP(3),
    "thoiGianKetThuc" TIMESTAMP(3),
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "ChienDau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."NuocNgoai" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenNuocId" UUID NOT NULL,
    "tuNgay" TIMESTAMP(3),
    "denNgay" TIMESTAMP(3),
    "lyDo" TEXT,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "NuocNgoai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."ThuongTat" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loaiId" TEXT NOT NULL,
    "tiLe" INTEGER,
    "nguyenNhan" TEXT,
    "thoiGian" TIMESTAMP(3),
    "noiBiThuong" TEXT,
    "thoiGianGiamDinh" TIMESTAMP(3),
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "ThuongTat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DanhHieu" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ten" TEXT,
    "thoiGian" TIMESTAMP(3),
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "DanhHieu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."QuaTrinhHocTap" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenTruongId" TEXT NOT NULL,
    "nganhHocId" TEXT NOT NULL,
    "chuyenNganhId" TEXT,
    "tuNgay" TIMESTAMP(3),
    "denNgay" TIMESTAMP(3),
    "ketQua" TEXT,
    "loaiHinhDaoTao" TEXT,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "QuaTrinhHocTap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."ToChucXaHoi" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenId" TEXT NOT NULL,
    "tuNgay" TIMESTAMP(3),
    "denNgay" TIMESTAMP(3),
    "congViec" TEXT,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "ToChucXaHoi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."QuaTrinhLuong" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tuNgay" TIMESTAMP(3),
    "denNgay" TIMESTAMP(3),
    "ngachId" TEXT NOT NULL,
    "bacLuongId" TEXT NOT NULL,
    "heSo" TEXT,
    "maNgach" TEXT NOT NULL,
    "phuCapChucVu" TEXT,
    "phuCapKhac" TEXT,
    "userProfileId" TEXT NOT NULL,

    CONSTRAINT "QuaTrinhLuong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."LecturerType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "LecturerType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."StaffType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "StaffType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."StaffPosition" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "StaffPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Lecturer" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "from" TIMESTAMP(3),
    "lectureID" TEXT,
    "serviceDate" TIMESTAMP(3),
    "userProfileId" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "lecturerTypeId" TEXT NOT NULL,

    CONSTRAINT "Lecturer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."LecturerHistory" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "from" TIMESTAMP(3),
    "to" TIMESTAMP(3),
    "lectureID" TEXT,
    "lectureCode" TEXT,
    "serviceDate" TIMESTAMP(3),
    "userProfileId" TEXT NOT NULL,
    "organizationId" UUID,
    "lecturerTypeId" TEXT NOT NULL,

    CONSTRAINT "LecturerHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ResearchProject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "objectives" TEXT,
    "methodology" TEXT,
    "expectedResults" TEXT,
    "requirements" TEXT,
    "supervisorId" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "maxStudents" INTEGER NOT NULL,
    "currentStudents" INTEGER NOT NULL DEFAULT 0,
    "registrationStart" TIMESTAMP(3) NOT NULL,
    "registrationEnd" TIMESTAMP(3) NOT NULL,
    "projectStart" TIMESTAMP(3),
    "projectEnd" TIMESTAMP(3),
    "status" "ql-dao-tao"."ResearchProjectStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "ResearchProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentResearchRegistration" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,
    "researchProjectId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivation" TEXT,
    "experience" TEXT,
    "status" "ql-dao-tao"."RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNote" TEXT,

    CONSTRAINT "StudentResearchRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ThesisProject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "titleEN" TEXT,
    "summary" TEXT NOT NULL,
    "objectives" TEXT,
    "scope" TEXT,
    "methodology" TEXT,
    "expectedResults" TEXT,
    "requirements" TEXT,
    "technologies" TEXT,
    "status" "ql-dao-tao"."ThesisProjectStatus" NOT NULL DEFAULT 'PROPOSED',
    "subjectClassId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "coSupervisorId" TEXT,
    "organizationId" UUID NOT NULL,
    "maxStudents" INTEGER NOT NULL,
    "currentStudents" INTEGER NOT NULL DEFAULT 0,
    "councilId" TEXT,
    "roomId" TEXT,
    "defenseDate" TIMESTAMP(3),
    "defenseSessionId" TEXT,
    "registrationStart" TIMESTAMP(3),
    "registrationEnd" TIMESTAMP(3),
    "projectStart" TIMESTAMP(3),
    "projectEnd" TIMESTAMP(3),

    CONSTRAINT "ThesisProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."DefenseSession" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" TIME(0) NOT NULL,

    CONSTRAINT "DefenseSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentThesisRegistration" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,
    "thesisProjectId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivation" TEXT,
    "experience" TEXT,
    "proposedIdeas" TEXT,
    "status" "ql-dao-tao"."StudentThesisRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNote" TEXT,

    CONSTRAINT "StudentThesisRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ExpertProfile" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lecturerId" TEXT,
    "name" TEXT,
    "academicRank" TEXT,
    "academicDegree" TEXT,
    "organization" TEXT,
    "position" TEXT,
    "specialization" TEXT,
    "workplace" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "eligiblePresident" BOOLEAN NOT NULL,
    "eligibleSecretary" BOOLEAN NOT NULL,

    CONSTRAINT "ExpertProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Decision" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "type" "ql-dao-tao"."DecisionType" NOT NULL,
    "thesisProjectId" TEXT NOT NULL,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Invitation" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "councilMemberId" TEXT NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Council" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proposedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ql-dao-tao"."CouncilProposalStatus" NOT NULL DEFAULT 'PENDING',
    "studentThesisRegistrationId" TEXT,

    CONSTRAINT "Council_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."CouncilMember" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "ql-dao-tao"."CouncilRole" NOT NULL,
    "councilId" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,

    CONSTRAINT "CouncilMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."DefenseRecord" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalScore" DECIMAL(5,2),
    "comments" TEXT,
    "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
    "thesisId" TEXT NOT NULL,

    CONSTRAINT "DefenseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."LibrarySubmission" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isHardcopy" BOOLEAN NOT NULL DEFAULT false,
    "isSoftcopy" BOOLEAN NOT NULL DEFAULT false,
    "librarianNote" TEXT,
    "thesisId" TEXT NOT NULL,
    "confirmedById" TEXT,

    CONSTRAINT "LibrarySubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."DefaultCouncilRolePayAmount" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "ql-dao-tao"."CouncilRole" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "DefaultCouncilRolePayAmount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."PaymentRecord" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "ql-dao-tao"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3),
    "transactionCode" TEXT,
    "expertId" TEXT NOT NULL,
    "councilMemberId" TEXT,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."SupervisorPaymentRecord" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "thesisProjectId" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "ql-dao-tao"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3),
    "transactionCode" TEXT,

    CONSTRAINT "SupervisorPaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."DocumentFile" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "mimeType" TEXT,
    "archivedCertificateId" TEXT,
    "archivedAwardId" TEXT,
    "curriculumId" TEXT,
    "curriculumVersionId" TEXT,
    "subjectVersionId" TEXT,
    "studentAcademicDecisionId" TEXT,
    "notificationId" TEXT,
    "decisionId" TEXT,
    "defenseRecordId" TEXT,
    "diplomaFrontId" TEXT,
    "diplomaBackId" TEXT,
    "diplomaVerificationId" TEXT,
    "diplomaVerificationFrontId" TEXT,
    "diplomaVerificationBackId" TEXT,
    "noteId" TEXT,

    CONSTRAINT "DocumentFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."AcademicActionConfig" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "actionType" "ql-dao-tao"."AcademicActionType" NOT NULL,
    "trainingCourseId" TEXT NOT NULL,

    CONSTRAINT "AcademicActionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."AcademicActionRuleSet" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "configId" TEXT NOT NULL,

    CONSTRAINT "AcademicActionRuleSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."AcademicActionCondition" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ruleSetId" TEXT NOT NULL,
    "field" "ql-dao-tao"."CriteriaField" NOT NULL,
    "operator" "ql-dao-tao"."CriteriaOperator" NOT NULL,
    "invert" BOOLEAN NOT NULL DEFAULT false,
    "value" DOUBLE PRECISION NOT NULL,
    "tuple" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "yearCondition" INTEGER,
    "isPriorityStudent" BOOLEAN,

    CONSTRAINT "AcademicActionCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentAcademicDecision" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,
    "semesterId" TEXT,
    "schoolYearId" TEXT,
    "appliedConfigId" TEXT,
    "actionTaken" "ql-dao-tao"."AcademicActionType" NOT NULL,
    "decisionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "reason" TEXT,
    "status" "ql-dao-tao"."DecisionStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "StudentAcademicDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingScoreSession" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "semesterId" TEXT NOT NULL,
    "trainingObjectTypeId" TEXT NOT NULL,

    CONSTRAINT "TrainingScoreSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentTrainingScore" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainingScoreSessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "studentTrainingType" "ql-dao-tao"."StudentTrainingType",

    CONSTRAINT "StudentTrainingScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Scholarship" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "rankOrder" INTEGER NOT NULL,
    "baseAmount" DECIMAL(65,30) NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "trainingCourseId" TEXT NOT NULL,

    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ScholarshipCriteria" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scholarshipId" TEXT NOT NULL,
    "field" "ql-dao-tao"."CriteriaField" NOT NULL,
    "invert" BOOLEAN NOT NULL DEFAULT false,
    "operator" "ql-dao-tao"."CriteriaOperator" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "tuple" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bonusValue" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ScholarshipCriteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ScholarshipAward" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "gpaAtAward" DOUBLE PRECISION NOT NULL,
    "priorityRank" INTEGER NOT NULL,

    CONSTRAINT "ScholarshipAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."GraduationSession" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "applicationStart" TIMESTAMP(3) NOT NULL,
    "applicationEnd" TIMESTAMP(3) NOT NULL,
    "status" "ql-dao-tao"."GraduationSessionStatus" NOT NULL DEFAULT 'PLANNING',

    CONSTRAINT "GraduationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudentGraduationApplication" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ql-dao-tao"."ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',

    CONSTRAINT "StudentGraduationApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."ApplicationCheckResult" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentGraduationApplicationId" TEXT NOT NULL,
    "rankingConditionId" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "actualValue" DOUBLE PRECISION,

    CONSTRAINT "ApplicationCheckResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."GraduationDecision" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "decisionDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "finalGpa" DECIMAL(5,2) NOT NULL,
    "trainingMajorId" TEXT,
    "finalRankingId" TEXT NOT NULL,
    "diplomaTypeId" TEXT,
    "originalDiplomaNumber" TEXT,
    "diplomaNumber" TEXT,
    "diplomaIssueDate" DATE,
    "totalCopy" INTEGER DEFAULT 0,

    CONSTRAINT "GraduationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."AcademicRankingConvert" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classification" TEXT NOT NULL,
    "context" "ql-dao-tao"."RankingContext" NOT NULL,
    "rankOrder" INTEGER NOT NULL,
    "baseScore" "ql-dao-tao"."AcademicRankingBaseType" NOT NULL,
    "base10Min" DOUBLE PRECISION,
    "base10Max" DOUBLE PRECISION,
    "base4Min" DOUBLE PRECISION,
    "base4Max" DOUBLE PRECISION,
    "graduated" BOOLEAN NOT NULL,
    "trainingCourseId" TEXT NOT NULL,

    CONSTRAINT "AcademicRankingConvert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."GraduationRankDowngradeRule" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "initialRankId" TEXT NOT NULL,

    CONSTRAINT "GraduationRankDowngradeRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."GraduationRankDowngradeCondition" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "downgradeRuleId" TEXT NOT NULL,
    "field" "ql-dao-tao"."CriteriaField" NOT NULL,
    "operator" "ql-dao-tao"."CriteriaOperator" NOT NULL,
    "invert" BOOLEAN NOT NULL DEFAULT false,
    "value" DOUBLE PRECISION NOT NULL,
    "tuple" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "GraduationRankDowngradeCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."RankingCondition" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rankingId" TEXT NOT NULL,
    "field" "ql-dao-tao"."CriteriaField" NOT NULL,
    "operator" "ql-dao-tao"."CriteriaOperator" NOT NULL,
    "invert" BOOLEAN NOT NULL DEFAULT false,
    "value" DOUBLE PRECISION NOT NULL,
    "tuple" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "RankingCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."DiplomaVerificationApplication" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fullname" TEXT NOT NULL,
    "idCardNumber" TEXT NOT NULL,
    "dateOfBirth" DATE,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "originalDiplomaNumber" TEXT NOT NULL,
    "diplomaNumber" TEXT NOT NULL,
    "trainingMajor" TEXT,
    "trainingLevel" TEXT,
    "trainingForm" TEXT,
    "trainingCourseStartYear" INTEGER,
    "trainingCourseEndYear" INTEGER,
    "diplomaIssueDate" DATE,
    "classification" TEXT,
    "status" "ql-dao-tao"."DiplomaVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "studentId" TEXT,

    CONSTRAINT "DiplomaVerificationApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Note" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "studentId" TEXT NOT NULL,
    "folderId" TEXT,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."NoteFolder" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "NoteFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."NoteTag" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "NoteTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."NoteReminder" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "reminderTime" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "repeatType" "ql-dao-tao"."ReminderRepeatType" NOT NULL DEFAULT 'NONE',
    "isNotified" BOOLEAN NOT NULL DEFAULT false,
    "noteId" TEXT NOT NULL,

    CONSTRAINT "NoteReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."EvaluationPeriod" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "EvaluationPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."StandardCatalog" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "StandardCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."CriterionCatalog" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "standardId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "scoreScaleId" TEXT NOT NULL,

    CONSTRAINT "CriterionCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."RequirementCriterionCatalog" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criterionCatalogId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "questions" TEXT[],

    CONSTRAINT "RequirementCriterionCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."ScoreScaleCatalog" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "minValue" INTEGER NOT NULL,
    "maxValue" INTEGER NOT NULL,
    "passFrom" INTEGER,

    CONSTRAINT "ScoreScaleCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."EvaluationStandard" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "opening" TEXT NOT NULL DEFAULT '',
    "conclusion" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "EvaluationStandard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."EvaluationCriterion" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "standardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "scoreScaleId" TEXT NOT NULL,
    "evaluationCouncilId" TEXT,
    "currentSituation" TEXT NOT NULL DEFAULT '',
    "strengths" TEXT NOT NULL DEFAULT '',
    "weakness" TEXT NOT NULL DEFAULT '',
    "actionPlan" TEXT NOT NULL DEFAULT '',
    "score" INTEGER,

    CONSTRAINT "EvaluationCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."EvidenceCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "EvidenceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."Evidence" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "information" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."RequirementCriterion" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluationCriterionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "questions" TEXT[],

    CONSTRAINT "RequirementCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."AnalysisFormEvidence" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requirementCriterionId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "AnalysisFormEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."EvaluationCouncil" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "EvaluationCouncil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."EvaluationCouncilMember" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluationCouncilId" TEXT NOT NULL,
    "lecturerId" TEXT NOT NULL,
    "role" "khao-thi"."EvaluationMemberRole"[],

    CONSTRAINT "EvaluationCouncilMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."EvidenceFile" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "userProfileId" TEXT,

    CONSTRAINT "EvidenceFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."SurveyObjectType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "type" "khao-thi"."SurveyObject"[],

    CONSTRAINT "SurveyObjectType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."SurveyTopic" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "SurveyTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."SurveyQuestionGroup" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "surveyTopicId" TEXT NOT NULL,

    CONSTRAINT "SurveyQuestionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."Survey" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "anonymous" BOOLEAN NOT NULL DEFAULT true,
    "lectureId" TEXT,
    "surveyTopicId" TEXT NOT NULL,
    "additionalSuggestion" BOOLEAN NOT NULL,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."SurveyQuestion" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "type" "khao-thi"."SurveyQuestionType" NOT NULL,
    "surveyQuestionGroupId" TEXT,
    "surveyId" TEXT,

    CONSTRAINT "SurveyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."SurveyChoice" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answer" TEXT NOT NULL,
    "requireExplanation" BOOLEAN NOT NULL,
    "surveyId" TEXT NOT NULL,

    CONSTRAINT "SurveyChoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."SurveySession" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "surveyId" TEXT NOT NULL,
    "additionalSuggestion" TEXT,
    "studentId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SurveySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."SurveyResponse" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "surveySessionId" TEXT NOT NULL,
    "surveyQuestionId" TEXT NOT NULL,
    "answerText" TEXT,
    "explanation" TEXT,
    "surveyChoiceId" TEXT,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Staff" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "from" TIMESTAMP(3),
    "userProfileId" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "staffTypeId" TEXT NOT NULL,
    "staffPositionId" TEXT NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StaffHistory" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "from" TIMESTAMP(3),
    "to" TIMESTAMP(3),
    "userProfileId" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "staffTypeId" TEXT NOT NULL,
    "staffPositionId" TEXT NOT NULL,

    CONSTRAINT "StaffHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_TrinhDoHocVan" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_TrinhDoHocVan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_TrinhDoLyLuanChinhTri" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_TrinhDoLyLuanChinhTri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_TrinhDoQuanLyNhaNuoc" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_TrinhDoQuanLyNhaNuoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_TinhTrangHonNhan" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_TinhTrangHonNhan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_TrangThaiLamViec" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_TrangThaiLamViec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_HinhThucKhenThuongChinhQuyen" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_HinhThucKhenThuongChinhQuyen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_HinhThucKhenThuongDang" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_HinhThucKhenThuongDang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_XepLoaiDanhGiaCanBo" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_XepLoaiDanhGiaCanBo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_XepLoaiDanhGiaChatLuongDangVien" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_XepLoaiDanhGiaChatLuongDangVien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_LoaiHinhCongTac" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_LoaiHinhCongTac_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_TinhTrangCongTac" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_TinhTrangCongTac_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_LoaiHinhDiHocTap" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_LoaiHinhDiHocTap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_TinhTrangDiHocTap" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_TinhTrangDiHocTap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_NuocCuDiHocTap" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_NuocCuDiHocTap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_ChucDanhCMNVGiangVien" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_ChucDanhCMNVGiangVien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_ChucDanhCMNVNghienCuuVien" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_ChucDanhCMNVNghienCuuVien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_ChucDanhCMNVKySu" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_ChucDanhCMNVKySu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_TruongDaoTaoBacDH" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_TruongDaoTaoBacDH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_ChuyenNganhDaoTaoBacDH" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_ChuyenNganhDaoTaoBacDH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_ChiHuyQuanLy" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_ChiHuyQuanLy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_ChuyenMonKyThuat" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_ChuyenMonKyThuat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_SucKhoe" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_SucKhoe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_NhomMau" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_NhomMau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_LoaiThuongTat" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_LoaiThuongTat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_NganhHoc" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_NganhHoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_ToChucXaHoi" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_ToChucXaHoi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_Ngach" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_Ngach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-ho-so"."DM_BacLuong" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,

    CONSTRAINT "DM_BacLuong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."Feedback" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "status" "ql-nguoi-dung"."FeedbackStatus" NOT NULL,
    "satisfaction" "ql-nguoi-dung"."Satisfaction" NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."AcademicWarningRule" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "field" "ql-dao-tao"."CriteriaField" NOT NULL,
    "operator" "ql-dao-tao"."CriteriaOperator" NOT NULL,
    "invert" BOOLEAN NOT NULL DEFAULT false,
    "threshold" DOUBLE PRECISION NOT NULL,
    "tuple" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "severity" INTEGER NOT NULL,
    "yearCondition" INTEGER,
    "semesterCondition" INTEGER,
    "trainingCourseId" TEXT NOT NULL,

    CONSTRAINT "AcademicWarningRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."AcademicWarning" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "increasedFrom" INTEGER,
    "decreasedFrom" INTEGER,

    CONSTRAINT "AcademicWarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."DisciplinaryWarning" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,
    "semesterId" TEXT,
    "level" INTEGER NOT NULL,
    "increasedFrom" INTEGER,

    CONSTRAINT "DisciplinaryWarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."DisciplinaryWarningReason" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "severityLevel" INTEGER NOT NULL,

    CONSTRAINT "DisciplinaryWarningReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."TemplateFile" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "fileType" "ql-danh-muc"."TemplateFileType",
    "extensions" TEXT,
    "numberField" INTEGER DEFAULT 0,

    CONSTRAINT "TemplateFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."BlockedIp" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "BlockedIp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."_ExamToRoom" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ExamToRoom_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_FixedClassToSubjectClass" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FixedClassToSubjectClass_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_FixedClassToNotification" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FixedClassToNotification_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_FixedClassToSurveyObjectType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FixedClassToSurveyObjectType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_PrerequisiteSubject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PrerequisiteSubject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_CoRequisiteSubject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CoRequisiteSubject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_SubjectClassToSurveyObjectType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SubjectClassToSurveyObjectType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_PriorityObjectToStudent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PriorityObjectToStudent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_DefenseRooms" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DefenseRooms_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."_NotificationToTrainingCourse" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NotificationToTrainingCourse_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."_NotificationToStudent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NotificationToStudent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."_GroupToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GroupToRole_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."_PermissionToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PermissionToRole_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "mta"."_DM_DonViToSurveyObjectType" (
    "A" UUID NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DM_DonViToSurveyObjectType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_ExpertProfileToTrainingMajor" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ExpertProfileToTrainingMajor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_ExpertProfileToSubjectClass" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ExpertProfileToSubjectClass_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_NoteToNoteTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NoteToNoteTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "khao-thi"."_SurveyObjectTypeToTrainingField" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SurveyObjectTypeToTrainingField_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "khao-thi"."_SurveyObjectTypeToTrainingMajor" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SurveyObjectTypeToTrainingMajor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "khao-thi"."_SurveyObjectTypeToTrainingCourse" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SurveyObjectTypeToTrainingCourse_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "khao-thi"."_SurveyToSurveyObjectType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SurveyToSurveyObjectType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_AcademicWarningToAcademicWarningRule" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AcademicWarningToAcademicWarningRule_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_DisciplinaryWarningToDisciplinaryWarningReason" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DisciplinaryWarningToDisciplinaryWarningReason_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Config_code_key" ON "he-thong"."Config"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Config_key_key" ON "he-thong"."Config"("key");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionBank_code_key" ON "khao-thi"."QuestionBank"("code");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionBank_subjectVersionId_name_key" ON "khao-thi"."QuestionBank"("subjectVersionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Difficulty_code_key" ON "khao-thi"."Difficulty"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Difficulty_name_key" ON "khao-thi"."Difficulty"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Difficulty_level_key" ON "khao-thi"."Difficulty"("level");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBlock_code_key" ON "khao-thi"."KnowledgeBlock"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBlock_name_subjectVersionId_key" ON "khao-thi"."KnowledgeBlock"("name", "subjectVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Question_code_key" ON "khao-thi"."Question"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_code_key" ON "khao-thi"."Answer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_sessionId_questionId_key" ON "khao-thi"."Answer"("sessionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_code_key" ON "khao-thi"."Exam"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TestStructureRule_code_key" ON "khao-thi"."TestStructureRule"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TestStructureRule_examId_knowledgeBlockId_questionPoint_que_key" ON "khao-thi"."TestStructureRule"("examId", "knowledgeBlockId", "questionPoint", "questionType");

-- CreateIndex
CREATE UNIQUE INDEX "ExamBank_code_key" ON "khao-thi"."ExamBank"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExamBank_examId_examCode_key" ON "khao-thi"."ExamBank"("examId", "examCode");

-- CreateIndex
CREATE UNIQUE INDEX "ExamBankQuestion_code_key" ON "khao-thi"."ExamBankQuestion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExamBankQuestion_examBankId_questionId_key" ON "khao-thi"."ExamBankQuestion"("examBankId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamBankQuestion_examBankId_order_key" ON "khao-thi"."ExamBankQuestion"("examBankId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ExamFax_code_key" ON "khao-thi"."ExamFax"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExamFax_examId_fax_key" ON "khao-thi"."ExamFax"("examId", "fax");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSession_code_key" ON "khao-thi"."ExamSession"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSession_examFaxId_key" ON "khao-thi"."ExamSession"("examFaxId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSession_studentId_examId_key" ON "khao-thi"."ExamSession"("studentId", "examId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSubjectScore_code_key" ON "ql-dao-tao"."StudentSubjectScore"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSubjectScore_subjectClassId_studentId_key" ON "ql-dao-tao"."StudentSubjectScore"("subjectClassId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedCertificateOnStudentSubjectScore_code_key" ON "ql-dao-tao"."ArchivedCertificateOnStudentSubjectScore"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedCertificateOnStudentSubjectScore_studentSubjectScor_key" ON "ql-dao-tao"."ArchivedCertificateOnStudentSubjectScore"("studentSubjectScoreId", "archivedCertificateId");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedCertificate_code_key" ON "ql-dao-tao"."ArchivedCertificate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedAwardOnStudentSubjectScore_code_key" ON "ql-dao-tao"."ArchivedAwardOnStudentSubjectScore"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedAwardOnStudentSubjectScore_studentSubjectScoreId_ar_key" ON "ql-dao-tao"."ArchivedAwardOnStudentSubjectScore"("studentSubjectScoreId", "archivedAwardId");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedAward_code_key" ON "ql-dao-tao"."ArchivedAward"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolYear_code_key" ON "ql-dao-tao"."SchoolYear"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_code_key" ON "ql-dao-tao"."Semester"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_schoolYearId_semesterType_key" ON "ql-dao-tao"."Semester"("schoolYearId", "semesterType");

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_code_key" ON "ql-dao-tao"."Milestone"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCourse_code_key" ON "ql-dao-tao"."TrainingCourse"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FixedClass_code_key" ON "ql-dao-tao"."FixedClass"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FixedClass_classMonitorId_key" ON "ql-dao-tao"."FixedClass"("classMonitorId");

-- CreateIndex
CREATE UNIQUE INDEX "FixedClass_unionLeaderId_key" ON "ql-dao-tao"."FixedClass"("unionLeaderId");

-- CreateIndex
CREATE UNIQUE INDEX "FixedClass_name_trainingCourseId_curriculumVersionId_key" ON "ql-dao-tao"."FixedClass"("name", "trainingCourseId", "curriculumVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Curriculum_code_key" ON "ql-dao-tao"."Curriculum"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumVersion_code_key" ON "ql-dao-tao"."CurriculumVersion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "ql-dao-tao"."Subject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "ql-dao-tao"."Subject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_englishName_key" ON "ql-dao-tao"."Subject"("englishName");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectVersion_code_key" ON "ql-dao-tao"."SubjectVersion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EquivalencyGroup_code_key" ON "ql-dao-tao"."EquivalencyGroup"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectInGroup_code_key" ON "ql-dao-tao"."SubjectInGroup"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectInGroup_subjectId_equivalencyGroupId_key" ON "ql-dao-tao"."SubjectInGroup"("subjectId", "equivalencyGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBlockSubject_code_key" ON "ql-dao-tao"."TrainingBlockSubject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectClass_code_key" ON "ql-dao-tao"."SubjectClass"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSchedule_code_key" ON "ql-dao-tao"."ClassSchedule"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSchedule_originalScheduleId_key" ON "ql-dao-tao"."ClassSchedule"("originalScheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSchedule_subjectClassId_classDate_startPeriod_key" ON "ql-dao-tao"."ClassSchedule"("subjectClassId", "classDate", "startPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingObjectType_code_key" ON "ql-dao-tao"."TrainingObjectType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingObjectType_name_key" ON "ql-dao-tao"."TrainingObjectType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PriorityObject_code_key" ON "ql-dao-tao"."PriorityObject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PriorityObject_name_key" ON "ql-dao-tao"."PriorityObject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingType_code_key" ON "ql-dao-tao"."TrainingType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingType_name_key" ON "ql-dao-tao"."TrainingType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingLevel_code_key" ON "ql-dao-tao"."TrainingLevel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingLevel_name_key" ON "ql-dao-tao"."TrainingLevel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingForm_code_key" ON "ql-dao-tao"."TrainingForm"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingForm_name_key" ON "ql-dao-tao"."TrainingForm"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingLocation_code_key" ON "ql-dao-tao"."TrainingLocation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingLocation_name_key" ON "ql-dao-tao"."TrainingLocation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Building_code_key" ON "ql-dao-tao"."Building"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Building_trainingLocationId_name_key" ON "ql-dao-tao"."Building"("trainingLocationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "ql-dao-tao"."Room"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Room_buildingId_name_key" ON "ql-dao-tao"."Room"("buildingId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingField_code_key" ON "ql-dao-tao"."TrainingField"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingField_name_key" ON "ql-dao-tao"."TrainingField"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingFieldOnTrainingObjectType_code_key" ON "ql-dao-tao"."TrainingFieldOnTrainingObjectType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingFieldOnTrainingObjectType_trainingFieldId_trainingO_key" ON "ql-dao-tao"."TrainingFieldOnTrainingObjectType"("trainingFieldId", "trainingObjectTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingMajor_code_key" ON "ql-dao-tao"."TrainingMajor"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingMajor_trainingFieldId_name_key" ON "ql-dao-tao"."TrainingMajor"("trainingFieldId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingMajorOnTrainingObjectType_code_key" ON "ql-dao-tao"."TrainingMajorOnTrainingObjectType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingMajorOnTrainingObjectType_trainingMajorId_trainingO_key" ON "ql-dao-tao"."TrainingMajorOnTrainingObjectType"("trainingMajorId", "trainingObjectTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBlock_code_key" ON "ql-dao-tao"."TrainingBlock"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBlock_name_key" ON "ql-dao-tao"."TrainingBlock"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBlockOnCurriculumVersion_code_key" ON "ql-dao-tao"."TrainingBlockOnCurriculumVersion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBlockOnCurriculumVersion_trainingBlockId_curriculum_key" ON "ql-dao-tao"."TrainingBlockOnCurriculumVersion"("trainingBlockId", "curriculumVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingTime_code_key" ON "ql-dao-tao"."TrainingTime"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DiplomaType_code_key" ON "ql-dao-tao"."DiplomaType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DiplomaType_name_key" ON "ql-dao-tao"."DiplomaType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreConvert_code_key" ON "ql-dao-tao"."ScoreConvert"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingKPI_code_key" ON "ql-dao-tao"."TrainingKPI"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Student_code_key" ON "ql-dao-tao"."Student"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSemesterResult_code_key" ON "ql-dao-tao"."StudentSemesterResult"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSemesterResult_studentId_semesterId_key" ON "ql-dao-tao"."StudentSemesterResult"("studentId", "semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentYearResult_code_key" ON "ql-dao-tao"."StudentYearResult"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentYearResult_studentId_schoolYearId_key" ON "ql-dao-tao"."StudentYearResult"("studentId", "schoolYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_code_key" ON "ql-danh-muc"."Notification"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Group_code_key" ON "ql-nguoi-dung"."Group"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "ql-nguoi-dung"."Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "ql-nguoi-dung"."Permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_permissionType_key" ON "ql-nguoi-dung"."Permission"("name", "permissionType");

-- CreateIndex
CREATE UNIQUE INDEX "ChatBotConfig_code_key" ON "tro-ly-ao"."ChatBotConfig"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ChatBotConfig_name_key" ON "tro-ly-ao"."ChatBotConfig"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Document_code_key" ON "tro-ly-ao"."Document"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FAQ_code_key" ON "tro-ly-ao"."FAQ"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Prompt_code_key" ON "tro-ly-ao"."Prompt"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_code_key" ON "tro-ly-ao"."Conversation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Message_code_key" ON "tro-ly-ao"."Message"("code");

-- CreateIndex
CREATE INDEX "IX_DM_DonVi_iParentId" ON "mta"."DM_DonVi"("sParentId");

-- CreateIndex
CREATE INDEX "IX_DM_DonVi_sMa" ON "mta"."DM_DonVi"("sMa");

-- CreateIndex
CREATE INDEX "IX_DM_NhanVien_sDM_DonViId" ON "mta"."DM_NhanVien"("sDM_DonViId");

-- CreateIndex
CREATE INDEX "IX_DM_NhanVien_sDM_ViTriCongViecId" ON "mta"."DM_NhanVien"("sDM_ViTriCongViecId");

-- CreateIndex
CREATE INDEX "IX_DM_NhanVien_sEmail" ON "mta"."DM_NhanVien"("sEmail");

-- CreateIndex
CREATE INDEX "IX_DM_NhanVien_sSDTDiDong" ON "mta"."DM_NhanVien"("sSDTDiDong");

-- CreateIndex
CREATE INDEX "IX_DM_Tinh_iDM_QuocGiaId" ON "mta"."DM_Tinh"("sDM_QuocGiaId");

-- CreateIndex
CREATE INDEX "IX_DM_Tinh_New_iDM_QuocGiaId" ON "mta"."DM_Tinh_New"("sDM_QuocGiaId");

-- CreateIndex
CREATE INDEX "IX_DM_QuanHuyen_iDM_TinhId" ON "mta"."DM_QuanHuyen"("sDM_TinhId");

-- CreateIndex
CREATE INDEX "IX_DM_XaPhuong_iDM_QuanHuyenId" ON "mta"."DM_XaPhuong"("sDM_QuanHuyenId");

-- CreateIndex
CREATE INDEX "DM_XaPhuong_New_sDM_TinhId_New_idx" ON "mta"."DM_XaPhuong_New"("sDM_TinhId_New");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_code_key" ON "ql-nguoi-dung"."UserProfile"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_idCardNumber_key" ON "ql-nguoi-dung"."UserProfile"("idCardNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HocHam_code_key" ON "ql-ho-so"."HocHam"("code");

-- CreateIndex
CREATE UNIQUE INDEX "HocVi_code_key" ON "ql-ho-so"."HocVi"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Relative_code_key" ON "ql-ho-so"."Relative"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrinhDoLyLuanChinhTri_code_key" ON "ql-ho-so"."TrinhDoLyLuanChinhTri"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrinhDoQuanLyNhaNuoc_code_key" ON "ql-ho-so"."TrinhDoQuanLyNhaNuoc"("code");

-- CreateIndex
CREATE UNIQUE INDEX "NgoaiNgu_code_key" ON "ql-ho-so"."NgoaiNgu"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TinHoc_code_key" ON "ql-ho-so"."TinHoc"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BoiDuongQuocPhongAnNinh_code_key" ON "ql-ho-so"."BoiDuongQuocPhongAnNinh"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CapBac_code_key" ON "ql-ho-so"."CapBac"("code");

-- CreateIndex
CREATE UNIQUE INDEX "QuaTrinhCongTac_code_key" ON "ql-ho-so"."QuaTrinhCongTac"("code");

-- CreateIndex
CREATE UNIQUE INDEX "QuaTrinhCuDiCongTac_code_key" ON "ql-ho-so"."QuaTrinhCuDiCongTac"("code");

-- CreateIndex
CREATE UNIQUE INDEX "QuaTrinhCuDiDaoTao_code_key" ON "ql-ho-so"."QuaTrinhCuDiDaoTao"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KhenThuong_code_key" ON "ql-ho-so"."KhenThuong"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KyLuat_code_key" ON "ql-ho-so"."KyLuat"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DoiTuongChinhSach_code_key" ON "ql-ho-so"."DoiTuongChinhSach"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KeKhaiTaiSan_code_key" ON "ql-ho-so"."KeKhaiTaiSan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TiengDanToc_code_key" ON "ql-ho-so"."TiengDanToc"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ChienDau_code_key" ON "ql-ho-so"."ChienDau"("code");

-- CreateIndex
CREATE UNIQUE INDEX "NuocNgoai_code_key" ON "ql-ho-so"."NuocNgoai"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ThuongTat_code_key" ON "ql-ho-so"."ThuongTat"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DanhHieu_code_key" ON "ql-ho-so"."DanhHieu"("code");

-- CreateIndex
CREATE UNIQUE INDEX "QuaTrinhHocTap_code_key" ON "ql-ho-so"."QuaTrinhHocTap"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ToChucXaHoi_code_key" ON "ql-ho-so"."ToChucXaHoi"("code");

-- CreateIndex
CREATE UNIQUE INDEX "QuaTrinhLuong_code_key" ON "ql-ho-so"."QuaTrinhLuong"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LecturerType_code_key" ON "ql-danh-muc"."LecturerType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LecturerType_name_key" ON "ql-danh-muc"."LecturerType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StaffType_code_key" ON "ql-danh-muc"."StaffType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StaffType_name_key" ON "ql-danh-muc"."StaffType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StaffPosition_code_key" ON "ql-danh-muc"."StaffPosition"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_code_key" ON "ql-dao-tao"."Lecturer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_lectureID_key" ON "ql-dao-tao"."Lecturer"("lectureID");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_userProfileId_key" ON "ql-dao-tao"."Lecturer"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "LecturerHistory_code_key" ON "ql-dao-tao"."LecturerHistory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LecturerHistory_userProfileId_key" ON "ql-dao-tao"."LecturerHistory"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchProject_code_key" ON "ql-dao-tao"."ResearchProject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentResearchRegistration_code_key" ON "ql-dao-tao"."StudentResearchRegistration"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentResearchRegistration_studentId_researchProjectId_key" ON "ql-dao-tao"."StudentResearchRegistration"("studentId", "researchProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ThesisProject_code_key" ON "ql-dao-tao"."ThesisProject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DefenseSession_code_key" ON "ql-dao-tao"."DefenseSession"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentThesisRegistration_code_key" ON "ql-dao-tao"."StudentThesisRegistration"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentThesisRegistration_studentId_thesisProjectId_key" ON "ql-dao-tao"."StudentThesisRegistration"("studentId", "thesisProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertProfile_code_key" ON "ql-dao-tao"."ExpertProfile"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertProfile_lecturerId_key" ON "ql-dao-tao"."ExpertProfile"("lecturerId");

-- CreateIndex
CREATE UNIQUE INDEX "Decision_code_key" ON "ql-dao-tao"."Decision"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_code_key" ON "ql-dao-tao"."Invitation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_councilMemberId_key" ON "ql-dao-tao"."Invitation"("councilMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "Council_code_key" ON "ql-dao-tao"."Council"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Council_studentThesisRegistrationId_key" ON "ql-dao-tao"."Council"("studentThesisRegistrationId");

-- CreateIndex
CREATE UNIQUE INDEX "CouncilMember_code_key" ON "ql-dao-tao"."CouncilMember"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CouncilMember_councilId_expertId_key" ON "ql-dao-tao"."CouncilMember"("councilId", "expertId");

-- CreateIndex
CREATE UNIQUE INDEX "DefenseRecord_code_key" ON "ql-dao-tao"."DefenseRecord"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DefenseRecord_thesisId_key" ON "ql-dao-tao"."DefenseRecord"("thesisId");

-- CreateIndex
CREATE UNIQUE INDEX "LibrarySubmission_code_key" ON "ql-dao-tao"."LibrarySubmission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LibrarySubmission_thesisId_key" ON "ql-dao-tao"."LibrarySubmission"("thesisId");

-- CreateIndex
CREATE UNIQUE INDEX "DefaultCouncilRolePayAmount_code_key" ON "ql-dao-tao"."DefaultCouncilRolePayAmount"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DefaultCouncilRolePayAmount_role_key" ON "ql-dao-tao"."DefaultCouncilRolePayAmount"("role");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_code_key" ON "ql-dao-tao"."PaymentRecord"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_councilMemberId_key" ON "ql-dao-tao"."PaymentRecord"("councilMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "SupervisorPaymentRecord_code_key" ON "ql-dao-tao"."SupervisorPaymentRecord"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentFile_code_key" ON "ql-danh-muc"."DocumentFile"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentFile_diplomaFrontId_key" ON "ql-danh-muc"."DocumentFile"("diplomaFrontId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentFile_diplomaBackId_key" ON "ql-danh-muc"."DocumentFile"("diplomaBackId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentFile_diplomaVerificationId_key" ON "ql-danh-muc"."DocumentFile"("diplomaVerificationId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentFile_diplomaVerificationFrontId_key" ON "ql-danh-muc"."DocumentFile"("diplomaVerificationFrontId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentFile_diplomaVerificationBackId_key" ON "ql-danh-muc"."DocumentFile"("diplomaVerificationBackId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicActionConfig_code_key" ON "ql-dao-tao"."AcademicActionConfig"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicActionConfig_trainingCourseId_name_key" ON "ql-dao-tao"."AcademicActionConfig"("trainingCourseId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicActionRuleSet_code_key" ON "ql-dao-tao"."AcademicActionRuleSet"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicActionCondition_code_key" ON "ql-dao-tao"."AcademicActionCondition"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAcademicDecision_code_key" ON "ql-dao-tao"."StudentAcademicDecision"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAcademicDecision_studentId_semesterId_schoolYearId_a_key" ON "ql-dao-tao"."StudentAcademicDecision"("studentId", "semesterId", "schoolYearId", "appliedConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingScoreSession_code_key" ON "ql-dao-tao"."TrainingScoreSession"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentTrainingScore_code_key" ON "ql-dao-tao"."StudentTrainingScore"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentTrainingScore_trainingScoreSessionId_studentId_key" ON "ql-dao-tao"."StudentTrainingScore"("trainingScoreSessionId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Scholarship_code_key" ON "ql-dao-tao"."Scholarship"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Scholarship_trainingCourseId_name_key" ON "ql-dao-tao"."Scholarship"("trainingCourseId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ScholarshipCriteria_code_key" ON "ql-dao-tao"."ScholarshipCriteria"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ScholarshipAward_code_key" ON "ql-dao-tao"."ScholarshipAward"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ScholarshipAward_studentId_scholarshipId_semesterId_key" ON "ql-dao-tao"."ScholarshipAward"("studentId", "scholarshipId", "semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationSession_code_key" ON "ql-dao-tao"."GraduationSession"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGraduationApplication_code_key" ON "ql-dao-tao"."StudentGraduationApplication"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGraduationApplication_studentId_sessionId_key" ON "ql-dao-tao"."StudentGraduationApplication"("studentId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationCheckResult_code_key" ON "ql-dao-tao"."ApplicationCheckResult"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationCheckResult_studentGraduationApplicationId_key" ON "ql-dao-tao"."ApplicationCheckResult"("studentGraduationApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationCheckResult_studentGraduationApplicationId_ranki_key" ON "ql-dao-tao"."ApplicationCheckResult"("studentGraduationApplicationId", "rankingConditionId");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationDecision_code_key" ON "ql-dao-tao"."GraduationDecision"("code");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationDecision_applicationId_key" ON "ql-dao-tao"."GraduationDecision"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationDecision_studentId_key" ON "ql-dao-tao"."GraduationDecision"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationDecision_originalDiplomaNumber_key" ON "ql-dao-tao"."GraduationDecision"("originalDiplomaNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationDecision_diplomaNumber_key" ON "ql-dao-tao"."GraduationDecision"("diplomaNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicRankingConvert_code_key" ON "ql-dao-tao"."AcademicRankingConvert"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicRankingConvert_trainingCourseId_context_rankOrder_key" ON "ql-dao-tao"."AcademicRankingConvert"("trainingCourseId", "context", "rankOrder");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationRankDowngradeRule_code_key" ON "ql-dao-tao"."GraduationRankDowngradeRule"("code");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationRankDowngradeRule_initialRankId_key" ON "ql-dao-tao"."GraduationRankDowngradeRule"("initialRankId");

-- CreateIndex
CREATE UNIQUE INDEX "GraduationRankDowngradeCondition_code_key" ON "ql-dao-tao"."GraduationRankDowngradeCondition"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RankingCondition_code_key" ON "ql-dao-tao"."RankingCondition"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DiplomaVerificationApplication_code_key" ON "ql-dao-tao"."DiplomaVerificationApplication"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Note_code_key" ON "ql-dao-tao"."Note"("code");

-- CreateIndex
CREATE UNIQUE INDEX "NoteFolder_code_key" ON "ql-dao-tao"."NoteFolder"("code");

-- CreateIndex
CREATE UNIQUE INDEX "NoteTag_code_key" ON "ql-dao-tao"."NoteTag"("code");

-- CreateIndex
CREATE UNIQUE INDEX "NoteTag_name_key" ON "ql-dao-tao"."NoteTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NoteReminder_code_key" ON "ql-dao-tao"."NoteReminder"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationPeriod_code_key" ON "khao-thi"."EvaluationPeriod"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StandardCatalog_code_key" ON "khao-thi"."StandardCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CriterionCatalog_code_key" ON "khao-thi"."CriterionCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RequirementCriterionCatalog_code_key" ON "khao-thi"."RequirementCriterionCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreScaleCatalog_code_key" ON "khao-thi"."ScoreScaleCatalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationStandard_code_key" ON "khao-thi"."EvaluationStandard"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationCriterion_code_key" ON "khao-thi"."EvaluationCriterion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationCriterion_standardId_name_key" ON "khao-thi"."EvaluationCriterion"("standardId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceCategory_code_key" ON "khao-thi"."EvidenceCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Evidence_code_key" ON "khao-thi"."Evidence"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RequirementCriterion_code_key" ON "khao-thi"."RequirementCriterion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisFormEvidence_code_key" ON "khao-thi"."AnalysisFormEvidence"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisFormEvidence_requirementCriterionId_evidenceId_key" ON "khao-thi"."AnalysisFormEvidence"("requirementCriterionId", "evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationCouncil_code_key" ON "khao-thi"."EvaluationCouncil"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationCouncilMember_code_key" ON "khao-thi"."EvaluationCouncilMember"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceFile_code_key" ON "khao-thi"."EvidenceFile"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyObjectType_code_key" ON "khao-thi"."SurveyObjectType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyTopic_code_key" ON "khao-thi"."SurveyTopic"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyQuestionGroup_code_key" ON "khao-thi"."SurveyQuestionGroup"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Survey_code_key" ON "khao-thi"."Survey"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyQuestion_code_key" ON "khao-thi"."SurveyQuestion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyChoice_code_key" ON "khao-thi"."SurveyChoice"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveySession_code_key" ON "khao-thi"."SurveySession"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveySession_surveyId_studentId_key" ON "khao-thi"."SurveySession"("surveyId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_code_key" ON "khao-thi"."SurveyResponse"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_surveySessionId_surveyQuestionId_key" ON "khao-thi"."SurveyResponse"("surveySessionId", "surveyQuestionId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_code_key" ON "ql-dao-tao"."Staff"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userProfileId_key" ON "ql-dao-tao"."Staff"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffHistory_code_key" ON "ql-dao-tao"."StaffHistory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StaffHistory_userProfileId_key" ON "ql-dao-tao"."StaffHistory"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TrinhDoHocVan_code_key" ON "ql-ho-so"."DM_TrinhDoHocVan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TrinhDoHocVan_name_key" ON "ql-ho-so"."DM_TrinhDoHocVan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TrinhDoLyLuanChinhTri_code_key" ON "ql-ho-so"."DM_TrinhDoLyLuanChinhTri"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TrinhDoLyLuanChinhTri_name_key" ON "ql-ho-so"."DM_TrinhDoLyLuanChinhTri"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TrinhDoQuanLyNhaNuoc_code_key" ON "ql-ho-so"."DM_TrinhDoQuanLyNhaNuoc"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TrinhDoQuanLyNhaNuoc_name_key" ON "ql-ho-so"."DM_TrinhDoQuanLyNhaNuoc"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TinhTrangHonNhan_code_key" ON "ql-ho-so"."DM_TinhTrangHonNhan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TinhTrangHonNhan_name_key" ON "ql-ho-so"."DM_TinhTrangHonNhan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TrangThaiLamViec_code_key" ON "ql-ho-so"."DM_TrangThaiLamViec"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TrangThaiLamViec_name_key" ON "ql-ho-so"."DM_TrangThaiLamViec"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_HinhThucKhenThuongChinhQuyen_code_key" ON "ql-ho-so"."DM_HinhThucKhenThuongChinhQuyen"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_HinhThucKhenThuongChinhQuyen_name_key" ON "ql-ho-so"."DM_HinhThucKhenThuongChinhQuyen"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_HinhThucKhenThuongDang_code_key" ON "ql-ho-so"."DM_HinhThucKhenThuongDang"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_HinhThucKhenThuongDang_name_key" ON "ql-ho-so"."DM_HinhThucKhenThuongDang"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_XepLoaiDanhGiaCanBo_code_key" ON "ql-ho-so"."DM_XepLoaiDanhGiaCanBo"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_XepLoaiDanhGiaCanBo_name_key" ON "ql-ho-so"."DM_XepLoaiDanhGiaCanBo"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_XepLoaiDanhGiaChatLuongDangVien_code_key" ON "ql-ho-so"."DM_XepLoaiDanhGiaChatLuongDangVien"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_XepLoaiDanhGiaChatLuongDangVien_name_key" ON "ql-ho-so"."DM_XepLoaiDanhGiaChatLuongDangVien"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_LoaiHinhCongTac_code_key" ON "ql-ho-so"."DM_LoaiHinhCongTac"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_LoaiHinhCongTac_name_key" ON "ql-ho-so"."DM_LoaiHinhCongTac"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TinhTrangCongTac_code_key" ON "ql-ho-so"."DM_TinhTrangCongTac"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TinhTrangCongTac_name_key" ON "ql-ho-so"."DM_TinhTrangCongTac"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_LoaiHinhDiHocTap_code_key" ON "ql-ho-so"."DM_LoaiHinhDiHocTap"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_LoaiHinhDiHocTap_name_key" ON "ql-ho-so"."DM_LoaiHinhDiHocTap"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TinhTrangDiHocTap_code_key" ON "ql-ho-so"."DM_TinhTrangDiHocTap"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TinhTrangDiHocTap_name_key" ON "ql-ho-so"."DM_TinhTrangDiHocTap"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NuocCuDiHocTap_code_key" ON "ql-ho-so"."DM_NuocCuDiHocTap"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NuocCuDiHocTap_name_key" ON "ql-ho-so"."DM_NuocCuDiHocTap"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChucDanhCMNVGiangVien_code_key" ON "ql-ho-so"."DM_ChucDanhCMNVGiangVien"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChucDanhCMNVGiangVien_name_key" ON "ql-ho-so"."DM_ChucDanhCMNVGiangVien"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChucDanhCMNVNghienCuuVien_code_key" ON "ql-ho-so"."DM_ChucDanhCMNVNghienCuuVien"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChucDanhCMNVNghienCuuVien_name_key" ON "ql-ho-so"."DM_ChucDanhCMNVNghienCuuVien"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChucDanhCMNVKySu_code_key" ON "ql-ho-so"."DM_ChucDanhCMNVKySu"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChucDanhCMNVKySu_name_key" ON "ql-ho-so"."DM_ChucDanhCMNVKySu"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TruongDaoTaoBacDH_code_key" ON "ql-ho-so"."DM_TruongDaoTaoBacDH"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TruongDaoTaoBacDH_name_key" ON "ql-ho-so"."DM_TruongDaoTaoBacDH"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChuyenNganhDaoTaoBacDH_code_key" ON "ql-ho-so"."DM_ChuyenNganhDaoTaoBacDH"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChuyenNganhDaoTaoBacDH_name_key" ON "ql-ho-so"."DM_ChuyenNganhDaoTaoBacDH"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChiHuyQuanLy_code_key" ON "ql-ho-so"."DM_ChiHuyQuanLy"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChiHuyQuanLy_name_key" ON "ql-ho-so"."DM_ChiHuyQuanLy"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChuyenMonKyThuat_code_key" ON "ql-ho-so"."DM_ChuyenMonKyThuat"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChuyenMonKyThuat_name_key" ON "ql-ho-so"."DM_ChuyenMonKyThuat"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_SucKhoe_code_key" ON "ql-ho-so"."DM_SucKhoe"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_SucKhoe_name_key" ON "ql-ho-so"."DM_SucKhoe"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NhomMau_code_key" ON "ql-ho-so"."DM_NhomMau"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NhomMau_name_key" ON "ql-ho-so"."DM_NhomMau"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_LoaiThuongTat_code_key" ON "ql-ho-so"."DM_LoaiThuongTat"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_LoaiThuongTat_name_key" ON "ql-ho-so"."DM_LoaiThuongTat"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NganhHoc_code_key" ON "ql-ho-so"."DM_NganhHoc"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NganhHoc_name_key" ON "ql-ho-so"."DM_NganhHoc"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ToChucXaHoi_code_key" ON "ql-ho-so"."DM_ToChucXaHoi"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ToChucXaHoi_name_key" ON "ql-ho-so"."DM_ToChucXaHoi"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_Ngach_code_key" ON "ql-ho-so"."DM_Ngach"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_Ngach_name_key" ON "ql-ho-so"."DM_Ngach"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DM_BacLuong_code_key" ON "ql-ho-so"."DM_BacLuong"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DM_BacLuong_name_key" ON "ql-ho-so"."DM_BacLuong"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_code_key" ON "ql-nguoi-dung"."Feedback"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicWarningRule_code_key" ON "ql-dao-tao"."AcademicWarningRule"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicWarning_code_key" ON "ql-dao-tao"."AcademicWarning"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DisciplinaryWarning_code_key" ON "ql-dao-tao"."DisciplinaryWarning"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DisciplinaryWarningReason_code_key" ON "ql-dao-tao"."DisciplinaryWarningReason"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DisciplinaryWarningReason_name_key" ON "ql-dao-tao"."DisciplinaryWarningReason"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateFile_code_key" ON "ql-danh-muc"."TemplateFile"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateFile_path_key" ON "ql-danh-muc"."TemplateFile"("path");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedIp_code_key" ON "ql-nguoi-dung"."BlockedIp"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedIp_ipAddress_key" ON "ql-nguoi-dung"."BlockedIp"("ipAddress");

-- CreateIndex
CREATE INDEX "_ExamToRoom_B_index" ON "khao-thi"."_ExamToRoom"("B");

-- CreateIndex
CREATE INDEX "_FixedClassToSubjectClass_B_index" ON "ql-dao-tao"."_FixedClassToSubjectClass"("B");

-- CreateIndex
CREATE INDEX "_FixedClassToNotification_B_index" ON "ql-dao-tao"."_FixedClassToNotification"("B");

-- CreateIndex
CREATE INDEX "_FixedClassToSurveyObjectType_B_index" ON "ql-dao-tao"."_FixedClassToSurveyObjectType"("B");

-- CreateIndex
CREATE INDEX "_PrerequisiteSubject_B_index" ON "ql-dao-tao"."_PrerequisiteSubject"("B");

-- CreateIndex
CREATE INDEX "_CoRequisiteSubject_B_index" ON "ql-dao-tao"."_CoRequisiteSubject"("B");

-- CreateIndex
CREATE INDEX "_SubjectClassToSurveyObjectType_B_index" ON "ql-dao-tao"."_SubjectClassToSurveyObjectType"("B");

-- CreateIndex
CREATE INDEX "_PriorityObjectToStudent_B_index" ON "ql-dao-tao"."_PriorityObjectToStudent"("B");

-- CreateIndex
CREATE INDEX "_DefenseRooms_B_index" ON "ql-dao-tao"."_DefenseRooms"("B");

-- CreateIndex
CREATE INDEX "_NotificationToTrainingCourse_B_index" ON "ql-danh-muc"."_NotificationToTrainingCourse"("B");

-- CreateIndex
CREATE INDEX "_NotificationToStudent_B_index" ON "ql-danh-muc"."_NotificationToStudent"("B");

-- CreateIndex
CREATE INDEX "_GroupToRole_B_index" ON "ql-nguoi-dung"."_GroupToRole"("B");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "ql-nguoi-dung"."_PermissionToRole"("B");

-- CreateIndex
CREATE INDEX "_DM_DonViToSurveyObjectType_B_index" ON "mta"."_DM_DonViToSurveyObjectType"("B");

-- CreateIndex
CREATE INDEX "_ExpertProfileToTrainingMajor_B_index" ON "ql-dao-tao"."_ExpertProfileToTrainingMajor"("B");

-- CreateIndex
CREATE INDEX "_ExpertProfileToSubjectClass_B_index" ON "ql-dao-tao"."_ExpertProfileToSubjectClass"("B");

-- CreateIndex
CREATE INDEX "_NoteToNoteTag_B_index" ON "ql-dao-tao"."_NoteToNoteTag"("B");

-- CreateIndex
CREATE INDEX "_SurveyObjectTypeToTrainingField_B_index" ON "khao-thi"."_SurveyObjectTypeToTrainingField"("B");

-- CreateIndex
CREATE INDEX "_SurveyObjectTypeToTrainingMajor_B_index" ON "khao-thi"."_SurveyObjectTypeToTrainingMajor"("B");

-- CreateIndex
CREATE INDEX "_SurveyObjectTypeToTrainingCourse_B_index" ON "khao-thi"."_SurveyObjectTypeToTrainingCourse"("B");

-- CreateIndex
CREATE INDEX "_SurveyToSurveyObjectType_B_index" ON "khao-thi"."_SurveyToSurveyObjectType"("B");

-- CreateIndex
CREATE INDEX "_AcademicWarningToAcademicWarningRule_B_index" ON "ql-dao-tao"."_AcademicWarningToAcademicWarningRule"("B");

-- CreateIndex
CREATE INDEX "_DisciplinaryWarningToDisciplinaryWarningReason_B_index" ON "ql-dao-tao"."_DisciplinaryWarningToDisciplinaryWarningReason"("B");

-- AddForeignKey
ALTER TABLE "khao-thi"."QuestionBank" ADD CONSTRAINT "QuestionBank_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."KnowledgeBlock" ADD CONSTRAINT "KnowledgeBlock_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Question" ADD CONSTRAINT "Question_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "khao-thi"."QuestionBank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Question" ADD CONSTRAINT "Question_knowledgeBlockId_fkey" FOREIGN KEY ("knowledgeBlockId") REFERENCES "khao-thi"."KnowledgeBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Question" ADD CONSTRAINT "Question_difficultyId_fkey" FOREIGN KEY ("difficultyId") REFERENCES "khao-thi"."Difficulty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Answer" ADD CONSTRAINT "Answer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "khao-thi"."ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "khao-thi"."Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Exam" ADD CONSTRAINT "Exam_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "khao-thi"."QuestionBank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."TestStructureRule" ADD CONSTRAINT "TestStructureRule_examId_fkey" FOREIGN KEY ("examId") REFERENCES "khao-thi"."Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."TestStructureRule" ADD CONSTRAINT "TestStructureRule_knowledgeBlockId_fkey" FOREIGN KEY ("knowledgeBlockId") REFERENCES "khao-thi"."KnowledgeBlock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamBank" ADD CONSTRAINT "ExamBank_examId_fkey" FOREIGN KEY ("examId") REFERENCES "khao-thi"."Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamBankQuestion" ADD CONSTRAINT "ExamBankQuestion_examBankId_fkey" FOREIGN KEY ("examBankId") REFERENCES "khao-thi"."ExamBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamBankQuestion" ADD CONSTRAINT "ExamBankQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "khao-thi"."Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamFax" ADD CONSTRAINT "ExamFax_examId_fkey" FOREIGN KEY ("examId") REFERENCES "khao-thi"."Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamSession" ADD CONSTRAINT "ExamSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamSession" ADD CONSTRAINT "ExamSession_examId_fkey" FOREIGN KEY ("examId") REFERENCES "khao-thi"."Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamSession" ADD CONSTRAINT "ExamSession_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ql-dao-tao"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamSession" ADD CONSTRAINT "ExamSession_examBankId_fkey" FOREIGN KEY ("examBankId") REFERENCES "khao-thi"."ExamBank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."ExamSession" ADD CONSTRAINT "ExamSession_examFaxId_fkey" FOREIGN KEY ("examFaxId") REFERENCES "khao-thi"."ExamFax"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentSubjectScore" ADD CONSTRAINT "StudentSubjectScore_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentSubjectScore" ADD CONSTRAINT "StudentSubjectScore_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentSubjectScore" ADD CONSTRAINT "StudentSubjectScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ArchivedCertificateOnStudentSubjectScore" ADD CONSTRAINT "ArchivedCertificateOnStudentSubjectScore_studentSubjectSco_fkey" FOREIGN KEY ("studentSubjectScoreId") REFERENCES "ql-dao-tao"."StudentSubjectScore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ArchivedCertificateOnStudentSubjectScore" ADD CONSTRAINT "ArchivedCertificateOnStudentSubjectScore_archivedCertifica_fkey" FOREIGN KEY ("archivedCertificateId") REFERENCES "ql-dao-tao"."ArchivedCertificate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ArchivedAwardOnStudentSubjectScore" ADD CONSTRAINT "ArchivedAwardOnStudentSubjectScore_studentSubjectScoreId_fkey" FOREIGN KEY ("studentSubjectScoreId") REFERENCES "ql-dao-tao"."StudentSubjectScore"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ArchivedAwardOnStudentSubjectScore" ADD CONSTRAINT "ArchivedAwardOnStudentSubjectScore_archivedAwardId_fkey" FOREIGN KEY ("archivedAwardId") REFERENCES "ql-dao-tao"."ArchivedAward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Semester" ADD CONSTRAINT "Semester_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "ql-dao-tao"."SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Milestone" ADD CONSTRAINT "Milestone_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "ql-dao-tao"."SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingCourse" ADD CONSTRAINT "TrainingCourse_semesterStartId_fkey" FOREIGN KEY ("semesterStartId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingCourse" ADD CONSTRAINT "TrainingCourse_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" ADD CONSTRAINT "FixedClass_classMonitorId_fkey" FOREIGN KEY ("classMonitorId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" ADD CONSTRAINT "FixedClass_unionLeaderId_fkey" FOREIGN KEY ("unionLeaderId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" ADD CONSTRAINT "FixedClass_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" ADD CONSTRAINT "FixedClass_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" ADD CONSTRAINT "FixedClass_lecturerManagementId_fkey" FOREIGN KEY ("lecturerManagementId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" ADD CONSTRAINT "FixedClass_staffManagementId_fkey" FOREIGN KEY ("staffManagementId") REFERENCES "ql-dao-tao"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" ADD CONSTRAINT "FixedClass_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "ql-dao-tao"."CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Curriculum" ADD CONSTRAINT "Curriculum_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Curriculum" ADD CONSTRAINT "Curriculum_trainingMajorId_fkey" FOREIGN KEY ("trainingMajorId") REFERENCES "ql-dao-tao"."TrainingMajor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersion" ADD CONSTRAINT "CurriculumVersion_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "ql-dao-tao"."Curriculum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersion" ADD CONSTRAINT "CurriculumVersion_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersion" ADD CONSTRAINT "CurriculumVersion_trainingLevelId_fkey" FOREIGN KEY ("trainingLevelId") REFERENCES "ql-dao-tao"."TrainingLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersion" ADD CONSTRAINT "CurriculumVersion_trainingTimeId_fkey" FOREIGN KEY ("trainingTimeId") REFERENCES "ql-dao-tao"."TrainingTime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersion" ADD CONSTRAINT "CurriculumVersion_diplomaTypeId_fkey" FOREIGN KEY ("diplomaTypeId") REFERENCES "ql-dao-tao"."DiplomaType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Subject" ADD CONSTRAINT "Subject_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectVersion" ADD CONSTRAINT "SubjectVersion_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectVersion" ADD CONSTRAINT "SubjectVersion_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectInGroup" ADD CONSTRAINT "SubjectInGroup_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectInGroup" ADD CONSTRAINT "SubjectInGroup_equivalencyGroupId_fkey" FOREIGN KEY ("equivalencyGroupId") REFERENCES "ql-dao-tao"."EquivalencyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingBlockSubject" ADD CONSTRAINT "TrainingBlockSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingBlockSubject" ADD CONSTRAINT "TrainingBlockSubject_trainingBlockOnCurriculumVersionId_fkey" FOREIGN KEY ("trainingBlockOnCurriculumVersionId") REFERENCES "ql-dao-tao"."TrainingBlockOnCurriculumVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD CONSTRAINT "SubjectClass_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD CONSTRAINT "SubjectClass_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD CONSTRAINT "SubjectClass_examId_fkey" FOREIGN KEY ("examId") REFERENCES "khao-thi"."Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD CONSTRAINT "SubjectClass_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ql-dao-tao"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD CONSTRAINT "SubjectClass_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD CONSTRAINT "SubjectClass_extraLecturerId_fkey" FOREIGN KEY ("extraLecturerId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD CONSTRAINT "SubjectClass_enterGradeLecturerId_fkey" FOREIGN KEY ("enterGradeLecturerId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ClassSchedule" ADD CONSTRAINT "ClassSchedule_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ClassSchedule" ADD CONSTRAINT "ClassSchedule_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ql-dao-tao"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ClassSchedule" ADD CONSTRAINT "ClassSchedule_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ClassSchedule" ADD CONSTRAINT "ClassSchedule_originalScheduleId_fkey" FOREIGN KEY ("originalScheduleId") REFERENCES "ql-dao-tao"."ClassSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Building" ADD CONSTRAINT "Building_trainingLocationId_fkey" FOREIGN KEY ("trainingLocationId") REFERENCES "ql-dao-tao"."TrainingLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Room" ADD CONSTRAINT "Room_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "ql-dao-tao"."Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingField" ADD CONSTRAINT "TrainingField_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingFieldOnTrainingObjectType" ADD CONSTRAINT "TrainingFieldOnTrainingObjectType_trainingFieldId_fkey" FOREIGN KEY ("trainingFieldId") REFERENCES "ql-dao-tao"."TrainingField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingFieldOnTrainingObjectType" ADD CONSTRAINT "TrainingFieldOnTrainingObjectType_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingMajor" ADD CONSTRAINT "TrainingMajor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingMajor" ADD CONSTRAINT "TrainingMajor_trainingFieldId_fkey" FOREIGN KEY ("trainingFieldId") REFERENCES "ql-dao-tao"."TrainingField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingMajorOnTrainingObjectType" ADD CONSTRAINT "TrainingMajorOnTrainingObjectType_trainingMajorId_fkey" FOREIGN KEY ("trainingMajorId") REFERENCES "ql-dao-tao"."TrainingMajor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingMajorOnTrainingObjectType" ADD CONSTRAINT "TrainingMajorOnTrainingObjectType_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingBlockOnCurriculumVersion" ADD CONSTRAINT "TrainingBlockOnCurriculumVersion_trainingBlockId_fkey" FOREIGN KEY ("trainingBlockId") REFERENCES "ql-dao-tao"."TrainingBlock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingBlockOnCurriculumVersion" ADD CONSTRAINT "TrainingBlockOnCurriculumVersion_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "ql-dao-tao"."CurriculumVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ScoreConvert" ADD CONSTRAINT "ScoreConvert_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_trainingLocationId_fkey" FOREIGN KEY ("trainingLocationId") REFERENCES "ql-dao-tao"."TrainingLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_fixedClassId_fkey" FOREIGN KEY ("fixedClassId") REFERENCES "ql-dao-tao"."FixedClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_trainingLevelId_fkey" FOREIGN KEY ("trainingLevelId") REFERENCES "ql-dao-tao"."TrainingLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_trainingTypeId_fkey" FOREIGN KEY ("trainingTypeId") REFERENCES "ql-dao-tao"."TrainingType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_trainingFormId_fkey" FOREIGN KEY ("trainingFormId") REFERENCES "ql-dao-tao"."TrainingForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_registrationAreaId_fkey" FOREIGN KEY ("registrationAreaId") REFERENCES "mta"."DM_KhuVuc_DiaLy"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "ql-dao-tao"."CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentSemesterResult" ADD CONSTRAINT "StudentSemesterResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentSemesterResult" ADD CONSTRAINT "StudentSemesterResult_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentYearResult" ADD CONSTRAINT "StudentYearResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentYearResult" ADD CONSTRAINT "StudentYearResult_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "ql-dao-tao"."SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."Notification" ADD CONSTRAINT "Notification_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "mta"."DM_NhanVien"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "mta"."DM_NhanVien"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."Document" ADD CONSTRAINT "Document_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "mta"."DM_NhanVien"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."FAQ" ADD CONSTRAINT "FAQ_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "mta"."DM_NhanVien"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."FAQ" ADD CONSTRAINT "FAQ_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "mta"."DM_NhanVien"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "mta"."DM_NhanVien"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "tro-ly-ao"."Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mta"."DM_NhanVien" ADD CONSTRAINT "DM_NhanVien_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ql-nguoi-dung"."Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ql-nguoi-dung"."Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_provinceCurrentAddressId_fkey" FOREIGN KEY ("provinceCurrentAddressId") REFERENCES "mta"."DM_Tinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_districtCurrentAddressId_fkey" FOREIGN KEY ("districtCurrentAddressId") REFERENCES "mta"."DM_QuanHuyen"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_communeCurrentAddressId_fkey" FOREIGN KEY ("communeCurrentAddressId") REFERENCES "mta"."DM_XaPhuong"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_newProvinceCurrentAddressId_fkey" FOREIGN KEY ("newProvinceCurrentAddressId") REFERENCES "mta"."DM_Tinh_New"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_newCommuneCurrentAddressId_fkey" FOREIGN KEY ("newCommuneCurrentAddressId") REFERENCES "mta"."DM_XaPhuong_New"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_provinceOfBirthId_fkey" FOREIGN KEY ("provinceOfBirthId") REFERENCES "mta"."DM_Tinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_districtOfBirthId_fkey" FOREIGN KEY ("districtOfBirthId") REFERENCES "mta"."DM_QuanHuyen"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_communeOfBirthId_fkey" FOREIGN KEY ("communeOfBirthId") REFERENCES "mta"."DM_XaPhuong"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_newProvinceOfBirthId_fkey" FOREIGN KEY ("newProvinceOfBirthId") REFERENCES "mta"."DM_Tinh_New"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_newCommuneOfBirthId_fkey" FOREIGN KEY ("newCommuneOfBirthId") REFERENCES "mta"."DM_XaPhuong_New"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "mta"."DM_GioiTinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_provincePermanentAddressId_fkey" FOREIGN KEY ("provincePermanentAddressId") REFERENCES "mta"."DM_Tinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_districtPermanentAddressId_fkey" FOREIGN KEY ("districtPermanentAddressId") REFERENCES "mta"."DM_QuanHuyen"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_communePermanentAddressId_fkey" FOREIGN KEY ("communePermanentAddressId") REFERENCES "mta"."DM_XaPhuong"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_newProvincePermanentAddressId_fkey" FOREIGN KEY ("newProvincePermanentAddressId") REFERENCES "mta"."DM_Tinh_New"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_newCommunePermanentAddressId_fkey" FOREIGN KEY ("newCommunePermanentAddressId") REFERENCES "mta"."DM_XaPhuong_New"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_nationalityId_fkey" FOREIGN KEY ("nationalityId") REFERENCES "mta"."DM_QuocGia"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_religionId_fkey" FOREIGN KEY ("religionId") REFERENCES "mta"."DM_TonGiao"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_ethnicityId_fkey" FOREIGN KEY ("ethnicityId") REFERENCES "mta"."DM_DanToc"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_provinceHometownId_fkey" FOREIGN KEY ("provinceHometownId") REFERENCES "mta"."DM_Tinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_districtHometownId_fkey" FOREIGN KEY ("districtHometownId") REFERENCES "mta"."DM_QuanHuyen"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_communeHometownId_fkey" FOREIGN KEY ("communeHometownId") REFERENCES "mta"."DM_XaPhuong"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_newProvinceHometownId_fkey" FOREIGN KEY ("newProvinceHometownId") REFERENCES "mta"."DM_Tinh_New"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_newCommuneHometownId_fkey" FOREIGN KEY ("newCommuneHometownId") REFERENCES "mta"."DM_XaPhuong_New"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "mta"."DM_CapBac"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_academicDegreeTypeId_fkey" FOREIGN KEY ("academicDegreeTypeId") REFERENCES "mta"."DM_HocVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_academicRankTypeId_fkey" FOREIGN KEY ("academicRankTypeId") REFERENCES "mta"."DM_HocHam"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "mta"."DM_ChucDanh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_chiHuyQuanLyId_fkey" FOREIGN KEY ("chiHuyQuanLyId") REFERENCES "ql-ho-so"."DM_ChiHuyQuanLy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_chuyenMonKyThuatId_fkey" FOREIGN KEY ("chuyenMonKyThuatId") REFERENCES "ql-ho-so"."DM_ChuyenMonKyThuat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_sucKhoeId_fkey" FOREIGN KEY ("sucKhoeId") REFERENCES "ql-ho-so"."DM_SucKhoe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_nhomMauId_fkey" FOREIGN KEY ("nhomMauId") REFERENCES "ql-ho-so"."DM_NhomMau"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_positionCPVId_fkey" FOREIGN KEY ("positionCPVId") REFERENCES "mta"."DM_ChucVu"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_trinhDoHocVanId_fkey" FOREIGN KEY ("trinhDoHocVanId") REFERENCES "ql-ho-so"."DM_TrinhDoHocVan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."HocHam" ADD CONSTRAINT "HocHam_academicRankTypeId_fkey" FOREIGN KEY ("academicRankTypeId") REFERENCES "mta"."DM_HocHam"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."HocHam" ADD CONSTRAINT "HocHam_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."HocVi" ADD CONSTRAINT "HocVi_academicDegreeTypeId_fkey" FOREIGN KEY ("academicDegreeTypeId") REFERENCES "mta"."DM_HocVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."HocVi" ADD CONSTRAINT "HocVi_nationalityId_fkey" FOREIGN KEY ("nationalityId") REFERENCES "mta"."DM_QuocGia"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."HocVi" ADD CONSTRAINT "HocVi_truongId_fkey" FOREIGN KEY ("truongId") REFERENCES "ql-ho-so"."DM_TruongDaoTaoBacDH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."HocVi" ADD CONSTRAINT "HocVi_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."Relative" ADD CONSTRAINT "Relative_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."TrinhDoLyLuanChinhTri" ADD CONSTRAINT "TrinhDoLyLuanChinhTri_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."TrinhDoLyLuanChinhTri" ADD CONSTRAINT "TrinhDoLyLuanChinhTri_trinhDoId_fkey" FOREIGN KEY ("trinhDoId") REFERENCES "ql-ho-so"."DM_TrinhDoLyLuanChinhTri"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."TrinhDoQuanLyNhaNuoc" ADD CONSTRAINT "TrinhDoQuanLyNhaNuoc_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."TrinhDoQuanLyNhaNuoc" ADD CONSTRAINT "TrinhDoQuanLyNhaNuoc_trinhDoId_fkey" FOREIGN KEY ("trinhDoId") REFERENCES "ql-ho-so"."DM_TrinhDoQuanLyNhaNuoc"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."NgoaiNgu" ADD CONSTRAINT "NgoaiNgu_ngonNguId_fkey" FOREIGN KEY ("ngonNguId") REFERENCES "mta"."DM_NgoaiNgu"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."NgoaiNgu" ADD CONSTRAINT "NgoaiNgu_trinhDoId_fkey" FOREIGN KEY ("trinhDoId") REFERENCES "mta"."DM_TrinhDoNgoaiNgu"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."NgoaiNgu" ADD CONSTRAINT "NgoaiNgu_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."TinHoc" ADD CONSTRAINT "TinHoc_dM_TrinhDoTinHocId_fkey" FOREIGN KEY ("dM_TrinhDoTinHocId") REFERENCES "mta"."DM_TrinhDoTinHoc"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."TinHoc" ADD CONSTRAINT "TinHoc_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."BoiDuongQuocPhongAnNinh" ADD CONSTRAINT "BoiDuongQuocPhongAnNinh_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."CapBac" ADD CONSTRAINT "CapBac_capBacId_fkey" FOREIGN KEY ("capBacId") REFERENCES "mta"."DM_CapBac"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."CapBac" ADD CONSTRAINT "CapBac_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."QuaTrinhCongTac" ADD CONSTRAINT "QuaTrinhCongTac_chucVuId_fkey" FOREIGN KEY ("chucVuId") REFERENCES "mta"."DM_ChucVu"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."QuaTrinhCongTac" ADD CONSTRAINT "QuaTrinhCongTac_loaiHinhCongTacId_fkey" FOREIGN KEY ("loaiHinhCongTacId") REFERENCES "ql-ho-so"."DM_LoaiHinhCongTac"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."QuaTrinhCongTac" ADD CONSTRAINT "QuaTrinhCongTac_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."QuaTrinhCuDiCongTac" ADD CONSTRAINT "QuaTrinhCuDiCongTac_chucVuId_fkey" FOREIGN KEY ("chucVuId") REFERENCES "mta"."DM_ChucVu"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."QuaTrinhCuDiCongTac" ADD CONSTRAINT "QuaTrinhCuDiCongTac_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."QuaTrinhCuDiDaoTao" ADD CONSTRAINT "QuaTrinhCuDiDaoTao_loaiId_fkey" FOREIGN KEY ("loaiId") REFERENCES "ql-ho-so"."DM_LoaiHinhDiHocTap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."QuaTrinhCuDiDaoTao" ADD CONSTRAINT "QuaTrinhCuDiDaoTao_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."KhenThuong" ADD CONSTRAINT "KhenThuong_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."KyLuat" ADD CONSTRAINT "KyLuat_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."DoiTuongChinhSach" ADD CONSTRAINT "DoiTuongChinhSach_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."KeKhaiTaiSan" ADD CONSTRAINT "KeKhaiTaiSan_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."TiengDanToc" ADD CONSTRAINT "TiengDanToc_danTocId_fkey" FOREIGN KEY ("danTocId") REFERENCES "mta"."DM_DanToc"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."TiengDanToc" ADD CONSTRAINT "TiengDanToc_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."ChienDau" ADD CONSTRAINT "ChienDau_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."NuocNgoai" ADD CONSTRAINT "NuocNgoai_tenNuocId_fkey" FOREIGN KEY ("tenNuocId") REFERENCES "mta"."DM_QuocGia"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."NuocNgoai" ADD CONSTRAINT "NuocNgoai_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."ThuongTat" ADD CONSTRAINT "ThuongTat_loaiId_fkey" FOREIGN KEY ("loaiId") REFERENCES "ql-ho-so"."DM_LoaiThuongTat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."ThuongTat" ADD CONSTRAINT "ThuongTat_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."DanhHieu" ADD CONSTRAINT "DanhHieu_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."QuaTrinhHocTap" ADD CONSTRAINT "QuaTrinhHocTap_tenTruongId_fkey" FOREIGN KEY ("tenTruongId") REFERENCES "ql-ho-so"."DM_TruongDaoTaoBacDH"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."QuaTrinhHocTap" ADD CONSTRAINT "QuaTrinhHocTap_nganhHocId_fkey" FOREIGN KEY ("nganhHocId") REFERENCES "ql-ho-so"."DM_NganhHoc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."QuaTrinhHocTap" ADD CONSTRAINT "QuaTrinhHocTap_chuyenNganhId_fkey" FOREIGN KEY ("chuyenNganhId") REFERENCES "ql-ho-so"."DM_ChuyenNganhDaoTaoBacDH"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."QuaTrinhHocTap" ADD CONSTRAINT "QuaTrinhHocTap_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."ToChucXaHoi" ADD CONSTRAINT "ToChucXaHoi_tenId_fkey" FOREIGN KEY ("tenId") REFERENCES "ql-ho-so"."DM_ToChucXaHoi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."ToChucXaHoi" ADD CONSTRAINT "ToChucXaHoi_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."QuaTrinhLuong" ADD CONSTRAINT "QuaTrinhLuong_ngachId_fkey" FOREIGN KEY ("ngachId") REFERENCES "ql-ho-so"."DM_Ngach"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."QuaTrinhLuong" ADD CONSTRAINT "QuaTrinhLuong_bacLuongId_fkey" FOREIGN KEY ("bacLuongId") REFERENCES "ql-ho-so"."DM_BacLuong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-ho-so"."QuaTrinhLuong" ADD CONSTRAINT "QuaTrinhLuong_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Lecturer" ADD CONSTRAINT "Lecturer_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Lecturer" ADD CONSTRAINT "Lecturer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Lecturer" ADD CONSTRAINT "Lecturer_lecturerTypeId_fkey" FOREIGN KEY ("lecturerTypeId") REFERENCES "ql-danh-muc"."LecturerType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."LecturerHistory" ADD CONSTRAINT "LecturerHistory_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."LecturerHistory" ADD CONSTRAINT "LecturerHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."LecturerHistory" ADD CONSTRAINT "LecturerHistory_lecturerTypeId_fkey" FOREIGN KEY ("lecturerTypeId") REFERENCES "ql-danh-muc"."LecturerType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ResearchProject" ADD CONSTRAINT "ResearchProject_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ResearchProject" ADD CONSTRAINT "ResearchProject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentResearchRegistration" ADD CONSTRAINT "StudentResearchRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentResearchRegistration" ADD CONSTRAINT "StudentResearchRegistration_researchProjectId_fkey" FOREIGN KEY ("researchProjectId") REFERENCES "ql-dao-tao"."ResearchProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentResearchRegistration" ADD CONSTRAINT "StudentResearchRegistration_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD CONSTRAINT "ThesisProject_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD CONSTRAINT "ThesisProject_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "ql-dao-tao"."ExpertProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD CONSTRAINT "ThesisProject_coSupervisorId_fkey" FOREIGN KEY ("coSupervisorId") REFERENCES "ql-dao-tao"."ExpertProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD CONSTRAINT "ThesisProject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD CONSTRAINT "ThesisProject_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "ql-dao-tao"."Council"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD CONSTRAINT "ThesisProject_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ql-dao-tao"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ThesisProject" ADD CONSTRAINT "ThesisProject_defenseSessionId_fkey" FOREIGN KEY ("defenseSessionId") REFERENCES "ql-dao-tao"."DefenseSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentThesisRegistration" ADD CONSTRAINT "StudentThesisRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentThesisRegistration" ADD CONSTRAINT "StudentThesisRegistration_thesisProjectId_fkey" FOREIGN KEY ("thesisProjectId") REFERENCES "ql-dao-tao"."ThesisProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentThesisRegistration" ADD CONSTRAINT "StudentThesisRegistration_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ExpertProfile" ADD CONSTRAINT "ExpertProfile_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Decision" ADD CONSTRAINT "Decision_thesisProjectId_fkey" FOREIGN KEY ("thesisProjectId") REFERENCES "ql-dao-tao"."ThesisProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Invitation" ADD CONSTRAINT "Invitation_councilMemberId_fkey" FOREIGN KEY ("councilMemberId") REFERENCES "ql-dao-tao"."CouncilMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Council" ADD CONSTRAINT "Council_studentThesisRegistrationId_fkey" FOREIGN KEY ("studentThesisRegistrationId") REFERENCES "ql-dao-tao"."StudentThesisRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CouncilMember" ADD CONSTRAINT "CouncilMember_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "ql-dao-tao"."Council"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CouncilMember" ADD CONSTRAINT "CouncilMember_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "ql-dao-tao"."ExpertProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."DefenseRecord" ADD CONSTRAINT "DefenseRecord_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "ql-dao-tao"."ThesisProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."LibrarySubmission" ADD CONSTRAINT "LibrarySubmission_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "ql-dao-tao"."ThesisProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."PaymentRecord" ADD CONSTRAINT "PaymentRecord_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "ql-dao-tao"."ExpertProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."PaymentRecord" ADD CONSTRAINT "PaymentRecord_councilMemberId_fkey" FOREIGN KEY ("councilMemberId") REFERENCES "ql-dao-tao"."CouncilMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SupervisorPaymentRecord" ADD CONSTRAINT "SupervisorPaymentRecord_thesisProjectId_fkey" FOREIGN KEY ("thesisProjectId") REFERENCES "ql-dao-tao"."ThesisProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SupervisorPaymentRecord" ADD CONSTRAINT "SupervisorPaymentRecord_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "ql-dao-tao"."ExpertProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_archivedCertificateId_fkey" FOREIGN KEY ("archivedCertificateId") REFERENCES "ql-dao-tao"."ArchivedCertificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_archivedAwardId_fkey" FOREIGN KEY ("archivedAwardId") REFERENCES "ql-dao-tao"."ArchivedAward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "ql-dao-tao"."Curriculum"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "ql-dao-tao"."CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_studentAcademicDecisionId_fkey" FOREIGN KEY ("studentAcademicDecisionId") REFERENCES "ql-dao-tao"."StudentAcademicDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "ql-danh-muc"."Notification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "ql-dao-tao"."Decision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_defenseRecordId_fkey" FOREIGN KEY ("defenseRecordId") REFERENCES "ql-dao-tao"."DefenseRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_diplomaFrontId_fkey" FOREIGN KEY ("diplomaFrontId") REFERENCES "ql-dao-tao"."GraduationDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_diplomaBackId_fkey" FOREIGN KEY ("diplomaBackId") REFERENCES "ql-dao-tao"."GraduationDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_diplomaVerificationId_fkey" FOREIGN KEY ("diplomaVerificationId") REFERENCES "ql-dao-tao"."DiplomaVerificationApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_diplomaVerificationFrontId_fkey" FOREIGN KEY ("diplomaVerificationFrontId") REFERENCES "ql-dao-tao"."DiplomaVerificationApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_diplomaVerificationBackId_fkey" FOREIGN KEY ("diplomaVerificationBackId") REFERENCES "ql-dao-tao"."DiplomaVerificationApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DocumentFile" ADD CONSTRAINT "DocumentFile_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "ql-dao-tao"."Note"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."AcademicActionConfig" ADD CONSTRAINT "AcademicActionConfig_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."AcademicActionRuleSet" ADD CONSTRAINT "AcademicActionRuleSet_configId_fkey" FOREIGN KEY ("configId") REFERENCES "ql-dao-tao"."AcademicActionConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."AcademicActionCondition" ADD CONSTRAINT "AcademicActionCondition_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "ql-dao-tao"."AcademicActionRuleSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentAcademicDecision" ADD CONSTRAINT "StudentAcademicDecision_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentAcademicDecision" ADD CONSTRAINT "StudentAcademicDecision_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentAcademicDecision" ADD CONSTRAINT "StudentAcademicDecision_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "ql-dao-tao"."SchoolYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentAcademicDecision" ADD CONSTRAINT "StudentAcademicDecision_appliedConfigId_fkey" FOREIGN KEY ("appliedConfigId") REFERENCES "ql-dao-tao"."AcademicActionConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingScoreSession" ADD CONSTRAINT "TrainingScoreSession_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingScoreSession" ADD CONSTRAINT "TrainingScoreSession_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentTrainingScore" ADD CONSTRAINT "StudentTrainingScore_trainingScoreSessionId_fkey" FOREIGN KEY ("trainingScoreSessionId") REFERENCES "ql-dao-tao"."TrainingScoreSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentTrainingScore" ADD CONSTRAINT "StudentTrainingScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Scholarship" ADD CONSTRAINT "Scholarship_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ScholarshipCriteria" ADD CONSTRAINT "ScholarshipCriteria_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "ql-dao-tao"."Scholarship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ScholarshipAward" ADD CONSTRAINT "ScholarshipAward_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ScholarshipAward" ADD CONSTRAINT "ScholarshipAward_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ScholarshipAward" ADD CONSTRAINT "ScholarshipAward_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "ql-dao-tao"."Scholarship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentGraduationApplication" ADD CONSTRAINT "StudentGraduationApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StudentGraduationApplication" ADD CONSTRAINT "StudentGraduationApplication_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ql-dao-tao"."GraduationSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ApplicationCheckResult" ADD CONSTRAINT "ApplicationCheckResult_studentGraduationApplicationId_fkey" FOREIGN KEY ("studentGraduationApplicationId") REFERENCES "ql-dao-tao"."StudentGraduationApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."ApplicationCheckResult" ADD CONSTRAINT "ApplicationCheckResult_rankingConditionId_fkey" FOREIGN KEY ("rankingConditionId") REFERENCES "ql-dao-tao"."RankingCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."GraduationDecision" ADD CONSTRAINT "GraduationDecision_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ql-dao-tao"."StudentGraduationApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."GraduationDecision" ADD CONSTRAINT "GraduationDecision_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."GraduationDecision" ADD CONSTRAINT "GraduationDecision_trainingMajorId_fkey" FOREIGN KEY ("trainingMajorId") REFERENCES "ql-dao-tao"."TrainingMajor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."GraduationDecision" ADD CONSTRAINT "GraduationDecision_finalRankingId_fkey" FOREIGN KEY ("finalRankingId") REFERENCES "ql-dao-tao"."AcademicRankingConvert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."GraduationDecision" ADD CONSTRAINT "GraduationDecision_diplomaTypeId_fkey" FOREIGN KEY ("diplomaTypeId") REFERENCES "ql-dao-tao"."DiplomaType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."AcademicRankingConvert" ADD CONSTRAINT "AcademicRankingConvert_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."GraduationRankDowngradeRule" ADD CONSTRAINT "GraduationRankDowngradeRule_initialRankId_fkey" FOREIGN KEY ("initialRankId") REFERENCES "ql-dao-tao"."AcademicRankingConvert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."GraduationRankDowngradeCondition" ADD CONSTRAINT "GraduationRankDowngradeCondition_downgradeRuleId_fkey" FOREIGN KEY ("downgradeRuleId") REFERENCES "ql-dao-tao"."GraduationRankDowngradeRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."RankingCondition" ADD CONSTRAINT "RankingCondition_rankingId_fkey" FOREIGN KEY ("rankingId") REFERENCES "ql-dao-tao"."AcademicRankingConvert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."DiplomaVerificationApplication" ADD CONSTRAINT "DiplomaVerificationApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Note" ADD CONSTRAINT "Note_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Note" ADD CONSTRAINT "Note_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "ql-dao-tao"."NoteFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."NoteFolder" ADD CONSTRAINT "NoteFolder_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."NoteFolder" ADD CONSTRAINT "NoteFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ql-dao-tao"."NoteFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."NoteReminder" ADD CONSTRAINT "NoteReminder_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "ql-dao-tao"."Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."CriterionCatalog" ADD CONSTRAINT "CriterionCatalog_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "khao-thi"."StandardCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."CriterionCatalog" ADD CONSTRAINT "CriterionCatalog_scoreScaleId_fkey" FOREIGN KEY ("scoreScaleId") REFERENCES "khao-thi"."ScoreScaleCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."RequirementCriterionCatalog" ADD CONSTRAINT "RequirementCriterionCatalog_criterionCatalogId_fkey" FOREIGN KEY ("criterionCatalogId") REFERENCES "khao-thi"."CriterionCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."EvaluationStandard" ADD CONSTRAINT "EvaluationStandard_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "khao-thi"."EvaluationPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."EvaluationCriterion" ADD CONSTRAINT "EvaluationCriterion_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "khao-thi"."EvaluationStandard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."EvaluationCriterion" ADD CONSTRAINT "EvaluationCriterion_scoreScaleId_fkey" FOREIGN KEY ("scoreScaleId") REFERENCES "khao-thi"."ScoreScaleCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."EvaluationCriterion" ADD CONSTRAINT "EvaluationCriterion_evaluationCouncilId_fkey" FOREIGN KEY ("evaluationCouncilId") REFERENCES "khao-thi"."EvaluationCouncil"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Evidence" ADD CONSTRAINT "Evidence_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "khao-thi"."EvidenceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."RequirementCriterion" ADD CONSTRAINT "RequirementCriterion_evaluationCriterionId_fkey" FOREIGN KEY ("evaluationCriterionId") REFERENCES "khao-thi"."EvaluationCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."AnalysisFormEvidence" ADD CONSTRAINT "AnalysisFormEvidence_requirementCriterionId_fkey" FOREIGN KEY ("requirementCriterionId") REFERENCES "khao-thi"."RequirementCriterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."AnalysisFormEvidence" ADD CONSTRAINT "AnalysisFormEvidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "khao-thi"."Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."EvaluationCouncil" ADD CONSTRAINT "EvaluationCouncil_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "khao-thi"."EvaluationPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."EvaluationCouncilMember" ADD CONSTRAINT "EvaluationCouncilMember_evaluationCouncilId_fkey" FOREIGN KEY ("evaluationCouncilId") REFERENCES "khao-thi"."EvaluationCouncil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."EvaluationCouncilMember" ADD CONSTRAINT "EvaluationCouncilMember_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."EvidenceFile" ADD CONSTRAINT "EvidenceFile_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "khao-thi"."Evidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."EvidenceFile" ADD CONSTRAINT "EvidenceFile_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveyQuestionGroup" ADD CONSTRAINT "SurveyQuestionGroup_surveyTopicId_fkey" FOREIGN KEY ("surveyTopicId") REFERENCES "khao-thi"."SurveyTopic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Survey" ADD CONSTRAINT "Survey_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "ql-dao-tao"."Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Survey" ADD CONSTRAINT "Survey_surveyTopicId_fkey" FOREIGN KEY ("surveyTopicId") REFERENCES "khao-thi"."SurveyTopic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveyQuestion" ADD CONSTRAINT "SurveyQuestion_surveyQuestionGroupId_fkey" FOREIGN KEY ("surveyQuestionGroupId") REFERENCES "khao-thi"."SurveyQuestionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveyQuestion" ADD CONSTRAINT "SurveyQuestion_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "khao-thi"."Survey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveyChoice" ADD CONSTRAINT "SurveyChoice_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "khao-thi"."Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveySession" ADD CONSTRAINT "SurveySession_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "khao-thi"."Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveySession" ADD CONSTRAINT "SurveySession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveySessionId_fkey" FOREIGN KEY ("surveySessionId") REFERENCES "khao-thi"."SurveySession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveyQuestionId_fkey" FOREIGN KEY ("surveyQuestionId") REFERENCES "khao-thi"."SurveyQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveyChoiceId_fkey" FOREIGN KEY ("surveyChoiceId") REFERENCES "khao-thi"."SurveyChoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Staff" ADD CONSTRAINT "Staff_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Staff" ADD CONSTRAINT "Staff_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Staff" ADD CONSTRAINT "Staff_staffTypeId_fkey" FOREIGN KEY ("staffTypeId") REFERENCES "ql-danh-muc"."StaffType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Staff" ADD CONSTRAINT "Staff_staffPositionId_fkey" FOREIGN KEY ("staffPositionId") REFERENCES "ql-danh-muc"."StaffPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StaffHistory" ADD CONSTRAINT "StaffHistory_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StaffHistory" ADD CONSTRAINT "StaffHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StaffHistory" ADD CONSTRAINT "StaffHistory_staffTypeId_fkey" FOREIGN KEY ("staffTypeId") REFERENCES "ql-danh-muc"."StaffType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StaffHistory" ADD CONSTRAINT "StaffHistory_staffPositionId_fkey" FOREIGN KEY ("staffPositionId") REFERENCES "ql-danh-muc"."StaffPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "mta"."DM_NhanVien"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."AcademicWarningRule" ADD CONSTRAINT "AcademicWarningRule_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."AcademicWarning" ADD CONSTRAINT "AcademicWarning_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."AcademicWarning" ADD CONSTRAINT "AcademicWarning_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."DisciplinaryWarning" ADD CONSTRAINT "DisciplinaryWarning_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."DisciplinaryWarning" ADD CONSTRAINT "DisciplinaryWarning_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_ExamToRoom" ADD CONSTRAINT "_ExamToRoom_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_ExamToRoom" ADD CONSTRAINT "_ExamToRoom_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_FixedClassToSubjectClass" ADD CONSTRAINT "_FixedClassToSubjectClass_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."FixedClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_FixedClassToSubjectClass" ADD CONSTRAINT "_FixedClassToSubjectClass_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_FixedClassToNotification" ADD CONSTRAINT "_FixedClassToNotification_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."FixedClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_FixedClassToNotification" ADD CONSTRAINT "_FixedClassToNotification_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-danh-muc"."Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_FixedClassToSurveyObjectType" ADD CONSTRAINT "_FixedClassToSurveyObjectType_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."FixedClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_FixedClassToSurveyObjectType" ADD CONSTRAINT "_FixedClassToSurveyObjectType_B_fkey" FOREIGN KEY ("B") REFERENCES "khao-thi"."SurveyObjectType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_PrerequisiteSubject" ADD CONSTRAINT "_PrerequisiteSubject_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_PrerequisiteSubject" ADD CONSTRAINT "_PrerequisiteSubject_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_CoRequisiteSubject" ADD CONSTRAINT "_CoRequisiteSubject_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_CoRequisiteSubject" ADD CONSTRAINT "_CoRequisiteSubject_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_SubjectClassToSurveyObjectType" ADD CONSTRAINT "_SubjectClassToSurveyObjectType_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_SubjectClassToSurveyObjectType" ADD CONSTRAINT "_SubjectClassToSurveyObjectType_B_fkey" FOREIGN KEY ("B") REFERENCES "khao-thi"."SurveyObjectType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_PriorityObjectToStudent" ADD CONSTRAINT "_PriorityObjectToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."PriorityObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_PriorityObjectToStudent" ADD CONSTRAINT "_PriorityObjectToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_DefenseRooms" ADD CONSTRAINT "_DefenseRooms_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_DefenseRooms" ADD CONSTRAINT "_DefenseRooms_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."_NotificationToTrainingCourse" ADD CONSTRAINT "_NotificationToTrainingCourse_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-danh-muc"."Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."_NotificationToTrainingCourse" ADD CONSTRAINT "_NotificationToTrainingCourse_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."_NotificationToStudent" ADD CONSTRAINT "_NotificationToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-danh-muc"."Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."_NotificationToStudent" ADD CONSTRAINT "_NotificationToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."_GroupToRole" ADD CONSTRAINT "_GroupToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-nguoi-dung"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."_GroupToRole" ADD CONSTRAINT "_GroupToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-nguoi-dung"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-nguoi-dung"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-nguoi-dung"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mta"."_DM_DonViToSurveyObjectType" ADD CONSTRAINT "_DM_DonViToSurveyObjectType_A_fkey" FOREIGN KEY ("A") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mta"."_DM_DonViToSurveyObjectType" ADD CONSTRAINT "_DM_DonViToSurveyObjectType_B_fkey" FOREIGN KEY ("B") REFERENCES "khao-thi"."SurveyObjectType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_ExpertProfileToTrainingMajor" ADD CONSTRAINT "_ExpertProfileToTrainingMajor_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."ExpertProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_ExpertProfileToTrainingMajor" ADD CONSTRAINT "_ExpertProfileToTrainingMajor_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."TrainingMajor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_ExpertProfileToSubjectClass" ADD CONSTRAINT "_ExpertProfileToSubjectClass_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."ExpertProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_ExpertProfileToSubjectClass" ADD CONSTRAINT "_ExpertProfileToSubjectClass_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_NoteToNoteTag" ADD CONSTRAINT "_NoteToNoteTag_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_NoteToNoteTag" ADD CONSTRAINT "_NoteToNoteTag_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."NoteTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_SurveyObjectTypeToTrainingField" ADD CONSTRAINT "_SurveyObjectTypeToTrainingField_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."SurveyObjectType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_SurveyObjectTypeToTrainingField" ADD CONSTRAINT "_SurveyObjectTypeToTrainingField_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."TrainingField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_SurveyObjectTypeToTrainingMajor" ADD CONSTRAINT "_SurveyObjectTypeToTrainingMajor_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."SurveyObjectType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_SurveyObjectTypeToTrainingMajor" ADD CONSTRAINT "_SurveyObjectTypeToTrainingMajor_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."TrainingMajor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_SurveyObjectTypeToTrainingCourse" ADD CONSTRAINT "_SurveyObjectTypeToTrainingCourse_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."SurveyObjectType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_SurveyObjectTypeToTrainingCourse" ADD CONSTRAINT "_SurveyObjectTypeToTrainingCourse_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_SurveyToSurveyObjectType" ADD CONSTRAINT "_SurveyToSurveyObjectType_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."_SurveyToSurveyObjectType" ADD CONSTRAINT "_SurveyToSurveyObjectType_B_fkey" FOREIGN KEY ("B") REFERENCES "khao-thi"."SurveyObjectType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_AcademicWarningToAcademicWarningRule" ADD CONSTRAINT "_AcademicWarningToAcademicWarningRule_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."AcademicWarning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_AcademicWarningToAcademicWarningRule" ADD CONSTRAINT "_AcademicWarningToAcademicWarningRule_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."AcademicWarningRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_DisciplinaryWarningToDisciplinaryWarningReason" ADD CONSTRAINT "_DisciplinaryWarningToDisciplinaryWarningReason_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."DisciplinaryWarning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_DisciplinaryWarningToDisciplinaryWarningReason" ADD CONSTRAINT "_DisciplinaryWarningToDisciplinaryWarningReason_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."DisciplinaryWarningReason"("id") ON DELETE CASCADE ON UPDATE CASCADE;
