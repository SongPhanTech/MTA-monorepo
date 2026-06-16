import type { QuaTrinhCongTac } from "@components/cong-giang-vien/ho-so-ca-nhan/types"
import { GIA_TRI_TRONG } from "@components/cong-giang-vien/ho-so-ca-nhan/hang-thong-tin"
import { Card, Table } from "antd"
import type { ColumnsType } from "antd/es/table"

interface QuaTrinhCongTacProps {
  danhSach: QuaTrinhCongTac[]
}

const hienThiOTrong = (value?: string) => (value?.trim() ? value : GIA_TRI_TRONG)

// Khối 3: Bảng quá trình công tác.
const QuaTrinhCongTacBlock = ({ danhSach }: QuaTrinhCongTacProps) => {
  const columns: ColumnsType<QuaTrinhCongTac> = [
    {
      title: "Thời gian",
      dataIndex: "thoiGian",
      width: 220,
      render: (value: string) => hienThiOTrong(value),
    },
    {
      title: "Đơn vị công tác",
      dataIndex: "donViCongTac",
      render: (value: string) => hienThiOTrong(value),
    },
    {
      title: "Vị trí công tác",
      dataIndex: "viTriCongTac",
      width: 220,
      render: (value: string) => hienThiOTrong(value),
    },
    {
      title: "Ghi chú",
      dataIndex: "ghiChu",
      width: 220,
      render: (value: string | undefined) => hienThiOTrong(value),
    },
  ]

  return (
    <Card size="small">
      <p className="mb-3 border-cgv-green-dark text-base font-bold uppercase tracking-wide text-cgv-green-dark">
        QUÁ TRÌNH CÔNG TÁC
      </p>
      <Table
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={danhSach}
        pagination={false}
        scroll={{ x: 800 }}
      />
    </Card>
  )
}

export default QuaTrinhCongTacBlock
