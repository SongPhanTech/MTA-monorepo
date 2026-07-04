import type { ThongKeTongKet, TongKetRow } from "@components/cong-giang-vien/lop-quan-ly/types"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { layDiemRenLuyenNamHoc, layDiemRenLuyenSinhVien } from "@lib/diem-ren-luyen"
import {
  chuyenSo,
  dinhDangHeSoXetHocBong,
  dinhDangNgaySinh,
  layGpaHocKy,
  layHeDiemTotNghiep,
  phanLoaiDiemTotNghiep,
} from "@lib/tong-ket-hoc-ky"
import {
  AcademicRankingBaseType,
  RankingContext,
  SemesterType,
  TrainingScoreStatus,
} from "@workspace/db/client"
import {
  useCountStudent,
  useFindManyAcademicRankingConvert,
  useFindManySchoolYear,
  useFindManyStudent,
  useFindUniqueFixedClass,
} from "@workspace/db/hooks"
import { useSemesterStore } from "@workspace/ui"
import { useEffect, useMemo, useState } from "react"

const KET_QUA_SELECT = {
  studyYear: true,
  baseScore: true,
  gpaBase4: true,
  cumulativeGpaBase4: true,
  gpaBase10: true,
  cumulativeGpaBase10: true,
  rank: { select: { classification: true, rankOrder: true } },
} as const

