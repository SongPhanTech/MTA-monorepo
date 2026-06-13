import type {
  DiemRenLuyenRow,
  ThongKeDiemRenLuyen,
} from "@components/cong-giang-vien/lop-quan-ly/types"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import {
  laDatDiemRenLuyen,
  layDiemRenLuyenSinhVien,
  layGhiChuDiemRenLuyen,
  layXepLoaiRenLuyen,
} from "@lib/diem-ren-luyen"
import { useCountStudent, useFindManyStudent } from "@workspace/db/hooks"
import { useSemesterStore } from "@workspace/ui"
import { useEffect, useMemo, useState } from "react"

const STUDENT_INCLUDE = (semesterId: string) =>
  ({
    userProfile: { select: { code: true, fullname: true } },
    studentSemesterResult: {
      where: { semesterId },
      select: { conductScore: true, studentTrainingType: true },
      take: 1,
    },
    semesterTrainingScore: {
      where: { semesterId },
      select: { score: true, description: true, status: true },
      orderBy: { updatedAt: "desc" as const },
      take: 1,
    },
  }) as const

const useDiemRenLuyenLopQuanLy = (fixedClassId: string, enabled: boolean) => {
  const { id: semesterMacDinh } = useSemesterStore()
  const [semesterApDung, setSemesterApDung] = useState(semesterMacDinh)
  const [trang, setTrang] = useState(1)
  const [soTrang, setSoTrang] = useState(DEFAULT_PAGINATE_SIZE)

  useEffect(() => {
    if (semesterMacDinh) setSemesterApDung(semesterMacDinh)
  }, [semesterMacDinh])

  const semesterId = semesterApDung || semesterMacDinh || ""

  const where = useMemo(
    () => ({
      fixedClassId,
      deletedAt: null,
      active: true,
    }),
    [fixedClassId]
  )

  const queryEnabled = enabled && !!fixedClassId && !!semesterId

  const { data: trangData = [], isLoading: dangTaiBang } = useFindManyStudent(
    {
      where,
      include: STUDENT_INCLUDE(semesterId),
      orderBy: [{ userProfile: { code: "asc" } }],
      take: soTrang,
      skip: (trang - 1) * soTrang,
    },
    { enabled: queryEnabled }
  )

  const { data: tongSo = 0 } = useCountStudent({ where }, { enabled: queryEnabled })

  const { data: tatCaSinhVien = [], isLoading: dangTaiThongKe } = useFindManyStudent(
    {
      where,
      include: STUDENT_INCLUDE(semesterId),
      orderBy: [{ userProfile: { code: "asc" } }],
    },
    { enabled: queryEnabled }
  )

  const danhSach: DiemRenLuyenRow[] = useMemo(
    () =>
      trangData.map((sv) => ({
        id: sv.id,
        maSinhVien: sv.userProfile?.code ?? sv.code ?? "",
        hoVaTen: sv.userProfile?.fullname ?? "",
        diem: layDiemRenLuyenSinhVien(sv),
        xepLoai: layXepLoaiRenLuyen(sv),
        ghiChu: layGhiChuDiemRenLuyen(sv),
      })),
    [trangData]
  )

  const thongKe: ThongKeDiemRenLuyen = useMemo(() => {
    let soDat = 0
    let soKhongDat = 0
    let tongDiem = 0
    let soCoDiem = 0

    for (const sv of tatCaSinhVien) {
      const diem = layDiemRenLuyenSinhVien(sv)
      const xepLoai = layXepLoaiRenLuyen(sv)

      if (diem != null) {
        tongDiem += diem
        soCoDiem += 1
      }

      if (laDatDiemRenLuyen(diem, xepLoai)) soDat += 1
      else if (diem != null) soKhongDat += 1
    }

    return {
      tongSinhVien: tatCaSinhVien.length,
      soDat,
      soKhongDat,
      diemTrungBinh: soCoDiem > 0 ? Math.round((tongDiem / soCoDiem) * 100) / 100 : null,
    }
  }, [tatCaSinhVien])

  const apDungHocKy = (id: string) => {
    setSemesterApDung(id)
    setTrang(1)
  }

  return {
    semesterId,
    apDungHocKy,
    danhSach,
    thongKe,
    tongSo,
    trang,
    setTrang,
    soTrang,
    setSoTrang,
    dangTai: queryEnabled && (dangTaiBang || dangTaiThongKe),
  }
}

export { useDiemRenLuyenLopQuanLy }
