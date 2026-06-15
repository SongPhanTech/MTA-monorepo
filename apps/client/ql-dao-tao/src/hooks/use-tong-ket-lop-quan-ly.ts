import type { ThongKeTongKet, TongKetRow } from "@components/cong-giang-vien/lop-quan-ly/types"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import {
  laHocLucTbTroXuong,
  layDiemToiDa,
  layGpaHocKy,
  layHeDiemTotNghiep,
  layNguongDatTotNghiep,
  layRankOrderTbTroXuong,
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
      },
      take: 1,
    },
  }) as const

const tinhTyLe = (so: number, tong: number) =>
  tong > 0 ? `${Math.round((so / tong) * 10000) / 100}%` : "0%"

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

  const { data: xepLoaiTotNghiep = [] } = useFindManyAcademicRankingConvert(
    {
      where: {
        trainingCourseId,
        context: RankingContext.GRADUATION,
        deletedAt: null,
        active: true,
      },
      orderBy: { rankOrder: "asc" },
    },
    { enabled: enabled && !!trainingCourseId }
  )

  const heDiem = layHeDiemTotNghiep(xepLoaiTotNghiep, baseScoreKhoa)
  const nguongDat = layNguongDatTotNghiep(xepLoaiTotNghiep, baseScoreKhoa)
  const rankOrderTbTroXuong = layRankOrderTbTroXuong(xepLoaiTotNghiep)

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
        const phanLoai = phanLoaiDiemTotNghiep(gpa, xepLoaiTotNghiep, baseScoreKhoa)
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
    [trangData, xepLoaiTotNghiep, baseScoreKhoa]
  )

  const thongKe: ThongKeTongKet = useMemo(() => {
    let tongDiem = 0
    let soCoDiem = 0
    let soDatNguong = 0
    let soDuoiNguong = 0
    let soXuatSac = 0
    let soGioi = 0
    let soKha = 0
    let soTbTroXuong = 0

    for (const sv of tatCaSinhVien) {
      const ketQua = sv.studentSemesterResult?.[0]
      const gpa = layGpaHocKy(ketQua, baseScoreKhoa)
      const phanLoai = phanLoaiDiemTotNghiep(gpa, xepLoaiTotNghiep, baseScoreKhoa)

      if (gpa != null) {
        tongDiem += gpa
        soCoDiem += 1
        if (phanLoai.graduated) soDatNguong += 1
        else soDuoiNguong += 1
      }

      if (phanLoai.classification) {
        const key = phanLoai.classification.toLowerCase()
        if (key.includes("xuất sắc")) soXuatSac += 1
        else if (key.includes("giỏi")) soGioi += 1
        else if (key.includes("khá") && !key.includes("trung bình")) soKha += 1
        else if (laHocLucTbTroXuong(phanLoai.rankOrder, rankOrderTbTroXuong)) soTbTroXuong += 1
      }
    }

    const tong = tatCaSinhVien.length

    return {
      tongSinhVien: tong,
      diemTrungBinh: soCoDiem > 0 ? Math.round((tongDiem / soCoDiem) * 100) / 100 : null,
      heDiem,
      nguongDat,
      soDatNguong,
      tyLeDatNguong: tinhTyLe(soDatNguong, tong),
      soDuoiNguong,
      tyLeDuoiNguong: tinhTyLe(soDuoiNguong, tong),
      soXuatSac,
      tyLeXuatSac: tinhTyLe(soXuatSac, tong),
      soGioi,
      tyLeGioi: tinhTyLe(soGioi, tong),
      soKha,
      tyLeKha: tinhTyLe(soKha, tong),
      soTbTroXuong,
      tyLeTbTroXuong: tinhTyLe(soTbTroXuong, tong),
    }
  }, [tatCaSinhVien, xepLoaiTotNghiep, baseScoreKhoa, heDiem, nguongDat, rankOrderTbTroXuong])

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
