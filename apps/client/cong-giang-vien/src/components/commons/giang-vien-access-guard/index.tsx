import Loading from "@components/commons/loading"
import KhongCoQuyenTruyCap from "@components/commons/giang-vien-access-guard/khong-co-quyen-truy-cap"
import { useGiangVien } from "@hooks/use-giang-vien"
import type { ReactNode } from "react"

const GiangVienAccessGuard = ({ children }: { children: ReactNode }) => {
  const { isGiangVien, isLoading } = useGiangVien()

  if (isLoading) return <Loading />
  if (!isGiangVien) return <KhongCoQuyenTruyCap />

  return <>{children}</>
}

export default GiangVienAccessGuard
