/*
  Warnings:

  - You are about to drop the `AcademicDegreeType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AcademicRankType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Commune` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Ethnicity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Level` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Nationality` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Organization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrganizationType` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PositionCPV` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Province` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Rank` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RegistrationArea` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Religion` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `organizationId` on table `StaffHistory` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ql-danh-muc"."Commune" DROP CONSTRAINT "Commune_provinceId_fkey";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."Organization" DROP CONSTRAINT "Organization_parentId_fkey";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."Organization" DROP CONSTRAINT "Organization_typeId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."Curriculum" DROP CONSTRAINT "Curriculum_managementOrganizationId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" DROP CONSTRAINT "FixedClass_managementOrganizationId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."Lecturer" DROP CONSTRAINT "Lecturer_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."LecturerHistory" DROP CONSTRAINT "LecturerHistory_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."Staff" DROP CONSTRAINT "Staff_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."StaffHistory" DROP CONSTRAINT "StaffHistory_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."Student" DROP CONSTRAINT "Student_registrationAreaId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."Subject" DROP CONSTRAINT "Subject_managementOrganizationId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."SubjectVersion" DROP CONSTRAINT "SubjectVersion_managementOrganizationId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."TrainingField" DROP CONSTRAINT "TrainingField_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ql-dao-tao"."TrainingMajor" DROP CONSTRAINT "TrainingMajor_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_academicDegreeTypeId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_academicRankTypeId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_communeHometownId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_ethnicityId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_levelId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_nationalityId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_positionCPVId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_provinceHometownId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_rankId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_religionId_fkey";

-- AlterTable
ALTER TABLE "ql-dao-tao"."StaffHistory" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD COLUMN     "districtHometownId" TEXT;

-- DropTable
DROP TABLE "ql-danh-muc"."AcademicDegreeType";

-- DropTable
DROP TABLE "ql-danh-muc"."AcademicRankType";

-- DropTable
DROP TABLE "ql-danh-muc"."Commune";

-- DropTable
DROP TABLE "ql-danh-muc"."Ethnicity";

-- DropTable
DROP TABLE "ql-danh-muc"."Level";

-- DropTable
DROP TABLE "ql-danh-muc"."Nationality";

-- DropTable
DROP TABLE "ql-danh-muc"."Organization";

-- DropTable
DROP TABLE "ql-danh-muc"."OrganizationType";

-- DropTable
DROP TABLE "ql-danh-muc"."PositionCPV";

-- DropTable
DROP TABLE "ql-danh-muc"."Province";

-- DropTable
DROP TABLE "ql-danh-muc"."Rank";

-- DropTable
DROP TABLE "ql-danh-muc"."RegistrationArea";

-- DropTable
DROP TABLE "ql-danh-muc"."Religion";

-- CreateTable
CREATE TABLE "ql-danh-muc"."DM_CapBac" (
    "Id" TEXT NOT NULL,
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
CREATE TABLE "ql-danh-muc"."DM_ChucDanh" (
    "Id" TEXT NOT NULL,
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
CREATE TABLE "ql-danh-muc"."DM_ChucVu" (
    "Id" TEXT NOT NULL,
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

    CONSTRAINT "DM_ChucVu_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."DM_HocHam" (
    "Id" TEXT NOT NULL,
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
CREATE TABLE "ql-danh-muc"."DM_HocVi" (
    "Id" TEXT NOT NULL,
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
CREATE TABLE "ql-danh-muc"."DM_ChungChiTinHoc" (
    "Id" TEXT NOT NULL,
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

    CONSTRAINT "DM_ChungChiTinHoc_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."DM_DanToc" (
    "Id" TEXT NOT NULL,
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
CREATE TABLE "ql-danh-muc"."DM_DonVi" (
    "Id" TEXT NOT NULL,
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
    "sParentId" TEXT,
    "sTruongDonVi" TEXT,
    "sChucNangNhiemVu" TEXT,
    "sDiaChi" TEXT,

    CONSTRAINT "DM_DonVi_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."DM_DonViHanhChinh" (
    "Id" TEXT NOT NULL,
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
CREATE TABLE "ql-danh-muc"."DM_KhuVuc_DiaLy" (
    "Id" TEXT NOT NULL,
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
CREATE TABLE "ql-danh-muc"."DM_NgoaiNgu" (
    "Id" TEXT NOT NULL,
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
CREATE TABLE "ql-danh-muc"."DM_TonGiao" (
    "Id" TEXT NOT NULL,
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
CREATE TABLE "ql-danh-muc"."DM_TrinhDoNgoaiNgu" (
    "Id" TEXT NOT NULL,
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
CREATE TABLE "ql-danh-muc"."DM_TrinhDoTinHoc" (
    "Id" TEXT NOT NULL,
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
CREATE TABLE "ql-danh-muc"."DM_UngDung" (
    "Id" TEXT NOT NULL,
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
    "sLogoUrl" TEXT,
    "sUrl" TEXT,
    "bTatCaNguoiDung" BOOLEAN DEFAULT false,
    "bTatCaNhanVien" BOOLEAN DEFAULT false,
    "sClientId" TEXT,
    "sClientSecret" TEXT,
    "sRedirectDefault" TEXT,

    CONSTRAINT "DM_UngDung_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."DM_NhanVien" (
    "Id" TEXT NOT NULL,
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
    "sHoVaDem" TEXT,
    "sTenDayDu" TEXT,
    "dNgaySinh" TIMESTAMP(3),
    "iGioiTinh" INTEGER,
    "sDiaChi" TEXT,
    "sSDTDiDong" TEXT,
    "sEmail" TEXT,
    "bLaNguoiDung" BOOLEAN,
    "sDM_DonViId" TEXT,
    "sDM_ViTriCongViecId" TEXT,
    "sQuanlyTrucTiepId" TEXT,
    "sAvatarId" TEXT,

    CONSTRAINT "DM_NhanVien_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."DM_NhomNguoiDung" (
    "Id" TEXT NOT NULL,
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
CREATE TABLE "ql-danh-muc"."DM_NhomUngDung" (
    "Id" TEXT NOT NULL,
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
CREATE TABLE "ql-danh-muc"."DM_QuocGia" (
    "Id" TEXT NOT NULL,
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
CREATE TABLE "ql-danh-muc"."DM_Tinh" (
    "Id" TEXT NOT NULL,
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
    "sDM_QuocGiaId" TEXT,
    "iDM_KhuVucDiaLy_Id" TEXT,
    "iDM_DonViHanhChinhId" TEXT,

    CONSTRAINT "DM_Tinh_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."DM_QuanHuyen" (
    "Id" TEXT NOT NULL,
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
    "sDM_TinhId" TEXT,
    "sDM_Tinh_Ma" TEXT,
    "iDM_DonViHanhChinhId" TEXT,

    CONSTRAINT "DM_QuanHuyen_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."DM_XaPhuong" (
    "Id" TEXT NOT NULL,
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
    "sDM_TinhId" TEXT,
    "sDM_QuanHuyenId" TEXT,
    "sDM_QuanHuyen_Ma" TEXT,
    "dM_TinhId" TEXT,
    "iDM_DonViHanhChinhId" TEXT,

    CONSTRAINT "DM_XaPhuong_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."DM_VaiTro" (
    "Id" TEXT NOT NULL,
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

    CONSTRAINT "DM_VaiTro_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."DM_ViTriCongViec" (
    "Id" TEXT NOT NULL,
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
    "sDM_ChucDanhId" TEXT,
    "sDM_NhomViTriId" TEXT NOT NULL,

    CONSTRAINT "DM_ViTriCongViec_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."NguoiDungTrongNhom" (
    "Id" TEXT NOT NULL,
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
    "sDM_NhomNguoiDungId" TEXT,
    "sDM_NhanVienId" TEXT,

    CONSTRAINT "NguoiDungTrongNhom_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."NhatKyHoatDong" (
    "Id" TEXT NOT NULL,
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
    "sNhanVienId" TEXT,
    "dLogTime" TIMESTAMP(3),
    "iState" INTEGER,
    "sObjectName" TEXT,
    "sReferenceName" TEXT,
    "sDescription" TEXT,
    "sIPAddress" TEXT,

    CONSTRAINT "NhatKyHoatDong_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."Policy" (
    "Id" TEXT NOT NULL,
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
    "bXacThuc2YeuTo" BOOLEAN DEFAULT false,
    "bGioiHanTCIP" BOOLEAN DEFAULT false,
    "bGioiHanTG" BOOLEAN DEFAULT false,
    "iApDungChoUD" INTEGER DEFAULT 0,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."Quyen_VaiTro" (
    "Id" TEXT NOT NULL,
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
    "sTenChucNang" TEXT DEFAULT 'N''Tên quyền''',
    "sDM_NhanVienId" TEXT,
    "sDM_VaiTroId" TEXT,
    "fValue" INTEGER,

    CONSTRAINT "Quyen_VaiTro_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."TaiKhoan" (
    "Id" TEXT NOT NULL,
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
    "sUserName" TEXT,
    "sAvatar" TEXT,
    "sDM_NhanVienId" TEXT,

    CONSTRAINT "TaiKhoan_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ql-danh-muc"."VaiTroTrongNhom" (
    "Id" TEXT NOT NULL,
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
    "sDM_NhomNguoiDungId" TEXT,
    "sDM_VaiTroId" TEXT,

    CONSTRAINT "VaiTroTrongNhom_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE INDEX "IX_DM_DonVi_iParentId" ON "ql-danh-muc"."DM_DonVi"("sParentId");

-- CreateIndex
CREATE INDEX "IX_DM_DonVi_sMa" ON "ql-danh-muc"."DM_DonVi"("sMa");

-- CreateIndex
CREATE INDEX "IX_DM_NhanVien_sDM_DonViId" ON "ql-danh-muc"."DM_NhanVien"("sDM_DonViId");

-- CreateIndex
CREATE INDEX "IX_DM_NhanVien_sDM_ViTriCongViecId" ON "ql-danh-muc"."DM_NhanVien"("sDM_ViTriCongViecId");

-- CreateIndex
CREATE INDEX "IX_DM_NhanVien_sEmail" ON "ql-danh-muc"."DM_NhanVien"("sEmail");

-- CreateIndex
CREATE INDEX "IX_DM_NhanVien_sSDTDiDong" ON "ql-danh-muc"."DM_NhanVien"("sSDTDiDong");

-- CreateIndex
CREATE INDEX "IX_DM_Tinh_iDM_QuocGiaId" ON "ql-danh-muc"."DM_Tinh"("sDM_QuocGiaId");

-- CreateIndex
CREATE INDEX "IX_DM_QuanHuyen_iDM_TinhId" ON "ql-danh-muc"."DM_QuanHuyen"("sDM_TinhId");

-- CreateIndex
CREATE UNIQUE INDEX "NguoiDungTrongNhom_sDM_NhomNguoiDungId_sDM_NhanVienId_key" ON "ql-danh-muc"."NguoiDungTrongNhom"("sDM_NhomNguoiDungId", "sDM_NhanVienId");

-- CreateIndex
CREATE UNIQUE INDEX "TaiKhoan_sDM_NhanVienId_key" ON "ql-danh-muc"."TaiKhoan"("sDM_NhanVienId");

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."FixedClass" ADD CONSTRAINT "FixedClass_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "ql-danh-muc"."DM_DonVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Curriculum" ADD CONSTRAINT "Curriculum_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "ql-danh-muc"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Subject" ADD CONSTRAINT "Subject_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "ql-danh-muc"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."SubjectVersion" ADD CONSTRAINT "SubjectVersion_managementOrganizationId_fkey" FOREIGN KEY ("managementOrganizationId") REFERENCES "ql-danh-muc"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingField" ADD CONSTRAINT "TrainingField_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ql-danh-muc"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."TrainingMajor" ADD CONSTRAINT "TrainingMajor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ql-danh-muc"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Student" ADD CONSTRAINT "Student_registrationAreaId_fkey" FOREIGN KEY ("registrationAreaId") REFERENCES "ql-danh-muc"."DM_KhuVuc_DiaLy"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_nationalityId_fkey" FOREIGN KEY ("nationalityId") REFERENCES "ql-danh-muc"."DM_QuocGia"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_religionId_fkey" FOREIGN KEY ("religionId") REFERENCES "ql-danh-muc"."DM_TonGiao"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_ethnicityId_fkey" FOREIGN KEY ("ethnicityId") REFERENCES "ql-danh-muc"."DM_DanToc"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_provinceHometownId_fkey" FOREIGN KEY ("provinceHometownId") REFERENCES "ql-danh-muc"."DM_Tinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_districtHometownId_fkey" FOREIGN KEY ("districtHometownId") REFERENCES "ql-danh-muc"."DM_QuanHuyen"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_communeHometownId_fkey" FOREIGN KEY ("communeHometownId") REFERENCES "ql-danh-muc"."DM_XaPhuong"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "ql-danh-muc"."DM_CapBac"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_academicDegreeTypeId_fkey" FOREIGN KEY ("academicDegreeTypeId") REFERENCES "ql-danh-muc"."DM_HocVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_academicRankTypeId_fkey" FOREIGN KEY ("academicRankTypeId") REFERENCES "ql-danh-muc"."DM_HocHam"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "ql-danh-muc"."DM_ChucDanh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" ADD CONSTRAINT "UserProfile_positionCPVId_fkey" FOREIGN KEY ("positionCPVId") REFERENCES "ql-danh-muc"."DM_ChucVu"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DM_DonVi" ADD CONSTRAINT "FK_DM_DonVi_iParentId_DM_DonVi_Id" FOREIGN KEY ("sParentId") REFERENCES "ql-danh-muc"."DM_DonVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DM_NhanVien" ADD CONSTRAINT "FK_DM_NhanVien_DM_DonVi" FOREIGN KEY ("sDM_DonViId") REFERENCES "ql-danh-muc"."DM_DonVi"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DM_NhanVien" ADD CONSTRAINT "FK_DM_NhanVien_DM_ViTriCongViec" FOREIGN KEY ("sDM_ViTriCongViecId") REFERENCES "ql-danh-muc"."DM_ViTriCongViec"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DM_Tinh" ADD CONSTRAINT "DM_Tinh_sDM_QuocGiaId_fkey" FOREIGN KEY ("sDM_QuocGiaId") REFERENCES "ql-danh-muc"."DM_QuocGia"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DM_Tinh" ADD CONSTRAINT "DM_Tinh_iDM_KhuVucDiaLy_Id_fkey" FOREIGN KEY ("iDM_KhuVucDiaLy_Id") REFERENCES "ql-danh-muc"."DM_KhuVuc_DiaLy"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DM_Tinh" ADD CONSTRAINT "DM_Tinh_iDM_DonViHanhChinhId_fkey" FOREIGN KEY ("iDM_DonViHanhChinhId") REFERENCES "ql-danh-muc"."DM_DonViHanhChinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DM_QuanHuyen" ADD CONSTRAINT "DM_QuanHuyen_sDM_TinhId_fkey" FOREIGN KEY ("sDM_TinhId") REFERENCES "ql-danh-muc"."DM_Tinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DM_QuanHuyen" ADD CONSTRAINT "DM_QuanHuyen_iDM_DonViHanhChinhId_fkey" FOREIGN KEY ("iDM_DonViHanhChinhId") REFERENCES "ql-danh-muc"."DM_DonViHanhChinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DM_XaPhuong" ADD CONSTRAINT "DM_XaPhuong_sDM_QuanHuyenId_fkey" FOREIGN KEY ("sDM_QuanHuyenId") REFERENCES "ql-danh-muc"."DM_QuanHuyen"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DM_XaPhuong" ADD CONSTRAINT "DM_XaPhuong_dM_TinhId_fkey" FOREIGN KEY ("dM_TinhId") REFERENCES "ql-danh-muc"."DM_Tinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DM_XaPhuong" ADD CONSTRAINT "DM_XaPhuong_iDM_DonViHanhChinhId_fkey" FOREIGN KEY ("iDM_DonViHanhChinhId") REFERENCES "ql-danh-muc"."DM_DonViHanhChinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."DM_ViTriCongViec" ADD CONSTRAINT "FK_DM_ViTriCongViec_DM_ChucDanh" FOREIGN KEY ("sDM_ChucDanhId") REFERENCES "ql-danh-muc"."DM_ChucDanh"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."NguoiDungTrongNhom" ADD CONSTRAINT "FK_NguoiDungTrongNhom_DM_NhomNguoiDung" FOREIGN KEY ("sDM_NhomNguoiDungId") REFERENCES "ql-danh-muc"."DM_NhomNguoiDung"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."NguoiDungTrongNhom" ADD CONSTRAINT "FK_NguoiDungTrongNhom_DM_NhanVien" FOREIGN KEY ("sDM_NhanVienId") REFERENCES "ql-danh-muc"."DM_NhanVien"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."NhatKyHoatDong" ADD CONSTRAINT "FK_Quyen_VaiTro_DM_NhanVien" FOREIGN KEY ("sNhanVienId") REFERENCES "ql-danh-muc"."DM_NhanVien"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."Quyen_VaiTro" ADD CONSTRAINT "FK_Quyen_VaiTro_DM_NhanVien" FOREIGN KEY ("sDM_NhanVienId") REFERENCES "ql-danh-muc"."DM_NhanVien"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."Quyen_VaiTro" ADD CONSTRAINT "FK_Quyen_VaiTro_DM_VaiTro" FOREIGN KEY ("sDM_VaiTroId") REFERENCES "ql-danh-muc"."DM_VaiTro"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."TaiKhoan" ADD CONSTRAINT "FK_TaiKhoan_DM_NhanVien" FOREIGN KEY ("sDM_NhanVienId") REFERENCES "ql-danh-muc"."DM_NhanVien"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."VaiTroTrongNhom" ADD CONSTRAINT "VaiTroTrongNhom_sDM_NhomNguoiDungId_fkey" FOREIGN KEY ("sDM_NhomNguoiDungId") REFERENCES "ql-danh-muc"."DM_NhomNguoiDung"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-danh-muc"."VaiTroTrongNhom" ADD CONSTRAINT "FK_VaiTroTrongNhom_DM_VaiTro" FOREIGN KEY ("sDM_VaiTroId") REFERENCES "ql-danh-muc"."DM_VaiTro"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Lecturer" ADD CONSTRAINT "Lecturer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ql-danh-muc"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."LecturerHistory" ADD CONSTRAINT "LecturerHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ql-danh-muc"."DM_DonVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."Staff" ADD CONSTRAINT "Staff_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ql-danh-muc"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ql-dao-tao"."StaffHistory" ADD CONSTRAINT "StaffHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ql-danh-muc"."DM_DonVi"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
