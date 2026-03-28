import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import {
  useCountClassSchedule,
  useFindManyClassSchedule,
  useUpdateClassSchedule,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row } from "antd"
import dayjs from "dayjs"
import _ from "lodash"
import type React from "react"
import { useCallback, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export default function LichKiemTraGiangDay() {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [_searchText, _setSearchText] = useState<string>("")
  const [filters, setFilters] = useState<FilterProps>({
    code: "",
    name: "",
  })

  const { data = [], refetch } = useFindManyClassSchedule({
    where: {
      periodType: "CHECK",
    },
    include: {
      subjectClass: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountClassSchedule({
    where: {
      deletedAt: null,
      periodType: "CHECK",
    },
  })

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
    }, 500),
    []
  )
  const { onOpen } = useDisclosure<string>({
    tag: "PutLichTuanThangModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: updateClassSchedule } = useUpdateClassSchedule()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateClassSchedule({
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

  const { onOpen: onOpenPutLichVaSuKienModal } = useDisclosure({
    tag: "PutLichVaSuKienModal",
  })

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 16]} align="top" justify="end">
            <Col span={4}>
              <Flex justify="end" gap={4}>
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_LICH_KIEM_TRA_GIANG_DAY, "THEM") && (
                  <Button
                    onClick={() =>
                      onOpenPutLichVaSuKienModal({
                        periodType: "CHECK",
                      })
                    }
                    type="primary"
                  >
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
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            columns={[
              {
                title: "TT",
                width: 35,
                align: "center",
                fixed: "left",
                render: (_, __, index) => index + 1 + (currentPage - 1) * DEFAULT_PAGINATE_SIZE,
              },
              {
                title: "Ngày",
                dataIndex: "classDate",
                width: 150,
                type: "input",
                align: "center",
                render: (_, record) =>
                  record.classDate ? dayjs(record.classDate).format("DD/MM/YYYY") : "-",
              },
              {
                title: "Thời gian",
                width: 150,
                type: "input",
                align: "center",
                render: (_, record) =>
                  record.startTime && record.endTime
                    ? `${dayjs(record.startTime).format("HH:mm")} - ${dayjs(record.endTime).format(
                        "HH:mm"
                      )}`
                    : "-",
              },
              {
                title: "Địa điểm",
                dataIndex: "location",
                align: "center",
                width: 250,
              },
              {
                title: "Nội dung",
                align: "center",
                dataIndex: "notes",
                type: "input",
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                hidden: !canSome(
                  QL_DAO_TAO_PERMISSION.QL_DAO_TAO_LICH_KIEM_TRA_GIANG_DAY,
                  "SUA",
                  "XOA"
                ),
                render: (_, { id }) => (
                  <Row className="justify-center gap-2">
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_LICH_KIEM_TRA_GIANG_DAY, "SUA") && (
                      <EditIcon
                        onClick={() =>
                          onOpenPutLichVaSuKienModal({
                            periodType: "CHECK",
                            id,
                          })
                        }
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                    )}
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_LICH_KIEM_TRA_GIANG_DAY, "XOA") && (
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

LichKiemTraGiangDay.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
