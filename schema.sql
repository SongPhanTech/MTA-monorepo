--
-- PostgreSQL database dump
--

\restrict nmBVKmtFxWYSbWDahL0wfSCjv2cq3cxiht22pXNR9GojSqLCyCqkgwReu4NiSNS

-- Dumped from database version 15.13 (Debian 15.13-1.pgdg120+1)
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: he-thong; Type: SCHEMA; Schema: -; Owner: admin
--

CREATE SCHEMA "he-thong";


ALTER SCHEMA "he-thong" OWNER TO admin;

--
-- Name: khao-thi; Type: SCHEMA; Schema: -; Owner: admin
--

CREATE SCHEMA "khao-thi";


ALTER SCHEMA "khao-thi" OWNER TO admin;

--
-- Name: mta; Type: SCHEMA; Schema: -; Owner: admin
--

CREATE SCHEMA mta;


ALTER SCHEMA mta OWNER TO admin;

--
-- Name: ql-danh-muc; Type: SCHEMA; Schema: -; Owner: admin
--

CREATE SCHEMA "ql-danh-muc";


ALTER SCHEMA "ql-danh-muc" OWNER TO admin;

--
-- Name: ql-dao-tao; Type: SCHEMA; Schema: -; Owner: admin
--

CREATE SCHEMA "ql-dao-tao";


ALTER SCHEMA "ql-dao-tao" OWNER TO admin;

--
-- Name: ql-ho-so; Type: SCHEMA; Schema: -; Owner: admin
--

CREATE SCHEMA "ql-ho-so";


ALTER SCHEMA "ql-ho-so" OWNER TO admin;

--
-- Name: ql-nguoi-dung; Type: SCHEMA; Schema: -; Owner: admin
--

CREATE SCHEMA "ql-nguoi-dung";


ALTER SCHEMA "ql-nguoi-dung" OWNER TO admin;

--
-- Name: tro-ly-ao; Type: SCHEMA; Schema: -; Owner: admin
--

CREATE SCHEMA "tro-ly-ao";


ALTER SCHEMA "tro-ly-ao" OWNER TO admin;

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: ConfigKey; Type: TYPE; Schema: he-thong; Owner: admin
--

CREATE TYPE "he-thong"."ConfigKey" AS ENUM (
    'MANAGEMENT_DEPARTMENT',
    'ACADEMY_NAME',
    'ACADEMY_CODE',
    'DIRECTOR',
    'TRAINING_DEPARTMENT',
    'HEAD_OF_TRAINING_DEPARTMENT',
    'EXAMINATION_DEPARTMENT',
    'HEAD_OF_EXAMINATION_DEPARTMENT',
    'PROVINCE',
    'DISTRICT',
    'WARD',
    'USER_SESSION_TIMEOUT',
    'ACADEMIC_ACTION_RULES'
);


ALTER TYPE "he-thong"."ConfigKey" OWNER TO admin;

--
-- Name: EvaluationCriterionStatus; Type: TYPE; Schema: khao-thi; Owner: admin
--

CREATE TYPE "khao-thi"."EvaluationCriterionStatus" AS ENUM (
    'PENDING',
    'SUBMITTED',
    'REVISION',
    'APPROVED',
    'COMPLETED'
);


ALTER TYPE "khao-thi"."EvaluationCriterionStatus" OWNER TO admin;

--
-- Name: EvaluationMemberRole; Type: TYPE; Schema: khao-thi; Owner: admin
--

CREATE TYPE "khao-thi"."EvaluationMemberRole" AS ENUM (
    'CHAIRMAN',
    'VICE_PRESIDENT',
    'HEAD_SECRETARY',
    'SECRETARY',
    'MEMBER',
    'ADVISORY_BOARD',
    'HEAD_SPECIALIZED',
    'SPECIALIZED'
);


ALTER TYPE "khao-thi"."EvaluationMemberRole" OWNER TO admin;

--
-- Name: EvaluationPeriodStatus; Type: TYPE; Schema: khao-thi; Owner: admin
--

CREATE TYPE "khao-thi"."EvaluationPeriodStatus" AS ENUM (
    'COUNCIL_ESTABLISHED',
    'ASSIGNMENT',
    'ANALYSIS_WRITING',
    'SECRETARY_REVIEW',
    'DIRECTOR_REVIEW',
    'EVALUATION_WRITING',
    'CROSS_REVIEW_ASSIGNMENT',
    'CROSS_REVIEW',
    'CONSOLIDATION',
    'COUNCIL_APPROVAL',
    'COMPLETED'
);


ALTER TYPE "khao-thi"."EvaluationPeriodStatus" OWNER TO admin;

--
-- Name: EvaluationStatus; Type: TYPE; Schema: khao-thi; Owner: admin
--

CREATE TYPE "khao-thi"."EvaluationStatus" AS ENUM (
    'LOCK',
    'PENDING',
    'SUBMITTED',
    'REVISION',
    'APPROVED',
    'COMPLETED'
);


ALTER TYPE "khao-thi"."EvaluationStatus" OWNER TO admin;

--
-- Name: QuestionType; Type: TYPE; Schema: khao-thi; Owner: admin
--

CREATE TYPE "khao-thi"."QuestionType" AS ENUM (
    'ESSAY',
    'ORAL',
    'SINGLE_CHOICE',
    'MULTIPLE_CHOICE',
    'FILL_IN_BLANK',
    'ORDERING'
);


ALTER TYPE "khao-thi"."QuestionType" OWNER TO admin;

--
-- Name: StandardCatalogType; Type: TYPE; Schema: khao-thi; Owner: admin
--

CREATE TYPE "khao-thi"."StandardCatalogType" AS ENUM (
    'ASSET',
    'PROGRAM'
);


ALTER TYPE "khao-thi"."StandardCatalogType" OWNER TO admin;

--
-- Name: SurveyObject; Type: TYPE; Schema: khao-thi; Owner: admin
--

CREATE TYPE "khao-thi"."SurveyObject" AS ENUM (
    'MILITARY_STUDENT',
    'CIVILIAN_STUDENT',
    'LECTURER',
    'STAFF'
);


ALTER TYPE "khao-thi"."SurveyObject" OWNER TO admin;

--
-- Name: SurveyQuestionType; Type: TYPE; Schema: khao-thi; Owner: admin
--

CREATE TYPE "khao-thi"."SurveyQuestionType" AS ENUM (
    'ESSAY',
    'SINGLE_CHOICE'
);


ALTER TYPE "khao-thi"."SurveyQuestionType" OWNER TO admin;

--
-- Name: SurveyType; Type: TYPE; Schema: khao-thi; Owner: admin
--

CREATE TYPE "khao-thi"."SurveyType" AS ENUM (
    'SINGLE',
    'CLUSTER'
);


ALTER TYPE "khao-thi"."SurveyType" OWNER TO admin;

--
-- Name: NotificationPriority; Type: TYPE; Schema: ql-danh-muc; Owner: admin
--

CREATE TYPE "ql-danh-muc"."NotificationPriority" AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);


ALTER TYPE "ql-danh-muc"."NotificationPriority" OWNER TO admin;

--
-- Name: NotificationType; Type: TYPE; Schema: ql-danh-muc; Owner: admin
--

CREATE TYPE "ql-danh-muc"."NotificationType" AS ENUM (
    'GENERAL',
    'ACADEMIC',
    'EXAM',
    'EVENT',
    'SCHOLARSHIP',
    'TUITION',
    'URGENT',
    'MAINTENANCE'
);


ALTER TYPE "ql-danh-muc"."NotificationType" OWNER TO admin;

--
-- Name: TemplateFileType; Type: TYPE; Schema: ql-danh-muc; Owner: admin
--

CREATE TYPE "ql-danh-muc"."TemplateFileType" AS ENUM (
    'UPLOAD',
    'DOWNLOAD',
    'LOGS'
);


ALTER TYPE "ql-danh-muc"."TemplateFileType" OWNER TO admin;

--
-- Name: AcademicActionType; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."AcademicActionType" AS ENUM (
    'REPEAT_YEAR',
    'SUSPENSION',
    'EXPULSION'
);


ALTER TYPE "ql-dao-tao"."AcademicActionType" OWNER TO admin;

--
-- Name: AcademicRankingBaseType; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."AcademicRankingBaseType" AS ENUM (
    'Base10',
    'Base4'
);


ALTER TYPE "ql-dao-tao"."AcademicRankingBaseType" OWNER TO admin;

--
-- Name: ApplicationStatus; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."ApplicationStatus" AS ENUM (
    'SUBMITTED',
    'IN_REVIEW',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE "ql-dao-tao"."ApplicationStatus" OWNER TO admin;

--
-- Name: ArchivedCertificateStatus; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."ArchivedCertificateStatus" AS ENUM (
    'PENDING',
    'CANCEL',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE "ql-dao-tao"."ArchivedCertificateStatus" OWNER TO admin;

--
-- Name: ClassRegisterStatus; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."ClassRegisterStatus" AS ENUM (
    'PENDING',
    'CANCELLED',
    'SUCCESS',
    'FAILED'
);


ALTER TYPE "ql-dao-tao"."ClassRegisterStatus" OWNER TO admin;

--
-- Name: CouncilProposalStatus; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."CouncilProposalStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE "ql-dao-tao"."CouncilProposalStatus" OWNER TO admin;

--
-- Name: CouncilRole; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."CouncilRole" AS ENUM (
    'CHAIRMAN',
    'SECRETARY',
    'REVIEWER_1',
    'REVIEWER_2',
    'MEMBER'
);


ALTER TYPE "ql-dao-tao"."CouncilRole" OWNER TO admin;

--
-- Name: CriteriaField; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."CriteriaField" AS ENUM (
    'SEMESTER_GPA',
    'YEARLY_GPA',
    'CUMULATIVE_GPA',
    'ENTRY_SCORE',
    'COURSE_GRADE_LOWEST',
    'GRADUATION_COURSE_GRADE_LOWEST',
    'SEMESTER_REGISTERED_CREDITS',
    'SEMESTER_PASSED_CREDITS',
    'SEMESTER_FAILED_CREDITS',
    'YEAR_FAILED_CREDITS',
    'FAILED_CREDITS_PERCENT',
    'CUMULATIVE_PASSED_CREDITS',
    'CUMULATIVE_DEBT_CREDITS',
    'CUMULATIVE_PROGRESS_PERCENT',
    'ACADEMIC_WARNING_LEVEL',
    'DISCIPLINARY_WARNING_LEVEL',
    'REPEAT_YEAR_COUNT',
    'SUSPENSION_COUNT',
    'CONDUCT_SCORE',
    'HAS_PASSED_FOREIGN_LANGUAGE',
    'HAS_REGISTERED_FOR_SEMESTER',
    'IS_PRIORITY_STUDENT',
    'IS_CLASS_MONITOR_OR_LEADER',
    'IS_STUDY_DURATION_EXCEEDED',
    'IS_DEBT_SUBJECT_CONSECUTIVE',
    'HAS_IMPROVEMENT_REGISTRATION'
);


ALTER TYPE "ql-dao-tao"."CriteriaField" OWNER TO admin;

--
-- Name: CriteriaOperator; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."CriteriaOperator" AS ENUM (
    'GT',
    'GTE',
    'LT',
    'LTE',
    'EQ',
    'IN'
);


ALTER TYPE "ql-dao-tao"."CriteriaOperator" OWNER TO admin;

--
-- Name: CurriculumVersionType; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."CurriculumVersionType" AS ENUM (
    'FRAMEWORK',
    'FULL_COURSE'
);


ALTER TYPE "ql-dao-tao"."CurriculumVersionType" OWNER TO admin;

--
-- Name: DecisionStatus; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."DecisionStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'APPEALED'
);


ALTER TYPE "ql-dao-tao"."DecisionStatus" OWNER TO admin;

--
-- Name: DecisionType; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."DecisionType" AS ENUM (
    'SUPERVISION_GUIDE',
    'EVALUATION_COUNCIL'
);


ALTER TYPE "ql-dao-tao"."DecisionType" OWNER TO admin;

--
-- Name: DiplomaTypeEnum; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."DiplomaTypeEnum" AS ENUM (
    'MASTER',
    'DOCTORATE',
    'ENGINEER',
    'BACHELOR'
);


ALTER TYPE "ql-dao-tao"."DiplomaTypeEnum" OWNER TO admin;

--
-- Name: DiplomaVerificationStatus; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."DiplomaVerificationStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE "ql-dao-tao"."DiplomaVerificationStatus" OWNER TO admin;

--
-- Name: EquivalencySide; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."EquivalencySide" AS ENUM (
    'SOURCE',
    'TARGET'
);


ALTER TYPE "ql-dao-tao"."EquivalencySide" OWNER TO admin;

--
-- Name: ExamType; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."ExamType" AS ENUM (
    'OfflineWritten',
    'OnlineWritten',
    'Oral',
    'Practice',
    'Project',
    'Other'
);


ALTER TYPE "ql-dao-tao"."ExamType" OWNER TO admin;

--
-- Name: GraduationSessionStatus; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."GraduationSessionStatus" AS ENUM (
    'PLANNING',
    'OPEN_FOR_APPLICATION',
    'IN_REVIEW',
    'COMPLETED',
    'CLOSED'
);


ALTER TYPE "ql-dao-tao"."GraduationSessionStatus" OWNER TO admin;

--
-- Name: PaymentStatus; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."PaymentStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'PAID',
    'FAILED'
);


ALTER TYPE "ql-dao-tao"."PaymentStatus" OWNER TO admin;

--
-- Name: PeriodType; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."PeriodType" AS ENUM (
    'THEORY',
    'PRACTICE',
    'LAB',
    'SEMINAR',
    'EXAM',
    'MAKEUP',
    'REVIEW',
    'CHECK',
    'WEEK'
);


ALTER TYPE "ql-dao-tao"."PeriodType" OWNER TO admin;

--
-- Name: RankingContext; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."RankingContext" AS ENUM (
    'STUDYING',
    'GRADUATION'
);


ALTER TYPE "ql-dao-tao"."RankingContext" OWNER TO admin;

--
-- Name: RegistrationStatus; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."RegistrationStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


ALTER TYPE "ql-dao-tao"."RegistrationStatus" OWNER TO admin;

--
-- Name: ReminderRepeatType; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."ReminderRepeatType" AS ENUM (
    'NONE',
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'YEARLY'
);


ALTER TYPE "ql-dao-tao"."ReminderRepeatType" OWNER TO admin;

--
-- Name: ResearchProjectStatus; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."ResearchProjectStatus" AS ENUM (
    'OPEN',
    'FULL',
    'CLOSED',
    'COMPLETED'
);


ALTER TYPE "ql-dao-tao"."ResearchProjectStatus" OWNER TO admin;

--
-- Name: ScoreConvertStatus; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."ScoreConvertStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE "ql-dao-tao"."ScoreConvertStatus" OWNER TO admin;

--
-- Name: SemesterType; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."SemesterType" AS ENUM (
    'FIRST',
    'FIRST_SUPPLEMENTARY',
    'SECOND',
    'SECOND_SUPPLEMENTARY',
    'SUMMER'
);


ALTER TYPE "ql-dao-tao"."SemesterType" OWNER TO admin;

--
-- Name: StudentStatus; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."StudentStatus" AS ENUM (
    'ENROLLED',
    'GRADUATED',
    'DEFERRED_STUDY',
    'SUSPENDED_STUDY',
    'WITHDRAWN',
    'TRANSFERRED',
    'PENDING_GRADUATION_REVIEW',
    'ACADEMIC_SUSPENSION',
    'REPEATED'
);


ALTER TYPE "ql-dao-tao"."StudentStatus" OWNER TO admin;

--
-- Name: StudentThesisRegistrationStatus; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."StudentThesisRegistrationStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'CANCELED'
);


ALTER TYPE "ql-dao-tao"."StudentThesisRegistrationStatus" OWNER TO admin;

--
-- Name: StudentTrainingType; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."StudentTrainingType" AS ENUM (
    'EXCELLENT',
    'GOOD',
    'FAIR',
    'MEDIUM',
    'AVERAGE',
    'POOR',
    'VERY_POOR'
);


ALTER TYPE "ql-dao-tao"."StudentTrainingType" OWNER TO admin;

--
-- Name: SubjectClassSchedule; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."SubjectClassSchedule" AS ENUM (
    'MORNING',
    'AFTERNOON',
    'EVENING'
);


ALTER TYPE "ql-dao-tao"."SubjectClassSchedule" OWNER TO admin;

--
-- Name: SubjectClassStatus; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."SubjectClassStatus" AS ENUM (
    'DRAFT',
    'OFFICIAL'
);


ALTER TYPE "ql-dao-tao"."SubjectClassStatus" OWNER TO admin;

--
-- Name: SubjectClassType; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."SubjectClassType" AS ENUM (
    'NORMAL',
    'RETAKE',
    'REEXAM'
);


ALTER TYPE "ql-dao-tao"."SubjectClassType" OWNER TO admin;

--
-- Name: SubjectRequirementType; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."SubjectRequirementType" AS ENUM (
    'Mandatory',
    'Optional'
);


ALTER TYPE "ql-dao-tao"."SubjectRequirementType" OWNER TO admin;

--
-- Name: SubjectVersionType; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."SubjectVersionType" AS ENUM (
    'Normal',
    'Internship',
    'Research',
    'Project',
    'Practice',
    'Graduation'
);


ALTER TYPE "ql-dao-tao"."SubjectVersionType" OWNER TO admin;

--
-- Name: SupervisorRole; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."SupervisorRole" AS ENUM (
    'SUPERVISOR',
    'CO_SUPERVISOR'
);


ALTER TYPE "ql-dao-tao"."SupervisorRole" OWNER TO admin;

--
-- Name: ThesisProjectStatus; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."ThesisProjectStatus" AS ENUM (
    'PROPOSED',
    'APPROVED_BY_DEPT',
    'ASSIGNED',
    'IN_PROGRESS',
    'DEFENSE_ELIGIBLE',
    'DEFENDED_PASSED',
    'DEFENDED_FAILED',
    'COMPLETED',
    'CANCELED'
);


ALTER TYPE "ql-dao-tao"."ThesisProjectStatus" OWNER TO admin;

--
-- Name: ThesisType; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."ThesisType" AS ENUM (
    'THESIS',
    'PROJECT'
);


ALTER TYPE "ql-dao-tao"."ThesisType" OWNER TO admin;

--
-- Name: TrainingObjectTypes; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."TrainingObjectTypes" AS ENUM (
    'MILITARY',
    'CIVILIAN',
    'INTERNATIONAL_MILITARY'
);


ALTER TYPE "ql-dao-tao"."TrainingObjectTypes" OWNER TO admin;

--
-- Name: TrainingScoreStatus; Type: TYPE; Schema: ql-dao-tao; Owner: admin
--

CREATE TYPE "ql-dao-tao"."TrainingScoreStatus" AS ENUM (
    'PENDING',
    'APPROVED'
);


ALTER TYPE "ql-dao-tao"."TrainingScoreStatus" OWNER TO admin;

--
-- Name: FeedbackStatus; Type: TYPE; Schema: ql-nguoi-dung; Owner: admin
--

CREATE TYPE "ql-nguoi-dung"."FeedbackStatus" AS ENUM (
    'Pending',
    'InProgress',
    'Resolved',
    'Closed'
);


ALTER TYPE "ql-nguoi-dung"."FeedbackStatus" OWNER TO admin;

--
-- Name: PermissionType; Type: TYPE; Schema: ql-nguoi-dung; Owner: admin
--

CREATE TYPE "ql-nguoi-dung"."PermissionType" AS ENUM (
    'CREATE',
    'READ',
    'UPDATE',
    'DELETE',
    'APPROVE',
    'DETAIL'
);


ALTER TYPE "ql-nguoi-dung"."PermissionType" OWNER TO admin;

--
-- Name: Satisfaction; Type: TYPE; Schema: ql-nguoi-dung; Owner: admin
--

CREATE TYPE "ql-nguoi-dung"."Satisfaction" AS ENUM (
    'VeryDissatisfied',
    'Dissatisfied',
    'Neutral',
    'Satisfied',
    'VerySatisfied'
);


ALTER TYPE "ql-nguoi-dung"."Satisfaction" OWNER TO admin;

--
-- Name: UserRole; Type: TYPE; Schema: ql-nguoi-dung; Owner: admin
--

CREATE TYPE "ql-nguoi-dung"."UserRole" AS ENUM (
    'ADMIN',
    'USER'
);


ALTER TYPE "ql-nguoi-dung"."UserRole" OWNER TO admin;

--
-- Name: UserType; Type: TYPE; Schema: ql-nguoi-dung; Owner: admin
--

CREATE TYPE "ql-nguoi-dung"."UserType" AS ENUM (
    'MILITARY_STUDENT',
    'CIVILIAN_STUDENT',
    'LECTURER',
    'STAFF',
    'PROFESSIONAL',
    'CONTRACT',
    'OTHER'
);


ALTER TYPE "ql-nguoi-dung"."UserType" OWNER TO admin;

--
-- Name: DocumentStatus; Type: TYPE; Schema: tro-ly-ao; Owner: admin
--

CREATE TYPE "tro-ly-ao"."DocumentStatus" AS ENUM (
    'PENDING',
    'APPROVE',
    'DENY'
);


ALTER TYPE "tro-ly-ao"."DocumentStatus" OWNER TO admin;

--
-- Name: MessageSender; Type: TYPE; Schema: tro-ly-ao; Owner: admin
--

CREATE TYPE "tro-ly-ao"."MessageSender" AS ENUM (
    'USER',
    'BOT'
);


ALTER TYPE "tro-ly-ao"."MessageSender" OWNER TO admin;

--
-- Name: update_fullname(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.update_fullname() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.fullname := NEW."lastName" || ' ' || NEW."firstName";
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_fullname() OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ChangeLog; Type: TABLE; Schema: he-thong; Owner: admin
--

CREATE TABLE "he-thong"."ChangeLog" (
    id text NOT NULL,
    "tableName" text NOT NULL,
    "recordId" text NOT NULL,
    operation text NOT NULL,
    "changedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "oldData" jsonb,
    "newData" jsonb,
    "transactionId" text,
    source text,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "he-thong"."ChangeLog" OWNER TO admin;

--
-- Name: Config; Type: TABLE; Schema: he-thong; Owner: admin
--

CREATE TABLE "he-thong"."Config" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    key "he-thong"."ConfigKey" NOT NULL,
    value text NOT NULL
);


ALTER TABLE "he-thong"."Config" OWNER TO admin;

--
-- Name: Suggestion; Type: TABLE; Schema: he-thong; Owner: admin
--

CREATE TABLE "he-thong"."Suggestion" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    key text NOT NULL,
    value text NOT NULL
);


ALTER TABLE "he-thong"."Suggestion" OWNER TO admin;

--
-- Name: AnalysisCriterion; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."AnalysisCriterion" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "criterionPeriodId" text NOT NULL,
    "lecturerId" text,
    deadline timestamp(3) without time zone,
    status "khao-thi"."EvaluationCriterionStatus" DEFAULT 'PENDING'::"khao-thi"."EvaluationCriterionStatus" NOT NULL
);


ALTER TABLE "khao-thi"."AnalysisCriterion" OWNER TO admin;

--
-- Name: AnalysisFormEvidence; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."AnalysisFormEvidence" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "requirementCriterionId" text NOT NULL,
    "evidenceId" text NOT NULL,
    "order" integer NOT NULL
);


ALTER TABLE "khao-thi"."AnalysisFormEvidence" OWNER TO admin;

--
-- Name: ClusterSurvey; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."ClusterSurvey" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "additionalSuggestion" boolean NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    "isPublic" boolean DEFAULT false NOT NULL,
    anonymous boolean DEFAULT true NOT NULL,
    "surveyTopicId" text NOT NULL
);


ALTER TABLE "khao-thi"."ClusterSurvey" OWNER TO admin;

--
-- Name: CriterionCatalog; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."CriterionCatalog" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "standardId" text NOT NULL,
    "order" integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE "khao-thi"."CriterionCatalog" OWNER TO admin;

--
-- Name: CriterionPeriod; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."CriterionPeriod" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "order" integer NOT NULL,
    "evaluationStandardId" text NOT NULL
);


ALTER TABLE "khao-thi"."CriterionPeriod" OWNER TO admin;

--
-- Name: Difficulty; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."Difficulty" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    level integer
);


ALTER TABLE "khao-thi"."Difficulty" OWNER TO admin;

--
-- Name: EvaluationCouncil; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."EvaluationCouncil" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "periodId" text NOT NULL,
    name text NOT NULL
);


ALTER TABLE "khao-thi"."EvaluationCouncil" OWNER TO admin;

--
-- Name: EvaluationCouncilMember; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."EvaluationCouncilMember" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "evaluationCouncilId" text NOT NULL,
    "lecturerId" text NOT NULL,
    role "khao-thi"."EvaluationMemberRole"[]
);


ALTER TABLE "khao-thi"."EvaluationCouncilMember" OWNER TO admin;

--
-- Name: EvaluationCriterion; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."EvaluationCriterion" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "criterionPeriodId" text NOT NULL,
    "lecturerId" text,
    deadline timestamp(3) without time zone,
    status "khao-thi"."EvaluationStatus" DEFAULT 'LOCK'::"khao-thi"."EvaluationStatus" NOT NULL,
    "reviewerId" text,
    "deadlineReview" timestamp(3) without time zone,
    "currentSituation" text DEFAULT ''::text NOT NULL,
    strengths text DEFAULT ''::text NOT NULL,
    weakness text DEFAULT ''::text NOT NULL,
    "actionPlan" text DEFAULT ''::text NOT NULL,
    score text DEFAULT ''::text NOT NULL
);


ALTER TABLE "khao-thi"."EvaluationCriterion" OWNER TO admin;

--
-- Name: EvaluationCriterionComment; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."EvaluationCriterionComment" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "reviewerId" uuid NOT NULL,
    "requirementCriterionId" text,
    content text,
    "analysisCriterionId" text,
    "evaluationCriterionId" text
);


ALTER TABLE "khao-thi"."EvaluationCriterionComment" OWNER TO admin;

--
-- Name: EvaluationPeriod; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."EvaluationPeriod" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endDate" timestamp(3) without time zone,
    status "khao-thi"."EvaluationPeriodStatus" DEFAULT 'COUNCIL_ESTABLISHED'::"khao-thi"."EvaluationPeriodStatus" NOT NULL,
    "semesterId" text
);


ALTER TABLE "khao-thi"."EvaluationPeriod" OWNER TO admin;

--
-- Name: Evidence; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."Evidence" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "categoryId" text NOT NULL,
    name text NOT NULL,
    information text NOT NULL,
    issuer text NOT NULL
);


ALTER TABLE "khao-thi"."Evidence" OWNER TO admin;

--
-- Name: EvidenceCategory; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."EvidenceCategory" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "khao-thi"."EvidenceCategory" OWNER TO admin;

--
-- Name: EvidenceFile; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."EvidenceFile" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    path text NOT NULL,
    "mimeType" text NOT NULL,
    size bigint NOT NULL,
    "evidenceId" text NOT NULL,
    "userProfileId" uuid
);


ALTER TABLE "khao-thi"."EvidenceFile" OWNER TO admin;

--
-- Name: Exam; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."Exam" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "questionBankId" text,
    "lockExamSessions" boolean DEFAULT false NOT NULL,
    duration integer,
    session integer DEFAULT 1 NOT NULL,
    "subjectVersionId" text NOT NULL,
    "semesterId" text NOT NULL
);


ALTER TABLE "khao-thi"."Exam" OWNER TO admin;

--
-- Name: ExamBank; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."ExamBank" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "examId" text NOT NULL,
    "examCode" text NOT NULL
);


ALTER TABLE "khao-thi"."ExamBank" OWNER TO admin;

--
-- Name: ExamBankQuestion; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."ExamBankQuestion" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "examBankId" text NOT NULL,
    "questionId" text NOT NULL,
    "order" integer
);


ALTER TABLE "khao-thi"."ExamBankQuestion" OWNER TO admin;

--
-- Name: ExamList; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."ExamList" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "examRoomId" text,
    "firstSupervisorId" text,
    "secondSupervisorId" text,
    "createdExamCode" boolean DEFAULT false NOT NULL,
    "lockExamCode" boolean DEFAULT false NOT NULL,
    start integer,
    "end" integer
);


ALTER TABLE "khao-thi"."ExamList" OWNER TO admin;

--
-- Name: ExamPaper; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."ExamPaper" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "examListId" text,
    "studentSubjectScoreId" text NOT NULL,
    "examCode" text
);


ALTER TABLE "khao-thi"."ExamPaper" OWNER TO admin;

--
-- Name: ExamRoom; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."ExamRoom" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "examId" text NOT NULL,
    "roomId" text,
    capacity integer DEFAULT 0 NOT NULL
);


ALTER TABLE "khao-thi"."ExamRoom" OWNER TO admin;

--
-- Name: FillInBlankSlot; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."FillInBlankSlot" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "questionId" text NOT NULL,
    "order" integer NOT NULL,
    "correctAnswer" text NOT NULL
);


ALTER TABLE "khao-thi"."FillInBlankSlot" OWNER TO admin;

--
-- Name: KnowledgeBlock; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."KnowledgeBlock" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "subjectVersionId" text NOT NULL,
    name text NOT NULL
);


ALTER TABLE "khao-thi"."KnowledgeBlock" OWNER TO admin;

--
-- Name: MultipleChoiceOption; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."MultipleChoiceOption" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "questionId" text NOT NULL,
    content text NOT NULL,
    "isCorrect" boolean DEFAULT false NOT NULL,
    "order" integer NOT NULL
);


ALTER TABLE "khao-thi"."MultipleChoiceOption" OWNER TO admin;

--
-- Name: OrderingItem; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."OrderingItem" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "questionId" text NOT NULL,
    content text NOT NULL,
    "correctOrder" integer NOT NULL
);


ALTER TABLE "khao-thi"."OrderingItem" OWNER TO admin;

--
-- Name: Question; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."Question" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    content text NOT NULL,
    type "khao-thi"."QuestionType" DEFAULT 'ESSAY'::"khao-thi"."QuestionType" NOT NULL,
    point double precision DEFAULT 1 NOT NULL,
    explanation text,
    "isAutoGraded" boolean DEFAULT false NOT NULL,
    "questionBankId" text NOT NULL,
    "knowledgeBlockId" text,
    "difficultyId" text
);


ALTER TABLE "khao-thi"."Question" OWNER TO admin;

--
-- Name: QuestionBank; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."QuestionBank" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "subjectVersionId" text NOT NULL
);


ALTER TABLE "khao-thi"."QuestionBank" OWNER TO admin;

--
-- Name: RequirementCriterion; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."RequirementCriterion" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "analysisCriterionId" text NOT NULL,
    "order" integer NOT NULL,
    name text NOT NULL,
    questions text[],
    "evidencePlaces" text DEFAULT ''::text NOT NULL,
    "collectionMethod" text DEFAULT ''::text NOT NULL
);


ALTER TABLE "khao-thi"."RequirementCriterion" OWNER TO admin;

--
-- Name: RequirementCriterionCatalog; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."RequirementCriterionCatalog" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "criterionCatalogId" text NOT NULL,
    "order" integer NOT NULL,
    name text NOT NULL,
    questions text[]
);


ALTER TABLE "khao-thi"."RequirementCriterionCatalog" OWNER TO admin;

--
-- Name: StandardCatalog; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."StandardCatalog" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "order" integer NOT NULL,
    name text NOT NULL,
    "objectType" "khao-thi"."StandardCatalogType" NOT NULL
);


ALTER TABLE "khao-thi"."StandardCatalog" OWNER TO admin;

--
-- Name: StandardPeriod; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."StandardPeriod" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "periodId" text NOT NULL,
    name text NOT NULL,
    "order" integer NOT NULL,
    opening text DEFAULT ''::text NOT NULL,
    conclusion text DEFAULT ''::text NOT NULL
);


ALTER TABLE "khao-thi"."StandardPeriod" OWNER TO admin;

--
-- Name: Survey; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."Survey" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    "isPublic" boolean DEFAULT false NOT NULL,
    anonymous boolean DEFAULT true NOT NULL,
    "lectureId" text,
    "subjectClassId" text,
    "semesterId" text,
    "surveyTopicId" text NOT NULL,
    "additionalSuggestion" boolean NOT NULL,
    "clusterSurveyId" text
);


ALTER TABLE "khao-thi"."Survey" OWNER TO admin;

--
-- Name: SurveyChoice; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."SurveyChoice" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    answer text NOT NULL,
    "requireExplanation" boolean NOT NULL,
    "clusterSurveyId" text
);


ALTER TABLE "khao-thi"."SurveyChoice" OWNER TO admin;

--
-- Name: SurveyObjectType; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."SurveyObjectType" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    type "khao-thi"."SurveyObject"[]
);


ALTER TABLE "khao-thi"."SurveyObjectType" OWNER TO admin;

--
-- Name: SurveyQuestion; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."SurveyQuestion" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    type "khao-thi"."SurveyQuestionType" NOT NULL,
    "surveyQuestionGroupId" text
);


ALTER TABLE "khao-thi"."SurveyQuestion" OWNER TO admin;

--
-- Name: SurveyQuestionGroup; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."SurveyQuestionGroup" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "khao-thi"."SurveyQuestionGroup" OWNER TO admin;

--
-- Name: SurveyResponse; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."SurveyResponse" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "surveySessionId" text NOT NULL,
    "surveyQuestionId" text NOT NULL,
    "answerText" text,
    explanation text,
    "surveyChoiceId" text,
    "answeredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "khao-thi"."SurveyResponse" OWNER TO admin;

--
-- Name: SurveySession; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."SurveySession" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "surveyId" text NOT NULL,
    "additionalSuggestion" text,
    "profileId" uuid,
    "studentId" text,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "isCompleted" boolean DEFAULT false NOT NULL,
    "surveyObjectTypeId" text
);


ALTER TABLE "khao-thi"."SurveySession" OWNER TO admin;

--
-- Name: SurveyTopic; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."SurveyTopic" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    type "khao-thi"."SurveyType"
);


ALTER TABLE "khao-thi"."SurveyTopic" OWNER TO admin;

--
-- Name: TestStructureRule; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."TestStructureRule" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "examId" text,
    "questionBankId" text,
    "knowledgeBlockId" text NOT NULL,
    "questionPoint" double precision NOT NULL,
    "questionType" "khao-thi"."QuestionType" NOT NULL,
    count integer NOT NULL
);


ALTER TABLE "khao-thi"."TestStructureRule" OWNER TO admin;

--
-- Name: _ClusterSurveyToLecturer; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."_ClusterSurveyToLecturer" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "khao-thi"."_ClusterSurveyToLecturer" OWNER TO admin;

--
-- Name: _ClusterSurveyToSurveyObjectType; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."_ClusterSurveyToSurveyObjectType" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "khao-thi"."_ClusterSurveyToSurveyObjectType" OWNER TO admin;

--
-- Name: _ClusterSurveyToSurveyQuestion; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."_ClusterSurveyToSurveyQuestion" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "khao-thi"."_ClusterSurveyToSurveyQuestion" OWNER TO admin;

--
-- Name: _SurveyObjectTypeToTrainingCourse; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."_SurveyObjectTypeToTrainingCourse" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "khao-thi"."_SurveyObjectTypeToTrainingCourse" OWNER TO admin;

--
-- Name: _SurveyObjectTypeToTrainingField; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."_SurveyObjectTypeToTrainingField" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "khao-thi"."_SurveyObjectTypeToTrainingField" OWNER TO admin;

--
-- Name: _SurveyObjectTypeToTrainingMajor; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."_SurveyObjectTypeToTrainingMajor" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "khao-thi"."_SurveyObjectTypeToTrainingMajor" OWNER TO admin;

--
-- Name: _SurveyQuestionGroupToSurveyTopic; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."_SurveyQuestionGroupToSurveyTopic" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "khao-thi"."_SurveyQuestionGroupToSurveyTopic" OWNER TO admin;

--
-- Name: _SurveyToSurveyChoice; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."_SurveyToSurveyChoice" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "khao-thi"."_SurveyToSurveyChoice" OWNER TO admin;

--
-- Name: _SurveyToSurveyObjectType; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."_SurveyToSurveyObjectType" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "khao-thi"."_SurveyToSurveyObjectType" OWNER TO admin;

--
-- Name: _SurveyToSurveyQuestion; Type: TABLE; Schema: khao-thi; Owner: admin
--

CREATE TABLE "khao-thi"."_SurveyToSurveyQuestion" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "khao-thi"."_SurveyToSurveyQuestion" OWNER TO admin;

--
-- Name: DM_CapBac; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_CapBac" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text
);


ALTER TABLE mta."DM_CapBac" OWNER TO admin;

--
-- Name: DM_ChucDanh; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_ChucDanh" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text,
    "iLoaiChucDanh" integer DEFAULT 0
);


ALTER TABLE mta."DM_ChucDanh" OWNER TO admin;

--
-- Name: DM_ChucVu; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_ChucVu" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text,
    "iNhomChucVu" integer DEFAULT 0
);


ALTER TABLE mta."DM_ChucVu" OWNER TO admin;

--
-- Name: DM_ChungChiTinHoc; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_ChungChiTinHoc" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text,
    "sNguonCap" text,
    "sNoiDung" text,
    "sGiaTri" text,
    "sDoiTuong" text
);


ALTER TABLE mta."DM_ChungChiTinHoc" OWNER TO admin;

--
-- Name: DM_DanToc; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_DanToc" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text,
    "sTenKhac" text,
    "sDiaChiCuTru" text
);


ALTER TABLE mta."DM_DanToc" OWNER TO admin;

--
-- Name: DM_DonVi; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_DonVi" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text,
    "sCode" text,
    "sTenVietTat" text,
    "sParentId" uuid,
    "sTruongDonVi" uuid,
    "sChucNangNhiemVu" text,
    "sDiaChi" text,
    "iNhomDonVi" integer,
    "iCapDonVi" integer,
    "iLoaiDonVi" integer
);


ALTER TABLE mta."DM_DonVi" OWNER TO admin;

--
-- Name: DM_DonViHanhChinh; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_DonViHanhChinh" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text,
    "sTen_En" text
);


ALTER TABLE mta."DM_DonViHanhChinh" OWNER TO admin;

--
-- Name: DM_GioiTinh; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_GioiTinh" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text
);


ALTER TABLE mta."DM_GioiTinh" OWNER TO admin;

--
-- Name: DM_HocHam; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_HocHam" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text
);


ALTER TABLE mta."DM_HocHam" OWNER TO admin;

--
-- Name: DM_HocVi; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_HocVi" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text
);


ALTER TABLE mta."DM_HocVi" OWNER TO admin;

--
-- Name: DM_KhuVuc_DiaLy; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_KhuVuc_DiaLy" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text,
    "sTen_En" text
);


ALTER TABLE mta."DM_KhuVuc_DiaLy" OWNER TO admin;

--
-- Name: DM_NgoaiNgu; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_NgoaiNgu" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text
);


ALTER TABLE mta."DM_NgoaiNgu" OWNER TO admin;

--
-- Name: DM_NhanVien; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_NhanVien" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text,
    "sCCCD" text,
    "sHoVaDem" text,
    "sTenDayDu" text,
    "dNgaySinh" timestamp(3) without time zone,
    "bLaGiangVien" boolean,
    "iGioiTinh" integer,
    "sDM_QuocGiaId" uuid,
    "sDM_TinhId" uuid,
    "sDM_QuanHuyenId" uuid,
    "sDM_XaPhuongId" uuid,
    "sDiaChi" text,
    "sSDTDiDong" text,
    "sEmail" text,
    "bLaNguoiDung" boolean,
    "bLaCanBoNhanVien" boolean,
    "bLaHocVien" boolean,
    "sDM_DonViId" uuid,
    "sDM_ViTriCongViecId" uuid,
    "sQuanlyTrucTiepId" uuid,
    "sAvatarId" text,
    "groupId" text
);


ALTER TABLE mta."DM_NhanVien" OWNER TO admin;

--
-- Name: DM_NhomNguoiDung; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_NhomNguoiDung" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text
);


ALTER TABLE mta."DM_NhomNguoiDung" OWNER TO admin;

--
-- Name: DM_NhomUngDung; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_NhomUngDung" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text,
    "sMoTa" text
);


ALTER TABLE mta."DM_NhomUngDung" OWNER TO admin;

--
-- Name: DM_PhanCap_ChatLuong_TrangThietBi; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_PhanCap_ChatLuong_TrangThietBi" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text
);


ALTER TABLE mta."DM_PhanCap_ChatLuong_TrangThietBi" OWNER TO admin;

--
-- Name: DM_PhanLoai_CSKT; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_PhanLoai_CSKT" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text
);


ALTER TABLE mta."DM_PhanLoai_CSKT" OWNER TO admin;

--
-- Name: DM_QuanHuyen; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_QuanHuyen" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text,
    "sDM_TinhId" uuid,
    "sDM_Tinh_Ma" text,
    "iDM_DonViHanhChinhId" integer
);


ALTER TABLE mta."DM_QuanHuyen" OWNER TO admin;

--
-- Name: DM_QuocGia; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_QuocGia" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text,
    "sLanguage" text
);


ALTER TABLE mta."DM_QuocGia" OWNER TO admin;

--
-- Name: DM_Tinh; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_Tinh" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text,
    "sDM_QuocGiaId" uuid,
    "iDM_KhuVucDiaLy_Id" integer,
    "iDM_DonViHanhChinhId" integer
);


ALTER TABLE mta."DM_Tinh" OWNER TO admin;

--
-- Name: DM_Tinh_New; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_Tinh_New" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text,
    "sDM_QuocGiaId" uuid,
    "iDM_KhuVucDiaLy_Id" integer,
    "iDM_DonViHanhChinhId" integer
);


ALTER TABLE mta."DM_Tinh_New" OWNER TO admin;

--
-- Name: DM_TonGiao; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_TonGiao" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text
);


ALTER TABLE mta."DM_TonGiao" OWNER TO admin;

--
-- Name: DM_TrinhDoNgoaiNgu; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_TrinhDoNgoaiNgu" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text,
    "sKhung" text
);


ALTER TABLE mta."DM_TrinhDoNgoaiNgu" OWNER TO admin;

--
-- Name: DM_TrinhDoTinHoc; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_TrinhDoTinHoc" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text
);


ALTER TABLE mta."DM_TrinhDoTinHoc" OWNER TO admin;

--
-- Name: DM_ViTriCongViec; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_ViTriCongViec" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text,
    "sDM_ChucDanhId" uuid,
    "sDM_NhomViTriId" uuid
);


ALTER TABLE mta."DM_ViTriCongViec" OWNER TO admin;

--
-- Name: DM_XaPhuong; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_XaPhuong" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text,
    "sDM_QuanHuyen_Ma" text,
    "sDM_TinhId" uuid,
    "sDM_QuanHuyenId" uuid,
    "iDM_DonViHanhChinhId" integer
);


ALTER TABLE mta."DM_XaPhuong" OWNER TO admin;

--
-- Name: DM_XaPhuong_New; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."DM_XaPhuong_New" (
    "Id" uuid NOT NULL,
    "sMa" text,
    "sTen" text,
    "sGhiChu" text,
    "iSTT" integer DEFAULT 0,
    "bActive" boolean DEFAULT true,
    "bDeleted" boolean DEFAULT false,
    "bSystem" boolean DEFAULT false,
    "iDictionaryKey" integer DEFAULT 0,
    "dNgayTao" timestamp(3) without time zone,
    "dNgaySua" timestamp(3) without time zone,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text,
    "sDM_TinhId_New" uuid,
    "iDM_DonViHanhChinhId" integer
);


ALTER TABLE mta."DM_XaPhuong_New" OWNER TO admin;

--
-- Name: _DM_DonViToSurveyObjectType; Type: TABLE; Schema: mta; Owner: admin
--

CREATE TABLE mta."_DM_DonViToSurveyObjectType" (
    "A" uuid NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE mta."_DM_DonViToSurveyObjectType" OWNER TO admin;

--
-- Name: admin_event_entity; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.admin_event_entity (
    id character varying(36) NOT NULL,
    admin_event_time bigint,
    realm_id character varying(255),
    operation_type character varying(255),
    auth_realm_id character varying(255),
    auth_client_id character varying(255),
    auth_user_id character varying(255),
    ip_address character varying(255),
    resource_path character varying(2550),
    representation text,
    error character varying(255),
    resource_type character varying(64)
);


ALTER TABLE public.admin_event_entity OWNER TO admin;

--
-- Name: associated_policy; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.associated_policy (
    policy_id character varying(36) NOT NULL,
    associated_policy_id character varying(36) NOT NULL
);


ALTER TABLE public.associated_policy OWNER TO admin;

--
-- Name: authentication_execution; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.authentication_execution (
    id character varying(36) NOT NULL,
    alias character varying(255),
    authenticator character varying(36),
    realm_id character varying(36),
    flow_id character varying(36),
    requirement integer,
    priority integer,
    authenticator_flow boolean DEFAULT false NOT NULL,
    auth_flow_id character varying(36),
    auth_config character varying(36)
);


ALTER TABLE public.authentication_execution OWNER TO admin;

--
-- Name: authentication_flow; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.authentication_flow (
    id character varying(36) NOT NULL,
    alias character varying(255),
    description character varying(255),
    realm_id character varying(36),
    provider_id character varying(36) DEFAULT 'basic-flow'::character varying NOT NULL,
    top_level boolean DEFAULT false NOT NULL,
    built_in boolean DEFAULT false NOT NULL
);


ALTER TABLE public.authentication_flow OWNER TO admin;

--
-- Name: authenticator_config; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.authenticator_config (
    id character varying(36) NOT NULL,
    alias character varying(255),
    realm_id character varying(36)
);


ALTER TABLE public.authenticator_config OWNER TO admin;

--
-- Name: authenticator_config_entry; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.authenticator_config_entry (
    authenticator_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.authenticator_config_entry OWNER TO admin;

--
-- Name: broker_link; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.broker_link (
    identity_provider character varying(255) NOT NULL,
    storage_provider_id character varying(255),
    realm_id character varying(36) NOT NULL,
    broker_user_id character varying(255),
    broker_username character varying(255),
    token text,
    user_id character varying(255) NOT NULL
);


ALTER TABLE public.broker_link OWNER TO admin;

--
-- Name: client; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.client (
    id character varying(36) NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    full_scope_allowed boolean DEFAULT false NOT NULL,
    client_id character varying(255),
    not_before integer,
    public_client boolean DEFAULT false NOT NULL,
    secret character varying(255),
    base_url character varying(255),
    bearer_only boolean DEFAULT false NOT NULL,
    management_url character varying(255),
    surrogate_auth_required boolean DEFAULT false NOT NULL,
    realm_id character varying(36),
    protocol character varying(255),
    node_rereg_timeout integer DEFAULT 0,
    frontchannel_logout boolean DEFAULT false NOT NULL,
    consent_required boolean DEFAULT false NOT NULL,
    name character varying(255),
    service_accounts_enabled boolean DEFAULT false NOT NULL,
    client_authenticator_type character varying(255),
    root_url character varying(255),
    description character varying(255),
    registration_token character varying(255),
    standard_flow_enabled boolean DEFAULT true NOT NULL,
    implicit_flow_enabled boolean DEFAULT false NOT NULL,
    direct_access_grants_enabled boolean DEFAULT false NOT NULL,
    always_display_in_console boolean DEFAULT false NOT NULL
);


ALTER TABLE public.client OWNER TO admin;

--
-- Name: client_attributes; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.client_attributes (
    client_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


ALTER TABLE public.client_attributes OWNER TO admin;

--
-- Name: client_auth_flow_bindings; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.client_auth_flow_bindings (
    client_id character varying(36) NOT NULL,
    flow_id character varying(36),
    binding_name character varying(255) NOT NULL
);


ALTER TABLE public.client_auth_flow_bindings OWNER TO admin;

--
-- Name: client_initial_access; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.client_initial_access (
    id character varying(36) NOT NULL,
    realm_id character varying(36) NOT NULL,
    "timestamp" integer,
    expiration integer,
    count integer,
    remaining_count integer
);


ALTER TABLE public.client_initial_access OWNER TO admin;

--
-- Name: client_node_registrations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.client_node_registrations (
    client_id character varying(36) NOT NULL,
    value integer,
    name character varying(255) NOT NULL
);


ALTER TABLE public.client_node_registrations OWNER TO admin;

--
-- Name: client_scope; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.client_scope (
    id character varying(36) NOT NULL,
    name character varying(255),
    realm_id character varying(36),
    description character varying(255),
    protocol character varying(255)
);


ALTER TABLE public.client_scope OWNER TO admin;

--
-- Name: client_scope_attributes; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.client_scope_attributes (
    scope_id character varying(36) NOT NULL,
    value character varying(2048),
    name character varying(255) NOT NULL
);


ALTER TABLE public.client_scope_attributes OWNER TO admin;

--
-- Name: client_scope_client; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.client_scope_client (
    client_id character varying(255) NOT NULL,
    scope_id character varying(255) NOT NULL,
    default_scope boolean DEFAULT false NOT NULL
);


ALTER TABLE public.client_scope_client OWNER TO admin;

--
-- Name: client_scope_role_mapping; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.client_scope_role_mapping (
    scope_id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL
);


ALTER TABLE public.client_scope_role_mapping OWNER TO admin;

--
-- Name: client_session; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.client_session (
    id character varying(36) NOT NULL,
    client_id character varying(36),
    redirect_uri character varying(255),
    state character varying(255),
    "timestamp" integer,
    session_id character varying(36),
    auth_method character varying(255),
    realm_id character varying(255),
    auth_user_id character varying(36),
    current_action character varying(36)
);


ALTER TABLE public.client_session OWNER TO admin;

--
-- Name: client_session_auth_status; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.client_session_auth_status (
    authenticator character varying(36) NOT NULL,
    status integer,
    client_session character varying(36) NOT NULL
);


ALTER TABLE public.client_session_auth_status OWNER TO admin;

--
-- Name: client_session_note; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.client_session_note (
    name character varying(255) NOT NULL,
    value character varying(255),
    client_session character varying(36) NOT NULL
);


ALTER TABLE public.client_session_note OWNER TO admin;

--
-- Name: client_session_prot_mapper; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.client_session_prot_mapper (
    protocol_mapper_id character varying(36) NOT NULL,
    client_session character varying(36) NOT NULL
);


ALTER TABLE public.client_session_prot_mapper OWNER TO admin;

--
-- Name: client_session_role; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.client_session_role (
    role_id character varying(255) NOT NULL,
    client_session character varying(36) NOT NULL
);


ALTER TABLE public.client_session_role OWNER TO admin;

--
-- Name: client_user_session_note; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.client_user_session_note (
    name character varying(255) NOT NULL,
    value character varying(2048),
    client_session character varying(36) NOT NULL
);


ALTER TABLE public.client_user_session_note OWNER TO admin;

--
-- Name: component; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.component (
    id character varying(36) NOT NULL,
    name character varying(255),
    parent_id character varying(36),
    provider_id character varying(36),
    provider_type character varying(255),
    realm_id character varying(36),
    sub_type character varying(255)
);


ALTER TABLE public.component OWNER TO admin;

--
-- Name: component_config; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.component_config (
    id character varying(36) NOT NULL,
    component_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


ALTER TABLE public.component_config OWNER TO admin;

--
-- Name: composite_role; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.composite_role (
    composite character varying(36) NOT NULL,
    child_role character varying(36) NOT NULL
);


ALTER TABLE public.composite_role OWNER TO admin;

--
-- Name: credential; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.credential (
    id character varying(36) NOT NULL,
    salt bytea,
    type character varying(255),
    user_id character varying(36),
    created_date bigint,
    user_label character varying(255),
    secret_data text,
    credential_data text,
    priority integer
);


ALTER TABLE public.credential OWNER TO admin;

--
-- Name: databasechangelog; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.databasechangelog (
    id character varying(255) NOT NULL,
    author character varying(255) NOT NULL,
    filename character varying(255) NOT NULL,
    dateexecuted timestamp without time zone NOT NULL,
    orderexecuted integer NOT NULL,
    exectype character varying(10) NOT NULL,
    md5sum character varying(35),
    description character varying(255),
    comments character varying(255),
    tag character varying(255),
    liquibase character varying(20),
    contexts character varying(255),
    labels character varying(255),
    deployment_id character varying(10)
);


ALTER TABLE public.databasechangelog OWNER TO admin;

--
-- Name: databasechangeloglock; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.databasechangeloglock (
    id integer NOT NULL,
    locked boolean NOT NULL,
    lockgranted timestamp without time zone,
    lockedby character varying(255)
);


ALTER TABLE public.databasechangeloglock OWNER TO admin;

--
-- Name: default_client_scope; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.default_client_scope (
    realm_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL,
    default_scope boolean DEFAULT false NOT NULL
);


ALTER TABLE public.default_client_scope OWNER TO admin;

--
-- Name: event_entity; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.event_entity (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    details_json character varying(2550),
    error character varying(255),
    ip_address character varying(255),
    realm_id character varying(255),
    session_id character varying(255),
    event_time bigint,
    type character varying(255),
    user_id character varying(255),
    details_json_long_value text
);


ALTER TABLE public.event_entity OWNER TO admin;

--
-- Name: fed_user_attribute; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.fed_user_attribute (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    value character varying(2024),
    long_value_hash bytea,
    long_value_hash_lower_case bytea,
    long_value text
);


ALTER TABLE public.fed_user_attribute OWNER TO admin;

--
-- Name: fed_user_consent; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.fed_user_consent (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    created_date bigint,
    last_updated_date bigint,
    client_storage_provider character varying(36),
    external_client_id character varying(255)
);


ALTER TABLE public.fed_user_consent OWNER TO admin;

--
-- Name: fed_user_consent_cl_scope; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.fed_user_consent_cl_scope (
    user_consent_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


ALTER TABLE public.fed_user_consent_cl_scope OWNER TO admin;

--
-- Name: fed_user_credential; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.fed_user_credential (
    id character varying(36) NOT NULL,
    salt bytea,
    type character varying(255),
    created_date bigint,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36),
    user_label character varying(255),
    secret_data text,
    credential_data text,
    priority integer
);


ALTER TABLE public.fed_user_credential OWNER TO admin;

--
-- Name: fed_user_group_membership; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.fed_user_group_membership (
    group_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


ALTER TABLE public.fed_user_group_membership OWNER TO admin;

--
-- Name: fed_user_required_action; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.fed_user_required_action (
    required_action character varying(255) DEFAULT ' '::character varying NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


ALTER TABLE public.fed_user_required_action OWNER TO admin;

--
-- Name: fed_user_role_mapping; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.fed_user_role_mapping (
    role_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    storage_provider_id character varying(36)
);


ALTER TABLE public.fed_user_role_mapping OWNER TO admin;

--
-- Name: federated_identity; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.federated_identity (
    identity_provider character varying(255) NOT NULL,
    realm_id character varying(36),
    federated_user_id character varying(255),
    federated_username character varying(255),
    token text,
    user_id character varying(36) NOT NULL
);


ALTER TABLE public.federated_identity OWNER TO admin;

--
-- Name: federated_user; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.federated_user (
    id character varying(255) NOT NULL,
    storage_provider_id character varying(255),
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.federated_user OWNER TO admin;

--
-- Name: group_attribute; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.group_attribute (
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255),
    group_id character varying(36) NOT NULL
);


ALTER TABLE public.group_attribute OWNER TO admin;

--
-- Name: group_role_mapping; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.group_role_mapping (
    role_id character varying(36) NOT NULL,
    group_id character varying(36) NOT NULL
);


ALTER TABLE public.group_role_mapping OWNER TO admin;

--
-- Name: identity_provider; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.identity_provider (
    internal_id character varying(36) NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    provider_alias character varying(255),
    provider_id character varying(255),
    store_token boolean DEFAULT false NOT NULL,
    authenticate_by_default boolean DEFAULT false NOT NULL,
    realm_id character varying(36),
    add_token_role boolean DEFAULT true NOT NULL,
    trust_email boolean DEFAULT false NOT NULL,
    first_broker_login_flow_id character varying(36),
    post_broker_login_flow_id character varying(36),
    provider_display_name character varying(255),
    link_only boolean DEFAULT false NOT NULL
);


ALTER TABLE public.identity_provider OWNER TO admin;

--
-- Name: identity_provider_config; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.identity_provider_config (
    identity_provider_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.identity_provider_config OWNER TO admin;

--
-- Name: identity_provider_mapper; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.identity_provider_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    idp_alias character varying(255) NOT NULL,
    idp_mapper_name character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.identity_provider_mapper OWNER TO admin;

--
-- Name: idp_mapper_config; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.idp_mapper_config (
    idp_mapper_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.idp_mapper_config OWNER TO admin;

--
-- Name: keycloak_group; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.keycloak_group (
    id character varying(36) NOT NULL,
    name character varying(255),
    parent_group character varying(36) NOT NULL,
    realm_id character varying(36)
);


ALTER TABLE public.keycloak_group OWNER TO admin;

--
-- Name: keycloak_role; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.keycloak_role (
    id character varying(36) NOT NULL,
    client_realm_constraint character varying(255),
    client_role boolean DEFAULT false NOT NULL,
    description character varying(255),
    name character varying(255),
    realm_id character varying(255),
    client character varying(36),
    realm character varying(36)
);


ALTER TABLE public.keycloak_role OWNER TO admin;

--
-- Name: migration_model; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.migration_model (
    id character varying(36) NOT NULL,
    version character varying(36),
    update_time bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.migration_model OWNER TO admin;

--
-- Name: offline_client_session; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.offline_client_session (
    user_session_id character varying(36) NOT NULL,
    client_id character varying(255) NOT NULL,
    offline_flag character varying(4) NOT NULL,
    "timestamp" integer,
    data text,
    client_storage_provider character varying(36) DEFAULT 'local'::character varying NOT NULL,
    external_client_id character varying(255) DEFAULT 'local'::character varying NOT NULL
);


ALTER TABLE public.offline_client_session OWNER TO admin;

--
-- Name: offline_user_session; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.offline_user_session (
    user_session_id character varying(36) NOT NULL,
    user_id character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    created_on integer NOT NULL,
    offline_flag character varying(4) NOT NULL,
    data text,
    last_session_refresh integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.offline_user_session OWNER TO admin;

--
-- Name: policy_config; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.policy_config (
    policy_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value text
);


ALTER TABLE public.policy_config OWNER TO admin;

--
-- Name: protocol_mapper; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.protocol_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    protocol character varying(255) NOT NULL,
    protocol_mapper_name character varying(255) NOT NULL,
    client_id character varying(36),
    client_scope_id character varying(36)
);


ALTER TABLE public.protocol_mapper OWNER TO admin;

--
-- Name: protocol_mapper_config; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.protocol_mapper_config (
    protocol_mapper_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.protocol_mapper_config OWNER TO admin;

--
-- Name: realm; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.realm (
    id character varying(36) NOT NULL,
    access_code_lifespan integer,
    user_action_lifespan integer,
    access_token_lifespan integer,
    account_theme character varying(255),
    admin_theme character varying(255),
    email_theme character varying(255),
    enabled boolean DEFAULT false NOT NULL,
    events_enabled boolean DEFAULT false NOT NULL,
    events_expiration bigint,
    login_theme character varying(255),
    name character varying(255),
    not_before integer,
    password_policy character varying(2550),
    registration_allowed boolean DEFAULT false NOT NULL,
    remember_me boolean DEFAULT false NOT NULL,
    reset_password_allowed boolean DEFAULT false NOT NULL,
    social boolean DEFAULT false NOT NULL,
    ssl_required character varying(255),
    sso_idle_timeout integer,
    sso_max_lifespan integer,
    update_profile_on_soc_login boolean DEFAULT false NOT NULL,
    verify_email boolean DEFAULT false NOT NULL,
    master_admin_client character varying(36),
    login_lifespan integer,
    internationalization_enabled boolean DEFAULT false NOT NULL,
    default_locale character varying(255),
    reg_email_as_username boolean DEFAULT false NOT NULL,
    admin_events_enabled boolean DEFAULT false NOT NULL,
    admin_events_details_enabled boolean DEFAULT false NOT NULL,
    edit_username_allowed boolean DEFAULT false NOT NULL,
    otp_policy_counter integer DEFAULT 0,
    otp_policy_window integer DEFAULT 1,
    otp_policy_period integer DEFAULT 30,
    otp_policy_digits integer DEFAULT 6,
    otp_policy_alg character varying(36) DEFAULT 'HmacSHA1'::character varying,
    otp_policy_type character varying(36) DEFAULT 'totp'::character varying,
    browser_flow character varying(36),
    registration_flow character varying(36),
    direct_grant_flow character varying(36),
    reset_credentials_flow character varying(36),
    client_auth_flow character varying(36),
    offline_session_idle_timeout integer DEFAULT 0,
    revoke_refresh_token boolean DEFAULT false NOT NULL,
    access_token_life_implicit integer DEFAULT 0,
    login_with_email_allowed boolean DEFAULT true NOT NULL,
    duplicate_emails_allowed boolean DEFAULT false NOT NULL,
    docker_auth_flow character varying(36),
    refresh_token_max_reuse integer DEFAULT 0,
    allow_user_managed_access boolean DEFAULT false NOT NULL,
    sso_max_lifespan_remember_me integer DEFAULT 0 NOT NULL,
    sso_idle_timeout_remember_me integer DEFAULT 0 NOT NULL,
    default_role character varying(255)
);


ALTER TABLE public.realm OWNER TO admin;

--
-- Name: realm_attribute; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.realm_attribute (
    name character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL,
    value text
);


ALTER TABLE public.realm_attribute OWNER TO admin;

--
-- Name: realm_default_groups; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.realm_default_groups (
    realm_id character varying(36) NOT NULL,
    group_id character varying(36) NOT NULL
);


ALTER TABLE public.realm_default_groups OWNER TO admin;

--
-- Name: realm_enabled_event_types; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.realm_enabled_event_types (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.realm_enabled_event_types OWNER TO admin;

--
-- Name: realm_events_listeners; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.realm_events_listeners (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.realm_events_listeners OWNER TO admin;

--
-- Name: realm_localizations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.realm_localizations (
    realm_id character varying(255) NOT NULL,
    locale character varying(255) NOT NULL,
    texts text NOT NULL
);


ALTER TABLE public.realm_localizations OWNER TO admin;

--
-- Name: realm_required_credential; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.realm_required_credential (
    type character varying(255) NOT NULL,
    form_label character varying(255),
    input boolean DEFAULT false NOT NULL,
    secret boolean DEFAULT false NOT NULL,
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.realm_required_credential OWNER TO admin;

--
-- Name: realm_smtp_config; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.realm_smtp_config (
    realm_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.realm_smtp_config OWNER TO admin;

--
-- Name: realm_supported_locales; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.realm_supported_locales (
    realm_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.realm_supported_locales OWNER TO admin;

--
-- Name: redirect_uris; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.redirect_uris (
    client_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.redirect_uris OWNER TO admin;

--
-- Name: required_action_config; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.required_action_config (
    required_action_id character varying(36) NOT NULL,
    value text,
    name character varying(255) NOT NULL
);


ALTER TABLE public.required_action_config OWNER TO admin;

--
-- Name: required_action_provider; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.required_action_provider (
    id character varying(36) NOT NULL,
    alias character varying(255),
    name character varying(255),
    realm_id character varying(36),
    enabled boolean DEFAULT false NOT NULL,
    default_action boolean DEFAULT false NOT NULL,
    provider_id character varying(255),
    priority integer
);


ALTER TABLE public.required_action_provider OWNER TO admin;

--
-- Name: resource_attribute; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.resource_attribute (
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255),
    resource_id character varying(36) NOT NULL
);


ALTER TABLE public.resource_attribute OWNER TO admin;

--
-- Name: resource_policy; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.resource_policy (
    resource_id character varying(36) NOT NULL,
    policy_id character varying(36) NOT NULL
);


ALTER TABLE public.resource_policy OWNER TO admin;

--
-- Name: resource_scope; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.resource_scope (
    resource_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


ALTER TABLE public.resource_scope OWNER TO admin;

--
-- Name: resource_server; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.resource_server (
    id character varying(36) NOT NULL,
    allow_rs_remote_mgmt boolean DEFAULT false NOT NULL,
    policy_enforce_mode smallint NOT NULL,
    decision_strategy smallint DEFAULT 1 NOT NULL
);


ALTER TABLE public.resource_server OWNER TO admin;

--
-- Name: resource_server_perm_ticket; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.resource_server_perm_ticket (
    id character varying(36) NOT NULL,
    owner character varying(255) NOT NULL,
    requester character varying(255) NOT NULL,
    created_timestamp bigint NOT NULL,
    granted_timestamp bigint,
    resource_id character varying(36) NOT NULL,
    scope_id character varying(36),
    resource_server_id character varying(36) NOT NULL,
    policy_id character varying(36)
);


ALTER TABLE public.resource_server_perm_ticket OWNER TO admin;

--
-- Name: resource_server_policy; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.resource_server_policy (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    type character varying(255) NOT NULL,
    decision_strategy smallint,
    logic smallint,
    resource_server_id character varying(36) NOT NULL,
    owner character varying(255)
);


ALTER TABLE public.resource_server_policy OWNER TO admin;

--
-- Name: resource_server_resource; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.resource_server_resource (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(255),
    icon_uri character varying(255),
    owner character varying(255) NOT NULL,
    resource_server_id character varying(36) NOT NULL,
    owner_managed_access boolean DEFAULT false NOT NULL,
    display_name character varying(255)
);


ALTER TABLE public.resource_server_resource OWNER TO admin;

--
-- Name: resource_server_scope; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.resource_server_scope (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    icon_uri character varying(255),
    resource_server_id character varying(36) NOT NULL,
    display_name character varying(255)
);


ALTER TABLE public.resource_server_scope OWNER TO admin;

--
-- Name: resource_uris; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.resource_uris (
    resource_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.resource_uris OWNER TO admin;

--
-- Name: role_attribute; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.role_attribute (
    id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255)
);


ALTER TABLE public.role_attribute OWNER TO admin;

--
-- Name: scope_mapping; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.scope_mapping (
    client_id character varying(36) NOT NULL,
    role_id character varying(36) NOT NULL
);


ALTER TABLE public.scope_mapping OWNER TO admin;

--
-- Name: scope_policy; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.scope_policy (
    scope_id character varying(36) NOT NULL,
    policy_id character varying(36) NOT NULL
);


ALTER TABLE public.scope_policy OWNER TO admin;

--
-- Name: user_attribute; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_attribute (
    name character varying(255) NOT NULL,
    value character varying(255),
    user_id character varying(36) NOT NULL,
    id character varying(36) DEFAULT 'sybase-needs-something-here'::character varying NOT NULL,
    long_value_hash bytea,
    long_value_hash_lower_case bytea,
    long_value text
);


ALTER TABLE public.user_attribute OWNER TO admin;

--
-- Name: user_consent; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_consent (
    id character varying(36) NOT NULL,
    client_id character varying(255),
    user_id character varying(36) NOT NULL,
    created_date bigint,
    last_updated_date bigint,
    client_storage_provider character varying(36),
    external_client_id character varying(255)
);


ALTER TABLE public.user_consent OWNER TO admin;

--
-- Name: user_consent_client_scope; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_consent_client_scope (
    user_consent_id character varying(36) NOT NULL,
    scope_id character varying(36) NOT NULL
);


ALTER TABLE public.user_consent_client_scope OWNER TO admin;

--
-- Name: user_entity; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_entity (
    id character varying(36) NOT NULL,
    email character varying(255),
    email_constraint character varying(255),
    email_verified boolean DEFAULT false NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    federation_link character varying(255),
    first_name character varying(255),
    last_name character varying(255),
    realm_id character varying(255),
    username character varying(255),
    created_timestamp bigint,
    service_account_client_link character varying(255),
    not_before integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.user_entity OWNER TO admin;

--
-- Name: user_federation_config; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_federation_config (
    user_federation_provider_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.user_federation_config OWNER TO admin;

--
-- Name: user_federation_mapper; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_federation_mapper (
    id character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    federation_provider_id character varying(36) NOT NULL,
    federation_mapper_type character varying(255) NOT NULL,
    realm_id character varying(36) NOT NULL
);


ALTER TABLE public.user_federation_mapper OWNER TO admin;

--
-- Name: user_federation_mapper_config; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_federation_mapper_config (
    user_federation_mapper_id character varying(36) NOT NULL,
    value character varying(255),
    name character varying(255) NOT NULL
);


ALTER TABLE public.user_federation_mapper_config OWNER TO admin;

--
-- Name: user_federation_provider; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_federation_provider (
    id character varying(36) NOT NULL,
    changed_sync_period integer,
    display_name character varying(255),
    full_sync_period integer,
    last_sync integer,
    priority integer,
    provider_name character varying(255),
    realm_id character varying(36)
);


ALTER TABLE public.user_federation_provider OWNER TO admin;

--
-- Name: user_group_membership; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_group_membership (
    group_id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL
);


ALTER TABLE public.user_group_membership OWNER TO admin;

--
-- Name: user_required_action; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_required_action (
    user_id character varying(36) NOT NULL,
    required_action character varying(255) DEFAULT ' '::character varying NOT NULL
);


ALTER TABLE public.user_required_action OWNER TO admin;

--
-- Name: user_role_mapping; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_role_mapping (
    role_id character varying(255) NOT NULL,
    user_id character varying(36) NOT NULL
);


ALTER TABLE public.user_role_mapping OWNER TO admin;

--
-- Name: user_session; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_session (
    id character varying(36) NOT NULL,
    auth_method character varying(255),
    ip_address character varying(255),
    last_session_refresh integer,
    login_username character varying(255),
    realm_id character varying(255),
    remember_me boolean DEFAULT false NOT NULL,
    started integer,
    user_id character varying(255),
    user_session_state integer,
    broker_session_id character varying(255),
    broker_user_id character varying(255)
);


ALTER TABLE public.user_session OWNER TO admin;

--
-- Name: user_session_note; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.user_session_note (
    user_session character varying(36) NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(2048)
);


ALTER TABLE public.user_session_note OWNER TO admin;

--
-- Name: username_login_failure; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.username_login_failure (
    realm_id character varying(36) NOT NULL,
    username character varying(255) NOT NULL,
    failed_login_not_before integer,
    last_failure bigint,
    last_ip_failure character varying(255),
    num_failures integer
);


ALTER TABLE public.username_login_failure OWNER TO admin;

--
-- Name: web_origins; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.web_origins (
    client_id character varying(36) NOT NULL,
    value character varying(255) NOT NULL
);


ALTER TABLE public.web_origins OWNER TO admin;

--
-- Name: DocumentFile; Type: TABLE; Schema: ql-danh-muc; Owner: admin
--

CREATE TABLE "ql-danh-muc"."DocumentFile" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    path text NOT NULL,
    size bigint NOT NULL,
    "mimeType" text,
    "archivedCertificateId" text,
    "trainingCourseId" text,
    "archivedAwardId" text,
    "curriculumId" text,
    "curriculumVersionId" text,
    "subjectVersionId" text,
    "studentAcademicDecisionId" text,
    "notificationId" text,
    "decisionId" text,
    "defenseRecordId" text,
    "librarySubmissionId" text,
    "diplomaFrontId" text,
    "diplomaBackId" text,
    "diplomaVerificationId" text,
    "diplomaVerificationFrontId" text,
    "diplomaVerificationBackId" text,
    "trainingFieldId" text,
    "studentScoreConvertId" text,
    "noteId" text,
    "evaluationPeriodId" text
);


ALTER TABLE "ql-danh-muc"."DocumentFile" OWNER TO admin;

--
-- Name: LecturerType; Type: TABLE; Schema: ql-danh-muc; Owner: admin
--

CREATE TABLE "ql-danh-muc"."LecturerType" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-danh-muc"."LecturerType" OWNER TO admin;

--
-- Name: Notification; Type: TABLE; Schema: ql-danh-muc; Owner: admin
--

CREATE TABLE "ql-danh-muc"."Notification" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    title text NOT NULL,
    content text NOT NULL,
    type "ql-danh-muc"."NotificationType" DEFAULT 'GENERAL'::"ql-danh-muc"."NotificationType" NOT NULL,
    priority "ql-danh-muc"."NotificationPriority" DEFAULT 'NORMAL'::"ql-danh-muc"."NotificationPriority" NOT NULL,
    "publishedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "targetAll" boolean DEFAULT false NOT NULL
);


ALTER TABLE "ql-danh-muc"."Notification" OWNER TO admin;

--
-- Name: StaffPosition; Type: TABLE; Schema: ql-danh-muc; Owner: admin
--

CREATE TABLE "ql-danh-muc"."StaffPosition" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-danh-muc"."StaffPosition" OWNER TO admin;

--
-- Name: StaffType; Type: TABLE; Schema: ql-danh-muc; Owner: admin
--

CREATE TABLE "ql-danh-muc"."StaffType" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-danh-muc"."StaffType" OWNER TO admin;

--
-- Name: TemplateFile; Type: TABLE; Schema: ql-danh-muc; Owner: admin
--

CREATE TABLE "ql-danh-muc"."TemplateFile" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    path text NOT NULL,
    "fileType" "ql-danh-muc"."TemplateFileType",
    extensions text,
    "numberField" integer DEFAULT 0
);


ALTER TABLE "ql-danh-muc"."TemplateFile" OWNER TO admin;

--
-- Name: _NotificationToStudent; Type: TABLE; Schema: ql-danh-muc; Owner: admin
--

CREATE TABLE "ql-danh-muc"."_NotificationToStudent" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-danh-muc"."_NotificationToStudent" OWNER TO admin;

--
-- Name: _NotificationToTrainingCourse; Type: TABLE; Schema: ql-danh-muc; Owner: admin
--

CREATE TABLE "ql-danh-muc"."_NotificationToTrainingCourse" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-danh-muc"."_NotificationToTrainingCourse" OWNER TO admin;

--
-- Name: AcademicActionCondition; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."AcademicActionCondition" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "ruleSetId" text NOT NULL,
    field "ql-dao-tao"."CriteriaField" NOT NULL,
    operator "ql-dao-tao"."CriteriaOperator" NOT NULL,
    invert boolean DEFAULT false NOT NULL,
    value double precision NOT NULL,
    tuple text[] DEFAULT ARRAY[]::text[],
    "yearCondition" integer,
    "isPriorityStudent" boolean
);


ALTER TABLE "ql-dao-tao"."AcademicActionCondition" OWNER TO admin;

--
-- Name: AcademicActionConfig; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."AcademicActionConfig" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "actionType" "ql-dao-tao"."AcademicActionType" NOT NULL,
    "trainingCourseId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."AcademicActionConfig" OWNER TO admin;

--
-- Name: AcademicActionRuleSet; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."AcademicActionRuleSet" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "configId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."AcademicActionRuleSet" OWNER TO admin;

--
-- Name: AcademicRankingConvert; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."AcademicRankingConvert" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    classification text NOT NULL,
    "classificationEnglish" text,
    context "ql-dao-tao"."RankingContext" NOT NULL,
    "rankOrder" integer NOT NULL,
    "baseScore" "ql-dao-tao"."AcademicRankingBaseType" NOT NULL,
    "base10Min" double precision,
    "base10Max" double precision,
    "base4Min" double precision,
    "base4Max" double precision,
    graduated boolean NOT NULL,
    "trainingCourseId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."AcademicRankingConvert" OWNER TO admin;

--
-- Name: AcademicWarning; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."AcademicWarning" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "studentId" text NOT NULL,
    "semesterId" text NOT NULL,
    level integer NOT NULL,
    "increasedFrom" integer,
    "decreasedFrom" integer
);


ALTER TABLE "ql-dao-tao"."AcademicWarning" OWNER TO admin;

--
-- Name: AcademicWarningRule; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."AcademicWarningRule" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    field "ql-dao-tao"."CriteriaField" NOT NULL,
    operator "ql-dao-tao"."CriteriaOperator" NOT NULL,
    invert boolean DEFAULT false NOT NULL,
    threshold double precision NOT NULL,
    tuple text[] DEFAULT ARRAY[]::text[],
    severity integer NOT NULL,
    "yearCondition" integer,
    "semesterCondition" integer,
    "trainingCourseId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."AcademicWarningRule" OWNER TO admin;

--
-- Name: ApplicationCheckResult; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."ApplicationCheckResult" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "studentGraduationApplicationId" text NOT NULL,
    "rankingConditionId" text NOT NULL,
    passed boolean NOT NULL,
    "actualValue" double precision
);


ALTER TABLE "ql-dao-tao"."ApplicationCheckResult" OWNER TO admin;

--
-- Name: ApplicationDowngraded; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."ApplicationDowngraded" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "studentGraduationApplicationId" text NOT NULL,
    "fromId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."ApplicationDowngraded" OWNER TO admin;

--
-- Name: ArchivedAward; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."ArchivedAward" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "awardId" text NOT NULL,
    "studentId" text NOT NULL,
    "bonusScore" double precision NOT NULL,
    date timestamp(3) without time zone,
    status "ql-dao-tao"."ArchivedCertificateStatus" DEFAULT 'PENDING'::"ql-dao-tao"."ArchivedCertificateStatus" NOT NULL
);


ALTER TABLE "ql-dao-tao"."ArchivedAward" OWNER TO admin;

--
-- Name: ArchivedAwardOnStudentSubjectScore; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."ArchivedAwardOnStudentSubjectScore" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "studentSubjectScoreId" text NOT NULL,
    "archivedAwardId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."ArchivedAwardOnStudentSubjectScore" OWNER TO admin;

--
-- Name: ArchivedCertificate; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."ArchivedCertificate" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "certificateId" text NOT NULL,
    "studentId" text NOT NULL,
    "finalScore" double precision NOT NULL,
    score double precision NOT NULL,
    "issuedBy" text NOT NULL,
    "issuedDate" timestamp(3) without time zone NOT NULL,
    "expiredDate" timestamp(3) without time zone,
    status "ql-dao-tao"."ArchivedCertificateStatus" DEFAULT 'PENDING'::"ql-dao-tao"."ArchivedCertificateStatus" NOT NULL
);


ALTER TABLE "ql-dao-tao"."ArchivedCertificate" OWNER TO admin;

--
-- Name: ArchivedCertificateOnStudentSubjectScore; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."ArchivedCertificateOnStudentSubjectScore" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "studentSubjectScoreId" text NOT NULL,
    "archivedCertificateId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."ArchivedCertificateOnStudentSubjectScore" OWNER TO admin;

--
-- Name: Award; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."Award" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "englishName" text,
    "bonusScore" double precision NOT NULL
);


ALTER TABLE "ql-dao-tao"."Award" OWNER TO admin;

--
-- Name: Building; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."Building" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    floor integer,
    "trainingLocationId" text
);


ALTER TABLE "ql-dao-tao"."Building" OWNER TO admin;

--
-- Name: Certificate; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."Certificate" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "englishName" text,
    "outputStandardId" text
);


ALTER TABLE "ql-dao-tao"."Certificate" OWNER TO admin;

--
-- Name: CertificateOnSubject; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."CertificateOnSubject" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "finalScore" double precision NOT NULL,
    "certificateId" text NOT NULL,
    "subjectId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."CertificateOnSubject" OWNER TO admin;

--
-- Name: ClassRegisterLogs; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."ClassRegisterLogs" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "classRegisterSessionId" text NOT NULL,
    "subjectClassId" text NOT NULL,
    "studentId" text NOT NULL,
    status "ql-dao-tao"."ClassRegisterStatus" DEFAULT 'PENDING'::"ql-dao-tao"."ClassRegisterStatus" NOT NULL,
    reason text
);


ALTER TABLE "ql-dao-tao"."ClassRegisterLogs" OWNER TO admin;

--
-- Name: ClassRegisterSession; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."ClassRegisterSession" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "semesterId" text NOT NULL,
    "tuitionPerCredit" double precision DEFAULT 0 NOT NULL
);


ALTER TABLE "ql-dao-tao"."ClassRegisterSession" OWNER TO admin;

--
-- Name: ClassRegisterSessionCredit; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."ClassRegisterSessionCredit" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "classRegisterSessionId" text NOT NULL,
    "minCredit" integer DEFAULT 0 NOT NULL,
    "maxCredit" integer DEFAULT 25 NOT NULL,
    "baseScore" "ql-dao-tao"."AcademicRankingBaseType" DEFAULT 'Base10'::"ql-dao-tao"."AcademicRankingBaseType" NOT NULL,
    "base10Min" double precision,
    "base10Max" double precision,
    "base4Min" double precision,
    "base4Max" double precision
);


ALTER TABLE "ql-dao-tao"."ClassRegisterSessionCredit" OWNER TO admin;

--
-- Name: ClassSchedule; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."ClassSchedule" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "subjectClassId" text,
    "periodType" "ql-dao-tao"."PeriodType" DEFAULT 'THEORY'::"ql-dao-tao"."PeriodType" NOT NULL,
    "startPeriod" integer NOT NULL,
    "endPeriod" integer NOT NULL,
    "startTime" timestamp(3) without time zone,
    "endTime" timestamp(3) without time zone,
    "classDate" date NOT NULL,
    "roomId" text,
    "lecturerId" text,
    "extraLecturerId" text,
    location text,
    notes text,
    "isReplacement" boolean DEFAULT false NOT NULL,
    "originalScheduleId" text,
    "cancelReason" text
);


ALTER TABLE "ql-dao-tao"."ClassSchedule" OWNER TO admin;

--
-- Name: Council; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."Council" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "proposedDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status "ql-dao-tao"."CouncilProposalStatus" DEFAULT 'PENDING'::"ql-dao-tao"."CouncilProposalStatus" NOT NULL,
    "studentThesisRegistrationId" text
);


ALTER TABLE "ql-dao-tao"."Council" OWNER TO admin;

--
-- Name: CouncilMember; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."CouncilMember" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    role "ql-dao-tao"."CouncilRole" NOT NULL,
    "councilId" text NOT NULL,
    "expertId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."CouncilMember" OWNER TO admin;

--
-- Name: Curriculum; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."Curriculum" (
    id text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    code text,
    name text NOT NULL,
    "englishName" text,
    "managementOrganizationId" uuid NOT NULL,
    "trainingMajorId" text NOT NULL,
    "trainingObjectTypeId" text NOT NULL,
    information text,
    "renderPath" text
);


ALTER TABLE "ql-dao-tao"."Curriculum" OWNER TO admin;

--
-- Name: CurriculumVersion; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."CurriculumVersion" (
    id text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    code text,
    name text NOT NULL,
    "shortName" text,
    "englishName" text,
    "trainingLanguageId" text,
    "numberOfSemesters" integer,
    "yearCreation" integer,
    "yearApplication" integer,
    "isLock" boolean DEFAULT false NOT NULL,
    "curriculumId" text NOT NULL,
    type "ql-dao-tao"."CurriculumVersionType" DEFAULT 'FULL_COURSE'::"ql-dao-tao"."CurriculumVersionType" NOT NULL,
    "trainingObjectTypeId" text NOT NULL,
    "trainingCourseId" text,
    "trainingLevelId" text,
    "trainingTypeId" text,
    "trainingTimeId" text,
    "diplomaTypeId" text,
    "requiredCredits" integer,
    "electiveCredits" integer,
    "jobPosition" text,
    objectives text,
    "learningOutcome" text,
    "inputStandard" text,
    "time" text,
    structure text,
    "matrixLearningOutcome" text,
    summary text,
    "learningDiagram" text,
    guide text,
    "renderPath" text
);


ALTER TABLE "ql-dao-tao"."CurriculumVersion" OWNER TO admin;

--
-- Name: Decision; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."Decision" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "issueDate" timestamp(3) without time zone NOT NULL,
    type "ql-dao-tao"."DecisionType" NOT NULL,
    "thesisProjectId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."Decision" OWNER TO admin;

--
-- Name: DefaultCouncilRolePayAmount; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."DefaultCouncilRolePayAmount" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    role "ql-dao-tao"."CouncilRole" NOT NULL,
    amount numeric(65,30) NOT NULL,
    "inAcademy" boolean DEFAULT true NOT NULL
);


ALTER TABLE "ql-dao-tao"."DefaultCouncilRolePayAmount" OWNER TO admin;

--
-- Name: DefaultSupervisorPayAmount; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."DefaultSupervisorPayAmount" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    role "ql-dao-tao"."SupervisorRole" NOT NULL,
    amount numeric(65,30) NOT NULL,
    "inAcademy" boolean DEFAULT true NOT NULL
);


ALTER TABLE "ql-dao-tao"."DefaultSupervisorPayAmount" OWNER TO admin;

--
-- Name: DefenseRecord; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."DefenseRecord" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "finalScore" numeric(5,2),
    comments text,
    "isProfileComplete" boolean DEFAULT false NOT NULL,
    "thesisId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."DefenseRecord" OWNER TO admin;

--
-- Name: DefenseSession; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."DefenseSession" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "startTime" time(0) without time zone NOT NULL
);


ALTER TABLE "ql-dao-tao"."DefenseSession" OWNER TO admin;

--
-- Name: DiplomaType; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."DiplomaType" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "englishName" text,
    type "ql-dao-tao"."DiplomaTypeEnum" NOT NULL
);


ALTER TABLE "ql-dao-tao"."DiplomaType" OWNER TO admin;

--
-- Name: DiplomaVerificationApplication; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."DiplomaVerificationApplication" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    fullname text NOT NULL,
    "idCardNumber" text NOT NULL,
    "dateOfBirth" date,
    "phoneNumber" text NOT NULL,
    email text NOT NULL,
    reason text NOT NULL,
    "originalDiplomaNumber" text NOT NULL,
    "diplomaNumber" text NOT NULL,
    "trainingMajor" text,
    "trainingLevel" text,
    "trainingForm" text,
    "trainingCourseStartYear" integer,
    "trainingCourseEndYear" integer,
    "diplomaIssueDate" date,
    classification text,
    status "ql-dao-tao"."DiplomaVerificationStatus" DEFAULT 'PENDING'::"ql-dao-tao"."DiplomaVerificationStatus" NOT NULL,
    "studentId" text
);


ALTER TABLE "ql-dao-tao"."DiplomaVerificationApplication" OWNER TO admin;

--
-- Name: DisciplinaryWarning; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."DisciplinaryWarning" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "studentId" text NOT NULL,
    "semesterId" text,
    level integer NOT NULL,
    "increasedFrom" integer
);


ALTER TABLE "ql-dao-tao"."DisciplinaryWarning" OWNER TO admin;

--
-- Name: DisciplinaryWarningReason; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."DisciplinaryWarningReason" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "severityLevel" integer NOT NULL
);


ALTER TABLE "ql-dao-tao"."DisciplinaryWarningReason" OWNER TO admin;

--
-- Name: EquivalencyGroup; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."EquivalencyGroup" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid
);


ALTER TABLE "ql-dao-tao"."EquivalencyGroup" OWNER TO admin;

--
-- Name: ExpertProfile; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."ExpertProfile" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "lecturerId" text,
    name text,
    "academicRank" text,
    "academicDegree" text,
    organization text,
    "position" text,
    specialization text,
    workplace text,
    phone text,
    email text,
    "bankAccountNumber" text,
    "bankName" text,
    "projectExpert" boolean DEFAULT true NOT NULL,
    "thesisExpert" boolean DEFAULT true NOT NULL,
    "eligiblePresident" boolean NOT NULL,
    "eligibleSecretary" boolean NOT NULL
);


ALTER TABLE "ql-dao-tao"."ExpertProfile" OWNER TO admin;

--
-- Name: FixedClass; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."FixedClass" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    summary text,
    "startYear" integer,
    graduated boolean DEFAULT false,
    "classMonitorId" text,
    "unionLeaderId" text,
    "trainingCourseId" text NOT NULL,
    "managementOrganizationId" uuid,
    "lecturerManagementId" text,
    "staffManagementId" text,
    "curriculumVersionId" text
);


ALTER TABLE "ql-dao-tao"."FixedClass" OWNER TO admin;

--
-- Name: GraduationDecision; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."GraduationDecision" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "applicationId" text NOT NULL,
    "studentId" text NOT NULL,
    "decisionDate" date DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    "finalGpa" numeric(5,2) NOT NULL,
    "trainingMajorId" text,
    "finalRankingId" text NOT NULL,
    "diplomaTypeId" text,
    "originalDiplomaNumber" text,
    "diplomaNumber" text,
    "diplomaIssueDate" date,
    "totalCopy" integer DEFAULT 0
);


ALTER TABLE "ql-dao-tao"."GraduationDecision" OWNER TO admin;

--
-- Name: GraduationRankDowngradeCondition; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."GraduationRankDowngradeCondition" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "downgradeRuleId" text NOT NULL,
    field "ql-dao-tao"."CriteriaField" NOT NULL,
    operator "ql-dao-tao"."CriteriaOperator" NOT NULL,
    invert boolean DEFAULT false NOT NULL,
    value double precision NOT NULL,
    tuple text[] DEFAULT ARRAY[]::text[]
);


ALTER TABLE "ql-dao-tao"."GraduationRankDowngradeCondition" OWNER TO admin;

--
-- Name: GraduationRankDowngradeRule; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."GraduationRankDowngradeRule" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "initialRankId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."GraduationRankDowngradeRule" OWNER TO admin;

--
-- Name: GraduationSession; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."GraduationSession" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "sessionDate" timestamp(3) without time zone NOT NULL,
    "applicationStart" timestamp(3) without time zone NOT NULL,
    "applicationEnd" timestamp(3) without time zone NOT NULL,
    "trainingObjectTypeId" text NOT NULL,
    status "ql-dao-tao"."GraduationSessionStatus" DEFAULT 'PLANNING'::"ql-dao-tao"."GraduationSessionStatus" NOT NULL,
    "trainingCourseId" text,
    "eligibleCount" integer,
    "excellentCount" integer,
    "topicDecisionNumber" text,
    "topicDecisionDate" timestamp(3) without time zone,
    "topicDecisionSigner" text,
    "defenseDecisionNumber" text,
    "defenseDecisionDate" timestamp(3) without time zone,
    "defenseDecisionSigner" text,
    "graduationDecisionNumber" text,
    "graduationDecisionDate" timestamp(3) without time zone,
    "graduationDecisionSigner" text,
    "councilMeetingDate" timestamp(3) without time zone,
    "councilMeetingBasis" text,
    "proposalTopic" text,
    "proposalCouncil" text,
    "proposalGraduation" text,
    "skipCertificateCheck" boolean
);


ALTER TABLE "ql-dao-tao"."GraduationSession" OWNER TO admin;

--
-- Name: Invitation; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."Invitation" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "sentDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isConfirmed" boolean DEFAULT false NOT NULL,
    "councilMemberId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."Invitation" OWNER TO admin;

--
-- Name: Lecturer; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."Lecturer" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "from" timestamp(3) without time zone,
    "lectureID" text,
    "serviceDate" timestamp(3) without time zone,
    "userProfileId" uuid NOT NULL,
    "organizationId" uuid NOT NULL,
    "lecturerTypeId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."Lecturer" OWNER TO admin;

--
-- Name: LecturerHistory; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."LecturerHistory" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "from" timestamp(3) without time zone,
    "to" timestamp(3) without time zone,
    "lectureID" text,
    "lectureCode" text,
    "serviceDate" timestamp(3) without time zone,
    "userProfileId" uuid NOT NULL,
    "organizationId" uuid,
    "lecturerTypeId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."LecturerHistory" OWNER TO admin;

--
-- Name: LibrarySubmission; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."LibrarySubmission" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "submissionDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isHardcopy" boolean DEFAULT false NOT NULL,
    "isSoftcopy" boolean DEFAULT false NOT NULL,
    "librarianNote" text,
    "thesisId" text NOT NULL,
    "confirmedById" text
);


ALTER TABLE "ql-dao-tao"."LibrarySubmission" OWNER TO admin;

--
-- Name: LoadCategory; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."LoadCategory" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    unit text NOT NULL,
    "standardHours" double precision NOT NULL,
    category text NOT NULL,
    note text,
    "isOverageCalculated" boolean NOT NULL
);


ALTER TABLE "ql-dao-tao"."LoadCategory" OWNER TO admin;

--
-- Name: Milestone; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."Milestone" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "startPeriod" integer,
    period text,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "schoolYearId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."Milestone" OWNER TO admin;

--
-- Name: Note; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."Note" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    content text NOT NULL,
    "isPinned" boolean DEFAULT false NOT NULL,
    "studentId" text NOT NULL,
    "folderId" text
);


ALTER TABLE "ql-dao-tao"."Note" OWNER TO admin;

--
-- Name: NoteFolder; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."NoteFolder" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    icon text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "studentId" text NOT NULL,
    "parentId" text
);


ALTER TABLE "ql-dao-tao"."NoteFolder" OWNER TO admin;

--
-- Name: NoteReminder; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."NoteReminder" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    title text NOT NULL,
    "reminderTime" timestamp(3) without time zone NOT NULL,
    "isCompleted" boolean DEFAULT false NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "repeatType" "ql-dao-tao"."ReminderRepeatType" DEFAULT 'NONE'::"ql-dao-tao"."ReminderRepeatType" NOT NULL,
    "isNotified" boolean DEFAULT false NOT NULL,
    "noteId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."NoteReminder" OWNER TO admin;

--
-- Name: NoteTag; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."NoteTag" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    color text
);


ALTER TABLE "ql-dao-tao"."NoteTag" OWNER TO admin;

--
-- Name: OutputStandard; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."OutputStandard" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-dao-tao"."OutputStandard" OWNER TO admin;

--
-- Name: OutputStandardOnCurriculum; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."OutputStandardOnCurriculum" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "outputStandardId" text NOT NULL,
    "curriculumVersionId" text NOT NULL,
    "isRequired" boolean DEFAULT true NOT NULL,
    "semesterIndex" integer
);


ALTER TABLE "ql-dao-tao"."OutputStandardOnCurriculum" OWNER TO admin;

--
-- Name: PaymentRecord; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."PaymentRecord" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    amount numeric(65,30) NOT NULL,
    status "ql-dao-tao"."PaymentStatus" DEFAULT 'PENDING'::"ql-dao-tao"."PaymentStatus" NOT NULL,
    "paymentDate" timestamp(3) without time zone,
    "transactionCode" text,
    "councilMemberId" text
);


ALTER TABLE "ql-dao-tao"."PaymentRecord" OWNER TO admin;

--
-- Name: PlanTraining; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."PlanTraining" (
    id text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "trainingObjectTypeId" text NOT NULL,
    "semesterId" text NOT NULL,
    "trainingCourseId" text
);


ALTER TABLE "ql-dao-tao"."PlanTraining" OWNER TO admin;

--
-- Name: PlanTrainingSubject; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."PlanTrainingSubject" (
    id text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "planTrainingId" text NOT NULL,
    "trainingBlockSubjectId" text NOT NULL,
    "studentCount" integer DEFAULT 0 NOT NULL,
    "subjectClassType" "ql-dao-tao"."SubjectClassType" DEFAULT 'NORMAL'::"ql-dao-tao"."SubjectClassType" NOT NULL
);


ALTER TABLE "ql-dao-tao"."PlanTrainingSubject" OWNER TO admin;

--
-- Name: PriorityObject; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."PriorityObject" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-dao-tao"."PriorityObject" OWNER TO admin;

--
-- Name: RankingCondition; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."RankingCondition" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "rankingId" text NOT NULL,
    field "ql-dao-tao"."CriteriaField" NOT NULL,
    operator "ql-dao-tao"."CriteriaOperator" NOT NULL,
    invert boolean DEFAULT false NOT NULL,
    value double precision NOT NULL,
    tuple text[] DEFAULT ARRAY[]::text[]
);


ALTER TABLE "ql-dao-tao"."RankingCondition" OWNER TO admin;

--
-- Name: ResearchProject; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."ResearchProject" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    title text NOT NULL,
    summary text NOT NULL,
    objectives text,
    methodology text,
    "expectedResults" text,
    requirements text,
    "supervisorId" text NOT NULL,
    "organizationId" uuid NOT NULL,
    "maxStudents" integer NOT NULL,
    "currentStudents" integer DEFAULT 0 NOT NULL,
    "registrationStart" timestamp(3) without time zone NOT NULL,
    "registrationEnd" timestamp(3) without time zone NOT NULL,
    "projectStart" timestamp(3) without time zone,
    "projectEnd" timestamp(3) without time zone,
    status "ql-dao-tao"."ResearchProjectStatus" DEFAULT 'OPEN'::"ql-dao-tao"."ResearchProjectStatus" NOT NULL
);


ALTER TABLE "ql-dao-tao"."ResearchProject" OWNER TO admin;

--
-- Name: Room; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."Room" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "trainingRoom" boolean DEFAULT true NOT NULL,
    "computerRoom" boolean DEFAULT false NOT NULL,
    "laboratoryRoom" boolean DEFAULT false NOT NULL,
    "examRoom" boolean DEFAULT false NOT NULL,
    capacity integer NOT NULL,
    "examCapacity" integer,
    "buildingId" text
);


ALTER TABLE "ql-dao-tao"."Room" OWNER TO admin;

--
-- Name: Scholarship; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."Scholarship" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "rankOrder" integer NOT NULL,
    "baseAmount" numeric(65,30) NOT NULL,
    multiplier double precision DEFAULT 1 NOT NULL,
    "effectiveFrom" timestamp(3) without time zone,
    "effectiveTo" timestamp(3) without time zone,
    "trainingCourseId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."Scholarship" OWNER TO admin;

--
-- Name: ScholarshipAward; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."ScholarshipAward" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "studentId" text NOT NULL,
    "semesterId" text NOT NULL,
    "scholarshipId" text NOT NULL,
    amount numeric(65,30) NOT NULL,
    "gpaAtAward" double precision NOT NULL,
    "priorityRank" integer NOT NULL
);


ALTER TABLE "ql-dao-tao"."ScholarshipAward" OWNER TO admin;

--
-- Name: ScholarshipCriteria; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."ScholarshipCriteria" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "scholarshipId" text NOT NULL,
    field "ql-dao-tao"."CriteriaField" NOT NULL,
    invert boolean DEFAULT false NOT NULL,
    operator "ql-dao-tao"."CriteriaOperator" NOT NULL,
    value double precision NOT NULL,
    tuple text[] DEFAULT ARRAY[]::text[],
    "bonusValue" double precision DEFAULT 0 NOT NULL
);


ALTER TABLE "ql-dao-tao"."ScholarshipCriteria" OWNER TO admin;

--
-- Name: SchoolYear; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."SchoolYear" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone
);


ALTER TABLE "ql-dao-tao"."SchoolYear" OWNER TO admin;

--
-- Name: ScoreConvert; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."ScoreConvert" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    classification text NOT NULL,
    "base10Min" double precision NOT NULL,
    "base10Max" double precision NOT NULL,
    letter text NOT NULL,
    base4 double precision NOT NULL,
    pass boolean NOT NULL,
    "improvementRegister" boolean DEFAULT false NOT NULL,
    "trainingCourseId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."ScoreConvert" OWNER TO admin;

--
-- Name: Semester; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."Semester" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "shortName" text,
    "semesterType" "ql-dao-tao"."SemesterType",
    "schoolYearId" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "ql-dao-tao"."Semester" OWNER TO admin;

--
-- Name: Staff; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."Staff" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "from" timestamp(3) without time zone,
    "userProfileId" uuid NOT NULL,
    "organizationId" uuid NOT NULL,
    "staffTypeId" text NOT NULL,
    "staffPositionId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."Staff" OWNER TO admin;

--
-- Name: StaffHistory; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."StaffHistory" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "from" timestamp(3) without time zone,
    "to" timestamp(3) without time zone,
    "userProfileId" uuid NOT NULL,
    "organizationId" uuid NOT NULL,
    "staffTypeId" text NOT NULL,
    "staffPositionId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."StaffHistory" OWNER TO admin;

--
-- Name: Student; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."Student" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    note text,
    "from" timestamp(3) without time zone,
    "to" timestamp(3) without time zone,
    "registerNumber" text,
    "doctoralCode" text,
    "admissionCombination" text,
    "entryScore" double precision,
    "competencyScore" double precision,
    department text,
    "departmentAddress" text,
    "careerYear" integer,
    "universitySchool" text,
    "universityTrainingType" text,
    "universityGraduationYear" integer,
    "universityMajor" text,
    "universityRank" text,
    basic double precision,
    facility double precision,
    "foreignLanguage" text,
    "priorityReason" text,
    "trainingLocationId" text,
    "unionLeader" text,
    status "ql-dao-tao"."StudentStatus" DEFAULT 'ENROLLED'::"ql-dao-tao"."StudentStatus" NOT NULL,
    "fixedClassId" text,
    "userProfileId" uuid NOT NULL,
    "registrationAreaId" uuid,
    "curriculumVersionId" text,
    "curriculumVersionParallelId" text,
    "academicWarningLevel" integer DEFAULT 0 NOT NULL,
    "disciplinaryWarningLevel" integer DEFAULT 0 NOT NULL,
    suspended boolean DEFAULT false NOT NULL,
    expelled boolean DEFAULT false NOT NULL,
    "foreignLangPass" boolean DEFAULT false NOT NULL,
    "ITCertificationPass" boolean DEFAULT false NOT NULL,
    "strengthTrainingPass" boolean DEFAULT false NOT NULL,
    "militaryTrainingPass" boolean DEFAULT false NOT NULL
);


ALTER TABLE "ql-dao-tao"."Student" OWNER TO admin;

--
-- Name: StudentAcademicDecision; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."StudentAcademicDecision" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "studentId" text NOT NULL,
    "semesterId" text,
    "schoolYearId" text,
    "appliedConfigId" text,
    "actionTaken" "ql-dao-tao"."AcademicActionType" NOT NULL,
    "decisionDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "validUntil" timestamp(3) without time zone,
    reason text,
    status "ql-dao-tao"."DecisionStatus" DEFAULT 'PENDING'::"ql-dao-tao"."DecisionStatus" NOT NULL,
    "updatedResult" boolean DEFAULT false NOT NULL
);


ALTER TABLE "ql-dao-tao"."StudentAcademicDecision" OWNER TO admin;

--
-- Name: StudentGraduationApplication; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."StudentGraduationApplication" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "studentId" text NOT NULL,
    "sessionId" text NOT NULL,
    "applicationDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status "ql-dao-tao"."ApplicationStatus" DEFAULT 'SUBMITTED'::"ql-dao-tao"."ApplicationStatus" NOT NULL,
    graduation boolean,
    gpa numeric(5,2),
    reason text,
    "rankId" text,
    "trainingMajorId" text,
    "diplomaTypeId" text,
    "thesisScore" double precision,
    "thesisReExam" boolean,
    "politicalScore" double precision,
    "politicalReExam" boolean,
    "foreignLanguageScore" double precision,
    "foreignLanguageReExam" boolean,
    "defenseEduCert" boolean,
    "physicalEduCert" boolean,
    "foreignLangCert" boolean,
    "itCert" boolean,
    "accumulatedCredits" integer,
    gpa10 double precision,
    "reExamCredits" integer,
    "totalSubjects" integer,
    "failedSubjects" integer,
    "failedCredits" integer,
    "mandatoryFailedSubjects" integer,
    "mandatoryFailedCredits" integer,
    "rankDowngraded" boolean
);


ALTER TABLE "ql-dao-tao"."StudentGraduationApplication" OWNER TO admin;

--
-- Name: StudentResearchRegistration; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."StudentResearchRegistration" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "studentId" text NOT NULL,
    "researchProjectId" text NOT NULL,
    "registeredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    motivation text,
    experience text,
    status "ql-dao-tao"."RegistrationStatus" DEFAULT 'PENDING'::"ql-dao-tao"."RegistrationStatus" NOT NULL,
    "reviewedAt" timestamp(3) without time zone,
    "reviewedById" text,
    "reviewNote" text
);


ALTER TABLE "ql-dao-tao"."StudentResearchRegistration" OWNER TO admin;

--
-- Name: StudentResearchTopic; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."StudentResearchTopic" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "studentSubjectScoreId" text NOT NULL,
    deadline timestamp(3) without time zone,
    name text,
    "mainContent" text,
    "supervisorId" text,
    "coSupervisorId" text,
    "reportDate" timestamp(3) without time zone
);


ALTER TABLE "ql-dao-tao"."StudentResearchTopic" OWNER TO admin;

--
-- Name: StudentScoreConvert; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."StudentScoreConvert" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "studentId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."StudentScoreConvert" OWNER TO admin;

--
-- Name: StudentSemesterResult; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."StudentSemesterResult" (
    id text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    code text NOT NULL,
    "studentId" text NOT NULL,
    "semesterId" text NOT NULL,
    "studyYear" integer NOT NULL,
    "semesterIndexInCourse" integer NOT NULL,
    "isLastSemester" boolean NOT NULL,
    "baseScore" "ql-dao-tao"."AcademicRankingBaseType" NOT NULL,
    "gpaBase4" numeric(5,2) NOT NULL,
    "cumulativeGpaBase4" numeric(5,2) NOT NULL,
    "gpaBase10" numeric(5,2) NOT NULL,
    "cumulativeGpaBase10" numeric(5,2) NOT NULL,
    "conductScore" double precision,
    "studentTrainingType" "ql-dao-tao"."StudentTrainingType" NOT NULL,
    "rankId" text,
    "lowestFinalScore" double precision NOT NULL,
    "lowestGraduationScore" double precision,
    "totalCredits" integer NOT NULL,
    "registeredCredits" integer NOT NULL,
    "retakingCredits" integer NOT NULL,
    "passedCredits" integer NOT NULL,
    "failedCredits" integer NOT NULL,
    "accumulatedCredits" integer NOT NULL,
    "totalCreditsByCurriculum" integer NOT NULL,
    "totalFailedCredits" integer NOT NULL,
    "foreignLangPass" boolean NOT NULL,
    "isClassMonitor" boolean NOT NULL,
    "isUnionLeader" boolean NOT NULL,
    "entryScore" double precision,
    "isImproving" boolean NOT NULL,
    "postponeWithReason" boolean DEFAULT false NOT NULL,
    "academicWarningLevel" integer DEFAULT 0 NOT NULL,
    "disciplinaryWarningLevel" integer DEFAULT 0 NOT NULL,
    suspended boolean DEFAULT false NOT NULL,
    expelled boolean DEFAULT false NOT NULL
);


ALTER TABLE "ql-dao-tao"."StudentSemesterResult" OWNER TO admin;

--
-- Name: StudentSubjectScore; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."StudentSubjectScore" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "subjectClassId" text,
    "subjectVersionId" text NOT NULL,
    "studentId" text NOT NULL,
    "attendanceScore" double precision,
    "midtermScore" double precision,
    "examScore" double precision,
    "finalScore" numeric(5,1),
    "manualFinalScore" double precision,
    "examPostponed" boolean DEFAULT false NOT NULL,
    "examPostponedReason" text,
    exempted boolean DEFAULT false NOT NULL,
    withdrew boolean DEFAULT false NOT NULL,
    "examBanned" boolean DEFAULT false NOT NULL,
    "examBannedReason" text,
    suspended boolean DEFAULT false NOT NULL,
    "suspendedReason" text,
    repeated boolean DEFAULT false NOT NULL,
    "repeatedReason" text,
    "isImproving" boolean DEFAULT false NOT NULL
);


ALTER TABLE "ql-dao-tao"."StudentSubjectScore" OWNER TO admin;

--
-- Name: StudentSubjectScoreHistory; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."StudentSubjectScoreHistory" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "studentSubjectScoreId" text NOT NULL,
    "attendanceScore" double precision,
    "midtermScore" double precision,
    "examScore" double precision,
    "finalScore" numeric(5,1),
    "manualFinalScore" double precision,
    "examPostponed" boolean,
    "examPostponedReason" text,
    "examBanned" boolean,
    "examBannedReason" text,
    suspended boolean,
    "suspendedReason" text,
    "updatedById" uuid
);


ALTER TABLE "ql-dao-tao"."StudentSubjectScoreHistory" OWNER TO admin;

--
-- Name: StudentThesisRegistration; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."StudentThesisRegistration" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "studentId" text NOT NULL,
    "studentSubjectScoreId" text,
    "thesisProjectId" text NOT NULL,
    "registeredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    motivation text,
    experience text,
    "proposedIdeas" text,
    status "ql-dao-tao"."StudentThesisRegistrationStatus" DEFAULT 'PENDING'::"ql-dao-tao"."StudentThesisRegistrationStatus" NOT NULL,
    "reviewedAt" timestamp(3) without time zone,
    "reviewedById" text,
    "reviewNote" text
);


ALTER TABLE "ql-dao-tao"."StudentThesisRegistration" OWNER TO admin;

--
-- Name: StudentTrainingScore; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."StudentTrainingScore" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "trainingScoreSessionId" text NOT NULL,
    "studentId" text NOT NULL,
    score double precision,
    "studentTrainingType" "ql-dao-tao"."StudentTrainingType" DEFAULT 'GOOD'::"ql-dao-tao"."StudentTrainingType",
    status "ql-dao-tao"."TrainingScoreStatus" DEFAULT 'PENDING'::"ql-dao-tao"."TrainingScoreStatus" NOT NULL
);


ALTER TABLE "ql-dao-tao"."StudentTrainingScore" OWNER TO admin;

--
-- Name: StudentYearResult; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."StudentYearResult" (
    id text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    code text NOT NULL,
    "studentId" text NOT NULL,
    "schoolYearId" text NOT NULL,
    "studyYear" integer NOT NULL,
    "isLastStudyYear" boolean NOT NULL,
    "baseScore" "ql-dao-tao"."AcademicRankingBaseType" NOT NULL,
    "gpaBase4" numeric(5,2) NOT NULL,
    "cumulativeGpaBase4" numeric(5,2) NOT NULL,
    "gpaBase10" numeric(5,2) NOT NULL,
    "cumulativeGpaBase10" numeric(5,2) NOT NULL,
    "conductScore" double precision,
    "studentTrainingType" "ql-dao-tao"."StudentTrainingType" NOT NULL,
    "rankId" text,
    "totalCredits" integer NOT NULL,
    "failedCredits" integer NOT NULL,
    "isClassMonitor" boolean NOT NULL,
    "isUnionLeader" boolean NOT NULL,
    "academicWarningLevel" integer DEFAULT 0 NOT NULL,
    "disciplinaryWarningLevel" integer DEFAULT 0 NOT NULL,
    suspended boolean DEFAULT false NOT NULL,
    expelled boolean DEFAULT false NOT NULL
);


ALTER TABLE "ql-dao-tao"."StudentYearResult" OWNER TO admin;

--
-- Name: Subject; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."Subject" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "englishName" text,
    "managementOrganizationId" uuid,
    information text
);


ALTER TABLE "ql-dao-tao"."Subject" OWNER TO admin;

--
-- Name: SubjectClass; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."SubjectClass" (
    id text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    code text NOT NULL,
    name text NOT NULL,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "subjectId" text NOT NULL,
    schedule "ql-dao-tao"."SubjectClassSchedule",
    "maxStudent" integer NOT NULL,
    type "ql-dao-tao"."SubjectClassType" DEFAULT 'NORMAL'::"ql-dao-tao"."SubjectClassType" NOT NULL,
    status "ql-dao-tao"."SubjectClassStatus" DEFAULT 'DRAFT'::"ql-dao-tao"."SubjectClassStatus" NOT NULL,
    "trainingObjectTypeId" text NOT NULL,
    "semesterId" text NOT NULL,
    cancelled boolean DEFAULT false NOT NULL,
    "lecturerAssignmentDeadline" timestamp(3) without time zone,
    "sendLecturerAssignmentAt" timestamp(3) without time zone,
    "submitLecturerAssignmentAt" timestamp(3) without time zone,
    "approveLecturerAssignmentAt" timestamp(3) without time zone,
    "examDate" timestamp(3) without time zone,
    "examType" "ql-dao-tao"."ExamType",
    "examId" text,
    "scoreDeadLineStart" timestamp(3) without time zone,
    "scoreDeadline" timestamp(3) without time zone,
    "examScoreDeadline" timestamp(3) without time zone,
    "enteredScore" boolean DEFAULT false NOT NULL,
    "enteredExamScore" boolean DEFAULT false NOT NULL,
    "issuedScoreAt" timestamp(3) without time zone,
    "isLockScore" boolean DEFAULT false NOT NULL,
    "isLockExamScore" boolean DEFAULT false NOT NULL,
    "scoreSubmitted" boolean DEFAULT false NOT NULL,
    "scoreChecked" boolean DEFAULT false NOT NULL,
    "roomId" text,
    "trainingLocationId" text,
    "lecturerId" text,
    "extraLecturerId" text,
    "enterGradeLecturerId" text
);


ALTER TABLE "ql-dao-tao"."SubjectClass" OWNER TO admin;

--
-- Name: SubjectClassHistory; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."SubjectClassHistory" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "subjectClassId" text NOT NULL,
    "scoreDeadLineStart" timestamp(3) without time zone,
    "scoreDeadline" timestamp(3) without time zone,
    "examScoreDeadline" timestamp(3) without time zone,
    "isLockScore" boolean,
    "isLockExamScore" boolean,
    "scoreSubmitted" boolean,
    "scoreChecked" boolean,
    "updatedById" uuid
);


ALTER TABLE "ql-dao-tao"."SubjectClassHistory" OWNER TO admin;

--
-- Name: SubjectClassTime; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."SubjectClassTime" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "subjectClassId" text NOT NULL,
    "dayOfWeek" integer NOT NULL,
    "startPeriod" integer NOT NULL,
    "endPeriod" integer NOT NULL
);


ALTER TABLE "ql-dao-tao"."SubjectClassTime" OWNER TO admin;

--
-- Name: SubjectInGroup; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."SubjectInGroup" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "subjectId" text NOT NULL,
    "equivalencyGroupId" text NOT NULL,
    side "ql-dao-tao"."EquivalencySide" NOT NULL
);


ALTER TABLE "ql-dao-tao"."SubjectInGroup" OWNER TO admin;

--
-- Name: SubjectScoreConvert; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."SubjectScoreConvert" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "studentScoreConvertId" text NOT NULL,
    "subjectVersionId" text NOT NULL,
    status "ql-dao-tao"."ScoreConvertStatus" DEFAULT 'PENDING'::"ql-dao-tao"."ScoreConvertStatus" NOT NULL,
    score double precision NOT NULL
);


ALTER TABLE "ql-dao-tao"."SubjectScoreConvert" OWNER TO admin;

--
-- Name: SubjectVersion; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."SubjectVersion" (
    id text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    code text,
    "isLocked" boolean DEFAULT false NOT NULL,
    name text NOT NULL,
    "codeTkb" text,
    "examType" "ql-dao-tao"."ExamType" NOT NULL,
    type "ql-dao-tao"."SubjectVersionType" DEFAULT 'Normal'::"ql-dao-tao"."SubjectVersionType" NOT NULL,
    "onePoint" boolean DEFAULT false NOT NULL,
    credit integer NOT NULL,
    week integer,
    period integer,
    "schedulePeriod" integer,
    "numberOfTheory" integer,
    "numberOfPractical" integer,
    "numberOfSelfStudy" integer,
    "numberOfPractice" integer,
    "numberOfReview" integer,
    "numberOfExam" integer,
    "numberOfOther" integer,
    objectives text,
    "learningOutcome" text,
    structure text,
    guild text,
    "academicResults" text,
    materials text,
    rules text,
    "managementOrganizationId" uuid,
    "subjectId" text NOT NULL,
    "trainingObjectTypeId" text NOT NULL,
    "subjectVersionCategoryId" text
);


ALTER TABLE "ql-dao-tao"."SubjectVersion" OWNER TO admin;

--
-- Name: SubjectVersionCategory; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."SubjectVersionCategory" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-dao-tao"."SubjectVersionCategory" OWNER TO admin;

--
-- Name: SubjectVersionHistory; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."SubjectVersionHistory" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "subjectVersionId" text NOT NULL,
    content text NOT NULL,
    action text NOT NULL,
    "updatedById" uuid NOT NULL
);


ALTER TABLE "ql-dao-tao"."SubjectVersionHistory" OWNER TO admin;

--
-- Name: SupervisorPaymentRecord; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."SupervisorPaymentRecord" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    amount numeric(65,30) NOT NULL,
    status "ql-dao-tao"."PaymentStatus" DEFAULT 'PENDING'::"ql-dao-tao"."PaymentStatus" NOT NULL,
    "paymentDate" timestamp(3) without time zone,
    "transactionCode" text
);


ALTER TABLE "ql-dao-tao"."SupervisorPaymentRecord" OWNER TO admin;

--
-- Name: ThesisProject; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."ThesisProject" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    title text,
    "titleEN" text,
    summary text,
    objectives text,
    scope text,
    methodology text,
    "expectedResults" text,
    requirements text,
    technologies text,
    "thesisType" "ql-dao-tao"."ThesisType" DEFAULT 'PROJECT'::"ql-dao-tao"."ThesisType" NOT NULL,
    status "ql-dao-tao"."ThesisProjectStatus" DEFAULT 'PROPOSED'::"ql-dao-tao"."ThesisProjectStatus" NOT NULL,
    language text,
    type text,
    "subjectClassId" text,
    "thesisSessionId" text,
    "supervisorId" text,
    "supervisorPaymentId" text,
    "coSupervisorId" text,
    "coSupervisorPaymentId" text,
    "organizationId" uuid,
    "maxStudents" integer,
    "councilId" text,
    "roomId" text,
    "defenseDate" timestamp(3) without time zone,
    "defenseSessionId" text,
    "registrationStart" timestamp(3) without time zone,
    "registrationEnd" timestamp(3) without time zone,
    "projectStart" timestamp(3) without time zone,
    "projectEnd" timestamp(3) without time zone
);


ALTER TABLE "ql-dao-tao"."ThesisProject" OWNER TO admin;

--
-- Name: ThesisSession; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."ThesisSession" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "trainingObjectTypeId" text NOT NULL,
    "trainingCourseId" text NOT NULL,
    "decisionNumber" text,
    "decisionMaker" text,
    "decisionDate" timestamp(3) without time zone,
    "defenseDecisionNumber" text,
    "defenseDecisionMaker" text,
    "defenseDecisionDate" timestamp(3) without time zone,
    chief text
);


ALTER TABLE "ql-dao-tao"."ThesisSession" OWNER TO admin;

--
-- Name: TrainingBlock; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."TrainingBlock" (
    id text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    code text,
    name text NOT NULL,
    "trainingObjectTypeId" text NOT NULL,
    priority integer DEFAULT 0 NOT NULL,
    "parentId" text
);


ALTER TABLE "ql-dao-tao"."TrainingBlock" OWNER TO admin;

--
-- Name: TrainingBlockOnCurriculumVersion; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."TrainingBlockOnCurriculumVersion" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "trainingBlockId" text NOT NULL,
    "curriculumVersionId" text,
    priority integer DEFAULT 0 NOT NULL,
    "electiveCreditsRequired" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "ql-dao-tao"."TrainingBlockOnCurriculumVersion" OWNER TO admin;

--
-- Name: TrainingBlockSubject; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."TrainingBlockSubject" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "subjectId" text NOT NULL,
    "trainingBlockOnCurriculumVersionId" text NOT NULL,
    semester integer,
    type "ql-dao-tao"."SubjectRequirementType" DEFAULT 'Mandatory'::"ql-dao-tao"."SubjectRequirementType" NOT NULL,
    "useForFinalScore" boolean NOT NULL,
    graduation boolean NOT NULL
);


ALTER TABLE "ql-dao-tao"."TrainingBlockSubject" OWNER TO admin;

--
-- Name: TrainingCourse; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."TrainingCourse" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "semesterStartId" text NOT NULL,
    "startYear" integer,
    "endYear" integer,
    "academicYear" text,
    "maxTrainingTime" double precision,
    "admissionQuota" integer,
    "admissionStartDate" timestamp(3) without time zone,
    "admissionEndDate" timestamp(3) without time zone,
    "admissionDecision" text,
    "studentRecognitionDecision" text,
    regulation text,
    "trainingLanguageId" text,
    "isGeneralInfoLocked" boolean DEFAULT false NOT NULL,
    "isRegulationLocked" boolean DEFAULT false NOT NULL,
    "isScoreConfigLocked" boolean DEFAULT false NOT NULL,
    "baseScore" "ql-dao-tao"."AcademicRankingBaseType" NOT NULL,
    coef_1 double precision DEFAULT 0.1 NOT NULL,
    coef_2 double precision DEFAULT 0.3 NOT NULL,
    coef_3 double precision DEFAULT 0.6 NOT NULL,
    "scoreToTakeExam" double precision DEFAULT 5 NOT NULL,
    "scoreToPass" double precision DEFAULT 5 NOT NULL,
    "scoreToPassConditional" double precision DEFAULT 5 NOT NULL,
    "scoreToTakeGraduation" double precision DEFAULT 5 NOT NULL,
    "scoreToPassGraduation" double precision DEFAULT 5.5 NOT NULL,
    "maxReExamScore" double precision DEFAULT 6.9 NOT NULL,
    "reduceReExamScore" double precision DEFAULT 1 NOT NULL,
    "scoreToRetain" double precision DEFAULT 10.5 NOT NULL,
    "trainingObjectTypeId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."TrainingCourse" OWNER TO admin;

--
-- Name: TrainingCourseRegulation; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."TrainingCourseRegulation" (
    id text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "trainingCourseId" text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    value double precision NOT NULL
);


ALTER TABLE "ql-dao-tao"."TrainingCourseRegulation" OWNER TO admin;

--
-- Name: TrainingField; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."TrainingField" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "englishName" text NOT NULL,
    "publishDate" timestamp(3) without time zone NOT NULL,
    "decisionNo" text,
    "organizationId" uuid NOT NULL
);


ALTER TABLE "ql-dao-tao"."TrainingField" OWNER TO admin;

--
-- Name: TrainingFieldOnTrainingObjectType; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."TrainingFieldOnTrainingObjectType" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "trainingFieldId" text NOT NULL,
    "trainingObjectTypeId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."TrainingFieldOnTrainingObjectType" OWNER TO admin;

--
-- Name: TrainingForm; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."TrainingForm" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-dao-tao"."TrainingForm" OWNER TO admin;

--
-- Name: TrainingLanguage; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."TrainingLanguage" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-dao-tao"."TrainingLanguage" OWNER TO admin;

--
-- Name: TrainingLevel; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."TrainingLevel" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-dao-tao"."TrainingLevel" OWNER TO admin;

--
-- Name: TrainingLocation; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."TrainingLocation" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "dM_TinhId" uuid,
    "dM_Tinh_NewId" uuid
);


ALTER TABLE "ql-dao-tao"."TrainingLocation" OWNER TO admin;

--
-- Name: TrainingMajor; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."TrainingMajor" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "englishName" text,
    summary text NOT NULL,
    "numberCreditsMajor" integer DEFAULT 0 NOT NULL,
    "numberCreditsRequired" integer DEFAULT 0 NOT NULL,
    "numberCreditsElective" integer DEFAULT 0 NOT NULL,
    "organizationId" uuid NOT NULL,
    "secondOrganizationId" uuid,
    "thirdOrganizationId" uuid,
    "trainingFieldId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."TrainingMajor" OWNER TO admin;

--
-- Name: TrainingMajorOnTrainingObjectType; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."TrainingMajorOnTrainingObjectType" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "trainingMajorId" text NOT NULL,
    "trainingObjectTypeId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."TrainingMajorOnTrainingObjectType" OWNER TO admin;

--
-- Name: TrainingObjectType; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."TrainingObjectType" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    type "ql-dao-tao"."TrainingObjectTypes" NOT NULL,
    "trainingFormId" text,
    "trainingLevelId" text,
    "vaiTro" text[]
);


ALTER TABLE "ql-dao-tao"."TrainingObjectType" OWNER TO admin;

--
-- Name: TrainingScoreSession; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."TrainingScoreSession" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "time" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "semesterId" text NOT NULL,
    "trainingObjectTypeId" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."TrainingScoreSession" OWNER TO admin;

--
-- Name: TrainingTime; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."TrainingTime" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-dao-tao"."TrainingTime" OWNER TO admin;

--
-- Name: TrainingType; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."TrainingType" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-dao-tao"."TrainingType" OWNER TO admin;

--
-- Name: _AcademicWarningToAcademicWarningRule; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_AcademicWarningToAcademicWarningRule" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."_AcademicWarningToAcademicWarningRule" OWNER TO admin;

--
-- Name: _ApplicationDowngradedToGraduationRankDowngradeCondition; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_ApplicationDowngradedToGraduationRankDowngradeCondition" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."_ApplicationDowngradedToGraduationRankDowngradeCondition" OWNER TO admin;

--
-- Name: _AwardToSubject; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_AwardToSubject" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."_AwardToSubject" OWNER TO admin;

--
-- Name: _ClassRegisterSessionToTrainingCourse; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_ClassRegisterSessionToTrainingCourse" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."_ClassRegisterSessionToTrainingCourse" OWNER TO admin;

--
-- Name: _ClassScheduleToUserProfile; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_ClassScheduleToUserProfile" (
    "A" text NOT NULL,
    "B" uuid NOT NULL
);


ALTER TABLE "ql-dao-tao"."_ClassScheduleToUserProfile" OWNER TO admin;

--
-- Name: _CoRequisiteSubject; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_CoRequisiteSubject" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."_CoRequisiteSubject" OWNER TO admin;

--
-- Name: _DefenseRooms; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_DefenseRooms" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."_DefenseRooms" OWNER TO admin;

--
-- Name: _DisciplinaryWarningToDisciplinaryWarningReason; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_DisciplinaryWarningToDisciplinaryWarningReason" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."_DisciplinaryWarningToDisciplinaryWarningReason" OWNER TO admin;

--
-- Name: _ExpertProfileToSubjectClass; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_ExpertProfileToSubjectClass" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."_ExpertProfileToSubjectClass" OWNER TO admin;

--
-- Name: _ExpertProfileToTrainingMajor; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_ExpertProfileToTrainingMajor" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."_ExpertProfileToTrainingMajor" OWNER TO admin;

--
-- Name: _FixedClassToNotification; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_FixedClassToNotification" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."_FixedClassToNotification" OWNER TO admin;

--
-- Name: _FixedClassToSubjectClass; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_FixedClassToSubjectClass" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."_FixedClassToSubjectClass" OWNER TO admin;

--
-- Name: _FixedClassToSurveyObjectType; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_FixedClassToSurveyObjectType" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."_FixedClassToSurveyObjectType" OWNER TO admin;

--
-- Name: _GraduationSessionToOutputStandard; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_GraduationSessionToOutputStandard" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."_GraduationSessionToOutputStandard" OWNER TO admin;

--
-- Name: _NoteToNoteTag; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_NoteToNoteTag" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."_NoteToNoteTag" OWNER TO admin;

--
-- Name: _PrerequisiteSubject; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_PrerequisiteSubject" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."_PrerequisiteSubject" OWNER TO admin;

--
-- Name: _PriorityObjectToStudent; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_PriorityObjectToStudent" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."_PriorityObjectToStudent" OWNER TO admin;

--
-- Name: _SubjectClassToSurveyObjectType; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_SubjectClassToSurveyObjectType" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."_SubjectClassToSurveyObjectType" OWNER TO admin;

--
-- Name: _gpaScore; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_gpaScore" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."_gpaScore" OWNER TO admin;

--
-- Name: _supplementaryScore; Type: TABLE; Schema: ql-dao-tao; Owner: admin
--

CREATE TABLE "ql-dao-tao"."_supplementaryScore" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-dao-tao"."_supplementaryScore" OWNER TO admin;

--
-- Name: BoiDuongQuocPhongAnNinh; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."BoiDuongQuocPhongAnNinh" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text,
    "thoiGianBatDau" timestamp(3) without time zone,
    "thoiGianKetThuc" timestamp(3) without time zone,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."BoiDuongQuocPhongAnNinh" OWNER TO admin;

--
-- Name: CapBac; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."CapBac" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "noiRaQuyetDinh" text,
    "capRaQuyetDinh" text,
    "ngayNhanQuyetDinh" timestamp(3) without time zone,
    "capBacId" uuid NOT NULL,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."CapBac" OWNER TO admin;

--
-- Name: ChienDau; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."ChienDau" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "cuongVi" text,
    "donVi" text,
    "diaDiem" text,
    "vaiTro" text,
    "doiTuong" text,
    "thoiGianBatDau" timestamp(3) without time zone,
    "thoiGianKetThuc" timestamp(3) without time zone,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."ChienDau" OWNER TO admin;

--
-- Name: ChucVuChinhQuyen; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."ChucVuChinhQuyen" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "chucVuChinhQuyenId" uuid,
    "userProfileId" uuid NOT NULL,
    address text
);


ALTER TABLE "ql-ho-so"."ChucVuChinhQuyen" OWNER TO admin;

--
-- Name: ChucVuDang; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."ChucVuDang" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "chucVuDangId" uuid,
    "userProfileId" uuid NOT NULL,
    address text
);


ALTER TABLE "ql-ho-so"."ChucVuDang" OWNER TO admin;

--
-- Name: DM_BacLuong; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_BacLuong" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_BacLuong" OWNER TO admin;

--
-- Name: DM_ChiHuyQuanLy; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_ChiHuyQuanLy" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_ChiHuyQuanLy" OWNER TO admin;

--
-- Name: DM_ChucDanhCMNVGiangVien; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_ChucDanhCMNVGiangVien" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_ChucDanhCMNVGiangVien" OWNER TO admin;

--
-- Name: DM_ChucDanhCMNVKySu; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_ChucDanhCMNVKySu" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_ChucDanhCMNVKySu" OWNER TO admin;

--
-- Name: DM_ChucDanhCMNVNghienCuuVien; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_ChucDanhCMNVNghienCuuVien" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_ChucDanhCMNVNghienCuuVien" OWNER TO admin;

--
-- Name: DM_ChuyenMonKyThuat; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_ChuyenMonKyThuat" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_ChuyenMonKyThuat" OWNER TO admin;

--
-- Name: DM_ChuyenNganhDaoTaoBacDH; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_ChuyenNganhDaoTaoBacDH" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_ChuyenNganhDaoTaoBacDH" OWNER TO admin;

--
-- Name: DM_HinhThucKhenThuongChinhQuyen; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_HinhThucKhenThuongChinhQuyen" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_HinhThucKhenThuongChinhQuyen" OWNER TO admin;

--
-- Name: DM_HinhThucKhenThuongDang; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_HinhThucKhenThuongDang" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_HinhThucKhenThuongDang" OWNER TO admin;

--
-- Name: DM_LoaiHinhCongTac; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_LoaiHinhCongTac" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_LoaiHinhCongTac" OWNER TO admin;

--
-- Name: DM_LoaiHinhDiHocTap; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_LoaiHinhDiHocTap" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_LoaiHinhDiHocTap" OWNER TO admin;

--
-- Name: DM_LoaiThuongTat; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_LoaiThuongTat" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_LoaiThuongTat" OWNER TO admin;

--
-- Name: DM_LoaiTinhTrangCongTac; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_LoaiTinhTrangCongTac" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_LoaiTinhTrangCongTac" OWNER TO admin;

--
-- Name: DM_Ngach; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_Ngach" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_Ngach" OWNER TO admin;

--
-- Name: DM_NganhHoc; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_NganhHoc" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_NganhHoc" OWNER TO admin;

--
-- Name: DM_NhomMau; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_NhomMau" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_NhomMau" OWNER TO admin;

--
-- Name: DM_NuocCuDiHocTap; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_NuocCuDiHocTap" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_NuocCuDiHocTap" OWNER TO admin;

--
-- Name: DM_QuanHeThanNhan; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_QuanHeThanNhan" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_QuanHeThanNhan" OWNER TO admin;

--
-- Name: DM_SucKhoe; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_SucKhoe" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_SucKhoe" OWNER TO admin;

--
-- Name: DM_TinhTrangCongTac; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_TinhTrangCongTac" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_TinhTrangCongTac" OWNER TO admin;

--
-- Name: DM_TinhTrangDiHocTap; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_TinhTrangDiHocTap" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_TinhTrangDiHocTap" OWNER TO admin;

--
-- Name: DM_TinhTrangHonNhan; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_TinhTrangHonNhan" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_TinhTrangHonNhan" OWNER TO admin;

--
-- Name: DM_ToChucXaHoi; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_ToChucXaHoi" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_ToChucXaHoi" OWNER TO admin;

--
-- Name: DM_TrangThaiLamViec; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_TrangThaiLamViec" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_TrangThaiLamViec" OWNER TO admin;

--
-- Name: DM_TrinhDoHocVan; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_TrinhDoHocVan" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_TrinhDoHocVan" OWNER TO admin;

--
-- Name: DM_TrinhDoLyLuanChinhTri; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_TrinhDoLyLuanChinhTri" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_TrinhDoLyLuanChinhTri" OWNER TO admin;

--
-- Name: DM_TrinhDoQuanLyNhaNuoc; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_TrinhDoQuanLyNhaNuoc" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_TrinhDoQuanLyNhaNuoc" OWNER TO admin;

--
-- Name: DM_TruongDaoTaoBacDH; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_TruongDaoTaoBacDH" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_TruongDaoTaoBacDH" OWNER TO admin;

--
-- Name: DM_XepLoaiDanhGiaCanBo; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_XepLoaiDanhGiaCanBo" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_XepLoaiDanhGiaCanBo" OWNER TO admin;

--
-- Name: DM_XepLoaiDanhGiaChatLuongDangVien; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DM_XepLoaiDanhGiaChatLuongDangVien" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-ho-so"."DM_XepLoaiDanhGiaChatLuongDangVien" OWNER TO admin;

--
-- Name: DanhHieu; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DanhHieu" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    ten text,
    "thoiGian" timestamp(3) without time zone,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."DanhHieu" OWNER TO admin;

--
-- Name: DoiTuongChinhSach; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."DoiTuongChinhSach" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "tenDoiTuong" text,
    "ngayBatDau" timestamp(3) without time zone,
    "ngayKetThuc" timestamp(3) without time zone,
    "ghiChu" text,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."DoiTuongChinhSach" OWNER TO admin;

--
-- Name: HocHam; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."HocHam" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "academicRankTypeId" uuid,
    "noiCap" text,
    "soQuyetDinh" text,
    "from" timestamp(3) without time zone,
    "to" timestamp(3) without time zone,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."HocHam" OWNER TO admin;

--
-- Name: HocVi; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."HocVi" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "academicDegreeTypeId" uuid,
    "nationalityId" uuid,
    "linhVuc" text,
    "truongId" text,
    year integer,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."HocVi" OWNER TO admin;

--
-- Name: KeKhaiTaiSan; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."KeKhaiTaiSan" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    loai text,
    "tenDot" text,
    "thoiGianKeKhai" timestamp(3) without time zone,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."KeKhaiTaiSan" OWNER TO admin;

--
-- Name: KhenThuong; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."KhenThuong" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "hinhThucKhenThuongId" text,
    "capKhenThuong" text,
    "soQuyetDinh" text,
    "nguoiKy" text,
    "ngayNhanQuyetDinh" timestamp(3) without time zone,
    "lyDo" text,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."KhenThuong" OWNER TO admin;

--
-- Name: KyLuat; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."KyLuat" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "hinhThucKyLuat" text,
    "capKyLuat" text,
    "soQuyetDinh" text,
    "nguoiKy" text,
    "ngayNhanQuyetDinh" timestamp(3) without time zone,
    "lyDo" text,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."KyLuat" OWNER TO admin;

--
-- Name: NgoaiNgu; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."NgoaiNgu" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "ngonNguId" uuid,
    "hinhThucDaoTao" text,
    "noiDaoTao" text,
    "thoiGianBatDau" timestamp(3) without time zone,
    "thoiGianKetThuc" timestamp(3) without time zone,
    "trinhDoId" uuid NOT NULL,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."NgoaiNgu" OWNER TO admin;

--
-- Name: NuocNgoai; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."NuocNgoai" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "tenNuocId" uuid NOT NULL,
    "tuNgay" timestamp(3) without time zone,
    "denNgay" timestamp(3) without time zone,
    "lyDo" text,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."NuocNgoai" OWNER TO admin;

--
-- Name: QuaTrinhCongTac; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."QuaTrinhCongTac" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "tuThangNam" timestamp(3) without time zone,
    "denThangNam" timestamp(3) without time zone,
    "donVi" text,
    "diaChi" text,
    "chucDanh" text,
    "chucVuDangDoan" text,
    "soQuyetDinh" text,
    "ngayNhanQuyetDinh" timestamp(3) without time zone,
    "chucVuId" uuid,
    "loaiHinhCongTacId" text,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."QuaTrinhCongTac" OWNER TO admin;

--
-- Name: QuaTrinhCuDiCongTac; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."QuaTrinhCuDiCongTac" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "tuThangNam" timestamp(3) without time zone,
    "denThangNam" timestamp(3) without time zone,
    "donVi" text NOT NULL,
    "chucVuId" uuid NOT NULL,
    "dM_TinhTrangCongTacId" text,
    "dM_LoaiTinhTrangCongTacId" text,
    "dM_NuocCuDiHocTapId" text,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."QuaTrinhCuDiCongTac" OWNER TO admin;

--
-- Name: QuaTrinhCuDiDaoTao; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."QuaTrinhCuDiDaoTao" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    ten text,
    "donViToChuc" text,
    "tuNgay" timestamp(3) without time zone,
    "denNgay" timestamp(3) without time zone,
    "vanBang" text,
    "loaiId" text NOT NULL,
    "dM_TinhTrangDiHocTapId" text,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."QuaTrinhCuDiDaoTao" OWNER TO admin;

--
-- Name: QuaTrinhHocTap; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."QuaTrinhHocTap" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "tenTruongId" text NOT NULL,
    "nganhHocId" text NOT NULL,
    "chuyenNganhId" text,
    "tuNgay" timestamp(3) without time zone,
    "denNgay" timestamp(3) without time zone,
    "ketQua" text,
    "loaiHinhDaoTao" text,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."QuaTrinhHocTap" OWNER TO admin;

--
-- Name: QuaTrinhLuong; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."QuaTrinhLuong" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "tuNgay" timestamp(3) without time zone,
    "denNgay" timestamp(3) without time zone,
    "ngachId" text NOT NULL,
    "bacLuongId" text NOT NULL,
    "heSo" text,
    "maNgach" text NOT NULL,
    "phuCapChucVu" text,
    "phuCapKhac" text,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."QuaTrinhLuong" OWNER TO admin;

--
-- Name: Relative; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."Relative" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "birthYear" integer,
    "queQuan" text,
    "noiOHienTai" text,
    job text,
    information text,
    "quanHeThanNhanId" text,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."Relative" OWNER TO admin;

--
-- Name: ThuongTat; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."ThuongTat" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "loaiId" text NOT NULL,
    "tiLe" integer,
    "nguyenNhan" text,
    "thoiGian" timestamp(3) without time zone,
    "noiBiThuong" text,
    "thoiGianGiamDinh" timestamp(3) without time zone,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."ThuongTat" OWNER TO admin;

--
-- Name: TiengDanToc; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."TiengDanToc" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "danTocId" uuid,
    nghe text,
    noi text,
    viet text,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."TiengDanToc" OWNER TO admin;

--
-- Name: TinHoc; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."TinHoc" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "hinhThucDaoTao" text,
    "noiDaoTao" text,
    "thoiGianBatDau" timestamp(3) without time zone,
    "thoiGianKetThuc" timestamp(3) without time zone,
    "dM_TrinhDoTinHocId" uuid NOT NULL,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."TinHoc" OWNER TO admin;

--
-- Name: ToChucXaHoi; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."ToChucXaHoi" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "tenId" text NOT NULL,
    "tuNgay" timestamp(3) without time zone,
    "denNgay" timestamp(3) without time zone,
    "congViec" text,
    "userProfileId" uuid NOT NULL
);


ALTER TABLE "ql-ho-so"."ToChucXaHoi" OWNER TO admin;

--
-- Name: TrinhDoLyLuanChinhTri; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."TrinhDoLyLuanChinhTri" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "hinhThucDaoTao" text,
    "noiDaoTao" text,
    "thoiGianBatDau" timestamp(3) without time zone,
    "thoiGianKetThuc" timestamp(3) without time zone,
    "userProfileId" uuid NOT NULL,
    "trinhDoId" text
);


ALTER TABLE "ql-ho-so"."TrinhDoLyLuanChinhTri" OWNER TO admin;

--
-- Name: TrinhDoQuanLyNhaNuoc; Type: TABLE; Schema: ql-ho-so; Owner: admin
--

CREATE TABLE "ql-ho-so"."TrinhDoQuanLyNhaNuoc" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "hinhThucDaoTao" text,
    "noiDaoTao" text,
    "thoiGianBatDau" timestamp(3) without time zone,
    "thoiGianKetThuc" timestamp(3) without time zone,
    "userProfileId" uuid NOT NULL,
    "trinhDoId" text
);


ALTER TABLE "ql-ho-so"."TrinhDoQuanLyNhaNuoc" OWNER TO admin;

--
-- Name: BlockedIp; Type: TABLE; Schema: ql-nguoi-dung; Owner: admin
--

CREATE TABLE "ql-nguoi-dung"."BlockedIp" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "ipAddress" text NOT NULL,
    reason text,
    "expiresAt" timestamp(3) without time zone
);


ALTER TABLE "ql-nguoi-dung"."BlockedIp" OWNER TO admin;

--
-- Name: Feedback; Type: TABLE; Schema: ql-nguoi-dung; Owner: admin
--

CREATE TABLE "ql-nguoi-dung"."Feedback" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    content text NOT NULL,
    status "ql-nguoi-dung"."FeedbackStatus" NOT NULL,
    satisfaction "ql-nguoi-dung"."Satisfaction" NOT NULL,
    "userId" uuid NOT NULL
);


ALTER TABLE "ql-nguoi-dung"."Feedback" OWNER TO admin;

--
-- Name: Group; Type: TABLE; Schema: ql-nguoi-dung; Owner: admin
--

CREATE TABLE "ql-nguoi-dung"."Group" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-nguoi-dung"."Group" OWNER TO admin;

--
-- Name: Permission; Type: TABLE; Schema: ql-nguoi-dung; Owner: admin
--

CREATE TABLE "ql-nguoi-dung"."Permission" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    "permissionType" "ql-nguoi-dung"."PermissionType" NOT NULL,
    disabled boolean DEFAULT false NOT NULL
);


ALTER TABLE "ql-nguoi-dung"."Permission" OWNER TO admin;

--
-- Name: Role; Type: TABLE; Schema: ql-nguoi-dung; Owner: admin
--

CREATE TABLE "ql-nguoi-dung"."Role" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "ql-nguoi-dung"."Role" OWNER TO admin;

--
-- Name: UserProfile; Type: TABLE; Schema: ql-nguoi-dung; Owner: admin
--

CREATE TABLE "ql-nguoi-dung"."UserProfile" (
    id uuid NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "bLaNguoiDung" boolean,
    "bLaGiangVien" boolean,
    "bLaCanBoNhanVien" boolean,
    "bLaHocVien" boolean,
    "groupId" text,
    "sDM_DonViId" uuid,
    "sDM_ViTriCongViecId" uuid,
    "sQuanlyTrucTiepId" uuid,
    "iDictionaryKey" integer,
    "bSystem" boolean,
    "sNguoiTao" text,
    "sNguoiSua" text,
    "sThietBiTao" text,
    "sThietBiSua" text,
    avatar text,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    "idCardNumber" text NOT NULL,
    "placeOfIdCardNumber" text,
    fullname text,
    "healthInsuranceNumber" text,
    "bankAccountNumber" text,
    "bankName" text,
    "currentAddress" text,
    "newCurrentAddress" text,
    "occupationWhenRecruiting" text,
    "thuongBinh" text,
    benh text,
    "tinhHinhNhaO" text,
    "truocKhiNhapNgu" text,
    "thanhPhanGiaDinh" text,
    "soTruong" text,
    "hoTenThuongDung" text,
    "lichSuBanThan" text,
    "conThuMay" integer,
    "chieuCao" text,
    "canNang" text,
    "soACE" integer,
    "kinhTeGiaDinh" text,
    "chinhTriGiaDinh" text,
    "fSoACE" integer,
    "fKinhTeGiaDinh" text,
    "fThanhPhanGiaDinh" text,
    "fChinhTriGiaDinh" text,
    "fBanThan" text,
    "nationalId" uuid,
    "provinceCurrentAddressId" uuid,
    "districtCurrentAddressId" uuid,
    "communeCurrentAddressId" uuid,
    "newProvinceCurrentAddressId" uuid,
    "newCommuneCurrentAddressId" uuid,
    "dateOfBirth" timestamp(3) without time zone,
    "placeOfBirth" text,
    "provinceOfBirthId" uuid,
    "districtOfBirthId" uuid,
    "communeOfBirthId" uuid,
    "newProvinceOfBirthId" uuid,
    "newCommuneOfBirthId" uuid,
    "homeTown" text,
    "idCardDate" timestamp(3) without time zone,
    "idCardExpirationDate" timestamp(3) without time zone,
    "genderId" uuid,
    "permanentAddress" text,
    "provincePermanentAddressId" uuid,
    "districtPermanentAddressId" uuid,
    "communePermanentAddressId" uuid,
    "newProvincePermanentAddressId" uuid,
    "newCommunePermanentAddressId" uuid,
    "temporaryAddress" text,
    "contactAddress" text,
    "phoneNumber" text,
    email text,
    "nationalityId" uuid,
    "religionId" uuid,
    "ethnicityId" uuid,
    "provinceHometownId" uuid,
    "districtHometownId" uuid,
    "communeHometownId" uuid,
    "newProvinceHometownId" uuid,
    "newCommuneHometownId" uuid,
    "officerNumber" text,
    "rankId" uuid,
    "rankDate" timestamp(3) without time zone,
    "academicDegreeTypeId" uuid,
    "academicDegreeDate" timestamp(3) without time zone,
    "academicRankTypeId" uuid,
    "academicRankDate" timestamp(3) without time zone,
    "levelId" uuid,
    "chiHuyQuanLyId" text,
    "chuyenMonKyThuatId" text,
    "sucKhoeId" text,
    "nhomMauId" text,
    "tinhTrangHonNhanId" text,
    "trangThaiLamViecId" text,
    "dM_ChucDanhCMNVGiangVienId" text,
    "dM_ChucDanhCMNVNghienCuuVienId" text,
    "dM_ChucDanhCMNVKySuId" text,
    "dM_XepLoaiDanhGiaChatLuongDangVienId" text,
    "dM_XepLoaiDanhGiaCanBoId" text,
    "dM_HinhThucKhenThuongDangId" text,
    "unionDate" timestamp(3) without time zone,
    "unionPlace" text,
    "CPVJoinDate" timestamp(3) without time zone,
    "officialCPVDate" timestamp(3) without time zone,
    "CPVJoinPlace" text,
    "positionCPVId" uuid,
    "chucVuChinhQuyenId" uuid,
    "tenureDate" timestamp(3) without time zone,
    "enlistmentDate" timestamp(3) without time zone,
    "reEnlistmentDate" timestamp(3) without time zone,
    "dischargeDate" timestamp(3) without time zone,
    "recruitmentDate" timestamp(3) without time zone,
    "recruitmentAgency" text,
    "mainJobAssigned" text,
    "revolutionaryDate" timestamp(3) without time zone,
    "originalPlace" text,
    "familyPhone" text,
    "familyName" text,
    "trinhDoHocVanId" text
);


ALTER TABLE "ql-nguoi-dung"."UserProfile" OWNER TO admin;

--
-- Name: _GroupToRole; Type: TABLE; Schema: ql-nguoi-dung; Owner: admin
--

CREATE TABLE "ql-nguoi-dung"."_GroupToRole" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-nguoi-dung"."_GroupToRole" OWNER TO admin;

--
-- Name: _PermissionToRole; Type: TABLE; Schema: ql-nguoi-dung; Owner: admin
--

CREATE TABLE "ql-nguoi-dung"."_PermissionToRole" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE "ql-nguoi-dung"."_PermissionToRole" OWNER TO admin;

--
-- Name: ChatBotConfig; Type: TABLE; Schema: tro-ly-ao; Owner: admin
--

CREATE TABLE "tro-ly-ao"."ChatBotConfig" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    value text NOT NULL
);


ALTER TABLE "tro-ly-ao"."ChatBotConfig" OWNER TO admin;

--
-- Name: CitationMessage; Type: TABLE; Schema: tro-ly-ao; Owner: admin
--

CREATE TABLE "tro-ly-ao"."CitationMessage" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    content text,
    index integer,
    "documentId" text,
    "documentType" text,
    "messageId" text
);


ALTER TABLE "tro-ly-ao"."CitationMessage" OWNER TO admin;

--
-- Name: Conversation; Type: TABLE; Schema: tro-ly-ao; Owner: admin
--

CREATE TABLE "tro-ly-ao"."Conversation" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text,
    "userId" uuid,
    "sessionId" text,
    "topicId" text
);


ALTER TABLE "tro-ly-ao"."Conversation" OWNER TO admin;

--
-- Name: Document; Type: TABLE; Schema: tro-ly-ao; Owner: admin
--

CREATE TABLE "tro-ly-ao"."Document" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    title text,
    body text,
    status "tro-ly-ao"."DocumentStatus" DEFAULT 'PENDING'::"tro-ly-ao"."DocumentStatus" NOT NULL,
    "classificationId" text,
    uri text,
    "fileType" text,
    "fileSize" integer,
    reason text,
    "uploadedById" uuid NOT NULL,
    "approvedById" uuid
);


ALTER TABLE "tro-ly-ao"."Document" OWNER TO admin;

--
-- Name: DocumentClassification; Type: TABLE; Schema: tro-ly-ao; Owner: admin
--

CREATE TABLE "tro-ly-ao"."DocumentClassification" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL
);


ALTER TABLE "tro-ly-ao"."DocumentClassification" OWNER TO admin;

--
-- Name: DocumentTopic; Type: TABLE; Schema: tro-ly-ao; Owner: admin
--

CREATE TABLE "tro-ly-ao"."DocumentTopic" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "documentId" text NOT NULL,
    "topicId" text NOT NULL
);


ALTER TABLE "tro-ly-ao"."DocumentTopic" OWNER TO admin;

--
-- Name: FAQ; Type: TABLE; Schema: tro-ly-ao; Owner: admin
--

CREATE TABLE "tro-ly-ao"."FAQ" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    question text,
    answer text,
    status "tro-ly-ao"."DocumentStatus" DEFAULT 'PENDING'::"tro-ly-ao"."DocumentStatus" NOT NULL,
    "topicId" text,
    reason text,
    "uploadedById" uuid NOT NULL,
    "approvedById" uuid
);


ALTER TABLE "tro-ly-ao"."FAQ" OWNER TO admin;

--
-- Name: Message; Type: TABLE; Schema: tro-ly-ao; Owner: admin
--

CREATE TABLE "tro-ly-ao"."Message" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    "conversationId" text,
    content text,
    sender "tro-ly-ao"."MessageSender" NOT NULL
);


ALTER TABLE "tro-ly-ao"."Message" OWNER TO admin;

--
-- Name: Prompt; Type: TABLE; Schema: tro-ly-ao; Owner: admin
--

CREATE TABLE "tro-ly-ao"."Prompt" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    prompt text,
    status "tro-ly-ao"."DocumentStatus" DEFAULT 'PENDING'::"tro-ly-ao"."DocumentStatus" NOT NULL,
    "topicId" text,
    reason text
);


ALTER TABLE "tro-ly-ao"."Prompt" OWNER TO admin;

--
-- Name: Topic; Type: TABLE; Schema: tro-ly-ao; Owner: admin
--

CREATE TABLE "tro-ly-ao"."Topic" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text NOT NULL,
    type text NOT NULL,
    "isPinned" boolean DEFAULT false NOT NULL
);


ALTER TABLE "tro-ly-ao"."Topic" OWNER TO admin;

--
-- Name: UserSession; Type: TABLE; Schema: tro-ly-ao; Owner: admin
--

CREATE TABLE "tro-ly-ao"."UserSession" (
    id text NOT NULL,
    code text,
    active boolean DEFAULT true NOT NULL,
    description text,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" uuid,
    name text,
    email text,
    "phoneNumber" text
);


ALTER TABLE "tro-ly-ao"."UserSession" OWNER TO admin;

--
-- Name: ChangeLog ChangeLog_pkey; Type: CONSTRAINT; Schema: he-thong; Owner: admin
--

ALTER TABLE ONLY "he-thong"."ChangeLog"
    ADD CONSTRAINT "ChangeLog_pkey" PRIMARY KEY (id);


--
-- Name: Config Config_pkey; Type: CONSTRAINT; Schema: he-thong; Owner: admin
--

ALTER TABLE ONLY "he-thong"."Config"
    ADD CONSTRAINT "Config_pkey" PRIMARY KEY (id);


--
-- Name: Suggestion Suggestion_pkey; Type: CONSTRAINT; Schema: he-thong; Owner: admin
--

ALTER TABLE ONLY "he-thong"."Suggestion"
    ADD CONSTRAINT "Suggestion_pkey" PRIMARY KEY (id);


--
-- Name: AnalysisCriterion AnalysisCriterion_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."AnalysisCriterion"
    ADD CONSTRAINT "AnalysisCriterion_pkey" PRIMARY KEY (id);


--
-- Name: AnalysisFormEvidence AnalysisFormEvidence_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."AnalysisFormEvidence"
    ADD CONSTRAINT "AnalysisFormEvidence_pkey" PRIMARY KEY (id);


--
-- Name: ClusterSurvey ClusterSurvey_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."ClusterSurvey"
    ADD CONSTRAINT "ClusterSurvey_pkey" PRIMARY KEY (id);


--
-- Name: CriterionCatalog CriterionCatalog_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."CriterionCatalog"
    ADD CONSTRAINT "CriterionCatalog_pkey" PRIMARY KEY (id);


--
-- Name: CriterionPeriod CriterionPeriod_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."CriterionPeriod"
    ADD CONSTRAINT "CriterionPeriod_pkey" PRIMARY KEY (id);


--
-- Name: Difficulty Difficulty_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."Difficulty"
    ADD CONSTRAINT "Difficulty_pkey" PRIMARY KEY (id);


--
-- Name: EvaluationCouncilMember EvaluationCouncilMember_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvaluationCouncilMember"
    ADD CONSTRAINT "EvaluationCouncilMember_pkey" PRIMARY KEY (id);


--
-- Name: EvaluationCouncil EvaluationCouncil_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvaluationCouncil"
    ADD CONSTRAINT "EvaluationCouncil_pkey" PRIMARY KEY (id);


--
-- Name: EvaluationCriterionComment EvaluationCriterionComment_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvaluationCriterionComment"
    ADD CONSTRAINT "EvaluationCriterionComment_pkey" PRIMARY KEY (id);


--
-- Name: EvaluationCriterion EvaluationCriterion_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvaluationCriterion"
    ADD CONSTRAINT "EvaluationCriterion_pkey" PRIMARY KEY (id);


--
-- Name: EvaluationPeriod EvaluationPeriod_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvaluationPeriod"
    ADD CONSTRAINT "EvaluationPeriod_pkey" PRIMARY KEY (id);


--
-- Name: EvidenceCategory EvidenceCategory_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvidenceCategory"
    ADD CONSTRAINT "EvidenceCategory_pkey" PRIMARY KEY (id);


--
-- Name: EvidenceFile EvidenceFile_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvidenceFile"
    ADD CONSTRAINT "EvidenceFile_pkey" PRIMARY KEY (id);


--
-- Name: Evidence Evidence_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."Evidence"
    ADD CONSTRAINT "Evidence_pkey" PRIMARY KEY (id);


--
-- Name: ExamBankQuestion ExamBankQuestion_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."ExamBankQuestion"
    ADD CONSTRAINT "ExamBankQuestion_pkey" PRIMARY KEY (id);


--
-- Name: ExamBank ExamBank_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."ExamBank"
    ADD CONSTRAINT "ExamBank_pkey" PRIMARY KEY (id);


--
-- Name: ExamList ExamList_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."ExamList"
    ADD CONSTRAINT "ExamList_pkey" PRIMARY KEY (id);


--
-- Name: ExamPaper ExamPaper_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."ExamPaper"
    ADD CONSTRAINT "ExamPaper_pkey" PRIMARY KEY (id);


--
-- Name: ExamRoom ExamRoom_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."ExamRoom"
    ADD CONSTRAINT "ExamRoom_pkey" PRIMARY KEY (id);


--
-- Name: Exam Exam_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."Exam"
    ADD CONSTRAINT "Exam_pkey" PRIMARY KEY (id);


--
-- Name: FillInBlankSlot FillInBlankSlot_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."FillInBlankSlot"
    ADD CONSTRAINT "FillInBlankSlot_pkey" PRIMARY KEY (id);


--
-- Name: KnowledgeBlock KnowledgeBlock_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."KnowledgeBlock"
    ADD CONSTRAINT "KnowledgeBlock_pkey" PRIMARY KEY (id);


--
-- Name: MultipleChoiceOption MultipleChoiceOption_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."MultipleChoiceOption"
    ADD CONSTRAINT "MultipleChoiceOption_pkey" PRIMARY KEY (id);


--
-- Name: OrderingItem OrderingItem_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."OrderingItem"
    ADD CONSTRAINT "OrderingItem_pkey" PRIMARY KEY (id);


--
-- Name: QuestionBank QuestionBank_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."QuestionBank"
    ADD CONSTRAINT "QuestionBank_pkey" PRIMARY KEY (id);


--
-- Name: Question Question_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."Question"
    ADD CONSTRAINT "Question_pkey" PRIMARY KEY (id);


--
-- Name: RequirementCriterionCatalog RequirementCriterionCatalog_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."RequirementCriterionCatalog"
    ADD CONSTRAINT "RequirementCriterionCatalog_pkey" PRIMARY KEY (id);


--
-- Name: RequirementCriterion RequirementCriterion_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."RequirementCriterion"
    ADD CONSTRAINT "RequirementCriterion_pkey" PRIMARY KEY (id);


--
-- Name: StandardCatalog StandardCatalog_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."StandardCatalog"
    ADD CONSTRAINT "StandardCatalog_pkey" PRIMARY KEY (id);


--
-- Name: StandardPeriod StandardPeriod_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."StandardPeriod"
    ADD CONSTRAINT "StandardPeriod_pkey" PRIMARY KEY (id);


--
-- Name: SurveyChoice SurveyChoice_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."SurveyChoice"
    ADD CONSTRAINT "SurveyChoice_pkey" PRIMARY KEY (id);


--
-- Name: SurveyObjectType SurveyObjectType_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."SurveyObjectType"
    ADD CONSTRAINT "SurveyObjectType_pkey" PRIMARY KEY (id);


--
-- Name: SurveyQuestionGroup SurveyQuestionGroup_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."SurveyQuestionGroup"
    ADD CONSTRAINT "SurveyQuestionGroup_pkey" PRIMARY KEY (id);


--
-- Name: SurveyQuestion SurveyQuestion_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."SurveyQuestion"
    ADD CONSTRAINT "SurveyQuestion_pkey" PRIMARY KEY (id);


--
-- Name: SurveyResponse SurveyResponse_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."SurveyResponse"
    ADD CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY (id);


--
-- Name: SurveySession SurveySession_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."SurveySession"
    ADD CONSTRAINT "SurveySession_pkey" PRIMARY KEY (id);


--
-- Name: SurveyTopic SurveyTopic_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."SurveyTopic"
    ADD CONSTRAINT "SurveyTopic_pkey" PRIMARY KEY (id);


--
-- Name: Survey Survey_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."Survey"
    ADD CONSTRAINT "Survey_pkey" PRIMARY KEY (id);


--
-- Name: TestStructureRule TestStructureRule_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."TestStructureRule"
    ADD CONSTRAINT "TestStructureRule_pkey" PRIMARY KEY (id);


--
-- Name: _ClusterSurveyToLecturer _ClusterSurveyToLecturer_AB_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_ClusterSurveyToLecturer"
    ADD CONSTRAINT "_ClusterSurveyToLecturer_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _ClusterSurveyToSurveyObjectType _ClusterSurveyToSurveyObjectType_AB_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_ClusterSurveyToSurveyObjectType"
    ADD CONSTRAINT "_ClusterSurveyToSurveyObjectType_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _ClusterSurveyToSurveyQuestion _ClusterSurveyToSurveyQuestion_AB_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_ClusterSurveyToSurveyQuestion"
    ADD CONSTRAINT "_ClusterSurveyToSurveyQuestion_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _SurveyObjectTypeToTrainingCourse _SurveyObjectTypeToTrainingCourse_AB_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyObjectTypeToTrainingCourse"
    ADD CONSTRAINT "_SurveyObjectTypeToTrainingCourse_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _SurveyObjectTypeToTrainingField _SurveyObjectTypeToTrainingField_AB_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyObjectTypeToTrainingField"
    ADD CONSTRAINT "_SurveyObjectTypeToTrainingField_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _SurveyObjectTypeToTrainingMajor _SurveyObjectTypeToTrainingMajor_AB_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyObjectTypeToTrainingMajor"
    ADD CONSTRAINT "_SurveyObjectTypeToTrainingMajor_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _SurveyQuestionGroupToSurveyTopic _SurveyQuestionGroupToSurveyTopic_AB_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyQuestionGroupToSurveyTopic"
    ADD CONSTRAINT "_SurveyQuestionGroupToSurveyTopic_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _SurveyToSurveyChoice _SurveyToSurveyChoice_AB_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyToSurveyChoice"
    ADD CONSTRAINT "_SurveyToSurveyChoice_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _SurveyToSurveyObjectType _SurveyToSurveyObjectType_AB_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyToSurveyObjectType"
    ADD CONSTRAINT "_SurveyToSurveyObjectType_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _SurveyToSurveyQuestion _SurveyToSurveyQuestion_AB_pkey; Type: CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyToSurveyQuestion"
    ADD CONSTRAINT "_SurveyToSurveyQuestion_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: DM_CapBac DM_CapBac_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_CapBac"
    ADD CONSTRAINT "DM_CapBac_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_ChucDanh DM_ChucDanh_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_ChucDanh"
    ADD CONSTRAINT "DM_ChucDanh_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_ChucVu DM_ChucVu_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_ChucVu"
    ADD CONSTRAINT "DM_ChucVu_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_ChungChiTinHoc DM_ChungChiTinHoc_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_ChungChiTinHoc"
    ADD CONSTRAINT "DM_ChungChiTinHoc_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_DanToc DM_DanToc_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_DanToc"
    ADD CONSTRAINT "DM_DanToc_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_DonViHanhChinh DM_DonViHanhChinh_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_DonViHanhChinh"
    ADD CONSTRAINT "DM_DonViHanhChinh_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_DonVi DM_DonVi_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_DonVi"
    ADD CONSTRAINT "DM_DonVi_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_GioiTinh DM_GioiTinh_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_GioiTinh"
    ADD CONSTRAINT "DM_GioiTinh_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_HocHam DM_HocHam_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_HocHam"
    ADD CONSTRAINT "DM_HocHam_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_HocVi DM_HocVi_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_HocVi"
    ADD CONSTRAINT "DM_HocVi_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_KhuVuc_DiaLy DM_KhuVuc_DiaLy_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_KhuVuc_DiaLy"
    ADD CONSTRAINT "DM_KhuVuc_DiaLy_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_NgoaiNgu DM_NgoaiNgu_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_NgoaiNgu"
    ADD CONSTRAINT "DM_NgoaiNgu_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_NhanVien DM_NhanVien_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_NhanVien"
    ADD CONSTRAINT "DM_NhanVien_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_NhomNguoiDung DM_NhomNguoiDung_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_NhomNguoiDung"
    ADD CONSTRAINT "DM_NhomNguoiDung_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_NhomUngDung DM_NhomUngDung_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_NhomUngDung"
    ADD CONSTRAINT "DM_NhomUngDung_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_PhanCap_ChatLuong_TrangThietBi DM_PhanCap_ChatLuong_TrangThietBi_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_PhanCap_ChatLuong_TrangThietBi"
    ADD CONSTRAINT "DM_PhanCap_ChatLuong_TrangThietBi_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_PhanLoai_CSKT DM_PhanLoai_CSKT_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_PhanLoai_CSKT"
    ADD CONSTRAINT "DM_PhanLoai_CSKT_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_QuanHuyen DM_QuanHuyen_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_QuanHuyen"
    ADD CONSTRAINT "DM_QuanHuyen_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_QuocGia DM_QuocGia_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_QuocGia"
    ADD CONSTRAINT "DM_QuocGia_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_Tinh_New DM_Tinh_New_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_Tinh_New"
    ADD CONSTRAINT "DM_Tinh_New_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_Tinh DM_Tinh_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_Tinh"
    ADD CONSTRAINT "DM_Tinh_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_TonGiao DM_TonGiao_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_TonGiao"
    ADD CONSTRAINT "DM_TonGiao_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_TrinhDoNgoaiNgu DM_TrinhDoNgoaiNgu_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_TrinhDoNgoaiNgu"
    ADD CONSTRAINT "DM_TrinhDoNgoaiNgu_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_TrinhDoTinHoc DM_TrinhDoTinHoc_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_TrinhDoTinHoc"
    ADD CONSTRAINT "DM_TrinhDoTinHoc_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_ViTriCongViec DM_ViTriCongViec_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_ViTriCongViec"
    ADD CONSTRAINT "DM_ViTriCongViec_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_XaPhuong_New DM_XaPhuong_New_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_XaPhuong_New"
    ADD CONSTRAINT "DM_XaPhuong_New_pkey" PRIMARY KEY ("Id");


--
-- Name: DM_XaPhuong DM_XaPhuong_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_XaPhuong"
    ADD CONSTRAINT "DM_XaPhuong_pkey" PRIMARY KEY ("Id");


--
-- Name: _DM_DonViToSurveyObjectType _DM_DonViToSurveyObjectType_AB_pkey; Type: CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."_DM_DonViToSurveyObjectType"
    ADD CONSTRAINT "_DM_DonViToSurveyObjectType_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: username_login_failure CONSTRAINT_17-2; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.username_login_failure
    ADD CONSTRAINT "CONSTRAINT_17-2" PRIMARY KEY (realm_id, username);


--
-- Name: keycloak_role UK_J3RWUVD56ONTGSUHOGM184WW2-2; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.keycloak_role
    ADD CONSTRAINT "UK_J3RWUVD56ONTGSUHOGM184WW2-2" UNIQUE (name, client_realm_constraint);


--
-- Name: client_auth_flow_bindings c_cli_flow_bind; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_auth_flow_bindings
    ADD CONSTRAINT c_cli_flow_bind PRIMARY KEY (client_id, binding_name);


--
-- Name: client_scope_client c_cli_scope_bind; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_scope_client
    ADD CONSTRAINT c_cli_scope_bind PRIMARY KEY (client_id, scope_id);


--
-- Name: client_initial_access cnstr_client_init_acc_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_initial_access
    ADD CONSTRAINT cnstr_client_init_acc_pk PRIMARY KEY (id);


--
-- Name: realm_default_groups con_group_id_def_groups; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.realm_default_groups
    ADD CONSTRAINT con_group_id_def_groups UNIQUE (group_id);


--
-- Name: broker_link constr_broker_link_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.broker_link
    ADD CONSTRAINT constr_broker_link_pk PRIMARY KEY (identity_provider, user_id);


--
-- Name: client_user_session_note constr_cl_usr_ses_note; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_user_session_note
    ADD CONSTRAINT constr_cl_usr_ses_note PRIMARY KEY (client_session, name);


--
-- Name: component_config constr_component_config_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.component_config
    ADD CONSTRAINT constr_component_config_pk PRIMARY KEY (id);


--
-- Name: component constr_component_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.component
    ADD CONSTRAINT constr_component_pk PRIMARY KEY (id);


--
-- Name: fed_user_required_action constr_fed_required_action; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.fed_user_required_action
    ADD CONSTRAINT constr_fed_required_action PRIMARY KEY (required_action, user_id);


--
-- Name: fed_user_attribute constr_fed_user_attr_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.fed_user_attribute
    ADD CONSTRAINT constr_fed_user_attr_pk PRIMARY KEY (id);


--
-- Name: fed_user_consent constr_fed_user_consent_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.fed_user_consent
    ADD CONSTRAINT constr_fed_user_consent_pk PRIMARY KEY (id);


--
-- Name: fed_user_credential constr_fed_user_cred_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.fed_user_credential
    ADD CONSTRAINT constr_fed_user_cred_pk PRIMARY KEY (id);


--
-- Name: fed_user_group_membership constr_fed_user_group; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.fed_user_group_membership
    ADD CONSTRAINT constr_fed_user_group PRIMARY KEY (group_id, user_id);


--
-- Name: fed_user_role_mapping constr_fed_user_role; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.fed_user_role_mapping
    ADD CONSTRAINT constr_fed_user_role PRIMARY KEY (role_id, user_id);


--
-- Name: federated_user constr_federated_user; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.federated_user
    ADD CONSTRAINT constr_federated_user PRIMARY KEY (id);


--
-- Name: realm_default_groups constr_realm_default_groups; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.realm_default_groups
    ADD CONSTRAINT constr_realm_default_groups PRIMARY KEY (realm_id, group_id);


--
-- Name: realm_enabled_event_types constr_realm_enabl_event_types; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.realm_enabled_event_types
    ADD CONSTRAINT constr_realm_enabl_event_types PRIMARY KEY (realm_id, value);


--
-- Name: realm_events_listeners constr_realm_events_listeners; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.realm_events_listeners
    ADD CONSTRAINT constr_realm_events_listeners PRIMARY KEY (realm_id, value);


--
-- Name: realm_supported_locales constr_realm_supported_locales; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.realm_supported_locales
    ADD CONSTRAINT constr_realm_supported_locales PRIMARY KEY (realm_id, value);


--
-- Name: identity_provider constraint_2b; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.identity_provider
    ADD CONSTRAINT constraint_2b PRIMARY KEY (internal_id);


--
-- Name: client_attributes constraint_3c; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_attributes
    ADD CONSTRAINT constraint_3c PRIMARY KEY (client_id, name);


--
-- Name: event_entity constraint_4; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.event_entity
    ADD CONSTRAINT constraint_4 PRIMARY KEY (id);


--
-- Name: federated_identity constraint_40; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.federated_identity
    ADD CONSTRAINT constraint_40 PRIMARY KEY (identity_provider, user_id);


--
-- Name: realm constraint_4a; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.realm
    ADD CONSTRAINT constraint_4a PRIMARY KEY (id);


--
-- Name: client_session_role constraint_5; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_session_role
    ADD CONSTRAINT constraint_5 PRIMARY KEY (client_session, role_id);


--
-- Name: user_session constraint_57; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_session
    ADD CONSTRAINT constraint_57 PRIMARY KEY (id);


--
-- Name: user_federation_provider constraint_5c; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_federation_provider
    ADD CONSTRAINT constraint_5c PRIMARY KEY (id);


--
-- Name: client_session_note constraint_5e; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_session_note
    ADD CONSTRAINT constraint_5e PRIMARY KEY (client_session, name);


--
-- Name: client constraint_7; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT constraint_7 PRIMARY KEY (id);


--
-- Name: client_session constraint_8; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_session
    ADD CONSTRAINT constraint_8 PRIMARY KEY (id);


--
-- Name: scope_mapping constraint_81; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.scope_mapping
    ADD CONSTRAINT constraint_81 PRIMARY KEY (client_id, role_id);


--
-- Name: client_node_registrations constraint_84; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_node_registrations
    ADD CONSTRAINT constraint_84 PRIMARY KEY (client_id, name);


--
-- Name: realm_attribute constraint_9; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.realm_attribute
    ADD CONSTRAINT constraint_9 PRIMARY KEY (name, realm_id);


--
-- Name: realm_required_credential constraint_92; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.realm_required_credential
    ADD CONSTRAINT constraint_92 PRIMARY KEY (realm_id, type);


--
-- Name: keycloak_role constraint_a; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.keycloak_role
    ADD CONSTRAINT constraint_a PRIMARY KEY (id);


--
-- Name: admin_event_entity constraint_admin_event_entity; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.admin_event_entity
    ADD CONSTRAINT constraint_admin_event_entity PRIMARY KEY (id);


--
-- Name: authenticator_config_entry constraint_auth_cfg_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.authenticator_config_entry
    ADD CONSTRAINT constraint_auth_cfg_pk PRIMARY KEY (authenticator_id, name);


--
-- Name: authentication_execution constraint_auth_exec_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.authentication_execution
    ADD CONSTRAINT constraint_auth_exec_pk PRIMARY KEY (id);


--
-- Name: authentication_flow constraint_auth_flow_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.authentication_flow
    ADD CONSTRAINT constraint_auth_flow_pk PRIMARY KEY (id);


--
-- Name: authenticator_config constraint_auth_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.authenticator_config
    ADD CONSTRAINT constraint_auth_pk PRIMARY KEY (id);


--
-- Name: client_session_auth_status constraint_auth_status_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_session_auth_status
    ADD CONSTRAINT constraint_auth_status_pk PRIMARY KEY (client_session, authenticator);


--
-- Name: user_role_mapping constraint_c; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_role_mapping
    ADD CONSTRAINT constraint_c PRIMARY KEY (role_id, user_id);


--
-- Name: composite_role constraint_composite_role; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.composite_role
    ADD CONSTRAINT constraint_composite_role PRIMARY KEY (composite, child_role);


--
-- Name: client_session_prot_mapper constraint_cs_pmp_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_session_prot_mapper
    ADD CONSTRAINT constraint_cs_pmp_pk PRIMARY KEY (client_session, protocol_mapper_id);


--
-- Name: identity_provider_config constraint_d; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.identity_provider_config
    ADD CONSTRAINT constraint_d PRIMARY KEY (identity_provider_id, name);


--
-- Name: policy_config constraint_dpc; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.policy_config
    ADD CONSTRAINT constraint_dpc PRIMARY KEY (policy_id, name);


--
-- Name: realm_smtp_config constraint_e; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.realm_smtp_config
    ADD CONSTRAINT constraint_e PRIMARY KEY (realm_id, name);


--
-- Name: credential constraint_f; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.credential
    ADD CONSTRAINT constraint_f PRIMARY KEY (id);


--
-- Name: user_federation_config constraint_f9; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_federation_config
    ADD CONSTRAINT constraint_f9 PRIMARY KEY (user_federation_provider_id, name);


--
-- Name: resource_server_perm_ticket constraint_fapmt; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT constraint_fapmt PRIMARY KEY (id);


--
-- Name: resource_server_resource constraint_farsr; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_server_resource
    ADD CONSTRAINT constraint_farsr PRIMARY KEY (id);


--
-- Name: resource_server_policy constraint_farsrp; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_server_policy
    ADD CONSTRAINT constraint_farsrp PRIMARY KEY (id);


--
-- Name: associated_policy constraint_farsrpap; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.associated_policy
    ADD CONSTRAINT constraint_farsrpap PRIMARY KEY (policy_id, associated_policy_id);


--
-- Name: resource_policy constraint_farsrpp; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_policy
    ADD CONSTRAINT constraint_farsrpp PRIMARY KEY (resource_id, policy_id);


--
-- Name: resource_server_scope constraint_farsrs; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_server_scope
    ADD CONSTRAINT constraint_farsrs PRIMARY KEY (id);


--
-- Name: resource_scope constraint_farsrsp; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_scope
    ADD CONSTRAINT constraint_farsrsp PRIMARY KEY (resource_id, scope_id);


--
-- Name: scope_policy constraint_farsrsps; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.scope_policy
    ADD CONSTRAINT constraint_farsrsps PRIMARY KEY (scope_id, policy_id);


--
-- Name: user_entity constraint_fb; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT constraint_fb PRIMARY KEY (id);


--
-- Name: user_federation_mapper_config constraint_fedmapper_cfg_pm; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_federation_mapper_config
    ADD CONSTRAINT constraint_fedmapper_cfg_pm PRIMARY KEY (user_federation_mapper_id, name);


--
-- Name: user_federation_mapper constraint_fedmapperpm; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_federation_mapper
    ADD CONSTRAINT constraint_fedmapperpm PRIMARY KEY (id);


--
-- Name: fed_user_consent_cl_scope constraint_fgrntcsnt_clsc_pm; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.fed_user_consent_cl_scope
    ADD CONSTRAINT constraint_fgrntcsnt_clsc_pm PRIMARY KEY (user_consent_id, scope_id);


--
-- Name: user_consent_client_scope constraint_grntcsnt_clsc_pm; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_consent_client_scope
    ADD CONSTRAINT constraint_grntcsnt_clsc_pm PRIMARY KEY (user_consent_id, scope_id);


--
-- Name: user_consent constraint_grntcsnt_pm; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT constraint_grntcsnt_pm PRIMARY KEY (id);


--
-- Name: keycloak_group constraint_group; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.keycloak_group
    ADD CONSTRAINT constraint_group PRIMARY KEY (id);


--
-- Name: group_attribute constraint_group_attribute_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.group_attribute
    ADD CONSTRAINT constraint_group_attribute_pk PRIMARY KEY (id);


--
-- Name: group_role_mapping constraint_group_role; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.group_role_mapping
    ADD CONSTRAINT constraint_group_role PRIMARY KEY (role_id, group_id);


--
-- Name: identity_provider_mapper constraint_idpm; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.identity_provider_mapper
    ADD CONSTRAINT constraint_idpm PRIMARY KEY (id);


--
-- Name: idp_mapper_config constraint_idpmconfig; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.idp_mapper_config
    ADD CONSTRAINT constraint_idpmconfig PRIMARY KEY (idp_mapper_id, name);


--
-- Name: migration_model constraint_migmod; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.migration_model
    ADD CONSTRAINT constraint_migmod PRIMARY KEY (id);


--
-- Name: offline_client_session constraint_offl_cl_ses_pk3; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.offline_client_session
    ADD CONSTRAINT constraint_offl_cl_ses_pk3 PRIMARY KEY (user_session_id, client_id, client_storage_provider, external_client_id, offline_flag);


--
-- Name: offline_user_session constraint_offl_us_ses_pk2; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.offline_user_session
    ADD CONSTRAINT constraint_offl_us_ses_pk2 PRIMARY KEY (user_session_id, offline_flag);


--
-- Name: protocol_mapper constraint_pcm; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.protocol_mapper
    ADD CONSTRAINT constraint_pcm PRIMARY KEY (id);


--
-- Name: protocol_mapper_config constraint_pmconfig; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.protocol_mapper_config
    ADD CONSTRAINT constraint_pmconfig PRIMARY KEY (protocol_mapper_id, name);


--
-- Name: redirect_uris constraint_redirect_uris; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.redirect_uris
    ADD CONSTRAINT constraint_redirect_uris PRIMARY KEY (client_id, value);


--
-- Name: required_action_config constraint_req_act_cfg_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.required_action_config
    ADD CONSTRAINT constraint_req_act_cfg_pk PRIMARY KEY (required_action_id, name);


--
-- Name: required_action_provider constraint_req_act_prv_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.required_action_provider
    ADD CONSTRAINT constraint_req_act_prv_pk PRIMARY KEY (id);


--
-- Name: user_required_action constraint_required_action; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_required_action
    ADD CONSTRAINT constraint_required_action PRIMARY KEY (required_action, user_id);


--
-- Name: resource_uris constraint_resour_uris_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_uris
    ADD CONSTRAINT constraint_resour_uris_pk PRIMARY KEY (resource_id, value);


--
-- Name: role_attribute constraint_role_attribute_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.role_attribute
    ADD CONSTRAINT constraint_role_attribute_pk PRIMARY KEY (id);


--
-- Name: user_attribute constraint_user_attribute_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_attribute
    ADD CONSTRAINT constraint_user_attribute_pk PRIMARY KEY (id);


--
-- Name: user_group_membership constraint_user_group; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_group_membership
    ADD CONSTRAINT constraint_user_group PRIMARY KEY (group_id, user_id);


--
-- Name: user_session_note constraint_usn_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_session_note
    ADD CONSTRAINT constraint_usn_pk PRIMARY KEY (user_session, name);


--
-- Name: web_origins constraint_web_origins; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.web_origins
    ADD CONSTRAINT constraint_web_origins PRIMARY KEY (client_id, value);


--
-- Name: databasechangeloglock databasechangeloglock_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.databasechangeloglock
    ADD CONSTRAINT databasechangeloglock_pkey PRIMARY KEY (id);


--
-- Name: client_scope_attributes pk_cl_tmpl_attr; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_scope_attributes
    ADD CONSTRAINT pk_cl_tmpl_attr PRIMARY KEY (scope_id, name);


--
-- Name: client_scope pk_cli_template; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_scope
    ADD CONSTRAINT pk_cli_template PRIMARY KEY (id);


--
-- Name: resource_server pk_resource_server; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_server
    ADD CONSTRAINT pk_resource_server PRIMARY KEY (id);


--
-- Name: client_scope_role_mapping pk_template_scope; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_scope_role_mapping
    ADD CONSTRAINT pk_template_scope PRIMARY KEY (scope_id, role_id);


--
-- Name: default_client_scope r_def_cli_scope_bind; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.default_client_scope
    ADD CONSTRAINT r_def_cli_scope_bind PRIMARY KEY (realm_id, scope_id);


--
-- Name: realm_localizations realm_localizations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.realm_localizations
    ADD CONSTRAINT realm_localizations_pkey PRIMARY KEY (realm_id, locale);


--
-- Name: resource_attribute res_attr_pk; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_attribute
    ADD CONSTRAINT res_attr_pk PRIMARY KEY (id);


--
-- Name: keycloak_group sibling_names; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.keycloak_group
    ADD CONSTRAINT sibling_names UNIQUE (realm_id, parent_group, name);


--
-- Name: identity_provider uk_2daelwnibji49avxsrtuf6xj33; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.identity_provider
    ADD CONSTRAINT uk_2daelwnibji49avxsrtuf6xj33 UNIQUE (provider_alias, realm_id);


--
-- Name: client uk_b71cjlbenv945rb6gcon438at; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT uk_b71cjlbenv945rb6gcon438at UNIQUE (realm_id, client_id);


--
-- Name: client_scope uk_cli_scope; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_scope
    ADD CONSTRAINT uk_cli_scope UNIQUE (realm_id, name);


--
-- Name: user_entity uk_dykn684sl8up1crfei6eckhd7; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT uk_dykn684sl8up1crfei6eckhd7 UNIQUE (realm_id, email_constraint);


--
-- Name: resource_server_resource uk_frsr6t700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_server_resource
    ADD CONSTRAINT uk_frsr6t700s9v50bu18ws5ha6 UNIQUE (name, owner, resource_server_id);


--
-- Name: resource_server_perm_ticket uk_frsr6t700s9v50bu18ws5pmt; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT uk_frsr6t700s9v50bu18ws5pmt UNIQUE (owner, requester, resource_server_id, resource_id, scope_id);


--
-- Name: resource_server_policy uk_frsrpt700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_server_policy
    ADD CONSTRAINT uk_frsrpt700s9v50bu18ws5ha6 UNIQUE (name, resource_server_id);


--
-- Name: resource_server_scope uk_frsrst700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_server_scope
    ADD CONSTRAINT uk_frsrst700s9v50bu18ws5ha6 UNIQUE (name, resource_server_id);


--
-- Name: user_consent uk_jkuwuvd56ontgsuhogm8uewrt; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT uk_jkuwuvd56ontgsuhogm8uewrt UNIQUE (client_id, client_storage_provider, external_client_id, user_id);


--
-- Name: realm uk_orvsdmla56612eaefiq6wl5oi; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.realm
    ADD CONSTRAINT uk_orvsdmla56612eaefiq6wl5oi UNIQUE (name);


--
-- Name: user_entity uk_ru8tt6t700s9v50bu18ws5ha6; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_entity
    ADD CONSTRAINT uk_ru8tt6t700s9v50bu18ws5ha6 UNIQUE (realm_id, username);


--
-- Name: DocumentFile DocumentFile_pkey; Type: CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_pkey" PRIMARY KEY (id);


--
-- Name: LecturerType LecturerType_pkey; Type: CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."LecturerType"
    ADD CONSTRAINT "LecturerType_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: StaffPosition StaffPosition_pkey; Type: CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."StaffPosition"
    ADD CONSTRAINT "StaffPosition_pkey" PRIMARY KEY (id);


--
-- Name: StaffType StaffType_pkey; Type: CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."StaffType"
    ADD CONSTRAINT "StaffType_pkey" PRIMARY KEY (id);


--
-- Name: TemplateFile TemplateFile_pkey; Type: CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."TemplateFile"
    ADD CONSTRAINT "TemplateFile_pkey" PRIMARY KEY (id);


--
-- Name: _NotificationToStudent _NotificationToStudent_AB_pkey; Type: CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."_NotificationToStudent"
    ADD CONSTRAINT "_NotificationToStudent_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _NotificationToTrainingCourse _NotificationToTrainingCourse_AB_pkey; Type: CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."_NotificationToTrainingCourse"
    ADD CONSTRAINT "_NotificationToTrainingCourse_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: AcademicActionCondition AcademicActionCondition_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."AcademicActionCondition"
    ADD CONSTRAINT "AcademicActionCondition_pkey" PRIMARY KEY (id);


--
-- Name: AcademicActionConfig AcademicActionConfig_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."AcademicActionConfig"
    ADD CONSTRAINT "AcademicActionConfig_pkey" PRIMARY KEY (id);


--
-- Name: AcademicActionRuleSet AcademicActionRuleSet_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."AcademicActionRuleSet"
    ADD CONSTRAINT "AcademicActionRuleSet_pkey" PRIMARY KEY (id);


--
-- Name: AcademicRankingConvert AcademicRankingConvert_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."AcademicRankingConvert"
    ADD CONSTRAINT "AcademicRankingConvert_pkey" PRIMARY KEY (id);


--
-- Name: AcademicWarningRule AcademicWarningRule_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."AcademicWarningRule"
    ADD CONSTRAINT "AcademicWarningRule_pkey" PRIMARY KEY (id);


--
-- Name: AcademicWarning AcademicWarning_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."AcademicWarning"
    ADD CONSTRAINT "AcademicWarning_pkey" PRIMARY KEY (id);


--
-- Name: ApplicationCheckResult ApplicationCheckResult_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ApplicationCheckResult"
    ADD CONSTRAINT "ApplicationCheckResult_pkey" PRIMARY KEY (id);


--
-- Name: ApplicationDowngraded ApplicationDowngraded_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ApplicationDowngraded"
    ADD CONSTRAINT "ApplicationDowngraded_pkey" PRIMARY KEY (id);


--
-- Name: ArchivedAwardOnStudentSubjectScore ArchivedAwardOnStudentSubjectScore_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ArchivedAwardOnStudentSubjectScore"
    ADD CONSTRAINT "ArchivedAwardOnStudentSubjectScore_pkey" PRIMARY KEY (id);


--
-- Name: ArchivedAward ArchivedAward_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ArchivedAward"
    ADD CONSTRAINT "ArchivedAward_pkey" PRIMARY KEY (id);


--
-- Name: ArchivedCertificateOnStudentSubjectScore ArchivedCertificateOnStudentSubjectScore_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ArchivedCertificateOnStudentSubjectScore"
    ADD CONSTRAINT "ArchivedCertificateOnStudentSubjectScore_pkey" PRIMARY KEY (id);


--
-- Name: ArchivedCertificate ArchivedCertificate_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ArchivedCertificate"
    ADD CONSTRAINT "ArchivedCertificate_pkey" PRIMARY KEY (id);


--
-- Name: Award Award_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Award"
    ADD CONSTRAINT "Award_pkey" PRIMARY KEY (id);


--
-- Name: Building Building_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Building"
    ADD CONSTRAINT "Building_pkey" PRIMARY KEY (id);


--
-- Name: CertificateOnSubject CertificateOnSubject_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."CertificateOnSubject"
    ADD CONSTRAINT "CertificateOnSubject_pkey" PRIMARY KEY (id);


--
-- Name: Certificate Certificate_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Certificate"
    ADD CONSTRAINT "Certificate_pkey" PRIMARY KEY (id);


--
-- Name: ClassRegisterLogs ClassRegisterLogs_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ClassRegisterLogs"
    ADD CONSTRAINT "ClassRegisterLogs_pkey" PRIMARY KEY (id);


--
-- Name: ClassRegisterSessionCredit ClassRegisterSessionCredit_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ClassRegisterSessionCredit"
    ADD CONSTRAINT "ClassRegisterSessionCredit_pkey" PRIMARY KEY (id);


--
-- Name: ClassRegisterSession ClassRegisterSession_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ClassRegisterSession"
    ADD CONSTRAINT "ClassRegisterSession_pkey" PRIMARY KEY (id);


--
-- Name: ClassSchedule ClassSchedule_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ClassSchedule"
    ADD CONSTRAINT "ClassSchedule_pkey" PRIMARY KEY (id);


--
-- Name: CouncilMember CouncilMember_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."CouncilMember"
    ADD CONSTRAINT "CouncilMember_pkey" PRIMARY KEY (id);


--
-- Name: Council Council_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Council"
    ADD CONSTRAINT "Council_pkey" PRIMARY KEY (id);


--
-- Name: CurriculumVersion CurriculumVersion_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."CurriculumVersion"
    ADD CONSTRAINT "CurriculumVersion_pkey" PRIMARY KEY (id);


--
-- Name: Curriculum Curriculum_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Curriculum"
    ADD CONSTRAINT "Curriculum_pkey" PRIMARY KEY (id);


--
-- Name: Decision Decision_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Decision"
    ADD CONSTRAINT "Decision_pkey" PRIMARY KEY (id);


--
-- Name: DefaultCouncilRolePayAmount DefaultCouncilRolePayAmount_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."DefaultCouncilRolePayAmount"
    ADD CONSTRAINT "DefaultCouncilRolePayAmount_pkey" PRIMARY KEY (id);


--
-- Name: DefaultSupervisorPayAmount DefaultSupervisorPayAmount_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."DefaultSupervisorPayAmount"
    ADD CONSTRAINT "DefaultSupervisorPayAmount_pkey" PRIMARY KEY (id);


--
-- Name: DefenseRecord DefenseRecord_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."DefenseRecord"
    ADD CONSTRAINT "DefenseRecord_pkey" PRIMARY KEY (id);


--
-- Name: DefenseSession DefenseSession_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."DefenseSession"
    ADD CONSTRAINT "DefenseSession_pkey" PRIMARY KEY (id);


--
-- Name: DiplomaType DiplomaType_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."DiplomaType"
    ADD CONSTRAINT "DiplomaType_pkey" PRIMARY KEY (id);


--
-- Name: DiplomaVerificationApplication DiplomaVerificationApplication_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."DiplomaVerificationApplication"
    ADD CONSTRAINT "DiplomaVerificationApplication_pkey" PRIMARY KEY (id);


--
-- Name: DisciplinaryWarningReason DisciplinaryWarningReason_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."DisciplinaryWarningReason"
    ADD CONSTRAINT "DisciplinaryWarningReason_pkey" PRIMARY KEY (id);


--
-- Name: DisciplinaryWarning DisciplinaryWarning_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."DisciplinaryWarning"
    ADD CONSTRAINT "DisciplinaryWarning_pkey" PRIMARY KEY (id);


--
-- Name: EquivalencyGroup EquivalencyGroup_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."EquivalencyGroup"
    ADD CONSTRAINT "EquivalencyGroup_pkey" PRIMARY KEY (id);


--
-- Name: ExpertProfile ExpertProfile_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ExpertProfile"
    ADD CONSTRAINT "ExpertProfile_pkey" PRIMARY KEY (id);


--
-- Name: FixedClass FixedClass_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."FixedClass"
    ADD CONSTRAINT "FixedClass_pkey" PRIMARY KEY (id);


--
-- Name: GraduationDecision GraduationDecision_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."GraduationDecision"
    ADD CONSTRAINT "GraduationDecision_pkey" PRIMARY KEY (id);


--
-- Name: GraduationRankDowngradeCondition GraduationRankDowngradeCondition_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."GraduationRankDowngradeCondition"
    ADD CONSTRAINT "GraduationRankDowngradeCondition_pkey" PRIMARY KEY (id);


--
-- Name: GraduationRankDowngradeRule GraduationRankDowngradeRule_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."GraduationRankDowngradeRule"
    ADD CONSTRAINT "GraduationRankDowngradeRule_pkey" PRIMARY KEY (id);


--
-- Name: GraduationSession GraduationSession_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."GraduationSession"
    ADD CONSTRAINT "GraduationSession_pkey" PRIMARY KEY (id);


--
-- Name: Invitation Invitation_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Invitation"
    ADD CONSTRAINT "Invitation_pkey" PRIMARY KEY (id);


--
-- Name: LecturerHistory LecturerHistory_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."LecturerHistory"
    ADD CONSTRAINT "LecturerHistory_pkey" PRIMARY KEY (id);


--
-- Name: Lecturer Lecturer_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Lecturer"
    ADD CONSTRAINT "Lecturer_pkey" PRIMARY KEY (id);


--
-- Name: LibrarySubmission LibrarySubmission_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."LibrarySubmission"
    ADD CONSTRAINT "LibrarySubmission_pkey" PRIMARY KEY (id);


--
-- Name: LoadCategory LoadCategory_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."LoadCategory"
    ADD CONSTRAINT "LoadCategory_pkey" PRIMARY KEY (id);


--
-- Name: Milestone Milestone_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Milestone"
    ADD CONSTRAINT "Milestone_pkey" PRIMARY KEY (id);


--
-- Name: NoteFolder NoteFolder_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."NoteFolder"
    ADD CONSTRAINT "NoteFolder_pkey" PRIMARY KEY (id);


--
-- Name: NoteReminder NoteReminder_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."NoteReminder"
    ADD CONSTRAINT "NoteReminder_pkey" PRIMARY KEY (id);


--
-- Name: NoteTag NoteTag_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."NoteTag"
    ADD CONSTRAINT "NoteTag_pkey" PRIMARY KEY (id);


--
-- Name: Note Note_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Note"
    ADD CONSTRAINT "Note_pkey" PRIMARY KEY (id);


--
-- Name: OutputStandardOnCurriculum OutputStandardOnCurriculum_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."OutputStandardOnCurriculum"
    ADD CONSTRAINT "OutputStandardOnCurriculum_pkey" PRIMARY KEY (id);


--
-- Name: OutputStandard OutputStandard_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."OutputStandard"
    ADD CONSTRAINT "OutputStandard_pkey" PRIMARY KEY (id);


--
-- Name: PaymentRecord PaymentRecord_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."PaymentRecord"
    ADD CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY (id);


--
-- Name: PlanTrainingSubject PlanTrainingSubject_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."PlanTrainingSubject"
    ADD CONSTRAINT "PlanTrainingSubject_pkey" PRIMARY KEY (id);


--
-- Name: PlanTraining PlanTraining_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."PlanTraining"
    ADD CONSTRAINT "PlanTraining_pkey" PRIMARY KEY (id);


--
-- Name: PriorityObject PriorityObject_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."PriorityObject"
    ADD CONSTRAINT "PriorityObject_pkey" PRIMARY KEY (id);


--
-- Name: RankingCondition RankingCondition_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."RankingCondition"
    ADD CONSTRAINT "RankingCondition_pkey" PRIMARY KEY (id);


--
-- Name: ResearchProject ResearchProject_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ResearchProject"
    ADD CONSTRAINT "ResearchProject_pkey" PRIMARY KEY (id);


--
-- Name: Room Room_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Room"
    ADD CONSTRAINT "Room_pkey" PRIMARY KEY (id);


--
-- Name: ScholarshipAward ScholarshipAward_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ScholarshipAward"
    ADD CONSTRAINT "ScholarshipAward_pkey" PRIMARY KEY (id);


--
-- Name: ScholarshipCriteria ScholarshipCriteria_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ScholarshipCriteria"
    ADD CONSTRAINT "ScholarshipCriteria_pkey" PRIMARY KEY (id);


--
-- Name: Scholarship Scholarship_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Scholarship"
    ADD CONSTRAINT "Scholarship_pkey" PRIMARY KEY (id);


--
-- Name: SchoolYear SchoolYear_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SchoolYear"
    ADD CONSTRAINT "SchoolYear_pkey" PRIMARY KEY (id);


--
-- Name: ScoreConvert ScoreConvert_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ScoreConvert"
    ADD CONSTRAINT "ScoreConvert_pkey" PRIMARY KEY (id);


--
-- Name: Semester Semester_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Semester"
    ADD CONSTRAINT "Semester_pkey" PRIMARY KEY (id);


--
-- Name: StaffHistory StaffHistory_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StaffHistory"
    ADD CONSTRAINT "StaffHistory_pkey" PRIMARY KEY (id);


--
-- Name: Staff Staff_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Staff"
    ADD CONSTRAINT "Staff_pkey" PRIMARY KEY (id);


--
-- Name: StudentAcademicDecision StudentAcademicDecision_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentAcademicDecision"
    ADD CONSTRAINT "StudentAcademicDecision_pkey" PRIMARY KEY (id);


--
-- Name: StudentGraduationApplication StudentGraduationApplication_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentGraduationApplication"
    ADD CONSTRAINT "StudentGraduationApplication_pkey" PRIMARY KEY (id);


--
-- Name: StudentResearchRegistration StudentResearchRegistration_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentResearchRegistration"
    ADD CONSTRAINT "StudentResearchRegistration_pkey" PRIMARY KEY (id);


--
-- Name: StudentResearchTopic StudentResearchTopic_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentResearchTopic"
    ADD CONSTRAINT "StudentResearchTopic_pkey" PRIMARY KEY (id);


--
-- Name: StudentScoreConvert StudentScoreConvert_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentScoreConvert"
    ADD CONSTRAINT "StudentScoreConvert_pkey" PRIMARY KEY (id);


--
-- Name: StudentSemesterResult StudentSemesterResult_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentSemesterResult"
    ADD CONSTRAINT "StudentSemesterResult_pkey" PRIMARY KEY (id);


--
-- Name: StudentSubjectScoreHistory StudentSubjectScoreHistory_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentSubjectScoreHistory"
    ADD CONSTRAINT "StudentSubjectScoreHistory_pkey" PRIMARY KEY (id);


--
-- Name: StudentSubjectScore StudentSubjectScore_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentSubjectScore"
    ADD CONSTRAINT "StudentSubjectScore_pkey" PRIMARY KEY (id);


--
-- Name: StudentThesisRegistration StudentThesisRegistration_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentThesisRegistration"
    ADD CONSTRAINT "StudentThesisRegistration_pkey" PRIMARY KEY (id);


--
-- Name: StudentTrainingScore StudentTrainingScore_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentTrainingScore"
    ADD CONSTRAINT "StudentTrainingScore_pkey" PRIMARY KEY (id);


--
-- Name: StudentYearResult StudentYearResult_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentYearResult"
    ADD CONSTRAINT "StudentYearResult_pkey" PRIMARY KEY (id);


--
-- Name: Student Student_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Student"
    ADD CONSTRAINT "Student_pkey" PRIMARY KEY (id);


--
-- Name: SubjectClassHistory SubjectClassHistory_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectClassHistory"
    ADD CONSTRAINT "SubjectClassHistory_pkey" PRIMARY KEY (id);


--
-- Name: SubjectClassTime SubjectClassTime_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectClassTime"
    ADD CONSTRAINT "SubjectClassTime_pkey" PRIMARY KEY (id);


--
-- Name: SubjectClass SubjectClass_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectClass"
    ADD CONSTRAINT "SubjectClass_pkey" PRIMARY KEY (id);


--
-- Name: SubjectInGroup SubjectInGroup_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectInGroup"
    ADD CONSTRAINT "SubjectInGroup_pkey" PRIMARY KEY (id);


--
-- Name: SubjectScoreConvert SubjectScoreConvert_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectScoreConvert"
    ADD CONSTRAINT "SubjectScoreConvert_pkey" PRIMARY KEY (id);


--
-- Name: SubjectVersionCategory SubjectVersionCategory_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectVersionCategory"
    ADD CONSTRAINT "SubjectVersionCategory_pkey" PRIMARY KEY (id);


--
-- Name: SubjectVersionHistory SubjectVersionHistory_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectVersionHistory"
    ADD CONSTRAINT "SubjectVersionHistory_pkey" PRIMARY KEY (id);


--
-- Name: SubjectVersion SubjectVersion_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectVersion"
    ADD CONSTRAINT "SubjectVersion_pkey" PRIMARY KEY (id);


--
-- Name: Subject Subject_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Subject"
    ADD CONSTRAINT "Subject_pkey" PRIMARY KEY (id);


--
-- Name: SupervisorPaymentRecord SupervisorPaymentRecord_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SupervisorPaymentRecord"
    ADD CONSTRAINT "SupervisorPaymentRecord_pkey" PRIMARY KEY (id);


--
-- Name: ThesisProject ThesisProject_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ThesisProject"
    ADD CONSTRAINT "ThesisProject_pkey" PRIMARY KEY (id);


--
-- Name: ThesisSession ThesisSession_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ThesisSession"
    ADD CONSTRAINT "ThesisSession_pkey" PRIMARY KEY (id);


--
-- Name: TrainingBlockOnCurriculumVersion TrainingBlockOnCurriculumVersion_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingBlockOnCurriculumVersion"
    ADD CONSTRAINT "TrainingBlockOnCurriculumVersion_pkey" PRIMARY KEY (id);


--
-- Name: TrainingBlockSubject TrainingBlockSubject_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingBlockSubject"
    ADD CONSTRAINT "TrainingBlockSubject_pkey" PRIMARY KEY (id);


--
-- Name: TrainingBlock TrainingBlock_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingBlock"
    ADD CONSTRAINT "TrainingBlock_pkey" PRIMARY KEY (id);


--
-- Name: TrainingCourseRegulation TrainingCourseRegulation_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingCourseRegulation"
    ADD CONSTRAINT "TrainingCourseRegulation_pkey" PRIMARY KEY (id);


--
-- Name: TrainingCourse TrainingCourse_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingCourse"
    ADD CONSTRAINT "TrainingCourse_pkey" PRIMARY KEY (id);


--
-- Name: TrainingFieldOnTrainingObjectType TrainingFieldOnTrainingObjectType_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingFieldOnTrainingObjectType"
    ADD CONSTRAINT "TrainingFieldOnTrainingObjectType_pkey" PRIMARY KEY (id);


--
-- Name: TrainingField TrainingField_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingField"
    ADD CONSTRAINT "TrainingField_pkey" PRIMARY KEY (id);


--
-- Name: TrainingForm TrainingForm_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingForm"
    ADD CONSTRAINT "TrainingForm_pkey" PRIMARY KEY (id);


--
-- Name: TrainingLanguage TrainingLanguage_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingLanguage"
    ADD CONSTRAINT "TrainingLanguage_pkey" PRIMARY KEY (id);


--
-- Name: TrainingLevel TrainingLevel_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingLevel"
    ADD CONSTRAINT "TrainingLevel_pkey" PRIMARY KEY (id);


--
-- Name: TrainingLocation TrainingLocation_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingLocation"
    ADD CONSTRAINT "TrainingLocation_pkey" PRIMARY KEY (id);


--
-- Name: TrainingMajorOnTrainingObjectType TrainingMajorOnTrainingObjectType_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingMajorOnTrainingObjectType"
    ADD CONSTRAINT "TrainingMajorOnTrainingObjectType_pkey" PRIMARY KEY (id);


--
-- Name: TrainingMajor TrainingMajor_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingMajor"
    ADD CONSTRAINT "TrainingMajor_pkey" PRIMARY KEY (id);


--
-- Name: TrainingObjectType TrainingObjectType_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingObjectType"
    ADD CONSTRAINT "TrainingObjectType_pkey" PRIMARY KEY (id);


--
-- Name: TrainingScoreSession TrainingScoreSession_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingScoreSession"
    ADD CONSTRAINT "TrainingScoreSession_pkey" PRIMARY KEY (id);


--
-- Name: TrainingTime TrainingTime_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingTime"
    ADD CONSTRAINT "TrainingTime_pkey" PRIMARY KEY (id);


--
-- Name: TrainingType TrainingType_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingType"
    ADD CONSTRAINT "TrainingType_pkey" PRIMARY KEY (id);


--
-- Name: _AcademicWarningToAcademicWarningRule _AcademicWarningToAcademicWarningRule_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_AcademicWarningToAcademicWarningRule"
    ADD CONSTRAINT "_AcademicWarningToAcademicWarningRule_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _ApplicationDowngradedToGraduationRankDowngradeCondition _ApplicationDowngradedToGraduationRankDowngradeConditio_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_ApplicationDowngradedToGraduationRankDowngradeCondition"
    ADD CONSTRAINT "_ApplicationDowngradedToGraduationRankDowngradeConditio_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _AwardToSubject _AwardToSubject_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_AwardToSubject"
    ADD CONSTRAINT "_AwardToSubject_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _ClassRegisterSessionToTrainingCourse _ClassRegisterSessionToTrainingCourse_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_ClassRegisterSessionToTrainingCourse"
    ADD CONSTRAINT "_ClassRegisterSessionToTrainingCourse_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _ClassScheduleToUserProfile _ClassScheduleToUserProfile_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_ClassScheduleToUserProfile"
    ADD CONSTRAINT "_ClassScheduleToUserProfile_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _CoRequisiteSubject _CoRequisiteSubject_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_CoRequisiteSubject"
    ADD CONSTRAINT "_CoRequisiteSubject_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _DefenseRooms _DefenseRooms_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_DefenseRooms"
    ADD CONSTRAINT "_DefenseRooms_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _DisciplinaryWarningToDisciplinaryWarningReason _DisciplinaryWarningToDisciplinaryWarningReason_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_DisciplinaryWarningToDisciplinaryWarningReason"
    ADD CONSTRAINT "_DisciplinaryWarningToDisciplinaryWarningReason_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _ExpertProfileToSubjectClass _ExpertProfileToSubjectClass_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_ExpertProfileToSubjectClass"
    ADD CONSTRAINT "_ExpertProfileToSubjectClass_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _ExpertProfileToTrainingMajor _ExpertProfileToTrainingMajor_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_ExpertProfileToTrainingMajor"
    ADD CONSTRAINT "_ExpertProfileToTrainingMajor_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _FixedClassToNotification _FixedClassToNotification_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_FixedClassToNotification"
    ADD CONSTRAINT "_FixedClassToNotification_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _FixedClassToSubjectClass _FixedClassToSubjectClass_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_FixedClassToSubjectClass"
    ADD CONSTRAINT "_FixedClassToSubjectClass_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _FixedClassToSurveyObjectType _FixedClassToSurveyObjectType_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_FixedClassToSurveyObjectType"
    ADD CONSTRAINT "_FixedClassToSurveyObjectType_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _GraduationSessionToOutputStandard _GraduationSessionToOutputStandard_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_GraduationSessionToOutputStandard"
    ADD CONSTRAINT "_GraduationSessionToOutputStandard_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _NoteToNoteTag _NoteToNoteTag_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_NoteToNoteTag"
    ADD CONSTRAINT "_NoteToNoteTag_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _PrerequisiteSubject _PrerequisiteSubject_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_PrerequisiteSubject"
    ADD CONSTRAINT "_PrerequisiteSubject_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _PriorityObjectToStudent _PriorityObjectToStudent_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_PriorityObjectToStudent"
    ADD CONSTRAINT "_PriorityObjectToStudent_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _SubjectClassToSurveyObjectType _SubjectClassToSurveyObjectType_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_SubjectClassToSurveyObjectType"
    ADD CONSTRAINT "_SubjectClassToSurveyObjectType_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _gpaScore _gpaScore_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_gpaScore"
    ADD CONSTRAINT "_gpaScore_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _supplementaryScore _supplementaryScore_AB_pkey; Type: CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_supplementaryScore"
    ADD CONSTRAINT "_supplementaryScore_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: BoiDuongQuocPhongAnNinh BoiDuongQuocPhongAnNinh_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."BoiDuongQuocPhongAnNinh"
    ADD CONSTRAINT "BoiDuongQuocPhongAnNinh_pkey" PRIMARY KEY (id);


--
-- Name: CapBac CapBac_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."CapBac"
    ADD CONSTRAINT "CapBac_pkey" PRIMARY KEY (id);


--
-- Name: ChienDau ChienDau_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."ChienDau"
    ADD CONSTRAINT "ChienDau_pkey" PRIMARY KEY (id);


--
-- Name: ChucVuChinhQuyen ChucVuChinhQuyen_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."ChucVuChinhQuyen"
    ADD CONSTRAINT "ChucVuChinhQuyen_pkey" PRIMARY KEY (id);


--
-- Name: ChucVuDang ChucVuDang_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."ChucVuDang"
    ADD CONSTRAINT "ChucVuDang_pkey" PRIMARY KEY (id);


--
-- Name: DM_BacLuong DM_BacLuong_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_BacLuong"
    ADD CONSTRAINT "DM_BacLuong_pkey" PRIMARY KEY (id);


--
-- Name: DM_ChiHuyQuanLy DM_ChiHuyQuanLy_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_ChiHuyQuanLy"
    ADD CONSTRAINT "DM_ChiHuyQuanLy_pkey" PRIMARY KEY (id);


--
-- Name: DM_ChucDanhCMNVGiangVien DM_ChucDanhCMNVGiangVien_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_ChucDanhCMNVGiangVien"
    ADD CONSTRAINT "DM_ChucDanhCMNVGiangVien_pkey" PRIMARY KEY (id);


--
-- Name: DM_ChucDanhCMNVKySu DM_ChucDanhCMNVKySu_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_ChucDanhCMNVKySu"
    ADD CONSTRAINT "DM_ChucDanhCMNVKySu_pkey" PRIMARY KEY (id);


--
-- Name: DM_ChucDanhCMNVNghienCuuVien DM_ChucDanhCMNVNghienCuuVien_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_ChucDanhCMNVNghienCuuVien"
    ADD CONSTRAINT "DM_ChucDanhCMNVNghienCuuVien_pkey" PRIMARY KEY (id);


--
-- Name: DM_ChuyenMonKyThuat DM_ChuyenMonKyThuat_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_ChuyenMonKyThuat"
    ADD CONSTRAINT "DM_ChuyenMonKyThuat_pkey" PRIMARY KEY (id);


--
-- Name: DM_ChuyenNganhDaoTaoBacDH DM_ChuyenNganhDaoTaoBacDH_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_ChuyenNganhDaoTaoBacDH"
    ADD CONSTRAINT "DM_ChuyenNganhDaoTaoBacDH_pkey" PRIMARY KEY (id);


--
-- Name: DM_HinhThucKhenThuongChinhQuyen DM_HinhThucKhenThuongChinhQuyen_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_HinhThucKhenThuongChinhQuyen"
    ADD CONSTRAINT "DM_HinhThucKhenThuongChinhQuyen_pkey" PRIMARY KEY (id);


--
-- Name: DM_HinhThucKhenThuongDang DM_HinhThucKhenThuongDang_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_HinhThucKhenThuongDang"
    ADD CONSTRAINT "DM_HinhThucKhenThuongDang_pkey" PRIMARY KEY (id);


--
-- Name: DM_LoaiHinhCongTac DM_LoaiHinhCongTac_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_LoaiHinhCongTac"
    ADD CONSTRAINT "DM_LoaiHinhCongTac_pkey" PRIMARY KEY (id);


--
-- Name: DM_LoaiHinhDiHocTap DM_LoaiHinhDiHocTap_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_LoaiHinhDiHocTap"
    ADD CONSTRAINT "DM_LoaiHinhDiHocTap_pkey" PRIMARY KEY (id);


--
-- Name: DM_LoaiThuongTat DM_LoaiThuongTat_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_LoaiThuongTat"
    ADD CONSTRAINT "DM_LoaiThuongTat_pkey" PRIMARY KEY (id);


--
-- Name: DM_LoaiTinhTrangCongTac DM_LoaiTinhTrangCongTac_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_LoaiTinhTrangCongTac"
    ADD CONSTRAINT "DM_LoaiTinhTrangCongTac_pkey" PRIMARY KEY (id);


--
-- Name: DM_Ngach DM_Ngach_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_Ngach"
    ADD CONSTRAINT "DM_Ngach_pkey" PRIMARY KEY (id);


--
-- Name: DM_NganhHoc DM_NganhHoc_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_NganhHoc"
    ADD CONSTRAINT "DM_NganhHoc_pkey" PRIMARY KEY (id);


--
-- Name: DM_NhomMau DM_NhomMau_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_NhomMau"
    ADD CONSTRAINT "DM_NhomMau_pkey" PRIMARY KEY (id);


--
-- Name: DM_NuocCuDiHocTap DM_NuocCuDiHocTap_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_NuocCuDiHocTap"
    ADD CONSTRAINT "DM_NuocCuDiHocTap_pkey" PRIMARY KEY (id);


--
-- Name: DM_QuanHeThanNhan DM_QuanHeThanNhan_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_QuanHeThanNhan"
    ADD CONSTRAINT "DM_QuanHeThanNhan_pkey" PRIMARY KEY (id);


--
-- Name: DM_SucKhoe DM_SucKhoe_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_SucKhoe"
    ADD CONSTRAINT "DM_SucKhoe_pkey" PRIMARY KEY (id);


--
-- Name: DM_TinhTrangCongTac DM_TinhTrangCongTac_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_TinhTrangCongTac"
    ADD CONSTRAINT "DM_TinhTrangCongTac_pkey" PRIMARY KEY (id);


--
-- Name: DM_TinhTrangDiHocTap DM_TinhTrangDiHocTap_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_TinhTrangDiHocTap"
    ADD CONSTRAINT "DM_TinhTrangDiHocTap_pkey" PRIMARY KEY (id);


--
-- Name: DM_TinhTrangHonNhan DM_TinhTrangHonNhan_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_TinhTrangHonNhan"
    ADD CONSTRAINT "DM_TinhTrangHonNhan_pkey" PRIMARY KEY (id);


--
-- Name: DM_ToChucXaHoi DM_ToChucXaHoi_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_ToChucXaHoi"
    ADD CONSTRAINT "DM_ToChucXaHoi_pkey" PRIMARY KEY (id);


--
-- Name: DM_TrangThaiLamViec DM_TrangThaiLamViec_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_TrangThaiLamViec"
    ADD CONSTRAINT "DM_TrangThaiLamViec_pkey" PRIMARY KEY (id);


--
-- Name: DM_TrinhDoHocVan DM_TrinhDoHocVan_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_TrinhDoHocVan"
    ADD CONSTRAINT "DM_TrinhDoHocVan_pkey" PRIMARY KEY (id);


--
-- Name: DM_TrinhDoLyLuanChinhTri DM_TrinhDoLyLuanChinhTri_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_TrinhDoLyLuanChinhTri"
    ADD CONSTRAINT "DM_TrinhDoLyLuanChinhTri_pkey" PRIMARY KEY (id);


--
-- Name: DM_TrinhDoQuanLyNhaNuoc DM_TrinhDoQuanLyNhaNuoc_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_TrinhDoQuanLyNhaNuoc"
    ADD CONSTRAINT "DM_TrinhDoQuanLyNhaNuoc_pkey" PRIMARY KEY (id);


--
-- Name: DM_TruongDaoTaoBacDH DM_TruongDaoTaoBacDH_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_TruongDaoTaoBacDH"
    ADD CONSTRAINT "DM_TruongDaoTaoBacDH_pkey" PRIMARY KEY (id);


--
-- Name: DM_XepLoaiDanhGiaCanBo DM_XepLoaiDanhGiaCanBo_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_XepLoaiDanhGiaCanBo"
    ADD CONSTRAINT "DM_XepLoaiDanhGiaCanBo_pkey" PRIMARY KEY (id);


--
-- Name: DM_XepLoaiDanhGiaChatLuongDangVien DM_XepLoaiDanhGiaChatLuongDangVien_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DM_XepLoaiDanhGiaChatLuongDangVien"
    ADD CONSTRAINT "DM_XepLoaiDanhGiaChatLuongDangVien_pkey" PRIMARY KEY (id);


--
-- Name: DanhHieu DanhHieu_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DanhHieu"
    ADD CONSTRAINT "DanhHieu_pkey" PRIMARY KEY (id);


--
-- Name: DoiTuongChinhSach DoiTuongChinhSach_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DoiTuongChinhSach"
    ADD CONSTRAINT "DoiTuongChinhSach_pkey" PRIMARY KEY (id);


--
-- Name: HocHam HocHam_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."HocHam"
    ADD CONSTRAINT "HocHam_pkey" PRIMARY KEY (id);


--
-- Name: HocVi HocVi_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."HocVi"
    ADD CONSTRAINT "HocVi_pkey" PRIMARY KEY (id);


--
-- Name: KeKhaiTaiSan KeKhaiTaiSan_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."KeKhaiTaiSan"
    ADD CONSTRAINT "KeKhaiTaiSan_pkey" PRIMARY KEY (id);


--
-- Name: KhenThuong KhenThuong_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."KhenThuong"
    ADD CONSTRAINT "KhenThuong_pkey" PRIMARY KEY (id);


--
-- Name: KyLuat KyLuat_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."KyLuat"
    ADD CONSTRAINT "KyLuat_pkey" PRIMARY KEY (id);


--
-- Name: NgoaiNgu NgoaiNgu_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."NgoaiNgu"
    ADD CONSTRAINT "NgoaiNgu_pkey" PRIMARY KEY (id);


--
-- Name: NuocNgoai NuocNgoai_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."NuocNgoai"
    ADD CONSTRAINT "NuocNgoai_pkey" PRIMARY KEY (id);


--
-- Name: QuaTrinhCongTac QuaTrinhCongTac_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhCongTac"
    ADD CONSTRAINT "QuaTrinhCongTac_pkey" PRIMARY KEY (id);


--
-- Name: QuaTrinhCuDiCongTac QuaTrinhCuDiCongTac_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhCuDiCongTac"
    ADD CONSTRAINT "QuaTrinhCuDiCongTac_pkey" PRIMARY KEY (id);


--
-- Name: QuaTrinhCuDiDaoTao QuaTrinhCuDiDaoTao_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhCuDiDaoTao"
    ADD CONSTRAINT "QuaTrinhCuDiDaoTao_pkey" PRIMARY KEY (id);


--
-- Name: QuaTrinhHocTap QuaTrinhHocTap_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhHocTap"
    ADD CONSTRAINT "QuaTrinhHocTap_pkey" PRIMARY KEY (id);


--
-- Name: QuaTrinhLuong QuaTrinhLuong_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhLuong"
    ADD CONSTRAINT "QuaTrinhLuong_pkey" PRIMARY KEY (id);


--
-- Name: Relative Relative_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."Relative"
    ADD CONSTRAINT "Relative_pkey" PRIMARY KEY (id);


--
-- Name: ThuongTat ThuongTat_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."ThuongTat"
    ADD CONSTRAINT "ThuongTat_pkey" PRIMARY KEY (id);


--
-- Name: TiengDanToc TiengDanToc_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."TiengDanToc"
    ADD CONSTRAINT "TiengDanToc_pkey" PRIMARY KEY (id);


--
-- Name: TinHoc TinHoc_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."TinHoc"
    ADD CONSTRAINT "TinHoc_pkey" PRIMARY KEY (id);


--
-- Name: ToChucXaHoi ToChucXaHoi_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."ToChucXaHoi"
    ADD CONSTRAINT "ToChucXaHoi_pkey" PRIMARY KEY (id);


--
-- Name: TrinhDoLyLuanChinhTri TrinhDoLyLuanChinhTri_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."TrinhDoLyLuanChinhTri"
    ADD CONSTRAINT "TrinhDoLyLuanChinhTri_pkey" PRIMARY KEY (id);


--
-- Name: TrinhDoQuanLyNhaNuoc TrinhDoQuanLyNhaNuoc_pkey; Type: CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."TrinhDoQuanLyNhaNuoc"
    ADD CONSTRAINT "TrinhDoQuanLyNhaNuoc_pkey" PRIMARY KEY (id);


--
-- Name: BlockedIp BlockedIp_pkey; Type: CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."BlockedIp"
    ADD CONSTRAINT "BlockedIp_pkey" PRIMARY KEY (id);


--
-- Name: Feedback Feedback_pkey; Type: CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."Feedback"
    ADD CONSTRAINT "Feedback_pkey" PRIMARY KEY (id);


--
-- Name: Group Group_pkey; Type: CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."Group"
    ADD CONSTRAINT "Group_pkey" PRIMARY KEY (id);


--
-- Name: Permission Permission_pkey; Type: CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: UserProfile UserProfile_pkey; Type: CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_pkey" PRIMARY KEY (id);


--
-- Name: _GroupToRole _GroupToRole_AB_pkey; Type: CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."_GroupToRole"
    ADD CONSTRAINT "_GroupToRole_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _PermissionToRole _PermissionToRole_AB_pkey; Type: CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."_PermissionToRole"
    ADD CONSTRAINT "_PermissionToRole_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: ChatBotConfig ChatBotConfig_pkey; Type: CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."ChatBotConfig"
    ADD CONSTRAINT "ChatBotConfig_pkey" PRIMARY KEY (id);


--
-- Name: CitationMessage CitationMessage_pkey; Type: CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."CitationMessage"
    ADD CONSTRAINT "CitationMessage_pkey" PRIMARY KEY (id);


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: DocumentClassification DocumentClassification_pkey; Type: CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."DocumentClassification"
    ADD CONSTRAINT "DocumentClassification_pkey" PRIMARY KEY (id);


--
-- Name: DocumentTopic DocumentTopic_pkey; Type: CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."DocumentTopic"
    ADD CONSTRAINT "DocumentTopic_pkey" PRIMARY KEY (id);


--
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- Name: FAQ FAQ_pkey; Type: CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."FAQ"
    ADD CONSTRAINT "FAQ_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: Prompt Prompt_pkey; Type: CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."Prompt"
    ADD CONSTRAINT "Prompt_pkey" PRIMARY KEY (id);


--
-- Name: Topic Topic_pkey; Type: CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."Topic"
    ADD CONSTRAINT "Topic_pkey" PRIMARY KEY (id);


--
-- Name: UserSession UserSession_pkey; Type: CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."UserSession"
    ADD CONSTRAINT "UserSession_pkey" PRIMARY KEY (id);


--
-- Name: ChangeLog_changedAt_idx; Type: INDEX; Schema: he-thong; Owner: admin
--

CREATE INDEX "ChangeLog_changedAt_idx" ON "he-thong"."ChangeLog" USING btree ("changedAt");


--
-- Name: ChangeLog_tableName_recordId_idx; Type: INDEX; Schema: he-thong; Owner: admin
--

CREATE INDEX "ChangeLog_tableName_recordId_idx" ON "he-thong"."ChangeLog" USING btree ("tableName", "recordId");


--
-- Name: ChangeLog_userProfileId_idx; Type: INDEX; Schema: he-thong; Owner: admin
--

CREATE INDEX "ChangeLog_userProfileId_idx" ON "he-thong"."ChangeLog" USING btree ("userProfileId");


--
-- Name: Config_code_key; Type: INDEX; Schema: he-thong; Owner: admin
--

CREATE UNIQUE INDEX "Config_code_key" ON "he-thong"."Config" USING btree (code);


--
-- Name: Config_key_key; Type: INDEX; Schema: he-thong; Owner: admin
--

CREATE UNIQUE INDEX "Config_key_key" ON "he-thong"."Config" USING btree (key);


--
-- Name: Suggestion_code_key; Type: INDEX; Schema: he-thong; Owner: admin
--

CREATE UNIQUE INDEX "Suggestion_code_key" ON "he-thong"."Suggestion" USING btree (code);


--
-- Name: AnalysisCriterion_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "AnalysisCriterion_code_key" ON "khao-thi"."AnalysisCriterion" USING btree (code);


--
-- Name: AnalysisCriterion_criterionPeriodId_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "AnalysisCriterion_criterionPeriodId_key" ON "khao-thi"."AnalysisCriterion" USING btree ("criterionPeriodId");


--
-- Name: AnalysisFormEvidence_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "AnalysisFormEvidence_code_key" ON "khao-thi"."AnalysisFormEvidence" USING btree (code);


--
-- Name: AnalysisFormEvidence_requirementCriterionId_evidenceId_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "AnalysisFormEvidence_requirementCriterionId_evidenceId_key" ON "khao-thi"."AnalysisFormEvidence" USING btree ("requirementCriterionId", "evidenceId");


--
-- Name: ClusterSurvey_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "ClusterSurvey_code_key" ON "khao-thi"."ClusterSurvey" USING btree (code);


--
-- Name: CriterionCatalog_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "CriterionCatalog_code_key" ON "khao-thi"."CriterionCatalog" USING btree (code);


--
-- Name: CriterionCatalog_standardId_name_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "CriterionCatalog_standardId_name_key" ON "khao-thi"."CriterionCatalog" USING btree ("standardId", name);


--
-- Name: CriterionPeriod_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "CriterionPeriod_code_key" ON "khao-thi"."CriterionPeriod" USING btree (code);


--
-- Name: Difficulty_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "Difficulty_code_key" ON "khao-thi"."Difficulty" USING btree (code);


--
-- Name: Difficulty_level_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "Difficulty_level_key" ON "khao-thi"."Difficulty" USING btree (level);


--
-- Name: Difficulty_name_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "Difficulty_name_key" ON "khao-thi"."Difficulty" USING btree (name);


--
-- Name: EvaluationCouncilMember_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "EvaluationCouncilMember_code_key" ON "khao-thi"."EvaluationCouncilMember" USING btree (code);


--
-- Name: EvaluationCouncil_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "EvaluationCouncil_code_key" ON "khao-thi"."EvaluationCouncil" USING btree (code);


--
-- Name: EvaluationCouncil_periodId_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "EvaluationCouncil_periodId_key" ON "khao-thi"."EvaluationCouncil" USING btree ("periodId");


--
-- Name: EvaluationCriterionComment_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "EvaluationCriterionComment_code_key" ON "khao-thi"."EvaluationCriterionComment" USING btree (code);


--
-- Name: EvaluationCriterion_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "EvaluationCriterion_code_key" ON "khao-thi"."EvaluationCriterion" USING btree (code);


--
-- Name: EvaluationCriterion_criterionPeriodId_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "EvaluationCriterion_criterionPeriodId_key" ON "khao-thi"."EvaluationCriterion" USING btree ("criterionPeriodId");


--
-- Name: EvaluationPeriod_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "EvaluationPeriod_code_key" ON "khao-thi"."EvaluationPeriod" USING btree (code);


--
-- Name: EvidenceCategory_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "EvidenceCategory_code_key" ON "khao-thi"."EvidenceCategory" USING btree (code);


--
-- Name: EvidenceFile_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "EvidenceFile_code_key" ON "khao-thi"."EvidenceFile" USING btree (code);


--
-- Name: Evidence_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "Evidence_code_key" ON "khao-thi"."Evidence" USING btree (code);


--
-- Name: ExamBankQuestion_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "ExamBankQuestion_code_key" ON "khao-thi"."ExamBankQuestion" USING btree (code);


--
-- Name: ExamBankQuestion_examBankId_order_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "ExamBankQuestion_examBankId_order_key" ON "khao-thi"."ExamBankQuestion" USING btree ("examBankId", "order");


--
-- Name: ExamBankQuestion_examBankId_questionId_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "ExamBankQuestion_examBankId_questionId_key" ON "khao-thi"."ExamBankQuestion" USING btree ("examBankId", "questionId");


--
-- Name: ExamBank_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "ExamBank_code_key" ON "khao-thi"."ExamBank" USING btree (code);


--
-- Name: ExamBank_examId_examCode_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "ExamBank_examId_examCode_key" ON "khao-thi"."ExamBank" USING btree ("examId", "examCode");


--
-- Name: ExamList_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "ExamList_code_key" ON "khao-thi"."ExamList" USING btree (code);


--
-- Name: ExamPaper_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "ExamPaper_code_key" ON "khao-thi"."ExamPaper" USING btree (code);


--
-- Name: ExamPaper_examCode_examListId_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "ExamPaper_examCode_examListId_key" ON "khao-thi"."ExamPaper" USING btree ("examCode", "examListId");


--
-- Name: ExamPaper_studentSubjectScoreId_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "ExamPaper_studentSubjectScoreId_key" ON "khao-thi"."ExamPaper" USING btree ("studentSubjectScoreId");


--
-- Name: ExamRoom_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "ExamRoom_code_key" ON "khao-thi"."ExamRoom" USING btree (code);


--
-- Name: ExamRoom_examId_roomId_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "ExamRoom_examId_roomId_key" ON "khao-thi"."ExamRoom" USING btree ("examId", "roomId");


--
-- Name: Exam_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "Exam_code_key" ON "khao-thi"."Exam" USING btree (code);


--
-- Name: FillInBlankSlot_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "FillInBlankSlot_code_key" ON "khao-thi"."FillInBlankSlot" USING btree (code);


--
-- Name: FillInBlankSlot_questionId_order_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "FillInBlankSlot_questionId_order_key" ON "khao-thi"."FillInBlankSlot" USING btree ("questionId", "order");


--
-- Name: KnowledgeBlock_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "KnowledgeBlock_code_key" ON "khao-thi"."KnowledgeBlock" USING btree (code);


--
-- Name: KnowledgeBlock_name_subjectVersionId_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "KnowledgeBlock_name_subjectVersionId_key" ON "khao-thi"."KnowledgeBlock" USING btree (name, "subjectVersionId");


--
-- Name: MultipleChoiceOption_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "MultipleChoiceOption_code_key" ON "khao-thi"."MultipleChoiceOption" USING btree (code);


--
-- Name: OrderingItem_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "OrderingItem_code_key" ON "khao-thi"."OrderingItem" USING btree (code);


--
-- Name: OrderingItem_questionId_correctOrder_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "OrderingItem_questionId_correctOrder_key" ON "khao-thi"."OrderingItem" USING btree ("questionId", "correctOrder");


--
-- Name: QuestionBank_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "QuestionBank_code_key" ON "khao-thi"."QuestionBank" USING btree (code);


--
-- Name: QuestionBank_subjectVersionId_name_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "QuestionBank_subjectVersionId_name_key" ON "khao-thi"."QuestionBank" USING btree ("subjectVersionId", name);


--
-- Name: Question_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "Question_code_key" ON "khao-thi"."Question" USING btree (code);


--
-- Name: RequirementCriterionCatalog_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "RequirementCriterionCatalog_code_key" ON "khao-thi"."RequirementCriterionCatalog" USING btree (code);


--
-- Name: RequirementCriterionCatalog_criterionCatalogId_name_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "RequirementCriterionCatalog_criterionCatalogId_name_key" ON "khao-thi"."RequirementCriterionCatalog" USING btree ("criterionCatalogId", name);


--
-- Name: RequirementCriterion_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "RequirementCriterion_code_key" ON "khao-thi"."RequirementCriterion" USING btree (code);


--
-- Name: StandardCatalog_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "StandardCatalog_code_key" ON "khao-thi"."StandardCatalog" USING btree (code);


--
-- Name: StandardPeriod_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "StandardPeriod_code_key" ON "khao-thi"."StandardPeriod" USING btree (code);


--
-- Name: StandardPeriod_periodId_name_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "StandardPeriod_periodId_name_key" ON "khao-thi"."StandardPeriod" USING btree ("periodId", name);


--
-- Name: SurveyChoice_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "SurveyChoice_code_key" ON "khao-thi"."SurveyChoice" USING btree (code);


--
-- Name: SurveyObjectType_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "SurveyObjectType_code_key" ON "khao-thi"."SurveyObjectType" USING btree (code);


--
-- Name: SurveyQuestionGroup_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "SurveyQuestionGroup_code_key" ON "khao-thi"."SurveyQuestionGroup" USING btree (code);


--
-- Name: SurveyQuestion_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "SurveyQuestion_code_key" ON "khao-thi"."SurveyQuestion" USING btree (code);


--
-- Name: SurveyResponse_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "SurveyResponse_code_key" ON "khao-thi"."SurveyResponse" USING btree (code);


--
-- Name: SurveyResponse_surveySessionId_surveyQuestionId_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "SurveyResponse_surveySessionId_surveyQuestionId_key" ON "khao-thi"."SurveyResponse" USING btree ("surveySessionId", "surveyQuestionId");


--
-- Name: SurveySession_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "SurveySession_code_key" ON "khao-thi"."SurveySession" USING btree (code);


--
-- Name: SurveySession_surveyId_studentId_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "SurveySession_surveyId_studentId_key" ON "khao-thi"."SurveySession" USING btree ("surveyId", "studentId");


--
-- Name: SurveyTopic_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "SurveyTopic_code_key" ON "khao-thi"."SurveyTopic" USING btree (code);


--
-- Name: Survey_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "Survey_code_key" ON "khao-thi"."Survey" USING btree (code);


--
-- Name: TestStructureRule_code_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "TestStructureRule_code_key" ON "khao-thi"."TestStructureRule" USING btree (code);


--
-- Name: TestStructureRule_examId_knowledgeBlockId_questionPoint_que_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "TestStructureRule_examId_knowledgeBlockId_questionPoint_que_key" ON "khao-thi"."TestStructureRule" USING btree ("examId", "knowledgeBlockId", "questionPoint", "questionType");


--
-- Name: TestStructureRule_questionBankId_knowledgeBlockId_questionP_key; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE UNIQUE INDEX "TestStructureRule_questionBankId_knowledgeBlockId_questionP_key" ON "khao-thi"."TestStructureRule" USING btree ("questionBankId", "knowledgeBlockId", "questionPoint", "questionType");


--
-- Name: _ClusterSurveyToLecturer_B_index; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE INDEX "_ClusterSurveyToLecturer_B_index" ON "khao-thi"."_ClusterSurveyToLecturer" USING btree ("B");


--
-- Name: _ClusterSurveyToSurveyObjectType_B_index; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE INDEX "_ClusterSurveyToSurveyObjectType_B_index" ON "khao-thi"."_ClusterSurveyToSurveyObjectType" USING btree ("B");


--
-- Name: _ClusterSurveyToSurveyQuestion_B_index; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE INDEX "_ClusterSurveyToSurveyQuestion_B_index" ON "khao-thi"."_ClusterSurveyToSurveyQuestion" USING btree ("B");


--
-- Name: _SurveyObjectTypeToTrainingCourse_B_index; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE INDEX "_SurveyObjectTypeToTrainingCourse_B_index" ON "khao-thi"."_SurveyObjectTypeToTrainingCourse" USING btree ("B");


--
-- Name: _SurveyObjectTypeToTrainingField_B_index; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE INDEX "_SurveyObjectTypeToTrainingField_B_index" ON "khao-thi"."_SurveyObjectTypeToTrainingField" USING btree ("B");


--
-- Name: _SurveyObjectTypeToTrainingMajor_B_index; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE INDEX "_SurveyObjectTypeToTrainingMajor_B_index" ON "khao-thi"."_SurveyObjectTypeToTrainingMajor" USING btree ("B");


--
-- Name: _SurveyQuestionGroupToSurveyTopic_B_index; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE INDEX "_SurveyQuestionGroupToSurveyTopic_B_index" ON "khao-thi"."_SurveyQuestionGroupToSurveyTopic" USING btree ("B");


--
-- Name: _SurveyToSurveyChoice_B_index; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE INDEX "_SurveyToSurveyChoice_B_index" ON "khao-thi"."_SurveyToSurveyChoice" USING btree ("B");


--
-- Name: _SurveyToSurveyObjectType_B_index; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE INDEX "_SurveyToSurveyObjectType_B_index" ON "khao-thi"."_SurveyToSurveyObjectType" USING btree ("B");


--
-- Name: _SurveyToSurveyQuestion_B_index; Type: INDEX; Schema: khao-thi; Owner: admin
--

CREATE INDEX "_SurveyToSurveyQuestion_B_index" ON "khao-thi"."_SurveyToSurveyQuestion" USING btree ("B");


--
-- Name: DM_XaPhuong_New_sDM_TinhId_New_idx; Type: INDEX; Schema: mta; Owner: admin
--

CREATE INDEX "DM_XaPhuong_New_sDM_TinhId_New_idx" ON mta."DM_XaPhuong_New" USING btree ("sDM_TinhId_New");


--
-- Name: IX_DM_DonVi_iParentId; Type: INDEX; Schema: mta; Owner: admin
--

CREATE INDEX "IX_DM_DonVi_iParentId" ON mta."DM_DonVi" USING btree ("sParentId");


--
-- Name: IX_DM_DonVi_sMa; Type: INDEX; Schema: mta; Owner: admin
--

CREATE INDEX "IX_DM_DonVi_sMa" ON mta."DM_DonVi" USING btree ("sMa");


--
-- Name: IX_DM_NhanVien_sDM_DonViId; Type: INDEX; Schema: mta; Owner: admin
--

CREATE INDEX "IX_DM_NhanVien_sDM_DonViId" ON mta."DM_NhanVien" USING btree ("sDM_DonViId");


--
-- Name: IX_DM_NhanVien_sDM_ViTriCongViecId; Type: INDEX; Schema: mta; Owner: admin
--

CREATE INDEX "IX_DM_NhanVien_sDM_ViTriCongViecId" ON mta."DM_NhanVien" USING btree ("sDM_ViTriCongViecId");


--
-- Name: IX_DM_NhanVien_sEmail; Type: INDEX; Schema: mta; Owner: admin
--

CREATE INDEX "IX_DM_NhanVien_sEmail" ON mta."DM_NhanVien" USING btree ("sEmail");


--
-- Name: IX_DM_NhanVien_sSDTDiDong; Type: INDEX; Schema: mta; Owner: admin
--

CREATE INDEX "IX_DM_NhanVien_sSDTDiDong" ON mta."DM_NhanVien" USING btree ("sSDTDiDong");


--
-- Name: IX_DM_QuanHuyen_iDM_TinhId; Type: INDEX; Schema: mta; Owner: admin
--

CREATE INDEX "IX_DM_QuanHuyen_iDM_TinhId" ON mta."DM_QuanHuyen" USING btree ("sDM_TinhId");


--
-- Name: IX_DM_Tinh_New_iDM_QuocGiaId; Type: INDEX; Schema: mta; Owner: admin
--

CREATE INDEX "IX_DM_Tinh_New_iDM_QuocGiaId" ON mta."DM_Tinh_New" USING btree ("sDM_QuocGiaId");


--
-- Name: IX_DM_Tinh_iDM_QuocGiaId; Type: INDEX; Schema: mta; Owner: admin
--

CREATE INDEX "IX_DM_Tinh_iDM_QuocGiaId" ON mta."DM_Tinh" USING btree ("sDM_QuocGiaId");


--
-- Name: IX_DM_XaPhuong_iDM_QuanHuyenId; Type: INDEX; Schema: mta; Owner: admin
--

CREATE INDEX "IX_DM_XaPhuong_iDM_QuanHuyenId" ON mta."DM_XaPhuong" USING btree ("sDM_QuanHuyenId");


--
-- Name: _DM_DonViToSurveyObjectType_B_index; Type: INDEX; Schema: mta; Owner: admin
--

CREATE INDEX "_DM_DonViToSurveyObjectType_B_index" ON mta."_DM_DonViToSurveyObjectType" USING btree ("B");


--
-- Name: fed_user_attr_long_values; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX fed_user_attr_long_values ON public.fed_user_attribute USING btree (long_value_hash, name);


--
-- Name: fed_user_attr_long_values_lower_case; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX fed_user_attr_long_values_lower_case ON public.fed_user_attribute USING btree (long_value_hash_lower_case, name);


--
-- Name: idx_admin_event_time; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_admin_event_time ON public.admin_event_entity USING btree (realm_id, admin_event_time);


--
-- Name: idx_assoc_pol_assoc_pol_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_assoc_pol_assoc_pol_id ON public.associated_policy USING btree (associated_policy_id);


--
-- Name: idx_auth_config_realm; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_auth_config_realm ON public.authenticator_config USING btree (realm_id);


--
-- Name: idx_auth_exec_flow; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_auth_exec_flow ON public.authentication_execution USING btree (flow_id);


--
-- Name: idx_auth_exec_realm_flow; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_auth_exec_realm_flow ON public.authentication_execution USING btree (realm_id, flow_id);


--
-- Name: idx_auth_flow_realm; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_auth_flow_realm ON public.authentication_flow USING btree (realm_id);


--
-- Name: idx_cl_clscope; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_cl_clscope ON public.client_scope_client USING btree (scope_id);


--
-- Name: idx_client_att_by_name_value; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_client_att_by_name_value ON public.client_attributes USING btree (name, substr(value, 1, 255));


--
-- Name: idx_client_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_client_id ON public.client USING btree (client_id);


--
-- Name: idx_client_init_acc_realm; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_client_init_acc_realm ON public.client_initial_access USING btree (realm_id);


--
-- Name: idx_client_session_session; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_client_session_session ON public.client_session USING btree (session_id);


--
-- Name: idx_clscope_attrs; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_clscope_attrs ON public.client_scope_attributes USING btree (scope_id);


--
-- Name: idx_clscope_cl; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_clscope_cl ON public.client_scope_client USING btree (client_id);


--
-- Name: idx_clscope_protmap; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_clscope_protmap ON public.protocol_mapper USING btree (client_scope_id);


--
-- Name: idx_clscope_role; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_clscope_role ON public.client_scope_role_mapping USING btree (scope_id);


--
-- Name: idx_compo_config_compo; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_compo_config_compo ON public.component_config USING btree (component_id);


--
-- Name: idx_component_provider_type; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_component_provider_type ON public.component USING btree (provider_type);


--
-- Name: idx_component_realm; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_component_realm ON public.component USING btree (realm_id);


--
-- Name: idx_composite; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_composite ON public.composite_role USING btree (composite);


--
-- Name: idx_composite_child; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_composite_child ON public.composite_role USING btree (child_role);


--
-- Name: idx_defcls_realm; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_defcls_realm ON public.default_client_scope USING btree (realm_id);


--
-- Name: idx_defcls_scope; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_defcls_scope ON public.default_client_scope USING btree (scope_id);


--
-- Name: idx_event_time; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_event_time ON public.event_entity USING btree (realm_id, event_time);


--
-- Name: idx_fedidentity_feduser; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_fedidentity_feduser ON public.federated_identity USING btree (federated_user_id);


--
-- Name: idx_fedidentity_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_fedidentity_user ON public.federated_identity USING btree (user_id);


--
-- Name: idx_fu_attribute; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_fu_attribute ON public.fed_user_attribute USING btree (user_id, realm_id, name);


--
-- Name: idx_fu_cnsnt_ext; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_fu_cnsnt_ext ON public.fed_user_consent USING btree (user_id, client_storage_provider, external_client_id);


--
-- Name: idx_fu_consent; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_fu_consent ON public.fed_user_consent USING btree (user_id, client_id);


--
-- Name: idx_fu_consent_ru; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_fu_consent_ru ON public.fed_user_consent USING btree (realm_id, user_id);


--
-- Name: idx_fu_credential; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_fu_credential ON public.fed_user_credential USING btree (user_id, type);


--
-- Name: idx_fu_credential_ru; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_fu_credential_ru ON public.fed_user_credential USING btree (realm_id, user_id);


--
-- Name: idx_fu_group_membership; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_fu_group_membership ON public.fed_user_group_membership USING btree (user_id, group_id);


--
-- Name: idx_fu_group_membership_ru; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_fu_group_membership_ru ON public.fed_user_group_membership USING btree (realm_id, user_id);


--
-- Name: idx_fu_required_action; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_fu_required_action ON public.fed_user_required_action USING btree (user_id, required_action);


--
-- Name: idx_fu_required_action_ru; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_fu_required_action_ru ON public.fed_user_required_action USING btree (realm_id, user_id);


--
-- Name: idx_fu_role_mapping; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_fu_role_mapping ON public.fed_user_role_mapping USING btree (user_id, role_id);


--
-- Name: idx_fu_role_mapping_ru; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_fu_role_mapping_ru ON public.fed_user_role_mapping USING btree (realm_id, user_id);


--
-- Name: idx_group_att_by_name_value; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_group_att_by_name_value ON public.group_attribute USING btree (name, ((value)::character varying(250)));


--
-- Name: idx_group_attr_group; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_group_attr_group ON public.group_attribute USING btree (group_id);


--
-- Name: idx_group_role_mapp_group; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_group_role_mapp_group ON public.group_role_mapping USING btree (group_id);


--
-- Name: idx_id_prov_mapp_realm; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_id_prov_mapp_realm ON public.identity_provider_mapper USING btree (realm_id);


--
-- Name: idx_ident_prov_realm; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_ident_prov_realm ON public.identity_provider USING btree (realm_id);


--
-- Name: idx_keycloak_role_client; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_keycloak_role_client ON public.keycloak_role USING btree (client);


--
-- Name: idx_keycloak_role_realm; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_keycloak_role_realm ON public.keycloak_role USING btree (realm);


--
-- Name: idx_offline_css_preload; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_offline_css_preload ON public.offline_client_session USING btree (client_id, offline_flag);


--
-- Name: idx_offline_uss_by_user; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_offline_uss_by_user ON public.offline_user_session USING btree (user_id, realm_id, offline_flag);


--
-- Name: idx_offline_uss_by_usersess; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_offline_uss_by_usersess ON public.offline_user_session USING btree (realm_id, offline_flag, user_session_id);


--
-- Name: idx_offline_uss_createdon; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_offline_uss_createdon ON public.offline_user_session USING btree (created_on);


--
-- Name: idx_offline_uss_preload; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_offline_uss_preload ON public.offline_user_session USING btree (offline_flag, created_on, user_session_id);


--
-- Name: idx_protocol_mapper_client; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_protocol_mapper_client ON public.protocol_mapper USING btree (client_id);


--
-- Name: idx_realm_attr_realm; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_realm_attr_realm ON public.realm_attribute USING btree (realm_id);


--
-- Name: idx_realm_clscope; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_realm_clscope ON public.client_scope USING btree (realm_id);


--
-- Name: idx_realm_def_grp_realm; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_realm_def_grp_realm ON public.realm_default_groups USING btree (realm_id);


--
-- Name: idx_realm_evt_list_realm; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_realm_evt_list_realm ON public.realm_events_listeners USING btree (realm_id);


--
-- Name: idx_realm_evt_types_realm; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_realm_evt_types_realm ON public.realm_enabled_event_types USING btree (realm_id);


--
-- Name: idx_realm_master_adm_cli; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_realm_master_adm_cli ON public.realm USING btree (master_admin_client);


--
-- Name: idx_realm_supp_local_realm; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_realm_supp_local_realm ON public.realm_supported_locales USING btree (realm_id);


--
-- Name: idx_redir_uri_client; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_redir_uri_client ON public.redirect_uris USING btree (client_id);


--
-- Name: idx_req_act_prov_realm; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_req_act_prov_realm ON public.required_action_provider USING btree (realm_id);


--
-- Name: idx_res_policy_policy; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_res_policy_policy ON public.resource_policy USING btree (policy_id);


--
-- Name: idx_res_scope_scope; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_res_scope_scope ON public.resource_scope USING btree (scope_id);


--
-- Name: idx_res_serv_pol_res_serv; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_res_serv_pol_res_serv ON public.resource_server_policy USING btree (resource_server_id);


--
-- Name: idx_res_srv_res_res_srv; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_res_srv_res_res_srv ON public.resource_server_resource USING btree (resource_server_id);


--
-- Name: idx_res_srv_scope_res_srv; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_res_srv_scope_res_srv ON public.resource_server_scope USING btree (resource_server_id);


--
-- Name: idx_role_attribute; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_role_attribute ON public.role_attribute USING btree (role_id);


--
-- Name: idx_role_clscope; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_role_clscope ON public.client_scope_role_mapping USING btree (role_id);


--
-- Name: idx_scope_mapping_role; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_scope_mapping_role ON public.scope_mapping USING btree (role_id);


--
-- Name: idx_scope_policy_policy; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_scope_policy_policy ON public.scope_policy USING btree (policy_id);


--
-- Name: idx_update_time; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_update_time ON public.migration_model USING btree (update_time);


--
-- Name: idx_us_sess_id_on_cl_sess; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_us_sess_id_on_cl_sess ON public.offline_client_session USING btree (user_session_id);


--
-- Name: idx_usconsent_clscope; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_usconsent_clscope ON public.user_consent_client_scope USING btree (user_consent_id);


--
-- Name: idx_user_attribute; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_attribute ON public.user_attribute USING btree (user_id);


--
-- Name: idx_user_attribute_name; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_attribute_name ON public.user_attribute USING btree (name, value);


--
-- Name: idx_user_consent; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_consent ON public.user_consent USING btree (user_id);


--
-- Name: idx_user_credential; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_credential ON public.credential USING btree (user_id);


--
-- Name: idx_user_email; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_email ON public.user_entity USING btree (email);


--
-- Name: idx_user_group_mapping; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_group_mapping ON public.user_group_membership USING btree (user_id);


--
-- Name: idx_user_reqactions; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_reqactions ON public.user_required_action USING btree (user_id);


--
-- Name: idx_user_role_mapping; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_role_mapping ON public.user_role_mapping USING btree (user_id);


--
-- Name: idx_user_service_account; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_user_service_account ON public.user_entity USING btree (realm_id, service_account_client_link);


--
-- Name: idx_usr_fed_map_fed_prv; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_usr_fed_map_fed_prv ON public.user_federation_mapper USING btree (federation_provider_id);


--
-- Name: idx_usr_fed_map_realm; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_usr_fed_map_realm ON public.user_federation_mapper USING btree (realm_id);


--
-- Name: idx_usr_fed_prv_realm; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_usr_fed_prv_realm ON public.user_federation_provider USING btree (realm_id);


--
-- Name: idx_web_orig_client; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_web_orig_client ON public.web_origins USING btree (client_id);


--
-- Name: user_attr_long_values; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX user_attr_long_values ON public.user_attribute USING btree (long_value_hash, name);


--
-- Name: user_attr_long_values_lower_case; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX user_attr_long_values_lower_case ON public.user_attribute USING btree (long_value_hash_lower_case, name);


--
-- Name: DocumentFile_code_key; Type: INDEX; Schema: ql-danh-muc; Owner: admin
--

CREATE UNIQUE INDEX "DocumentFile_code_key" ON "ql-danh-muc"."DocumentFile" USING btree (code);


--
-- Name: DocumentFile_diplomaBackId_key; Type: INDEX; Schema: ql-danh-muc; Owner: admin
--

CREATE UNIQUE INDEX "DocumentFile_diplomaBackId_key" ON "ql-danh-muc"."DocumentFile" USING btree ("diplomaBackId");


--
-- Name: DocumentFile_diplomaFrontId_key; Type: INDEX; Schema: ql-danh-muc; Owner: admin
--

CREATE UNIQUE INDEX "DocumentFile_diplomaFrontId_key" ON "ql-danh-muc"."DocumentFile" USING btree ("diplomaFrontId");


--
-- Name: DocumentFile_diplomaVerificationBackId_key; Type: INDEX; Schema: ql-danh-muc; Owner: admin
--

CREATE UNIQUE INDEX "DocumentFile_diplomaVerificationBackId_key" ON "ql-danh-muc"."DocumentFile" USING btree ("diplomaVerificationBackId");


--
-- Name: DocumentFile_diplomaVerificationFrontId_key; Type: INDEX; Schema: ql-danh-muc; Owner: admin
--

CREATE UNIQUE INDEX "DocumentFile_diplomaVerificationFrontId_key" ON "ql-danh-muc"."DocumentFile" USING btree ("diplomaVerificationFrontId");


--
-- Name: DocumentFile_diplomaVerificationId_key; Type: INDEX; Schema: ql-danh-muc; Owner: admin
--

CREATE UNIQUE INDEX "DocumentFile_diplomaVerificationId_key" ON "ql-danh-muc"."DocumentFile" USING btree ("diplomaVerificationId");


--
-- Name: LecturerType_code_key; Type: INDEX; Schema: ql-danh-muc; Owner: admin
--

CREATE UNIQUE INDEX "LecturerType_code_key" ON "ql-danh-muc"."LecturerType" USING btree (code);


--
-- Name: LecturerType_name_key; Type: INDEX; Schema: ql-danh-muc; Owner: admin
--

CREATE UNIQUE INDEX "LecturerType_name_key" ON "ql-danh-muc"."LecturerType" USING btree (name);


--
-- Name: Notification_code_key; Type: INDEX; Schema: ql-danh-muc; Owner: admin
--

CREATE UNIQUE INDEX "Notification_code_key" ON "ql-danh-muc"."Notification" USING btree (code);


--
-- Name: StaffPosition_code_key; Type: INDEX; Schema: ql-danh-muc; Owner: admin
--

CREATE UNIQUE INDEX "StaffPosition_code_key" ON "ql-danh-muc"."StaffPosition" USING btree (code);


--
-- Name: StaffType_code_key; Type: INDEX; Schema: ql-danh-muc; Owner: admin
--

CREATE UNIQUE INDEX "StaffType_code_key" ON "ql-danh-muc"."StaffType" USING btree (code);


--
-- Name: StaffType_name_key; Type: INDEX; Schema: ql-danh-muc; Owner: admin
--

CREATE UNIQUE INDEX "StaffType_name_key" ON "ql-danh-muc"."StaffType" USING btree (name);


--
-- Name: TemplateFile_code_key; Type: INDEX; Schema: ql-danh-muc; Owner: admin
--

CREATE UNIQUE INDEX "TemplateFile_code_key" ON "ql-danh-muc"."TemplateFile" USING btree (code);


--
-- Name: TemplateFile_path_key; Type: INDEX; Schema: ql-danh-muc; Owner: admin
--

CREATE UNIQUE INDEX "TemplateFile_path_key" ON "ql-danh-muc"."TemplateFile" USING btree (path);


--
-- Name: _NotificationToStudent_B_index; Type: INDEX; Schema: ql-danh-muc; Owner: admin
--

CREATE INDEX "_NotificationToStudent_B_index" ON "ql-danh-muc"."_NotificationToStudent" USING btree ("B");


--
-- Name: _NotificationToTrainingCourse_B_index; Type: INDEX; Schema: ql-danh-muc; Owner: admin
--

CREATE INDEX "_NotificationToTrainingCourse_B_index" ON "ql-danh-muc"."_NotificationToTrainingCourse" USING btree ("B");


--
-- Name: AcademicActionCondition_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "AcademicActionCondition_code_key" ON "ql-dao-tao"."AcademicActionCondition" USING btree (code);


--
-- Name: AcademicActionConfig_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "AcademicActionConfig_code_key" ON "ql-dao-tao"."AcademicActionConfig" USING btree (code);


--
-- Name: AcademicActionConfig_trainingCourseId_name_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "AcademicActionConfig_trainingCourseId_name_key" ON "ql-dao-tao"."AcademicActionConfig" USING btree ("trainingCourseId", name);


--
-- Name: AcademicActionRuleSet_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "AcademicActionRuleSet_code_key" ON "ql-dao-tao"."AcademicActionRuleSet" USING btree (code);


--
-- Name: AcademicRankingConvert_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "AcademicRankingConvert_code_key" ON "ql-dao-tao"."AcademicRankingConvert" USING btree (code);


--
-- Name: AcademicRankingConvert_trainingCourseId_context_rankOrder_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "AcademicRankingConvert_trainingCourseId_context_rankOrder_key" ON "ql-dao-tao"."AcademicRankingConvert" USING btree ("trainingCourseId", context, "rankOrder");


--
-- Name: AcademicWarningRule_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "AcademicWarningRule_code_key" ON "ql-dao-tao"."AcademicWarningRule" USING btree (code);


--
-- Name: AcademicWarning_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "AcademicWarning_code_key" ON "ql-dao-tao"."AcademicWarning" USING btree (code);


--
-- Name: ApplicationCheckResult_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ApplicationCheckResult_code_key" ON "ql-dao-tao"."ApplicationCheckResult" USING btree (code);


--
-- Name: ApplicationCheckResult_studentGraduationApplicationId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ApplicationCheckResult_studentGraduationApplicationId_key" ON "ql-dao-tao"."ApplicationCheckResult" USING btree ("studentGraduationApplicationId");


--
-- Name: ApplicationCheckResult_studentGraduationApplicationId_ranki_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ApplicationCheckResult_studentGraduationApplicationId_ranki_key" ON "ql-dao-tao"."ApplicationCheckResult" USING btree ("studentGraduationApplicationId", "rankingConditionId");


--
-- Name: ApplicationDowngraded_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ApplicationDowngraded_code_key" ON "ql-dao-tao"."ApplicationDowngraded" USING btree (code);


--
-- Name: ApplicationDowngraded_studentGraduationApplicationId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ApplicationDowngraded_studentGraduationApplicationId_key" ON "ql-dao-tao"."ApplicationDowngraded" USING btree ("studentGraduationApplicationId");


--
-- Name: ArchivedAwardOnStudentSubjectScore_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ArchivedAwardOnStudentSubjectScore_code_key" ON "ql-dao-tao"."ArchivedAwardOnStudentSubjectScore" USING btree (code);


--
-- Name: ArchivedAwardOnStudentSubjectScore_studentSubjectScoreId_ar_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ArchivedAwardOnStudentSubjectScore_studentSubjectScoreId_ar_key" ON "ql-dao-tao"."ArchivedAwardOnStudentSubjectScore" USING btree ("studentSubjectScoreId", "archivedAwardId");


--
-- Name: ArchivedAward_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ArchivedAward_code_key" ON "ql-dao-tao"."ArchivedAward" USING btree (code);


--
-- Name: ArchivedCertificateOnStudentSubjectScore_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ArchivedCertificateOnStudentSubjectScore_code_key" ON "ql-dao-tao"."ArchivedCertificateOnStudentSubjectScore" USING btree (code);


--
-- Name: ArchivedCertificateOnStudentSubjectScore_studentSubjectScor_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ArchivedCertificateOnStudentSubjectScore_studentSubjectScor_key" ON "ql-dao-tao"."ArchivedCertificateOnStudentSubjectScore" USING btree ("studentSubjectScoreId", "archivedCertificateId");


--
-- Name: ArchivedCertificate_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ArchivedCertificate_code_key" ON "ql-dao-tao"."ArchivedCertificate" USING btree (code);


--
-- Name: Award_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Award_code_key" ON "ql-dao-tao"."Award" USING btree (code);


--
-- Name: Building_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Building_code_key" ON "ql-dao-tao"."Building" USING btree (code);


--
-- Name: CertificateOnSubject_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "CertificateOnSubject_code_key" ON "ql-dao-tao"."CertificateOnSubject" USING btree (code);


--
-- Name: Certificate_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Certificate_code_key" ON "ql-dao-tao"."Certificate" USING btree (code);


--
-- Name: ClassRegisterLogs_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ClassRegisterLogs_code_key" ON "ql-dao-tao"."ClassRegisterLogs" USING btree (code);


--
-- Name: ClassRegisterSessionCredit_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ClassRegisterSessionCredit_code_key" ON "ql-dao-tao"."ClassRegisterSessionCredit" USING btree (code);


--
-- Name: ClassRegisterSession_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ClassRegisterSession_code_key" ON "ql-dao-tao"."ClassRegisterSession" USING btree (code);


--
-- Name: ClassSchedule_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ClassSchedule_code_key" ON "ql-dao-tao"."ClassSchedule" USING btree (code);


--
-- Name: ClassSchedule_originalScheduleId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ClassSchedule_originalScheduleId_key" ON "ql-dao-tao"."ClassSchedule" USING btree ("originalScheduleId");


--
-- Name: CouncilMember_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "CouncilMember_code_key" ON "ql-dao-tao"."CouncilMember" USING btree (code);


--
-- Name: CouncilMember_councilId_expertId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "CouncilMember_councilId_expertId_key" ON "ql-dao-tao"."CouncilMember" USING btree ("councilId", "expertId");


--
-- Name: Council_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Council_code_key" ON "ql-dao-tao"."Council" USING btree (code);


--
-- Name: Council_studentThesisRegistrationId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Council_studentThesisRegistrationId_key" ON "ql-dao-tao"."Council" USING btree ("studentThesisRegistrationId");


--
-- Name: Decision_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Decision_code_key" ON "ql-dao-tao"."Decision" USING btree (code);


--
-- Name: DefaultCouncilRolePayAmount_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "DefaultCouncilRolePayAmount_code_key" ON "ql-dao-tao"."DefaultCouncilRolePayAmount" USING btree (code);


--
-- Name: DefaultSupervisorPayAmount_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "DefaultSupervisorPayAmount_code_key" ON "ql-dao-tao"."DefaultSupervisorPayAmount" USING btree (code);


--
-- Name: DefenseRecord_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "DefenseRecord_code_key" ON "ql-dao-tao"."DefenseRecord" USING btree (code);


--
-- Name: DefenseRecord_thesisId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "DefenseRecord_thesisId_key" ON "ql-dao-tao"."DefenseRecord" USING btree ("thesisId");


--
-- Name: DefenseSession_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "DefenseSession_code_key" ON "ql-dao-tao"."DefenseSession" USING btree (code);


--
-- Name: DiplomaType_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "DiplomaType_code_key" ON "ql-dao-tao"."DiplomaType" USING btree (code);


--
-- Name: DiplomaType_name_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "DiplomaType_name_key" ON "ql-dao-tao"."DiplomaType" USING btree (name);


--
-- Name: DiplomaVerificationApplication_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "DiplomaVerificationApplication_code_key" ON "ql-dao-tao"."DiplomaVerificationApplication" USING btree (code);


--
-- Name: DisciplinaryWarningReason_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "DisciplinaryWarningReason_code_key" ON "ql-dao-tao"."DisciplinaryWarningReason" USING btree (code);


--
-- Name: DisciplinaryWarningReason_name_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "DisciplinaryWarningReason_name_key" ON "ql-dao-tao"."DisciplinaryWarningReason" USING btree (name);


--
-- Name: DisciplinaryWarning_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "DisciplinaryWarning_code_key" ON "ql-dao-tao"."DisciplinaryWarning" USING btree (code);


--
-- Name: EquivalencyGroup_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "EquivalencyGroup_code_key" ON "ql-dao-tao"."EquivalencyGroup" USING btree (code);


--
-- Name: ExpertProfile_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ExpertProfile_code_key" ON "ql-dao-tao"."ExpertProfile" USING btree (code);


--
-- Name: ExpertProfile_lecturerId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ExpertProfile_lecturerId_key" ON "ql-dao-tao"."ExpertProfile" USING btree ("lecturerId");


--
-- Name: FixedClass_classMonitorId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "FixedClass_classMonitorId_key" ON "ql-dao-tao"."FixedClass" USING btree ("classMonitorId");


--
-- Name: FixedClass_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "FixedClass_code_key" ON "ql-dao-tao"."FixedClass" USING btree (code);


--
-- Name: FixedClass_curriculumVersionId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "FixedClass_curriculumVersionId_key" ON "ql-dao-tao"."FixedClass" USING btree ("curriculumVersionId");


--
-- Name: FixedClass_name_trainingCourseId_curriculumVersionId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "FixedClass_name_trainingCourseId_curriculumVersionId_key" ON "ql-dao-tao"."FixedClass" USING btree (name, "trainingCourseId", "curriculumVersionId");


--
-- Name: FixedClass_unionLeaderId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "FixedClass_unionLeaderId_key" ON "ql-dao-tao"."FixedClass" USING btree ("unionLeaderId");


--
-- Name: GraduationDecision_applicationId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "GraduationDecision_applicationId_key" ON "ql-dao-tao"."GraduationDecision" USING btree ("applicationId");


--
-- Name: GraduationDecision_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "GraduationDecision_code_key" ON "ql-dao-tao"."GraduationDecision" USING btree (code);


--
-- Name: GraduationDecision_diplomaNumber_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "GraduationDecision_diplomaNumber_key" ON "ql-dao-tao"."GraduationDecision" USING btree ("diplomaNumber");


--
-- Name: GraduationDecision_originalDiplomaNumber_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "GraduationDecision_originalDiplomaNumber_key" ON "ql-dao-tao"."GraduationDecision" USING btree ("originalDiplomaNumber");


--
-- Name: GraduationDecision_studentId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "GraduationDecision_studentId_key" ON "ql-dao-tao"."GraduationDecision" USING btree ("studentId");


--
-- Name: GraduationRankDowngradeCondition_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "GraduationRankDowngradeCondition_code_key" ON "ql-dao-tao"."GraduationRankDowngradeCondition" USING btree (code);


--
-- Name: GraduationRankDowngradeRule_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "GraduationRankDowngradeRule_code_key" ON "ql-dao-tao"."GraduationRankDowngradeRule" USING btree (code);


--
-- Name: GraduationSession_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "GraduationSession_code_key" ON "ql-dao-tao"."GraduationSession" USING btree (code);


--
-- Name: Invitation_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Invitation_code_key" ON "ql-dao-tao"."Invitation" USING btree (code);


--
-- Name: Invitation_councilMemberId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Invitation_councilMemberId_key" ON "ql-dao-tao"."Invitation" USING btree ("councilMemberId");


--
-- Name: LecturerHistory_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "LecturerHistory_code_key" ON "ql-dao-tao"."LecturerHistory" USING btree (code);


--
-- Name: LecturerHistory_userProfileId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "LecturerHistory_userProfileId_key" ON "ql-dao-tao"."LecturerHistory" USING btree ("userProfileId");


--
-- Name: Lecturer_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Lecturer_code_key" ON "ql-dao-tao"."Lecturer" USING btree (code);


--
-- Name: Lecturer_lectureID_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Lecturer_lectureID_key" ON "ql-dao-tao"."Lecturer" USING btree ("lectureID");


--
-- Name: Lecturer_userProfileId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Lecturer_userProfileId_key" ON "ql-dao-tao"."Lecturer" USING btree ("userProfileId");


--
-- Name: LibrarySubmission_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "LibrarySubmission_code_key" ON "ql-dao-tao"."LibrarySubmission" USING btree (code);


--
-- Name: LibrarySubmission_thesisId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "LibrarySubmission_thesisId_key" ON "ql-dao-tao"."LibrarySubmission" USING btree ("thesisId");


--
-- Name: LoadCategory_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "LoadCategory_code_key" ON "ql-dao-tao"."LoadCategory" USING btree (code);


--
-- Name: Milestone_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Milestone_code_key" ON "ql-dao-tao"."Milestone" USING btree (code);


--
-- Name: NoteFolder_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "NoteFolder_code_key" ON "ql-dao-tao"."NoteFolder" USING btree (code);


--
-- Name: NoteReminder_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "NoteReminder_code_key" ON "ql-dao-tao"."NoteReminder" USING btree (code);


--
-- Name: NoteTag_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "NoteTag_code_key" ON "ql-dao-tao"."NoteTag" USING btree (code);


--
-- Name: NoteTag_name_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "NoteTag_name_key" ON "ql-dao-tao"."NoteTag" USING btree (name);


--
-- Name: Note_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Note_code_key" ON "ql-dao-tao"."Note" USING btree (code);


--
-- Name: OutputStandardOnCurriculum_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "OutputStandardOnCurriculum_code_key" ON "ql-dao-tao"."OutputStandardOnCurriculum" USING btree (code);


--
-- Name: OutputStandardOnCurriculum_outputStandardId_curriculumVersi_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "OutputStandardOnCurriculum_outputStandardId_curriculumVersi_key" ON "ql-dao-tao"."OutputStandardOnCurriculum" USING btree ("outputStandardId", "curriculumVersionId");


--
-- Name: OutputStandard_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "OutputStandard_code_key" ON "ql-dao-tao"."OutputStandard" USING btree (code);


--
-- Name: PaymentRecord_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "PaymentRecord_code_key" ON "ql-dao-tao"."PaymentRecord" USING btree (code);


--
-- Name: PaymentRecord_councilMemberId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "PaymentRecord_councilMemberId_key" ON "ql-dao-tao"."PaymentRecord" USING btree ("councilMemberId");


--
-- Name: PlanTraining_trainingObjectTypeId_semesterId_trainingCourse_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "PlanTraining_trainingObjectTypeId_semesterId_trainingCourse_key" ON "ql-dao-tao"."PlanTraining" USING btree ("trainingObjectTypeId", "semesterId", "trainingCourseId");


--
-- Name: PriorityObject_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "PriorityObject_code_key" ON "ql-dao-tao"."PriorityObject" USING btree (code);


--
-- Name: PriorityObject_name_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "PriorityObject_name_key" ON "ql-dao-tao"."PriorityObject" USING btree (name);


--
-- Name: RankingCondition_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "RankingCondition_code_key" ON "ql-dao-tao"."RankingCondition" USING btree (code);


--
-- Name: ResearchProject_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ResearchProject_code_key" ON "ql-dao-tao"."ResearchProject" USING btree (code);


--
-- Name: Room_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Room_code_key" ON "ql-dao-tao"."Room" USING btree (code);


--
-- Name: ScholarshipAward_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ScholarshipAward_code_key" ON "ql-dao-tao"."ScholarshipAward" USING btree (code);


--
-- Name: ScholarshipAward_studentId_scholarshipId_semesterId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ScholarshipAward_studentId_scholarshipId_semesterId_key" ON "ql-dao-tao"."ScholarshipAward" USING btree ("studentId", "scholarshipId", "semesterId");


--
-- Name: ScholarshipCriteria_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ScholarshipCriteria_code_key" ON "ql-dao-tao"."ScholarshipCriteria" USING btree (code);


--
-- Name: Scholarship_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Scholarship_code_key" ON "ql-dao-tao"."Scholarship" USING btree (code);


--
-- Name: Scholarship_trainingCourseId_name_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Scholarship_trainingCourseId_name_key" ON "ql-dao-tao"."Scholarship" USING btree ("trainingCourseId", name);


--
-- Name: SchoolYear_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "SchoolYear_code_key" ON "ql-dao-tao"."SchoolYear" USING btree (code);


--
-- Name: ScoreConvert_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ScoreConvert_code_key" ON "ql-dao-tao"."ScoreConvert" USING btree (code);


--
-- Name: Semester_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Semester_code_key" ON "ql-dao-tao"."Semester" USING btree (code);


--
-- Name: StaffHistory_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StaffHistory_code_key" ON "ql-dao-tao"."StaffHistory" USING btree (code);


--
-- Name: StaffHistory_userProfileId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StaffHistory_userProfileId_key" ON "ql-dao-tao"."StaffHistory" USING btree ("userProfileId");


--
-- Name: Staff_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Staff_code_key" ON "ql-dao-tao"."Staff" USING btree (code);


--
-- Name: Staff_userProfileId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Staff_userProfileId_key" ON "ql-dao-tao"."Staff" USING btree ("userProfileId");


--
-- Name: StudentAcademicDecision_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StudentAcademicDecision_code_key" ON "ql-dao-tao"."StudentAcademicDecision" USING btree (code);


--
-- Name: StudentAcademicDecision_studentId_semesterId_schoolYearId_a_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StudentAcademicDecision_studentId_semesterId_schoolYearId_a_key" ON "ql-dao-tao"."StudentAcademicDecision" USING btree ("studentId", "semesterId", "schoolYearId", "appliedConfigId");


--
-- Name: StudentGraduationApplication_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StudentGraduationApplication_code_key" ON "ql-dao-tao"."StudentGraduationApplication" USING btree (code);


--
-- Name: StudentGraduationApplication_studentId_sessionId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StudentGraduationApplication_studentId_sessionId_key" ON "ql-dao-tao"."StudentGraduationApplication" USING btree ("studentId", "sessionId");


--
-- Name: StudentResearchRegistration_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StudentResearchRegistration_code_key" ON "ql-dao-tao"."StudentResearchRegistration" USING btree (code);


--
-- Name: StudentResearchRegistration_studentId_researchProjectId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StudentResearchRegistration_studentId_researchProjectId_key" ON "ql-dao-tao"."StudentResearchRegistration" USING btree ("studentId", "researchProjectId");


--
-- Name: StudentResearchTopic_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StudentResearchTopic_code_key" ON "ql-dao-tao"."StudentResearchTopic" USING btree (code);


--
-- Name: StudentResearchTopic_studentSubjectScoreId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StudentResearchTopic_studentSubjectScoreId_key" ON "ql-dao-tao"."StudentResearchTopic" USING btree ("studentSubjectScoreId");


--
-- Name: StudentScoreConvert_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StudentScoreConvert_code_key" ON "ql-dao-tao"."StudentScoreConvert" USING btree (code);


--
-- Name: StudentSemesterResult_studentId_semesterId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StudentSemesterResult_studentId_semesterId_key" ON "ql-dao-tao"."StudentSemesterResult" USING btree ("studentId", "semesterId");


--
-- Name: StudentSubjectScoreHistory_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StudentSubjectScoreHistory_code_key" ON "ql-dao-tao"."StudentSubjectScoreHistory" USING btree (code);


--
-- Name: StudentSubjectScore_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StudentSubjectScore_code_key" ON "ql-dao-tao"."StudentSubjectScore" USING btree (code);


--
-- Name: StudentSubjectScore_subjectClassId_studentId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StudentSubjectScore_subjectClassId_studentId_key" ON "ql-dao-tao"."StudentSubjectScore" USING btree ("subjectClassId", "studentId");


--
-- Name: StudentThesisRegistration_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StudentThesisRegistration_code_key" ON "ql-dao-tao"."StudentThesisRegistration" USING btree (code);


--
-- Name: StudentThesisRegistration_studentId_thesisProjectId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StudentThesisRegistration_studentId_thesisProjectId_key" ON "ql-dao-tao"."StudentThesisRegistration" USING btree ("studentId", "thesisProjectId");


--
-- Name: StudentTrainingScore_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StudentTrainingScore_code_key" ON "ql-dao-tao"."StudentTrainingScore" USING btree (code);


--
-- Name: StudentTrainingScore_trainingScoreSessionId_studentId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StudentTrainingScore_trainingScoreSessionId_studentId_key" ON "ql-dao-tao"."StudentTrainingScore" USING btree ("trainingScoreSessionId", "studentId");


--
-- Name: StudentYearResult_studentId_schoolYearId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "StudentYearResult_studentId_schoolYearId_key" ON "ql-dao-tao"."StudentYearResult" USING btree ("studentId", "schoolYearId");


--
-- Name: Student_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Student_code_key" ON "ql-dao-tao"."Student" USING btree (code);


--
-- Name: Student_doctoralCode_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Student_doctoralCode_key" ON "ql-dao-tao"."Student" USING btree ("doctoralCode");


--
-- Name: Student_registerNumber_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Student_registerNumber_key" ON "ql-dao-tao"."Student" USING btree ("registerNumber");


--
-- Name: SubjectClassHistory_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "SubjectClassHistory_code_key" ON "ql-dao-tao"."SubjectClassHistory" USING btree (code);


--
-- Name: SubjectClassTime_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "SubjectClassTime_code_key" ON "ql-dao-tao"."SubjectClassTime" USING btree (code);


--
-- Name: SubjectInGroup_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "SubjectInGroup_code_key" ON "ql-dao-tao"."SubjectInGroup" USING btree (code);


--
-- Name: SubjectInGroup_subjectId_equivalencyGroupId_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "SubjectInGroup_subjectId_equivalencyGroupId_key" ON "ql-dao-tao"."SubjectInGroup" USING btree ("subjectId", "equivalencyGroupId");


--
-- Name: SubjectScoreConvert_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "SubjectScoreConvert_code_key" ON "ql-dao-tao"."SubjectScoreConvert" USING btree (code);


--
-- Name: SubjectVersionCategory_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "SubjectVersionCategory_code_key" ON "ql-dao-tao"."SubjectVersionCategory" USING btree (code);


--
-- Name: SubjectVersionHistory_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "SubjectVersionHistory_code_key" ON "ql-dao-tao"."SubjectVersionHistory" USING btree (code);


--
-- Name: Subject_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Subject_code_key" ON "ql-dao-tao"."Subject" USING btree (code);


--
-- Name: Subject_englishName_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Subject_englishName_key" ON "ql-dao-tao"."Subject" USING btree ("englishName");


--
-- Name: Subject_name_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "Subject_name_key" ON "ql-dao-tao"."Subject" USING btree (name);


--
-- Name: SupervisorPaymentRecord_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "SupervisorPaymentRecord_code_key" ON "ql-dao-tao"."SupervisorPaymentRecord" USING btree (code);


--
-- Name: ThesisProject_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ThesisProject_code_key" ON "ql-dao-tao"."ThesisProject" USING btree (code);


--
-- Name: ThesisSession_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "ThesisSession_code_key" ON "ql-dao-tao"."ThesisSession" USING btree (code);


--
-- Name: TrainingBlockOnCurriculumVersion_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingBlockOnCurriculumVersion_code_key" ON "ql-dao-tao"."TrainingBlockOnCurriculumVersion" USING btree (code);


--
-- Name: TrainingBlockOnCurriculumVersion_trainingBlockId_curriculum_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingBlockOnCurriculumVersion_trainingBlockId_curriculum_key" ON "ql-dao-tao"."TrainingBlockOnCurriculumVersion" USING btree ("trainingBlockId", "curriculumVersionId");


--
-- Name: TrainingBlockSubject_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingBlockSubject_code_key" ON "ql-dao-tao"."TrainingBlockSubject" USING btree (code);


--
-- Name: TrainingBlock_trainingObjectTypeId_name_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingBlock_trainingObjectTypeId_name_key" ON "ql-dao-tao"."TrainingBlock" USING btree ("trainingObjectTypeId", name);


--
-- Name: TrainingCourse_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingCourse_code_key" ON "ql-dao-tao"."TrainingCourse" USING btree (code);


--
-- Name: TrainingFieldOnTrainingObjectType_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingFieldOnTrainingObjectType_code_key" ON "ql-dao-tao"."TrainingFieldOnTrainingObjectType" USING btree (code);


--
-- Name: TrainingFieldOnTrainingObjectType_trainingFieldId_trainingO_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingFieldOnTrainingObjectType_trainingFieldId_trainingO_key" ON "ql-dao-tao"."TrainingFieldOnTrainingObjectType" USING btree ("trainingFieldId", "trainingObjectTypeId");


--
-- Name: TrainingField_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingField_code_key" ON "ql-dao-tao"."TrainingField" USING btree (code);


--
-- Name: TrainingForm_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingForm_code_key" ON "ql-dao-tao"."TrainingForm" USING btree (code);


--
-- Name: TrainingForm_name_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingForm_name_key" ON "ql-dao-tao"."TrainingForm" USING btree (name);


--
-- Name: TrainingLanguage_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingLanguage_code_key" ON "ql-dao-tao"."TrainingLanguage" USING btree (code);


--
-- Name: TrainingLevel_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingLevel_code_key" ON "ql-dao-tao"."TrainingLevel" USING btree (code);


--
-- Name: TrainingLevel_name_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingLevel_name_key" ON "ql-dao-tao"."TrainingLevel" USING btree (name);


--
-- Name: TrainingLocation_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingLocation_code_key" ON "ql-dao-tao"."TrainingLocation" USING btree (code);


--
-- Name: TrainingLocation_name_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingLocation_name_key" ON "ql-dao-tao"."TrainingLocation" USING btree (name);


--
-- Name: TrainingMajorOnTrainingObjectType_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingMajorOnTrainingObjectType_code_key" ON "ql-dao-tao"."TrainingMajorOnTrainingObjectType" USING btree (code);


--
-- Name: TrainingMajorOnTrainingObjectType_trainingMajorId_trainingO_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingMajorOnTrainingObjectType_trainingMajorId_trainingO_key" ON "ql-dao-tao"."TrainingMajorOnTrainingObjectType" USING btree ("trainingMajorId", "trainingObjectTypeId");


--
-- Name: TrainingMajor_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingMajor_code_key" ON "ql-dao-tao"."TrainingMajor" USING btree (code);


--
-- Name: TrainingObjectType_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingObjectType_code_key" ON "ql-dao-tao"."TrainingObjectType" USING btree (code);


--
-- Name: TrainingObjectType_name_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingObjectType_name_key" ON "ql-dao-tao"."TrainingObjectType" USING btree (name);


--
-- Name: TrainingScoreSession_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingScoreSession_code_key" ON "ql-dao-tao"."TrainingScoreSession" USING btree (code);


--
-- Name: TrainingTime_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingTime_code_key" ON "ql-dao-tao"."TrainingTime" USING btree (code);


--
-- Name: TrainingType_code_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingType_code_key" ON "ql-dao-tao"."TrainingType" USING btree (code);


--
-- Name: TrainingType_name_key; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE UNIQUE INDEX "TrainingType_name_key" ON "ql-dao-tao"."TrainingType" USING btree (name);


--
-- Name: _AcademicWarningToAcademicWarningRule_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_AcademicWarningToAcademicWarningRule_B_index" ON "ql-dao-tao"."_AcademicWarningToAcademicWarningRule" USING btree ("B");


--
-- Name: _ApplicationDowngradedToGraduationRankDowngradeConditio_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_ApplicationDowngradedToGraduationRankDowngradeConditio_B_index" ON "ql-dao-tao"."_ApplicationDowngradedToGraduationRankDowngradeCondition" USING btree ("B");


--
-- Name: _AwardToSubject_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_AwardToSubject_B_index" ON "ql-dao-tao"."_AwardToSubject" USING btree ("B");


--
-- Name: _ClassRegisterSessionToTrainingCourse_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_ClassRegisterSessionToTrainingCourse_B_index" ON "ql-dao-tao"."_ClassRegisterSessionToTrainingCourse" USING btree ("B");


--
-- Name: _ClassScheduleToUserProfile_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_ClassScheduleToUserProfile_B_index" ON "ql-dao-tao"."_ClassScheduleToUserProfile" USING btree ("B");


--
-- Name: _CoRequisiteSubject_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_CoRequisiteSubject_B_index" ON "ql-dao-tao"."_CoRequisiteSubject" USING btree ("B");


--
-- Name: _DefenseRooms_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_DefenseRooms_B_index" ON "ql-dao-tao"."_DefenseRooms" USING btree ("B");


--
-- Name: _DisciplinaryWarningToDisciplinaryWarningReason_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_DisciplinaryWarningToDisciplinaryWarningReason_B_index" ON "ql-dao-tao"."_DisciplinaryWarningToDisciplinaryWarningReason" USING btree ("B");


--
-- Name: _ExpertProfileToSubjectClass_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_ExpertProfileToSubjectClass_B_index" ON "ql-dao-tao"."_ExpertProfileToSubjectClass" USING btree ("B");


--
-- Name: _ExpertProfileToTrainingMajor_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_ExpertProfileToTrainingMajor_B_index" ON "ql-dao-tao"."_ExpertProfileToTrainingMajor" USING btree ("B");


--
-- Name: _FixedClassToNotification_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_FixedClassToNotification_B_index" ON "ql-dao-tao"."_FixedClassToNotification" USING btree ("B");


--
-- Name: _FixedClassToSubjectClass_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_FixedClassToSubjectClass_B_index" ON "ql-dao-tao"."_FixedClassToSubjectClass" USING btree ("B");


--
-- Name: _FixedClassToSurveyObjectType_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_FixedClassToSurveyObjectType_B_index" ON "ql-dao-tao"."_FixedClassToSurveyObjectType" USING btree ("B");


--
-- Name: _GraduationSessionToOutputStandard_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_GraduationSessionToOutputStandard_B_index" ON "ql-dao-tao"."_GraduationSessionToOutputStandard" USING btree ("B");


--
-- Name: _NoteToNoteTag_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_NoteToNoteTag_B_index" ON "ql-dao-tao"."_NoteToNoteTag" USING btree ("B");


--
-- Name: _PrerequisiteSubject_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_PrerequisiteSubject_B_index" ON "ql-dao-tao"."_PrerequisiteSubject" USING btree ("B");


--
-- Name: _PriorityObjectToStudent_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_PriorityObjectToStudent_B_index" ON "ql-dao-tao"."_PriorityObjectToStudent" USING btree ("B");


--
-- Name: _SubjectClassToSurveyObjectType_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_SubjectClassToSurveyObjectType_B_index" ON "ql-dao-tao"."_SubjectClassToSurveyObjectType" USING btree ("B");


--
-- Name: _gpaScore_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_gpaScore_B_index" ON "ql-dao-tao"."_gpaScore" USING btree ("B");


--
-- Name: _supplementaryScore_B_index; Type: INDEX; Schema: ql-dao-tao; Owner: admin
--

CREATE INDEX "_supplementaryScore_B_index" ON "ql-dao-tao"."_supplementaryScore" USING btree ("B");


--
-- Name: BoiDuongQuocPhongAnNinh_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "BoiDuongQuocPhongAnNinh_code_key" ON "ql-ho-so"."BoiDuongQuocPhongAnNinh" USING btree (code);


--
-- Name: CapBac_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "CapBac_code_key" ON "ql-ho-so"."CapBac" USING btree (code);


--
-- Name: ChienDau_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "ChienDau_code_key" ON "ql-ho-so"."ChienDau" USING btree (code);


--
-- Name: ChucVuChinhQuyen_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "ChucVuChinhQuyen_code_key" ON "ql-ho-so"."ChucVuChinhQuyen" USING btree (code);


--
-- Name: ChucVuDang_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "ChucVuDang_code_key" ON "ql-ho-so"."ChucVuDang" USING btree (code);


--
-- Name: DM_BacLuong_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_BacLuong_code_key" ON "ql-ho-so"."DM_BacLuong" USING btree (code);


--
-- Name: DM_BacLuong_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_BacLuong_name_key" ON "ql-ho-so"."DM_BacLuong" USING btree (name);


--
-- Name: DM_ChiHuyQuanLy_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_ChiHuyQuanLy_code_key" ON "ql-ho-so"."DM_ChiHuyQuanLy" USING btree (code);


--
-- Name: DM_ChiHuyQuanLy_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_ChiHuyQuanLy_name_key" ON "ql-ho-so"."DM_ChiHuyQuanLy" USING btree (name);


--
-- Name: DM_ChucDanhCMNVGiangVien_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_ChucDanhCMNVGiangVien_code_key" ON "ql-ho-so"."DM_ChucDanhCMNVGiangVien" USING btree (code);


--
-- Name: DM_ChucDanhCMNVGiangVien_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_ChucDanhCMNVGiangVien_name_key" ON "ql-ho-so"."DM_ChucDanhCMNVGiangVien" USING btree (name);


--
-- Name: DM_ChucDanhCMNVKySu_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_ChucDanhCMNVKySu_code_key" ON "ql-ho-so"."DM_ChucDanhCMNVKySu" USING btree (code);


--
-- Name: DM_ChucDanhCMNVKySu_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_ChucDanhCMNVKySu_name_key" ON "ql-ho-so"."DM_ChucDanhCMNVKySu" USING btree (name);


--
-- Name: DM_ChucDanhCMNVNghienCuuVien_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_ChucDanhCMNVNghienCuuVien_code_key" ON "ql-ho-so"."DM_ChucDanhCMNVNghienCuuVien" USING btree (code);


--
-- Name: DM_ChucDanhCMNVNghienCuuVien_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_ChucDanhCMNVNghienCuuVien_name_key" ON "ql-ho-so"."DM_ChucDanhCMNVNghienCuuVien" USING btree (name);


--
-- Name: DM_ChuyenMonKyThuat_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_ChuyenMonKyThuat_code_key" ON "ql-ho-so"."DM_ChuyenMonKyThuat" USING btree (code);


--
-- Name: DM_ChuyenMonKyThuat_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_ChuyenMonKyThuat_name_key" ON "ql-ho-so"."DM_ChuyenMonKyThuat" USING btree (name);


--
-- Name: DM_ChuyenNganhDaoTaoBacDH_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_ChuyenNganhDaoTaoBacDH_code_key" ON "ql-ho-so"."DM_ChuyenNganhDaoTaoBacDH" USING btree (code);


--
-- Name: DM_ChuyenNganhDaoTaoBacDH_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_ChuyenNganhDaoTaoBacDH_name_key" ON "ql-ho-so"."DM_ChuyenNganhDaoTaoBacDH" USING btree (name);


--
-- Name: DM_HinhThucKhenThuongChinhQuyen_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_HinhThucKhenThuongChinhQuyen_code_key" ON "ql-ho-so"."DM_HinhThucKhenThuongChinhQuyen" USING btree (code);


--
-- Name: DM_HinhThucKhenThuongChinhQuyen_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_HinhThucKhenThuongChinhQuyen_name_key" ON "ql-ho-so"."DM_HinhThucKhenThuongChinhQuyen" USING btree (name);


--
-- Name: DM_HinhThucKhenThuongDang_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_HinhThucKhenThuongDang_code_key" ON "ql-ho-so"."DM_HinhThucKhenThuongDang" USING btree (code);


--
-- Name: DM_HinhThucKhenThuongDang_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_HinhThucKhenThuongDang_name_key" ON "ql-ho-so"."DM_HinhThucKhenThuongDang" USING btree (name);


--
-- Name: DM_LoaiHinhCongTac_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_LoaiHinhCongTac_code_key" ON "ql-ho-so"."DM_LoaiHinhCongTac" USING btree (code);


--
-- Name: DM_LoaiHinhCongTac_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_LoaiHinhCongTac_name_key" ON "ql-ho-so"."DM_LoaiHinhCongTac" USING btree (name);


--
-- Name: DM_LoaiHinhDiHocTap_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_LoaiHinhDiHocTap_code_key" ON "ql-ho-so"."DM_LoaiHinhDiHocTap" USING btree (code);


--
-- Name: DM_LoaiHinhDiHocTap_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_LoaiHinhDiHocTap_name_key" ON "ql-ho-so"."DM_LoaiHinhDiHocTap" USING btree (name);


--
-- Name: DM_LoaiThuongTat_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_LoaiThuongTat_code_key" ON "ql-ho-so"."DM_LoaiThuongTat" USING btree (code);


--
-- Name: DM_LoaiThuongTat_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_LoaiThuongTat_name_key" ON "ql-ho-so"."DM_LoaiThuongTat" USING btree (name);


--
-- Name: DM_LoaiTinhTrangCongTac_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_LoaiTinhTrangCongTac_code_key" ON "ql-ho-so"."DM_LoaiTinhTrangCongTac" USING btree (code);


--
-- Name: DM_LoaiTinhTrangCongTac_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_LoaiTinhTrangCongTac_name_key" ON "ql-ho-so"."DM_LoaiTinhTrangCongTac" USING btree (name);


--
-- Name: DM_Ngach_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_Ngach_code_key" ON "ql-ho-so"."DM_Ngach" USING btree (code);


--
-- Name: DM_Ngach_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_Ngach_name_key" ON "ql-ho-so"."DM_Ngach" USING btree (name);


--
-- Name: DM_NganhHoc_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_NganhHoc_code_key" ON "ql-ho-so"."DM_NganhHoc" USING btree (code);


--
-- Name: DM_NganhHoc_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_NganhHoc_name_key" ON "ql-ho-so"."DM_NganhHoc" USING btree (name);


--
-- Name: DM_NhomMau_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_NhomMau_code_key" ON "ql-ho-so"."DM_NhomMau" USING btree (code);


--
-- Name: DM_NhomMau_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_NhomMau_name_key" ON "ql-ho-so"."DM_NhomMau" USING btree (name);


--
-- Name: DM_NuocCuDiHocTap_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_NuocCuDiHocTap_code_key" ON "ql-ho-so"."DM_NuocCuDiHocTap" USING btree (code);


--
-- Name: DM_NuocCuDiHocTap_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_NuocCuDiHocTap_name_key" ON "ql-ho-so"."DM_NuocCuDiHocTap" USING btree (name);


--
-- Name: DM_QuanHeThanNhan_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_QuanHeThanNhan_code_key" ON "ql-ho-so"."DM_QuanHeThanNhan" USING btree (code);


--
-- Name: DM_QuanHeThanNhan_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_QuanHeThanNhan_name_key" ON "ql-ho-so"."DM_QuanHeThanNhan" USING btree (name);


--
-- Name: DM_SucKhoe_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_SucKhoe_code_key" ON "ql-ho-so"."DM_SucKhoe" USING btree (code);


--
-- Name: DM_SucKhoe_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_SucKhoe_name_key" ON "ql-ho-so"."DM_SucKhoe" USING btree (name);


--
-- Name: DM_TinhTrangCongTac_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_TinhTrangCongTac_code_key" ON "ql-ho-so"."DM_TinhTrangCongTac" USING btree (code);


--
-- Name: DM_TinhTrangCongTac_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_TinhTrangCongTac_name_key" ON "ql-ho-so"."DM_TinhTrangCongTac" USING btree (name);


--
-- Name: DM_TinhTrangDiHocTap_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_TinhTrangDiHocTap_code_key" ON "ql-ho-so"."DM_TinhTrangDiHocTap" USING btree (code);


--
-- Name: DM_TinhTrangDiHocTap_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_TinhTrangDiHocTap_name_key" ON "ql-ho-so"."DM_TinhTrangDiHocTap" USING btree (name);


--
-- Name: DM_TinhTrangHonNhan_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_TinhTrangHonNhan_code_key" ON "ql-ho-so"."DM_TinhTrangHonNhan" USING btree (code);


--
-- Name: DM_TinhTrangHonNhan_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_TinhTrangHonNhan_name_key" ON "ql-ho-so"."DM_TinhTrangHonNhan" USING btree (name);


--
-- Name: DM_ToChucXaHoi_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_ToChucXaHoi_code_key" ON "ql-ho-so"."DM_ToChucXaHoi" USING btree (code);


--
-- Name: DM_ToChucXaHoi_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_ToChucXaHoi_name_key" ON "ql-ho-so"."DM_ToChucXaHoi" USING btree (name);


--
-- Name: DM_TrangThaiLamViec_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_TrangThaiLamViec_code_key" ON "ql-ho-so"."DM_TrangThaiLamViec" USING btree (code);


--
-- Name: DM_TrangThaiLamViec_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_TrangThaiLamViec_name_key" ON "ql-ho-so"."DM_TrangThaiLamViec" USING btree (name);


--
-- Name: DM_TrinhDoHocVan_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_TrinhDoHocVan_code_key" ON "ql-ho-so"."DM_TrinhDoHocVan" USING btree (code);


--
-- Name: DM_TrinhDoHocVan_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_TrinhDoHocVan_name_key" ON "ql-ho-so"."DM_TrinhDoHocVan" USING btree (name);


--
-- Name: DM_TrinhDoLyLuanChinhTri_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_TrinhDoLyLuanChinhTri_code_key" ON "ql-ho-so"."DM_TrinhDoLyLuanChinhTri" USING btree (code);


--
-- Name: DM_TrinhDoLyLuanChinhTri_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_TrinhDoLyLuanChinhTri_name_key" ON "ql-ho-so"."DM_TrinhDoLyLuanChinhTri" USING btree (name);


--
-- Name: DM_TrinhDoQuanLyNhaNuoc_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_TrinhDoQuanLyNhaNuoc_code_key" ON "ql-ho-so"."DM_TrinhDoQuanLyNhaNuoc" USING btree (code);


--
-- Name: DM_TrinhDoQuanLyNhaNuoc_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_TrinhDoQuanLyNhaNuoc_name_key" ON "ql-ho-so"."DM_TrinhDoQuanLyNhaNuoc" USING btree (name);


--
-- Name: DM_TruongDaoTaoBacDH_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_TruongDaoTaoBacDH_code_key" ON "ql-ho-so"."DM_TruongDaoTaoBacDH" USING btree (code);


--
-- Name: DM_TruongDaoTaoBacDH_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_TruongDaoTaoBacDH_name_key" ON "ql-ho-so"."DM_TruongDaoTaoBacDH" USING btree (name);


--
-- Name: DM_XepLoaiDanhGiaCanBo_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_XepLoaiDanhGiaCanBo_code_key" ON "ql-ho-so"."DM_XepLoaiDanhGiaCanBo" USING btree (code);


--
-- Name: DM_XepLoaiDanhGiaCanBo_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_XepLoaiDanhGiaCanBo_name_key" ON "ql-ho-so"."DM_XepLoaiDanhGiaCanBo" USING btree (name);


--
-- Name: DM_XepLoaiDanhGiaChatLuongDangVien_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_XepLoaiDanhGiaChatLuongDangVien_code_key" ON "ql-ho-so"."DM_XepLoaiDanhGiaChatLuongDangVien" USING btree (code);


--
-- Name: DM_XepLoaiDanhGiaChatLuongDangVien_name_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DM_XepLoaiDanhGiaChatLuongDangVien_name_key" ON "ql-ho-so"."DM_XepLoaiDanhGiaChatLuongDangVien" USING btree (name);


--
-- Name: DanhHieu_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DanhHieu_code_key" ON "ql-ho-so"."DanhHieu" USING btree (code);


--
-- Name: DoiTuongChinhSach_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "DoiTuongChinhSach_code_key" ON "ql-ho-so"."DoiTuongChinhSach" USING btree (code);


--
-- Name: HocHam_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "HocHam_code_key" ON "ql-ho-so"."HocHam" USING btree (code);


--
-- Name: HocVi_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "HocVi_code_key" ON "ql-ho-so"."HocVi" USING btree (code);


--
-- Name: KeKhaiTaiSan_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "KeKhaiTaiSan_code_key" ON "ql-ho-so"."KeKhaiTaiSan" USING btree (code);


--
-- Name: KhenThuong_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "KhenThuong_code_key" ON "ql-ho-so"."KhenThuong" USING btree (code);


--
-- Name: KyLuat_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "KyLuat_code_key" ON "ql-ho-so"."KyLuat" USING btree (code);


--
-- Name: NgoaiNgu_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "NgoaiNgu_code_key" ON "ql-ho-so"."NgoaiNgu" USING btree (code);


--
-- Name: NuocNgoai_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "NuocNgoai_code_key" ON "ql-ho-so"."NuocNgoai" USING btree (code);


--
-- Name: QuaTrinhCongTac_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "QuaTrinhCongTac_code_key" ON "ql-ho-so"."QuaTrinhCongTac" USING btree (code);


--
-- Name: QuaTrinhCuDiCongTac_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "QuaTrinhCuDiCongTac_code_key" ON "ql-ho-so"."QuaTrinhCuDiCongTac" USING btree (code);


--
-- Name: QuaTrinhCuDiDaoTao_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "QuaTrinhCuDiDaoTao_code_key" ON "ql-ho-so"."QuaTrinhCuDiDaoTao" USING btree (code);


--
-- Name: QuaTrinhHocTap_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "QuaTrinhHocTap_code_key" ON "ql-ho-so"."QuaTrinhHocTap" USING btree (code);


--
-- Name: QuaTrinhLuong_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "QuaTrinhLuong_code_key" ON "ql-ho-so"."QuaTrinhLuong" USING btree (code);


--
-- Name: Relative_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "Relative_code_key" ON "ql-ho-so"."Relative" USING btree (code);


--
-- Name: ThuongTat_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "ThuongTat_code_key" ON "ql-ho-so"."ThuongTat" USING btree (code);


--
-- Name: TiengDanToc_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "TiengDanToc_code_key" ON "ql-ho-so"."TiengDanToc" USING btree (code);


--
-- Name: TinHoc_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "TinHoc_code_key" ON "ql-ho-so"."TinHoc" USING btree (code);


--
-- Name: ToChucXaHoi_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "ToChucXaHoi_code_key" ON "ql-ho-so"."ToChucXaHoi" USING btree (code);


--
-- Name: TrinhDoLyLuanChinhTri_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "TrinhDoLyLuanChinhTri_code_key" ON "ql-ho-so"."TrinhDoLyLuanChinhTri" USING btree (code);


--
-- Name: TrinhDoQuanLyNhaNuoc_code_key; Type: INDEX; Schema: ql-ho-so; Owner: admin
--

CREATE UNIQUE INDEX "TrinhDoQuanLyNhaNuoc_code_key" ON "ql-ho-so"."TrinhDoQuanLyNhaNuoc" USING btree (code);


--
-- Name: BlockedIp_code_key; Type: INDEX; Schema: ql-nguoi-dung; Owner: admin
--

CREATE UNIQUE INDEX "BlockedIp_code_key" ON "ql-nguoi-dung"."BlockedIp" USING btree (code);


--
-- Name: BlockedIp_ipAddress_key; Type: INDEX; Schema: ql-nguoi-dung; Owner: admin
--

CREATE UNIQUE INDEX "BlockedIp_ipAddress_key" ON "ql-nguoi-dung"."BlockedIp" USING btree ("ipAddress");


--
-- Name: Feedback_code_key; Type: INDEX; Schema: ql-nguoi-dung; Owner: admin
--

CREATE UNIQUE INDEX "Feedback_code_key" ON "ql-nguoi-dung"."Feedback" USING btree (code);


--
-- Name: Group_code_key; Type: INDEX; Schema: ql-nguoi-dung; Owner: admin
--

CREATE UNIQUE INDEX "Group_code_key" ON "ql-nguoi-dung"."Group" USING btree (code);


--
-- Name: Permission_code_key; Type: INDEX; Schema: ql-nguoi-dung; Owner: admin
--

CREATE UNIQUE INDEX "Permission_code_key" ON "ql-nguoi-dung"."Permission" USING btree (code);


--
-- Name: Permission_name_permissionType_key; Type: INDEX; Schema: ql-nguoi-dung; Owner: admin
--

CREATE UNIQUE INDEX "Permission_name_permissionType_key" ON "ql-nguoi-dung"."Permission" USING btree (name, "permissionType");


--
-- Name: Role_code_key; Type: INDEX; Schema: ql-nguoi-dung; Owner: admin
--

CREATE UNIQUE INDEX "Role_code_key" ON "ql-nguoi-dung"."Role" USING btree (code);


--
-- Name: UserProfile_code_key; Type: INDEX; Schema: ql-nguoi-dung; Owner: admin
--

CREATE UNIQUE INDEX "UserProfile_code_key" ON "ql-nguoi-dung"."UserProfile" USING btree (code);


--
-- Name: UserProfile_idCardNumber_key; Type: INDEX; Schema: ql-nguoi-dung; Owner: admin
--

CREATE UNIQUE INDEX "UserProfile_idCardNumber_key" ON "ql-nguoi-dung"."UserProfile" USING btree ("idCardNumber");


--
-- Name: _GroupToRole_B_index; Type: INDEX; Schema: ql-nguoi-dung; Owner: admin
--

CREATE INDEX "_GroupToRole_B_index" ON "ql-nguoi-dung"."_GroupToRole" USING btree ("B");


--
-- Name: _PermissionToRole_B_index; Type: INDEX; Schema: ql-nguoi-dung; Owner: admin
--

CREATE INDEX "_PermissionToRole_B_index" ON "ql-nguoi-dung"."_PermissionToRole" USING btree ("B");


--
-- Name: ChatBotConfig_code_key; Type: INDEX; Schema: tro-ly-ao; Owner: admin
--

CREATE UNIQUE INDEX "ChatBotConfig_code_key" ON "tro-ly-ao"."ChatBotConfig" USING btree (code);


--
-- Name: ChatBotConfig_name_key; Type: INDEX; Schema: tro-ly-ao; Owner: admin
--

CREATE UNIQUE INDEX "ChatBotConfig_name_key" ON "tro-ly-ao"."ChatBotConfig" USING btree (name);


--
-- Name: CitationMessage_code_key; Type: INDEX; Schema: tro-ly-ao; Owner: admin
--

CREATE UNIQUE INDEX "CitationMessage_code_key" ON "tro-ly-ao"."CitationMessage" USING btree (code);


--
-- Name: Conversation_code_key; Type: INDEX; Schema: tro-ly-ao; Owner: admin
--

CREATE UNIQUE INDEX "Conversation_code_key" ON "tro-ly-ao"."Conversation" USING btree (code);


--
-- Name: DocumentClassification_code_key; Type: INDEX; Schema: tro-ly-ao; Owner: admin
--

CREATE UNIQUE INDEX "DocumentClassification_code_key" ON "tro-ly-ao"."DocumentClassification" USING btree (code);


--
-- Name: DocumentClassification_name_key; Type: INDEX; Schema: tro-ly-ao; Owner: admin
--

CREATE UNIQUE INDEX "DocumentClassification_name_key" ON "tro-ly-ao"."DocumentClassification" USING btree (name);


--
-- Name: DocumentTopic_code_key; Type: INDEX; Schema: tro-ly-ao; Owner: admin
--

CREATE UNIQUE INDEX "DocumentTopic_code_key" ON "tro-ly-ao"."DocumentTopic" USING btree (code);


--
-- Name: DocumentTopic_documentId_topicId_key; Type: INDEX; Schema: tro-ly-ao; Owner: admin
--

CREATE UNIQUE INDEX "DocumentTopic_documentId_topicId_key" ON "tro-ly-ao"."DocumentTopic" USING btree ("documentId", "topicId");


--
-- Name: Document_code_key; Type: INDEX; Schema: tro-ly-ao; Owner: admin
--

CREATE UNIQUE INDEX "Document_code_key" ON "tro-ly-ao"."Document" USING btree (code);


--
-- Name: FAQ_code_key; Type: INDEX; Schema: tro-ly-ao; Owner: admin
--

CREATE UNIQUE INDEX "FAQ_code_key" ON "tro-ly-ao"."FAQ" USING btree (code);


--
-- Name: Message_code_key; Type: INDEX; Schema: tro-ly-ao; Owner: admin
--

CREATE UNIQUE INDEX "Message_code_key" ON "tro-ly-ao"."Message" USING btree (code);


--
-- Name: Prompt_code_key; Type: INDEX; Schema: tro-ly-ao; Owner: admin
--

CREATE UNIQUE INDEX "Prompt_code_key" ON "tro-ly-ao"."Prompt" USING btree (code);


--
-- Name: Topic_code_key; Type: INDEX; Schema: tro-ly-ao; Owner: admin
--

CREATE UNIQUE INDEX "Topic_code_key" ON "tro-ly-ao"."Topic" USING btree (code);


--
-- Name: UserSession_code_key; Type: INDEX; Schema: tro-ly-ao; Owner: admin
--

CREATE UNIQUE INDEX "UserSession_code_key" ON "tro-ly-ao"."UserSession" USING btree (code);


--
-- Name: ChangeLog ChangeLog_userProfileId_fkey; Type: FK CONSTRAINT; Schema: he-thong; Owner: admin
--

ALTER TABLE ONLY "he-thong"."ChangeLog"
    ADD CONSTRAINT "ChangeLog_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AnalysisCriterion AnalysisCriterion_criterionPeriodId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."AnalysisCriterion"
    ADD CONSTRAINT "AnalysisCriterion_criterionPeriodId_fkey" FOREIGN KEY ("criterionPeriodId") REFERENCES "khao-thi"."CriterionPeriod"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AnalysisCriterion AnalysisCriterion_lecturerId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."AnalysisCriterion"
    ADD CONSTRAINT "AnalysisCriterion_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "ql-dao-tao"."Lecturer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AnalysisFormEvidence AnalysisFormEvidence_evidenceId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."AnalysisFormEvidence"
    ADD CONSTRAINT "AnalysisFormEvidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "khao-thi"."Evidence"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AnalysisFormEvidence AnalysisFormEvidence_requirementCriterionId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."AnalysisFormEvidence"
    ADD CONSTRAINT "AnalysisFormEvidence_requirementCriterionId_fkey" FOREIGN KEY ("requirementCriterionId") REFERENCES "khao-thi"."RequirementCriterion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ClusterSurvey ClusterSurvey_surveyTopicId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."ClusterSurvey"
    ADD CONSTRAINT "ClusterSurvey_surveyTopicId_fkey" FOREIGN KEY ("surveyTopicId") REFERENCES "khao-thi"."SurveyTopic"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CriterionCatalog CriterionCatalog_standardId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."CriterionCatalog"
    ADD CONSTRAINT "CriterionCatalog_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "khao-thi"."StandardCatalog"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CriterionPeriod CriterionPeriod_evaluationStandardId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."CriterionPeriod"
    ADD CONSTRAINT "CriterionPeriod_evaluationStandardId_fkey" FOREIGN KEY ("evaluationStandardId") REFERENCES "khao-thi"."StandardPeriod"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EvaluationCouncilMember EvaluationCouncilMember_evaluationCouncilId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvaluationCouncilMember"
    ADD CONSTRAINT "EvaluationCouncilMember_evaluationCouncilId_fkey" FOREIGN KEY ("evaluationCouncilId") REFERENCES "khao-thi"."EvaluationCouncil"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvaluationCouncilMember EvaluationCouncilMember_lecturerId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvaluationCouncilMember"
    ADD CONSTRAINT "EvaluationCouncilMember_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "ql-dao-tao"."Lecturer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EvaluationCouncil EvaluationCouncil_periodId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvaluationCouncil"
    ADD CONSTRAINT "EvaluationCouncil_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "khao-thi"."EvaluationPeriod"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvaluationCriterionComment EvaluationCriterionComment_analysisCriterionId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvaluationCriterionComment"
    ADD CONSTRAINT "EvaluationCriterionComment_analysisCriterionId_fkey" FOREIGN KEY ("analysisCriterionId") REFERENCES "khao-thi"."AnalysisCriterion"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EvaluationCriterionComment EvaluationCriterionComment_evaluationCriterionId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvaluationCriterionComment"
    ADD CONSTRAINT "EvaluationCriterionComment_evaluationCriterionId_fkey" FOREIGN KEY ("evaluationCriterionId") REFERENCES "khao-thi"."EvaluationCriterion"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EvaluationCriterionComment EvaluationCriterionComment_requirementCriterionId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvaluationCriterionComment"
    ADD CONSTRAINT "EvaluationCriterionComment_requirementCriterionId_fkey" FOREIGN KEY ("requirementCriterionId") REFERENCES "khao-thi"."RequirementCriterion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvaluationCriterionComment EvaluationCriterionComment_reviewerId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvaluationCriterionComment"
    ADD CONSTRAINT "EvaluationCriterionComment_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EvaluationCriterion EvaluationCriterion_criterionPeriodId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvaluationCriterion"
    ADD CONSTRAINT "EvaluationCriterion_criterionPeriodId_fkey" FOREIGN KEY ("criterionPeriodId") REFERENCES "khao-thi"."CriterionPeriod"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EvaluationCriterion EvaluationCriterion_lecturerId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvaluationCriterion"
    ADD CONSTRAINT "EvaluationCriterion_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "ql-dao-tao"."Lecturer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EvaluationCriterion EvaluationCriterion_reviewerId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvaluationCriterion"
    ADD CONSTRAINT "EvaluationCriterion_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "khao-thi"."EvaluationCouncilMember"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvaluationPeriod EvaluationPeriod_semesterId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvaluationPeriod"
    ADD CONSTRAINT "EvaluationPeriod_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EvidenceFile EvidenceFile_evidenceId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvidenceFile"
    ADD CONSTRAINT "EvidenceFile_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "khao-thi"."Evidence"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EvidenceFile EvidenceFile_userProfileId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."EvidenceFile"
    ADD CONSTRAINT "EvidenceFile_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Evidence Evidence_categoryId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."Evidence"
    ADD CONSTRAINT "Evidence_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "khao-thi"."EvidenceCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ExamBankQuestion ExamBankQuestion_examBankId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."ExamBankQuestion"
    ADD CONSTRAINT "ExamBankQuestion_examBankId_fkey" FOREIGN KEY ("examBankId") REFERENCES "khao-thi"."ExamBank"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ExamBankQuestion ExamBankQuestion_questionId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."ExamBankQuestion"
    ADD CONSTRAINT "ExamBankQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "khao-thi"."Question"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ExamBank ExamBank_examId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."ExamBank"
    ADD CONSTRAINT "ExamBank_examId_fkey" FOREIGN KEY ("examId") REFERENCES "khao-thi"."Exam"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ExamList ExamList_examRoomId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."ExamList"
    ADD CONSTRAINT "ExamList_examRoomId_fkey" FOREIGN KEY ("examRoomId") REFERENCES "khao-thi"."ExamRoom"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ExamList ExamList_firstSupervisorId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."ExamList"
    ADD CONSTRAINT "ExamList_firstSupervisorId_fkey" FOREIGN KEY ("firstSupervisorId") REFERENCES "ql-dao-tao"."Lecturer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ExamList ExamList_secondSupervisorId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."ExamList"
    ADD CONSTRAINT "ExamList_secondSupervisorId_fkey" FOREIGN KEY ("secondSupervisorId") REFERENCES "ql-dao-tao"."Lecturer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ExamPaper ExamPaper_examListId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."ExamPaper"
    ADD CONSTRAINT "ExamPaper_examListId_fkey" FOREIGN KEY ("examListId") REFERENCES "khao-thi"."ExamList"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ExamPaper ExamPaper_studentSubjectScoreId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."ExamPaper"
    ADD CONSTRAINT "ExamPaper_studentSubjectScoreId_fkey" FOREIGN KEY ("studentSubjectScoreId") REFERENCES "ql-dao-tao"."StudentSubjectScore"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ExamRoom ExamRoom_examId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."ExamRoom"
    ADD CONSTRAINT "ExamRoom_examId_fkey" FOREIGN KEY ("examId") REFERENCES "khao-thi"."Exam"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ExamRoom ExamRoom_roomId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."ExamRoom"
    ADD CONSTRAINT "ExamRoom_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ql-dao-tao"."Room"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Exam Exam_questionBankId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."Exam"
    ADD CONSTRAINT "Exam_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "khao-thi"."QuestionBank"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Exam Exam_semesterId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."Exam"
    ADD CONSTRAINT "Exam_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Exam Exam_subjectVersionId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."Exam"
    ADD CONSTRAINT "Exam_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FillInBlankSlot FillInBlankSlot_questionId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."FillInBlankSlot"
    ADD CONSTRAINT "FillInBlankSlot_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "khao-thi"."Question"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: KnowledgeBlock KnowledgeBlock_subjectVersionId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."KnowledgeBlock"
    ADD CONSTRAINT "KnowledgeBlock_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MultipleChoiceOption MultipleChoiceOption_questionId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."MultipleChoiceOption"
    ADD CONSTRAINT "MultipleChoiceOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "khao-thi"."Question"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderingItem OrderingItem_questionId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."OrderingItem"
    ADD CONSTRAINT "OrderingItem_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "khao-thi"."Question"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuestionBank QuestionBank_subjectVersionId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."QuestionBank"
    ADD CONSTRAINT "QuestionBank_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Question Question_difficultyId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."Question"
    ADD CONSTRAINT "Question_difficultyId_fkey" FOREIGN KEY ("difficultyId") REFERENCES "khao-thi"."Difficulty"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Question Question_knowledgeBlockId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."Question"
    ADD CONSTRAINT "Question_knowledgeBlockId_fkey" FOREIGN KEY ("knowledgeBlockId") REFERENCES "khao-thi"."KnowledgeBlock"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Question Question_questionBankId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."Question"
    ADD CONSTRAINT "Question_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "khao-thi"."QuestionBank"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RequirementCriterionCatalog RequirementCriterionCatalog_criterionCatalogId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."RequirementCriterionCatalog"
    ADD CONSTRAINT "RequirementCriterionCatalog_criterionCatalogId_fkey" FOREIGN KEY ("criterionCatalogId") REFERENCES "khao-thi"."CriterionCatalog"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RequirementCriterion RequirementCriterion_analysisCriterionId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."RequirementCriterion"
    ADD CONSTRAINT "RequirementCriterion_analysisCriterionId_fkey" FOREIGN KEY ("analysisCriterionId") REFERENCES "khao-thi"."AnalysisCriterion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StandardPeriod StandardPeriod_periodId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."StandardPeriod"
    ADD CONSTRAINT "StandardPeriod_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "khao-thi"."EvaluationPeriod"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SurveyChoice SurveyChoice_clusterSurveyId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."SurveyChoice"
    ADD CONSTRAINT "SurveyChoice_clusterSurveyId_fkey" FOREIGN KEY ("clusterSurveyId") REFERENCES "khao-thi"."ClusterSurvey"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SurveyQuestion SurveyQuestion_surveyQuestionGroupId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."SurveyQuestion"
    ADD CONSTRAINT "SurveyQuestion_surveyQuestionGroupId_fkey" FOREIGN KEY ("surveyQuestionGroupId") REFERENCES "khao-thi"."SurveyQuestionGroup"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SurveyResponse SurveyResponse_surveyChoiceId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."SurveyResponse"
    ADD CONSTRAINT "SurveyResponse_surveyChoiceId_fkey" FOREIGN KEY ("surveyChoiceId") REFERENCES "khao-thi"."SurveyChoice"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SurveyResponse SurveyResponse_surveyQuestionId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."SurveyResponse"
    ADD CONSTRAINT "SurveyResponse_surveyQuestionId_fkey" FOREIGN KEY ("surveyQuestionId") REFERENCES "khao-thi"."SurveyQuestion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SurveyResponse SurveyResponse_surveySessionId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."SurveyResponse"
    ADD CONSTRAINT "SurveyResponse_surveySessionId_fkey" FOREIGN KEY ("surveySessionId") REFERENCES "khao-thi"."SurveySession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SurveySession SurveySession_profileId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."SurveySession"
    ADD CONSTRAINT "SurveySession_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SurveySession SurveySession_studentId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."SurveySession"
    ADD CONSTRAINT "SurveySession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SurveySession SurveySession_surveyId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."SurveySession"
    ADD CONSTRAINT "SurveySession_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "khao-thi"."Survey"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SurveySession SurveySession_surveyObjectTypeId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."SurveySession"
    ADD CONSTRAINT "SurveySession_surveyObjectTypeId_fkey" FOREIGN KEY ("surveyObjectTypeId") REFERENCES "khao-thi"."SurveyObjectType"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Survey Survey_clusterSurveyId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."Survey"
    ADD CONSTRAINT "Survey_clusterSurveyId_fkey" FOREIGN KEY ("clusterSurveyId") REFERENCES "khao-thi"."ClusterSurvey"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Survey Survey_lectureId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."Survey"
    ADD CONSTRAINT "Survey_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "ql-dao-tao"."Lecturer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Survey Survey_semesterId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."Survey"
    ADD CONSTRAINT "Survey_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Survey Survey_subjectClassId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."Survey"
    ADD CONSTRAINT "Survey_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Survey Survey_surveyTopicId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."Survey"
    ADD CONSTRAINT "Survey_surveyTopicId_fkey" FOREIGN KEY ("surveyTopicId") REFERENCES "khao-thi"."SurveyTopic"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TestStructureRule TestStructureRule_examId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."TestStructureRule"
    ADD CONSTRAINT "TestStructureRule_examId_fkey" FOREIGN KEY ("examId") REFERENCES "khao-thi"."Exam"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TestStructureRule TestStructureRule_knowledgeBlockId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."TestStructureRule"
    ADD CONSTRAINT "TestStructureRule_knowledgeBlockId_fkey" FOREIGN KEY ("knowledgeBlockId") REFERENCES "khao-thi"."KnowledgeBlock"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TestStructureRule TestStructureRule_questionBankId_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."TestStructureRule"
    ADD CONSTRAINT "TestStructureRule_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "khao-thi"."QuestionBank"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: _ClusterSurveyToLecturer _ClusterSurveyToLecturer_A_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_ClusterSurveyToLecturer"
    ADD CONSTRAINT "_ClusterSurveyToLecturer_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."ClusterSurvey"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ClusterSurveyToLecturer _ClusterSurveyToLecturer_B_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_ClusterSurveyToLecturer"
    ADD CONSTRAINT "_ClusterSurveyToLecturer_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."Lecturer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ClusterSurveyToSurveyObjectType _ClusterSurveyToSurveyObjectType_A_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_ClusterSurveyToSurveyObjectType"
    ADD CONSTRAINT "_ClusterSurveyToSurveyObjectType_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."ClusterSurvey"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ClusterSurveyToSurveyObjectType _ClusterSurveyToSurveyObjectType_B_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_ClusterSurveyToSurveyObjectType"
    ADD CONSTRAINT "_ClusterSurveyToSurveyObjectType_B_fkey" FOREIGN KEY ("B") REFERENCES "khao-thi"."SurveyObjectType"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ClusterSurveyToSurveyQuestion _ClusterSurveyToSurveyQuestion_A_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_ClusterSurveyToSurveyQuestion"
    ADD CONSTRAINT "_ClusterSurveyToSurveyQuestion_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."ClusterSurvey"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ClusterSurveyToSurveyQuestion _ClusterSurveyToSurveyQuestion_B_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_ClusterSurveyToSurveyQuestion"
    ADD CONSTRAINT "_ClusterSurveyToSurveyQuestion_B_fkey" FOREIGN KEY ("B") REFERENCES "khao-thi"."SurveyQuestion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SurveyObjectTypeToTrainingCourse _SurveyObjectTypeToTrainingCourse_A_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyObjectTypeToTrainingCourse"
    ADD CONSTRAINT "_SurveyObjectTypeToTrainingCourse_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."SurveyObjectType"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SurveyObjectTypeToTrainingCourse _SurveyObjectTypeToTrainingCourse_B_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyObjectTypeToTrainingCourse"
    ADD CONSTRAINT "_SurveyObjectTypeToTrainingCourse_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."TrainingCourse"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SurveyObjectTypeToTrainingField _SurveyObjectTypeToTrainingField_A_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyObjectTypeToTrainingField"
    ADD CONSTRAINT "_SurveyObjectTypeToTrainingField_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."SurveyObjectType"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SurveyObjectTypeToTrainingField _SurveyObjectTypeToTrainingField_B_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyObjectTypeToTrainingField"
    ADD CONSTRAINT "_SurveyObjectTypeToTrainingField_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."TrainingField"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SurveyObjectTypeToTrainingMajor _SurveyObjectTypeToTrainingMajor_A_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyObjectTypeToTrainingMajor"
    ADD CONSTRAINT "_SurveyObjectTypeToTrainingMajor_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."SurveyObjectType"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SurveyObjectTypeToTrainingMajor _SurveyObjectTypeToTrainingMajor_B_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyObjectTypeToTrainingMajor"
    ADD CONSTRAINT "_SurveyObjectTypeToTrainingMajor_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."TrainingMajor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SurveyQuestionGroupToSurveyTopic _SurveyQuestionGroupToSurveyTopic_A_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyQuestionGroupToSurveyTopic"
    ADD CONSTRAINT "_SurveyQuestionGroupToSurveyTopic_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."SurveyQuestionGroup"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SurveyQuestionGroupToSurveyTopic _SurveyQuestionGroupToSurveyTopic_B_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyQuestionGroupToSurveyTopic"
    ADD CONSTRAINT "_SurveyQuestionGroupToSurveyTopic_B_fkey" FOREIGN KEY ("B") REFERENCES "khao-thi"."SurveyTopic"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SurveyToSurveyChoice _SurveyToSurveyChoice_A_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyToSurveyChoice"
    ADD CONSTRAINT "_SurveyToSurveyChoice_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."Survey"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SurveyToSurveyChoice _SurveyToSurveyChoice_B_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyToSurveyChoice"
    ADD CONSTRAINT "_SurveyToSurveyChoice_B_fkey" FOREIGN KEY ("B") REFERENCES "khao-thi"."SurveyChoice"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SurveyToSurveyObjectType _SurveyToSurveyObjectType_A_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyToSurveyObjectType"
    ADD CONSTRAINT "_SurveyToSurveyObjectType_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."Survey"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SurveyToSurveyObjectType _SurveyToSurveyObjectType_B_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyToSurveyObjectType"
    ADD CONSTRAINT "_SurveyToSurveyObjectType_B_fkey" FOREIGN KEY ("B") REFERENCES "khao-thi"."SurveyObjectType"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SurveyToSurveyQuestion _SurveyToSurveyQuestion_A_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyToSurveyQuestion"
    ADD CONSTRAINT "_SurveyToSurveyQuestion_A_fkey" FOREIGN KEY ("A") REFERENCES "khao-thi"."Survey"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SurveyToSurveyQuestion _SurveyToSurveyQuestion_B_fkey; Type: FK CONSTRAINT; Schema: khao-thi; Owner: admin
--

ALTER TABLE ONLY "khao-thi"."_SurveyToSurveyQuestion"
    ADD CONSTRAINT "_SurveyToSurveyQuestion_B_fkey" FOREIGN KEY ("B") REFERENCES "khao-thi"."SurveyQuestion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DM_NhanVien DM_NhanVien_groupId_fkey; Type: FK CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."DM_NhanVien"
    ADD CONSTRAINT "DM_NhanVien_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ql-nguoi-dung"."Group"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: _DM_DonViToSurveyObjectType _DM_DonViToSurveyObjectType_A_fkey; Type: FK CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."_DM_DonViToSurveyObjectType"
    ADD CONSTRAINT "_DM_DonViToSurveyObjectType_A_fkey" FOREIGN KEY ("A") REFERENCES mta."DM_DonVi"("Id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _DM_DonViToSurveyObjectType _DM_DonViToSurveyObjectType_B_fkey; Type: FK CONSTRAINT; Schema: mta; Owner: admin
--

ALTER TABLE ONLY mta."_DM_DonViToSurveyObjectType"
    ADD CONSTRAINT "_DM_DonViToSurveyObjectType_B_fkey" FOREIGN KEY ("B") REFERENCES "khao-thi"."SurveyObjectType"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: client_session_auth_status auth_status_constraint; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_session_auth_status
    ADD CONSTRAINT auth_status_constraint FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: identity_provider fk2b4ebc52ae5c3b34; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.identity_provider
    ADD CONSTRAINT fk2b4ebc52ae5c3b34 FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: client_attributes fk3c47c64beacca966; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_attributes
    ADD CONSTRAINT fk3c47c64beacca966 FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: federated_identity fk404288b92ef007a6; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.federated_identity
    ADD CONSTRAINT fk404288b92ef007a6 FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: client_node_registrations fk4129723ba992f594; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_node_registrations
    ADD CONSTRAINT fk4129723ba992f594 FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: client_session_note fk5edfb00ff51c2736; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_session_note
    ADD CONSTRAINT fk5edfb00ff51c2736 FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: user_session_note fk5edfb00ff51d3472; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_session_note
    ADD CONSTRAINT fk5edfb00ff51d3472 FOREIGN KEY (user_session) REFERENCES public.user_session(id);


--
-- Name: client_session_role fk_11b7sgqw18i532811v7o2dv76; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_session_role
    ADD CONSTRAINT fk_11b7sgqw18i532811v7o2dv76 FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: redirect_uris fk_1burs8pb4ouj97h5wuppahv9f; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.redirect_uris
    ADD CONSTRAINT fk_1burs8pb4ouj97h5wuppahv9f FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: user_federation_provider fk_1fj32f6ptolw2qy60cd8n01e8; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_federation_provider
    ADD CONSTRAINT fk_1fj32f6ptolw2qy60cd8n01e8 FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: client_session_prot_mapper fk_33a8sgqw18i532811v7o2dk89; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_session_prot_mapper
    ADD CONSTRAINT fk_33a8sgqw18i532811v7o2dk89 FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: realm_required_credential fk_5hg65lybevavkqfki3kponh9v; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.realm_required_credential
    ADD CONSTRAINT fk_5hg65lybevavkqfki3kponh9v FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: resource_attribute fk_5hrm2vlf9ql5fu022kqepovbr; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_attribute
    ADD CONSTRAINT fk_5hrm2vlf9ql5fu022kqepovbr FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: user_attribute fk_5hrm2vlf9ql5fu043kqepovbr; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_attribute
    ADD CONSTRAINT fk_5hrm2vlf9ql5fu043kqepovbr FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: user_required_action fk_6qj3w1jw9cvafhe19bwsiuvmd; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_required_action
    ADD CONSTRAINT fk_6qj3w1jw9cvafhe19bwsiuvmd FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: keycloak_role fk_6vyqfe4cn4wlq8r6kt5vdsj5c; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.keycloak_role
    ADD CONSTRAINT fk_6vyqfe4cn4wlq8r6kt5vdsj5c FOREIGN KEY (realm) REFERENCES public.realm(id);


--
-- Name: realm_smtp_config fk_70ej8xdxgxd0b9hh6180irr0o; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.realm_smtp_config
    ADD CONSTRAINT fk_70ej8xdxgxd0b9hh6180irr0o FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_attribute fk_8shxd6l3e9atqukacxgpffptw; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.realm_attribute
    ADD CONSTRAINT fk_8shxd6l3e9atqukacxgpffptw FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: composite_role fk_a63wvekftu8jo1pnj81e7mce2; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.composite_role
    ADD CONSTRAINT fk_a63wvekftu8jo1pnj81e7mce2 FOREIGN KEY (composite) REFERENCES public.keycloak_role(id);


--
-- Name: authentication_execution fk_auth_exec_flow; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.authentication_execution
    ADD CONSTRAINT fk_auth_exec_flow FOREIGN KEY (flow_id) REFERENCES public.authentication_flow(id);


--
-- Name: authentication_execution fk_auth_exec_realm; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.authentication_execution
    ADD CONSTRAINT fk_auth_exec_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: authentication_flow fk_auth_flow_realm; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.authentication_flow
    ADD CONSTRAINT fk_auth_flow_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: authenticator_config fk_auth_realm; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.authenticator_config
    ADD CONSTRAINT fk_auth_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: client_session fk_b4ao2vcvat6ukau74wbwtfqo1; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_session
    ADD CONSTRAINT fk_b4ao2vcvat6ukau74wbwtfqo1 FOREIGN KEY (session_id) REFERENCES public.user_session(id);


--
-- Name: user_role_mapping fk_c4fqv34p1mbylloxang7b1q3l; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_role_mapping
    ADD CONSTRAINT fk_c4fqv34p1mbylloxang7b1q3l FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: client_scope_attributes fk_cl_scope_attr_scope; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_scope_attributes
    ADD CONSTRAINT fk_cl_scope_attr_scope FOREIGN KEY (scope_id) REFERENCES public.client_scope(id);


--
-- Name: client_scope_role_mapping fk_cl_scope_rm_scope; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_scope_role_mapping
    ADD CONSTRAINT fk_cl_scope_rm_scope FOREIGN KEY (scope_id) REFERENCES public.client_scope(id);


--
-- Name: client_user_session_note fk_cl_usr_ses_note; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_user_session_note
    ADD CONSTRAINT fk_cl_usr_ses_note FOREIGN KEY (client_session) REFERENCES public.client_session(id);


--
-- Name: protocol_mapper fk_cli_scope_mapper; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.protocol_mapper
    ADD CONSTRAINT fk_cli_scope_mapper FOREIGN KEY (client_scope_id) REFERENCES public.client_scope(id);


--
-- Name: client_initial_access fk_client_init_acc_realm; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.client_initial_access
    ADD CONSTRAINT fk_client_init_acc_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: component_config fk_component_config; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.component_config
    ADD CONSTRAINT fk_component_config FOREIGN KEY (component_id) REFERENCES public.component(id);


--
-- Name: component fk_component_realm; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.component
    ADD CONSTRAINT fk_component_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_default_groups fk_def_groups_realm; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.realm_default_groups
    ADD CONSTRAINT fk_def_groups_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: user_federation_mapper_config fk_fedmapper_cfg; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_federation_mapper_config
    ADD CONSTRAINT fk_fedmapper_cfg FOREIGN KEY (user_federation_mapper_id) REFERENCES public.user_federation_mapper(id);


--
-- Name: user_federation_mapper fk_fedmapperpm_fedprv; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_federation_mapper
    ADD CONSTRAINT fk_fedmapperpm_fedprv FOREIGN KEY (federation_provider_id) REFERENCES public.user_federation_provider(id);


--
-- Name: user_federation_mapper fk_fedmapperpm_realm; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_federation_mapper
    ADD CONSTRAINT fk_fedmapperpm_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: associated_policy fk_frsr5s213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.associated_policy
    ADD CONSTRAINT fk_frsr5s213xcx4wnkog82ssrfy FOREIGN KEY (associated_policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: scope_policy fk_frsrasp13xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.scope_policy
    ADD CONSTRAINT fk_frsrasp13xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog82sspmt; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog82sspmt FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: resource_server_resource fk_frsrho213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_server_resource
    ADD CONSTRAINT fk_frsrho213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog83sspmt; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog83sspmt FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: resource_server_perm_ticket fk_frsrho213xcx4wnkog84sspmt; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrho213xcx4wnkog84sspmt FOREIGN KEY (scope_id) REFERENCES public.resource_server_scope(id);


--
-- Name: associated_policy fk_frsrpas14xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.associated_policy
    ADD CONSTRAINT fk_frsrpas14xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: scope_policy fk_frsrpass3xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.scope_policy
    ADD CONSTRAINT fk_frsrpass3xcx4wnkog82ssrfy FOREIGN KEY (scope_id) REFERENCES public.resource_server_scope(id);


--
-- Name: resource_server_perm_ticket fk_frsrpo2128cx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_server_perm_ticket
    ADD CONSTRAINT fk_frsrpo2128cx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: resource_server_policy fk_frsrpo213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_server_policy
    ADD CONSTRAINT fk_frsrpo213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: resource_scope fk_frsrpos13xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_scope
    ADD CONSTRAINT fk_frsrpos13xcx4wnkog82ssrfy FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: resource_policy fk_frsrpos53xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_policy
    ADD CONSTRAINT fk_frsrpos53xcx4wnkog82ssrfy FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: resource_policy fk_frsrpp213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_policy
    ADD CONSTRAINT fk_frsrpp213xcx4wnkog82ssrfy FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: resource_scope fk_frsrps213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_scope
    ADD CONSTRAINT fk_frsrps213xcx4wnkog82ssrfy FOREIGN KEY (scope_id) REFERENCES public.resource_server_scope(id);


--
-- Name: resource_server_scope fk_frsrso213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_server_scope
    ADD CONSTRAINT fk_frsrso213xcx4wnkog82ssrfy FOREIGN KEY (resource_server_id) REFERENCES public.resource_server(id);


--
-- Name: composite_role fk_gr7thllb9lu8q4vqa4524jjy8; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.composite_role
    ADD CONSTRAINT fk_gr7thllb9lu8q4vqa4524jjy8 FOREIGN KEY (child_role) REFERENCES public.keycloak_role(id);


--
-- Name: user_consent_client_scope fk_grntcsnt_clsc_usc; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_consent_client_scope
    ADD CONSTRAINT fk_grntcsnt_clsc_usc FOREIGN KEY (user_consent_id) REFERENCES public.user_consent(id);


--
-- Name: user_consent fk_grntcsnt_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_consent
    ADD CONSTRAINT fk_grntcsnt_user FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: group_attribute fk_group_attribute_group; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.group_attribute
    ADD CONSTRAINT fk_group_attribute_group FOREIGN KEY (group_id) REFERENCES public.keycloak_group(id);


--
-- Name: group_role_mapping fk_group_role_group; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.group_role_mapping
    ADD CONSTRAINT fk_group_role_group FOREIGN KEY (group_id) REFERENCES public.keycloak_group(id);


--
-- Name: realm_enabled_event_types fk_h846o4h0w8epx5nwedrf5y69j; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.realm_enabled_event_types
    ADD CONSTRAINT fk_h846o4h0w8epx5nwedrf5y69j FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: realm_events_listeners fk_h846o4h0w8epx5nxev9f5y69j; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.realm_events_listeners
    ADD CONSTRAINT fk_h846o4h0w8epx5nxev9f5y69j FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: identity_provider_mapper fk_idpm_realm; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.identity_provider_mapper
    ADD CONSTRAINT fk_idpm_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: idp_mapper_config fk_idpmconfig; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.idp_mapper_config
    ADD CONSTRAINT fk_idpmconfig FOREIGN KEY (idp_mapper_id) REFERENCES public.identity_provider_mapper(id);


--
-- Name: web_origins fk_lojpho213xcx4wnkog82ssrfy; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.web_origins
    ADD CONSTRAINT fk_lojpho213xcx4wnkog82ssrfy FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: scope_mapping fk_ouse064plmlr732lxjcn1q5f1; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.scope_mapping
    ADD CONSTRAINT fk_ouse064plmlr732lxjcn1q5f1 FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: protocol_mapper fk_pcm_realm; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.protocol_mapper
    ADD CONSTRAINT fk_pcm_realm FOREIGN KEY (client_id) REFERENCES public.client(id);


--
-- Name: credential fk_pfyr0glasqyl0dei3kl69r6v0; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.credential
    ADD CONSTRAINT fk_pfyr0glasqyl0dei3kl69r6v0 FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: protocol_mapper_config fk_pmconfig; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.protocol_mapper_config
    ADD CONSTRAINT fk_pmconfig FOREIGN KEY (protocol_mapper_id) REFERENCES public.protocol_mapper(id);


--
-- Name: default_client_scope fk_r_def_cli_scope_realm; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.default_client_scope
    ADD CONSTRAINT fk_r_def_cli_scope_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: required_action_provider fk_req_act_realm; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.required_action_provider
    ADD CONSTRAINT fk_req_act_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: resource_uris fk_resource_server_uris; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_uris
    ADD CONSTRAINT fk_resource_server_uris FOREIGN KEY (resource_id) REFERENCES public.resource_server_resource(id);


--
-- Name: role_attribute fk_role_attribute_id; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.role_attribute
    ADD CONSTRAINT fk_role_attribute_id FOREIGN KEY (role_id) REFERENCES public.keycloak_role(id);


--
-- Name: realm_supported_locales fk_supported_locales_realm; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.realm_supported_locales
    ADD CONSTRAINT fk_supported_locales_realm FOREIGN KEY (realm_id) REFERENCES public.realm(id);


--
-- Name: user_federation_config fk_t13hpu1j94r2ebpekr39x5eu5; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_federation_config
    ADD CONSTRAINT fk_t13hpu1j94r2ebpekr39x5eu5 FOREIGN KEY (user_federation_provider_id) REFERENCES public.user_federation_provider(id);


--
-- Name: user_group_membership fk_user_group_user; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.user_group_membership
    ADD CONSTRAINT fk_user_group_user FOREIGN KEY (user_id) REFERENCES public.user_entity(id);


--
-- Name: policy_config fkdc34197cf864c4e43; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.policy_config
    ADD CONSTRAINT fkdc34197cf864c4e43 FOREIGN KEY (policy_id) REFERENCES public.resource_server_policy(id);


--
-- Name: identity_provider_config fkdc4897cf864c4e43; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.identity_provider_config
    ADD CONSTRAINT fkdc4897cf864c4e43 FOREIGN KEY (identity_provider_id) REFERENCES public.identity_provider(internal_id);


--
-- Name: DocumentFile DocumentFile_archivedAwardId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_archivedAwardId_fkey" FOREIGN KEY ("archivedAwardId") REFERENCES "ql-dao-tao"."ArchivedAward"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentFile DocumentFile_archivedCertificateId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_archivedCertificateId_fkey" FOREIGN KEY ("archivedCertificateId") REFERENCES "ql-dao-tao"."ArchivedCertificate"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentFile DocumentFile_curriculumId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "ql-dao-tao"."Curriculum"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentFile DocumentFile_curriculumVersionId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "ql-dao-tao"."CurriculumVersion"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentFile DocumentFile_decisionId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "ql-dao-tao"."Decision"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentFile DocumentFile_defenseRecordId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_defenseRecordId_fkey" FOREIGN KEY ("defenseRecordId") REFERENCES "ql-dao-tao"."DefenseRecord"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentFile DocumentFile_diplomaBackId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_diplomaBackId_fkey" FOREIGN KEY ("diplomaBackId") REFERENCES "ql-dao-tao"."GraduationDecision"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentFile DocumentFile_diplomaFrontId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_diplomaFrontId_fkey" FOREIGN KEY ("diplomaFrontId") REFERENCES "ql-dao-tao"."GraduationDecision"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentFile DocumentFile_diplomaVerificationBackId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_diplomaVerificationBackId_fkey" FOREIGN KEY ("diplomaVerificationBackId") REFERENCES "ql-dao-tao"."DiplomaVerificationApplication"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentFile DocumentFile_diplomaVerificationFrontId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_diplomaVerificationFrontId_fkey" FOREIGN KEY ("diplomaVerificationFrontId") REFERENCES "ql-dao-tao"."DiplomaVerificationApplication"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentFile DocumentFile_diplomaVerificationId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_diplomaVerificationId_fkey" FOREIGN KEY ("diplomaVerificationId") REFERENCES "ql-dao-tao"."DiplomaVerificationApplication"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentFile DocumentFile_evaluationPeriodId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_evaluationPeriodId_fkey" FOREIGN KEY ("evaluationPeriodId") REFERENCES "khao-thi"."EvaluationPeriod"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentFile DocumentFile_librarySubmissionId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_librarySubmissionId_fkey" FOREIGN KEY ("librarySubmissionId") REFERENCES "ql-dao-tao"."LibrarySubmission"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentFile DocumentFile_noteId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "ql-dao-tao"."Note"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentFile DocumentFile_notificationId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "ql-danh-muc"."Notification"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentFile DocumentFile_studentAcademicDecisionId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_studentAcademicDecisionId_fkey" FOREIGN KEY ("studentAcademicDecisionId") REFERENCES "ql-dao-tao"."StudentAcademicDecision"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentFile DocumentFile_studentScoreConvertId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_studentScoreConvertId_fkey" FOREIGN KEY ("studentScoreConvertId") REFERENCES "ql-dao-tao"."StudentScoreConvert"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentFile DocumentFile_subjectVersionId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentFile DocumentFile_trainingCourseId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentFile DocumentFile_trainingFieldId_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."DocumentFile"
    ADD CONSTRAINT "DocumentFile_trainingFieldId_fkey" FOREIGN KEY ("trainingFieldId") REFERENCES "ql-dao-tao"."TrainingField"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: _NotificationToStudent _NotificationToStudent_A_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."_NotificationToStudent"
    ADD CONSTRAINT "_NotificationToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-danh-muc"."Notification"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _NotificationToStudent _NotificationToStudent_B_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."_NotificationToStudent"
    ADD CONSTRAINT "_NotificationToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _NotificationToTrainingCourse _NotificationToTrainingCourse_A_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."_NotificationToTrainingCourse"
    ADD CONSTRAINT "_NotificationToTrainingCourse_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-danh-muc"."Notification"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _NotificationToTrainingCourse _NotificationToTrainingCourse_B_fkey; Type: FK CONSTRAINT; Schema: ql-danh-muc; Owner: admin
--

ALTER TABLE ONLY "ql-danh-muc"."_NotificationToTrainingCourse"
    ADD CONSTRAINT "_NotificationToTrainingCourse_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."TrainingCourse"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AcademicActionCondition AcademicActionCondition_ruleSetId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."AcademicActionCondition"
    ADD CONSTRAINT "AcademicActionCondition_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "ql-dao-tao"."AcademicActionRuleSet"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AcademicActionConfig AcademicActionConfig_trainingCourseId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."AcademicActionConfig"
    ADD CONSTRAINT "AcademicActionConfig_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AcademicActionRuleSet AcademicActionRuleSet_configId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."AcademicActionRuleSet"
    ADD CONSTRAINT "AcademicActionRuleSet_configId_fkey" FOREIGN KEY ("configId") REFERENCES "ql-dao-tao"."AcademicActionConfig"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AcademicRankingConvert AcademicRankingConvert_trainingCourseId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."AcademicRankingConvert"
    ADD CONSTRAINT "AcademicRankingConvert_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AcademicWarningRule AcademicWarningRule_trainingCourseId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."AcademicWarningRule"
    ADD CONSTRAINT "AcademicWarningRule_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AcademicWarning AcademicWarning_semesterId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."AcademicWarning"
    ADD CONSTRAINT "AcademicWarning_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AcademicWarning AcademicWarning_studentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."AcademicWarning"
    ADD CONSTRAINT "AcademicWarning_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ApplicationCheckResult ApplicationCheckResult_rankingConditionId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ApplicationCheckResult"
    ADD CONSTRAINT "ApplicationCheckResult_rankingConditionId_fkey" FOREIGN KEY ("rankingConditionId") REFERENCES "ql-dao-tao"."RankingCondition"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ApplicationCheckResult ApplicationCheckResult_studentGraduationApplicationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ApplicationCheckResult"
    ADD CONSTRAINT "ApplicationCheckResult_studentGraduationApplicationId_fkey" FOREIGN KEY ("studentGraduationApplicationId") REFERENCES "ql-dao-tao"."StudentGraduationApplication"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ApplicationDowngraded ApplicationDowngraded_fromId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ApplicationDowngraded"
    ADD CONSTRAINT "ApplicationDowngraded_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "ql-dao-tao"."AcademicRankingConvert"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ApplicationDowngraded ApplicationDowngraded_studentGraduationApplicationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ApplicationDowngraded"
    ADD CONSTRAINT "ApplicationDowngraded_studentGraduationApplicationId_fkey" FOREIGN KEY ("studentGraduationApplicationId") REFERENCES "ql-dao-tao"."StudentGraduationApplication"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ArchivedAwardOnStudentSubjectScore ArchivedAwardOnStudentSubjectScore_archivedAwardId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ArchivedAwardOnStudentSubjectScore"
    ADD CONSTRAINT "ArchivedAwardOnStudentSubjectScore_archivedAwardId_fkey" FOREIGN KEY ("archivedAwardId") REFERENCES "ql-dao-tao"."ArchivedAward"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ArchivedAwardOnStudentSubjectScore ArchivedAwardOnStudentSubjectScore_studentSubjectScoreId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ArchivedAwardOnStudentSubjectScore"
    ADD CONSTRAINT "ArchivedAwardOnStudentSubjectScore_studentSubjectScoreId_fkey" FOREIGN KEY ("studentSubjectScoreId") REFERENCES "ql-dao-tao"."StudentSubjectScore"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ArchivedAward ArchivedAward_awardId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ArchivedAward"
    ADD CONSTRAINT "ArchivedAward_awardId_fkey" FOREIGN KEY ("awardId") REFERENCES "ql-dao-tao"."Award"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ArchivedAward ArchivedAward_studentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ArchivedAward"
    ADD CONSTRAINT "ArchivedAward_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ArchivedCertificateOnStudentSubjectScore ArchivedCertificateOnStudentSubjectScore_archivedCertifica_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ArchivedCertificateOnStudentSubjectScore"
    ADD CONSTRAINT "ArchivedCertificateOnStudentSubjectScore_archivedCertifica_fkey" FOREIGN KEY ("archivedCertificateId") REFERENCES "ql-dao-tao"."ArchivedCertificate"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ArchivedCertificateOnStudentSubjectScore ArchivedCertificateOnStudentSubjectScore_studentSubjectSco_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ArchivedCertificateOnStudentSubjectScore"
    ADD CONSTRAINT "ArchivedCertificateOnStudentSubjectScore_studentSubjectSco_fkey" FOREIGN KEY ("studentSubjectScoreId") REFERENCES "ql-dao-tao"."StudentSubjectScore"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ArchivedCertificate ArchivedCertificate_certificateId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ArchivedCertificate"
    ADD CONSTRAINT "ArchivedCertificate_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "ql-dao-tao"."Certificate"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ArchivedCertificate ArchivedCertificate_studentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ArchivedCertificate"
    ADD CONSTRAINT "ArchivedCertificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Building Building_trainingLocationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Building"
    ADD CONSTRAINT "Building_trainingLocationId_fkey" FOREIGN KEY ("trainingLocationId") REFERENCES "ql-dao-tao"."TrainingLocation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CertificateOnSubject CertificateOnSubject_certificateId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."CertificateOnSubject"
    ADD CONSTRAINT "CertificateOnSubject_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "ql-dao-tao"."Certificate"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CertificateOnSubject CertificateOnSubject_subjectId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."CertificateOnSubject"
    ADD CONSTRAINT "CertificateOnSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."Subject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Certificate Certificate_outputStandardId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Certificate"
    ADD CONSTRAINT "Certificate_outputStandardId_fkey" FOREIGN KEY ("outputStandardId") REFERENCES "ql-dao-tao"."OutputStandard"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ClassRegisterLogs ClassRegisterLogs_classRegisterSessionId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ClassRegisterLogs"
    ADD CONSTRAINT "ClassRegisterLogs_classRegisterSessionId_fkey" FOREIGN KEY ("classRegisterSessionId") REFERENCES "ql-dao-tao"."ClassRegisterSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ClassRegisterLogs ClassRegisterLogs_studentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ClassRegisterLogs"
    ADD CONSTRAINT "ClassRegisterLogs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ClassRegisterLogs ClassRegisterLogs_subjectClassId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ClassRegisterLogs"
    ADD CONSTRAINT "ClassRegisterLogs_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ClassRegisterSessionCredit ClassRegisterSessionCredit_classRegisterSessionId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ClassRegisterSessionCredit"
    ADD CONSTRAINT "ClassRegisterSessionCredit_classRegisterSessionId_fkey" FOREIGN KEY ("classRegisterSessionId") REFERENCES "ql-dao-tao"."ClassRegisterSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ClassRegisterSession ClassRegisterSession_semesterId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ClassRegisterSession"
    ADD CONSTRAINT "ClassRegisterSession_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ClassSchedule ClassSchedule_extraLecturerId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ClassSchedule"
    ADD CONSTRAINT "ClassSchedule_extraLecturerId_fkey" FOREIGN KEY ("extraLecturerId") REFERENCES "ql-dao-tao"."Lecturer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ClassSchedule ClassSchedule_lecturerId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ClassSchedule"
    ADD CONSTRAINT "ClassSchedule_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "ql-dao-tao"."Lecturer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ClassSchedule ClassSchedule_originalScheduleId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ClassSchedule"
    ADD CONSTRAINT "ClassSchedule_originalScheduleId_fkey" FOREIGN KEY ("originalScheduleId") REFERENCES "ql-dao-tao"."ClassSchedule"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ClassSchedule ClassSchedule_roomId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ClassSchedule"
    ADD CONSTRAINT "ClassSchedule_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ql-dao-tao"."Room"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ClassSchedule ClassSchedule_subjectClassId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ClassSchedule"
    ADD CONSTRAINT "ClassSchedule_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CouncilMember CouncilMember_councilId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."CouncilMember"
    ADD CONSTRAINT "CouncilMember_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "ql-dao-tao"."Council"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CouncilMember CouncilMember_expertId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."CouncilMember"
    ADD CONSTRAINT "CouncilMember_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "ql-dao-tao"."ExpertProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Council Council_studentThesisRegistrationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Council"
    ADD CONSTRAINT "Council_studentThesisRegistrationId_fkey" FOREIGN KEY ("studentThesisRegistrationId") REFERENCES "ql-dao-tao"."StudentThesisRegistration"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CurriculumVersion CurriculumVersion_curriculumId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."CurriculumVersion"
    ADD CONSTRAINT "CurriculumVersion_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "ql-dao-tao"."Curriculum"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CurriculumVersion CurriculumVersion_diplomaTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."CurriculumVersion"
    ADD CONSTRAINT "CurriculumVersion_diplomaTypeId_fkey" FOREIGN KEY ("diplomaTypeId") REFERENCES "ql-dao-tao"."DiplomaType"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CurriculumVersion CurriculumVersion_trainingCourseId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."CurriculumVersion"
    ADD CONSTRAINT "CurriculumVersion_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CurriculumVersion CurriculumVersion_trainingLanguageId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."CurriculumVersion"
    ADD CONSTRAINT "CurriculumVersion_trainingLanguageId_fkey" FOREIGN KEY ("trainingLanguageId") REFERENCES "ql-dao-tao"."TrainingLanguage"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CurriculumVersion CurriculumVersion_trainingLevelId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."CurriculumVersion"
    ADD CONSTRAINT "CurriculumVersion_trainingLevelId_fkey" FOREIGN KEY ("trainingLevelId") REFERENCES "ql-dao-tao"."TrainingLevel"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CurriculumVersion CurriculumVersion_trainingObjectTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."CurriculumVersion"
    ADD CONSTRAINT "CurriculumVersion_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CurriculumVersion CurriculumVersion_trainingTimeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."CurriculumVersion"
    ADD CONSTRAINT "CurriculumVersion_trainingTimeId_fkey" FOREIGN KEY ("trainingTimeId") REFERENCES "ql-dao-tao"."TrainingTime"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CurriculumVersion CurriculumVersion_trainingTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."CurriculumVersion"
    ADD CONSTRAINT "CurriculumVersion_trainingTypeId_fkey" FOREIGN KEY ("trainingTypeId") REFERENCES "ql-dao-tao"."TrainingType"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Curriculum Curriculum_managementOrganizationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Curriculum"
    ADD CONSTRAINT "Curriculum_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES mta."DM_DonVi"("Id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Curriculum Curriculum_trainingMajorId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Curriculum"
    ADD CONSTRAINT "Curriculum_trainingMajorId_fkey" FOREIGN KEY ("trainingMajorId") REFERENCES "ql-dao-tao"."TrainingMajor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Curriculum Curriculum_trainingObjectTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Curriculum"
    ADD CONSTRAINT "Curriculum_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Decision Decision_thesisProjectId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Decision"
    ADD CONSTRAINT "Decision_thesisProjectId_fkey" FOREIGN KEY ("thesisProjectId") REFERENCES "ql-dao-tao"."ThesisProject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DefenseRecord DefenseRecord_thesisId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."DefenseRecord"
    ADD CONSTRAINT "DefenseRecord_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "ql-dao-tao"."ThesisProject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DiplomaVerificationApplication DiplomaVerificationApplication_studentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."DiplomaVerificationApplication"
    ADD CONSTRAINT "DiplomaVerificationApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DisciplinaryWarning DisciplinaryWarning_semesterId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."DisciplinaryWarning"
    ADD CONSTRAINT "DisciplinaryWarning_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DisciplinaryWarning DisciplinaryWarning_studentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."DisciplinaryWarning"
    ADD CONSTRAINT "DisciplinaryWarning_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ExpertProfile ExpertProfile_lecturerId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ExpertProfile"
    ADD CONSTRAINT "ExpertProfile_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "ql-dao-tao"."Lecturer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FixedClass FixedClass_classMonitorId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."FixedClass"
    ADD CONSTRAINT "FixedClass_classMonitorId_fkey" FOREIGN KEY ("classMonitorId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FixedClass FixedClass_curriculumVersionId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."FixedClass"
    ADD CONSTRAINT "FixedClass_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "ql-dao-tao"."CurriculumVersion"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FixedClass FixedClass_lecturerManagementId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."FixedClass"
    ADD CONSTRAINT "FixedClass_lecturerManagementId_fkey" FOREIGN KEY ("lecturerManagementId") REFERENCES "ql-dao-tao"."Lecturer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FixedClass FixedClass_managementOrganizationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."FixedClass"
    ADD CONSTRAINT "FixedClass_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES mta."DM_DonVi"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FixedClass FixedClass_staffManagementId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."FixedClass"
    ADD CONSTRAINT "FixedClass_staffManagementId_fkey" FOREIGN KEY ("staffManagementId") REFERENCES "ql-dao-tao"."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FixedClass FixedClass_trainingCourseId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."FixedClass"
    ADD CONSTRAINT "FixedClass_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FixedClass FixedClass_unionLeaderId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."FixedClass"
    ADD CONSTRAINT "FixedClass_unionLeaderId_fkey" FOREIGN KEY ("unionLeaderId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GraduationDecision GraduationDecision_applicationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."GraduationDecision"
    ADD CONSTRAINT "GraduationDecision_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ql-dao-tao"."StudentGraduationApplication"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GraduationDecision GraduationDecision_diplomaTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."GraduationDecision"
    ADD CONSTRAINT "GraduationDecision_diplomaTypeId_fkey" FOREIGN KEY ("diplomaTypeId") REFERENCES "ql-dao-tao"."DiplomaType"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GraduationDecision GraduationDecision_finalRankingId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."GraduationDecision"
    ADD CONSTRAINT "GraduationDecision_finalRankingId_fkey" FOREIGN KEY ("finalRankingId") REFERENCES "ql-dao-tao"."AcademicRankingConvert"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GraduationDecision GraduationDecision_studentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."GraduationDecision"
    ADD CONSTRAINT "GraduationDecision_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GraduationDecision GraduationDecision_trainingMajorId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."GraduationDecision"
    ADD CONSTRAINT "GraduationDecision_trainingMajorId_fkey" FOREIGN KEY ("trainingMajorId") REFERENCES "ql-dao-tao"."TrainingMajor"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GraduationRankDowngradeCondition GraduationRankDowngradeCondition_downgradeRuleId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."GraduationRankDowngradeCondition"
    ADD CONSTRAINT "GraduationRankDowngradeCondition_downgradeRuleId_fkey" FOREIGN KEY ("downgradeRuleId") REFERENCES "ql-dao-tao"."GraduationRankDowngradeRule"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GraduationRankDowngradeRule GraduationRankDowngradeRule_initialRankId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."GraduationRankDowngradeRule"
    ADD CONSTRAINT "GraduationRankDowngradeRule_initialRankId_fkey" FOREIGN KEY ("initialRankId") REFERENCES "ql-dao-tao"."AcademicRankingConvert"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GraduationSession GraduationSession_trainingCourseId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."GraduationSession"
    ADD CONSTRAINT "GraduationSession_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GraduationSession GraduationSession_trainingObjectTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."GraduationSession"
    ADD CONSTRAINT "GraduationSession_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invitation Invitation_councilMemberId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Invitation"
    ADD CONSTRAINT "Invitation_councilMemberId_fkey" FOREIGN KEY ("councilMemberId") REFERENCES "ql-dao-tao"."CouncilMember"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LecturerHistory LecturerHistory_lecturerTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."LecturerHistory"
    ADD CONSTRAINT "LecturerHistory_lecturerTypeId_fkey" FOREIGN KEY ("lecturerTypeId") REFERENCES "ql-danh-muc"."LecturerType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LecturerHistory LecturerHistory_organizationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."LecturerHistory"
    ADD CONSTRAINT "LecturerHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES mta."DM_DonVi"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LecturerHistory LecturerHistory_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."LecturerHistory"
    ADD CONSTRAINT "LecturerHistory_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Lecturer Lecturer_lecturerTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Lecturer"
    ADD CONSTRAINT "Lecturer_lecturerTypeId_fkey" FOREIGN KEY ("lecturerTypeId") REFERENCES "ql-danh-muc"."LecturerType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Lecturer Lecturer_organizationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Lecturer"
    ADD CONSTRAINT "Lecturer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES mta."DM_DonVi"("Id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Lecturer Lecturer_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Lecturer"
    ADD CONSTRAINT "Lecturer_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibrarySubmission LibrarySubmission_thesisId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."LibrarySubmission"
    ADD CONSTRAINT "LibrarySubmission_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "ql-dao-tao"."ThesisProject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Milestone Milestone_schoolYearId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Milestone"
    ADD CONSTRAINT "Milestone_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "ql-dao-tao"."SchoolYear"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: NoteFolder NoteFolder_parentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."NoteFolder"
    ADD CONSTRAINT "NoteFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ql-dao-tao"."NoteFolder"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: NoteFolder NoteFolder_studentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."NoteFolder"
    ADD CONSTRAINT "NoteFolder_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: NoteReminder NoteReminder_noteId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."NoteReminder"
    ADD CONSTRAINT "NoteReminder_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "ql-dao-tao"."Note"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Note Note_folderId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Note"
    ADD CONSTRAINT "Note_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "ql-dao-tao"."NoteFolder"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Note Note_studentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Note"
    ADD CONSTRAINT "Note_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OutputStandardOnCurriculum OutputStandardOnCurriculum_curriculumVersionId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."OutputStandardOnCurriculum"
    ADD CONSTRAINT "OutputStandardOnCurriculum_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "ql-dao-tao"."CurriculumVersion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OutputStandardOnCurriculum OutputStandardOnCurriculum_outputStandardId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."OutputStandardOnCurriculum"
    ADD CONSTRAINT "OutputStandardOnCurriculum_outputStandardId_fkey" FOREIGN KEY ("outputStandardId") REFERENCES "ql-dao-tao"."OutputStandard"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PaymentRecord PaymentRecord_councilMemberId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."PaymentRecord"
    ADD CONSTRAINT "PaymentRecord_councilMemberId_fkey" FOREIGN KEY ("councilMemberId") REFERENCES "ql-dao-tao"."CouncilMember"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PlanTrainingSubject PlanTrainingSubject_planTrainingId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."PlanTrainingSubject"
    ADD CONSTRAINT "PlanTrainingSubject_planTrainingId_fkey" FOREIGN KEY ("planTrainingId") REFERENCES "ql-dao-tao"."PlanTraining"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PlanTrainingSubject PlanTrainingSubject_trainingBlockSubjectId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."PlanTrainingSubject"
    ADD CONSTRAINT "PlanTrainingSubject_trainingBlockSubjectId_fkey" FOREIGN KEY ("trainingBlockSubjectId") REFERENCES "ql-dao-tao"."TrainingBlockSubject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PlanTraining PlanTraining_semesterId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."PlanTraining"
    ADD CONSTRAINT "PlanTraining_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PlanTraining PlanTraining_trainingCourseId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."PlanTraining"
    ADD CONSTRAINT "PlanTraining_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PlanTraining PlanTraining_trainingObjectTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."PlanTraining"
    ADD CONSTRAINT "PlanTraining_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RankingCondition RankingCondition_rankingId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."RankingCondition"
    ADD CONSTRAINT "RankingCondition_rankingId_fkey" FOREIGN KEY ("rankingId") REFERENCES "ql-dao-tao"."AcademicRankingConvert"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ResearchProject ResearchProject_organizationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ResearchProject"
    ADD CONSTRAINT "ResearchProject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES mta."DM_DonVi"("Id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ResearchProject ResearchProject_supervisorId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ResearchProject"
    ADD CONSTRAINT "ResearchProject_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "ql-dao-tao"."Lecturer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Room Room_buildingId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Room"
    ADD CONSTRAINT "Room_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "ql-dao-tao"."Building"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ScholarshipAward ScholarshipAward_scholarshipId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ScholarshipAward"
    ADD CONSTRAINT "ScholarshipAward_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "ql-dao-tao"."Scholarship"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ScholarshipAward ScholarshipAward_semesterId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ScholarshipAward"
    ADD CONSTRAINT "ScholarshipAward_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ScholarshipAward ScholarshipAward_studentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ScholarshipAward"
    ADD CONSTRAINT "ScholarshipAward_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ScholarshipCriteria ScholarshipCriteria_scholarshipId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ScholarshipCriteria"
    ADD CONSTRAINT "ScholarshipCriteria_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "ql-dao-tao"."Scholarship"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Scholarship Scholarship_trainingCourseId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Scholarship"
    ADD CONSTRAINT "Scholarship_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ScoreConvert ScoreConvert_trainingCourseId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ScoreConvert"
    ADD CONSTRAINT "ScoreConvert_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Semester Semester_schoolYearId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Semester"
    ADD CONSTRAINT "Semester_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "ql-dao-tao"."SchoolYear"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StaffHistory StaffHistory_organizationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StaffHistory"
    ADD CONSTRAINT "StaffHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES mta."DM_DonVi"("Id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StaffHistory StaffHistory_staffPositionId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StaffHistory"
    ADD CONSTRAINT "StaffHistory_staffPositionId_fkey" FOREIGN KEY ("staffPositionId") REFERENCES "ql-danh-muc"."StaffPosition"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StaffHistory StaffHistory_staffTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StaffHistory"
    ADD CONSTRAINT "StaffHistory_staffTypeId_fkey" FOREIGN KEY ("staffTypeId") REFERENCES "ql-danh-muc"."StaffType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StaffHistory StaffHistory_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StaffHistory"
    ADD CONSTRAINT "StaffHistory_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Staff Staff_organizationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Staff"
    ADD CONSTRAINT "Staff_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES mta."DM_DonVi"("Id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Staff Staff_staffPositionId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Staff"
    ADD CONSTRAINT "Staff_staffPositionId_fkey" FOREIGN KEY ("staffPositionId") REFERENCES "ql-danh-muc"."StaffPosition"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Staff Staff_staffTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Staff"
    ADD CONSTRAINT "Staff_staffTypeId_fkey" FOREIGN KEY ("staffTypeId") REFERENCES "ql-danh-muc"."StaffType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Staff Staff_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Staff"
    ADD CONSTRAINT "Staff_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentAcademicDecision StudentAcademicDecision_appliedConfigId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentAcademicDecision"
    ADD CONSTRAINT "StudentAcademicDecision_appliedConfigId_fkey" FOREIGN KEY ("appliedConfigId") REFERENCES "ql-dao-tao"."AcademicActionConfig"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StudentAcademicDecision StudentAcademicDecision_schoolYearId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentAcademicDecision"
    ADD CONSTRAINT "StudentAcademicDecision_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "ql-dao-tao"."SchoolYear"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StudentAcademicDecision StudentAcademicDecision_semesterId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentAcademicDecision"
    ADD CONSTRAINT "StudentAcademicDecision_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StudentAcademicDecision StudentAcademicDecision_studentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentAcademicDecision"
    ADD CONSTRAINT "StudentAcademicDecision_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentGraduationApplication StudentGraduationApplication_diplomaTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentGraduationApplication"
    ADD CONSTRAINT "StudentGraduationApplication_diplomaTypeId_fkey" FOREIGN KEY ("diplomaTypeId") REFERENCES "ql-dao-tao"."DiplomaType"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StudentGraduationApplication StudentGraduationApplication_rankId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentGraduationApplication"
    ADD CONSTRAINT "StudentGraduationApplication_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "ql-dao-tao"."AcademicRankingConvert"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StudentGraduationApplication StudentGraduationApplication_sessionId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentGraduationApplication"
    ADD CONSTRAINT "StudentGraduationApplication_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ql-dao-tao"."GraduationSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentGraduationApplication StudentGraduationApplication_studentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentGraduationApplication"
    ADD CONSTRAINT "StudentGraduationApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentGraduationApplication StudentGraduationApplication_trainingMajorId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentGraduationApplication"
    ADD CONSTRAINT "StudentGraduationApplication_trainingMajorId_fkey" FOREIGN KEY ("trainingMajorId") REFERENCES "ql-dao-tao"."TrainingMajor"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StudentResearchRegistration StudentResearchRegistration_researchProjectId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentResearchRegistration"
    ADD CONSTRAINT "StudentResearchRegistration_researchProjectId_fkey" FOREIGN KEY ("researchProjectId") REFERENCES "ql-dao-tao"."ResearchProject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentResearchRegistration StudentResearchRegistration_reviewedById_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentResearchRegistration"
    ADD CONSTRAINT "StudentResearchRegistration_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "ql-dao-tao"."Lecturer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StudentResearchRegistration StudentResearchRegistration_studentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentResearchRegistration"
    ADD CONSTRAINT "StudentResearchRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentResearchTopic StudentResearchTopic_coSupervisorId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentResearchTopic"
    ADD CONSTRAINT "StudentResearchTopic_coSupervisorId_fkey" FOREIGN KEY ("coSupervisorId") REFERENCES "ql-dao-tao"."Lecturer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StudentResearchTopic StudentResearchTopic_studentSubjectScoreId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentResearchTopic"
    ADD CONSTRAINT "StudentResearchTopic_studentSubjectScoreId_fkey" FOREIGN KEY ("studentSubjectScoreId") REFERENCES "ql-dao-tao"."StudentSubjectScore"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentResearchTopic StudentResearchTopic_supervisorId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentResearchTopic"
    ADD CONSTRAINT "StudentResearchTopic_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "ql-dao-tao"."Lecturer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StudentScoreConvert StudentScoreConvert_studentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentScoreConvert"
    ADD CONSTRAINT "StudentScoreConvert_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentSemesterResult StudentSemesterResult_rankId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentSemesterResult"
    ADD CONSTRAINT "StudentSemesterResult_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "ql-dao-tao"."AcademicRankingConvert"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StudentSemesterResult StudentSemesterResult_semesterId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentSemesterResult"
    ADD CONSTRAINT "StudentSemesterResult_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentSemesterResult StudentSemesterResult_studentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentSemesterResult"
    ADD CONSTRAINT "StudentSemesterResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentSubjectScoreHistory StudentSubjectScoreHistory_studentSubjectScoreId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentSubjectScoreHistory"
    ADD CONSTRAINT "StudentSubjectScoreHistory_studentSubjectScoreId_fkey" FOREIGN KEY ("studentSubjectScoreId") REFERENCES "ql-dao-tao"."StudentSubjectScore"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentSubjectScoreHistory StudentSubjectScoreHistory_updatedById_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentSubjectScoreHistory"
    ADD CONSTRAINT "StudentSubjectScoreHistory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StudentSubjectScore StudentSubjectScore_studentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentSubjectScore"
    ADD CONSTRAINT "StudentSubjectScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentSubjectScore StudentSubjectScore_subjectClassId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentSubjectScore"
    ADD CONSTRAINT "StudentSubjectScore_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StudentSubjectScore StudentSubjectScore_subjectVersionId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentSubjectScore"
    ADD CONSTRAINT "StudentSubjectScore_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentThesisRegistration StudentThesisRegistration_reviewedById_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentThesisRegistration"
    ADD CONSTRAINT "StudentThesisRegistration_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "ql-dao-tao"."Lecturer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StudentThesisRegistration StudentThesisRegistration_studentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentThesisRegistration"
    ADD CONSTRAINT "StudentThesisRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentThesisRegistration StudentThesisRegistration_studentSubjectScoreId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentThesisRegistration"
    ADD CONSTRAINT "StudentThesisRegistration_studentSubjectScoreId_fkey" FOREIGN KEY ("studentSubjectScoreId") REFERENCES "ql-dao-tao"."StudentSubjectScore"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StudentThesisRegistration StudentThesisRegistration_thesisProjectId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentThesisRegistration"
    ADD CONSTRAINT "StudentThesisRegistration_thesisProjectId_fkey" FOREIGN KEY ("thesisProjectId") REFERENCES "ql-dao-tao"."ThesisProject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentTrainingScore StudentTrainingScore_studentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentTrainingScore"
    ADD CONSTRAINT "StudentTrainingScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentTrainingScore StudentTrainingScore_trainingScoreSessionId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentTrainingScore"
    ADD CONSTRAINT "StudentTrainingScore_trainingScoreSessionId_fkey" FOREIGN KEY ("trainingScoreSessionId") REFERENCES "ql-dao-tao"."TrainingScoreSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentYearResult StudentYearResult_rankId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentYearResult"
    ADD CONSTRAINT "StudentYearResult_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "ql-dao-tao"."AcademicRankingConvert"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StudentYearResult StudentYearResult_schoolYearId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentYearResult"
    ADD CONSTRAINT "StudentYearResult_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "ql-dao-tao"."SchoolYear"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentYearResult StudentYearResult_studentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."StudentYearResult"
    ADD CONSTRAINT "StudentYearResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Student Student_curriculumVersionId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Student"
    ADD CONSTRAINT "Student_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "ql-dao-tao"."CurriculumVersion"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Student Student_curriculumVersionParallelId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Student"
    ADD CONSTRAINT "Student_curriculumVersionParallelId_fkey" FOREIGN KEY ("curriculumVersionParallelId") REFERENCES "ql-dao-tao"."CurriculumVersion"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Student Student_fixedClassId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Student"
    ADD CONSTRAINT "Student_fixedClassId_fkey" FOREIGN KEY ("fixedClassId") REFERENCES "ql-dao-tao"."FixedClass"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Student Student_registrationAreaId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Student"
    ADD CONSTRAINT "Student_registrationAreaId_fkey" FOREIGN KEY ("registrationAreaId") REFERENCES mta."DM_KhuVuc_DiaLy"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Student Student_trainingLocationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Student"
    ADD CONSTRAINT "Student_trainingLocationId_fkey" FOREIGN KEY ("trainingLocationId") REFERENCES "ql-dao-tao"."TrainingLocation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Student Student_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Student"
    ADD CONSTRAINT "Student_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SubjectClassHistory SubjectClassHistory_subjectClassId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectClassHistory"
    ADD CONSTRAINT "SubjectClassHistory_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SubjectClassHistory SubjectClassHistory_updatedById_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectClassHistory"
    ADD CONSTRAINT "SubjectClassHistory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SubjectClassTime SubjectClassTime_subjectClassId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectClassTime"
    ADD CONSTRAINT "SubjectClassTime_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SubjectClass SubjectClass_enterGradeLecturerId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectClass"
    ADD CONSTRAINT "SubjectClass_enterGradeLecturerId_fkey" FOREIGN KEY ("enterGradeLecturerId") REFERENCES "ql-dao-tao"."Lecturer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SubjectClass SubjectClass_examId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectClass"
    ADD CONSTRAINT "SubjectClass_examId_fkey" FOREIGN KEY ("examId") REFERENCES "khao-thi"."Exam"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SubjectClass SubjectClass_extraLecturerId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectClass"
    ADD CONSTRAINT "SubjectClass_extraLecturerId_fkey" FOREIGN KEY ("extraLecturerId") REFERENCES "ql-dao-tao"."Lecturer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SubjectClass SubjectClass_lecturerId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectClass"
    ADD CONSTRAINT "SubjectClass_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "ql-dao-tao"."Lecturer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SubjectClass SubjectClass_roomId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectClass"
    ADD CONSTRAINT "SubjectClass_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ql-dao-tao"."Room"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SubjectClass SubjectClass_semesterId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectClass"
    ADD CONSTRAINT "SubjectClass_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SubjectClass SubjectClass_subjectId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectClass"
    ADD CONSTRAINT "SubjectClass_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."SubjectVersion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SubjectClass SubjectClass_trainingLocationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectClass"
    ADD CONSTRAINT "SubjectClass_trainingLocationId_fkey" FOREIGN KEY ("trainingLocationId") REFERENCES "ql-dao-tao"."TrainingLocation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SubjectClass SubjectClass_trainingObjectTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectClass"
    ADD CONSTRAINT "SubjectClass_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SubjectInGroup SubjectInGroup_equivalencyGroupId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectInGroup"
    ADD CONSTRAINT "SubjectInGroup_equivalencyGroupId_fkey" FOREIGN KEY ("equivalencyGroupId") REFERENCES "ql-dao-tao"."EquivalencyGroup"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SubjectInGroup SubjectInGroup_subjectId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectInGroup"
    ADD CONSTRAINT "SubjectInGroup_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."SubjectVersion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SubjectScoreConvert SubjectScoreConvert_studentScoreConvertId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectScoreConvert"
    ADD CONSTRAINT "SubjectScoreConvert_studentScoreConvertId_fkey" FOREIGN KEY ("studentScoreConvertId") REFERENCES "ql-dao-tao"."StudentScoreConvert"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SubjectScoreConvert SubjectScoreConvert_subjectVersionId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectScoreConvert"
    ADD CONSTRAINT "SubjectScoreConvert_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SubjectVersionHistory SubjectVersionHistory_subjectVersionId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectVersionHistory"
    ADD CONSTRAINT "SubjectVersionHistory_subjectVersionId_fkey" FOREIGN KEY ("subjectVersionId") REFERENCES "ql-dao-tao"."SubjectVersion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SubjectVersionHistory SubjectVersionHistory_updatedById_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectVersionHistory"
    ADD CONSTRAINT "SubjectVersionHistory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SubjectVersion SubjectVersion_managementOrganizationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectVersion"
    ADD CONSTRAINT "SubjectVersion_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES mta."DM_DonVi"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SubjectVersion SubjectVersion_subjectId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectVersion"
    ADD CONSTRAINT "SubjectVersion_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."Subject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SubjectVersion SubjectVersion_subjectVersionCategoryId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectVersion"
    ADD CONSTRAINT "SubjectVersion_subjectVersionCategoryId_fkey" FOREIGN KEY ("subjectVersionCategoryId") REFERENCES "ql-dao-tao"."SubjectVersionCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SubjectVersion SubjectVersion_trainingObjectTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."SubjectVersion"
    ADD CONSTRAINT "SubjectVersion_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Subject Subject_managementOrganizationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."Subject"
    ADD CONSTRAINT "Subject_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES mta."DM_DonVi"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ThesisProject ThesisProject_coSupervisorId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ThesisProject"
    ADD CONSTRAINT "ThesisProject_coSupervisorId_fkey" FOREIGN KEY ("coSupervisorId") REFERENCES "ql-dao-tao"."ExpertProfile"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ThesisProject ThesisProject_coSupervisorPaymentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ThesisProject"
    ADD CONSTRAINT "ThesisProject_coSupervisorPaymentId_fkey" FOREIGN KEY ("coSupervisorPaymentId") REFERENCES "ql-dao-tao"."SupervisorPaymentRecord"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ThesisProject ThesisProject_councilId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ThesisProject"
    ADD CONSTRAINT "ThesisProject_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "ql-dao-tao"."Council"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ThesisProject ThesisProject_defenseSessionId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ThesisProject"
    ADD CONSTRAINT "ThesisProject_defenseSessionId_fkey" FOREIGN KEY ("defenseSessionId") REFERENCES "ql-dao-tao"."DefenseSession"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ThesisProject ThesisProject_organizationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ThesisProject"
    ADD CONSTRAINT "ThesisProject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES mta."DM_DonVi"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ThesisProject ThesisProject_roomId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ThesisProject"
    ADD CONSTRAINT "ThesisProject_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ql-dao-tao"."Room"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ThesisProject ThesisProject_subjectClassId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ThesisProject"
    ADD CONSTRAINT "ThesisProject_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "ql-dao-tao"."SubjectClass"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ThesisProject ThesisProject_supervisorId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ThesisProject"
    ADD CONSTRAINT "ThesisProject_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "ql-dao-tao"."ExpertProfile"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ThesisProject ThesisProject_supervisorPaymentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ThesisProject"
    ADD CONSTRAINT "ThesisProject_supervisorPaymentId_fkey" FOREIGN KEY ("supervisorPaymentId") REFERENCES "ql-dao-tao"."SupervisorPaymentRecord"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ThesisProject ThesisProject_thesisSessionId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ThesisProject"
    ADD CONSTRAINT "ThesisProject_thesisSessionId_fkey" FOREIGN KEY ("thesisSessionId") REFERENCES "ql-dao-tao"."ThesisSession"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ThesisSession ThesisSession_trainingCourseId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ThesisSession"
    ADD CONSTRAINT "ThesisSession_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ThesisSession ThesisSession_trainingObjectTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."ThesisSession"
    ADD CONSTRAINT "ThesisSession_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TrainingBlockOnCurriculumVersion TrainingBlockOnCurriculumVersion_curriculumVersionId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingBlockOnCurriculumVersion"
    ADD CONSTRAINT "TrainingBlockOnCurriculumVersion_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "ql-dao-tao"."CurriculumVersion"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TrainingBlockOnCurriculumVersion TrainingBlockOnCurriculumVersion_trainingBlockId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingBlockOnCurriculumVersion"
    ADD CONSTRAINT "TrainingBlockOnCurriculumVersion_trainingBlockId_fkey" FOREIGN KEY ("trainingBlockId") REFERENCES "ql-dao-tao"."TrainingBlock"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TrainingBlockSubject TrainingBlockSubject_subjectId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingBlockSubject"
    ADD CONSTRAINT "TrainingBlockSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "ql-dao-tao"."SubjectVersion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TrainingBlockSubject TrainingBlockSubject_trainingBlockOnCurriculumVersionId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingBlockSubject"
    ADD CONSTRAINT "TrainingBlockSubject_trainingBlockOnCurriculumVersionId_fkey" FOREIGN KEY ("trainingBlockOnCurriculumVersionId") REFERENCES "ql-dao-tao"."TrainingBlockOnCurriculumVersion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TrainingBlock TrainingBlock_parentId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingBlock"
    ADD CONSTRAINT "TrainingBlock_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ql-dao-tao"."TrainingBlock"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TrainingBlock TrainingBlock_trainingObjectTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingBlock"
    ADD CONSTRAINT "TrainingBlock_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TrainingCourseRegulation TrainingCourseRegulation_trainingCourseId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingCourseRegulation"
    ADD CONSTRAINT "TrainingCourseRegulation_trainingCourseId_fkey" FOREIGN KEY ("trainingCourseId") REFERENCES "ql-dao-tao"."TrainingCourse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TrainingCourse TrainingCourse_semesterStartId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingCourse"
    ADD CONSTRAINT "TrainingCourse_semesterStartId_fkey" FOREIGN KEY ("semesterStartId") REFERENCES "ql-dao-tao"."Semester"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TrainingCourse TrainingCourse_trainingLanguageId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingCourse"
    ADD CONSTRAINT "TrainingCourse_trainingLanguageId_fkey" FOREIGN KEY ("trainingLanguageId") REFERENCES "ql-dao-tao"."TrainingLanguage"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TrainingCourse TrainingCourse_trainingObjectTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingCourse"
    ADD CONSTRAINT "TrainingCourse_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TrainingFieldOnTrainingObjectType TrainingFieldOnTrainingObjectType_trainingFieldId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingFieldOnTrainingObjectType"
    ADD CONSTRAINT "TrainingFieldOnTrainingObjectType_trainingFieldId_fkey" FOREIGN KEY ("trainingFieldId") REFERENCES "ql-dao-tao"."TrainingField"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TrainingFieldOnTrainingObjectType TrainingFieldOnTrainingObjectType_trainingObjectTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingFieldOnTrainingObjectType"
    ADD CONSTRAINT "TrainingFieldOnTrainingObjectType_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TrainingField TrainingField_organizationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingField"
    ADD CONSTRAINT "TrainingField_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES mta."DM_DonVi"("Id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TrainingLocation TrainingLocation_dM_TinhId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingLocation"
    ADD CONSTRAINT "TrainingLocation_dM_TinhId_fkey" FOREIGN KEY ("dM_TinhId") REFERENCES mta."DM_Tinh"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TrainingLocation TrainingLocation_dM_Tinh_NewId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingLocation"
    ADD CONSTRAINT "TrainingLocation_dM_Tinh_NewId_fkey" FOREIGN KEY ("dM_Tinh_NewId") REFERENCES mta."DM_Tinh_New"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TrainingMajorOnTrainingObjectType TrainingMajorOnTrainingObjectType_trainingMajorId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingMajorOnTrainingObjectType"
    ADD CONSTRAINT "TrainingMajorOnTrainingObjectType_trainingMajorId_fkey" FOREIGN KEY ("trainingMajorId") REFERENCES "ql-dao-tao"."TrainingMajor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TrainingMajorOnTrainingObjectType TrainingMajorOnTrainingObjectType_trainingObjectTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingMajorOnTrainingObjectType"
    ADD CONSTRAINT "TrainingMajorOnTrainingObjectType_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TrainingMajor TrainingMajor_organizationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingMajor"
    ADD CONSTRAINT "TrainingMajor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES mta."DM_DonVi"("Id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TrainingMajor TrainingMajor_secondOrganizationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingMajor"
    ADD CONSTRAINT "TrainingMajor_secondOrganizationId_fkey" FOREIGN KEY ("secondOrganizationId") REFERENCES mta."DM_DonVi"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TrainingMajor TrainingMajor_thirdOrganizationId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingMajor"
    ADD CONSTRAINT "TrainingMajor_thirdOrganizationId_fkey" FOREIGN KEY ("thirdOrganizationId") REFERENCES mta."DM_DonVi"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TrainingMajor TrainingMajor_trainingFieldId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingMajor"
    ADD CONSTRAINT "TrainingMajor_trainingFieldId_fkey" FOREIGN KEY ("trainingFieldId") REFERENCES "ql-dao-tao"."TrainingField"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TrainingObjectType TrainingObjectType_trainingFormId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingObjectType"
    ADD CONSTRAINT "TrainingObjectType_trainingFormId_fkey" FOREIGN KEY ("trainingFormId") REFERENCES "ql-dao-tao"."TrainingForm"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TrainingObjectType TrainingObjectType_trainingLevelId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingObjectType"
    ADD CONSTRAINT "TrainingObjectType_trainingLevelId_fkey" FOREIGN KEY ("trainingLevelId") REFERENCES "ql-dao-tao"."TrainingLevel"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TrainingScoreSession TrainingScoreSession_semesterId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingScoreSession"
    ADD CONSTRAINT "TrainingScoreSession_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "ql-dao-tao"."Semester"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TrainingScoreSession TrainingScoreSession_trainingObjectTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."TrainingScoreSession"
    ADD CONSTRAINT "TrainingScoreSession_trainingObjectTypeId_fkey" FOREIGN KEY ("trainingObjectTypeId") REFERENCES "ql-dao-tao"."TrainingObjectType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _AcademicWarningToAcademicWarningRule _AcademicWarningToAcademicWarningRule_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_AcademicWarningToAcademicWarningRule"
    ADD CONSTRAINT "_AcademicWarningToAcademicWarningRule_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."AcademicWarning"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _AcademicWarningToAcademicWarningRule _AcademicWarningToAcademicWarningRule_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_AcademicWarningToAcademicWarningRule"
    ADD CONSTRAINT "_AcademicWarningToAcademicWarningRule_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."AcademicWarningRule"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ApplicationDowngradedToGraduationRankDowngradeCondition _ApplicationDowngradedToGraduationRankDowngradeCondition_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_ApplicationDowngradedToGraduationRankDowngradeCondition"
    ADD CONSTRAINT "_ApplicationDowngradedToGraduationRankDowngradeCondition_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."ApplicationDowngraded"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ApplicationDowngradedToGraduationRankDowngradeCondition _ApplicationDowngradedToGraduationRankDowngradeCondition_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_ApplicationDowngradedToGraduationRankDowngradeCondition"
    ADD CONSTRAINT "_ApplicationDowngradedToGraduationRankDowngradeCondition_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."GraduationRankDowngradeCondition"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _AwardToSubject _AwardToSubject_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_AwardToSubject"
    ADD CONSTRAINT "_AwardToSubject_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."Award"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _AwardToSubject _AwardToSubject_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_AwardToSubject"
    ADD CONSTRAINT "_AwardToSubject_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."Subject"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ClassRegisterSessionToTrainingCourse _ClassRegisterSessionToTrainingCourse_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_ClassRegisterSessionToTrainingCourse"
    ADD CONSTRAINT "_ClassRegisterSessionToTrainingCourse_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."ClassRegisterSession"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ClassRegisterSessionToTrainingCourse _ClassRegisterSessionToTrainingCourse_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_ClassRegisterSessionToTrainingCourse"
    ADD CONSTRAINT "_ClassRegisterSessionToTrainingCourse_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."TrainingCourse"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ClassScheduleToUserProfile _ClassScheduleToUserProfile_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_ClassScheduleToUserProfile"
    ADD CONSTRAINT "_ClassScheduleToUserProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."ClassSchedule"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ClassScheduleToUserProfile _ClassScheduleToUserProfile_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_ClassScheduleToUserProfile"
    ADD CONSTRAINT "_ClassScheduleToUserProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _CoRequisiteSubject _CoRequisiteSubject_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_CoRequisiteSubject"
    ADD CONSTRAINT "_CoRequisiteSubject_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."SubjectVersion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _CoRequisiteSubject _CoRequisiteSubject_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_CoRequisiteSubject"
    ADD CONSTRAINT "_CoRequisiteSubject_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."SubjectVersion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _DefenseRooms _DefenseRooms_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_DefenseRooms"
    ADD CONSTRAINT "_DefenseRooms_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."Room"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _DefenseRooms _DefenseRooms_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_DefenseRooms"
    ADD CONSTRAINT "_DefenseRooms_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."SubjectClass"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _DisciplinaryWarningToDisciplinaryWarningReason _DisciplinaryWarningToDisciplinaryWarningReason_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_DisciplinaryWarningToDisciplinaryWarningReason"
    ADD CONSTRAINT "_DisciplinaryWarningToDisciplinaryWarningReason_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."DisciplinaryWarning"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _DisciplinaryWarningToDisciplinaryWarningReason _DisciplinaryWarningToDisciplinaryWarningReason_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_DisciplinaryWarningToDisciplinaryWarningReason"
    ADD CONSTRAINT "_DisciplinaryWarningToDisciplinaryWarningReason_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."DisciplinaryWarningReason"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ExpertProfileToSubjectClass _ExpertProfileToSubjectClass_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_ExpertProfileToSubjectClass"
    ADD CONSTRAINT "_ExpertProfileToSubjectClass_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."ExpertProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ExpertProfileToSubjectClass _ExpertProfileToSubjectClass_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_ExpertProfileToSubjectClass"
    ADD CONSTRAINT "_ExpertProfileToSubjectClass_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."SubjectClass"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ExpertProfileToTrainingMajor _ExpertProfileToTrainingMajor_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_ExpertProfileToTrainingMajor"
    ADD CONSTRAINT "_ExpertProfileToTrainingMajor_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."ExpertProfile"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ExpertProfileToTrainingMajor _ExpertProfileToTrainingMajor_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_ExpertProfileToTrainingMajor"
    ADD CONSTRAINT "_ExpertProfileToTrainingMajor_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."TrainingMajor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _FixedClassToNotification _FixedClassToNotification_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_FixedClassToNotification"
    ADD CONSTRAINT "_FixedClassToNotification_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."FixedClass"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _FixedClassToNotification _FixedClassToNotification_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_FixedClassToNotification"
    ADD CONSTRAINT "_FixedClassToNotification_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-danh-muc"."Notification"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _FixedClassToSubjectClass _FixedClassToSubjectClass_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_FixedClassToSubjectClass"
    ADD CONSTRAINT "_FixedClassToSubjectClass_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."FixedClass"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _FixedClassToSubjectClass _FixedClassToSubjectClass_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_FixedClassToSubjectClass"
    ADD CONSTRAINT "_FixedClassToSubjectClass_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."SubjectClass"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _FixedClassToSurveyObjectType _FixedClassToSurveyObjectType_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_FixedClassToSurveyObjectType"
    ADD CONSTRAINT "_FixedClassToSurveyObjectType_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."FixedClass"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _FixedClassToSurveyObjectType _FixedClassToSurveyObjectType_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_FixedClassToSurveyObjectType"
    ADD CONSTRAINT "_FixedClassToSurveyObjectType_B_fkey" FOREIGN KEY ("B") REFERENCES "khao-thi"."SurveyObjectType"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _GraduationSessionToOutputStandard _GraduationSessionToOutputStandard_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_GraduationSessionToOutputStandard"
    ADD CONSTRAINT "_GraduationSessionToOutputStandard_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."GraduationSession"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _GraduationSessionToOutputStandard _GraduationSessionToOutputStandard_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_GraduationSessionToOutputStandard"
    ADD CONSTRAINT "_GraduationSessionToOutputStandard_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."OutputStandard"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _NoteToNoteTag _NoteToNoteTag_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_NoteToNoteTag"
    ADD CONSTRAINT "_NoteToNoteTag_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."Note"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _NoteToNoteTag _NoteToNoteTag_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_NoteToNoteTag"
    ADD CONSTRAINT "_NoteToNoteTag_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."NoteTag"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _PrerequisiteSubject _PrerequisiteSubject_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_PrerequisiteSubject"
    ADD CONSTRAINT "_PrerequisiteSubject_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."SubjectVersion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _PrerequisiteSubject _PrerequisiteSubject_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_PrerequisiteSubject"
    ADD CONSTRAINT "_PrerequisiteSubject_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."SubjectVersion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _PriorityObjectToStudent _PriorityObjectToStudent_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_PriorityObjectToStudent"
    ADD CONSTRAINT "_PriorityObjectToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."PriorityObject"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _PriorityObjectToStudent _PriorityObjectToStudent_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_PriorityObjectToStudent"
    ADD CONSTRAINT "_PriorityObjectToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SubjectClassToSurveyObjectType _SubjectClassToSurveyObjectType_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_SubjectClassToSurveyObjectType"
    ADD CONSTRAINT "_SubjectClassToSurveyObjectType_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."SubjectClass"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _SubjectClassToSurveyObjectType _SubjectClassToSurveyObjectType_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_SubjectClassToSurveyObjectType"
    ADD CONSTRAINT "_SubjectClassToSurveyObjectType_B_fkey" FOREIGN KEY ("B") REFERENCES "khao-thi"."SurveyObjectType"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _gpaScore _gpaScore_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_gpaScore"
    ADD CONSTRAINT "_gpaScore_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."StudentGraduationApplication"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _gpaScore _gpaScore_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_gpaScore"
    ADD CONSTRAINT "_gpaScore_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."StudentSubjectScore"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _supplementaryScore _supplementaryScore_A_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_supplementaryScore"
    ADD CONSTRAINT "_supplementaryScore_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-dao-tao"."StudentGraduationApplication"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _supplementaryScore _supplementaryScore_B_fkey; Type: FK CONSTRAINT; Schema: ql-dao-tao; Owner: admin
--

ALTER TABLE ONLY "ql-dao-tao"."_supplementaryScore"
    ADD CONSTRAINT "_supplementaryScore_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-dao-tao"."StudentSubjectScore"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BoiDuongQuocPhongAnNinh BoiDuongQuocPhongAnNinh_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."BoiDuongQuocPhongAnNinh"
    ADD CONSTRAINT "BoiDuongQuocPhongAnNinh_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CapBac CapBac_capBacId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."CapBac"
    ADD CONSTRAINT "CapBac_capBacId_fkey" FOREIGN KEY ("capBacId") REFERENCES mta."DM_CapBac"("Id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CapBac CapBac_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."CapBac"
    ADD CONSTRAINT "CapBac_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChienDau ChienDau_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."ChienDau"
    ADD CONSTRAINT "ChienDau_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChucVuChinhQuyen ChucVuChinhQuyen_chucVuChinhQuyenId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."ChucVuChinhQuyen"
    ADD CONSTRAINT "ChucVuChinhQuyen_chucVuChinhQuyenId_fkey" FOREIGN KEY ("chucVuChinhQuyenId") REFERENCES mta."DM_ChucVu"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChucVuChinhQuyen ChucVuChinhQuyen_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."ChucVuChinhQuyen"
    ADD CONSTRAINT "ChucVuChinhQuyen_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChucVuDang ChucVuDang_chucVuDangId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."ChucVuDang"
    ADD CONSTRAINT "ChucVuDang_chucVuDangId_fkey" FOREIGN KEY ("chucVuDangId") REFERENCES mta."DM_ChucVu"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChucVuDang ChucVuDang_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."ChucVuDang"
    ADD CONSTRAINT "ChucVuDang_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DanhHieu DanhHieu_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DanhHieu"
    ADD CONSTRAINT "DanhHieu_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DoiTuongChinhSach DoiTuongChinhSach_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."DoiTuongChinhSach"
    ADD CONSTRAINT "DoiTuongChinhSach_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: HocHam HocHam_academicRankTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."HocHam"
    ADD CONSTRAINT "HocHam_academicRankTypeId_fkey" FOREIGN KEY ("academicRankTypeId") REFERENCES mta."DM_HocHam"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: HocHam HocHam_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."HocHam"
    ADD CONSTRAINT "HocHam_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: HocVi HocVi_academicDegreeTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."HocVi"
    ADD CONSTRAINT "HocVi_academicDegreeTypeId_fkey" FOREIGN KEY ("academicDegreeTypeId") REFERENCES mta."DM_HocVi"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: HocVi HocVi_nationalityId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."HocVi"
    ADD CONSTRAINT "HocVi_nationalityId_fkey" FOREIGN KEY ("nationalityId") REFERENCES mta."DM_QuocGia"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: HocVi HocVi_truongId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."HocVi"
    ADD CONSTRAINT "HocVi_truongId_fkey" FOREIGN KEY ("truongId") REFERENCES "ql-ho-so"."DM_TruongDaoTaoBacDH"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: HocVi HocVi_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."HocVi"
    ADD CONSTRAINT "HocVi_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: KeKhaiTaiSan KeKhaiTaiSan_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."KeKhaiTaiSan"
    ADD CONSTRAINT "KeKhaiTaiSan_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: KhenThuong KhenThuong_hinhThucKhenThuongId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."KhenThuong"
    ADD CONSTRAINT "KhenThuong_hinhThucKhenThuongId_fkey" FOREIGN KEY ("hinhThucKhenThuongId") REFERENCES "ql-ho-so"."DM_HinhThucKhenThuongChinhQuyen"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: KhenThuong KhenThuong_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."KhenThuong"
    ADD CONSTRAINT "KhenThuong_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: KyLuat KyLuat_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."KyLuat"
    ADD CONSTRAINT "KyLuat_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: NgoaiNgu NgoaiNgu_ngonNguId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."NgoaiNgu"
    ADD CONSTRAINT "NgoaiNgu_ngonNguId_fkey" FOREIGN KEY ("ngonNguId") REFERENCES mta."DM_NgoaiNgu"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: NgoaiNgu NgoaiNgu_trinhDoId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."NgoaiNgu"
    ADD CONSTRAINT "NgoaiNgu_trinhDoId_fkey" FOREIGN KEY ("trinhDoId") REFERENCES mta."DM_TrinhDoNgoaiNgu"("Id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: NgoaiNgu NgoaiNgu_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."NgoaiNgu"
    ADD CONSTRAINT "NgoaiNgu_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: NuocNgoai NuocNgoai_tenNuocId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."NuocNgoai"
    ADD CONSTRAINT "NuocNgoai_tenNuocId_fkey" FOREIGN KEY ("tenNuocId") REFERENCES mta."DM_QuocGia"("Id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: NuocNgoai NuocNgoai_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."NuocNgoai"
    ADD CONSTRAINT "NuocNgoai_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuaTrinhCongTac QuaTrinhCongTac_chucVuId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhCongTac"
    ADD CONSTRAINT "QuaTrinhCongTac_chucVuId_fkey" FOREIGN KEY ("chucVuId") REFERENCES mta."DM_ChucVu"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QuaTrinhCongTac QuaTrinhCongTac_loaiHinhCongTacId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhCongTac"
    ADD CONSTRAINT "QuaTrinhCongTac_loaiHinhCongTacId_fkey" FOREIGN KEY ("loaiHinhCongTacId") REFERENCES "ql-ho-so"."DM_LoaiHinhCongTac"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QuaTrinhCongTac QuaTrinhCongTac_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhCongTac"
    ADD CONSTRAINT "QuaTrinhCongTac_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuaTrinhCuDiCongTac QuaTrinhCuDiCongTac_chucVuId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhCuDiCongTac"
    ADD CONSTRAINT "QuaTrinhCuDiCongTac_chucVuId_fkey" FOREIGN KEY ("chucVuId") REFERENCES mta."DM_ChucVu"("Id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuaTrinhCuDiCongTac QuaTrinhCuDiCongTac_dM_LoaiTinhTrangCongTacId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhCuDiCongTac"
    ADD CONSTRAINT "QuaTrinhCuDiCongTac_dM_LoaiTinhTrangCongTacId_fkey" FOREIGN KEY ("dM_LoaiTinhTrangCongTacId") REFERENCES "ql-ho-so"."DM_LoaiTinhTrangCongTac"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QuaTrinhCuDiCongTac QuaTrinhCuDiCongTac_dM_NuocCuDiHocTapId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhCuDiCongTac"
    ADD CONSTRAINT "QuaTrinhCuDiCongTac_dM_NuocCuDiHocTapId_fkey" FOREIGN KEY ("dM_NuocCuDiHocTapId") REFERENCES "ql-ho-so"."DM_NuocCuDiHocTap"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QuaTrinhCuDiCongTac QuaTrinhCuDiCongTac_dM_TinhTrangCongTacId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhCuDiCongTac"
    ADD CONSTRAINT "QuaTrinhCuDiCongTac_dM_TinhTrangCongTacId_fkey" FOREIGN KEY ("dM_TinhTrangCongTacId") REFERENCES "ql-ho-so"."DM_TinhTrangCongTac"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QuaTrinhCuDiCongTac QuaTrinhCuDiCongTac_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhCuDiCongTac"
    ADD CONSTRAINT "QuaTrinhCuDiCongTac_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuaTrinhCuDiDaoTao QuaTrinhCuDiDaoTao_dM_TinhTrangDiHocTapId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhCuDiDaoTao"
    ADD CONSTRAINT "QuaTrinhCuDiDaoTao_dM_TinhTrangDiHocTapId_fkey" FOREIGN KEY ("dM_TinhTrangDiHocTapId") REFERENCES "ql-ho-so"."DM_TinhTrangDiHocTap"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QuaTrinhCuDiDaoTao QuaTrinhCuDiDaoTao_loaiId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhCuDiDaoTao"
    ADD CONSTRAINT "QuaTrinhCuDiDaoTao_loaiId_fkey" FOREIGN KEY ("loaiId") REFERENCES "ql-ho-so"."DM_LoaiHinhDiHocTap"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuaTrinhCuDiDaoTao QuaTrinhCuDiDaoTao_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhCuDiDaoTao"
    ADD CONSTRAINT "QuaTrinhCuDiDaoTao_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuaTrinhHocTap QuaTrinhHocTap_chuyenNganhId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhHocTap"
    ADD CONSTRAINT "QuaTrinhHocTap_chuyenNganhId_fkey" FOREIGN KEY ("chuyenNganhId") REFERENCES "ql-ho-so"."DM_ChuyenNganhDaoTaoBacDH"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QuaTrinhHocTap QuaTrinhHocTap_nganhHocId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhHocTap"
    ADD CONSTRAINT "QuaTrinhHocTap_nganhHocId_fkey" FOREIGN KEY ("nganhHocId") REFERENCES "ql-ho-so"."DM_NganhHoc"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuaTrinhHocTap QuaTrinhHocTap_tenTruongId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhHocTap"
    ADD CONSTRAINT "QuaTrinhHocTap_tenTruongId_fkey" FOREIGN KEY ("tenTruongId") REFERENCES "ql-ho-so"."DM_TruongDaoTaoBacDH"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuaTrinhHocTap QuaTrinhHocTap_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhHocTap"
    ADD CONSTRAINT "QuaTrinhHocTap_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuaTrinhLuong QuaTrinhLuong_bacLuongId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhLuong"
    ADD CONSTRAINT "QuaTrinhLuong_bacLuongId_fkey" FOREIGN KEY ("bacLuongId") REFERENCES "ql-ho-so"."DM_BacLuong"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuaTrinhLuong QuaTrinhLuong_ngachId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhLuong"
    ADD CONSTRAINT "QuaTrinhLuong_ngachId_fkey" FOREIGN KEY ("ngachId") REFERENCES "ql-ho-so"."DM_Ngach"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QuaTrinhLuong QuaTrinhLuong_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."QuaTrinhLuong"
    ADD CONSTRAINT "QuaTrinhLuong_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Relative Relative_quanHeThanNhanId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."Relative"
    ADD CONSTRAINT "Relative_quanHeThanNhanId_fkey" FOREIGN KEY ("quanHeThanNhanId") REFERENCES "ql-ho-so"."DM_QuanHeThanNhan"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Relative Relative_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."Relative"
    ADD CONSTRAINT "Relative_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ThuongTat ThuongTat_loaiId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."ThuongTat"
    ADD CONSTRAINT "ThuongTat_loaiId_fkey" FOREIGN KEY ("loaiId") REFERENCES "ql-ho-so"."DM_LoaiThuongTat"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ThuongTat ThuongTat_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."ThuongTat"
    ADD CONSTRAINT "ThuongTat_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TiengDanToc TiengDanToc_danTocId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."TiengDanToc"
    ADD CONSTRAINT "TiengDanToc_danTocId_fkey" FOREIGN KEY ("danTocId") REFERENCES mta."DM_DanToc"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TiengDanToc TiengDanToc_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."TiengDanToc"
    ADD CONSTRAINT "TiengDanToc_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TinHoc TinHoc_dM_TrinhDoTinHocId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."TinHoc"
    ADD CONSTRAINT "TinHoc_dM_TrinhDoTinHocId_fkey" FOREIGN KEY ("dM_TrinhDoTinHocId") REFERENCES mta."DM_TrinhDoTinHoc"("Id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TinHoc TinHoc_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."TinHoc"
    ADD CONSTRAINT "TinHoc_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ToChucXaHoi ToChucXaHoi_tenId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."ToChucXaHoi"
    ADD CONSTRAINT "ToChucXaHoi_tenId_fkey" FOREIGN KEY ("tenId") REFERENCES "ql-ho-so"."DM_ToChucXaHoi"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ToChucXaHoi ToChucXaHoi_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."ToChucXaHoi"
    ADD CONSTRAINT "ToChucXaHoi_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TrinhDoLyLuanChinhTri TrinhDoLyLuanChinhTri_trinhDoId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."TrinhDoLyLuanChinhTri"
    ADD CONSTRAINT "TrinhDoLyLuanChinhTri_trinhDoId_fkey" FOREIGN KEY ("trinhDoId") REFERENCES "ql-ho-so"."DM_TrinhDoLyLuanChinhTri"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TrinhDoLyLuanChinhTri TrinhDoLyLuanChinhTri_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."TrinhDoLyLuanChinhTri"
    ADD CONSTRAINT "TrinhDoLyLuanChinhTri_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TrinhDoQuanLyNhaNuoc TrinhDoQuanLyNhaNuoc_trinhDoId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."TrinhDoQuanLyNhaNuoc"
    ADD CONSTRAINT "TrinhDoQuanLyNhaNuoc_trinhDoId_fkey" FOREIGN KEY ("trinhDoId") REFERENCES "ql-ho-so"."DM_TrinhDoQuanLyNhaNuoc"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TrinhDoQuanLyNhaNuoc TrinhDoQuanLyNhaNuoc_userProfileId_fkey; Type: FK CONSTRAINT; Schema: ql-ho-so; Owner: admin
--

ALTER TABLE ONLY "ql-ho-so"."TrinhDoQuanLyNhaNuoc"
    ADD CONSTRAINT "TrinhDoQuanLyNhaNuoc_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Feedback Feedback_userId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."Feedback"
    ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES mta."DM_NhanVien"("Id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserProfile UserProfile_academicDegreeTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_academicDegreeTypeId_fkey" FOREIGN KEY ("academicDegreeTypeId") REFERENCES mta."DM_HocVi"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_academicRankTypeId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_academicRankTypeId_fkey" FOREIGN KEY ("academicRankTypeId") REFERENCES mta."DM_HocHam"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_chiHuyQuanLyId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_chiHuyQuanLyId_fkey" FOREIGN KEY ("chiHuyQuanLyId") REFERENCES "ql-ho-so"."DM_ChiHuyQuanLy"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_chucVuChinhQuyenId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_chucVuChinhQuyenId_fkey" FOREIGN KEY ("chucVuChinhQuyenId") REFERENCES mta."DM_ChucVu"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_chuyenMonKyThuatId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_chuyenMonKyThuatId_fkey" FOREIGN KEY ("chuyenMonKyThuatId") REFERENCES "ql-ho-so"."DM_ChuyenMonKyThuat"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_communeCurrentAddressId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_communeCurrentAddressId_fkey" FOREIGN KEY ("communeCurrentAddressId") REFERENCES mta."DM_XaPhuong"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_communeHometownId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_communeHometownId_fkey" FOREIGN KEY ("communeHometownId") REFERENCES mta."DM_XaPhuong"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_communeOfBirthId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_communeOfBirthId_fkey" FOREIGN KEY ("communeOfBirthId") REFERENCES mta."DM_XaPhuong"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_communePermanentAddressId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_communePermanentAddressId_fkey" FOREIGN KEY ("communePermanentAddressId") REFERENCES mta."DM_XaPhuong"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_dM_ChucDanhCMNVGiangVienId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_dM_ChucDanhCMNVGiangVienId_fkey" FOREIGN KEY ("dM_ChucDanhCMNVGiangVienId") REFERENCES "ql-ho-so"."DM_ChucDanhCMNVGiangVien"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_dM_ChucDanhCMNVKySuId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_dM_ChucDanhCMNVKySuId_fkey" FOREIGN KEY ("dM_ChucDanhCMNVKySuId") REFERENCES "ql-ho-so"."DM_ChucDanhCMNVKySu"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_dM_ChucDanhCMNVNghienCuuVienId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_dM_ChucDanhCMNVNghienCuuVienId_fkey" FOREIGN KEY ("dM_ChucDanhCMNVNghienCuuVienId") REFERENCES "ql-ho-so"."DM_ChucDanhCMNVNghienCuuVien"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_dM_HinhThucKhenThuongDangId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_dM_HinhThucKhenThuongDangId_fkey" FOREIGN KEY ("dM_HinhThucKhenThuongDangId") REFERENCES "ql-ho-so"."DM_HinhThucKhenThuongDang"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_dM_XepLoaiDanhGiaCanBoId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_dM_XepLoaiDanhGiaCanBoId_fkey" FOREIGN KEY ("dM_XepLoaiDanhGiaCanBoId") REFERENCES "ql-ho-so"."DM_XepLoaiDanhGiaCanBo"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_dM_XepLoaiDanhGiaChatLuongDangVienId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_dM_XepLoaiDanhGiaChatLuongDangVienId_fkey" FOREIGN KEY ("dM_XepLoaiDanhGiaChatLuongDangVienId") REFERENCES "ql-ho-so"."DM_XepLoaiDanhGiaChatLuongDangVien"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_districtCurrentAddressId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_districtCurrentAddressId_fkey" FOREIGN KEY ("districtCurrentAddressId") REFERENCES mta."DM_QuanHuyen"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_districtHometownId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_districtHometownId_fkey" FOREIGN KEY ("districtHometownId") REFERENCES mta."DM_QuanHuyen"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_districtOfBirthId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_districtOfBirthId_fkey" FOREIGN KEY ("districtOfBirthId") REFERENCES mta."DM_QuanHuyen"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_districtPermanentAddressId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_districtPermanentAddressId_fkey" FOREIGN KEY ("districtPermanentAddressId") REFERENCES mta."DM_QuanHuyen"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_ethnicityId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_ethnicityId_fkey" FOREIGN KEY ("ethnicityId") REFERENCES mta."DM_DanToc"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_genderId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES mta."DM_GioiTinh"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_groupId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ql-nguoi-dung"."Group"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_levelId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES mta."DM_ChucDanh"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_nationalityId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_nationalityId_fkey" FOREIGN KEY ("nationalityId") REFERENCES mta."DM_QuocGia"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_newCommuneCurrentAddressId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_newCommuneCurrentAddressId_fkey" FOREIGN KEY ("newCommuneCurrentAddressId") REFERENCES mta."DM_XaPhuong_New"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_newCommuneHometownId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_newCommuneHometownId_fkey" FOREIGN KEY ("newCommuneHometownId") REFERENCES mta."DM_XaPhuong_New"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_newCommuneOfBirthId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_newCommuneOfBirthId_fkey" FOREIGN KEY ("newCommuneOfBirthId") REFERENCES mta."DM_XaPhuong_New"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_newCommunePermanentAddressId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_newCommunePermanentAddressId_fkey" FOREIGN KEY ("newCommunePermanentAddressId") REFERENCES mta."DM_XaPhuong_New"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_newProvinceCurrentAddressId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_newProvinceCurrentAddressId_fkey" FOREIGN KEY ("newProvinceCurrentAddressId") REFERENCES mta."DM_Tinh_New"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_newProvinceHometownId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_newProvinceHometownId_fkey" FOREIGN KEY ("newProvinceHometownId") REFERENCES mta."DM_Tinh_New"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_newProvinceOfBirthId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_newProvinceOfBirthId_fkey" FOREIGN KEY ("newProvinceOfBirthId") REFERENCES mta."DM_Tinh_New"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_newProvincePermanentAddressId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_newProvincePermanentAddressId_fkey" FOREIGN KEY ("newProvincePermanentAddressId") REFERENCES mta."DM_Tinh_New"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_nhomMauId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_nhomMauId_fkey" FOREIGN KEY ("nhomMauId") REFERENCES "ql-ho-so"."DM_NhomMau"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_positionCPVId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_positionCPVId_fkey" FOREIGN KEY ("positionCPVId") REFERENCES mta."DM_ChucVu"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_provinceCurrentAddressId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_provinceCurrentAddressId_fkey" FOREIGN KEY ("provinceCurrentAddressId") REFERENCES mta."DM_Tinh"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_provinceHometownId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_provinceHometownId_fkey" FOREIGN KEY ("provinceHometownId") REFERENCES mta."DM_Tinh"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_provinceOfBirthId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_provinceOfBirthId_fkey" FOREIGN KEY ("provinceOfBirthId") REFERENCES mta."DM_Tinh"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_provincePermanentAddressId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_provincePermanentAddressId_fkey" FOREIGN KEY ("provincePermanentAddressId") REFERENCES mta."DM_Tinh"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_rankId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES mta."DM_CapBac"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_religionId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_religionId_fkey" FOREIGN KEY ("religionId") REFERENCES mta."DM_TonGiao"("Id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_sucKhoeId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_sucKhoeId_fkey" FOREIGN KEY ("sucKhoeId") REFERENCES "ql-ho-so"."DM_SucKhoe"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_tinhTrangHonNhanId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_tinhTrangHonNhanId_fkey" FOREIGN KEY ("tinhTrangHonNhanId") REFERENCES "ql-ho-so"."DM_TinhTrangHonNhan"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_trangThaiLamViecId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_trangThaiLamViecId_fkey" FOREIGN KEY ("trangThaiLamViecId") REFERENCES "ql-ho-so"."DM_TrangThaiLamViec"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserProfile UserProfile_trinhDoHocVanId_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."UserProfile"
    ADD CONSTRAINT "UserProfile_trinhDoHocVanId_fkey" FOREIGN KEY ("trinhDoHocVanId") REFERENCES "ql-ho-so"."DM_TrinhDoHocVan"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: _GroupToRole _GroupToRole_A_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."_GroupToRole"
    ADD CONSTRAINT "_GroupToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-nguoi-dung"."Group"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _GroupToRole _GroupToRole_B_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."_GroupToRole"
    ADD CONSTRAINT "_GroupToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-nguoi-dung"."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _PermissionToRole _PermissionToRole_A_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."_PermissionToRole"
    ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "ql-nguoi-dung"."Permission"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _PermissionToRole _PermissionToRole_B_fkey; Type: FK CONSTRAINT; Schema: ql-nguoi-dung; Owner: admin
--

ALTER TABLE ONLY "ql-nguoi-dung"."_PermissionToRole"
    ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "ql-nguoi-dung"."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CitationMessage CitationMessage_messageId_fkey; Type: FK CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."CitationMessage"
    ADD CONSTRAINT "CitationMessage_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "tro-ly-ao"."Message"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Conversation Conversation_sessionId_fkey; Type: FK CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."Conversation"
    ADD CONSTRAINT "Conversation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "tro-ly-ao"."UserSession"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Conversation Conversation_topicId_fkey; Type: FK CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."Conversation"
    ADD CONSTRAINT "Conversation_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "tro-ly-ao"."Topic"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Conversation Conversation_userId_fkey; Type: FK CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."Conversation"
    ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DocumentTopic DocumentTopic_documentId_fkey; Type: FK CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."DocumentTopic"
    ADD CONSTRAINT "DocumentTopic_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "tro-ly-ao"."Document"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DocumentTopic DocumentTopic_topicId_fkey; Type: FK CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."DocumentTopic"
    ADD CONSTRAINT "DocumentTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "tro-ly-ao"."Topic"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Document Document_approvedById_fkey; Type: FK CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."Document"
    ADD CONSTRAINT "Document_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_classificationId_fkey; Type: FK CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."Document"
    ADD CONSTRAINT "Document_classificationId_fkey" FOREIGN KEY ("classificationId") REFERENCES "tro-ly-ao"."DocumentClassification"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_uploadedById_fkey; Type: FK CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."Document"
    ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FAQ FAQ_approvedById_fkey; Type: FK CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."FAQ"
    ADD CONSTRAINT "FAQ_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FAQ FAQ_topicId_fkey; Type: FK CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."FAQ"
    ADD CONSTRAINT "FAQ_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "tro-ly-ao"."Topic"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FAQ FAQ_uploadedById_fkey; Type: FK CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."FAQ"
    ADD CONSTRAINT "FAQ_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "ql-nguoi-dung"."UserProfile"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Message Message_conversationId_fkey; Type: FK CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."Message"
    ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "tro-ly-ao"."Conversation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Prompt Prompt_topicId_fkey; Type: FK CONSTRAINT; Schema: tro-ly-ao; Owner: admin
--

ALTER TABLE ONLY "tro-ly-ao"."Prompt"
    ADD CONSTRAINT "Prompt_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "tro-ly-ao"."Topic"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict nmBVKmtFxWYSbWDahL0wfSCjv2cq3cxiht22pXNR9GojSqLCyCqkgwReu4NiSNS

