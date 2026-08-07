-- Thêm đối tượng khảo sát: Cao học dân sự / Cao học quân sự
ALTER TYPE "khao-thi"."SurveyObject" ADD VALUE IF NOT EXISTS 'MILITARY_GRADUATE_STUDENT';
ALTER TYPE "khao-thi"."SurveyObject" ADD VALUE IF NOT EXISTS 'CIVILIAN_GRADUATE_STUDENT';
