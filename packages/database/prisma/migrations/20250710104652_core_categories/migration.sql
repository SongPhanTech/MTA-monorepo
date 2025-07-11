-- AlterTable
ALTER TABLE "mta"."DM_NhanVien" ADD COLUMN     "sTen" TEXT;

-- CreateTable
CREATE TABLE "mta"."DM_PhanCap_ChatLuong_TrangThietBi" (
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

    CONSTRAINT "DM_PhanCap_ChatLuong_TrangThietBi_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mta"."DM_PhanLoai_CSKT" (
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

    CONSTRAINT "DM_PhanLoai_CSKT_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DM_PhanCap_ChatLuong_TrangThietBi_sMa_key" ON "mta"."DM_PhanCap_ChatLuong_TrangThietBi"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_PhanCap_ChatLuong_TrangThietBi_sTen_key" ON "mta"."DM_PhanCap_ChatLuong_TrangThietBi"("sTen");

-- CreateIndex
CREATE UNIQUE INDEX "DM_PhanLoai_CSKT_sMa_key" ON "mta"."DM_PhanLoai_CSKT"("sMa");

-- CreateIndex
CREATE UNIQUE INDEX "DM_PhanLoai_CSKT_sTen_key" ON "mta"."DM_PhanLoai_CSKT"("sTen");
