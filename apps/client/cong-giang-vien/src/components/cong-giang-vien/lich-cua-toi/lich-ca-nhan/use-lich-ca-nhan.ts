import type { CheDoHienThiLich, DangXemLich } from "@components/cong-giang-vien/lich-cua-toi/types"
import type {
  DongLichCaNhan,
  ThongKeLichCaNhan,
} from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/types"
import {
  chuyenSangDongBangThang,
  formatNhanThang,
  formatNgayChonHienThi,
  khoangNgayQuery,
  khoangThangQuery,
  khoangTuanQuery,
  layKhoangThang,
  layKhoangTuan,
  locSuKienTrongThang,
  mapLichSangDong,
  nhomLichTheoNgay,
  tinhBienDong,
} from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import { queryClient } from "@api/index"
import { useLecturerHienTai } from "@hooks/use-lecturer-hien-tai"
import {
  useDeleteIndividualSchedule,
  useFindManyIndividualSchedule,
  useFindManyPersonalWorkTag,
} from "@workspace/db/hooks"
import dayjs, { type Dayjs } from "dayjs"
import "dayjs/locale/vi"
import isoWeek from "dayjs/plugin/isoWeek"
import { useCallback, useMemo, useState } from "react"

dayjs.extend(isoWeek)
dayjs.locale("vi")

const SO_TRANG_MAC_DINH = 10

type SoSanhThongKe = string

const tinhThongKe = (
  hienTai: DongLichCaNhan[],
  truoc: DongLichCaNhan[],
  soSanh: SoSanhThongKe
): ThongKeLichCaNhan => ({
  tongSuKien: hienTai.length,
  tongBienDong: tinhBienDong(hienTai.length, truoc.length, soSanh),
  congViec: hienTai.filter((d) => d.nhomLoai === "cong-viec").length,
  congViecBienDong: tinhBienDong(
    hienTai.filter((d) => d.nhomLoai === "cong-viec").length,
    truoc.filter((d) => d.nhomLoai === "cong-viec").length,
    soSanh
  ),
  cuocHop: hienTai.filter((d) => d.nhomLoai === "cuoc-hop").length,
  cuocHopBienDong: tinhBienDong(
    hienTai.filter((d) => d.nhomLoai === "cuoc-hop").length,
    truoc.filter((d) => d.nhomLoai === "cuoc-hop").length,
    soSanh
  ),
  caNhan: hienTai.filter((d) => d.nhomLoai === "ca-nhan").length,
  caNhanBienDong: tinhBienDong(
    hienTai.filter((d) => d.nhomLoai === "ca-nhan").length,
    truoc.filter((d) => d.nhomLoai === "ca-nhan").length,
    soSanh
  ),
})

