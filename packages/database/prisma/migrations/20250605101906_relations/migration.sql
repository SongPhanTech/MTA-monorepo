-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "he-thong";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "khao-thi";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ql-danh-muc";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ql-dao-tao";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ql-nguoi-dung";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tro-ly-ao";

-- CreateEnum
CREATE TYPE "ql-dao-tao"."TrainingCourseStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'SUSPEND', 'CANCEL');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."CurriculumStatus" AS ENUM ('ACTIVE', 'INACTIVATED');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."TrainingLanguage" AS ENUM ('Vietnamese', 'English');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."SubjectEquivalentType" AS ENUM ('NONE', 'OneByOne', 'TwoByOne', 'ThreeByOne', 'FourByOne', 'OneByTwo', 'OneByThree');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."ExamType" AS ENUM ('OfflineWritten', 'OnlineWritten', 'OfflineChoices', 'OnlineChoices', 'Oral', 'Practice', 'Project', 'Other');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."CurriculumVersionSubjectType" AS ENUM ('None', 'Mandatory', 'Optional', 'Elective');

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
CREATE TYPE "ql-nguoi-dung"."FeedbackStatus" AS ENUM ('Pending', 'InProgress', 'Resolved', 'Closed');

-- CreateEnum
CREATE TYPE "ql-nguoi-dung"."Satisfaction" AS ENUM ('VeryDissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'VerySatisfied');

-- CreateEnum
CREATE TYPE "ql-nguoi-dung"."UserType" AS ENUM ('MILITARY_STUDENT', 'CIVILIAN_STUDENT', 'LECTURER', 'STAFF', 'PROFESSIONAL', 'CONTRACT', 'CIVIL_STUDENT', 'TEACHER', 'OTHER');

-- CreateEnum
CREATE TYPE "ql-nguoi-dung"."FixedClassStudentStatus" AS ENUM ('ENROLLED', 'GRADUATED', 'DEFERRED_STUDY', 'SUSPENDED_STUDY', 'WITHDRAWN', 'TRANSFERRED', 'PENDING_GRADUATION_REVIEW', 'ACADEMIC_SUSPENSION');

-- CreateEnum
CREATE TYPE "ql-danh-muc"."Gender" AS ENUM ('Male', 'Female');

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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."SurveyObjectType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SurveyTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."SurveyQuestionType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SurveyQuestionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."Survey" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "surveyObjectId" TEXT NOT NULL,
    "surveyTopicId" TEXT NOT NULL,

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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "surveyQuestionTypeId" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,

    CONSTRAINT "SurveyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "khao-thi"."SurveyAnswer" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "answer" TEXT,
    "surveyQuestionId" TEXT NOT NULL,

    CONSTRAINT "SurveyAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."SubjectClassStudent" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subjectClassId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "attendanceScore" DOUBLE PRECISION,
    "midtermScore" DOUBLE PRECISION,
    "finalScore" DOUBLE PRECISION,

    CONSTRAINT "SubjectClassStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."SchoolYear" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "trainingObjectTypeId" TEXT NOT NULL,
    "trainingTypeId" TEXT NOT NULL,
    "trainingLevelId" TEXT NOT NULL,
    "trainingFormId" TEXT NOT NULL,
    "status" "ql-dao-tao"."TrainingCourseStatus" NOT NULL DEFAULT 'ACTIVE',

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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "trainingCourseId" TEXT,
    "managementOrganizationId" TEXT,
    "initSize" INTEGER NOT NULL DEFAULT 0,

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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ql-dao-tao"."CurriculumStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "managementOrganizationId" TEXT NOT NULL,
    "trainingObjectTypeId" TEXT NOT NULL,
    "trainingLevelId" TEXT NOT NULL,
    "trainingTimeId" TEXT NOT NULL,
    "trainingMajorId" TEXT NOT NULL,
    "information" TEXT NOT NULL,
    "documentPath" TEXT,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "englishName" TEXT,
    "trainingLanguage" "ql-dao-tao"."TrainingLanguage" NOT NULL DEFAULT 'Vietnamese',
    "status" "ql-dao-tao"."CurriculumStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "curriculumId" TEXT NOT NULL,
    "scoreToTakeExam" DOUBLE PRECISION,
    "scoreToPass" DOUBLE PRECISION,
    "objectives" TEXT,
    "inputStandard" TEXT,
    "outputStandard" TEXT,
    "information" TEXT,
    "documentPath" TEXT,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "managementOrganizationId" TEXT NOT NULL,
    "information" TEXT,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."SubjectVersionType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "useForFinalScore" BOOLEAN NOT NULL,
    "graduation" BOOLEAN NOT NULL,
    "conditional" BOOLEAN NOT NULL,
    "project" BOOLEAN NOT NULL,
    "print" BOOLEAN NOT NULL,

    CONSTRAINT "SubjectVersionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."SubjectVersion" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "examType" "ql-dao-tao"."ExamType" NOT NULL,
    "subjectEquivalentType" "ql-dao-tao"."SubjectEquivalentType" NOT NULL DEFAULT 'NONE',
    "credit" INTEGER NOT NULL,
    "period" INTEGER NOT NULL DEFAULT 0,
    "numberOfTheory" INTEGER NOT NULL DEFAULT 0,
    "numberOfPractice" INTEGER NOT NULL DEFAULT 0,
    "numberOfSelfStudy" INTEGER NOT NULL DEFAULT 0,
    "numberOfProject" INTEGER NOT NULL DEFAULT 0,
    "numberOfInternship" INTEGER NOT NULL DEFAULT 0,
    "numberOfOther" INTEGER NOT NULL DEFAULT 0,
    "objectives" TEXT,
    "outputStandard" TEXT,
    "documentPath" TEXT,
    "coef_1" DOUBLE PRECISION,
    "coef_2" DOUBLE PRECISION,
    "coef_3" DOUBLE PRECISION,
    "coef_4" DOUBLE PRECISION,
    "coef_5" DOUBLE PRECISION,
    "managementOrganizationId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "subjectTypeId" TEXT NOT NULL,

    CONSTRAINT "SubjectVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."CurriculumVersionSubject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "curriculumVersionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "trainingBlockId" TEXT,
    "semester" INTEGER,
    "type" "ql-dao-tao"."CurriculumVersionSubjectType" NOT NULL DEFAULT 'None',
    "information" TEXT,
    "documentPath" TEXT,
    "renderPath" TEXT,

    CONSTRAINT "CurriculumVersionSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."SubjectClass" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "subjectId" TEXT NOT NULL,
    "examDate" TIMESTAMP(3),

    CONSTRAINT "SubjectClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingObjectType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

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
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingField" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "codeTrainingField" TEXT NOT NULL,
    "englishName" TEXT NOT NULL,
    "publishDate" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

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
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "codeTrainingMajor" TEXT NOT NULL,
    "englishName" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "numberCreditsMajor" INTEGER NOT NULL DEFAULT 0,
    "numberCreditsRequired" INTEGER NOT NULL DEFAULT 0,
    "numberCreditsElective" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TrainingBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingTime" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."StudyRank" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "StudyRank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingRank" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingRank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."TrainingKPI" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "from" TIMESTAMP(3),
    "to" TIMESTAMP(3),
    "trainingLocationId" TEXT,
    "status" "ql-nguoi-dung"."FixedClassStudentStatus" NOT NULL DEFAULT 'ENROLLED',
    "fixedClassId" TEXT,
    "userProfileId" TEXT,
    "trainingLevelId" TEXT,
    "trainingObjectTypeId" TEXT,
    "trainingTypeId" TEXT,
    "trainingFormId" TEXT,
    "registrationAreaId" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."User" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "systemRole" "ql-nguoi-dung"."UserRole" NOT NULL DEFAULT 'USER',
    "ssoId" TEXT,
    "phone" TEXT,
    "role" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."Group" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "status" "tro-ly-ao"."DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "uri" TEXT,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "type" "tro-ly-ao"."DocumentType" NOT NULL,
    "reason" TEXT,
    "uploadedById" TEXT NOT NULL,
    "approvedById" TEXT,

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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "question" TEXT,
    "answer" TEXT,
    "status" "tro-ly-ao"."DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "type" "tro-ly-ao"."DocumentType" NOT NULL,
    "reason" TEXT,
    "uploadedById" TEXT NOT NULL,
    "approvedById" TEXT,

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
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "conversationId" TEXT,
    "content" TEXT,
    "sender" "tro-ly-ao"."MessageSender" NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."Feedback" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ql-nguoi-dung"."FeedbackStatus" NOT NULL,
    "satisfaction" "ql-nguoi-dung"."Satisfaction" NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."UserProfile" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "userType" "ql-nguoi-dung"."UserType" NOT NULL DEFAULT 'OTHER',
    "avatar" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "placeOfBirth" TEXT,
    "homeTown" TEXT,
    "idCardNumber" TEXT,
    "idCardDate" TIMESTAMP(3),
    "gender" "ql-danh-muc"."Gender",
    "permanentAddress" TEXT,
    "temporaryAddress" TEXT,
    "contactAddress" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "nationalityId" TEXT,
    "religionId" TEXT,
    "ethnicityId" TEXT,
    "provinceHometownId" TEXT,
    "communeHometownId" TEXT,
    "officerNumber" TEXT,
    "rankId" TEXT,
    "academicDegreeTypeId" TEXT,
    "academicRankTypeId" TEXT,
    "unionDate" TIMESTAMP(3),
    "unionPlace" TEXT,
    "CPVJoinDate" TIMESTAMP(3),
    "officialCPVDate" TIMESTAMP(3),
    "CPVJoinPlace" TEXT,
    "positionCPVId" TEXT,
    "tenureDate" TIMESTAMP(3),
    "enlistmentDate" TIMESTAMP(3),
    "dischargeDate" TIMESTAMP(3),
    "familyPhone" TEXT,
    "familyName" TEXT,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."RegistrationArea" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "RegistrationArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."Nationality" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Nationality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."Religion" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Religion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."Ethnicity" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Ethnicity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."Province" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."Commune" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,

    CONSTRAINT "Commune_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."Level" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."Rank" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Rank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."AcademicDegreeType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AcademicDegreeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."AcademicRankType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AcademicRankType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."LecturerType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "lecturerTypeId" TEXT NOT NULL,

    CONSTRAINT "StaffPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."PositionCPV" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PositionCPV_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."OrganizationType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "OrganizationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."Organization" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "parentId" TEXT,
    "address" TEXT,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Lecturer" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lectureID" TEXT,
    "lectureCode" TEXT,
    "serviceDate" TIMESTAMP(3),
    "userProfileId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "from" TIMESTAMP(3),
    "to" TIMESTAMP(3),
    "lectureID" TEXT,
    "lectureCode" TEXT,
    "serviceDate" TIMESTAMP(3),
    "userProfileId" TEXT NOT NULL,
    "organizationId" TEXT,
    "lecturerTypeId" TEXT NOT NULL,

    CONSTRAINT "LecturerHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Staff" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "from" TIMESTAMP(3),
    "lectureID" TEXT,
    "lectureCode" TEXT,
    "serviceDate" TIMESTAMP(3),
    "userProfileId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "from" TIMESTAMP(3),
    "to" TIMESTAMP(3),
    "userProfileId" TEXT NOT NULL,
    "organizationId" TEXT,
    "staffTypeId" TEXT NOT NULL,
    "staffPositionId" TEXT NOT NULL,

    CONSTRAINT "StaffHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."TemplateFile" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "BlockedIp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."_SubjectVersionToTrainingObjectType" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SubjectVersionToTrainingObjectType_AB_pkey" PRIMARY KEY ("A","B")
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
CREATE TABLE "ql-dao-tao"."_PriorityObjectToStudent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PriorityObjectToStudent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."_GroupToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GroupToUser_AB_pkey" PRIMARY KEY ("A","B")
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

-- CreateIndex
CREATE UNIQUE INDEX "Config_code_key" ON "he-thong"."Config"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Config_key_key" ON "he-thong"."Config"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyObjectType_code_key" ON "khao-thi"."SurveyObjectType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyTopic_code_key" ON "khao-thi"."SurveyTopic"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyQuestionType_code_key" ON "khao-thi"."SurveyQuestionType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Survey_code_key" ON "khao-thi"."Survey"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyQuestion_code_key" ON "khao-thi"."SurveyQuestion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyAnswer_code_key" ON "khao-thi"."SurveyAnswer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectClassStudent_code_key" ON "ql-dao-tao"."SubjectClassStudent"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolYear_code_key" ON "ql-dao-tao"."SchoolYear"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_code_key" ON "ql-dao-tao"."Semester"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Milestone_code_key" ON "ql-dao-tao"."Milestone"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCourse_code_key" ON "ql-dao-tao"."TrainingCourse"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FixedClass_code_key" ON "ql-dao-tao"."FixedClass"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Curriculum_code_key" ON "ql-dao-tao"."Curriculum"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumVersion_code_key" ON "ql-dao-tao"."CurriculumVersion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "ql-dao-tao"."Subject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectVersionType_code_key" ON "ql-dao-tao"."SubjectVersionType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectVersion_code_key" ON "ql-dao-tao"."SubjectVersion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumVersionSubject_code_key" ON "ql-dao-tao"."CurriculumVersionSubject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectClass_code_key" ON "ql-dao-tao"."SubjectClass"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingObjectType_code_key" ON "ql-dao-tao"."TrainingObjectType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PriorityObject_code_key" ON "ql-dao-tao"."PriorityObject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingType_code_key" ON "ql-dao-tao"."TrainingType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingLevel_code_key" ON "ql-dao-tao"."TrainingLevel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingForm_code_key" ON "ql-dao-tao"."TrainingForm"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingLocation_code_key" ON "ql-dao-tao"."TrainingLocation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingField_code_key" ON "ql-dao-tao"."TrainingField"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingField_codeTrainingField_key" ON "ql-dao-tao"."TrainingField"("codeTrainingField");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingFieldOnTrainingObjectType_code_key" ON "ql-dao-tao"."TrainingFieldOnTrainingObjectType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingFieldOnTrainingObjectType_trainingFieldId_trainingO_key" ON "ql-dao-tao"."TrainingFieldOnTrainingObjectType"("trainingFieldId", "trainingObjectTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingMajor_code_key" ON "ql-dao-tao"."TrainingMajor"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingMajor_codeTrainingMajor_key" ON "ql-dao-tao"."TrainingMajor"("codeTrainingMajor");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingMajorOnTrainingObjectType_code_key" ON "ql-dao-tao"."TrainingMajorOnTrainingObjectType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingMajorOnTrainingObjectType_trainingMajorId_trainingO_key" ON "ql-dao-tao"."TrainingMajorOnTrainingObjectType"("trainingMajorId", "trainingObjectTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingBlock_code_key" ON "ql-dao-tao"."TrainingBlock"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingTime_code_key" ON "ql-dao-tao"."TrainingTime"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudyRank_code_key" ON "ql-dao-tao"."StudyRank"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingRank_code_key" ON "ql-dao-tao"."TrainingRank"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingKPI_code_key" ON "ql-dao-tao"."TrainingKPI"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Student_code_key" ON "ql-dao-tao"."Student"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_code_key" ON "ql-nguoi-dung"."User"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "ql-nguoi-dung"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_userName_key" ON "ql-nguoi-dung"."User"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "User_ssoId_key" ON "ql-nguoi-dung"."User"("ssoId");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "ql-nguoi-dung"."User"("phone");

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
CREATE UNIQUE INDEX "Feedback_code_key" ON "ql-nguoi-dung"."Feedback"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_code_key" ON "ql-nguoi-dung"."UserProfile"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "ql-nguoi-dung"."UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationArea_code_key" ON "ql-danh-muc"."RegistrationArea"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Nationality_code_key" ON "ql-danh-muc"."Nationality"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Religion_code_key" ON "ql-danh-muc"."Religion"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Ethnicity_code_key" ON "ql-danh-muc"."Ethnicity"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Province_code_key" ON "ql-danh-muc"."Province"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Commune_code_key" ON "ql-danh-muc"."Commune"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Commune_name_provinceId_key" ON "ql-danh-muc"."Commune"("name", "provinceId");

-- CreateIndex
CREATE UNIQUE INDEX "Level_code_key" ON "ql-danh-muc"."Level"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Rank_code_key" ON "ql-danh-muc"."Rank"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicDegreeType_code_key" ON "ql-danh-muc"."AcademicDegreeType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicRankType_code_key" ON "ql-danh-muc"."AcademicRankType"("code");

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
CREATE UNIQUE INDEX "StaffPosition_name_lecturerTypeId_key" ON "ql-danh-muc"."StaffPosition"("name", "lecturerTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "PositionCPV_code_key" ON "ql-danh-muc"."PositionCPV"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationType_code_key" ON "ql-danh-muc"."OrganizationType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_code_key" ON "ql-danh-muc"."Organization"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_name_key" ON "ql-danh-muc"."Organization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_code_key" ON "ql-dao-tao"."Lecturer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_lectureID_key" ON "ql-dao-tao"."Lecturer"("lectureID");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_lectureCode_key" ON "ql-dao-tao"."Lecturer"("lectureCode");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_userProfileId_key" ON "ql-dao-tao"."Lecturer"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "LecturerHistory_code_key" ON "ql-dao-tao"."LecturerHistory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LecturerHistory_userProfileId_key" ON "ql-dao-tao"."LecturerHistory"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_code_key" ON "ql-dao-tao"."Staff"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_lectureID_key" ON "ql-dao-tao"."Staff"("lectureID");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_lectureCode_key" ON "ql-dao-tao"."Staff"("lectureCode");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userProfileId_key" ON "ql-dao-tao"."Staff"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffHistory_code_key" ON "ql-dao-tao"."StaffHistory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StaffHistory_userProfileId_key" ON "ql-dao-tao"."StaffHistory"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateFile_code_key" ON "ql-danh-muc"."TemplateFile"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateFile_path_key" ON "ql-danh-muc"."TemplateFile"("path");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedIp_code_key" ON "ql-nguoi-dung"."BlockedIp"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedIp_ipAddress_key" ON "ql-nguoi-dung"."BlockedIp"("ipAddress");

-- CreateIndex
CREATE INDEX "_SubjectVersionToTrainingObjectType_B_index" ON "ql-dao-tao"."_SubjectVersionToTrainingObjectType"("B");

-- CreateIndex
CREATE INDEX "_PrerequisiteSubject_B_index" ON "ql-dao-tao"."_PrerequisiteSubject"("B");

-- CreateIndex
CREATE INDEX "_CoRequisiteSubject_B_index" ON "ql-dao-tao"."_CoRequisiteSubject"("B");

-- CreateIndex
CREATE INDEX "_PriorityObjectToStudent_B_index" ON "ql-dao-tao"."_PriorityObjectToStudent"("B");

-- CreateIndex
CREATE INDEX "_GroupToUser_B_index" ON "ql-nguoi-dung"."_GroupToUser"("B");

-- CreateIndex
CREATE INDEX "_GroupToRole_B_index" ON "ql-nguoi-dung"."_GroupToRole"("B");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "ql-nguoi-dung"."_PermissionToRole"("B");

-- AddForeignKey
ALTER TABLE "khao-thi"."Survey" ADD CONSTRAINT "Survey_surveyObjectId_fkey" FOREIGN KEY ("surveyObjectId") REFERENCES "khao-thi"."SurveyObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."Survey" ADD CONSTRAINT "Survey_surveyTopicId_fkey" FOREIGN KEY ("surveyTopicId") REFERENCES "khao-thi"."SurveyTopic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveyQuestion" ADD CONSTRAINT "SurveyQuestion_surveyQuestionTypeId_fkey" FOREIGN KEY ("surveyQuestionTypeId") REFERENCES "khao-thi"."SurveyQuestionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveyQuestion" ADD CONSTRAINT "SurveyQuestion_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "khao-thi"."Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "khao-thi"."SurveyAnswer" ADD CONSTRAINT "SurveyAnswer_surveyQuestionId_fkey" FOREIGN KEY ("surveyQuestionId") REFERENCES "khao-thi"."SurveyQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClassStudent" ADD CONSTRAINT "SubjectClassStudent_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClassStudent" ADD CONSTRAINT "SubjectClassStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Semester" ADD CONSTRAINT "Semester_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "ql-dao-tao"."SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Milestone" ADD CONSTRAINT "Milestone_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "ql-dao-tao"."SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingCourse" ADD CONSTRAINT "TrainingCourse_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingCourse" ADD CONSTRAINT "TrainingCourse_trainingTypeId_fkey" FOREIGN KEY ("trainingTypeId") REFERENCES "ql-dao-tao"."TrainingType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingCourse" ADD CONSTRAINT "TrainingCourse_trainingLevelId_fkey" FOREIGN KEY ("trainingLevelId") REFERENCES "ql-dao-tao"."TrainingLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingCourse" ADD CONSTRAINT "TrainingCourse_trainingFormId_fkey" FOREIGN KEY ("trainingFormId") REFERENCES "ql-dao-tao"."TrainingForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" ADD CONSTRAINT "FixedClass_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" ADD CONSTRAINT "FixedClass_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "ql-danh-muc"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Curriculum" ADD CONSTRAINT "Curriculum_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "ql-danh-muc"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Curriculum" ADD CONSTRAINT "Curriculum_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Curriculum" ADD CONSTRAINT "Curriculum_trainingLevelId_fkey" FOREIGN KEY ("trainingLevelId") REFERENCES "ql-dao-tao"."TrainingLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Curriculum" ADD CONSTRAINT "Curriculum_trainingTimeId_fkey" FOREIGN KEY ("trainingTimeId") REFERENCES "ql-dao-tao"."TrainingTime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Curriculum" ADD CONSTRAINT "Curriculum_trainingMajorId_fkey" FOREIGN KEY ("trainingMajorId") REFERENCES "ql-dao-tao"."TrainingMajor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersion" ADD CONSTRAINT "CurriculumVersion_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "ql-dao-tao"."Curriculum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Subject" ADD CONSTRAINT "Subject_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "ql-danh-muc"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectVersion" ADD CONSTRAINT "SubjectVersion_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "ql-danh-muc"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectVersion" ADD CONSTRAINT "SubjectVersion_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectVersion" ADD CONSTRAINT "SubjectVersion_subjectTypeId_fkey" FOREIGN KEY ("subjectTypeId") REFERENCES "ql-dao-tao"."SubjectVersionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersionSubject" ADD CONSTRAINT "CurriculumVersionSubject_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "ql-dao-tao"."CurriculumVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersionSubject" ADD CONSTRAINT "CurriculumVersionSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersionSubject" ADD CONSTRAINT "CurriculumVersionSubject_trainingBlockId_fkey" FOREIGN KEY ("trainingBlockId") REFERENCES "ql-dao-tao"."TrainingBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectClass" ADD CONSTRAINT "SubjectClass_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingField" ADD CONSTRAINT "TrainingField_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ql-danh-muc"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingFieldOnTrainingObjectType" ADD CONSTRAINT "TrainingFieldOnTrainingObjectType_trainingFieldId_fkey" FOREIGN KEY ("trainingFieldId") REFERENCES "ql-dao-tao"."TrainingField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingFieldOnTrainingObjectType" ADD CONSTRAINT "TrainingFieldOnTrainingObjectType_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingMajor" ADD CONSTRAINT "TrainingMajor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ql-danh-muc"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingMajor" ADD CONSTRAINT "TrainingMajor_trainingFieldId_fkey" FOREIGN KEY ("trainingFieldId") REFERENCES "ql-dao-tao"."TrainingField"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingMajorOnTrainingObjectType" ADD CONSTRAINT "TrainingMajorOnTrainingObjectType_trainingMajorId_fkey" FOREIGN KEY ("trainingMajorId") REFERENCES "ql-dao-tao"."TrainingMajor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingMajorOnTrainingObjectType" ADD CONSTRAINT "TrainingMajorOnTrainingObjectType_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_trainingLocationId_fkey" FOREIGN KEY ("trainingLocationId") REFERENCES "ql-dao-tao"."TrainingLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_fixedClassId_fkey" FOREIGN KEY ("fixedClassId") REFERENCES "ql-dao-tao"."FixedClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_trainingLevelId_fkey" FOREIGN KEY ("trainingLevelId") REFERENCES "ql-dao-tao"."TrainingLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_trainingTypeId_fkey" FOREIGN KEY ("trainingTypeId") REFERENCES "ql-dao-tao"."TrainingType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_trainingFormId_fkey" FOREIGN KEY ("trainingFormId") REFERENCES "ql-dao-tao"."TrainingForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_registrationAreaId_fkey" FOREIGN KEY ("registrationAreaId") REFERENCES "ql-danh-muc"."RegistrationArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "ql-nguoi-dung"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."Document" ADD CONSTRAINT "Document_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "ql-nguoi-dung"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."FAQ" ADD CONSTRAINT "FAQ_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "ql-nguoi-dung"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."FAQ" ADD CONSTRAINT "FAQ_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "ql-nguoi-dung"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ql-nguoi-dung"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tro-ly-ao"."Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "tro-ly-ao"."Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ql-nguoi-dung"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ql-nguoi-dung"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_nationalityId_fkey" FOREIGN KEY ("nationalityId") REFERENCES "ql-danh-muc"."Nationality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_religionId_fkey" FOREIGN KEY ("religionId") REFERENCES "ql-danh-muc"."Religion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_ethnicityId_fkey" FOREIGN KEY ("ethnicityId") REFERENCES "ql-danh-muc"."Ethnicity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_provinceHometownId_fkey" FOREIGN KEY ("provinceHometownId") REFERENCES "ql-danh-muc"."Province"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_communeHometownId_fkey" FOREIGN KEY ("communeHometownId") REFERENCES "ql-danh-muc"."Commune"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "ql-danh-muc"."Rank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_academicDegreeTypeId_fkey" FOREIGN KEY ("academicDegreeTypeId") REFERENCES "ql-danh-muc"."AcademicDegreeType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_academicRankTypeId_fkey" FOREIGN KEY ("academicRankTypeId") REFERENCES "ql-danh-muc"."AcademicRankType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_positionCPVId_fkey" FOREIGN KEY ("positionCPVId") REFERENCES "ql-danh-muc"."PositionCPV"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."Commune" ADD CONSTRAINT "Commune_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "ql-danh-muc"."Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."StaffPosition" ADD CONSTRAINT "StaffPosition_lecturerTypeId_fkey" FOREIGN KEY ("lecturerTypeId") REFERENCES "ql-danh-muc"."LecturerType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."Organization" ADD CONSTRAINT "Organization_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ql-danh-muc"."OrganizationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."Organization" ADD CONSTRAINT "Organization_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ql-danh-muc"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Lecturer" ADD CONSTRAINT "Lecturer_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Lecturer" ADD CONSTRAINT "Lecturer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ql-danh-muc"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Lecturer" ADD CONSTRAINT "Lecturer_lecturerTypeId_fkey" FOREIGN KEY ("lecturerTypeId") REFERENCES "ql-danh-muc"."LecturerType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."LecturerHistory" ADD CONSTRAINT "LecturerHistory_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."LecturerHistory" ADD CONSTRAINT "LecturerHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ql-danh-muc"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."LecturerHistory" ADD CONSTRAINT "LecturerHistory_lecturerTypeId_fkey" FOREIGN KEY ("lecturerTypeId") REFERENCES "ql-danh-muc"."LecturerType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Staff" ADD CONSTRAINT "Staff_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Staff" ADD CONSTRAINT "Staff_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ql-danh-muc"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Staff" ADD CONSTRAINT "Staff_staffTypeId_fkey" FOREIGN KEY ("staffTypeId") REFERENCES "ql-danh-muc"."StaffType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Staff" ADD CONSTRAINT "Staff_staffPositionId_fkey" FOREIGN KEY ("staffPositionId") REFERENCES "ql-danh-muc"."StaffPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StaffHistory" ADD CONSTRAINT "StaffHistory_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StaffHistory" ADD CONSTRAINT "StaffHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ql-danh-muc"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StaffHistory" ADD CONSTRAINT "StaffHistory_staffTypeId_fkey" FOREIGN KEY ("staffTypeId") REFERENCES "ql-danh-muc"."StaffType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StaffHistory" ADD CONSTRAINT "StaffHistory_staffPositionId_fkey" FOREIGN KEY ("staffPositionId") REFERENCES "ql-danh-muc"."StaffPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_SubjectVersionToTrainingObjectType" ADD CONSTRAINT "_SubjectVersionToTrainingObjectType_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_SubjectVersionToTrainingObjectType" ADD CONSTRAINT "_SubjectVersionToTrainingObjectType_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."TrainingObjectType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_PrerequisiteSubject" ADD CONSTRAINT "_PrerequisiteSubject_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_PrerequisiteSubject" ADD CONSTRAINT "_PrerequisiteSubject_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_CoRequisiteSubject" ADD CONSTRAINT "_CoRequisiteSubject_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_CoRequisiteSubject" ADD CONSTRAINT "_CoRequisiteSubject_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."SubjectVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_PriorityObjectToStudent" ADD CONSTRAINT "_PriorityObjectToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."PriorityObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."_PriorityObjectToStudent" ADD CONSTRAINT "_PriorityObjectToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."_GroupToUser" ADD CONSTRAINT "_GroupToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-nguoi-dung"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."_GroupToUser" ADD CONSTRAINT "_GroupToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-nguoi-dung"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."_GroupToRole" ADD CONSTRAINT "_GroupToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-nguoi-dung"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."_GroupToRole" ADD CONSTRAINT "_GroupToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-nguoi-dung"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-nguoi-dung"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-nguoi-dung"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
