import type { CheDoHienThiLich, DangXemLich } from "@components/cong-giang-vien/lich-cua-toi/types"
import type { DongLichCaNhan, ThongKeLichCaNhan } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/types"
import {
  khoangNgayQuery,
  mapLichSangDong,
  tinhBienDong,
} from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import { queryClient } from "@api/index"
import { useLecturerHienTai } from "@hooks/use-lecturer-hien-tai"
import {
  useDeleteIndividualSchedule,
  useFindManyIndividualSchedule,
} from "@workspace/db/hooks"
import dayjs, { type Dayjs } from "dayjs"
import "dayjs/locale/vi"
import { useCallback, useMemo, useState } from "react"

dayjs.locale("vi")

const SO_TRANG_MAC_DINH = 10

const tinhThongKe = (
  homNay: DongLichCaNhan[],
  homQua: DongLichCaNhan[]
): ThongKeLichCaNhan => ({
  tongSuKien: homNay.length,
  tongBienDong: tinhBienDong(homNay.length, homQua.length),
  congViec: homNay.filter((d) => d.nhomLoai === "cong-viec").length,
  congViecBienDong: tinhBienDong(
    homNay.filter((d) => d.nhomLoai === "cong-viec").length,
    homQua.filter((d) => d.nhomLoai === "cong-viec").length
  ),
  cuocHop: homNay.filter((d) => d.nhomLoai === "cuoc-hop").length,
  cuocHopBienDong: tinhBienDong(
    homNay.filter((d) => d.nhomLoai === "cuoc-hop").length,
    homQua.filter((d) => d.nhomLoai === "cuoc-hop").length
  ),
  caNhan: homNay.filter((d) => d.nhomLoai === "ca-nhan").length,
  caNhanBienDong: tinhBienDong(
    homNay.filter((d) => d.nhomLoai === "ca-nhan").length,
    homQua.filter((d) => d.nhomLoai === "ca-nhan").length
  ),
})

const useLichCaNhan = () => {
  const { lecturerId, isLoading: dangTaiLecturer } = useLecturerHienTai()
  const [cheDoHienThi, setCheDoHienThi] = useState<CheDoHienThiLich>("ngay")
  const [dangXem, setDangXem] = useState<DangXemLich>("bang")
  const [ngayChon, setNgayChon] = useState<Dayjs>(() => dayjs())
  const [tuKhoa, setTuKhoa] = useState("")
  const [trang, setTrang] = useState(1)
  const [soTrang] = useState(SO_TRANG_MAC_DINH)

  const ngayHomQua = useMemo(() => ngayChon.subtract(1, "day"), [ngayChon])

  const { data: lichHomNayRaw = [], isLoading: dangTaiLich } = useFindManyIndividualSchedule(
    {
      where: {
        lecturerId: lecturerId ?? "",
        ...khoangNgayQuery(ngayChon),
      },
      include: { tags: { select: { id: true, name: true, color: true } } },
      orderBy: [{ startTime: "asc" }],
    },
    { enabled: !!lecturerId }
  )

  const { data: lichHomQuaRaw = [] } = useFindManyIndividualSchedule(
    {
      where: {
        lecturerId: lecturerId ?? "",
        ...khoangNgayQuery(ngayHomQua),
      },
      include: { tags: { select: { id: true, name: true, color: true } } },
    },
    { enabled: !!lecturerId }
  )

  const { mutateAsync: xoaLich } = useDeleteIndividualSchedule()

  const danhSachGoc = useMemo(() => lichHomNayRaw.map(mapLichSangDong), [lichHomNayRaw])
  const danhSachHomQua = useMemo(() => lichHomQuaRaw.map(mapLichSangDong), [lichHomQuaRaw])

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

  const thongKe = useMemo(() => tinhThongKe(danhSachGoc, danhSachHomQua), [danhSachGoc, danhSachHomQua])

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
    luiNgay,
    tienNgay,
    tuKhoa,
    onDoiTuKhoa,
    thongKe,
    danhSachTrang,
    tongSo,
    trang,
    setTrang,
    soTrang,
    batDau,
    ketThuc,
    isLoading: dangTaiLecturer || dangTaiLich,
    onXoa,
  }
}

export { useLichCaNhan }
