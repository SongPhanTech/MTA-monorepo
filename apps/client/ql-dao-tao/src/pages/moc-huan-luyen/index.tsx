import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { emptyObjectIf } from "@workspace/constant"
import {
  useCountMilestone,
  useFindManyMilestone,
  useFindManySchoolYear,
  useUpdateMilestone,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { Button, Col, Flex, message, Row } from "antd"
import dayjs from "dayjs"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function MilestonePage() {
  const { can, canSome } = useAbility()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    schoolYearId: undefined,
    order: undefined,
    startDate: undefined,
    endDate: undefined,
  })
  const where = useMemo(
    () => ({
      ...(filters.name && filters.name !== ""
        ? {
            name: {
              contains: filters.name,
              mode: "insensitive" as const,
            },
          }
        : {}),
      ...(filters.schoolYearId
        ? {
            schoolYearId: {
              in: Array.isArray(filters.schoolYearId)
                ? filters.schoolYearId
                : [filters.schoolYearId],
            },
          }
        : {}),
      ...(filters.startDate?.length === 2
        ? {
            startDate: {
              gte: dayjs(filters.startDate?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.startDate?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
      ...(filters.endDate?.length === 2
        ? {
            endDate: {
              gte: dayjs(filters.endDate?.[0], "DD/MM/YYYY").toDate(),
              lte: dayjs(filters.endDate?.[1], "DD/MM/YYYY").toDate(),
            },
          }
        : {}),
    }),
    [filters.name, filters.schoolYearId, filters.startDate, filters.endDate]
  )

  const { data = [] } = useFindManyMilestone({
    where,
    include: {
      schoolYear: true,
    },
    orderBy: [
      ...emptyObjectIf(
        [
          {
            period: filters.order,
          },
        ],
        !!filters.order
      ),
      {
        createdAt: "desc",
      },
    ],
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountMilestone({
    where: {
      ...where,
      deletedAt: null,
    },
  })

  const { onOpen, onClose } = useDisclosure<string>({
    tag: "PutMilestoneModal",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const handleModal = () => {
    onOpen()
  }
  const { mutateAsync: updateMilestone } = useUpdateMilestone()
  async function handleDelete(id: string) {
    try {
      showSpinner()
      await updateMilestone({
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
  const { data: dataSchoolYear = [] } = useFindManySchoolYear({
    orderBy: { startDate: "desc" },
  })

  return (
    <div>
      <Row gutter={[16, 0]}>
        <Col span={24}>
          <Row gutter={[16, 0]} align="top" justify="space-between">
            <Col span={24}>
              <Flex justify="end">
                {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_MOC_HUAN_LUYEN, "THEM") && (
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
            filters={filters}
            setFilters={(value) => {
              setFilters(value)
              setCurrentPage(1)
            }}
            columns={[
              {
                title: "STT",
                width: 20,
                align: "center",
                render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
              },
              {
                title: "Nội dung",
                align: "left",
                dataIndex: "name",
                type: "input",
                width: 150,
              },
              {
                title: "Tiết bắt đầu",
                align: "left",
                dataIndex: "order",
                width: 100,
                type: "order",
                render: (_, record) => record?.startPeriod,
              },
              {
                title: "Số tiết",
                align: "right",
                dataIndex: "period",
                width: 100,
              },
              {
                title: "Năm học",
                align: "left",
                dataIndex: "schoolYearId",
                type: "select",
                options: dataSchoolYear?.map(({ id, name }) => ({
                  value: id,
                  label: name,
                })),
                width: 150,
                render: (_, record) => (record?.schoolYear?.name ? record?.schoolYear?.name : ""),
              },
              {
                title: "Ngày bắt đầu",
                align: "left",
                width: 120,
                dataIndex: "startDate",
                type: "date",
                render: (_, record) =>
                  record?.startDate ? dayjs(record?.startDate).format("DD/MM/YYYY") : "",
              },
              {
                title: "Ngày kết thúc",
                align: "left",
                width: 120,
                dataIndex: "endDate",
                type: "date",
                render: (_, record) =>
                  record?.endDate ? dayjs(record?.endDate).format("DD/MM/YYYY") : "",
              },
              {
                title: "Mô tả",
                align: "left",
                dataIndex: "description",
                width: 150,
              },
              {
                title: "Thao tác",
                width: 100,
                align: "center",
                hidden: !canSome(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_MOC_HUAN_LUYEN, "SUA", "XOA"),
                render: (_, { id }) => (
                  <Row className="justify-center gap-2">
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_MOC_HUAN_LUYEN, "SUA") && (
                      <EditIcon
                        onClick={onOpen.bind(null, id)}
                        className="text-sm text-blue-700 cursor-pointer"
                      />
                    )}
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_MOC_HUAN_LUYEN, "XOA") && (
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
            }}
          />
        </Col>
      </Row>
    </div>
  )
}

MilestonePage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
