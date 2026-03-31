import { PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import { Button, Collapse, Flex, Row } from "antd"
import { useState } from "react"
import type { UserProfileType } from "../type"

const { Panel } = Collapse

const dataTrinhDoChinhTri = [
  {
    id: "1",
    hinhThucDaoTao: "Chính quy",
    trinhDo: "Cử nhân",
    coSoDaoTao: "Học viện Chính trị Quốc gia Hồ Chí Minh",
    thoiGianBatDau: "01/09/2018",
    thoiGianKetThuc: "30/06/2022",
  },
]

// Data cho Trình độ quản lý hành chính
const dataTrinhDoHanhChinh = [
  {
    id: "1",
    hinhThucDaoTao: "Tại chức",
    trinhDo: "Thạc sĩ",
    coSoDaoTao: "Đại học Quốc gia Hà Nội",
    thoiGianBatDau: "01/09/2020",
    thoiGianKetThuc: "30/06/2022",
  },
]

// Data cho Trình độ quản lý nhà nước
const dataTrinhDoNhaNuoc = [
  {
    id: "1",
    hinhThucDaoTao: "Bồi dưỡng",
    trinhDo: "Cao cấp",
    coSoDaoTao: "Học viện Hành chính Quốc gia",
    thoiGianBatDau: "15/03/2021",
    thoiGianKetThuc: "15/12/2021",
  },
]

// Data cho Ngoại ngữ
const dataNgoaiNgu = [
  {
    id: "1",
    hinhThucDaoTao: "Tự học",
    trinhDo: "B2",
    coSoDaoTao: "Cambridge English",
    thoiGianBatDau: "01/01/2020",
    thoiGianKetThuc: "31/12/2020",
  },
]

// Data cho Tin học
const dataTinHoc = [
  {
    id: "1",
    hinhThucDaoTao: "Khoá học",
    trinhDo: "Chứng chỉ IC3",
    coSoDaoTao: "Trung tâm Tin học Đại học Bách Khoa",
    thoiGianBatDau: "01/06/2019",
    thoiGianKetThuc: "30/08/2019",
  },
]

// Data cho Bồi dưỡng quốc phòng an ninh
const dataQuocPhongAnNinh = [
  {
    id: "1",
    boiDuongQuocPhongAnNinh: "Khoá bồi dưỡng kiến thức QP-AN cho cán bộ lãnh đạo",
    thoiGianBatDau: "01/03/2021",
    thoiGianKetThuc: "30/03/2021",
  },
]

export default function TrinhDoChungChiTab({ userSelected }: { userSelected?: UserProfileType }) {
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
        activeKey={openCollapse === "chinh-tri" ? ["1"] : []}
        onChange={handleCollapseChange("chinh-tri")}
      >
        {/* Học vị */}
        <Panel
          header={<span className="text-base font-semibold">Trình độ lý luận chính trị</span>}
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
            rowKey={"id"}
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center" as const,
                fixed: "left" as const,
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Hình thức đào tạo",
                dataIndex: "hinhThucDaoTao",
                align: "center",
                width: 200,
              },
              {
                title: "Trình độ",
                dataIndex: "trinhDo",
                align: "center",
                width: 200,
              },
              {
                title: "Cơ sở đào tạo",
                dataIndex: "coSoDaoTao",
                align: "center",
                width: 300,
              },
              {
                title: "Thời gian bắt đầu",
                dataIndex: "thoiGianBatDau",
                align: "center",
                width: 150,
              },
              {
                title: "Thời gian kết thúc",
                dataIndex: "thoiGianKetThuc",
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
            dataSource={dataTrinhDoChinhTri}
          />
        </Panel>
      </Collapse>

      <Collapse
        ghost
        className="bg-gray-50 shadow-sm"
        accordion={true}
        activeKey={openCollapse === "hanh-chinh" ? ["1"] : []}
        onChange={handleCollapseChange("hanh-chinh")}
      >
        {/* Học hàm */}
        <Panel
          header={<span className="text-base font-semibold">Trình độ quản lý hành chính</span>}
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
            rowKey={"id"}
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center" as const,
                fixed: "left" as const,
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Hình thức đào tạo",
                dataIndex: "hinhThucDaoTao",
                align: "center",
                width: 200,
              },
              {
                title: "Trình độ",
                dataIndex: "trinhDo",
                align: "center",
                width: 200,
              },
              {
                title: "Cơ sở đào tạo",
                dataIndex: "coSoDaoTao",
                align: "center",
                width: 300,
              },
              {
                title: "Thời gian bắt đầu",
                dataIndex: "thoiGianBatDau",
                align: "center",
                width: 150,
              },
              {
                title: "Thời gian kết thúc",
                dataIndex: "thoiGianKetThuc",
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
            dataSource={dataTrinhDoHanhChinh}
            pagination={false}
          />
        </Panel>
      </Collapse>

      <Collapse
        ghost
        className="bg-gray-50 shadow-sm"
        accordion={true}
        activeKey={openCollapse === "nha-nuoc" ? ["1"] : []}
        onChange={handleCollapseChange("nha-nuoc")}
      >
        {/* Học hàm */}
        <Panel
          header={<span className="text-base font-semibold">Trình độ quản lý nhà nước</span>}
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
                align: "center" as const,
                fixed: "left" as const,
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Hình thức đào tạo",
                dataIndex: "hinhThucDaoTao",
                align: "center",
                width: 200,
              },
              {
                title: "Trình độ",
                dataIndex: "trinhDo",
                align: "center",
                width: 200,
              },
              {
                title: "Cơ sở đào tạo",
                dataIndex: "coSoDaoTao",
                align: "center",
                width: 300,
              },
              {
                title: "Thời gian bắt đầu",
                dataIndex: "thoiGianBatDau",
                align: "center",
                width: 150,
              },
              {
                title: "Thời gian kết thúc",
                dataIndex: "thoiGianKetThuc",
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
            dataSource={dataTrinhDoNhaNuoc}
            pagination={false}
          />
        </Panel>
      </Collapse>

      <Collapse
        ghost
        className="bg-gray-50 shadow-sm"
        accordion={true}
        activeKey={openCollapse === "ngoai-ngu" ? ["1"] : []}
        onChange={handleCollapseChange("ngoai-ngu")}
      >
        {/* Học hàm */}
        <Panel
          header={<span className="text-base font-semibold">Ngoại ngữ</span>}
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
                align: "center" as const,
                fixed: "left" as const,
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Hình thức đào tạo",
                dataIndex: "hinhThucDaoTao",
                align: "center",
                width: 200,
              },
              {
                title: "Trình độ",
                dataIndex: "trinhDo",
                align: "center",
                width: 200,
              },
              {
                title: "Cơ sở đào tạo",
                dataIndex: "coSoDaoTao",
                align: "center",
                width: 300,
              },
              {
                title: "Thời gian bắt đầu",
                dataIndex: "thoiGianBatDau",
                align: "center",
                width: 150,
              },
              {
                title: "Thời gian kết thúc",
                dataIndex: "thoiGianKetThuc",
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
            dataSource={dataNgoaiNgu}
            pagination={false}
          />
        </Panel>
      </Collapse>

      <Collapse
        ghost
        className="bg-gray-50 shadow-sm"
        accordion={true}
        activeKey={openCollapse === "tin-hoc" ? ["1"] : []}
        onChange={handleCollapseChange("tin-hoc")}
      >
        {/* Học hàm */}
        <Panel
          header={<span className="text-base font-semibold">Tin học</span>}
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
                align: "center" as const,
                fixed: "left" as const,
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Hình thức đào tạo",
                dataIndex: "hinhThucDaoTao",
                align: "center",
                width: 200,
              },
              {
                title: "Trình độ",
                dataIndex: "trinhDo",
                align: "center",
                width: 200,
              },
              {
                title: "Cơ sở đào tạo",
                dataIndex: "coSoDaoTao",
                align: "center",
                width: 300,
              },
              {
                title: "Thời gian bắt đầu",
                dataIndex: "thoiGianBatDau",
                align: "center",
                width: 150,
              },
              {
                title: "Thời gian kết thúc",
                dataIndex: "thoiGianKetThuc",
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
            dataSource={dataTinHoc}
            pagination={false}
          />
        </Panel>
      </Collapse>

      <Collapse
        ghost
        className="bg-gray-50 shadow-sm"
        accordion={true}
        activeKey={openCollapse === "an-ninh" ? ["1"] : []}
        onChange={handleCollapseChange("an-ninh")}
      >
        {/* Học hàm */}
        <Panel
          header={<span className="text-base font-semibold">Bồi dưỡng quốc phòng an ninh</span>}
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
                align: "center" as const,
                fixed: "left" as const,
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Bồi dưỡng quốc phòng an ninh",
                dataIndex: "boiDuongQuocPhongAnNinh",
                align: "center" as const,
                width: 400,
              },
              {
                title: "Thời gian bắt đầu",
                dataIndex: "thoiGianBatDau",
                align: "center" as const,
                width: 150,
              },
              {
                title: "Thời gian kết thúc",
                dataIndex: "thoiGianKetThuc",
                align: "center" as const,
                width: 150,
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center" as const,
                fixed: "right" as const,
                render: (_, { id }) => (
                  <Row className="justify-center gap-2">
                    <EditIcon className="text-sm text-blue-700 cursor-pointer" />
                    <DeleteIcon />
                  </Row>
                ),
              },
            ]}
            dataSource={dataQuocPhongAnNinh}
            pagination={false}
          />
        </Panel>
      </Collapse>
    </div>
  )
}
