-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tro-ly-ao";

-- CreateEnum
CREATE TYPE "tro-ly-ao"."MessageSender" AS ENUM ('USER', 'BOT');

-- CreateEnum
CREATE TYPE "tro-ly-ao"."Status" AS ENUM ('PENDING', 'APPROVE', 'DENY');

-- CreateEnum
CREATE TYPE "tro-ly-ao"."DocumentType" AS ENUM ('GENERAL_ADMISSIONS_INFORMATION', 'ADMISSIONS_RULES_AND_REGULATIONS', 'TRAINING_RULES_AND_REGULATIONS', 'EXAMINATION_RULES_AND_REGULATIONS', 'ACADEMY_INFORMATION', 'TRAINING_PROGRAMS_INFORMATION', 'REGULATIONS_POLICIES_AND_BENEFITS_FOR_MILITARY_CADETS', 'REGULATIONS_POLICIES_AND_BENEFITS_FOR_CIVILIAN_STUDENTS', 'FREQUENTLY_ASKED_QUESTIONS', 'PARTY_WORK_AND_POLITICAL_WORK', 'INTERNAL_GUIDELINES_AND_REGULATIONS_OF_THE_ACADEMY', 'IN_THE_FACULTY_HANDBOOK', 'TRANSLATION_FROM_OTHER_LANGUAGES_INTO_VIETNAMESE', 'DETECTION_AND_CORRECTION_OF_TEXT_ERRORS', 'EXTRACTIVE_TEXT_SUMMARIZATION', 'ABSTRACTIVE_TEXT_SUMMARIZATION');

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
    "status" "tro-ly-ao"."Status" NOT NULL,
    "uri" TEXT,
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
    "status" "tro-ly-ao"."Status" NOT NULL,
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
    "status" "tro-ly-ao"."Status" NOT NULL,
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
