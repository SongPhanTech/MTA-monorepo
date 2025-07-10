/*
  Warnings:

  - You are about to drop the `DM_CapBac` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_ChucDanh` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_ChucVu` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_ChungChiTinHoc` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_DanToc` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_DonVi` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_DonViHanhChinh` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_HocHam` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_HocVi` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_KhuVuc_DiaLy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_NgoaiNgu` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_NhanVien` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_NhomNguoiDung` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_NhomUngDung` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_QuanHuyen` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_QuocGia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_Tinh` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_TonGiao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_TrinhDoNgoaiNgu` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_TrinhDoTinHoc` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_UngDung` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_VaiTro` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_ViTriCongViec` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DM_XaPhuong` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NguoiDungTrongNhom` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NhatKyHoatDong` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Policy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Quyen_VaiTro` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaiKhoan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VaiTroTrongNhom` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "mta";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."DM_DonVi" DROP CONSTRAINT "FK_DM_DonVi_iParentId_DM_DonVi_Id";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."DM_NhanVien" DROP CONSTRAINT "FK_DM_NhanVien_DM_DonVi";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."DM_NhanVien" DROP CONSTRAINT "FK_DM_NhanVien_DM_ViTriCongViec";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."DM_QuanHuyen" DROP CONSTRAINT "DM_QuanHuyen_iDM_DonViHanhChinhId_fkey";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."DM_QuanHuyen" DROP CONSTRAINT "DM_QuanHuyen_sDM_TinhId_fkey";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."DM_Tinh" DROP CONSTRAINT "DM_Tinh_iDM_DonViHanhChinhId_fkey";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."DM_Tinh" DROP CONSTRAINT "DM_Tinh_iDM_KhuVucDiaLy_Id_fkey";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."DM_Tinh" DROP CONSTRAINT "DM_Tinh_sDM_QuocGiaId_fkey";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."DM_ViTriCongViec" DROP CONSTRAINT "FK_DM_ViTriCongViec_DM_ChucDanh";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."DM_XaPhuong" DROP CONSTRAINT "DM_XaPhuong_dM_TinhId_fkey";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."DM_XaPhuong" DROP CONSTRAINT "DM_XaPhuong_iDM_DonViHanhChinhId_fkey";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."DM_XaPhuong" DROP CONSTRAINT "DM_XaPhuong_sDM_QuanHuyenId_fkey";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."NguoiDungTrongNhom" DROP CONSTRAINT "FK_NguoiDungTrongNhom_DM_NhanVien";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."NguoiDungTrongNhom" DROP CONSTRAINT "FK_NguoiDungTrongNhom_DM_NhomNguoiDung";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."NhatKyHoatDong" DROP CONSTRAINT "FK_Quyen_VaiTro_DM_NhanVien";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."Quyen_VaiTro" DROP CONSTRAINT "FK_Quyen_VaiTro_DM_NhanVien";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."Quyen_VaiTro" DROP CONSTRAINT "FK_Quyen_VaiTro_DM_VaiTro";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."TaiKhoan" DROP CONSTRAINT "FK_TaiKhoan_DM_NhanVien";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."VaiTroTrongNhom" DROP CONSTRAINT "FK_VaiTroTrongNhom_DM_VaiTro";

-- DropForeignKey
ALTER TABLE "ql-danh-muc"."VaiTroTrongNhom" DROP CONSTRAINT "VaiTroTrongNhom_sDM_NhomNguoiDungId_fkey";

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
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_communeCurrentAddressId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_communeHometownId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_communeOfBirthId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_communePermanentAddressId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_districtCurrentAddressId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_districtHometownId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_districtOfBirthId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_districtPermanentAddressId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_ethnicityId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_levelId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_nationalityId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_positionCPVId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_provinceCurrentAddressId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_provinceHometownId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_provinceOfBirthId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_provincePermanentAddressId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_rankId_fkey";

-- DropForeignKey
ALTER TABLE "ql-nguoi-dung"."UserProfile" DROP CONSTRAINT "UserProfile_religionId_fkey";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_CapBac";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_ChucDanh";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_ChucVu";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_ChungChiTinHoc";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_DanToc";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_DonVi";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_DonViHanhChinh";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_HocHam";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_HocVi";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_KhuVuc_DiaLy";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_NgoaiNgu";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_NhanVien";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_NhomNguoiDung";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_NhomUngDung";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_QuanHuyen";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_QuocGia";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_Tinh";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_TonGiao";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_TrinhDoNgoaiNgu";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_TrinhDoTinHoc";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_UngDung";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_VaiTro";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_ViTriCongViec";

-- DropTable
DROP TABLE "ql-danh-muc"."DM_XaPhuong";

-- DropTable
DROP TABLE "ql-danh-muc"."NguoiDungTrongNhom";

-- DropTable
DROP TABLE "ql-danh-muc"."NhatKyHoatDong";

-- DropTable
DROP TABLE "ql-danh-muc"."Policy";

-- DropTable
DROP TABLE "ql-danh-muc"."Quyen_VaiTro";

-- DropTable
DROP TABLE "ql-danh-muc"."TaiKhoan";

-- DropTable
DROP TABLE "ql-danh-muc"."VaiTroTrongNhom";

-- CreateTable
CREATE TABLE "mta"."DM_CapBac" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,

    CONSTRAINT "DM_CapBac_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_ChucDanh" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,
    "iLoaiChucDanh" INTEGER DEFAULT 0,

    CONSTRAINT "DM_ChucDanh_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_ChucVu" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,

    CONSTRAINT "DM_ChucVu_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_HocHam" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,

    CONSTRAINT "DM_HocHam_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_HocVi" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,

    CONSTRAINT "DM_HocVi_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_ChungChiTinHoc" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,

    CONSTRAINT "DM_ChungChiTinHoc_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_DanToc" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,
    "sTenKhac" TEXT,
    "sDiaChiCuTru" TEXT,

    CONSTRAINT "DM_DanToc_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_DonVi" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,
    "sCode" TEXT,
    "sTenVietTat" TEXT,
    "sParentId" TEXT,
    "sTruongDonVi" TEXT,
    "sChucNangNhiemVu" TEXT,
    "sDiaChi" TEXT,

    CONSTRAINT "DM_DonVi_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_DonViHanhChinh" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,
    "sTen_En" TEXT,

    CONSTRAINT "DM_DonViHanhChinh_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_KhuVuc_DiaLy" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,
    "sTen_En" TEXT,

    CONSTRAINT "DM_KhuVuc_DiaLy_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_NgoaiNgu" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,

    CONSTRAINT "DM_NgoaiNgu_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_TonGiao" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,

    CONSTRAINT "DM_TonGiao_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_TrinhDoNgoaiNgu" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,
    "sKhung" TEXT,

    CONSTRAINT "DM_TrinhDoNgoaiNgu_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_TrinhDoTinHoc" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,

    CONSTRAINT "DM_TrinhDoTinHoc_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_UngDung" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,
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
CREATE TABLE "mta"."DM_NhanVien" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
CREATE TABLE "mta"."DM_NhomNguoiDung" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,

    CONSTRAINT "DM_NhomNguoiDung_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_NhomUngDung" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,
    "sMoTa" TEXT,

    CONSTRAINT "DM_NhomUngDung_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_QuocGia" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,
    "sLanguage" TEXT,

    CONSTRAINT "DM_QuocGia_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_Tinh" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,
    "sDM_QuocGiaId" TEXT,
    "iDM_KhuVucDiaLy_Id" TEXT,
    "iDM_DonViHanhChinhId" TEXT,

    CONSTRAINT "DM_Tinh_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_QuanHuyen" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,
    "sDM_TinhId" TEXT,
    "sDM_Tinh_Ma" TEXT,
    "iDM_DonViHanhChinhId" TEXT,

    CONSTRAINT "DM_QuanHuyen_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_XaPhuong" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,
    "sDM_TinhId" TEXT,
    "sDM_QuanHuyenId" TEXT,
    "sDM_QuanHuyen_Ma" TEXT,
    "dM_TinhId" TEXT,
    "iDM_DonViHanhChinhId" TEXT,

    CONSTRAINT "DM_XaPhuong_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_VaiTro" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,

    CONSTRAINT "DM_VaiTro_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_ViTriCongViec" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,
    "sDM_ChucDanhId" TEXT,
    "sDM_NhomViTriId" TEXT NOT NULL,

    CONSTRAINT "DM_ViTriCongViec_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."NguoiDungTrongNhom" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
CREATE TABLE "mta"."NhatKyHoatDong" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
CREATE TABLE "mta"."Policy" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,
    "bXacThuc2YeuTo" BOOLEAN DEFAULT false,
    "bGioiHanTCIP" BOOLEAN DEFAULT false,
    "bGioiHanTG" BOOLEAN DEFAULT false,
    "iApDungChoUD" INTEGER DEFAULT 0,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."Quyen_VaiTro" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,
    "sTenChucNang" TEXT DEFAULT 'N''Tên quyền''',
    "sDM_NhanVienId" TEXT,
    "sDM_VaiTroId" TEXT,
    "fValue" INTEGER,

    CONSTRAINT "Quyen_VaiTro_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."TaiKhoan" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
    "sTen" TEXT NOT NULL,
    "sUserName" TEXT,
    "sAvatar" TEXT,
    "sDM_NhanVienId" TEXT,

    CONSTRAINT "TaiKhoan_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."VaiTroTrongNhom" (
    "Id" TEXT NOT NULL,
    "sMa" TEXT,
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
CREATE UNIQUE INDEX "DM_CapBac_sMa_key" ON "mta"."DM_CapBac"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_CapBac_sTen_key" ON "mta"."DM_CapBac"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChucDanh_sMa_key" ON "mta"."DM_ChucDanh"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChucDanh_sTen_key" ON "mta"."DM_ChucDanh"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChucVu_sMa_key" ON "mta"."DM_ChucVu"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChucVu_sTen_key" ON "mta"."DM_ChucVu"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_HocHam_sMa_key" ON "mta"."DM_HocHam"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_HocHam_sTen_key" ON "mta"."DM_HocHam"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_HocVi_sMa_key" ON "mta"."DM_HocVi"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_HocVi_sTen_key" ON "mta"."DM_HocVi"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChungChiTinHoc_sMa_key" ON "mta"."DM_ChungChiTinHoc"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ChungChiTinHoc_sTen_key" ON "mta"."DM_ChungChiTinHoc"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_DanToc_sMa_key" ON "mta"."DM_DanToc"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_DanToc_sTen_key" ON "mta"."DM_DanToc"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_DonVi_sMa_key" ON "mta"."DM_DonVi"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_DonVi_sTen_key" ON "mta"."DM_DonVi"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_DonVi_sCode_key" ON "mta"."DM_DonVi"("sCode");

-- CreateIndex
CREATE INDEX "IX_DM_DonVi_iParentId" ON "mta"."DM_DonVi"("sParentId");

-- CreateIndex
CREATE INDEX "IX_DM_DonVi_sMa" ON "mta"."DM_DonVi"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_DonViHanhChinh_sMa_key" ON "mta"."DM_DonViHanhChinh"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_DonViHanhChinh_sTen_key" ON "mta"."DM_DonViHanhChinh"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_KhuVuc_DiaLy_sMa_key" ON "mta"."DM_KhuVuc_DiaLy"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_KhuVuc_DiaLy_sTen_key" ON "mta"."DM_KhuVuc_DiaLy"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NgoaiNgu_sMa_key" ON "mta"."DM_NgoaiNgu"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NgoaiNgu_sTen_key" ON "mta"."DM_NgoaiNgu"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TonGiao_sMa_key" ON "mta"."DM_TonGiao"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TonGiao_sTen_key" ON "mta"."DM_TonGiao"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TrinhDoNgoaiNgu_sMa_key" ON "mta"."DM_TrinhDoNgoaiNgu"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TrinhDoNgoaiNgu_sTen_key" ON "mta"."DM_TrinhDoNgoaiNgu"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TrinhDoTinHoc_sMa_key" ON "mta"."DM_TrinhDoTinHoc"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_TrinhDoTinHoc_sTen_key" ON "mta"."DM_TrinhDoTinHoc"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_UngDung_sMa_key" ON "mta"."DM_UngDung"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_UngDung_sTen_key" ON "mta"."DM_UngDung"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NhanVien_sMa_key" ON "mta"."DM_NhanVien"("sMa");

-- CreateIndex
CREATE INDEX "IX_DM_NhanVien_sDM_DonViId" ON "mta"."DM_NhanVien"("sDM_DonViId");

-- CreateIndex
CREATE INDEX "IX_DM_NhanVien_sDM_ViTriCongViecId" ON "mta"."DM_NhanVien"("sDM_ViTriCongViecId");

-- CreateIndex
CREATE INDEX "IX_DM_NhanVien_sEmail" ON "mta"."DM_NhanVien"("sEmail");

-- CreateIndex
CREATE INDEX "IX_DM_NhanVien_sSDTDiDong" ON "mta"."DM_NhanVien"("sSDTDiDong");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NhomNguoiDung_sMa_key" ON "mta"."DM_NhomNguoiDung"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NhomNguoiDung_sTen_key" ON "mta"."DM_NhomNguoiDung"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NhomUngDung_sMa_key" ON "mta"."DM_NhomUngDung"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_NhomUngDung_sTen_key" ON "mta"."DM_NhomUngDung"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_QuocGia_sMa_key" ON "mta"."DM_QuocGia"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_QuocGia_sTen_key" ON "mta"."DM_QuocGia"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_Tinh_sMa_key" ON "mta"."DM_Tinh"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_Tinh_sTen_key" ON "mta"."DM_Tinh"("sTen");

-- CreateIndex
CREATE INDEX "IX_DM_Tinh_iDM_QuocGiaId" ON "mta"."DM_Tinh"("sDM_QuocGiaId");

-- CreateIndex
CREATE UNIQUE INDEX "DM_QuanHuyen_sMa_key" ON "mta"."DM_QuanHuyen"("sMa");

-- CreateIndex
CREATE INDEX "IX_DM_QuanHuyen_iDM_TinhId" ON "mta"."DM_QuanHuyen"("sDM_TinhId");

-- CreateIndex
CREATE UNIQUE INDEX "DM_QuanHuyen_sDM_TinhId_sTen_key" ON "mta"."DM_QuanHuyen"("sDM_TinhId", "sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_XaPhuong_sMa_key" ON "mta"."DM_XaPhuong"("sMa");

-- CreateIndex
CREATE INDEX "IX_DM_XaPhuong_iDM_QuanHuyenId" ON "mta"."DM_XaPhuong"("sDM_QuanHuyenId");

-- CreateIndex
CREATE UNIQUE INDEX "DM_XaPhuong_sDM_QuanHuyenId_sTen_key" ON "mta"."DM_XaPhuong"("sDM_QuanHuyenId", "sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_VaiTro_sMa_key" ON "mta"."DM_VaiTro"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_VaiTro_sTen_key" ON "mta"."DM_VaiTro"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ViTriCongViec_sMa_key" ON "mta"."DM_ViTriCongViec"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_ViTriCongViec_sTen_key" ON "mta"."DM_ViTriCongViec"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "NguoiDungTrongNhom_sMa_key" ON "mta"."NguoiDungTrongNhom"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "NguoiDungTrongNhom_sDM_NhomNguoiDungId_sDM_NhanVienId_key" ON "mta"."NguoiDungTrongNhom"("sDM_NhomNguoiDungId", "sDM_NhanVienId");

-- CreateIndex
CREATE UNIQUE INDEX "NhatKyHoatDong_sMa_key" ON "mta"."NhatKyHoatDong"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_sMa_key" ON "mta"."Policy"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_sTen_key" ON "mta"."Policy"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "Quyen_VaiTro_sMa_key" ON "mta"."Quyen_VaiTro"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "Quyen_VaiTro_sTen_key" ON "mta"."Quyen_VaiTro"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "TaiKhoan_sMa_key" ON "mta"."TaiKhoan"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "TaiKhoan_sUserName_key" ON "mta"."TaiKhoan"("sUserName");

-- CreateIndex
CREATE UNIQUE INDEX "TaiKhoan_sDM_NhanVienId_key" ON "mta"."TaiKhoan"("sDM_NhanVienId");

-- CreateIndex
CREATE UNIQUE INDEX "VaiTroTrongNhom_sMa_key" ON "mta"."VaiTroTrongNhom"("sMa");

-- AddForeignKey
ALTER TABLE "mta"."DM_DonVi" ADD CONSTRAINT "FK_DM_DonVi_iParentId_DM_DonVi_Id" FOREIGN KEY ("sParentId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mta"."DM_NhanVien" ADD CONSTRAINT "FK_DM_NhanVien_DM_DonVi" FOREIGN KEY ("sDM_DonViId") REFERENCES "mta"."DM_DonVi"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mta"."DM_NhanVien" ADD CONSTRAINT "FK_DM_NhanVien_DM_ViTriCongViec" FOREIGN KEY ("sDM_ViTriCongViecId") REFERENCES "mta"."DM_ViTriCongViec"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mta"."DM_Tinh" ADD CONSTRAINT "DM_Tinh_sDM_QuocGiaId_fkey" FOREIGN KEY ("sDM_QuocGiaId") REFERENCES "mta"."DM_QuocGia"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mta"."DM_Tinh" ADD CONSTRAINT "DM_Tinh_iDM_KhuVucDiaLy_Id_fkey" FOREIGN KEY ("iDM_KhuVucDiaLy_Id") REFERENCES "mta"."DM_KhuVuc_DiaLy"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mta"."DM_Tinh" ADD CONSTRAINT "DM_Tinh_iDM_DonViHanhChinhId_fkey" FOREIGN KEY ("iDM_DonViHanhChinhId") REFERENCES "mta"."DM_DonViHanhChinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mta"."DM_QuanHuyen" ADD CONSTRAINT "DM_QuanHuyen_sDM_TinhId_fkey" FOREIGN KEY ("sDM_TinhId") REFERENCES "mta"."DM_Tinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mta"."DM_QuanHuyen" ADD CONSTRAINT "DM_QuanHuyen_iDM_DonViHanhChinhId_fkey" FOREIGN KEY ("iDM_DonViHanhChinhId") REFERENCES "mta"."DM_DonViHanhChinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mta"."DM_XaPhuong" ADD CONSTRAINT "DM_XaPhuong_sDM_QuanHuyenId_fkey" FOREIGN KEY ("sDM_QuanHuyenId") REFERENCES "mta"."DM_QuanHuyen"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mta"."DM_XaPhuong" ADD CONSTRAINT "DM_XaPhuong_dM_TinhId_fkey" FOREIGN KEY ("dM_TinhId") REFERENCES "mta"."DM_Tinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mta"."DM_XaPhuong" ADD CONSTRAINT "DM_XaPhuong_iDM_DonViHanhChinhId_fkey" FOREIGN KEY ("iDM_DonViHanhChinhId") REFERENCES "mta"."DM_DonViHanhChinh"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mta"."DM_ViTriCongViec" ADD CONSTRAINT "FK_DM_ViTriCongViec_DM_ChucDanh" FOREIGN KEY ("sDM_ChucDanhId") REFERENCES "mta"."DM_ChucDanh"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mta"."NguoiDungTrongNhom" ADD CONSTRAINT "FK_NguoiDungTrongNhom_DM_NhomNguoiDung" FOREIGN KEY ("sDM_NhomNguoiDungId") REFERENCES "mta"."DM_NhomNguoiDung"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mta"."NguoiDungTrongNhom" ADD CONSTRAINT "FK_NguoiDungTrongNhom_DM_NhanVien" FOREIGN KEY ("sDM_NhanVienId") REFERENCES "mta"."DM_NhanVien"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mta"."NhatKyHoatDong" ADD CONSTRAINT "FK_Quyen_VaiTro_DM_NhanVien" FOREIGN KEY ("sNhanVienId") REFERENCES "mta"."DM_NhanVien"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mta"."Quyen_VaiTro" ADD CONSTRAINT "FK_Quyen_VaiTro_DM_NhanVien" FOREIGN KEY ("sDM_NhanVienId") REFERENCES "mta"."DM_NhanVien"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mta"."Quyen_VaiTro" ADD CONSTRAINT "FK_Quyen_VaiTro_DM_VaiTro" FOREIGN KEY ("sDM_VaiTroId") REFERENCES "mta"."DM_VaiTro"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mta"."TaiKhoan" ADD CONSTRAINT "FK_TaiKhoan_DM_NhanVien" FOREIGN KEY ("sDM_NhanVienId") REFERENCES "mta"."DM_NhanVien"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mta"."VaiTroTrongNhom" ADD CONSTRAINT "VaiTroTrongNhom_sDM_NhomNguoiDungId_fkey" FOREIGN KEY ("sDM_NhomNguoiDungId") REFERENCES "mta"."DM_NhomNguoiDung"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mta"."VaiTroTrongNhom" ADD CONSTRAINT "FK_VaiTroTrongNhom_DM_VaiTro" FOREIGN KEY ("sDM_VaiTroId") REFERENCES "mta"."DM_VaiTro"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;