const STUDENT_INCLUDE_KY = (semesterId: string) =>
  ({
    userProfile: { select: { code: true, fullname: true, dateOfBirth: true } },
    fixedClass: { select: { code: true, name: true } },
    studentSemesterResult: {
      where: { semesterId },
      select: {
        ...KET_QUA_SELECT,
        semesterIndexInCourse: true,
      },
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
    userProfile: { select: { code: true, fullname: true, dateOfBirth: true } },
    fixedClass: { select: { code: true, name: true } },
    studentYearResult: {
      where: { schoolYearId },
      select: KET_QUA_SELECT,
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

const tinhTyLe = (so: number, tong: number) =>
  tong > 0 ? `${Math.round((so / tong) * 10000) / 100}%` : "0%"

type KetQuaHocKySv = {
  studyYear?: number | null
  semesterIndexInCourse?: number | null
  baseScore?: AcademicRankingBaseType | null
  gpaBase4?: unknown
  cumulativeGpaBase4?: unknown
  gpaBase10?: unknown
  cumulativeGpaBase10?: unknown
  rank?: { classification?: string | null; rankOrder?: number | null } | null
}

type DiemRenLuyenSv = {
  score?: number | null
  description?: string | null
  status?: string | null
}

type SinhVienTongKet = {
  id: string
  code?: string | null
  userProfile?: {
    code?: string | null
    fullname?: string | null
    dateOfBirth?: Date | string | null
  } | null
  fixedClass?: { code?: string | null; name?: string | null } | null
  studentSemesterResult?: KetQuaHocKySv[]
  studentYearResult?: KetQuaHocKySv[]
  semesterTrainingScore?: DiemRenLuyenSv[]
  schoolYearTrainingScore?: DiemRenLuyenSv[]
}

const layXepLoaiHocKy = (
  ketQua: KetQuaHocKySv | undefined,
  gpa: number | null,
  xepLoaiHocLuc: Parameters<typeof phanLoaiDiemTotNghiep>[1],
  baseScore: Parameters<typeof phanLoaiDiemTotNghiep>[2]
) => {
  const tuKetQua = ketQua?.rank?.classification
  if (tuKetQua) {
    return {
      classification: tuKetQua,
      rankOrder: ketQua.rank?.rankOrder ?? null,
    }
  }
  return phanLoaiDiemTotNghiep(gpa, xepLoaiHocLuc, baseScore)
}

const useTongKetLopQuanLy = (fixedClassId: string, enabled: boolean) => {
  const { id: semesterMacDinh } = useSemesterStore()
  const [schoolYearApDung, setSchoolYearApDung] = useState<string>("")
  const [semesterApDung, setSemesterApDung] = useState<string | undefined>(semesterMacDinh)
  const [trang, setTrang] = useState(1)
  const [soTrang, setSoTrang] = useState(DEFAULT_PAGINATE_SIZE)
  const [locXepLoai, setLocXepLoai] = useState<string | null>(null)

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
    setLocXepLoai(null)
    setTrang(1)
  }, [schoolYearApDung, semesterApDung])

  const schoolYearId = schoolYearApDung || schoolYearMacDinh
  const semesterId = semesterApDung
  const theoKy = !!semesterId

  const studentInclude = useMemo(
    () => (theoKy ? STUDENT_INCLUDE_KY(semesterId!) : STUDENT_INCLUDE_NAM(schoolYearId)),
    [theoKy, semesterId, schoolYearId]
  )

  const { data: fixedClass } = useFindUniqueFixedClass(
    {
      where: { id: fixedClassId },
      select: {
        trainingCourseId: true,
        trainingCourse: { select: { baseScore: true } },
      },
    },
    { enabled: enabled && !!fixedClassId }
  )

  const trainingCourseId = fixedClass?.trainingCourseId ?? ""
  const baseScoreKhoa = fixedClass?.trainingCourse?.baseScore ?? AcademicRankingBaseType.Base10

  const { data: xepLoaiHocLuc = [] } = useFindManyAcademicRankingConvert(
    {
      where: {
        trainingCourseId,
        context: RankingContext.STUDYING,
        deletedAt: null,
        active: true,
      },
      orderBy: { rankOrder: "asc" },
    },
    { enabled: enabled && !!trainingCourseId }
  )

  const heDiem = layHeDiemTotNghiep(xepLoaiHocLuc, baseScoreKhoa)

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
      include: studentInclude,
      orderBy: [{ userProfile: { code: "asc" } }],
    },
    { enabled: queryEnabled }
  )

  const layKetQuaSv = (sv: SinhVienTongKet) =>
    theoKy ? sv.studentSemesterResult?.[0] : sv.studentYearResult?.[0]

  const layBaseScoreSv = (ketQua: KetQuaHocKySv | undefined) =>
    theoKy ? baseScoreKhoa : (ketQua?.baseScore ?? baseScoreKhoa)

  const toTongKetRow = (sv: SinhVienTongKet): TongKetRow => {
    const ketQua = layKetQuaSv(sv)
    const baseScore = layBaseScoreSv(ketQua)
    const gpa = layGpaHocKy(ketQua, baseScore)
    const phanLoai = layXepLoaiHocKy(ketQua, gpa, xepLoaiHocLuc, baseScore)
    const ngaySinh = sv.userProfile?.dateOfBirth
      ? dinhDangNgaySinh(sv.userProfile.dateOfBirth)
      : null

    return {
      id: sv.id,
      maSinhVien: sv.userProfile?.code ?? sv.code ?? "",
      hoVaTen: sv.userProfile?.fullname ?? "",
      ngaySinh: ngaySinh === "—" ? null : ngaySinh,
      maLop: sv.fixedClass?.code ?? "",
      tenLop: sv.fixedClass?.name ?? "",
      namHocThu: ketQua?.studyYear ?? null,
      hocKyThu: theoKy ? (ketQua?.semesterIndexInCourse ?? null) : null,
      heSoXetHocBong: dinhDangHeSoXetHocBong(ketQua?.baseScore ?? baseScore),
      trungBinhHe4: chuyenSo(ketQua?.gpaBase4),
      tichLuyHe4: chuyenSo(ketQua?.cumulativeGpaBase4),
      trungBinhHe10: chuyenSo(ketQua?.gpaBase10),
      tichLuyHe10: chuyenSo(ketQua?.cumulativeGpaBase10),
      xepLoai: phanLoai.classification,
      diemRenLuyen: theoKy
        ? layDiemRenLuyenSinhVien(sv as Parameters<typeof layDiemRenLuyenSinhVien>[0])
        : layDiemRenLuyenNamHoc(sv as Parameters<typeof layDiemRenLuyenNamHoc>[0]),
      diem: gpa,
    }
  }

  const tatCaDanhSach: TongKetRow[] = useMemo(
    () => tatCaSinhVien.map((sv) => toTongKetRow(sv as SinhVienTongKet)),
    [tatCaSinhVien, xepLoaiHocLuc, baseScoreKhoa, theoKy]
  )

  const danhSachLoc = useMemo(() => {
    if (!locXepLoai) return null
    return tatCaDanhSach.filter((sv) => sv.xepLoai === locXepLoai)
  }, [locXepLoai, tatCaDanhSach])

  const danhSach: TongKetRow[] = useMemo(() => {
    if (danhSachLoc) {
      const batDau = (trang - 1) * soTrang
      return danhSachLoc.slice(batDau, batDau + soTrang)
    }
    return trangData.map((sv) => toTongKetRow(sv as SinhVienTongKet))
  }, [danhSachLoc, trang, soTrang, trangData, xepLoaiHocLuc, baseScoreKhoa, theoKy])

  const thongKe: ThongKeTongKet = useMemo(() => {
    let tongDiem = 0
    let soCoDiem = 0
    const demTheoXepLoai = new Map<string, number>()

    for (const item of xepLoaiHocLuc) {
      demTheoXepLoai.set(item.classification, 0)
    }

    for (const sv of tatCaDanhSach) {
      if (sv.diem != null) {
        tongDiem += sv.diem
        soCoDiem += 1
      }

      if (sv.xepLoai) {
        demTheoXepLoai.set(sv.xepLoai, (demTheoXepLoai.get(sv.xepLoai) ?? 0) + 1)
      }
    }

    const tong = tatCaDanhSach.length

    return {
      tongSinhVien: tong,
      diemTrungBinh: soCoDiem > 0 ? Math.round((tongDiem / soCoDiem) * 100) / 100 : null,
      heDiem,
      theoXepLoai: xepLoaiHocLuc.map((item) => ({
        ten: item.classification,
        rankOrder: item.rankOrder,
        soSinhVien: demTheoXepLoai.get(item.classification) ?? 0,
        tyLe: tinhTyLe(demTheoXepLoai.get(item.classification) ?? 0, tong),
      })),
    }
  }, [tatCaDanhSach, xepLoaiHocLuc, heDiem])

  const tongSoHienThi = danhSachLoc ? danhSachLoc.length : tongSo

  const apDungBoLoc = ({
    schoolYearId: yearId,
    semesterId: kyId,
  }: {
    schoolYearId: string
    semesterId?: string
  }) => {
    setSchoolYearApDung(yearId)
    setSemesterApDung(kyId)
    setLocXepLoai(null)
    setTrang(1)
  }

  const chonLocXepLoai = (ten: string) => {
    const coSinhVien = thongKe.theoXepLoai.some((item) => item.ten === ten && item.soSinhVien > 0)
    if (!coSinhVien) return
    setLocXepLoai((hienTai) => (hienTai === ten ? null : ten))
    setTrang(1)
  }

  return {
    schoolYearId,
    semesterId,
    theoKy,
    apDungBoLoc,
    locXepLoai,
    chonLocXepLoai,
    danhSach,
    thongKe,
    tongSo: tongSoHienThi,
    trang,
    setTrang,
    soTrang,
    setSoTrang,
    dangTai: queryEnabled && (dangTaiBang || dangTaiThongKe),
  }
}

export { useTongKetLopQuanLy }
