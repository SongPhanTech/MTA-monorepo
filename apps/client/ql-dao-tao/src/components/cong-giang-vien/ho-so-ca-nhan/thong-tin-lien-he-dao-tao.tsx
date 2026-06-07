import InputRow from "@components/cong-giang-vien/ho-so-ca-nhan/hang-thong-tin"
import type { ThongTinLienHe, TrinhDoDaoTao } from "@components/cong-giang-vien/ho-so-ca-nhan/types"
import { Card, Col, Row } from "antd"

interface ThongTinLienHeDaoTaoProps {
  lienHe: ThongTinLienHe
  daoTao: TrinhDoDaoTao
}

// Khối 2: 2 cột - Thông tin liên hệ và Trình độ đào tạo cao nhất.
const ThongTinLienHeDaoTao = ({ lienHe, daoTao }: ThongTinLienHeDaoTaoProps) => {
  return (
    <Row gutter={[16, 16]} className="mb-4">
      <Col xs={24} lg={12}>
        <Card size="small" className="h-full">
          <p className="mb-3 border-cgv-green-dark text-base font-bold uppercase tracking-wide text-cgv-green-dark">
            THÔNG TIN LIÊN HỆ
          </p>
          <div className="flex flex-col gap-2">
            <InputRow label="Địa chỉ liên hệ" value={lienHe.diaChiLienHe} />
            <InputRow label="Địa chỉ thường trú" value={lienHe.diaChiThuongTru} />
            <InputRow label="Email cá nhân" value={lienHe.emailCaNhan} />
            <InputRow label="Điện thoại di động" value={lienHe.dienThoaiDiDong} />
            <InputRow label="Điện thoại cơ quan" value={lienHe.dienThoaiCoQuan} />
          </div>
        </Card>
      </Col>

      <Col xs={24} lg={12}>
        <Card size="small" className="h-full">
          <p className="mb-3 border-cgv-green-dark text-base font-bold uppercase tracking-wide text-cgv-green-dark">
            TRÌNH ĐỘ ĐÀO TẠO CAO NHẤT
          </p>
          <div className="flex flex-col gap-2">
            <InputRow label="Trình độ" value={daoTao.trinhDo} />
            <InputRow label="Năm cấp bằng" value={daoTao.namCapBang} />
            <InputRow label="Chuyên ngành" value={daoTao.chuyenNganh} />
            <InputRow label="Nơi đào tạo" value={daoTao.noiDaoTao} />
            <InputRow label="Tên luận án/đề tài" value={daoTao.tenLuanAn} />
          </div>
        </Card>
      </Col>
    </Row>
  )
}

export default ThongTinLienHeDaoTao
