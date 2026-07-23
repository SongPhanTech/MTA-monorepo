import { queryClient } from "@api/index"
import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { $Enums } from "@workspace/db/client"
import {
  useDeleteManyPlanTrainingSubject,
  useFindFirstPlanTraining,
  useFindUniqueSemester,
} from "@workspace/db/hooks"
import { exportFromTemplate } from "@workspace/libs/template-excel"
import { getMinioUrl } from "@workspace/libs/utils"
import { useSemesterStore, useTrainingCourseStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Flex, Form, Input, message, Popconfirm, Row } from "antd"
import _ from "lodash"
import { Search } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type MonDaLapKeHoachForm = {
  searchText: string | null
  subjectSelected?: Array<string>
}

export default function MonDaLapKeHoach({ type }: { type?: $Enums.SubjectClassType }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(300)
  const { id: semesterId } = useSemesterStore()
  const [form] = Form.useForm<MonDaLapKeHoachForm>()
  const searchText = Form.useWatch("searchText", form)
  const subjectSelected = Form.useWatch("subjectSelected", form) || []
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { id: trainingCourseId } = useTrainingCourseStore()
  const { onOpen: onOpenDetailSubject } = useDisclosure<{
    subjectVersionId?: string
  }>({
    tag: "ModalChiTietMonHoc",
  })
  const { onOpen: onOpenDetailFixedClass } = useDisclosure<{
    fixedClassId: string
  }>({
    tag: "ModalChiTietLopBienChe",
  })
  const { data: semesterData } = useFindUniqueSemester(
    {
      where: { id: semesterId },
      select: {
        id: true,
        name: true,
        schoolYear: {
          select: { id: true, name: true },
        },
      },
    },
    {
      enabled: !!semesterId,
    }
  )

  const { data: planTraining } = useFindFirstPlanTraining(
    {
      where: {
        semesterId: semesterId as string,
        trainingObjectTypeId,
        trainingCourseId,
      },
      include: {
        planTrainingSubjects: {
          take: numberOfPages,
          skip: (currentPage - 1) * numberOfPages,
          include: {
            trainingBlockSubject: {
              include: {
                subject: {
                  include: {
                    managementOrganization: {
                      select: {
                        sMa: true,
                      },
                    },
                  },
                },
                trainingBlockOnCurriculumVersion: {
                  include: {
                    curriculumVersion: {
                      include: {
                        fixedClass: {
                          include: {
                            _count: {
                              select: {
                                students: {
                                  where: {
                                    active: true,
                                    status: "ENROLLED",
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
            },
          },
          where: {
            trainingBlockSubject: {
              subject: searchText
                ? {
                    name: {
                      contains: searchText,
                      mode: "insensitive",
                    },
                  }
                : {},
            },
            subjectClassType: type,
          },
          orderBy: {
            trainingBlockSubject: {
              subject: {
                code: "asc",
              },
            },
          },
        },
        _count: {
          select: {
            planTrainingSubjects: {
              where: {
                deletedAt: null,
                active: true,
                subjectClassType: type,
              },
            },
          },
        },
      },
    },
    { enabled: !!semesterId && !!trainingObjectTypeId }
  )

  const { onOpen: openKhoiTaoMon } = useDisclosure<{
    type?: $Enums.SubjectClassType
  }>({
    tag: "KhoiTaoMon",
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: deleteManyPlanTrainingSubject } = useDeleteManyPlanTrainingSubject()

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/subject-class/open-subject-class"] })
      queryClient.invalidateQueries({ queryKey: ["zenstack", "PlanTraining"] })
      queryClient.invalidateQueries({ queryKey: ["zenstack", "SubjectClass"] })
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "PlanTrainingSubject"],
      })
      queryClient.invalidateQueries({
        queryKey: [
          type === $Enums.SubjectClassType.RETAKE
            ? "/api/subject-class/open-subject-class-retake"
            : "/api/subject-class/open-subject-class-reexam",
        ],
      })
    }, 500),
    []
  )

  const processedData = useMemo(() => {
    const rawData = planTraining?.planTrainingSubjects ?? []
    const grouped = new Map<string, typeof rawData>()
    rawData.forEach((item) => {
      const key = item.trainingBlockSubject?.subject?.id || item.trainingBlockSubjectId || ""
      if (!grouped.has(key)) grouped.set(key, [])
      const group = grouped.get(key)
      if (group) group.push(item)
    })
    const result: Array<(typeof rawData)[number] & { rowSpan: number }> = []
    grouped.forEach((items) => {
      items.forEach((item, index) => {
        result.push({ ...item, rowSpan: index === 0 ? items.length : 0 })
      })
    })
    return result
  }, [planTraining?.planTrainingSubjects])

  return (
    <Form
      className="w-full"
      form={form}
      onValuesChange={(filter: MonDaLapKeHoachForm) => {
        if (!filter.subjectSelected) {
          debouncedRefetch()
        }
      }}
    >
      <Row align="top" justify="space-between">
        <Col span={10}>
          <Form.Item className="m-0" name="searchText">
            <Input
              id="search"
              placeholder="Nhập tên môn..."
              style={{ height: 32 }}
              prefix={
                <Search
                  size={15}
                  style={{
                    color: "rgba(0, 0, 0, 0.25)",
                  }}
                />
              }
              allowClear
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Flex justify="end" gap={4}>
            <Button
              onClick={() =>
                openKhoiTaoMon({
                  type,
                })
              }
              type="default"
            >
              Bổ sung môn
            </Button>
            <Button
              type="primary"
              onClick={() =>
                exportFromTemplate({
                  templateUrl: getMinioUrl("/mta/template/ke-hoach-dao-tao/ke-hoach-mo-lop.xlsx"),
                  sheets: [
                    {
                      sheet: "KeHoachMoLop",
                      data: {
                        hoc_ky: semesterData?.name ?? "",
                        nam_hoc: semesterData?.schoolYear?.name ?? "",
                      },
                      tableStartCell: { row: 7, col: 1 },
                      rows:
                        planTraining?.planTrainingSubjects.map((item, index) => {
                          const fc =
                            item?.trainingBlockSubject?.trainingBlockOnCurriculumVersion
                              ?.curriculumVersion?.fixedClass
                          const rowSpan = 1
                          return {
                            cells: [
                              {
                                value: index + 1,
                                align: "center",
                                rowSpan,
                              },
                              {
                                value: item.trainingBlockSubject?.subject?.code ?? "",
                                align: "center",
                                rowSpan,
                              },
                              {
                                value: item.trainingBlockSubject?.subject?.name ?? "",
                                rowSpan,
                              },
                              {
                                value: item.trainingBlockSubject?.subject?.credit ?? "",
                                align: "center",
                                rowSpan,
                              },
                              {
                                value: `${fc?.code}`,
                                align: "center",
                              },
                              {
                                value: `${fc?._count.students ?? 0}`,
                                align: "center",
                              },
                              {
                                value: item.studentCount,
                                align: "center",
                                rowSpan,
                              },
                              {
                                value:
                                  item?.trainingBlockSubject?.trainingBlockOnCurriculumVersion
                                    .curriculumVersion?.fixedClass?._count?.students ?? 0,
                                align: "center",
                                rowSpan,
                              },
                              {
                                value:
                                  item?.trainingBlockSubject?.subject?.managementOrganization
                                    ?.sMa ?? "",
                                align: "center",
                                rowSpan,
                              },
                            ],
                          }
                        }) ?? ([] as any[]),
                    },
                  ],
                  fileName: `ke-hoach-mo-lop-mon-hoc-${semesterData?.name}-${semesterData?.schoolYear.name}.xlsx`,
                })
              }
            >
              Xuất kế hoạch
            </Button>
            <Popconfirm
              title="Bạn có chắc chắn xoá các môn đã lập kế hoạch đã chọn?"
              onConfirm={async () => {
                try {
                  showSpinner()
                  await deleteManyPlanTrainingSubject({
                    where: {
                      trainingBlockSubjectId: { in: subjectSelected },
                      subjectClassType: type,
                    },
                  })
                  debouncedRefetch()
                  message.success("Xoá môn đã lập kế hoạch thành công")
                  form.resetFields()
                } catch (error) {
                  console.log(error)
                  message.error("Xoá môn đã lập kế hoạch thất bại")
                }
                hideSpinner()
              }}
            >
              <Button disabled={!subjectSelected.length} type="primary" danger>
                Đưa môn ra khỏi KHDK
              </Button>
            </Popconfirm>
          </Flex>
        </Col>
        <Form.Item hidden name="subjectSelected" />
        <Table
          rowKey="trainingBlockSubjectId"
          scrollable
          maxHeight={"calc(100vh - 390px)"}
          rowSelection={{
            selectedRowKeys: subjectSelected,
            onChange: (selectedRowKeys) => {
              form.setFieldValue("subjectSelected", selectedRowKeys)
            },
            type: "checkbox",
            checkStrictly: true,
            columnWidth: 35,
          }}
          onRow={(record) => {
            return {
              onClick: () => {
                const isSelected = subjectSelected.includes(record.trainingBlockSubjectId)
                if (isSelected) {
                  form.setFieldValue(
                    "subjectSelected",
                    subjectSelected.filter((id) => id !== record.trainingBlockSubjectId)
                  )
                } else {
                  form.setFieldValue("subjectSelected", [
                    ...subjectSelected,
                    record.trainingBlockSubjectId,
                  ])
                }
              },
            }
          }}
          data={processedData}
          columns={[
            {
              title: "TT",
              width: 80,
              align: "center",
              render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
            },
            {
              title: "Mã MH",
              align: "center",
              width: 80,
              onCell: (record) => ({ rowSpan: record.rowSpan }),
              render: (_, record) => record?.trainingBlockSubject?.subject?.code,
            },
            {
              title: "Tên môn",
              width: 120,
              align: "center",
              onCell: (record) => ({ rowSpan: record.rowSpan }),
              render: (_, record) => (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenDetailSubject({
                      subjectVersionId: record.trainingBlockSubject?.subject?.id,
                    })
                  }}
                  className="text-left hover:text-primary cursor-pointer"
                >
                  {record?.trainingBlockSubject?.subject?.name} (
                  {record?.trainingBlockSubject?.subject?.credit} TC)
                </div>
              ),
            },
            {
              title: "Lớp",
              width: 120,
              align: "center",
              render: (_, record) => (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenDetailFixedClass({
                      fixedClassId: record?.trainingBlockSubject?.trainingBlockOnCurriculumVersion
                        ?.curriculumVersion?.fixedClass?.id as string,
                    })
                  }}
                  className="text-left hover:text-primary cursor-pointer"
                >
                  {record?.trainingBlockSubject?.trainingBlockOnCurriculumVersion?.curriculumVersion
                    ?.fixedClass?.code || ""}
                </div>
              ),
            },
          ]}
          pagination={false}
        />
      </Row>
    </Form>
  )
}
