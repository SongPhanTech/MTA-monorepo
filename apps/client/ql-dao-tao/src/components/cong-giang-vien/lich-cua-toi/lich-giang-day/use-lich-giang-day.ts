import {
  khoangNgayQuery,
  mapLichGiangDaySangDong,
  tinhThongKeLichGiangDay,
} from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/utils"
import type { CheDoHienThiLich, DangXemLich } from "@components/cong-giang-vien/lich-cua-toi/types"
import { useLecturerHienTai } from "@hooks/use-lecturer-hien-tai"
import { useSession } from "@workspace/auth/react"
import { useFindManyClassSchedule } from "@workspace/db/hooks"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import dayjs, { type Dayjs } from "dayjs"
import "dayjs/locale/vi"
import { useMemo, useState } from "react"

dayjs.locale("vi")

const SO_TRANG_MAC_DINH = 10

const dieuKienLichGiangVien = (
  lecturerId: string | undefined,
  profileId: string | undefined,
  semesterId: string | undefined,
  trainingObjectId: string | undefined
) => ({
  OR: [
    ...(lecturerId ? [{ lecturerId }, { extraLecturerId: lecturerId }] : []),
    ...(profileId && semesterId && trainingObjectId
      ? [
          {
            subjectClass: {
              mainLecturer: { userProfileId: profileId },
              semesterId,
              trainingObjectTypeId: trainingObjectId,
              cancelled: false,
            },
          },
          {
            subjectClass: {
              extraLecturer: { userProfileId: profileId },
              semesterId,
              trainingObjectTypeId: trainingObjectId,
              cancelled: false,
            },
          },
        ]
      : []),
  ],
})

const useLichGiangDay = () => {
  const { data: me } = useSession()
  const profileId = me?.sDM_NhanVienId
  const { lecturerId, isLoading: dangTaiLecturer } = useLecturerHienTai()
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectId } = useTrainingObjectTypeStore()

  const [cheDoHienThi, setCheDoHienThi] = useState<CheDoHienThiLich>("ngay")
  const [dangXem, setDangXem] = useState<DangXemLich>("bang")
  const [ngayChon, setNgayChon] = useState<Dayjs>(() => dayjs())
  const [tuKhoa, setTuKhoa] = useState("")
  const [trang, setTrang] = useState(1)
  const [soTrang] = useState(SO_TRANG_MAC_DINH)

  const duDieuKienQuery = !!profileId && !!semesterId && !!trainingObjectId

  const { data: lichRaw = [], isLoading: dangTaiLich } = useFindManyClassSchedule(
    {
      where: {
        ...khoangNgayQuery(ngayChon),
        ...dieuKienLichGiangVien(lecturerId, profileId, semesterId, trainingObjectId),
      },
      include: {
        subjectClass: {
          select: {
            id: true,
            code: true,
            name: true,
            subject: { select: { name: true, code: true } },
            trainingLocation: { select: { name: true } },
            room: { select: { name: true } },
          },
        },
        room: {
          select: {
            name: true,
            building: { select: { trainingLocation: { select: { name: true } } } },
          },
        },
      },
      orderBy: [{ classDate: "asc" }, { startPeriod: "asc" }],
    },
    { enabled: duDieuKienQuery }
  )

  const danhSachGoc = useMemo(() => lichRaw.map(mapLichGiangDaySangDong), [lichRaw])

  const danhSachLoc = useMemo(() => {
    const q = tuKhoa.trim().toLowerCase()
    if (!q) return danhSachGoc
    return danhSachGoc.filter(
      (item) =>
        item.hocPhan.toLowerCase().includes(q) ||
        item.lopHocPhan.toLowerCase().includes(q) ||
        item.phongHoc.toLowerCase().includes(q) ||
        item.khuVuc.toLowerCase().includes(q) ||
        item.ghiChu.toLowerCase().includes(q)
    )
  }, [danhSachGoc, tuKhoa])

  const thongKe = useMemo(() => tinhThongKeLichGiangDay(danhSachGoc), [danhSachGoc])

  const tongSo = danhSachLoc.length
  const batDau = tongSo === 0 ? 0 : (trang - 1) * soTrang + 1
  const ketThuc = Math.min(trang * soTrang, tongSo)

  const danhSachTrang = useMemo(
    () => danhSachLoc.slice((trang - 1) * soTrang, trang * soTrang),
    [danhSachLoc, trang, soTrang]
  )

  const luiNgay = () => setNgayChon((d) => d.subtract(1, "day"))
  const tienNgay = () => setNgayChon((d) => d.add(1, "day"))

  const onDoiTuKhoa = (value: string) => {
    setTuKhoa(value)
    setTrang(1)
  }

  return {
    cheDoHienThi,
    setCheDoHienThi,
    dangXem,
    setDangXem,
    ngayChon,
    setNgayChon,
    luiNgay,
    tienNgay,
    tuKhoa,
    onDoiTuKhoa,
    thongKe,
    danhSachGoc,
    danhSachTrang,
    tongSo,
    trang,
    setTrang,
    soTrang,
    batDau,
    ketThuc,
    isLoading: dangTaiLecturer || dangTaiLich,
  }
}

export { useLichGiangDay }
