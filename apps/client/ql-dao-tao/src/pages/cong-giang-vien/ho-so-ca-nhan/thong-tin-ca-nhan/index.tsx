import QuaTrinhCongTacBlock from "@components/cong-giang-vien/ho-so-ca-nhan/qua-trinh-cong-tac"
import ThongTinChung from "@components/cong-giang-vien/ho-so-ca-nhan/thong-tin-chung"
import ThongTinLienHeDaoTao from "@components/cong-giang-vien/ho-so-ca-nhan/thong-tin-lien-he-dao-tao"
import { useHoSoCaNhan } from "@hooks/use-ho-so-ca-nhan"
import { Breadcrumb, Skeleton, Typography } from "antd"

const ThongTinCaNhanPage = () => {
  const { thongTin, thongKe, lienHe, daoTao, quaTrinhCongTac, isLoading } = useHoSoCaNhan()

  return (
    <div>
      <div className="flex items-center justify-between">
        <Typography.Title level={2} className="text-cgv-green-dark">
          HỒ SƠ CÁ NHÂN
        </Typography.Title>
        <Breadcrumb>
          <Breadcrumb.Item href="/" className="text-sm">
            Trang chủ
          </Breadcrumb.Item>
          <Breadcrumb.Item className="text-sm">Hồ sơ cá nhân</Breadcrumb.Item>
          <Breadcrumb.Item className="text-sm">Thông tin cá nhân</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <>
          <ThongTinChung thongTin={thongTin} thongKe={thongKe} />
          <ThongTinLienHeDaoTao lienHe={lienHe} daoTao={daoTao} />
          <QuaTrinhCongTacBlock danhSach={quaTrinhCongTac} />
        </>
      )}
    </div>
  )
}

export default ThongTinCaNhanPage
