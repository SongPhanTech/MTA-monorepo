import { CONG_GIANG_VIEN_LICH_CUA_TOI_PATH } from "@constants/cong-giang-vien-path"
import { ROUTER_PATH } from "@workspace/router"
import { Breadcrumb } from "antd"
import Link from "next/link"

const TieuDeTrangLichCuaToi = () => {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 px-1">
      <h1 className="m-0 text-xl font-bold uppercase tracking-wide text-cgv-green-dark">
        Lịch của tôi
      </h1>
      <Breadcrumb
        className="text-sm"
        items={[
          {
            title: (
              <Link
                href={ROUTER_PATH.QL_DAO_TAO.CONG_GIANG_VIEN_GIANG_VIEN}
                className="text-gray-500"
              >
                Trang chủ
              </Link>
            ),
          },
          {
            title: (
              <Link href={CONG_GIANG_VIEN_LICH_CUA_TOI_PATH} className="text-gray-700">
                Lịch của tôi
              </Link>
            ),
          },
        ]}
      />
    </div>
  )
}

export default TieuDeTrangLichCuaToi
