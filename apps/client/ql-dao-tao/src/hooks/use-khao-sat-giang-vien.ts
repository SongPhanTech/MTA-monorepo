import { useSession } from "@workspace/auth/react"
import { useGetSurveysOfProfile } from "@workspace/libs/api/exam"
import dayjs from "dayjs"
import { useMemo } from "react"

export type TrangThaiKhaoSat = "dang_dien_ra" | "sap_dien_ra" | "da_ket_thuc"

export const getTrangThaiKhaoSat = (
  startDate?: string | null,
  endDate?: string | null
): TrangThaiKhaoSat => {
  const now = dayjs()

  if (startDate && now.isBefore(dayjs(startDate))) return "sap_dien_ra"
  if (endDate && now.isAfter(dayjs(endDate))) return "da_ket_thuc"
  return "dang_dien_ra"
}

const useKhaoSatGiangVien = (semesterId?: string) => {
  const { data: session } = useSession()
  const profileId = session?.sDM_NhanVienId || "fa330b1b-4326-4018-b3d9-3cd79344f660"

  const { data, isLoading } = useGetSurveysOfProfile(
    profileId as string,
    { limit: 100, semesterId },
    { query: { enabled: !!profileId } }
  )

  const danhSach = useMemo(() => (data?.status === 200 ? data.data.data : []), [data])

  const tongSo = danhSach.length

  const thongKe = useMemo(() => {
    const ketQua = { dangDienRa: 0, sapDienRa: 0, daKetThuc: 0 }
    for (const ks of danhSach) {
      const trangThai = getTrangThaiKhaoSat(ks.startDate, ks.endDate)
      if (trangThai === "dang_dien_ra") ketQua.dangDienRa += 1
      else if (trangThai === "sap_dien_ra") ketQua.sapDienRa += 1
      else ketQua.daKetThuc += 1
    }
    return ketQua
  }, [danhSach])

  return { danhSach, tongSo, thongKe, isLoading: !!profileId && isLoading }
}

export { useKhaoSatGiangVien }
