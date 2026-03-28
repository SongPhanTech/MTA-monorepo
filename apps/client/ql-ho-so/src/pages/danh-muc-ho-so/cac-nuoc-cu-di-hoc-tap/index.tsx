import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import type { DM_NuocCuDiHocTap } from "@workspace/db"
import {
  useCountDM_NuocCuDiHocTap,
  useFindManyDM_NuocCuDiHocTap,
  useUpdateDM_NuocCuDiHocTap,
} from "@workspace/db/hooks"
import { Button, Col, Flex, message, Row } from "antd"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function CountriesSendingForStudy() {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

  const { onOpen } = useDisclosure<Partial<DM_NuocCuDiHocTap>>({
    tag: "CacNuocCuDiHocTapModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { data = [], refetch } = useFindManyDM_NuocCuDiHocTap()
  const { mutateAsync: updateNuocCuDiHocTap } = useUpdateDM_NuocCuDiHocTap()
  const { data: count } = useCountDM_NuocCuDiHocTap({ where: { deletedAt: null } })

  const handleModal = () => {
    onOpen()
  }

  const handleDeleteNuocCuDiHocTap = async (id: string) => {
    try {
      showSpinner()
      await updateNuocCuDiHocTap({
        where: {
          id,
        },
        data: {
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
                fixed: "left",
                render: (_, record, index) => index + (currentPage - 1) * DEFAULT_PAGINATE_SIZE + 1,
              },
              {
                title: "Tên nước",
                width: 150,
                align: "center",
                render: (_, record) => record.name || "",
              },
              {
                title: "Mô tả",
                width: 150,
                align: "center",
                render: (_, record) => record.description || "",
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                fixed: "right",
                render: (_, record) => {
                  return (
                    <Row className="justify-center gap-2">
                      <EditIcon
                        className="text-sm text-blue-700 cursor-pointer"
                        onClick={() => onOpen(record)}
                      />
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: () => handleDeleteNuocCuDiHocTap(record.id),
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

CountriesSendingForStudy.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      breadcrumbList={[
        { title: "Danh mục hồ sơ", href: "/danh-muc-ho-so" },
        { title: "Các nước cử đi học tập" },
      ]}
    >
      {page}
    </DefaultLayout>
  )
}