const useLichCaNhan = () => {
  const { lecturerId, isLoading: dangTaiLecturer } = useLecturerHienTai()
  const [cheDoHienThi, setCheDoHienThiState] = useState<CheDoHienThiLich>("ngay")
  const [dangXem, setDangXem] = useState<DangXemLich>("lich")
  const [ngayChon, setNgayChon] = useState<Dayjs>(() => dayjs())
  const [tuKhoa, setTuKhoa] = useState("")
  const [trang, setTrang] = useState(1)
  const [soTrang] = useState(SO_TRANG_MAC_DINH)

  const { dauTuan, cuoiTuan } = useMemo(() => layKhoangTuan(ngayChon), [ngayChon])
  const { dauThang, cuoiThang, dauLich, cuoiLich } = useMemo(
    () => layKhoangThang(ngayChon),
    [ngayChon]
  )
  const ngayHomQua = useMemo(() => ngayChon.subtract(1, "day"), [ngayChon])
  const { dauTuan: dauTuanTruoc, cuoiTuan: cuoiTuanTruoc } = useMemo(
    () => layKhoangTuan(ngayChon.subtract(1, "week")),
    [ngayChon]
  )
  const { dauThang: dauThangTruoc, cuoiThang: cuoiThangTruoc } = useMemo(
    () => layKhoangThang(ngayChon.subtract(1, "month")),
    [ngayChon]
  )

  const khoangHienTai = useMemo(() => {
    if (cheDoHienThi === "thang") return khoangThangQuery(dauLich, cuoiLich)
    if (cheDoHienThi === "tuan") return khoangTuanQuery(dauTuan, cuoiTuan)
    return khoangNgayQuery(ngayChon)
  }, [cheDoHienThi, dauLich, cuoiLich, dauTuan, cuoiTuan, ngayChon])

  const khoangTruoc = useMemo(() => {
    if (cheDoHienThi === "thang") return khoangThangQuery(dauThangTruoc, cuoiThangTruoc)
    if (cheDoHienThi === "tuan") return khoangTuanQuery(dauTuanTruoc, cuoiTuanTruoc)
    return khoangNgayQuery(ngayHomQua)
  }, [cheDoHienThi, dauThangTruoc, cuoiThangTruoc, dauTuanTruoc, cuoiTuanTruoc, ngayHomQua])

  const { data: lichHienTaiRaw = [], isLoading: dangTaiLich } = useFindManyIndividualSchedule(
    {
      where: {
        lecturerId: lecturerId ?? "",
        ...khoangHienTai,
      },
      include: { tags: { select: { id: true, name: true, color: true } } },
      orderBy: [{ startTime: "asc" }],
    },
    { enabled: !!lecturerId }
  )

  const { data: lichTruocRaw = [] } = useFindManyIndividualSchedule(
    {
      where: {
        lecturerId: lecturerId ?? "",
        ...khoangTruoc,
      },
      include: { tags: { select: { id: true, name: true, color: true } } },
    },
    { enabled: !!lecturerId }
  )

  const { data: tags = [], isLoading: dangTaiTag } = useFindManyPersonalWorkTag(
    {
      where: { lecturerId: lecturerId ?? "" },
      select: { id: true, name: true, color: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    },
    { enabled: !!lecturerId }
  )

  const { mutateAsync: xoaLich } = useDeleteIndividualSchedule()

  const danhSachLich = useMemo(() => lichHienTaiRaw.map(mapLichSangDong), [lichHienTaiRaw])
  const danhSachTruoc = useMemo(() => lichTruocRaw.map(mapLichSangDong), [lichTruocRaw])

  const danhSachGoc = useMemo(() => {
    if (cheDoHienThi === "thang") {
      return locSuKienTrongThang(danhSachLich, ngayChon)
    }
    return danhSachLich
  }, [cheDoHienThi, danhSachLich, ngayChon])

  const danhSachLoc = useMemo(() => {
    const q = tuKhoa.trim().toLowerCase()
    if (!q) return danhSachGoc
    return danhSachGoc.filter(
      (item) =>
        item.tieuDe.toLowerCase().includes(q) ||
        item.diaDiem.toLowerCase().includes(q) ||
        item.noiDung.toLowerCase().includes(q) ||
        item.tenLoai.toLowerCase().includes(q) ||
        item.ghiChu.toLowerCase().includes(q)
    )
  }, [danhSachGoc, tuKhoa])

  const soSanh: SoSanhThongKe =
    cheDoHienThi === "thang"
      ? ngayChon.subtract(1, "month").format("MM/YYYY")
      : cheDoHienThi === "tuan"
        ? "tuần trước"
        : "hôm qua"

  const thongKe = useMemo(
    () => tinhThongKe(danhSachGoc, danhSachTruoc, soSanh),
    [danhSachGoc, danhSachTruoc, soSanh]
  )

  const tongSo = danhSachLoc.length
  const batDau = tongSo === 0 ? 0 : (trang - 1) * soTrang + 1
  const ketThuc = Math.min(trang * soTrang, tongSo)

  const danhSachTrang = useMemo(
    () => danhSachLoc.slice((trang - 1) * soTrang, trang * soTrang),
    [danhSachLoc, trang, soTrang]
  )

  const danhSachNhomTrang = useMemo(() => nhomLichTheoNgay(danhSachTrang), [danhSachTrang])

  const danhSachBangThang = useMemo(() => chuyenSangDongBangThang(danhSachTrang), [danhSachTrang])

  const nhanKhoangThoiGian = useMemo(() => {
    if (cheDoHienThi === "thang") return formatNhanThang(ngayChon)
    if (cheDoHienThi === "tuan") {
      return `${dauTuan.format("DD/MM/YYYY")} - ${cuoiTuan.format("DD/MM/YYYY")}`
    }
    return formatNgayChonHienThi(ngayChon)
  }, [cheDoHienThi, dauTuan, cuoiTuan, ngayChon])

  const setCheDoHienThi = useCallback((value: CheDoHienThiLich) => {
    setCheDoHienThiState(value)
    setTrang(1)
    if (value === "tuan") {
      setNgayChon((d) => d.startOf("isoWeek"))
    }
    if (value === "thang") {
      setNgayChon((d) => d.startOf("month"))
    }
  }, [])

  const luiNgay = () =>
    setNgayChon((d) => {
      if (cheDoHienThi === "thang") return d.subtract(1, "month").startOf("month")
      if (cheDoHienThi === "tuan") return d.subtract(1, "week").startOf("isoWeek")
      return d.subtract(1, "day")
    })

  const tienNgay = () =>
    setNgayChon((d) => {
      if (cheDoHienThi === "thang") return d.add(1, "month").startOf("month")
      if (cheDoHienThi === "tuan") return d.add(1, "week").startOf("isoWeek")
      return d.add(1, "day")
    })

  const onDoiTuKhoa = (value: string) => {
    setTuKhoa(value)
    setTrang(1)
  }

  const onXoa = useCallback(
    async (id: string) => {
      await xoaLich({ where: { id } })
      await queryClient.invalidateQueries({ queryKey: ["IndividualSchedule"] })
    },
    [xoaLich]
  )

  return {
    cheDoHienThi,
    setCheDoHienThi,
    dangXem,
    setDangXem,
    ngayChon,
    setNgayChon,
    dauTuan,
    cuoiTuan,
    nhanKhoangThoiGian,
    luiNgay,
    tienNgay,
    tuKhoa,
    onDoiTuKhoa,
    thongKe,
    tags,
    danhSachGoc,
    danhSachLich,
    danhSachTrang,
    danhSachNhomTrang,
    danhSachBangThang,
    tongSo,
    trang,
    setTrang,
    soTrang,
    batDau,
    ketThuc,
    isLoading: dangTaiLecturer || dangTaiLich || dangTaiTag,
    onXoa,
  }
}

export { useLichCaNhan }
