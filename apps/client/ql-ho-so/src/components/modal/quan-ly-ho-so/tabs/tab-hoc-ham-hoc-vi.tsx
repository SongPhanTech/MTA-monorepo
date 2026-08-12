import { PlusOutlined } from "@ant-design/icons"
import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { formatDate } from "@lib/utils"
import type { HocHam, HocVi, Student } from "@workspace/db"
import {
  useFindManyHocHam,
  useFindManyHocVi,
  useUpdateHocHam,
  useUpdateHocVi,
} from "@workspace/db/hooks"
import { Button, Collapse, Flex, message, Row } from "antd"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import type { UserProfileType } from "../type"

const { Panel } = Collapse

export default function HocHamHocViTab({
  studentData,
  userSelected,
}: {
  studentData?: Student | undefined
  userSelected?: UserProfileType | undefined
}) {
  const [openCollapse, setOpenCollapse] = useState<string | null>(null)
  const [currentPage, _setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

  const { onOpen } = useDisclosure<Partial<HocVi>>({
    tag: "PutHocViModal",
  })

  const { onOpen: openHocHam } = useDisclosure<Partial<HocHam>>({
    tag: "PutHocHamModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { data: hocViData = [], refetch: refetchHocVi } = useFindManyHocVi({
    include: {
      nationality: true,
      truong: true,
      academicDegreeType: true,
    },
  })
  const { data: hocHamData = [], refetch: refetchHocHam } = useFindManyHocHam({
    include: {
      academicRankType: true,
    },
  })

  const { mutateAsync: updateHocVi } = useUpdateHocVi()
  const { mutateAsync: updateHocHam } = useUpdateHocHam()


  const handleCollapseChange = (collapseId: string) => (key: string | string[]) => {
    if (key && key.length > 0) {
      // Nếu collapse này được mở, đóng các collapse khác
      setOpenCollapse(collapseId)
    } else {
      // Nếu collapse này bị đóng
      setOpenCollapse(null)
    }
  }

  const handleDeleteHocVi = async (id: string) => {
    try {
      showSpinner()
      await updateHocVi({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      })
      message.success("Xóa thành công")
      refetchHocVi()
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const handleDeleteHocHam = async (id: string) => {
    try {
      showSpinner()
      await updateHocHam({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      })
      message.success("Xóa thành công")
      refetchHocHam()
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const handleModal = () => {
    onOpen()
  }

  return (
    <div className="space-y-6">
      <Collapse
        ghost
        className="bg-gray-50  shadow-sm"
        accordion={true}
        activeKey={openCollapse === "hoc-vi" ? ["1"] : []}
        onChange={handleCollapseChange("hoc-vi")}
      >
        {/* Học vị */}
        <Panel
          header={<span className="text-base font-semibold">Học vị</span>}
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
                title: "Học vị",
                align: "center",
                width: 120,
                render: (_, record) => record?.academicDegreeType?.sTen || "",
              },
              {
                title: "Lĩnh vực",
                align: "center",
                width: 200,
                render: (_, record) => record.linhVuc || "",
              },
              {
                title: "Trường",
                align: "center",
                width: 200,
                render: (_, record) => record?.truong?.name || "",
              },
              {
                title: "Quốc gia",
                align: "center",
                width: 120,
                render: (_, record) => record?.nationality?.sTen || "",
              },
              {
                title: "Năm nhận",
                align: "center",
                width: 120,
                render: (_, record) => record.year || "",
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                render: (_, record) => (
                  <Row className="justify-center gap-2">
                    <EditIcon
                      className="text-sm text-blue-700 cursor-pointer"
                      onClick={onOpen.bind(null, record)}
                    />
                    <DeleteIcon
                      popConfirm={{
                        onConfirm: () => handleDeleteHocVi(record.id),
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Row>
                ),
              },
            ]}
            dataSource={hocViData}
          />
        </Panel>
      </Collapse>

      <Collapse
        ghost
        className="bg-gray-50 shadow-sm"
        accordion={true}
        activeKey={openCollapse === "hoc-ham" ? ["1"] : []}
        onChange={handleCollapseChange("hoc-ham")}
      >
        {/* Học hàm */}
        <Panel
          header={<span className="text-base font-semibold">Học hàm</span>}
          key="1"
          className="border-none mt"
        >
          <Flex justify="end">
            <Button
              onClick={() => openHocHam()}
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
                title: "Chức danh chuyên môn",
                align: "center",
                width: 120,
                render: (_, record) => record?.academicRankType?.sTen || "",
              },
              {
                title: "Nơi cấp",
                align: "center",
                width: 160,
                render: (_, record) => record?.noiCap || "",
              },
              {
                title: "Số quyết định",
                align: "center",
                width: 140,
                render: (_, record) => record?.soQuyetDinh || "",
              },
              {
                title: "Thời gian bắt đầu",
                align: "center",
                width: 120,
                render: (_, record) => formatDate(record.from) || "",
              },
              {
                title: "Thời gian kết thúc",
                align: "center",
                width: 120,
                render: (_, record) => formatDate(record.to) || "",
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                render: (_, record) => (
                  <Row className="justify-center gap-2">
                    <EditIcon
                      className="text-sm text-blue-700 cursor-pointer"
                      onClick={openHocHam.bind(null, record)}
                    />
                    <DeleteIcon
                      popConfirm={{
                        onConfirm: () => handleDeleteHocHam(record.id),
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Row>
                ),
              },
            ]}
            dataSource={hocHamData}
            pagination={false}
          />
        </Panel>
      </Collapse>
    </div>
  )
}
