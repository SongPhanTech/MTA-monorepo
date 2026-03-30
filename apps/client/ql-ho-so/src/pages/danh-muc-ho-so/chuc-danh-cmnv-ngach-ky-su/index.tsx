import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import type { DM_ChucDanhCMNVKySu } from "@workspace/db"
import {
  useCountDM_ChucDanhCMNVKySu,
  useFindManyDM_ChucDanhCMNVKySu,
  useUpdateDM_ChucDanhCMNVKySu,
} from "@workspace/db/hooks"
import { Button, Col, Flex, message, Row } from "antd"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function ProfessionalTitleOfEngineer() {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

  const { onOpen } = useDisclosure<Partial<DM_ChucDanhCMNVKySu>>({
    tag: "ChucDanhNgachKySuModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { data = [], refetch } = useFindManyDM_ChucDanhCMNVKySu()
  const { data: count } = useCountDM_ChucDanhCMNVKySu({
    where: {
      deletedAt: null,
    },
  })
  const { mutateAsync: updateChucDanhCMNVKySu } = useUpdateDM_ChucDanhCMNVKySu()

  const handleModal = () => {
    onOpen()
  }

  const handleDeleteChucDanhCMNVKySu = async (id: string) => {
    try {
      showSpinner()
      await updateChucDanhCMNVKySu({
        where: {
          id,
        },
        data: {
          name: new Date().toISOString(),
          deletedAt: new Date(),
        },
      })
      message.success("Xóa thành công")
      refetch()
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={24}>
              <Flex justify="end">
                <Button onClick={handleModal} type="primary">
                  Thêm mới
                </Button>
              </Flex>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <Table
            rowKey="id"
            columns={[
              {
                title: "STT",
                width: 30,
                align: "center",
                render: (_, record, index) => index + (currentPage - 1) * DEFAULT_PAGINATE_SIZE + 1,
              },
              {
                title: "Tên chức danh ngạch kỹ sư",
                width: 150,
                align: "center",
                render: (_, record) => record.name || "",
              },
              {
                title: "Mô tả",
                width: 150,
                align: "center",
                dataIndex: "description",
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                render: (_, record) => {
                  return (
                    <Row className="justify-center gap-2">
                      <EditIcon
                        className="text-sm text-blue-700 cursor-pointer"
                        onClick={() => onOpen(record)}
                      />
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: () => handleDeleteChucDanhCMNVKySu(record.id),
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Row>
                  )
                },
              },
            ]}
            data={data}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: count,

              onChange: (page, pageSize) => {
                if (numberOfPages === pageSize) {
                  setCurrentPage(page)
                } else {
                  setCurrentPage(1)
                  setNumberOfPages(pageSize)
                }
              },
            }}
          />
        </Col>
      </Row>
    </div>
  )
}

ProfessionalTitleOfEngineer.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      breadcrumbList={[
        { title: "Danh mục hồ sơ", href: "/danh-muc-ho-so" },
        { title: "Chức danh CMNV ngạch kỹ sư" },
      ]}
    >
      {page}
    </DefaultLayout>
  )
}
