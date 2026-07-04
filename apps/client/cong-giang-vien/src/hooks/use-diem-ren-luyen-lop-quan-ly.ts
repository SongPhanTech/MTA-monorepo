import type {
  DiemRenLuyenRow,
  LocDiemRenLuyen,
  ThongKeDiemRenLuyen,
} from "@components/cong-giang-vien/lop-quan-ly/types"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import {
  layDiemRenLuyenNamHoc,
  layDiemRenLuyenSinhVien,
  layGhiChuDiemRenLuyen,
  layGhiChuDiemRenLuyenNamHoc,
  layXepLoaiRenLuyen,
  layXepLoaiRenLuyenNamHoc,
} from "@lib/diem-ren-luyen"
import { SemesterType, TrainingScoreStatus } from "@workspace/db/client"
import { useCountStudent, useFindManySchoolYear, useFindManyStudent } from "@workspace/db/hooks"
import { useSemesterStore } from "@workspace/ui"
import { useEffect, useMemo, useState } from "react"

const STUDENT_INCLUDE_KY = (semesterId: string) =>
  ({
    userProfile: { select: { code: true, fullname: true } },
    studentSemesterResult: {
      where: { semesterId },
      select: { conductScore: true, studentTrainingType: true },
      take: 1,
    },
    semesterTrainingScore: {
      where: { semesterId, status: TrainingScoreStatus.APPROVED },
      select: { score: true, description: true, status: true },
      orderBy: { updatedAt: "desc" as const },
      take: 1,
    },
  }) as const

const STUDENT_INCLUDE_NAM = (schoolYearId: string) =>
  ({
    userProfile: { select: { code: true, fullname: true } },
    studentYearResult: {
      where: { schoolYearId },
      select: { conductScore: true, studentTrainingType: true },
      take: 1,
    },
    schoolYearTrainingScore: {
      where: { schoolYearId, status: TrainingScoreStatus.APPROVED },
      select: { score: true, description: true, status: true },
      orderBy: { updatedAt: "desc" as const },
      take: 1,
    },
    semesterTrainingScore: {
      where: {
        status: TrainingScoreStatus.APPROVED,
        semester: {
          schoolYearId,
          semesterType: SemesterType.SECOND,
        },
      },
      select: { score: true, description: true, status: true },
      orderBy: { updatedAt: "desc" as const },
      take: 1,
    },
  }) as const

const toDiemRenLuyenRow = (
  sv: {
    id: string
    code?: string | null
    userProfile?: { code?: string | null; fullname?: string | null } | null
  } & Parameters<typeof layDiemRenLuyenSinhVien>[0] &
    Parameters<typeof layDiemRenLuyenNamHoc>[0],
  theoKy: boolean
): DiemRenLuyenRow => ({
  id: sv.id,
  maSinhVien: sv.userProfile?.code ?? sv.code ?? "",
  hoVaTen: sv.userProfile?.fullname ?? "",
  diem: theoKy ? layDiemRenLuyenSinhVien(sv) : layDiemRenLuyenNamHoc(sv),
  xepLoai: theoKy ? layXepLoaiRenLuyen(sv) : layXepLoaiRenLuyenNamHoc(sv),
  ghiChu: theoKy ? layGhiChuDiemRenLuyen(sv) : layGhiChuDiemRenLuyenNamHoc(sv),
})

