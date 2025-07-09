-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" ADD CONSTRAINT "FixedClass_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Curriculum" ADD CONSTRAINT "Curriculum_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Subject" ADD CONSTRAINT "Subject_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectVersion" ADD CONSTRAINT "SubjectVersion_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingField" ADD CONSTRAINT "TrainingField_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingMajor" ADD CONSTRAINT "TrainingMajor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_registrationAreaId_fkey" FOREIGN KEY ("registrationAreaId") REFERENCES "mta"."DM_KhuVuc_DiaLy"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_provinceCurrentAddressId_fkey" FOREIGN KEY ("provinceCurrentAddressId") REFERENCES "mta"."DM_Tinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_districtCurrentAddressId_fkey" FOREIGN KEY ("districtCurrentAddressId") REFERENCES "mta"."DM_QuanHuyen"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_communeCurrentAddressId_fkey" FOREIGN KEY ("communeCurrentAddressId") REFERENCES "mta"."DM_XaPhuong"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_provinceOfBirthId_fkey" FOREIGN KEY ("provinceOfBirthId") REFERENCES "mta"."DM_Tinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_districtOfBirthId_fkey" FOREIGN KEY ("districtOfBirthId") REFERENCES "mta"."DM_QuanHuyen"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_communeOfBirthId_fkey" FOREIGN KEY ("communeOfBirthId") REFERENCES "mta"."DM_XaPhuong"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_provincePermanentAddressId_fkey" FOREIGN KEY ("provincePermanentAddressId") REFERENCES "mta"."DM_Tinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_districtPermanentAddressId_fkey" FOREIGN KEY ("districtPermanentAddressId") REFERENCES "mta"."DM_QuanHuyen"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_communePermanentAddressId_fkey" FOREIGN KEY ("communePermanentAddressId") REFERENCES "mta"."DM_XaPhuong"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "mta"."DM_CapBac"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_academicDegreeTypeId_fkey" FOREIGN KEY ("academicDegreeTypeId") REFERENCES "mta"."DM_HocVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_academicRankTypeId_fkey" FOREIGN KEY ("academicRankTypeId") REFERENCES "mta"."DM_HocHam"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "mta"."DM_ChucDanh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_positionCPVId_fkey" FOREIGN KEY ("positionCPVId") REFERENCES "mta"."DM_ChucVu"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Lecturer" ADD CONSTRAINT "Lecturer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."LecturerHistory" ADD CONSTRAINT "LecturerHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Staff" ADD CONSTRAINT "Staff_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StaffHistory" ADD CONSTRAINT "StaffHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
