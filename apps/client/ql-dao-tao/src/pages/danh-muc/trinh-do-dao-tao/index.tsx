import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import {
  useCountTrainingLevel,
  useFindManyTrainingLevel,
  useUpdateTrainingLevel,
} from "@workspace/db/hooks"
import { Button, Col, Flex, message, Row } from "antd"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export default function TrainingLevel() {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
  })

  const where = useMemo(
    () => ({
      ...(filters.code && filters.code !== ""
        ? {
            code: {
              contains: filters.code,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.name && filters.name !== ""
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive" as const,
            },
          }
        : {}),
    }),
    [filters.code, filters.name]
  )

  const { data = [], refetch } = useFindManyTrainingLevel({
    where,
    orderBy: {
      createdAt: "desc",
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountTrainingLevel({
    where: {
      ...where,
      deletedAt: null,
    },
  })

  const { onOpen } = useDisclosure<string>({
    tag: "PutTrainingLevel",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen()
  }

  const { mutateAsync: updateTrainingLevel } = useUpdateTrainingLevel()

  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateTrainingLevel({
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
                title: "Mã",
                align: "left",
                width: 250,
                dataIndex: "code",
                type: "input",
              },
              {
                title: "Tên",
                align: "left",
                dataIndex: "name",
                type: "input",
              },
              {
                title: "Thao tác",
                width: 150,
                align: "center",
                render: (_, { id }) => (
                  <Row className="justify-center gap-2">
                    <EditIcon
                      onClick={onOpen.bind(null, id)}
                      className="text-sm text-blue-700 cursor-pointer"
                    />
                    <DeleteIcon
                      popConfirm={{
                        onConfirm: () => handleDelete(id),
                      }}
                    />
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
            }}
          />
        </Col>
      </Row>
    </div>
  )
}

TrainingLevel.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
