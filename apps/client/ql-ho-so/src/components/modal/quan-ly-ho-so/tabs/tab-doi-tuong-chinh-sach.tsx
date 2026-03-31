import { PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { Button, Collapse, Flex, Row } from "antd"
import { useState } from "react"

const { Panel } = Collapse

const data = [
  {
    id: "1",
    doiTuong: "Người có công với cách mạng",
    to: "01/01/2018",
    from: "32/12/2023",
    description: "Được thưởng phụ cấp 20% lương",
  },
]

export default function DoiTuongChinhSachTab() {
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
        activeKey={openCollapse === "chinh-sach" ? ["1"] : []}
        onChange={handleCollapseChange("chinh-sach")}
      >
        {/* Học vị */}
        <Panel
          header={<span className="text-base font-semibold">Đối tượng chính sách</span>}
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
                title: "Đối tượng",
                dataIndex: "doiTuong",
                align: "center",
                width: 220,
              },
              {
                title: "Bắt đầu từ",
                dataIndex: "to",
                align: "center",
                width: 200,
              },
              {
                title: "Kết thúc vào",
                dataIndex: "from",
                align: "center",
                width: 200,
              },
              {
                title: "Ghi chú",
                dataIndex: "description",
                align: "center",
                width: 220,
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
            dataSource={data}
          />
        </Panel>
      </Collapse>
    </div>
  )
}
