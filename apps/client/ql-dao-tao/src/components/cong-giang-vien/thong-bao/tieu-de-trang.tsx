import { ROUTER_PATH } from "@workspace/router"
import { Breadcrumb } from "antd"
import Link from "next/link"

const TieuDeTrangThongBao = () => {
  return (
    <div className="flex items-center justify-between gap-4">
      <h1 className="m-0 text-xl font-bold uppercase tracking-wide text-cgv-green-dark">
        Thông báo
      </h1>
      <Breadcrumb
        className="text-sm"
        items={[
          {
            title: (
              <Link href={ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_GIANG_VIEN} className="text-gray-500">
                Trang chủ
              </Link>
            ),
          },
          {
            title: <span className="text-gray-700">Thông báo</span>,
          },
        ]}
      />
    </div>
  )
}

export default TieuDeTrangThongBao
