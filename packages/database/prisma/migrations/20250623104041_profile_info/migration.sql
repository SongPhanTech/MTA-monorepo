-- AlterTable
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "communeOfBirthId" TEXT,
ADD COLUMN     "communePermanentAddressId" TEXT,
ADD COLUMN     "communecurrentAddressId" TEXT,
ADD COLUMN     "currentAddress" TEXT,
ADD COLUMN     "districtOfBirthId" TEXT,
ADD COLUMN     "districtPermanentAddressId" TEXT,
ADD COLUMN     "districtcurrentAddressId" TEXT,
ADD COLUMN     "healthInsuranceNumber" TEXT,
ADD COLUMN     "provinceCurrentAddressId" TEXT,
ADD COLUMN     "provinceOfBirthId" TEXT,
ADD COLUMN     "provincePermanentAddressId" TEXT;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_provinceCurrentAddressId_fkey" FOREIGN KEY ("provinceCurrentAddressId") REFERENCES "ql-danh-muc"."DM_Tinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_districtcurrentAddressId_fkey" FOREIGN KEY ("districtcurrentAddressId") REFERENCES "ql-danh-muc"."DM_QuanHuyen"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_communecurrentAddressId_fkey" FOREIGN KEY ("communecurrentAddressId") REFERENCES "ql-danh-muc"."DM_XaPhuong"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_provinceOfBirthId_fkey" FOREIGN KEY ("provinceOfBirthId") REFERENCES "ql-danh-muc"."DM_Tinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_districtOfBirthId_fkey" FOREIGN KEY ("districtOfBirthId") REFERENCES "ql-danh-muc"."DM_QuanHuyen"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_communeOfBirthId_fkey" FOREIGN KEY ("communeOfBirthId") REFERENCES "ql-danh-muc"."DM_XaPhuong"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_provincePermanentAddressId_fkey" FOREIGN KEY ("provincePermanentAddressId") REFERENCES "ql-danh-muc"."DM_Tinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_districtPermanentAddressId_fkey" FOREIGN KEY ("districtPermanentAddressId") REFERENCES "ql-danh-muc"."DM_QuanHuyen"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_communePermanentAddressId_fkey" FOREIGN KEY ("communePermanentAddressId") REFERENCES "ql-danh-muc"."DM_XaPhuong"("Id") ON DELETE SET NULL ON UPDATE CASCADE;
