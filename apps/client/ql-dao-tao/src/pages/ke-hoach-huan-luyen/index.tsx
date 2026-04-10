import Table from "@components/commons/table"
import DeleteIcon from "@components/icons/delete"
import EditIcon from "@components/icons/edit"
import PutPlanTrainingPracticeModal from "@components/modal/put-plan-training-practice"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import type { TrainingCourse } from "@workspace/db/client"
import {
  useCountPlanTrainingPractice,
  useFindManyPlanTrainingPractice,
  useFindManySemester,
  useFindManyTrainingCourse,
  useUpdatePlanTrainingPractice,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Flex, Row, message } from "antd"
import dayjs from "dayjs"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export default function TrainingActivity() {
  const { can } = useAbility()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { id: semesterStoreId } = useSemesterStore()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const { showSpinner, hideSpinner } = useSpinner()
  const { onOpen } = useDisclosure<string>({
    tag: "PutPlanTrainingPracticeModal",
  })

  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    trainingCourseId: undefined,
    semesterId: undefined,
    startDate: undefined,
    endDate: undefined,
    active: undefined,
  })

  const { data: trainingCourseData = [] } = useFindManyTrainingCourse(
    {
      where: {
        trainingObjectTypeId,
        deletedAt: null,
        active: true,
      },
      orderBy: {
        semesterStart: {
          startDate: "desc",
        },
      },
    },
    { enabled: !!trainingObjectTypeId }
  )

  const { data: semesterData = [] } = useFindManySemester(
    {
      where: {
        deletedAt: null,
      },
      orderBy: { startDate: "desc" },
    },
    { enabled: !!trainingObjectTypeId }
  )

  const { mutateAsync: updatePlanTrainingPractice } = useUpdatePlanTrainingPractice()

  const where = useMemo(() => {
    const effectiveSemesterId = filters.semesterId || semesterStoreId
    const conditions: Record<string, unknown> = {
      deletedAt: null,
      ...(trainingObjectTypeId ? { trainingObjectTypeId } : {}),
    }

    if (filters.name) {
      conditions.name = {
        contains: filters.name,
        mode: "insensitive" as const,
      }
    }

    if (effectiveSemesterId) {
      if (Array.isArray(effectiveSemesterId)) {
        conditions.semesterId = { in: effectiveSemesterId }
      } else {
        conditions.semesterId = effectiveSemesterId
      }
    }

    if (filters.trainingCourseId) {
      if (Array.isArray(filters.trainingCourseId)) {
        conditions.trainingCourseId = { in: filters.trainingCourseId }
      } else {
        conditions.trainingCourseId = filters.trainingCourseId
      }
    }

    if ((filters as any).isDayOff !== undefined && (filters as any).isDayOff !== null) {
      const isDayOffFilter = (filters as any).isDayOff
      if (Array.isArray(isDayOffFilter)) {
        conditions.isDayOff = { in: isDayOffFilter }
      } else {
        conditions.isDayOff = isDayOffFilter
      }
    }

    if (filters.startDate?.length === 2) {
      conditions.startDate = {
        gte: dayjs(filters.startDate[0], "DD/MM/YYYY").startOf("day").toDate(),
        lte: dayjs(filters.startDate[1], "DD/MM/YYYY").endOf("day").toDate(),
      }
    }

    if (filters.endDate?.length === 2) {
      conditions.endDate = {
        gte: dayjs(filters.endDate[0], "DD/MM/YYYY").startOf("day").toDate(),
        lte: dayjs(filters.endDate[1], "DD/MM/YYYY").endOf("day").toDate(),
      }
    }

    return conditions
  }, [filters, semesterStoreId, trainingObjectTypeId])

  const { data: dataTable = [] } = useFindManyPlanTrainingPractice(
    {
      where,
      include: {
        semester: true,
        trainingCourse: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: numberOfPages,
      skip: (currentPage - 1) * numberOfPages,
    },
    { enabled: !!trainingObjectTypeId }
  )

  const { data: count } = useCountPlanTrainingPractice(
    { where },
    { enabled: !!trainingObjectTypeId }
  )

  async function handleDeleteTrainingActivity(id: string) {
    try {
      showSpinner()
      await updatePlanTrainingPractice({
        where: { id },
        data: { deletedAt: new Date() },
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
    <Row gutter={[16, 0]}>
      <PutPlanTrainingPracticeModal />

      <Col span={24}>
        <Row gutter={[16, 16]} align="top" justify="space-between">
          <Col span={4} />
          <Col span={8}>
            <Flex justify="end">
              {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_HUAN_LUYEN, "THEM") && (
                <Button onClick={() => onOpen()} type="primary" className="ml-3">
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
          id="plan-training-practice"
          filters={filters}
          setFilters={(value) => {
            setFilters(value)
            setCurrentPage(1)
          }}
          columns={[
            {
              title: "STT",
              width: 50,
              align: "center",
              fixed: "left",
              render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
            },
            {
              title: "Tên kế hoạch",
              dataIndex: "name",
              align: "left",
              width: 220,
              fixed: "left",
              type: "input",
            },
            {
              title: "Khóa",
              align: "center",
              width: 140,
              dataIndex: "trainingCourseId",
              type: "select",
              options: trainingCourseData.map((item: TrainingCourse) => ({
                label: item.name,
                value: item.id,
              })),
              render: (__, record) => record?.trainingCourse?.name || "-",
            },
            {
              title: "Học kỳ",
              align: "center",
              width: 140,
              dataIndex: "semesterId",
              type: "select",
              options: semesterData.map((item: any) => ({
                label: item.name,
                value: item.id,
              })),
              render: (__, record) => record?.semester?.name || "-",
            },
            {
              title: "Ngày bắt đầu",
              align: "center",
              width: 130,
              dataIndex: "startDate",
              type: "date",
              render: (__, record) =>
                record?.startDate ? dayjs(record.startDate).format("DD/MM/YYYY") : "-",
            },
            {
              title: "Ngày kết thúc",
              align: "center",
              width: 130,
              dataIndex: "endDate",
              type: "date",
              render: (__, record) =>
                record?.endDate ? dayjs(record.endDate).format("DD/MM/YYYY") : "-",
            },
            {
              title: "Ngày nghỉ",
              align: "center",
              width: 110,
              dataIndex: "isDayOff",
              type: "select",
              options: [
                { label: "Có", value: true },
                { label: "Không", value: false },
              ],
              render: (__, record) => (record?.isDayOff ? "Có" : "Không"),
            },
            {
              title: "Mô tả",
              align: "left",
              width: 240,
              dataIndex: "description",
              type: "input",
              render: (__, record) => record?.description || "-",
            },
            {
              title: "Thao tác",
              width: 80,
              align: "center",
              fixed: "right",
              render: (_, record) =>
                can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_HUAN_LUYEN, "SUA") ||
                can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_HUAN_LUYEN, "XOA") ? (
                  <Row className="justify-center gap-2 flex items-center">
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_HUAN_LUYEN, "SUA") && (
                      <EditIcon
                        onClick={() => onOpen(record.id)}
                        className="text-sm text-green-700 cursor-pointer"
                      />
                    )}
                    {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_KE_HOACH_HUAN_LUYEN, "XOA") && (
                      <DeleteIcon
                        popConfirm={{
                          onConfirm: (e) => {
                            handleDeleteTrainingActivity(record?.id)
                            e?.stopPropagation()
                          },
                          onCancel: (e) => {
                            e?.stopPropagation()
                          },
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </Row>
                ) : null,
            },
          ]}
          data={dataTable}
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
            showTotal: (total, range) => `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
          }}
        />
      </Col>
    </Row>
  )
}

TrainingActivity.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
