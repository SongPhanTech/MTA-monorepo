import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import type { FilterProps } from "@constants/type"
import DefaultLayout from "@layouts/default-layout"
import type { FixedClass, TrainingCourse } from "@workspace/db/client"
import {
  useCountTrainingActivity,
  useFindManyFixedClass,
  useFindManyTrainingActivity,
  useFindManyTrainingCourse,
  useFindManyTrainingField,
  useFindManyTrainingMajor,
  useUpdateTrainingActivity,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Flex, Row, Tooltip, message } from "antd"
import EditIcon from "../../../../../dang-ky-hoc/src/components/icons/edit"
import type React from "react"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import PutTrainingActivityModal from "../../../components/modal/put-training-activity"
import DeleteIcon from "@components/icons/delete"
import useSpinner from "@hooks/spinner"

export default function TrainingActivity() {
  const { can } = useAbility()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const { showSpinner, hideSpinner } = useSpinner()

  const [filters, setFilters] = useState<FilterProps>({
    name: "",
    count: undefined,
    trainingCourseId: undefined,
    fixedClassId: undefined,
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

  const { data: fixedClassData = [] } = useFindManyFixedClass(
    {
      where: {
        trainingCourse: {
          trainingObjectTypeId,
          deletedAt: null,
          active: true,
          ...(filters.trainingCourseId ? { id: filters.trainingCourseId } : {}),
        },
      },
      include: {
        trainingCourse: true,
      },
    },
    { enabled: !!trainingObjectTypeId }
  )

  const { data: trainingFieldData = [] } = useFindManyTrainingField()
  const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
    orderBy: { name: "asc" },
  })

  const { onOpen } = useDisclosure<string>({
    tag: "PutTrainingActivityModal",
  })

  const { mutateAsync: updateTrainingActivity } = useUpdateTrainingActivity()

  const where = useMemo(() => {
    const conditions: any = {
      deletedAt: null,
    }

    const studentCondition: any = {}

    if (filters.name) {
      studentCondition.userProfile = {
        fullname: {
          contains: filters.name,
          mode: "insensitive" as const,
        },
      }
    }

    if ((filters as any).code) {
      studentCondition.userProfile = {
        ...studentCondition.userProfile,
        code: {
          contains: (filters as any).code,
          mode: "insensitive" as const,
        },
      }
    }

    if ((filters as any).phone) {
      studentCondition.userProfile = {
        ...studentCondition.userProfile,
        phoneNumber: {
          contains: (filters as any).phone,
          mode: "insensitive" as const,
        },
      }
    }

    const fixedClassCondition: any = {}

    const hasValue = (val: any) => {
      if (Array.isArray(val)) return val.length > 0
      return val !== undefined && val !== null && val !== ""
    }

    if (hasValue(filters.trainingCourseId)) {
      if (Array.isArray(filters.trainingCourseId)) {
        fixedClassCondition.trainingCourseId = { in: filters.trainingCourseId }
      } else {
        fixedClassCondition.trainingCourseId = filters.trainingCourseId
      }
    } else {
      fixedClassCondition.trainingCourse = {
        trainingObjectTypeId,
        deletedAt: null,
        active: true,
      }
    }

    if (hasValue((filters as any).trainingMajorId)) {
      const val = (filters as any).trainingMajorId
      fixedClassCondition.curriculumVersion = {
        curriculum: {
          trainingMajorId: Array.isArray(val) ? { in: val } : val,
        },
      }
    }

    if (hasValue((filters as any).trainingFieldId)) {
      const val = (filters as any).trainingFieldId
      fixedClassCondition.curriculumVersion = {
        ...fixedClassCondition.curriculumVersion,
        curriculum: {
          ...fixedClassCondition.curriculumVersion?.curriculum,
          trainingMajor: {
            trainingFieldId: Array.isArray(val) ? { in: val } : val,
          },
        },
      }
    }

    if (hasValue(filters.fixedClassId)) {
      if (Array.isArray(filters.fixedClassId)) {
        studentCondition.fixedClassId = { in: filters.fixedClassId }
      } else {
        studentCondition.fixedClassId = filters.fixedClassId
      }
    }

    if (Object.keys(fixedClassCondition).length > 0) {
      studentCondition.fixedClass = fixedClassCondition
    }

    if (Object.keys(studentCondition).length > 0) {
      conditions.student = studentCondition
    }

    return conditions
  }, [filters, trainingObjectTypeId])

  const { data: dataTable = [] } = useFindManyTrainingActivity({
    where,
    include: {
      student: {
        include: {
          userProfile: {
            include: { rank: true },
          },
          fixedClass: {
            include: {
              trainingCourse: {
                include: {
                  trainingObjectType: true,
                },
              },
              curriculumVersion: {
                include: {
                  curriculum: {
                    include: {
                      trainingMajor: {
                        include: {
                          trainingField: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: numberOfPages,
    skip: (currentPage - 1) * numberOfPages,
  })

  const { data: count } = useCountTrainingActivity({ where })

  async function handleDeleteTrainingActivity(id: string) {
    try {
      showSpinner()
      await updateTrainingActivity({
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
      <Col span={24}>
        <PutTrainingActivityModal />
        <Row gutter={[16, 16]} align="top" justify="space-between">
          <Col span={4} />
          <Col span={8}>
            <Flex justify="end">
              {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QUA_TRINH_REN_LUYEN, "THEM") && (
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
          id="training-category"
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
              title: "Mã học viên",
              dataIndex: "code",
              align: "center",
              width: 130,
              fixed: "left",
              type: "input",
              render: (__, record) => record?.student?.userProfile?.code,
            },
            {
              title: "Họ và tên",
              dataIndex: "name",
              align: "center",
              width: 180,
              fixed: "left",
              type: "input",
              render: (__, record) => `${record?.student?.userProfile?.fullname || ""}`.trim(),
            },
            {
              title: "SĐT",
              align: "center",
              width: 120,
              dataIndex: "phone",
              type: "input",
              render: (__, record) => record?.student?.userProfile?.phoneNumber || "",
            },
            {
              title: "Lớp",
              align: "center",
              width: 120,
              dataIndex: "fixedClassId",
              type: "select",
              options: fixedClassData.map((item: FixedClass) => ({
                label: item.name,
                value: item.id,
              })),
              render: (__, record) => {
                const fixedClass = record?.student?.fixedClass
                if (!fixedClass) return "-"
                return <Tooltip title={fixedClass?.name}>{fixedClass?.code}</Tooltip>
              },
            },
            {
              title: "Khóa",
              align: "center",
              width: 100,
              dataIndex: "trainingCourseId",
              type: "select",
              options: trainingCourseData.map((item: TrainingCourse) => ({
                label: item.name,
                value: item.id,
              })),
              render: (__, record) => record?.student?.fixedClass?.trainingCourse?.name || "-",
            },
            {
              title: "Ngành",
              align: "center",
              width: 160,
              dataIndex: "trainingFieldId",
              type: "select",
              options: trainingFieldData.map((item: any) => ({
                label: item.name,
                value: item.id,
              })),
              render: (__, record) =>
                record?.student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
                  ?.trainingField?.name || "-",
            },
            {
              title: "Chuyên ngành",
              align: "center",
              width: 180,
              dataIndex: "trainingMajorId",
              type: "select",
              options: trainingMajorData.map((item: any) => ({
                label: item.name,
                value: item.id,
              })),
              render: (__, record) =>
                record?.student?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name ||
                "-",
            },
            {
              title: "Loại rèn luyện",
              align: "center",
              width: 180,
              dataIndex: "category",
              type: "input",
              render: (__, record) => record?.category || "-",
            },
            {
              title: "Điểm",
              align: "center",
              width: 90,
              render: (__, record) => record?.score ?? "-",
            },
            {
              title: "Ngày rèn luyện",
              align: "center",
              width: 120,
              render: (__, record) =>
                record?.date ? new Date(record.date).toLocaleDateString("vi-VN") : "-",
            },
            {
              title: "Mô tả",
              align: "left",
              width: 240,
              render: (__, record) => record?.description || "-",
            },
            {
              title: "Thao tác",
              width: 80,
              align: "center",
              fixed: "right",
              render: (_, record) => (
                <Row className="justify-center gap-2 flex items-center">
                  {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QUA_TRINH_REN_LUYEN, "SUA") && (
                    <EditIcon
                      onClick={() => onOpen(record.id)}
                      className="text-sm text-green-700 cursor-pointer"
                    />
                  )}
                  {can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_DANH_MUC_QUA_TRINH_REN_LUYEN, "XOA") && (
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
              ),
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
