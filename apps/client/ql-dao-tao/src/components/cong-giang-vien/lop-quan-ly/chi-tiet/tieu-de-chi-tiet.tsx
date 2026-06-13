import { CONG_GIANG_VIEN_LOP_QUAN_LY_PATH } from "@constants/cong-giang-vien-path"
import { Button } from "antd"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/router"

const TieuDeChiTietLopQuanLy = () => {
  const router = useRouter()

  return (
    <div className="flex shrink-0 items-center gap-3">
      <Button
        type="text"
        icon={<ArrowLeft size={18} />}
        onClick={() => router.push(CONG_GIANG_VIEN_LOP_QUAN_LY_PATH)}
        className="flex h-9 w-9 items-center justify-center text-cgv-green-dark"
      />
      <h1 className="m-0 text-xl font-bold uppercase tracking-wide text-cgv-green-dark">
        Chi tiết lớp quản lý
      </h1>
    </div>
  )
}

export default TieuDeChiTietLopQuanLy
