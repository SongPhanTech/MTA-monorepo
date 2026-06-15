import { CONG_GIANG_VIEN_LOP_TRO_GIANG_PATH } from "@constants/cong-giang-vien-path"
import { Breadcrumb, Button } from "antd"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/router"

const TieuDeDiemDanh = () => {
  const router = useRouter()

  return (
    <div className="flex shrink-0 flex-col gap-1">
      <Breadcrumb>
        <Breadcrumb.Item href="/" className="text-sm">
          Trang chủ
        </Breadcrumb.Item>
        <Breadcrumb.Item href={CONG_GIANG_VIEN_LOP_TRO_GIANG_PATH} className="text-sm">
          Lớp trợ giảng
        </Breadcrumb.Item>
        <Breadcrumb.Item className="text-sm">Điểm danh</Breadcrumb.Item>
      </Breadcrumb>

      <div className="flex items-center gap-2">
        <Button
          type="text"
          icon={<ArrowLeft size={18} />}
          onClick={() => router.push(CONG_GIANG_VIEN_LOP_TRO_GIANG_PATH)}
          className="flex h-9 w-9 items-center justify-center text-cgv-green-dark"
        />
        <h1 className="m-0 text-xl font-bold uppercase tracking-wide text-cgv-green-dark">
          Điểm danh
        </h1>
      </div>
    </div>
  )
}

export default TieuDeDiemDanh
