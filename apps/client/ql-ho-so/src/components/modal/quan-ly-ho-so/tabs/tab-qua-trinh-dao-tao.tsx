import { PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { Button, Collapse, Flex, Row } from "antd"
import { useState } from "react"

const { Panel } = Collapse

const dataQuaTrinhDaoTao = [
  {
    id: "1",
    khoaDaoTaoBoiDuong: "Bồi dưỡng nghiệp vụ quản lý nhà nước",
    donViToChuc: "Học viện Hành chính Quốc gia",
    loai: "Bồi dưỡng",
    tuNgay: "01/03/2022",
    denNgay: "31/03/2022",
  },
  {
    id: "2",
    khoaDaoTaoBoiDuong: "Khoá đào tạo chuyên sâu CNTT",
    donViToChuc: "Đại học Bách Khoa Hà Nội",
    loai: "Đào tạo",
    tuNgay: "15/06/2021",
    denNgay: "15/12/2021",
  },
  {
    id: "3",
    khoaDaoTaoBoiDuong: "Tập huấn kỹ năng lãnh đạo",
    donViToChuc: "Viện Đào tạo Quản lý",
    loai: "Tập huấn",
    tuNgay: "10/09/2020",
    denNgay: "20/09/2020",
  },
]

export default function QuaTrinhDaoTaoTab() {
  const [openCollapse, setOpenCollapse] = useState<string | null>(null)
  const [currentPage, _setCurrentPage] = useState(1)
  const [_numberOfPages, _setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

  const handleCollapseChange = (collapseId: string) => (key: string | string[]) => {
    if (key && key.length > 0) {
      // Nếu collapse này được mở, đóng các collapse khác
      setOpenCollapse(collapseId)
    } else {
      // Nếu collapse này bị đóng
      setOpenCollapse(null)
    }
  }

  const handleModal = () => {}

  return (
    <div className="space-y-6">
      <Collapse
        ghost
        className="bg-gray-50 shadow-sm"
        accordion={true}
        activeKey={openCollapse === "boi-duong" ? ["1"] : []}
        onChange={handleCollapseChange("boi-duong")}
      >
        {/* Học vị */}
        <Panel
          header={
            <span className="text-base font-semibold">Quá trình được cử đi đào tạo bồi dưỡng</span>
          }
          key="1"
          className="border-none"
        >
          <Flex justify="end">
            <Button
              onClick={handleModal}
              icon={<PlusOutlined />}
              className="border-green-700 text-green-700 hover:bg-green-50"
            >
              Thêm mới
            </Button>
          </Flex>
          <Table
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center" as const,
                fixed: "left" as const,
                render: (_, __, index) => index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
              },
              {
                title: "Khoá đào tạo, bồi dưỡng tập huấn",
                dataIndex: "khoaDaoTaoBoiDuong",
                align: "center",
                width: 300,
              },
              {
                title: "Đơn vị tổ chức",
                dataIndex: "donViToChuc",
                align: "center",
                width: 250,
              },
              {
                title: "Loại",
                dataIndex: "loai",
                align: "center",
                width: 120,
              },
              {
                title: "Từ ngày",
                dataIndex: "tuNgay",
                align: "center",
                width: 120,
              },
              {
                title: "Đến ngày",
                dataIndex: "denNgay",
                align: "center",
                width: 120,
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                render: (_, { id }) => (
                  <Row className="justify-center gap-2">
                    <EditIcon className="text-sm text-blue-700 cursor-pointer" />
                    <DeleteIcon />
                  </Row>
                ),
              },
            ]}
            dataSource={dataQuaTrinhDaoTao}
          />
        </Panel>
      </Collapse>
    </div>
  )
}
