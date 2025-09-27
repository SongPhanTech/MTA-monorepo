CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "ql-dao-tao"."ClassSchedule"
ADD CONSTRAINT no_class_conflict
EXCLUDE USING gist (
  "subjectClassId" WITH =,
  "classDate" WITH =,
  int4range("startPeriod", "endPeriod", '[]') WITH &&
);

ALTER TABLE "ql-dao-tao"."ClassSchedule"
ADD CONSTRAINT no_room_conflict
EXCLUDE USING gist (
  "roomId" WITH =,
  "classDate" WITH =,
  int4range("startPeriod", "endPeriod", '[]') WITH &&
);

ALTER TABLE "ql-dao-tao"."ClassSchedule"
ADD CONSTRAINT no_lecturer_conflict
EXCLUDE USING gist (
  "lecturerId" WITH =,
  "classDate" WITH =,
  int4range("startPeriod", "endPeriod", '[]') WITH &&
);

ALTER TABLE "ql-dao-tao"."ClassSchedule"
ADD CONSTRAINT no_extra_lecturer_conflict
EXCLUDE USING gist (
  "extraLecturerId" WITH =,
  "classDate" WITH =,
  int4range("startPeriod", "endPeriod", '[]') WITH &&
);