import { PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { Button, Collapse, Flex, Row } from "antd"
import { useState } from "react"

const { Panel } = Collapse

const dataThanNhan = [
  {
    id: "1",
    hoTen: "Nguyễn Thị Lan",
    moiQuanHe: "Vợ",
    namSinh: "1988",
    noiDung: "",
  },
  {
    id: "2",
    hoTen: "Trần Văn Minh",
    moiQuanHe: "Con trai",
    namSinh: "2012",
    noiDung: "Học sinh Tiểu học",
  },
  {
    id: "3",
    hoTen: "Nguyễn Văn Nam",
    moiQuanHe: "Bố",
    namSinh: "1960",
    noiDung: "Nông dân",
  },
  {
    id: "4",
    hoTen: "Nguyễn Thị Hoa",
    moiQuanHe: "Mẹ",
    namSinh: "1965",
    noiDung: "Nội trợ",
  },
]

export default function ThanNhanTab() {
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
        activeKey={openCollapse === "khen-thuong" ? ["1"] : []}
        onChange={handleCollapseChange("khen-thuong")}
      >
        {/* Học vị */}
        <Panel
          header={<span className="text-base font-semibold">Danh sách thân nhân</span>}
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
                title: "Họ tên",
                dataIndex: "hoTen",
                align: "center",
                width: 200,
              },
              {
                title: "Mối quan hệ",
                dataIndex: "moiQuanHe",
                align: "center",
                width: 150,
              },
              {
                title: "Năm sinh",
                dataIndex: "namSinh",
                align: "center",
                width: 120,
              },
              {
                title: "Nội dung",
                dataIndex: "noiDung",
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
            dataSource={dataThanNhan}
          />
        </Panel>
      </Collapse>
    </div>
  )
}
