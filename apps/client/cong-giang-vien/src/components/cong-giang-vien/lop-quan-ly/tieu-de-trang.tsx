import { ROUTER_PATH } from "@workspace/router"
import { Breadcrumb } from "antd"
import Link from "next/link"

const TieuDeTrangLopQuanLy = () => {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 px-1">
      <h1 className="m-0 text-xl font-bold uppercase tracking-wide text-cgv-green-dark">
        Danh sách lớp quản lý
      </h1>
      <Breadcrumb
        className="text-sm"
        items={[
          {
            title: (
              <Link href={ROUTER_PATH.CONG_GIANG_VIEN.HOME} className="text-gray-500">
                Trang chủ
              </Link>
            ),
          },
          {
            title: (
              <Link href={ROUTER_PATH.CONG_GIANG_VIEN.LOP_QUAN_LY} className="text-gray-700">
                Lớp quản lý
              </Link>
            ),
          },
        ]}
      />
    </div>
  )
}

export default TieuDeTrangLopQuanLy
