import { useSession } from "@workspace/auth/react"
import { useFindManySchoolYear } from "@workspace/db/hooks"
import { useGetSurveysOfProfile } from "@workspace/libs/api/exam"
import type { GetSurveysOfProfile200AllOfAllOfDataItem } from "@workspace/libs/api/schemas"
import dayjs from "dayjs"
import { useMemo } from "react"

export type TrangThaiKhaoSat = "dang_dien_ra" | "sap_dien_ra" | "da_ket_thuc"

// API trả về semesterId (scalar) nhưng type orval hiện chưa khai báo → bổ sung ở đây
export type KhaoSatItem = GetSurveysOfProfile200AllOfAllOfDataItem & {
  semesterId?: string | null
  // Tên học kỳ + năm học được map từ semesterId (xem useKhaoSatGiangVien)
  tenHocKy?: string
  tenNamHoc?: string
}

// Bỏ dấu + lowercase để tìm kiếm không phân biệt dấu
const boDau = (chuoi: string) =>
  chuoi
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()

interface UseKhaoSatGiangVienParams {
  semesterId?: string
  tuKhoa?: string
  trangThai?: TrangThaiKhaoSat | "tat_ca"
}

export const getTrangThaiKhaoSat = (
  startDate?: string | null,
  endDate?: string | null
): TrangThaiKhaoSat => {
  const now = dayjs()

  if (startDate && now.isBefore(dayjs(startDate))) return "sap_dien_ra"
  if (endDate && now.isAfter(dayjs(endDate))) return "da_ket_thuc"
  return "dang_dien_ra"
}

const useKhaoSatGiangVien = ({
  semesterId,
  tuKhoa,
  trangThai = "tat_ca",
}: UseKhaoSatGiangVienParams = {}) => {
  const { data: session } = useSession()
  const profileId = session?.sDM_NhanVienId || "fa330b1b-4326-4018-b3d9-3cd79344f660"

  const { data, isLoading, isFetching, refetch } = useGetSurveysOfProfile(
    profileId as string,
    { limit: 100, semesterId },
    { query: { enabled: !!profileId } }
  )

  // Tải danh sách năm học + học kỳ để map semesterId -> tên hiển thị
  const { data: schoolYears } = useFindManySchoolYear({
    orderBy: { startDate: "desc" },
    include: { semesters: true },
    take: 1000,
  })

  const mapNamHoc = useMemo(() => {
    const m = new Map<string, { tenHocKy: string; tenNamHoc: string }>()
    for (const namHoc of schoolYears ?? []) {
      for (const hocKy of namHoc.semesters ?? []) {
        m.set(hocKy.id, { tenHocKy: hocKy.name, tenNamHoc: namHoc.name })
      }
    }
    return m
  }, [schoolYears])

  const danhSach = useMemo<KhaoSatItem[]>(() => {
    const raw = data?.status === 200 ? (data.data.data as KhaoSatItem[]) : []
    return raw.map((ks) => {
      const tenHocKyNamHoc = ks.semesterId ? mapNamHoc.get(ks.semesterId) : undefined
      return {
        ...ks,
        tenHocKy: tenHocKyNamHoc?.tenHocKy,
        tenNamHoc: tenHocKyNamHoc?.tenNamHoc,
      }
    })
  }, [data, mapNamHoc])

  const tongSo = danhSach.length

  // Thống kê tổng quan tính trên toàn bộ danh sách (không đổi theo bộ lọc)
  const thongKe = useMemo(() => {
    const ketQua = { dangDienRa: 0, sapDienRa: 0, daKetThuc: 0 }
    for (const ks of danhSach) {
      const tt = getTrangThaiKhaoSat(ks.startDate, ks.endDate)
      if (tt === "dang_dien_ra") ketQua.dangDienRa += 1
      else if (tt === "sap_dien_ra") ketQua.sapDienRa += 1
      else ketQua.daKetThuc += 1
    }
    return ketQua
  }, [danhSach])

  // Lọc theo từ khoá tiêu đề + trạng thái
  const danhSachLoc = useMemo(() => {
    const tuKhoaChuanHoa = tuKhoa ? boDau(tuKhoa.trim()) : ""
    return danhSach.filter((ks) => {
      const khopTuKhoa = tuKhoaChuanHoa ? boDau(ks.name).includes(tuKhoaChuanHoa) : true
      const khopTrangThai =
        trangThai === "tat_ca"
          ? true
          : getTrangThaiKhaoSat(ks.startDate, ks.endDate) === trangThai
      return khopTuKhoa && khopTrangThai
    })
  }, [danhSach, tuKhoa, trangThai])

  // Gom danh sách đã lọc theo trạng thái để render từng nhóm
  const nhomTheoTrangThai = useMemo(() => {
    const nhom = {
      dangDienRa: [] as KhaoSatItem[],
      sapDienRa: [] as KhaoSatItem[],
      daKetThuc: [] as KhaoSatItem[],
    }
    for (const ks of danhSachLoc) {
      const tt = getTrangThaiKhaoSat(ks.startDate, ks.endDate)
      if (tt === "dang_dien_ra") nhom.dangDienRa.push(ks)
      else if (tt === "sap_dien_ra") nhom.sapDienRa.push(ks)
      else nhom.daKetThuc.push(ks)
    }
    return nhom
  }, [danhSachLoc])

  return { danhSach, danhSachLoc, nhomTheoTrangThai, tongSo, thongKe, isLoading, isFetching, refetch }
}

export { useKhaoSatGiangVien }
