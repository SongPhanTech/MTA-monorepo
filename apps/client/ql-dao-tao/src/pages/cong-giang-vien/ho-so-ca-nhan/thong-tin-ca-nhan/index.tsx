import QuaTrinhCongTacBlock from "@components/cong-giang-vien/ho-so-ca-nhan/qua-trinh-cong-tac"
import ThongTinChung from "@components/cong-giang-vien/ho-so-ca-nhan/thong-tin-chung"
import ThongTinLienHeDaoTao from "@components/cong-giang-vien/ho-so-ca-nhan/thong-tin-lien-he-dao-tao"
import { useHoSoCaNhan } from "@hooks/use-ho-so-ca-nhan"
import { Button } from "@workspace/ui"
import { Breadcrumb, message, Skeleton, Typography } from "antd"
import { Pencil } from "lucide-react"

const ThongTinCaNhanPage = () => {
  const { thongTin, thongKe, lienHe, daoTao, quaTrinhCongTac, isLoading } = useHoSoCaNhan()

  return (
    <div>
      <div className="flex items-center justify-between">
        <Typography.Title level={2} className="!mb-0 text-cgv-green-dark">
          HỒ SƠ CÁ NHÂN
        </Typography.Title>
        <div className="flex items-center gap-4">
          <Button
            type="primary"
            className="inline-flex h-9 items-center gap-1.5"
            icon={<Pencil size={16} />}
            onClick={() => message.info("Chức năng đang phát triển")}
          >
            Chỉnh sửa thông tin
          </Button>
          <Breadcrumb>
            <Breadcrumb.Item href="/" className="text-sm">
              Trang chủ
            </Breadcrumb.Item>
            <Breadcrumb.Item className="text-sm">Hồ sơ cá nhân</Breadcrumb.Item>
            <Breadcrumb.Item className="text-sm">Thông tin cá nhân</Breadcrumb.Item>
          </Breadcrumb>
        </div>
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
