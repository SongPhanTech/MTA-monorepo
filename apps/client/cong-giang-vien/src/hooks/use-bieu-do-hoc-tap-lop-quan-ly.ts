import { useFindManyStudent, useFindManyStudentSubjectScore } from "@workspace/db/hooks"
import { useMemo } from "react"

export type KetQuaKyBieuDo = {
  semesterId: string
  gpaBase4?: unknown
  cumulativeGpaBase4?: unknown
  accumulatedCredits?: number | null
  totalCreditsByCurriculum?: number | null
  conductScore?: number | null
  semester?: {
    id: string
    name?: string | null
    startDate?: Date | string | null
    schoolYear?: { name?: string | null } | null
  } | null
  rank?: { classification?: string | null } | null
}

const so = (value: unknown) => (value != null ? Number(value) : null)

const trungBinh = (values: number[]) => {
  if (values.length === 0) return null
  return values.reduce((acc, item) => acc + item, 0) / values.length
}

const lamTron = (value: number | null, chuSo = 2) =>
  value != null ? Math.round(value * 10 ** chuSo) / 10 ** chuSo : null

const useBieuDoHocTapLopQuanLy = (
  studentId: string,
  fixedClassId: string,
  ketQuaTheoKy: KetQuaKyBieuDo[],
  enabled: boolean
) => {
  const { data: sinhVienLop = [], isLoading: dangTaiSinhVien } = useFindManyStudent(
    {
      where: { fixedClassId, deletedAt: null, active: true },
      select: {
        id: true,
        userProfile: { select: { fullname: true } },
        studentSemesterResult: {
          where: { deletedAt: null, active: true },
          select: {
            semesterId: true,
            gpaBase4: true,
            cumulativeGpaBase4: true,
            accumulatedCredits: true,
            totalCreditsByCurriculum: true,
          },
        },
      },
    },
    { enabled: enabled && !!fixedClassId }
  )

  const ketQuaSapXep = useMemo(
    () =>
      [...ketQuaTheoKy].sort(
        (a, b) =>
          new Date(a.semester?.startDate ?? 0).getTime() -
          new Date(b.semester?.startDate ?? 0).getTime()
      ),
    [ketQuaTheoKy]
  )

  const hocKyMoiNhat = ketQuaSapXep[ketQuaSapXep.length - 1]
  const hocKyTruoc = ketQuaSapXep[ketQuaSapXep.length - 2]
  const semesterIdMoiNhat = hocKyMoiNhat?.semesterId

  const { data: diemMonHocLop = [], isLoading: dangTaiDiem } = useFindManyStudentSubjectScore(
    {
      where: {
        subjectClass: {
          semesterId: semesterIdMoiNhat,
          cancelled: false,
        },
        student: { fixedClassId, deletedAt: null, active: true },
      },
      select: {
        studentId: true,
        attendanceScore: true,
        examScore: true,
        finalScore: true,
        manualFinalScore: true,
      },
    },
    { enabled: enabled && !!fixedClassId && !!semesterIdMoiNhat }
  )

  const thongKe = useMemo(() => {
    const gpaHienTai = so(hocKyMoiNhat?.cumulativeGpaBase4)
    const gpaTruoc = so(hocKyTruoc?.cumulativeGpaBase4)
    const chenhGpa = gpaHienTai != null && gpaTruoc != null ? lamTron(gpaHienTai - gpaTruoc) : null

    const duLieuGpaTheoKy = ketQuaSapXep.map((item, index) => {
      const nhan = [
        item.semester?.name,
        item.semester?.schoolYear?.name,
        index === ketQuaSapXep.length - 1 ? "(Hiện tại)" : null,
      ]
        .filter(Boolean)
        .join(" ")

      const diemSv = so(item.cumulativeGpaBase4)
      const diemLop = trungBinh(
        sinhVienLop
          .map((sv) => {
            const kq = sv.studentSemesterResult.find((r) => r.semesterId === item.semesterId)
            return so(kq?.cumulativeGpaBase4)
          })
          .filter((v): v is number => v != null)
      )

      return {
        semesterId: item.semesterId,
        nhan,
        gpaSinhVien: diemSv,
        gpaLop: diemLop != null ? lamTron(diemLop) : null,
      }
    })

    const xepHangLop = sinhVienLop
      .map((sv) => {
        const kq = sv.studentSemesterResult.find((r) => r.semesterId === semesterIdMoiNhat)
        return {
          id: sv.id,
          hoTen: sv.userProfile?.fullname ?? "—",
          gpa: so(kq?.cumulativeGpaBase4) ?? 0,
        }
      })
      .sort((a, b) => b.gpa - a.gpa)

    const thuHang = xepHangLop.findIndex((item) => item.id === studentId) + 1
    const tongSinhVien = xepHangLop.length
    const topPhanTram =
      thuHang > 0 && tongSinhVien > 0 ? Math.round((thuHang / tongSinhVien) * 100) : null

    const diemSvKy = diemMonHocLop.filter((item) => item.studentId === studentId)
    const diemTbSv = trungBinh(
      diemSvKy
        .map((item) =>
          item.manualFinalScore != null
            ? Number(item.manualFinalScore)
            : item.finalScore != null
              ? Number(item.finalScore)
              : null
        )
        .filter((v): v is number => v != null)
    )
    const diemThiSv = trungBinh(
      diemSvKy.map((item) => item.examScore).filter((v): v is number => v != null)
    )
    const chuyenCanSv = trungBinh(
      diemSvKy.map((item) => item.attendanceScore).filter((v): v is number => v != null)
    )

    const diemTheoSv = new Map<string, typeof diemMonHocLop>()
    for (const item of diemMonHocLop) {
      const list = diemTheoSv.get(item.studentId) ?? []
      list.push(item)
      diemTheoSv.set(item.studentId, list)
    }

    const diemTbLop = trungBinh(
      Array.from(diemTheoSv.values())
        .map((list) =>
          trungBinh(
            list
              .map((item) =>
                item.manualFinalScore != null
                  ? Number(item.manualFinalScore)
                  : item.finalScore != null
                    ? Number(item.finalScore)
                    : null
              )
              .filter((v): v is number => v != null)
          )
        )
        .filter((v): v is number => v != null)
    )
    const diemThiLop = trungBinh(
      Array.from(diemTheoSv.values())
        .map((list) =>
          trungBinh(list.map((item) => item.examScore).filter((v): v is number => v != null))
        )
        .filter((v): v is number => v != null)
    )
    const chuyenCanLop = trungBinh(
      Array.from(diemTheoSv.values())
        .map((list) =>
          trungBinh(list.map((item) => item.attendanceScore).filter((v): v is number => v != null))
        )
        .filter((v): v is number => v != null)
    )

    const tinChiSv = hocKyMoiNhat?.accumulatedCredits ?? null
    const tinChiTong = hocKyMoiNhat?.totalCreditsByCurriculum ?? null
    const tinChiPctSv =
      tinChiSv != null && tinChiTong != null && tinChiTong > 0
        ? lamTron((tinChiSv / tinChiTong) * 100, 0)
        : null

    const tinChiPctLop = trungBinh(
      sinhVienLop
        .map((sv) => {
          const kq = sv.studentSemesterResult.find((r) => r.semesterId === semesterIdMoiNhat)
          if (
            kq?.accumulatedCredits == null ||
            kq.totalCreditsByCurriculum == null ||
            kq.totalCreditsByCurriculum <= 0
          ) {
            return null
          }
          return (kq.accumulatedCredits / kq.totalCreditsByCurriculum) * 100
        })
        .filter((v): v is number => v != null)
    )

    const chuyenCanPct = (value: number | null) =>
      value != null ? lamTron((value / 10) * 100, 0) : null

    const bangXepHang = xepHangLop.map((item, index) => ({
      thuHang: index + 1,
      hoTen: item.hoTen,
      gpa: item.gpa,
      laBan: item.id === studentId,
    }))

    return {
      gpaHienTai,
      chenhGpa,
      thuHang: thuHang || null,
      tongSinhVien,
      topPhanTram,
      tinChiTichLuy: tinChiSv,
      tinChiTong,
      xepLoaiHocLuc: hocKyMoiNhat?.rank?.classification ?? "—",
      duLieuGpaTheoKy,
      bangXepHang,
      soSanhLop: [
        {
          nhan: "Điểm trung bình",
          sinhVien: lamTron(diemTbSv),
          lop: lamTron(diemTbLop),
          donVi: "",
        },
        {
          nhan: "Điểm thi",
          sinhVien: lamTron(diemThiSv),
          lop: lamTron(diemThiLop),
          donVi: "",
        },
        {
          nhan: "Tín chỉ tích lũy (%)",
          sinhVien: tinChiPctSv,
          lop: tinChiPctLop != null ? lamTron(tinChiPctLop, 0) : null,
          donVi: "%",
        },
        {
          nhan: "Chuyên cần (%)",
          sinhVien: chuyenCanPct(chuyenCanSv),
          lop: chuyenCanPct(chuyenCanLop),
          donVi: "%",
        },
      ],
    }
  }, [
    ketQuaSapXep,
    hocKyMoiNhat,
    hocKyTruoc,
    sinhVienLop,
    diemMonHocLop,
    studentId,
    semesterIdMoiNhat,
  ])

  return {
    thongKe,
    dangTai: enabled && (dangTaiSinhVien || dangTaiDiem),
  }
}

export { useBieuDoHocTapLopQuanLy }
