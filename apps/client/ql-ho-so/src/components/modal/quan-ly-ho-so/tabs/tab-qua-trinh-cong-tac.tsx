import { PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { Button, Collapse, Flex, Row } from "antd"
import { useState } from "react"

const { Panel } = Collapse

export const dataCapBac = [
  {
    id: "1",
    tenCapBac: "Thiếu úy",
    noiRaQuyetDinh: "Bộ Quốc phòng",
    capRaQuyetDinh: "Quyết định 123/QĐ-BQP",
    ngayNhanQuyetDinh: "15/07/2015",
  },
  {
    id: "2",
    tenCapBac: "Trung úy",
    noiRaQuyetDinh: "Bộ Quốc phòng",
    capRaQuyetDinh: "Quyết định 456/QĐ-BQP",
    ngayNhanQuyetDinh: "20/07/2018",
  },
]

// Data cho Quá trình công tác
export const dataQuaTrinhCongTac = [
  {
    id: "1",
    tuThangNam: "09/2010",
    denThangNam: "08/2014",
    donVi: "Khoa Công nghệ thông tin",
    chucVu: "Giảng viên",
  },
  {
    id: "2",
    tuThangNam: "09/2014",
    denThangNam: "12/2018",
    donVi: "Viện Nghiên cứu - PQD",
    chucVu: "Phó Giám đốc viện",
  },
  {
    id: "3",
    tuThangNam: "01/2019",
    denThangNam: "03/2023",
    donVi: "Khoa Công nghệ thông tin",
    chucVu: "Trưởng khoa",
  },
]

// Data cho Quá trình được cử đi công tác
export const dataQuaTrinhCuCongTac = [
  {
    id: "1",
    tuThangNam: "03/2016",
    denThangNam: "03/2017",
    donVi: "Đại học Quốc gia Hà Nội",
    chucVu: "Nghiên cứu hợp tác",
  },
  {
    id: "2",
    tuThangNam: "05/2019",
    denThangNam: "08/2019",
    donVi: "Trường ĐH Bách khoa TP.HCM",
    chucVu: "Tập huấn giảng dạy CSDL",
  },
]

export default function QuaTrinhCongTacTab() {
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
        className="bg-gray-50  shadow-sm"
        accordion={true}
        activeKey={openCollapse === "cap-bac" ? ["1"] : []}
        onChange={handleCollapseChange("cap-bac")}
      >
        {/* Học vị */}
        <Panel
          header={<span className="text-base font-semibold">Cấp bậc</span>}
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
                render: (_, __, index) => index + 1 + (currentPage - 1) * _numberOfPages,
              },
              {
                title: "Tên cấp bậc",
                dataIndex: "tenCapBac",
                align: "center",
                width: 150,
              },
              {
                title: "Nơi ra quyết định",
                dataIndex: "noiRaQuyetDinh",
                align: "center",
                width: 200,
              },
              {
                title: "Cấp ra quyết định",
                dataIndex: "capRaQuyetDinh",
                align: "center",
                width: 200,
              },
              {
                title: "Ngày nhận quyết định",
                dataIndex: "ngayNhanQuyetDinh",
                align: "center",
                width: 170,
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
            dataSource={dataCapBac}
          />
        </Panel>
      </Collapse>

      <Collapse
        ghost
        className="bg-gray-50 shadow-sm"
        accordion={true}
        activeKey={openCollapse === "cong-tac" ? ["1"] : []}
        onChange={handleCollapseChange("cong-tac")}
      >
        {/* Học hàm */}
        <Panel
          header={<span className="text-base font-semibold">Quá trình công tác</span>}
          key="1"
          className="border-none mt"
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
                render: (_, __, index) => index + 1 + (currentPage - 1) * _numberOfPages,
              },
              {
                title: "Từ tháng năm",
                dataIndex: "tuThangNam",
                align: "center",
                width: 150,
              },
              {
                title: "Đến tháng năm",
                dataIndex: "denThangNam",
                align: "center",
                width: 150,
              },
              {
                title: "Đơn vị",
                dataIndex: "donVi",
                align: "center",
                width: 250,
              },
              {
                title: "Chức vụ",
                dataIndex: "chucVu",
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
            dataSource={dataQuaTrinhCongTac}
          />
        </Panel>
      </Collapse>

      <Collapse
        ghost
        className="bg-gray-50 shadow-sm"
        accordion={true}
        activeKey={openCollapse === "cu-cong-tac" ? ["1"] : []}
        onChange={handleCollapseChange("cu-cong-tac")}
      >
        {/* Học hàm */}
        <Panel
          header={<span className="text-base font-semibold">Quá trình được cử đi công tác</span>}
          key="1"
          className="border-none mt"
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
                render: (_, __, index) => index + 1 + (currentPage - 1) * _numberOfPages,
              },
              {
                title: "Từ tháng năm",
                dataIndex: "tuThangNam",
                align: "center",
                width: 150,
              },
              {
                title: "Đến tháng năm",
                dataIndex: "denThangNam",
                align: "center",
                width: 150,
              },
              {
                title: "Đơn vị",
                dataIndex: "donVi",
                align: "center",
                width: 250,
              },
              {
                title: "Chức vụ",
                dataIndex: "chucVu",
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
            dataSource={dataQuaTrinhCuCongTac}
          />
        </Panel>
      </Collapse>
    </div>
  )
}
