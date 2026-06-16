import InputRow, { GIA_TRI_TRONG } from "@components/cong-giang-vien/ho-so-ca-nhan/hang-thong-tin"
import type { ThongKeHoSo, ThongTinCaNhan } from "@components/cong-giang-vien/ho-so-ca-nhan/types"
import { Avatar, Card, Col, Row, Tag } from "antd"
import { UserRound } from "lucide-react"

interface ThongTinChungProps {
  thongTin: ThongTinCaNhan
  thongKe: ThongKeHoSo
}

interface ItemThongKe {
  key: string
  nhan: string
  giaTri: string
}

// Khối 1: Card đầu trang - ảnh đại diện, thông tin chung (2 cột) và ô thống kê.
const ThongTinChung = ({ thongTin, thongKe }: ThongTinChungProps) => {
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
    <Card size="small" className="mb-4">
      <Row gutter={[8, 16]} align="top">
        {/* Ảnh đại diện */}
        <Col flex="140px" className="flex justify-center sm:justify-start">
          <Avatar
            shape="square"
            size={140}
            src={thongTin.anhDaiDien}
            icon={<UserRound />}
            className="rounded-lg"
          />
        </Col>

        {/* Thông tin chung - 2 cột */}
        <Col flex="auto" className="min-w-0">
          <Row gutter={[16, 8]}>
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
                  value={
                    thongTin.tinhTrang ? (
                      <Tag color="green">{thongTin.tinhTrang}</Tag>
                    ) : (
                      GIA_TRI_TRONG
                    )
                  }
                />
              </div>
            </Col>
          </Row>
        </Col>

        {/* Ô thống kê */}
        <Col xs={24} xl={6}>
          <div className="h-full rounded-lg bg-cgv-green p-4">
            <p className="mb-3 font-semibold text-cgv-green-dark">THỐNG KÊ</p>
            <div className="flex flex-col gap-2">
              {danhSachThongKe.map((item) => (
                <div key={item.key} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-gray-600">{item.nhan}</span>
                  <span className="whitespace-nowrap text-right font-semibold text-cgv-green-dark">
                    {item.giaTri || GIA_TRI_TRONG}
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
