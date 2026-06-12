import {
  khoangNgayQuery as khoangNgayCaNhan,
  khoangThangQuery as khoangThangCaNhan,
  khoangTuanQuery as khoangTuanCaNhan,
  mapLichSangDong,
} from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import {
  khoangNgayQuery as khoangNgayGiangDay,
  khoangThangQuery as khoangThangGiangDay,
  khoangTuanQuery as khoangTuanGiangDay,
  layKhoangThang,
  layKhoangTuan,
  mapLichGiangDaySangDong,
} from "@components/cong-giang-vien/lich-cua-toi/lich-giang-day/utils"
import {
  chuyenSangDongBangThang,
  chuyenSangDongBangTuan,
  gopVaSapXepLich,
  locLichTheoTuKhoa,
  locSuKienTrongThang,
  tinhThongKeTatCaLich,
} from "@components/cong-giang-vien/lich-cua-toi/tat-ca-lich/utils"
import type { CheDoHienThiLich, DangXemLich } from "@components/cong-giang-vien/lich-cua-toi/types"
import { useLecturerHienTai } from "@hooks/use-lecturer-hien-tai"
import { useSession } from "@workspace/auth/react"
import {
  useFindManyClassSchedule,
  useFindManyIndividualSchedule,
  useFindManyPersonalWorkTag,
} from "@workspace/db/hooks"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import dayjs, { type Dayjs } from "dayjs"
import "dayjs/locale/vi"
import isoWeek from "dayjs/plugin/isoWeek"
import { useCallback, useMemo, useState } from "react"

dayjs.extend(isoWeek)
dayjs.locale("vi")

const SO_TRANG_NGAY = 10
const SO_TRANG_TUAN = 12
const SO_TRANG_THANG = 8

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

