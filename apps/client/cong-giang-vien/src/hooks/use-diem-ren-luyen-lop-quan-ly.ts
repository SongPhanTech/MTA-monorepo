import { queryClient } from "@api/index"
import type {
  DiemRenLuyenForm,
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
import { sqlTransaction } from "@workspace/libs/api/model"
import type { SqlTransactionBodyItem } from "@workspace/libs/api/schemas/sqlTransactionBodyItem"
import { useSemesterStore } from "@workspace/ui"
import { message } from "antd"
import { useEffect, useMemo, useState } from "react"

const RECORD_SELECT = {
  id: true,
  score: true,
  description: true,
  status: true,
} as const

const STUDENT_INCLUDE_KY = (semesterId: string, choNhap: boolean) =>
  ({
    userProfile: { select: { code: true, fullname: true } },
    studentSemesterResult: {
      where: { semesterId },
      select: { conductScore: true, studentTrainingType: true },
      take: 1,
    },
    semesterTrainingScore: {
      where: {
        semesterId,
        ...(choNhap ? {} : { status: TrainingScoreStatus.APPROVED }),
      },
      select: RECORD_SELECT,
      orderBy: { updatedAt: "desc" as const },
      take: 1,
    },
  }) as const

const STUDENT_INCLUDE_NAM = (schoolYearId: string, choNhap: boolean) =>
  ({
    userProfile: { select: { code: true, fullname: true } },
    studentYearResult: {
      where: { schoolYearId },
      select: { conductScore: true, studentTrainingType: true },
      take: 1,
    },
    schoolYearTrainingScore: {
      where: {
        schoolYearId,
        ...(choNhap ? {} : { status: TrainingScoreStatus.APPROVED }),
      },
      select: RECORD_SELECT,
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
      select: RECORD_SELECT,
      orderBy: { updatedAt: "desc" as const },
      take: 1,
    },
  }) as const

type SinhVienDiemRenLuyen = Parameters<typeof layDiemRenLuyenSinhVien>[0] &
  Parameters<typeof layDiemRenLuyenNamHoc>[0] & {
    id: string
    code?: string | null
    userProfile?: { code?: string | null; fullname?: string | null } | null
    semesterTrainingScore?: Array<{ id: string; score?: number | null }>
    schoolYearTrainingScore?: Array<{ id: string; score?: number | null }>
  }

const toDiemRenLuyenRow = (
  sv: SinhVienDiemRenLuyen,
  theoKy: boolean,
  choNhap: boolean
): DiemRenLuyenRow => {
  const diemRecord = theoKy ? sv.semesterTrainingScore?.[0] : sv.schoolYearTrainingScore?.[0]

  return {
    id: sv.id,
    maSinhVien: sv.userProfile?.code ?? "",
    hoVaTen: sv.userProfile?.fullname ?? "",
    diem: choNhap
      ? (diemRecord?.score ?? null)
      : theoKy
        ? layDiemRenLuyenSinhVien(sv)
        : layDiemRenLuyenNamHoc(sv),
    diemRecordId: diemRecord?.id ?? null,
    xepLoai: theoKy ? layXepLoaiRenLuyen(sv) : layXepLoaiRenLuyenNamHoc(sv),
    ghiChu: theoKy ? layGhiChuDiemRenLuyen(sv) : layGhiChuDiemRenLuyenNamHoc(sv),
  }
}

const useDiemRenLuyenLopQuanLy = (
  fixedClassId: string,
  enabled: boolean,
  coQuyenNhap = false
) => {
  const { id: semesterMacDinh } = useSemesterStore()
  const [schoolYearApDung, setSchoolYearApDung] = useState<string>("")
  const [semesterApDung, setSemesterApDung] = useState<string | undefined>(semesterMacDinh)
  const [trang, setTrang] = useState(1)
  const [soTrang, setSoTrang] = useState(DEFAULT_PAGINATE_SIZE)
  const [locDiem, setLocDiem] = useState<LocDiemRenLuyen>(null)
  const [dangLuu, setDangLuu] = useState(false)

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
    () =>
      theoKy
        ? STUDENT_INCLUDE_KY(semesterId!, coQuyenNhap)
        : STUDENT_INCLUDE_NAM(schoolYearId, coQuyenNhap),
    [theoKy, semesterId, schoolYearId, coQuyenNhap]
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
    () => tatCaSinhVien.map((sv) => toDiemRenLuyenRow(sv as SinhVienDiemRenLuyen, theoKy, coQuyenNhap)),
    [tatCaSinhVien, theoKy, coQuyenNhap]
  )

  const giaTriFormMacDinh: DiemRenLuyenForm["list"] = useMemo(
    () =>
      tatCaDanhSach.reduce(
        (acc, sv) => {
          acc[sv.id] = { score: sv.diem }
          return acc
        },
        {} as DiemRenLuyenForm["list"]
      ),
    [tatCaDanhSach]
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
    return trangData.map((sv) =>
      toDiemRenLuyenRow(sv as SinhVienDiemRenLuyen, theoKy, coQuyenNhap)
    )
  }, [danhSachLoc, trang, soTrang, trangData, theoKy, coQuyenNhap])

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

  const luuDiemRenLuyen = async (values: DiemRenLuyenForm) => {
    if (!coQuyenNhap) return

    const loiDiem = Object.values(values.list ?? {}).find((item) => {
      if (item.score == null) return false
      return item.score < 0 || item.score > 10
    })
    if (loiDiem) {
      message.error("Vui lòng nhập điểm từ 0 đến 10")
      return
    }

    const recordMap = new Map(tatCaDanhSach.map((sv) => [sv.id, sv.diemRecordId]))
    const listCreate: SqlTransactionBodyItem[] = []
    const listUpdate: SqlTransactionBodyItem[] = []

    Object.entries(values.list ?? {}).forEach(([studentId, item]) => {
      if (item.score == null) return

      const score = Math.round(item.score)
      const recordId = recordMap.get(studentId)

      if (recordId) {
        if (theoKy) {
          listUpdate.push({
            model: "SemesterTrainingScore",
            operation: "update",
            data: {
              where: { id: recordId },
              data: { score, status: TrainingScoreStatus.APPROVED },
            },
          })
        } else {
          listUpdate.push({
            model: "SchoolYearTrainingScore",
            operation: "update",
            data: {
              where: { id: recordId },
              data: { score, status: TrainingScoreStatus.APPROVED },
            },
          })
        }
        return
      }

      if (theoKy && semesterId) {
        listCreate.push({
          model: "SemesterTrainingScore",
          operation: "create",
          data: {
            data: {
              studentId,
              semesterId,
              score,
              status: TrainingScoreStatus.APPROVED,
            },
          },
        })
      } else if (schoolYearId) {
        listCreate.push({
          model: "SchoolYearTrainingScore",
          operation: "create",
          data: {
            data: {
              studentId,
              schoolYearId,
              score,
              status: TrainingScoreStatus.APPROVED,
            },
          },
        })
      }
    })

    const transactions = [...listCreate, ...listUpdate]
    if (transactions.length === 0) {
      message.info("Không có điểm nào để lưu")
      return
    }

    setDangLuu(true)
    try {
      const res = await sqlTransaction(transactions)
      if (res.status === 200) {
        message.success("Lưu điểm rèn luyện thành công")
        await queryClient.invalidateQueries({ queryKey: ["zenstack", "Student"] })
        await queryClient.invalidateQueries({ queryKey: ["zenstack", "SemesterTrainingScore"] })
        await queryClient.invalidateQueries({ queryKey: ["zenstack", "SchoolYearTrainingScore"] })
      } else {
        message.error("Lưu điểm rèn luyện thất bại")
      }
    } catch {
      message.error("Lưu điểm rèn luyện thất bại")
    } finally {
      setDangLuu(false)
    }
  }

  return {
    schoolYearId,
    semesterId,
    theoKy,
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
    giaTriFormMacDinh,
    luuDiemRenLuyen,
    dangLuu,
    dangTai: queryEnabled && (dangTaiBang || dangTaiThongKe),
  }
}

export { useDiemRenLuyenLopQuanLy }
