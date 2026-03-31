import { PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { Button, Collapse, Flex, Row } from "antd"
import { useState } from "react"

const { Panel } = Collapse

const dataKeKhaiTaiSan = [
  {
    id: "1",
    tenDot: "Kê khai tài sản năm 2024",
    loai: "Tài sản",
    thoiGianKeKhai: "01/01/2024 - 31/01/2024",
  },
  {
    id: "2",
    tenDot: "Kê khai tài sản định kỳ 2023",
    loai: "Tài sản",
    thoiGianKeKhai: "01/12/2023 - 31/12/2023",
  },
  {
    id: "3",
    tenDot: "Kê khai thu nhập năm 2023",
    loai: "Thu nhập",
    thoiGianKeKhai: "01/02/2024 - 28/02/2024",
  },
]

export default function KeKhaiTaiSanTab() {
  const [openCollapse, setOpenCollapse] = useState<string | null>(null)
  const [currentPage, _setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

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
        className="bg-gray-50  shadow-sm"
        accordion={true}
        activeKey={openCollapse === "tai-san" ? ["1"] : []}
        onChange={handleCollapseChange("tai-san")}
      >
        {/* Học vị */}
        <Panel
          header={<span className="text-base font-semibold">Kê khai tài sản</span>}
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
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Tên đợt",
                dataIndex: "tenDot",
                align: "center",
                width: 300,
              },
              {
                title: "Loại",
                dataIndex: "loai",
                align: "center",
                width: 150,
              },
              {
                title: "Thời gian kê khai",
                dataIndex: "thoiGianKeKhai",
                align: "center",
                width: 200,
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
            dataSource={dataKeKhaiTaiSan}
          />
        </Panel>
      </Collapse>
    </div>
  )
}