const useTatCaLich = () => {
  const { data: me } = useSession()
  const profileId = me?.sDM_NhanVienId
  const { lecturerId, isLoading: dangTaiLecturer } = useLecturerHienTai()
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectId } = useTrainingObjectTypeStore()

  const [cheDoHienThi, setCheDoHienThiState] = useState<CheDoHienThiLich>("ngay")
  const [dangXem, setDangXemState] = useState<DangXemLich>("bang")
  const [ngayChon, setNgayChon] = useState<Dayjs>(() => dayjs())
  const [tuKhoa, setTuKhoa] = useState("")
  const [trang, setTrang] = useState(1)

  const { dauTuan, cuoiTuan } = useMemo(() => layKhoangTuan(ngayChon), [ngayChon])
  const { dauLich, cuoiLich } = useMemo(() => layKhoangThang(ngayChon), [ngayChon])

  const khoangGiangDay = useMemo(() => {
    if (cheDoHienThi === "thang") return khoangThangGiangDay(dauLich, cuoiLich)
    if (cheDoHienThi === "tuan") return khoangTuanGiangDay(dauTuan, cuoiTuan)
    return khoangNgayGiangDay(ngayChon)
  }, [cheDoHienThi, dauLich, cuoiLich, dauTuan, cuoiTuan, ngayChon])

  const khoangCaNhan = useMemo(() => {
    if (cheDoHienThi === "thang") return khoangThangCaNhan(dauLich, cuoiLich)
    if (cheDoHienThi === "tuan") return khoangTuanCaNhan(dauTuan, cuoiTuan)
    return khoangNgayCaNhan(ngayChon)
  }, [cheDoHienThi, dauLich, cuoiLich, dauTuan, cuoiTuan, ngayChon])

  const duDieuKienGiangDay = !!profileId && !!semesterId && !!trainingObjectId
  const duDieuKienCaNhan = !!lecturerId
  const duDieuKienFetch =
    cheDoHienThi === "ngay" || cheDoHienThi === "tuan" || cheDoHienThi === "thang"

  const { data: lichGiangRaw = [], isLoading: dangTaiGiangDay } = useFindManyClassSchedule(
    {
      where: {
        ...khoangGiangDay,
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
    { enabled: duDieuKienGiangDay && duDieuKienFetch }
  )

  const { data: lichCaNhanRaw = [], isLoading: dangTaiCaNhan } = useFindManyIndividualSchedule(
    {
      where: {
        lecturerId: lecturerId ?? "",
        ...khoangCaNhan,
      },
      include: { tags: { select: { id: true, name: true, color: true } } },
      orderBy: [{ startTime: "asc" }],
    },
    { enabled: duDieuKienCaNhan && duDieuKienFetch }
  )

  const { data: tags = [], isLoading: dangTaiTag } = useFindManyPersonalWorkTag(
    {
      where: { lecturerId: lecturerId ?? "" },
      select: { id: true, name: true, color: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    },
    { enabled: duDieuKienCaNhan }
  )

  const danhSachHop = useMemo(() => {
    const giangDay = lichGiangRaw.map(mapLichGiangDaySangDong)
    const caNhan = lichCaNhanRaw.map(mapLichSangDong)
    return gopVaSapXepLich(giangDay, caNhan)
  }, [lichGiangRaw, lichCaNhanRaw])

  const danhSachGoc = useMemo(() => {
    if (cheDoHienThi === "thang") return locSuKienTrongThang(danhSachHop, ngayChon)
    return danhSachHop
  }, [cheDoHienThi, danhSachHop, ngayChon])

  const danhSachLoc = useMemo(() => locLichTheoTuKhoa(danhSachGoc, tuKhoa), [danhSachGoc, tuKhoa])

  const thongKe = useMemo(() => tinhThongKeTatCaLich(danhSachGoc), [danhSachGoc])

  const soTrang =
    cheDoHienThi === "thang"
      ? SO_TRANG_THANG
      : cheDoHienThi === "tuan"
        ? SO_TRANG_TUAN
        : SO_TRANG_NGAY
  const tongSo = danhSachLoc.length
  const batDau = tongSo === 0 ? 0 : (trang - 1) * soTrang + 1
  const ketThuc = Math.min(trang * soTrang, tongSo)

  const danhSachTrang = useMemo(
    () => danhSachLoc.slice((trang - 1) * soTrang, trang * soTrang),
    [danhSachLoc, trang, soTrang]
  )

  const danhSachBangTuan = useMemo(() => chuyenSangDongBangTuan(danhSachTrang), [danhSachTrang])

  const danhSachBangThang = useMemo(() => chuyenSangDongBangThang(danhSachTrang), [danhSachTrang])

  const setCheDoHienThi = useCallback((value: CheDoHienThiLich) => {
    setCheDoHienThiState(value)
    setTrang(1)
    if (value === "tuan") {
      setNgayChon(dayjs().startOf("isoWeek"))
    }
    if (value === "thang") {
      setNgayChon(dayjs().startOf("month"))
    }
    if (value === "ngay") {
      setNgayChon(dayjs())
    }
  }, [])

  const setDangXem = setDangXemState

  const onDoiTuKhoa = (value: string) => {
    setTuKhoa(value)
    setTrang(1)
  }

  const onDoiNgay = useCallback(
    (ngay: Dayjs) => {
      setTrang(1)
      if (cheDoHienThi === "tuan") setNgayChon(ngay.startOf("isoWeek"))
      else if (cheDoHienThi === "thang") setNgayChon(ngay.startOf("month"))
      else setNgayChon(ngay)
    },
    [cheDoHienThi]
  )

  const luiNgay = () => {
    setTrang(1)
    setNgayChon((d) => {
      if (cheDoHienThi === "thang") return d.subtract(1, "month").startOf("month")
      if (cheDoHienThi === "tuan") return d.subtract(1, "week").startOf("isoWeek")
      return d.subtract(1, "day")
    })
  }

  const tienNgay = () => {
    setTrang(1)
    setNgayChon((d) => {
      if (cheDoHienThi === "thang") return d.add(1, "month").startOf("month")
      if (cheDoHienThi === "tuan") return d.add(1, "week").startOf("isoWeek")
      return d.add(1, "day")
    })
  }

  return {
    cheDoHienThi,
    setCheDoHienThi,
    dangXem,
    setDangXem,
    ngayChon,
    dauTuan,
    onDoiNgay,
    luiNgay,
    tienNgay,
    tuKhoa,
    onDoiTuKhoa,
    thongKe,
    danhSachHop,
    danhSachGoc,
    danhSachTrang,
    danhSachBangTuan,
    danhSachBangThang,
    tags,
    tongSo,
    trang,
    setTrang,
    soTrang,
    batDau,
    ketThuc,
    isLoading: dangTaiLecturer || dangTaiGiangDay || dangTaiCaNhan || dangTaiTag,
  }
}

export { useTatCaLich }
