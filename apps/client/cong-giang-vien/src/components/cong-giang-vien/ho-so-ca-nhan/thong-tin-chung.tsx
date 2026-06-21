import DoiAnhDaiDien from "@components/cong-giang-vien/ho-so-ca-nhan/doi-anh-dai-dien"
import InputRow from "@components/cong-giang-vien/ho-so-ca-nhan/hang-thong-tin"
import PutThongTinCaNhanModal from "@components/cong-giang-vien/ho-so-ca-nhan/put-thong-tin-ca-nhan"
import type { ThongKeHoSo, ThongTinCaNhan } from "@components/cong-giang-vien/ho-so-ca-nhan/types"
import { Button, Card, Col, Row, Tag } from "antd"
import { SquarePen } from "lucide-react"
import { useDisclosure } from "react-hook-disclosure-modal"

interface ThongTinChungProps {
  thongTin: ThongTinCaNhan
  thongKe: ThongKeHoSo
  profileId?: string
}

interface ItemThongKe {
  key: string
  nhan: string
  giaTri: string
}

// Khối 1: Card đầu trang - ảnh đại diện, thông tin chung (2 cột) và ô thống kê.
const ThongTinChung = ({ thongTin, thongKe, profileId }: ThongTinChungProps) => {
  const { onOpen: moChinhSua } = useDisclosure<{ id: string }>({
    tag: "PutThongTinCaNhanModal",
  })

  const danhSachThongKe: ItemThongKe[] = [
    { key: "nam-cong-tac", nhan: "Số năm công tác", giaTri: thongKe.soNamCongTac },
    {
      key: "mon-hoc",
      nhan: "Số môn học phụ trách",
      giaTri: `${thongKe.soMonHocPhuTrach} môn học`,
    },
    { key: "lop", nhan: "Số lớp giảng dạy", giaTri: `${thongKe.soLopGiangDay} lớp` },
    {
      key: "sinh-vien",
      nhan: "Số sinh viên hướng dẫn",
      giaTri: `${thongKe.soSinhVienHuongDan} sinh viên`,
    },
  ]

  return (
    <Card size="small" className="relative mb-4">
      {/* Nút chỉnh sửa thông tin */}
      <Button
        type="default"
        icon={<SquarePen size={16} />}
        className="absolute right-3 top-3 z-10"
        disabled={!profileId}
        onClick={() => profileId && moChinhSua({ id: profileId })}
      >
        Chỉnh sửa
      </Button>

      <Row gutter={[12, 16]}>
        {/* Ảnh đại diện */}
        <Col xs={24} sm={5} md={4} xl={3} className="flex justify-center sm:justify-start">
          <DoiAnhDaiDien profileId={profileId} anhDaiDien={thongTin.anhDaiDien} />
        </Col>

        {/* Thông tin chung - 2 cột */}
        <Col xs={24} sm={19} md={20} xl={15}>
          <Row gutter={[12, 8]}>
            <Col xs={24} md={12}>
              <div className="flex flex-col gap-2">
                <InputRow label="Họ và tên" value={thongTin.hoVaTen} />
                <InputRow label="Giới tính" value={thongTin.gioiTinh} />
                <InputRow label="Ngày sinh" value={thongTin.ngaySinh} />
                <InputRow label="Email" value={thongTin.email} />
                <InputRow label="Số điện thoại" value={thongTin.soDienThoai} />
                <InputRow label="CMND/CCCD" value={thongTin.cmndCccd} />
                <InputRow label="Mã giảng viên" value={thongTin.maGiangVien} />
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="flex flex-col gap-2">
                <InputRow label="Đơn vị công tác" value={thongTin.donViCongTac} />
                <InputRow label="Chức vụ" value={thongTin.chucVu} />
                <InputRow label="Chức danh" value={thongTin.chucDanh} />
                <InputRow label="Học hàm" value={thongTin.hocHam} />
                <InputRow label="Ngày vào trường" value={thongTin.ngayVaoTruong} />
                <InputRow
                  label="Tình trạng"
                  value={thongTin.tinhTrang ? <Tag color="green">{thongTin.tinhTrang}</Tag> : "_"}
                />
              </div>
            </Col>
          </Row>
        </Col>

        {/* Ô thống kê - đẩy xuống dưới nút "Chỉnh sửa" */}
        <Col xs={24} xl={6}>
          <div className="rounded-lg bg-cgv-green p-4 xl:mt-12">
            <p className="mb-3 font-semibold text-cgv-green-dark">THỐNG KÊ</p>
            <div className="flex flex-col gap-2">
              {danhSachThongKe.map((item) => (
                <div key={item.key} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-gray-600">{item.nhan}</span>
                  <span className="whitespace-nowrap text-right font-semibold text-cgv-green-dark">
                    {item.giaTri}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  )
}

export default ThongTinChung
