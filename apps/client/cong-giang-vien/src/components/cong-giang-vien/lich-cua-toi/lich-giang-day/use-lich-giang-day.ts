import {
  chuyenSangDongBangTheoNgay,
  khoangNgayQuery,
  khoangThangQuery,
  khoangTuanQuery,
  layDanhSachNgayCoLich,
  layKhoangThang,
  layKhoangTuan,
  locSuKienTrongThang,
  mapLichGiangDaySangDong,
  tinhThongKeLichGiangDay,
  timTrangChuaNgay,
} from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/utils"
import type { CheDoHienThiLich, DangXemLich } from "@components/cong-giang-vien/lich-cua-toi/types"
import { useLecturerHienTai } from "@hooks/use-lecturer-hien-tai"
import { useSession } from "@workspace/auth/react"
import { useFindManyClassSchedule } from "@workspace/db/hooks"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import dayjs, { type Dayjs } from "dayjs"
import "dayjs/locale/vi"
import isoWeek from "dayjs/plugin/isoWeek"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

dayjs.extend(isoWeek)
dayjs.locale("vi")

const SO_TRANG_MAC_DINH = 10
const SO_NGAY_TRANG_THANG = 5

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

  const [cheDoHienThi, setCheDoHienThiState] = useState<CheDoHienThiLich>("tuan")
  const [dangXem, setDangXem] = useState<DangXemLich>("lich")
  const [ngayChon, setNgayChon] = useState<Dayjs>(() => dayjs())
  const [tuKhoa, setTuKhoa] = useState("")
  const [trang, setTrang] = useState(1)
  const [soTrang] = useState(SO_TRANG_MAC_DINH)
  const daFocusHomNayThang = useRef(false)

  const { dauTuan, cuoiTuan } = useMemo(() => layKhoangTuan(ngayChon), [ngayChon])
  const { dauThang, cuoiThang, dauLich, cuoiLich } = useMemo(
    () => layKhoangThang(ngayChon),
    [ngayChon]
  )

  const khoangHienTai = useMemo(() => {
    if (cheDoHienThi === "thang") return khoangThangQuery(dauLich, cuoiLich)
    if (cheDoHienThi === "tuan") return khoangTuanQuery(dauTuan, cuoiTuan)
    return khoangNgayQuery(ngayChon)
  }, [cheDoHienThi, dauLich, cuoiLich, dauTuan, cuoiTuan, ngayChon])

  const duDieuKienQuery = !!profileId && !!semesterId && !!trainingObjectId

  const {
    data: lichRaw = [],
    isLoading: dangTaiLich,
    isFetching: dangTaiLaiLich,
  } = useFindManyClassSchedule(
    {
      where: {
        ...khoangHienTai,
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

  const danhSachLichNgay = useMemo(
    () => danhSachGoc.filter((item) => item.ngayKey === ngayChon.format("YYYY-MM-DD")),
    [danhSachGoc, ngayChon]
  )

  const danhSachLichThang = useMemo(
    () => locSuKienTrongThang(danhSachGoc, ngayChon),
    [danhSachGoc, ngayChon]
  )

  const danhSachTrongThang = useMemo(
    () => (cheDoHienThi === "thang" ? locSuKienTrongThang(danhSachGoc, ngayChon) : danhSachGoc),
    [cheDoHienThi, danhSachGoc, ngayChon]
  )

  const danhSachLoc = useMemo(() => {
    const q = tuKhoa.trim().toLowerCase()
    if (!q) return danhSachTrongThang
    return danhSachTrongThang.filter(
      (item) =>
        item.hocPhan.toLowerCase().includes(q) ||
        item.lopHocPhan.toLowerCase().includes(q) ||
        item.phongHoc.toLowerCase().includes(q) ||
        item.khuVuc.toLowerCase().includes(q) ||
        item.ghiChu.toLowerCase().includes(q)
    )
  }, [danhSachTrongThang, tuKhoa])

  const ngayCoLich = useMemo(() => layDanhSachNgayCoLich(danhSachLoc), [danhSachLoc])

  const thongKe = useMemo(() => tinhThongKeLichGiangDay(danhSachTrongThang), [danhSachTrongThang])

  const phanTrangTheoNgay = cheDoHienThi === "thang"
  const soMucTrang = phanTrangTheoNgay ? SO_NGAY_TRANG_THANG : soTrang
  const tongSo = phanTrangTheoNgay ? ngayCoLich.length : danhSachLoc.length
  const batDau = tongSo === 0 ? 0 : (trang - 1) * soMucTrang + 1
  const ketThuc = Math.min(trang * soMucTrang, tongSo)

  const ngayTrang = useMemo(
    () =>
      phanTrangTheoNgay
        ? ngayCoLich.slice((trang - 1) * SO_NGAY_TRANG_THANG, trang * SO_NGAY_TRANG_THANG)
        : [],
    [phanTrangTheoNgay, ngayCoLich, trang]
  )

  const danhSachTrang = useMemo(() => {
    if (phanTrangTheoNgay) {
      const tapNgay = new Set(ngayTrang)
      return danhSachLoc.filter((item) => tapNgay.has(item.ngayKey))
    }
    return danhSachLoc.slice((trang - 1) * soTrang, trang * soTrang)
  }, [phanTrangTheoNgay, danhSachLoc, ngayTrang, trang, soTrang])

  const danhSachBangTheoNgay = useMemo(
    () => chuyenSangDongBangTheoNgay(danhSachTrang),
    [danhSachTrang]
  )

  const nhanKhoangThoiGian = useMemo(() => {
    if (cheDoHienThi === "thang") return null
    if (cheDoHienThi === "tuan") {
      return `${dauTuan.format("DD/MM/YYYY")} - ${cuoiTuan.format("DD/MM/YYYY")}`
    }
    return null
  }, [cheDoHienThi, dauTuan, cuoiTuan])

  const ngayHomNayKey = dayjs().format("YYYY-MM-DD")
  const thangChonKey = ngayChon.format("YYYY-MM")

  useEffect(() => {
    daFocusHomNayThang.current = false
  }, [thangChonKey, cheDoHienThi])

  useEffect(() => {
    if (cheDoHienThi !== "thang" || !ngayChon.isSame(dayjs(), "month")) return
    if (daFocusHomNayThang.current || ngayCoLich.length === 0) return

    const trangHomNay = timTrangChuaNgay(ngayCoLich, ngayHomNayKey, SO_NGAY_TRANG_THANG)
    setTrang(trangHomNay)
    daFocusHomNayThang.current = true
  }, [cheDoHienThi, ngayChon, ngayCoLich, ngayHomNayKey, thangChonKey])

  const setCheDoHienThi = useCallback((value: CheDoHienThiLich) => {
    setCheDoHienThiState(value)
    setTrang(1)
    daFocusHomNayThang.current = false
    if (value === "tuan") {
      setNgayChon(dayjs().startOf("isoWeek"))
    }
    if (value === "thang") {
      setNgayChon(dayjs())
    }
  }, [])

  const luiNgay = () => {
    daFocusHomNayThang.current = false
    setTrang(1)
    setNgayChon((d) => {
      if (cheDoHienThi === "thang") return d.subtract(1, "month").startOf("month")
      if (cheDoHienThi === "tuan") return d.subtract(1, "week").startOf("isoWeek")
      return d.subtract(1, "day")
    })
  }

  const tienNgay = () => {
    daFocusHomNayThang.current = false
    setTrang(1)
    setNgayChon((d) => {
      if (cheDoHienThi === "thang") return d.add(1, "month").startOf("month")
      if (cheDoHienThi === "tuan") return d.add(1, "week").startOf("isoWeek")
      return d.add(1, "day")
    })
  }

  const onDoiTuKhoa = (value: string) => {
    setTuKhoa(value)
    setTrang(1)
    daFocusHomNayThang.current = false
  }

  const onDoiNgay = useCallback(
    (ngay: Dayjs) => {
      daFocusHomNayThang.current = false
      setTrang(1)
      setNgayChon(
        cheDoHienThi === "thang"
          ? ngay.startOf("month")
          : cheDoHienThi === "tuan"
            ? ngay.startOf("isoWeek")
            : ngay
      )
    },
    [cheDoHienThi]
  )

  const veHomNay = useCallback(() => {
    daFocusHomNayThang.current = false
    setTrang(1)
    setNgayChon(dayjs())
  }, [])

  return {
    cheDoHienThi,
    setCheDoHienThi,
    dangXem,
    setDangXem,
    ngayChon,
    onDoiNgay,
    veHomNay,
    dauTuan,
    nhanKhoangThoiGian,
    ngayHomNayKey,
    luiNgay,
    tienNgay,
    tuKhoa,
    onDoiTuKhoa,
    thongKe,
    danhSachGoc,
    danhSachLichNgay,
    danhSachLichThang,
    danhSachTrang,
    danhSachBangTheoNgay,
    tongSo,
    trang,
    setTrang,
    soTrang: soMucTrang,
    batDau,
    ketThuc,
    donViPhanTrang: phanTrangTheoNgay ? ("ngày" as const) : ("lịch" as const),
    isLoading: dangTaiLecturer || dangTaiLich || dangTaiLaiLich,
  }
}

export { useLichGiangDay }
