import type {
  BoLocLopQuanLy,
  LopQuanLyChiTietRow,
} from "@components/cong-giang-vien/lop-quan-ly/types"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { demGioiTinhSinhVien } from "@lib/dem-gioi-tinh-sinh-vien"
import { useSession } from "@workspace/auth/react"
import {
  useCountFixedClass,
  useFindManyFixedClass,
  useFindUniqueSemester,
} from "@workspace/db/hooks"
import { useSemesterStore } from "@workspace/ui"
import { useMemo, useState } from "react"

const useLopQuanLyGiangVien = () => {
  const { data: me } = useSession()
  const profileId = me?.sDM_NhanVienId ?? ""
  const { id: semesterId } = useSemesterStore()
  const { data: hocKyDangChon, isLoading: dangTaiHocKy } = useFindUniqueSemester(
    { where: { id: semesterId }, select: { endDate: true } },
    { enabled: !!semesterId }
  )

  const [boLocNhap, setBoLocNhap] = useState<BoLocLopQuanLy>({
    tuKhoa: "",
    loaiLop: "tat_ca",
  })
  const [boLocApDung, setBoLocApDung] = useState<BoLocLopQuanLy>({
    tuKhoa: "",
    loaiLop: "tat_ca",
  })
  const [trang, setTrang] = useState(1)
  const [soTrang, setSoTrang] = useState(DEFAULT_PAGINATE_SIZE)

  const where = useMemo(
    () => ({
      deletedAt: null,
      active: true,
      lecturerManagement: { userProfileId: profileId },
      // Lớp quản lý gắn với khóa học, không gắn với từng học kỳ.
      // Hiện các lớp có khóa đã bắt đầu tính đến hết học kỳ đang chọn.
      ...(hocKyDangChon?.endDate
        ? { trainingCourse: { semesterStart: { startDate: { lte: hocKyDangChon.endDate } } } }
        : {}),
      ...(boLocApDung.loaiLop !== "tat_ca" ? { classType: boLocApDung.loaiLop } : {}),
      ...(boLocApDung.tuKhoa
        ? {
            OR: [
              { code: { contains: boLocApDung.tuKhoa, mode: "insensitive" as const } },
              { name: { contains: boLocApDung.tuKhoa, mode: "insensitive" as const } },
            ],
          }
        : {}),
    }),
    [profileId, hocKyDangChon?.endDate, boLocApDung]
  )

  const queryEnabled = !!profileId && (!semesterId || !!hocKyDangChon)

  const { data = [], isLoading } = useFindManyFixedClass(
    {
      where,
      include: {
        managementOrganization: { select: { sMa: true, sTen: true } },
        curriculumVersion: {
          include: {
            curriculum: {
              include: {
                trainingMajor: {
                  select: {
                    organization: { select: { sTen: true, sMa: true } },
                  },
                },
              },
            },
          },
        },
        trainingCourse: {
          include: {
            semesterStart: {
              include: { schoolYear: true },
            },
          },
        },
        students: {
          where: { deletedAt: null, active: true },
          select: {
            userProfile: {
              select: {
                gender: { select: { sMa: true, sTen: true } },
              },
            },
          },
        },
      },
      orderBy: [{ code: "asc" }, { name: "asc" }],
      take: soTrang,
      skip: (trang - 1) * soTrang,
    },
    { enabled: queryEnabled }
  )

  const { data: tongSo = 0 } = useCountFixedClass({ where }, { enabled: queryEnabled })

  const danhSach: LopQuanLyChiTietRow[] = useMemo(
    () =>
      data.map((item) => {
        const { siSoNam, siSoNu, siSoTong } = demGioiTinhSinhVien(item.students ?? [])

        return {
          id: item.id,
          maLop: item.code ?? "",
          tenLop: item.name ?? "",
          donViQuanLy:
            item.curriculumVersion?.curriculum?.trainingMajor?.organization?.sTen ??
            item.managementOrganization?.sTen ??
            item.managementOrganization?.sMa ??
            "",
          siSoNam,
          siSoNu,
          siSoTong,
          hocKy: item.trainingCourse?.semesterStart?.name ?? "",
          namHoc:
            item.trainingCourse?.semesterStart?.schoolYear?.name ??
            item.trainingCourse?.academicYear ??
            "",
          classType: item.classType,
          ghiChu: item.summary ?? item.description ?? "",
        }
      }),
    [data]
  )

  const capNhatBoLoc = (capNhat: Partial<BoLocLopQuanLy>) => {
    setBoLocNhap((prev) => ({ ...prev, ...capNhat }))
  }

  const timKiem = () => {
    setBoLocApDung(boLocNhap)
    setTrang(1)
  }

  const doiLoaiLop = (loaiLop: BoLocLopQuanLy["loaiLop"]) => {
    const capNhat = { ...boLocNhap, loaiLop }
    setBoLocNhap(capNhat)
    setBoLocApDung(capNhat)
    setTrang(1)
  }

  return {
    boLoc: boLocNhap,
    capNhatBoLoc,
    timKiem,
    doiLoaiLop,
    danhSach,
    tongSo,
    trang,
    setTrang,
    soTrang,
    setSoTrang,
    isLoading: (!!profileId && !!semesterId && dangTaiHocKy) || (queryEnabled && isLoading),
  }
}

export { useLopQuanLyGiangVien }
