import { PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { Button, Collapse, Flex, Row } from "antd"
import { useState } from "react"

const { Panel } = Collapse

const dataKhenThuong = [
  {
    id: "1",
    hinhThucKhenThuong: "Khen thưởng sáng kiến",
    capKhenThuong: "Tổng cục Chính trị",
    soQuyetDinh: "456/QĐ-TCC",
    nguoiKy: "Trung tướng B",
    ngayNhanQuyetDinh: "25/03/2021",
  },
  {
    id: "2",
    hinhThucKhenThuong: "Bằng khen tập thể",
    capKhenThuong: "Bộ Quốc phòng",
    soQuyetDinh: "789/QĐ-BQP",
    nguoiKy: "Thứ trưởng",
    ngayNhanQuyetDinh: "15/12/2020",
  },
]

// Data cho Thông tin kỷ luật
const dataKyLuat = [
  {
    id: "1",
    hinhThucKyLuat: "Cảnh cáo",
    capKyLuat: "Ban Chỉ huy Quân khu",
    soQuyetDinh: "012/QĐ-BCH",
    nguoiKy: "Đại tá Nguyễn Trung Hiếu",
    ngayNhanQuyetDinh: "05/11/2021",
  },
]

export default function KhenThuongKyLuatTab() {
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
          header={<span className="text-base font-semibold">Thông tin khen thưởng</span>}
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
                title: "Hình thức khen thưởng",
                dataIndex: "hinhThucKhenThuong",
                align: "center",
                width: 200,
              },
              {
                title: "Cấp khen thưởng",
                dataIndex: "capKhenThuong",
                align: "center",
                width: 180,
              },
              {
                title: "Số quyết định",
                dataIndex: "soQuyetDinh",
                align: "center",
                width: 150,
              },
              {
                title: "Người ký",
                dataIndex: "nguoiKy",
                align: "center",
                width: 150,
              },
              {
                title: "Ngày nhận quyết định",
                dataIndex: "ngayNhanQuyetDinh",
                align: "center",
                width: 150,
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
            dataSource={dataKhenThuong}
          />
        </Panel>
      </Collapse>

      <Collapse
        ghost
        className="bg-gray-50 shadow-sm"
        accordion={true}
        activeKey={openCollapse === "ky-luat" ? ["1"] : []}
        onChange={handleCollapseChange("ky-luat")}
      >
        {/* Học hàm */}
        <Panel
          header={<span className="text-base font-semibold">Thông tin kỷ luật</span>}
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
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Hình thức kỷ luật",
                dataIndex: "hinhThucKyLuat",
                align: "center",
                width: 180,
              },
              {
                title: "Cấp kỷ luật",
                dataIndex: "capKyLuat",
                align: "center",
                width: 180,
              },
              {
                title: "Số quyết định",
                dataIndex: "soQuyetDinh",
                align: "center",
                width: 150,
              },
              {
                title: "Người ký",
                dataIndex: "nguoiKy",
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
            dataSource={dataKyLuat}
          />
        </Panel>
      </Collapse>
    </div>
  )
}
