import type {
  SinhVienDiemDanhRow,
  ThongTinBuoiHoc,
  TrangThaiDiemDanh,
} from "@components/cong-giang-vien/lop-tro-giang/diem-danh/types"
import { tinhTongKet } from "@components/cong-giang-vien/lop-tro-giang/diem-danh/types"
import { queryClient } from "@api/index"
import { useSession } from "@workspace/auth/react"
import { $Enums } from "@workspace/db/client"
import {
  useCreateSubjectClassAttendance,
  useFindManySubjectClass,
  useFindUniqueSubjectClass,
} from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { useSemesterStore } from "@workspace/ui"
import { message } from "antd"
import dayjs, { type Dayjs } from "dayjs"
import { useEffect, useMemo, useState } from "react"

const useDiemDanhTroGiang = (lopIdMacDinh?: string) => {
  const { data: me } = useSession()
  const profileId = me?.sDM_NhanVienId ?? ""
  const { id: semesterId } = useSemesterStore()

  // ----- Lựa chọn bộ lọc -----
  const [monHocId, setMonHocId] = useState<string | undefined>()
  const [lopId, setLopId] = useState<string | undefined>(lopIdMacDinh)
  const [ngay, setNgay] = useState<Dayjs>(dayjs())

  // Khóa kích hoạt nạp danh sách (chỉ nạp khi bấm "Lấy danh sách").
  const [khoaTai, setKhoaTai] = useState<{ lopId: string; ngay: string } | null>(null)

  // ----- Trạng thái điểm danh cục bộ -----
  const [danhSach, setDanhSach] = useState<SinhVienDiemDanhRow[]>([])
  const [ghiChuBuoiHoc, setGhiChuBuoiHoc] = useState("")
  const [dangLuu, setDangLuu] = useState(false)

  // ----- Danh sách lớp trợ giảng (cho dropdown Môn học / Lớp) -----
  const whereLop = useMemo(
    () => ({
      cancelled: false,
      deletedAt: null,
      active: true,
      status: $Enums.SubjectClassStatus.OFFICIAL,
      extraLecturer: { userProfileId: profileId },
      semesterId,
    }),
    [profileId, semesterId]
  )

  const { data: dsLop = [], isLoading: dangTaiLop } = useFindManySubjectClass(
    {
      where: whereLop,
      include: { subject: { select: { id: true, code: true, name: true } } },
      orderBy: [{ code: "asc" }],
    },
    { enabled: !!profileId && !!semesterId }
  )

  const monHocOptions = useMemo(() => {
    const map = new Map<string, string>()
    dsLop.forEach((lop) => {
      if (lop.subject?.id) map.set(lop.subject.id, `${lop.subject.code} - ${lop.subject.name}`)
    })
    return Array.from(map, ([value, label]) => ({ value, label }))
  }, [dsLop])

  const lopOptions = useMemo(
    () =>
      dsLop
        .filter((lop) => !monHocId || lop.subject?.id === monHocId)
        .map((lop) => ({ value: lop.id, label: lop.code ?? "" })),
    [dsLop, monHocId]
  )

  useEffect(() => {
    if (monHocOptions.length === 0) return
    if (monHocId && monHocOptions.some((o) => o.value === monHocId)) return
    const lopMacDinh = lopIdMacDinh ? dsLop.find((lop) => lop.id === lopIdMacDinh) : undefined
    setMonHocId(lopMacDinh?.subject?.id ?? monHocOptions[0]?.value)
  }, [monHocId, monHocOptions, dsLop, lopIdMacDinh])

  useEffect(() => {
    if (lopOptions.length === 0) return
    if (lopId && lopOptions.some((o) => o.value === lopId)) return
    setLopId(lopOptions[0]?.value)
  }, [lopId, lopOptions])

  const ngayBatDau = useMemo(
    () => (khoaTai ? dayjs(khoaTai.ngay).startOf("day").toDate() : null),
    [khoaTai]
  )
  const ngayKetThuc = useMemo(
    () => (khoaTai ? dayjs(khoaTai.ngay).endOf("day").toDate() : null),
    [khoaTai]
  )

  const { data: chiTietLop, isLoading: dangTaiChiTiet } = useFindUniqueSubjectClass(
    {
      where: { id: khoaTai?.lopId },
      include: {
        subjectClassStudent: {
          include: { student: { include: { userProfile: { select: { fullname: true } } } } },
        },
        classSchedules: {
          where: { classDate: { gte: ngayBatDau ?? undefined, lte: ngayKetThuc ?? undefined } },
          include: { room: { select: { name: true } } },
        },
        subjectClassAttendances: {
          where: { time: { gte: ngayBatDau ?? undefined, lte: ngayKetThuc ?? undefined } },
          include: { subjectClassAttendanceStudent: true },
        },
      },
    },
    { enabled: !!khoaTai?.lopId }
  )

  // Phiếu điểm danh đã tồn tại cho ngày đang chọn (nếu có).
  const phieuDaCo = chiTietLop?.subjectClassAttendances?.[0]

  useEffect(() => {
    if (!chiTietLop) return

    const trangThaiTheoSv = new Map<string, { trangThai: TrangThaiDiemDanh; ghiChu: string }>()
    phieuDaCo?.subjectClassAttendanceStudent?.forEach((sv: any) => {
      trangThaiTheoSv.set(sv.studentId, {
        trangThai: (sv.attendanceStatus as TrangThaiDiemDanh) ?? "PRESENT",
        ghiChu: sv.note ?? "",
      })
    })

    const rows: SinhVienDiemDanhRow[] = (chiTietLop.subjectClassStudent ?? []).map((scs: any) => {
      const daCo = trangThaiTheoSv.get(scs.studentId)
      return {
        id: scs.studentId,
        studentId: scs.studentId,
        maSinhVien: scs.student?.userProfile?.code ?? "",
        hoTen: scs.student?.userProfile?.fullname ?? "",
        trangThai: daCo?.trangThai ?? "PRESENT",
        ghiChu: daCo?.ghiChu ?? "",
      }
    })

    setDanhSach(rows)
    setGhiChuBuoiHoc((phieuDaCo as any)?.note ?? "")
  }, [chiTietLop])

  // Thông tin buổi học từ thời khóa biểu của ngày đang chọn.
  const thongTinBuoiHoc: ThongTinBuoiHoc | null = useMemo(() => {
    if (!chiTietLop || !khoaTai) return null
    const lich = chiTietLop.classSchedules?.[0]
    return {
      ngayHoc: dayjs(khoaTai.ngay).format("DD/MM/YYYY"),
      tietHoc: lich ? `${lich.startPeriod} - ${lich.endPeriod}` : "—",
      phongHoc: lich?.room?.name ?? "—",
      siSo: chiTietLop.subjectClassStudent?.length ?? 0,
    }
  }, [chiTietLop, khoaTai])

  const tongKet = useMemo(() => tinhTongKet(danhSach), [danhSach])

  // ----- Hành vi -----
  const doiMonHoc = (value?: string) => {
    setMonHocId(value)
    setLopId(undefined)
  }

  const layDanhSach = () => {
    if (!lopId) {
      message.warning("Vui lòng chọn lớp")
      return
    }
    setKhoaTai({ lopId, ngay: ngay.toISOString() })
  }

  const doiTrangThaiSinhVien = (studentId: string, trangThai: TrangThaiDiemDanh) => {
    setDanhSach((prev) =>
      prev.map((sv) => (sv.studentId === studentId ? { ...sv, trangThai } : sv))
    )
  }

  const doiGhiChuSinhVien = (studentId: string, ghiChu: string) => {
    setDanhSach((prev) => prev.map((sv) => (sv.studentId === studentId ? { ...sv, ghiChu } : sv)))
  }

  const { mutateAsync: taoPhieu } = useCreateSubjectClassAttendance()

  const luuDiemDanh = async () => {
    if (!khoaTai?.lopId || danhSach.length === 0) {
      message.warning("Chưa có dữ liệu điểm danh để lưu")
      return
    }
    try {
      setDangLuu(true)
      const time = dayjs(khoaTai.ngay).toDate()
      const classScheduleId = chiTietLop?.classSchedules?.[0]?.id

      if (phieuDaCo) {
        const transactions: any[] = [
          {
            model: "SubjectClassAttendance",
            operation: "update",
            data: { where: { id: phieuDaCo.id }, data: { note: ghiChuBuoiHoc } },
          },
        ]
        const svTheoStudentId = new Map(
          phieuDaCo.subjectClassAttendanceStudent?.map((sv: any) => [sv.studentId, sv.id]) ?? []
        )
        danhSach.forEach((sv) => {
          const rowId = svTheoStudentId.get(sv.studentId)
          if (rowId) {
            transactions.push({
              model: "SubjectClassAttendanceStudent",
              operation: "update",
              data: {
                where: { id: rowId },
                data: { attendanceStatus: sv.trangThai, note: sv.ghiChu },
              },
            })
          } else {
            transactions.push({
              model: "SubjectClassAttendanceStudent",
              operation: "create",
              data: {
                data: {
                  subjectClassAttendanceId: phieuDaCo.id,
                  studentId: sv.studentId,
                  attendanceStatus: sv.trangThai,
                  note: sv.ghiChu,
                },
              },
            })
          }
        })
        await sqlTransaction(transactions)
      } else {
        // Tạo phiếu mới kèm danh sách sinh viên.
        await taoPhieu({
          data: {
            time,
            subjectClassId: khoaTai.lopId,
            ...(profileId ? { profileId } : {}),
            ...(classScheduleId ? { classScheduleId } : {}),
            note: ghiChuBuoiHoc,
            subjectClassAttendanceStudent: {
              create: danhSach.map((sv) => ({
                studentId: sv.studentId,
                attendanceStatus: sv.trangThai,
                note: sv.ghiChu,
              })),
            },
          } as any,
        })
      }

      message.success("Lưu điểm danh thành công")
      queryClient.invalidateQueries({ queryKey: ["zenstack", "SubjectClass"] })
    } catch (error) {
      message.error("Lưu điểm danh thất bại")
    } finally {
      setDangLuu(false)
    }
  }

  return {
    // bộ lọc
    monHocId,
    lopId,
    ngay,
    monHocOptions,
    lopOptions,
    dangTaiLop,
    doiMonHoc,
    setLopId,
    setNgay,
    layDanhSach,
    danhSach,
    thongTinBuoiHoc,
    tongKet,
    ghiChuBuoiHoc,
    setGhiChuBuoiHoc,
    daLayDanhSach: !!khoaTai,
    dangTaiChiTiet: !!khoaTai && dangTaiChiTiet,
    doiTrangThaiSinhVien,
    doiGhiChuSinhVien,
    luuDiemDanh,
    dangLuu,
  }
}

export { useDiemDanhTroGiang }
