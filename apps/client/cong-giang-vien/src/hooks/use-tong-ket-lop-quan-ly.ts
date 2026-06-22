import type { ThongKeTongKet, TongKetRow } from "@components/cong-giang-vien/lop-quan-ly/types"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import {
  layDiemToiDa,
  layGpaHocKy,
  layHeDiemTotNghiep,
  phanLoaiDiemTotNghiep,
} from "@lib/tong-ket-hoc-ky"
import { AcademicRankingBaseType, RankingContext } from "@workspace/db/client"
import {
  useCountStudent,
  useFindManyAcademicRankingConvert,
  useFindManyStudent,
  useFindUniqueFixedClass,
} from "@workspace/db/hooks"
import { useSemesterStore } from "@workspace/ui"
import { useEffect, useMemo, useState } from "react"

const STUDENT_INCLUDE = (semesterId: string) =>
  ({
    userProfile: { select: { code: true, fullname: true } },
    studentSemesterResult: {
      where: { semesterId },
      select: {
        gpaBase4: true,
        gpaBase10: true,
        rank: { select: { classification: true, rankOrder: true } },
      },
      take: 1,
    },
  }) as const

const tinhTyLe = (so: number, tong: number) =>
  tong > 0 ? `${Math.round((so / tong) * 10000) / 100}%` : "0%"

type KetQuaHocKySv = {
  gpaBase4?: unknown
  gpaBase10?: unknown
  rank?: { classification?: string | null; rankOrder?: number | null } | null
}

const layXepLoaiHocKy = (
  ketQua: KetQuaHocKySv | undefined,
  gpa: number | null,
  xepLoaiHocLuc: Parameters<typeof phanLoaiDiemTotNghiep>[1],
  baseScoreKhoa: Parameters<typeof phanLoaiDiemTotNghiep>[2]
) => {
  const tuKetQua = ketQua?.rank?.classification
  if (tuKetQua) {
    return {
      classification: tuKetQua,
      rankOrder: ketQua.rank?.rankOrder ?? null,
    }
  }
  return phanLoaiDiemTotNghiep(gpa, xepLoaiHocLuc, baseScoreKhoa)
}

const useTongKetLopQuanLy = (fixedClassId: string, enabled: boolean) => {
  const { id: semesterMacDinh } = useSemesterStore()
  const [semesterApDung, setSemesterApDung] = useState(semesterMacDinh)
  const [trang, setTrang] = useState(1)
  const [soTrang, setSoTrang] = useState(DEFAULT_PAGINATE_SIZE)

  useEffect(() => {
    if (semesterMacDinh) setSemesterApDung(semesterMacDinh)
  }, [semesterMacDinh])

  const semesterId = semesterApDung || semesterMacDinh || ""

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

  const danhSach: TongKetRow[] = useMemo(
    () =>
      trangData.map((sv) => {
        const ketQua = sv.studentSemesterResult?.[0]
        const gpa = layGpaHocKy(ketQua, baseScoreKhoa)
        const phanLoai = layXepLoaiHocKy(ketQua, gpa, xepLoaiHocLuc, baseScoreKhoa)
        return {
          id: sv.id,
          maSinhVien: sv.userProfile?.code ?? sv.code ?? "",
          hoVaTen: sv.userProfile?.fullname ?? "",
          diemToiDa: layDiemToiDa(baseScoreKhoa),
          diem: gpa,
          xepLoai: phanLoai.classification,
          ghiChu: "",
        }
      }),
    [trangData, xepLoaiHocLuc, baseScoreKhoa]
  )

  const thongKe: ThongKeTongKet = useMemo(() => {
    let tongDiem = 0
    let soCoDiem = 0
    const demTheoXepLoai = new Map<string, number>()

    for (const item of xepLoaiHocLuc) {
      demTheoXepLoai.set(item.classification, 0)
    }

    for (const sv of tatCaSinhVien) {
      const ketQua = sv.studentSemesterResult?.[0]
      const gpa = layGpaHocKy(ketQua, baseScoreKhoa)
      const phanLoai = layXepLoaiHocKy(ketQua, gpa, xepLoaiHocLuc, baseScoreKhoa)

      if (gpa != null) {
        tongDiem += gpa
        soCoDiem += 1
      }

      if (phanLoai.classification) {
        demTheoXepLoai.set(
          phanLoai.classification,
          (demTheoXepLoai.get(phanLoai.classification) ?? 0) + 1
        )
      }
    }

    const tong = tatCaSinhVien.length

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
  }, [tatCaSinhVien, xepLoaiHocLuc, baseScoreKhoa, heDiem])

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

export { useTongKetLopQuanLy }
