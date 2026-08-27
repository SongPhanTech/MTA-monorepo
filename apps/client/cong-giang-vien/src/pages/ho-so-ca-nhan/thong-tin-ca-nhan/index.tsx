import QuaTrinhCongTacBlock from "@components/cong-giang-vien/ho-so-ca-nhan/qua-trinh-cong-tac"
import ThongTinChung from "@components/cong-giang-vien/ho-so-ca-nhan/thong-tin-chung"
import ThongTinLienHeDaoTao from "@components/cong-giang-vien/ho-so-ca-nhan/thong-tin-lien-he-dao-tao"
import { useHoSoCaNhan } from "@hooks/use-ho-so-ca-nhan"
import { Breadcrumb, Button, Skeleton, Typography } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const ThongTinCaNhanPage = () => {
  const { profileId, thongTin, thongKe, lienHe, daoTao, quaTrinhCongTac, isLoading } =
    useHoSoCaNhan()

  const { onOpen: onOpenModalTomTatLyLich } = useDisclosure<{
    id: string
  }>({
    tag: "ModalTomTatLyLich",
  })

  const { onOpen: onOpenModalLyLichCanBo } = useDisclosure<{
    id: string
  }>({
    tag: "ModalLyLichCanBo",
  })

  const { onOpen: onOpenModalSoYeuLyLich } = useDisclosure<{
    id: string
  }>({
    tag: "ModalSoYeuLyLich",
  })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography.Title level={2} className="!mb-0 text-cgv-green-dark">
          HỒ SƠ CÁ NHÂN
        </Typography.Title>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <Button
            disabled={!profileId}
            onClick={() => profileId && onOpenModalTomTatLyLich({ id: profileId })}
          >
            Xuất dữ liệu theo mẫu trích yếu 63
          </Button>
          <Button
            disabled={!profileId}
            onClick={() => profileId && onOpenModalLyLichCanBo({ id: profileId })}
          >
            Xuất dữ liệu theo mẫu C2
          </Button>
          <Button
            disabled={!profileId}
            onClick={() => profileId && onOpenModalSoYeuLyLich({ id: profileId })}
          >
            Xuất dữ liệu theo mẫu sơ yếu lý lịch
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
          <ThongTinChung thongTin={thongTin} thongKe={thongKe} profileId={profileId} />
          <ThongTinLienHeDaoTao lienHe={lienHe} daoTao={daoTao} />
          <QuaTrinhCongTacBlock danhSach={quaTrinhCongTac} />
        </>
      )}
    </div>
  )
}

export default ThongTinCaNhanPage
