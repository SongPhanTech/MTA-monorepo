import type { QuaTrinhCongTac } from "@components/cong-giang-vien/ho-so-ca-nhan/types"
import { Card, Table } from "antd"
import type { ColumnsType } from "antd/es/table"

interface QuaTrinhCongTacProps {
  danhSach: QuaTrinhCongTac[]
}

// Khối 3: Bảng quá trình công tác.
const QuaTrinhCongTacBlock = ({ danhSach }: QuaTrinhCongTacProps) => {
  const columns: ColumnsType<QuaTrinhCongTac> = [
    {
      title: "Thời gian",
      dataIndex: "thoiGian",
      width: 220,
    },
    {
      title: "Đơn vị công tác",
      dataIndex: "donViCongTac",
    },
    {
      title: "Vị trí công tác",
      dataIndex: "viTriCongTac",
      width: 220,
    },
    {
      title: "Ghi chú",
      dataIndex: "ghiChu",
      width: 220,
      render: (value: string | undefined) => value || "",
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