const useDiemRenLuyenLopQuanLy = (fixedClassId: string, enabled: boolean) => {
  const { id: semesterMacDinh } = useSemesterStore()
  const [schoolYearApDung, setSchoolYearApDung] = useState<string>("")
  const [semesterApDung, setSemesterApDung] = useState<string | undefined>(semesterMacDinh)
  const [trang, setTrang] = useState(1)
  const [soTrang, setSoTrang] = useState(DEFAULT_PAGINATE_SIZE)
  const [locDiem, setLocDiem] = useState<LocDiemRenLuyen>(null)

  const { data: schoolYears = [] } = useFindManySchoolYear({
    orderBy: { startDate: "desc" },
    include: { semesters: { orderBy: { createdAt: "desc" } } },
  })

  const schoolYearMacDinh = useMemo(() => {
    if (semesterMacDinh) {
      const tuHocKy = schoolYears.find((year) =>
        year.semesters.some((semester) => semester.id === semesterMacDinh)
      )?.id
      if (tuHocKy) return tuHocKy
    }
    return schoolYears[0]?.id ?? ""
  }, [schoolYears, semesterMacDinh])

  useEffect(() => {
    if (schoolYearMacDinh) setSchoolYearApDung(schoolYearMacDinh)
  }, [schoolYearMacDinh])

  useEffect(() => {
    if (semesterMacDinh) setSemesterApDung(semesterMacDinh)
  }, [semesterMacDinh])

  useEffect(() => {
    setLocDiem(null)
    setTrang(1)
  }, [schoolYearApDung, semesterApDung])

  const schoolYearId = schoolYearApDung || schoolYearMacDinh
  const semesterId = semesterApDung
  const theoKy = !!semesterId

  const studentInclude = useMemo(
    () => (theoKy ? STUDENT_INCLUDE_KY(semesterId!) : STUDENT_INCLUDE_NAM(schoolYearId)),
    [theoKy, semesterId, schoolYearId]
  )

  const where = useMemo(
    () => ({
      fixedClassId,
      deletedAt: null,
      active: true,
    }),
    [fixedClassId]
  )

  const queryEnabled = enabled && !!fixedClassId && !!schoolYearId

  const { data: trangData = [], isLoading: dangTaiBang } = useFindManyStudent(
    {
      where,
      include: studentInclude,
      orderBy: [{ userProfile: { firstName: "asc" } }, { userProfile: { lastName: "asc" } }],
      take: soTrang,
      skip: (trang - 1) * soTrang,
    },
    { enabled: queryEnabled }
  )

  const { data: tongSoGoc = 0 } = useCountStudent({ where }, { enabled: queryEnabled })

  const { data: tatCaSinhVien = [], isLoading: dangTaiThongKe } = useFindManyStudent(
    {
      where,
      include: studentInclude,
      orderBy: [{ userProfile: { firstName: "asc" } }, { userProfile: { lastName: "asc" } }],
    },
    { enabled: queryEnabled }
  )

  const tatCaDanhSach: DiemRenLuyenRow[] = useMemo(
    () => tatCaSinhVien.map((sv) => toDiemRenLuyenRow(sv, theoKy)),
    [tatCaSinhVien, theoKy]
  )

  const thongKe: ThongKeDiemRenLuyen = useMemo(() => {
    const danhSachDiem = tatCaDanhSach
      .map((sv) => sv.diem)
      .filter((diem): diem is number => diem != null)
    const tongDiem = danhSachDiem.reduce((sum, diem) => sum + diem, 0)

    return {
      tongSinhVien: tatCaDanhSach.length,
      soSinhVienCoDiem: danhSachDiem.length,
      diemTrungBinh:
        danhSachDiem.length > 0 ? Math.round((tongDiem / danhSachDiem.length) * 100) / 100 : null,
      diemCaoNhat: danhSachDiem.length > 0 ? Math.max(...danhSachDiem) : null,
      diemThapNhat: danhSachDiem.length > 0 ? Math.min(...danhSachDiem) : null,
    }
  }, [tatCaDanhSach])

  const danhSachLoc = useMemo(() => {
    if (!locDiem) return null
    const diemLoc = locDiem === "cao_nhat" ? thongKe.diemCaoNhat : thongKe.diemThapNhat
    if (diemLoc == null) return []
    return tatCaDanhSach.filter((sv) => sv.diem === diemLoc)
  }, [locDiem, tatCaDanhSach, thongKe.diemCaoNhat, thongKe.diemThapNhat])

  const danhSach: DiemRenLuyenRow[] = useMemo(() => {
    if (danhSachLoc) {
      const batDau = (trang - 1) * soTrang
      return danhSachLoc.slice(batDau, batDau + soTrang)
    }
    return trangData.map((sv) => toDiemRenLuyenRow(sv, theoKy))
  }, [danhSachLoc, trang, soTrang, trangData, theoKy])

  const tongSo = danhSachLoc ? danhSachLoc.length : tongSoGoc

  const apDungBoLoc = ({
    schoolYearId: yearId,
    semesterId: kyId,
  }: {
    schoolYearId: string
    semesterId?: string
  }) => {
    setSchoolYearApDung(yearId)
    setSemesterApDung(kyId)
    setLocDiem(null)
    setTrang(1)
  }

  const chonLocDiem = (loai: Exclude<LocDiemRenLuyen, null>) => {
    const diemLoc = loai === "cao_nhat" ? thongKe.diemCaoNhat : thongKe.diemThapNhat
    if (diemLoc == null) return
    setLocDiem((hienTai) => (hienTai === loai ? null : loai))
    setTrang(1)
  }

  return {
    schoolYearId,
    semesterId,
    apDungBoLoc,
    locDiem,
    chonLocDiem,
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
