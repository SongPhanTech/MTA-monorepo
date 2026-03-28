import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import type { DM_TruongDaoTaoBacDH } from "@workspace/db"
import {
  useCountDM_TruongDaoTaoBacDH,
  useFindManyDM_TruongDaoTaoBacDH,
  useUpdateDM_TruongDaoTaoBacDH,
} from "@workspace/db/hooks"
import { Button, Col, Flex, Input, message, Row } from "antd"
import _ from "lodash"
import { useCallback, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function Universities() {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<{
    search: string
  }>({
    search: "",
  })

  const { showSpinner, hideSpinner } = useSpinner()
  const { onOpen } = useDisclosure<Partial<DM_TruongDaoTaoBacDH>>({
    tag: "CacTruongDaoTaoBacDHModal",
  })

  const { data = [], refetch } = useFindManyDM_TruongDaoTaoBacDH({
    where: {
      name: {
        contains: filters.search,
        mode: "insensitive",
      },
    },
  })
  const { data: count } = useCountDM_TruongDaoTaoBacDH({
    where: {
      name: {
        contains: filters.search,
        mode: "insensitive",
      },
      deletedAt: null,
    },
  })
  const { mutateAsync: updateTruongDaoTao } = useUpdateDM_TruongDaoTaoBacDH()

  const handleModal = () => {
    onOpen()
  }

  const handleDeleteTruongDaoTao = async (id: string) => {
    try {
      showSpinner()
      await updateTruongDaoTao({
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

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }))
    setCurrentPage(1)
    debouncedRefetch()
  }

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="space-between">
            <Col span={8}>
              <Input
                placeholder="Tìm kiếm theo tên trường...."
                value={filters.search}
                onChange={handleSearchChange}
                allowClear
              />
            </Col>
            <Col span={6}>
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
                title: "Tên trường",
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
                          onConfirm: () => handleDeleteTruongDaoTao(record.id),
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

Universities.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <DefaultLayout
      breadcrumbList={[
        { title: "Danh mục hồ sơ", href: "/danh-muc-ho-so" },
        { title: "Các trường đào tạo bậc đại học" },
      ]}
    >
      {page}
    </DefaultLayout>
  )
}
