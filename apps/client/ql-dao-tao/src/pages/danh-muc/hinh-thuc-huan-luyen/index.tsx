import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import type { TrainingCourse } from "@workspace/db/client"
import {
  useCountTrainingForm,
  useFindManyTrainingForm,
  useUpdateTrainingForm,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row } from "antd"
import _ from "lodash"
import { useRouter } from "next/router"
import type React from "react"
import { useCallback, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export default function TrainingFormPage({ trainingCourse }: { trainingCourse?: TrainingCourse }) {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [_searchText, _setSearchText] = useState<string>("")
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
  })

  const router = useRouter()
  const { data = [], refetch } = useFindManyTrainingForm({
    where: {
      ...(filters.name && filters.name !== ""
        ? { name: { contains: filters.name, mode: "insensitive" } }
        : {}),
      ...(filters.code && filters.code !== ""
        ? { code: { contains: filters.code, mode: "insensitive" } }
        : {}),
      deletedAt: null,
    },
    orderBy: {
      name: "asc",
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountTrainingForm({
    where: {
      ...(filters.name && filters.name !== ""
        ? { name: { contains: filters.name, mode: "insensitive" } }
        : {}),
      ...(filters.code && filters.code !== ""
        ? { code: { contains: filters.code, mode: "insensitive" } }
        : {}),
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
    tag: "PutTrainingFormModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen()
  }

  const { mutateAsync: updateTrainingForm } = useUpdateTrainingForm()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateTrainingForm({
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

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="end">
            <Col span={4}>
              <Flex justify="end" gap={4}>
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_HINH_THUC_HUAN_LUYEN, "THEM") && (
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
                render: (_, __, index) => index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
              },
              {
                title: "Mã hình thức huấn luyện",
                align: "left",
                width: 250,
                dataIndex: "code",
                type: "input",
              },
              {
                title: "Tên hình thức huấn luyện",
                align: "left",
                dataIndex: "name",
                type: "input",
              },
              {
                title: "Thao tác",
                width: 150,
                align: "center",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_HINH_THUC_HUAN_LUYEN,
                  "SUA",
                  "XOA"
                ),
                render: (_, { id }) => (
                  <Row className="justify-center gap-2">
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_HINH_THUC_HUAN_LUYEN, "SUA") && (
                      <EditIcon
                        onClick={onOpen.bind(null, id)}
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                    )}
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_HINH_THUC_HUAN_LUYEN, "XOA") && (
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

TrainingFormPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
