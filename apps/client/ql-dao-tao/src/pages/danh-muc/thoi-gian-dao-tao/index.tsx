import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import {
  useCountTrainingTime,
  useFindManyTrainingTime,
  useUpdateTrainingTime,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row } from "antd"
import _ from "lodash"
import type React from "react"
import { useCallback, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export default function TrainingTimePage() {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [_searchText, _setSearchText] = useState<string>("")
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
  })

  const { data = [], refetch } = useFindManyTrainingTime({
    where: {
      name: { contains: filters.name, mode: "insensitive" },
      code: { contains: filters.code, mode: "insensitive" },
    },
    orderBy: {
      name: "asc",
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  // const { data: curriculumVersionData = [] } = useFindManyCurriculumVersion({
  //     orderBy: { name: 'asc' },
  // })

  const { data: count } = useCountTrainingTime({
    where: {
      name: { contains: filters.name, mode: "insensitive" },
      code: { contains: filters.code, mode: "insensitive" },
      deletedAt: null,
    },
  })

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )
  const { onOpen } = useDisclosure<string>({
    tag: "PutTrainingTimeModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen()
  }

  const { mutateAsync: updateTrainingTime } = useUpdateTrainingTime()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateTrainingTime({
        where: {
          id,
        },
        data: {
          deletedAt: new Date(),
        },
      })
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value }
      debouncedRefetch()
      return newFilters
    })
  }

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="end">
            <Col span={4}>
              <Flex justify="end" gap={4}>
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_THOI_GIAN_DAO_TAO, "THEM") && (
                  <Button onClick={handleModal} type="primary">
                    Thêm mới
                  </Button>
                )}
              </Flex>
            </Col>
          </Row>
        </Col>
        <Col span={24}>
          <Table
            rowKey="id"
            id="fixed-class"
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Mã thời gian đào tạo",
                align: "left",
                width: 250,
                dataIndex: "code",
                type: "input",
              },
              {
                title: "Tên thời gian đào tạo",
                align: "left",
                dataIndex: "name",
                type: "input",
              },
              {
                title: "Thao tác",
                width: 150,
                align: "center",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_THOI_GIAN_DAO_TAO,
                  "SUA",
                  "XOA"
                ),
                render: (_, { id }) => (
                  <Row className="justify-center gap-2">
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_THOI_GIAN_DAO_TAO, "SUA") && (
                      <EditIcon
                        onClick={onOpen.bind(null, id)}
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                    )}
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_THOI_GIAN_DAO_TAO, "XOA") && (
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: () => handleDelete(id),
                        }}
                      />
                    )}
                  </Row>
                ),
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
              showTotal: (total, range) =>
                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
            }}
          />
        </Col>
      </Row>
    </div>
  )
}

TrainingTimePage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
