-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "he-thong";

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
CREATE TYPE "ql-dao-tao"."SubjectEquivalentType" AS ENUM ('NONE', 'OneByOne', 'TwoByOne', 'ThreeByOne', 'FourByOne', 'OneByTwo', 'OneByThree');

-- CreateEnum
CREATE TYPE "ql-dao-tao"."CurriculumVersionSubjectType" AS ENUM ('NONE', 'MANDATORY', 'OPTIONAL', 'ELECTIVE');

-- CreateEnum
CREATE TYPE "ql-nguoi-dung"."FixedClassStudentStatus" AS ENUM ('ENROLLED', 'GRADUATED', 'DEFERRED_STUDY', 'SUSPENDED_STUDY', 'WITHDRAWN', 'TRANSFERRED', 'PENDING_GRADUATION_REVIEW', 'ACADEMIC_SUSPENSION');

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
CREATE TYPE "ql-danh-muc"."Gender" AS ENUM ('Male', 'Female');

-- CreateEnum
CREATE TYPE "ql-danh-muc"."TemplateFileType" AS ENUM ('UPLOAD', 'DOWNLOAD', 'LOGS');

-- CreateTable
CREATE TABLE "ql-danh-muc"."Province" (
    "id" TEXT NOT NULL,
    "code" TEXT,
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
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AcademicRankType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."Position" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."PositionCPV" (
    "id" TEXT NOT NULL,
    "code" TEXT,
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
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "parentId" TEXT,
    "address" TEXT,
    "organizationId" TEXT,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."SchoolYear" (
    "id" TEXT NOT NULL,
    "code" TEXT,
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
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "schoolYearId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Milestone" (
    "id" TEXT NOT NULL,
    "code" TEXT,
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
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "trainingCourseId" TEXT,
    "managementOrganizationId" TEXT,
    "classSize" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FixedClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Curriculum" (
    "id" TEXT NOT NULL,
    "code" TEXT,
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
    "infomation" TEXT NOT NULL,
    "documentPath" TEXT,
    "renderPath" TEXT,

    CONSTRAINT "Curriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."CurriculumVersion" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ql-dao-tao"."CurriculumStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "curriculumId" TEXT NOT NULL,
    "infomation" TEXT,
    "documentPath" TEXT,
    "renderPath" TEXT,

    CONSTRAINT "CurriculumVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."SubjectGroup" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "managementOrganizationId" TEXT NOT NULL,
    "infomation" TEXT,

    CONSTRAINT "SubjectGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."Subject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "subjectEquivalentType" "ql-dao-tao"."SubjectEquivalentType" NOT NULL DEFAULT 'NONE',
    "credit" INTEGER NOT NULL DEFAULT 0,
    "period" INTEGER NOT NULL DEFAULT 0,
    "numberOfTheory" INTEGER NOT NULL DEFAULT 0,
    "numberOfPractice" INTEGER NOT NULL DEFAULT 0,
    "numberOfSelfStudy" INTEGER NOT NULL DEFAULT 0,
    "numberOfProject" INTEGER NOT NULL DEFAULT 0,
    "numberOfInternship" INTEGER NOT NULL DEFAULT 0,
    "numberOfOther" INTEGER NOT NULL DEFAULT 0,
    "managementOrganizationId" TEXT NOT NULL,
    "subjectGroupId" TEXT NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."CurriculumVersionSubject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "curriculumVersionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "traningBlockId" TEXT,
    "infomation" TEXT,
    "documentPath" TEXT,
    "renderPath" TEXT,

    CONSTRAINT "CurriculumVersionSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."PrerequisiteSubject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "curriculumVersionSubjectId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "PrerequisiteSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-dao-tao"."CoRequisiteSubject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "curriculumVersionSubjectId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "CoRequisiteSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."TrainingObjectType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingObjectType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."TrainingType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."TrainingLevel" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."TrainingForm" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."TrainingLocation" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."TrainingField" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."TrainingMajor" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingMajor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."TrainingBlock" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."TrainingTime" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."StudyRank" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "StudyRank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."TrainingRank" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingRank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."TrainingKPI" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TrainingKPI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."UserProfile" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "userTypeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "placeOfBirth" TEXT,
    "homeTown" TEXT,
    "idCardNumber" TEXT,
    "idCardDate" TIMESTAMP(3),
    "officerNumber" TEXT,
    "priorityObjectId" TEXT,
    "registrationAreaId" TEXT,
    "nationalityId" TEXT,
    "religionId" TEXT,
    "ethnicityId" TEXT,
    "gender" "ql-danh-muc"."Gender",
    "permanentAddress" TEXT,
    "temporaryAddress" TEXT,
    "contactAddress" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "parentPhoneNumber" TEXT,
    "parentName" TEXT,
    "unionDate" TIMESTAMP(3),
    "unionPlace" TEXT,
    "CPVJoinDate" TIMESTAMP(3),
    "officialCPVDate" TIMESTAMP(3),
    "CPVJoinPlace" TEXT,
    "tenureDate" TIMESTAMP(3),
    "enlistmentDate" TIMESTAMP(3),
    "dischargeDate" TIMESTAMP(3),
    "rankName" TEXT,
    "educationLevel" TEXT,
    "academicDegreeTypeName" TEXT,
    "academicRankTypeName" TEXT,
    "positionName" TEXT,
    "positionCPVName" TEXT,
    "organizationName" TEXT,
    "organizationCPVName" TEXT,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."FixedClassStudent" (
    "id" TEXT NOT NULL,
    "fixedClassId" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "status" "ql-nguoi-dung"."FixedClassStudentStatus" NOT NULL DEFAULT 'ENROLLED',
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "FixedClassStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."User" (
    "id" TEXT NOT NULL,
    "code" TEXT,
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
CREATE TABLE "tro-ly-ao"."Document" (
    "id" TEXT NOT NULL,
    "code" TEXT,
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
CREATE TABLE "ql-danh-muc"."PriorityObject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PriorityObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."RegistrationArea" (
    "id" TEXT NOT NULL,
    "code" TEXT,
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
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Ethnicity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."UserType" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "UserType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-nguoi-dung"."BlockedIp" (
    "id" TEXT NOT NULL,
    "code" TEXT,
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
CREATE TABLE "he-thong"."Config" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."TemplateFile" (
    "id" TEXT NOT NULL,
    "code" TEXT,
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
CREATE UNIQUE INDEX "Commune_name_provinceId_key" ON "ql-danh-muc"."Commune"("name", "provinceId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_name_key" ON "ql-danh-muc"."Organization"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "ql-nguoi-dung"."UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "ql-nguoi-dung"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_userName_key" ON "ql-nguoi-dung"."User"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "User_ssoId_key" ON "ql-nguoi-dung"."User"("ssoId");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "ql-nguoi-dung"."User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_permissionType_key" ON "ql-nguoi-dung"."Permission"("name", "permissionType");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedIp_ipAddress_key" ON "ql-nguoi-dung"."BlockedIp"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Config_key_key" ON "he-thong"."Config"("key");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateFile_path_key" ON "ql-danh-muc"."TemplateFile"("path");

-- CreateIndex
CREATE INDEX "_GroupToUser_B_index" ON "ql-nguoi-dung"."_GroupToUser"("B");

-- CreateIndex
CREATE INDEX "_GroupToRole_B_index" ON "ql-nguoi-dung"."_GroupToRole"("B");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "ql-nguoi-dung"."_PermissionToRole"("B");

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."Commune" ADD CONSTRAINT "Commune_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "ql-danh-muc"."Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."Organization" ADD CONSTRAINT "Organization_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ql-danh-muc"."OrganizationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."Organization" ADD CONSTRAINT "Organization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ql-danh-muc"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Semester" ADD CONSTRAINT "Semester_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "ql-dao-tao"."SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Milestone" ADD CONSTRAINT "Milestone_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "ql-dao-tao"."SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingCourse" ADD CONSTRAINT "TrainingCourse_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-danh-muc"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingCourse" ADD CONSTRAINT "TrainingCourse_trainingTypeId_fkey" FOREIGN KEY ("trainingTypeId") REFERENCES "ql-danh-muc"."TrainingType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingCourse" ADD CONSTRAINT "TrainingCourse_trainingLevelId_fkey" FOREIGN KEY ("trainingLevelId") REFERENCES "ql-danh-muc"."TrainingLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingCourse" ADD CONSTRAINT "TrainingCourse_trainingFormId_fkey" FOREIGN KEY ("trainingFormId") REFERENCES "ql-danh-muc"."TrainingForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" ADD CONSTRAINT "FixedClass_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" ADD CONSTRAINT "FixedClass_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "ql-danh-muc"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Curriculum" ADD CONSTRAINT "Curriculum_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "ql-danh-muc"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Curriculum" ADD CONSTRAINT "Curriculum_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-danh-muc"."TrainingObjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Curriculum" ADD CONSTRAINT "Curriculum_trainingLevelId_fkey" FOREIGN KEY ("trainingLevelId") REFERENCES "ql-danh-muc"."TrainingLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Curriculum" ADD CONSTRAINT "Curriculum_trainingTimeId_fkey" FOREIGN KEY ("trainingTimeId") REFERENCES "ql-danh-muc"."TrainingTime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Curriculum" ADD CONSTRAINT "Curriculum_trainingMajorId_fkey" FOREIGN KEY ("trainingMajorId") REFERENCES "ql-danh-muc"."TrainingMajor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersion" ADD CONSTRAINT "CurriculumVersion_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "ql-dao-tao"."Curriculum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectGroup" ADD CONSTRAINT "SubjectGroup_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "ql-danh-muc"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Subject" ADD CONSTRAINT "Subject_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "ql-danh-muc"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Subject" ADD CONSTRAINT "Subject_subjectGroupId_fkey" FOREIGN KEY ("subjectGroupId") REFERENCES "ql-dao-tao"."SubjectGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersionSubject" ADD CONSTRAINT "CurriculumVersionSubject_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "ql-dao-tao"."CurriculumVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersionSubject" ADD CONSTRAINT "CurriculumVersionSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CurriculumVersionSubject" ADD CONSTRAINT "CurriculumVersionSubject_traningBlockId_fkey" FOREIGN KEY ("traningBlockId") REFERENCES "ql-danh-muc"."TrainingBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."PrerequisiteSubject" ADD CONSTRAINT "PrerequisiteSubject_curriculumVersionSubjectId_fkey" FOREIGN KEY ("curriculumVersionSubjectId") REFERENCES "ql-dao-tao"."CurriculumVersionSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."PrerequisiteSubject" ADD CONSTRAINT "PrerequisiteSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CoRequisiteSubject" ADD CONSTRAINT "CoRequisiteSubject_curriculumVersionSubjectId_fkey" FOREIGN KEY ("curriculumVersionSubjectId") REFERENCES "ql-dao-tao"."CurriculumVersionSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."CoRequisiteSubject" ADD CONSTRAINT "CoRequisiteSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ql-nguoi-dung"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_userTypeId_fkey" FOREIGN KEY ("userTypeId") REFERENCES "ql-danh-muc"."UserType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_priorityObjectId_fkey" FOREIGN KEY ("priorityObjectId") REFERENCES "ql-danh-muc"."PriorityObject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_registrationAreaId_fkey" FOREIGN KEY ("registrationAreaId") REFERENCES "ql-danh-muc"."RegistrationArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_nationalityId_fkey" FOREIGN KEY ("nationalityId") REFERENCES "ql-danh-muc"."Nationality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_religionId_fkey" FOREIGN KEY ("religionId") REFERENCES "ql-danh-muc"."Religion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_ethnicityId_fkey" FOREIGN KEY ("ethnicityId") REFERENCES "ql-danh-muc"."Ethnicity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."FixedClassStudent" ADD CONSTRAINT "FixedClassStudent_fixedClassId_fkey" FOREIGN KEY ("fixedClassId") REFERENCES "ql-dao-tao"."FixedClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."FixedClassStudent" ADD CONSTRAINT "FixedClassStudent_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
