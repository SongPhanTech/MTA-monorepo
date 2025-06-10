/*
  Warnings:

  - You are about to drop the column `documentPath` on the `TrainingBlockSubject` table. All the data in the column will be lost.
  - You are about to drop the column `information` on the `TrainingBlockSubject` table. All the data in the column will be lost.
  - You are about to drop the column `renderPath` on the `TrainingBlockSubject` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ql-dao-tao"."TrainingBlockSubject" DROP COLUMN "documentPath",
DROP COLUMN "information",
DROP COLUMN "renderPath";

-- AlterTable
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD COLUMN     "fullname" TEXT;

CREATE OR REPLACE FUNCTION update_fullname() RETURNS TRIGGER AS $$
BEGIN
  NEW."fullname" := NEW."lastName" || ' ' || NEW."firstName";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fullname_trigger ON "ql-nguoi-dung"."UserProfile";
CREATE TRIGGER fullname_trigger
BEFORE INSERT OR UPDATE ON "ql-nguoi-dung"."UserProfile"
FOR EACH ROW EXECUTE FUNCTION update_fullname();