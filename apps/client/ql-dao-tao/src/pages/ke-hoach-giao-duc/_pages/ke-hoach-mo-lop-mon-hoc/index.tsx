import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import Table from "@components/commons/table"
import TextTruncate from "@components/commons/text-truncate"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import DefaultLayout from "@layouts/default-layout"
import { $Enums, type Prisma } from "@workspace/db/client"
import { useFindManySubjectVersion } from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { useSemesterStore, useTrainingCourseStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { cn } from "@workspace/ui/lib/utils"
import { Button, Col, Flex, Form, Input, InputNumber, message, Popover, Row, Switch } from "antd"
import _ from "lodash"
import type React from "react"
import { useCallback, useEffect, useState } from "react"

type OpenSubjectClassForm = {
  searchText?: string
  trainingCourseId?: string
  trainingMajorId?: string
  subjectVersions?: Record<
    string,
    {
      count: number
      name: string | null
      code: string | null
      maxStudent: number
      isEdit?: boolean
      examType: $Enums.ExamType
    }
  >
  // SubjectVersionId -> SubjectClassId
}

type MoLMHNhanhForm = {
  count: number
  isOverride: boolean
}

export default function KeHoachMoLopMonHoc({ type }: { type?: $Enums.SubjectClassType }) {
  const [form] = Form.useForm<OpenSubjectClassForm>()
  const [formMoLMHNhanh] = Form.useForm<MoLMHNhanhForm>()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)
  const { id: semesterId } = useSemesterStore()

  const searchText = Form.useWatch("searchText", form)
  const { id: trainingCourseId } = useTrainingCourseStore()
  const subjectVersions = Form.useWatch("subjectVersions", form) || {}
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { data: subjects, refetch } = useFindManySubjectVersion({
    where: {
      trainingBlocks: {
        some: {
          planTrainingSubjects: {
            some: {
              planTraining: {
                semesterId,
                trainingObjectTypeId,
                trainingCourseId,
              },
              subjectClassType: type,
            },
          },
        },
      },
      ...(searchText
        ? {
            OR: [
              {
                name: { contains: searchText, mode: "insensitive" },
              },
              {
                code: { contains: searchText, mode: "insensitive" },
              },
            ],
          }
        : {}),
    },
    include: {
      trainingBlocks: {
        where: {
          planTrainingSubjects: {
            some: {
              planTraining: {
                semesterId,
                trainingObjectTypeId,
                trainingCourseId,
              },
              subjectClassType: type,
            },
          },
        },
        select: {
          planTrainingSubjects: {
            select: {
              studentCount: true,
            },
          },
          trainingBlockOnCurriculumVersion: {
            select: {
              curriculumVersion: {
                select: {
                  fixedClasses: {
                    select: {
                      id: true,
                      code: true,
                      _count: {
                        select: {
                          students: {
                            where: {
                              deletedAt: null,
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
      studentSubjectScore: {
        where: {
          active: true,
          deletedAt: null,
          student: {
            active: true,
            deletedAt: null,
            status: "ENROLLED",
          },
        },
        select: {
          student: {
            select: {
              fixedClassId: true,
            },
          },
        },
      },
      subjectClass: {
        where: {
          semesterId,
          trainingObjectTypeId,
          type: type,
        },
        select: {
          id: true,
          code: true,
          maxStudent: true,
          _count: { select: { subjectClassStudent: true } },
          subjectClassStudent: {
            select: {
              student: {
                select: {
                  fixedClassId: true,
                },
              },
            },
          },
          mainLecturer: {
            select: { id: true },
          },
        },
      },
      subject: {
        select: {
          managementOrganization: {
            select: {
              sMa: true,
            },
          },
        },
      },
    },
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: <skip function>
  useEffect(() => {
    if (subjects) {
      resetData()
    }
  }, [subjects])

  const resetData = () => {
    if (!subjects) return
    form.setFieldValue(
      "subjectVersions",
      subjects.reduce(
        (acc, cur) => {
          if (!acc) {
            return {}
          }
          acc[cur.id] = {
            count: cur.subjectClass.length ?? 0,
            name: cur.name,
            code: cur?.code,
            maxStudent:
              cur.subjectClass?.[0]?.maxStudent ??
              cur.trainingBlocks?.[0]?.planTrainingSubjects?.[0]?.studentCount,
            isEdit: false,
            examType: cur.examType,
          }
          return acc
        },
        {} as OpenSubjectClassForm["subjectVersions"]
      )
    )
  }

  const debouncedRefetch = useCallback(
    _.debounce(() => {
      refetch()
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "DM_DonVi"],
      })
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "SubjectVersion"],
      })
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "SubjectClass"],
      })
    }, 500),
    []
  )

  const { hideSpinner, showSpinner } = useSpinner()

  return (
    <div>
      <Row gutter={[0, 0]}>
        <Form
          className="w-full"
          form={form}
          onValuesChange={(filter: OpenSubjectClassForm) => {
            if (!filter.subjectVersions) {
              debouncedRefetch()
            } else {
              const subjectVersionId = Object.keys(filter.subjectVersions || {})?.[0]
              if (subjectVersionId)
                form.setFieldValue("subjectVersions", {
                  ...subjectVersions,
                  [subjectVersionId]: {
                    ...subjectVersions[subjectVersionId],
                    ...filter.subjectVersions[subjectVersionId],
                    isEdit: true,
                  },
                })
            }
          }}
        >
          <Row gutter={[0, 0]}>
            <Col span={12}>
              <Flex gap={4}>
                <Col span={8}>
                  <Form.Item className="m-0" name="searchText">
                    <Input id="search" placeholder="Tìm kiếm" allowClear />
                  </Form.Item>
                </Col>
              </Flex>
            </Col>
            <Col span={12}>
              <Flex justify="end" gap={4}>
                <Popover
                  content={
                    <Form
                      form={formMoLMHNhanh}
                      initialValues={{ isOverride: false }}
                      onFinish={async (values: MoLMHNhanhForm) => {
                        try {
                          if (!semesterId || !trainingObjectTypeId) return
                          showSpinner()
                          const resList = await sqlTransaction([
                            ...(values.isOverride
                              ? [
                                  {
                                    model: "SubjectClass" as const,
                                    operation: "deleteMany",
                                    data: {
                                      where: {
                                        semesterId,
                                        trainingObjectTypeId,
                                        status: "DRAFT",
                                        cancelled: false,
                                        type: type,
                                        subjectClassStudent: {
                                          none: {},
                                        },
                                      },
                                    },
                                  },
                                ]
                              : []),
                            {
                              model: "PlanTraining",
                              operation: "findFirst",
                              data: {
                                where: {
                                  semesterId,
                                  trainingObjectTypeId,
                                  trainingCourseId,
                                  planTrainingSubjects: {
                                    some: {
                                      subjectClassType: type,
                                    },
                                  },
                                },
                                select: {
                                  planTrainingSubjects: {
                                    select: {
                                      trainingBlockSubject: {
                                        select: {
                                          subject: {
                                            select: {
                                              id: true,
                                              code: true,
                                              name: true,
                                              examType: true,
                                            },
                                          },
                                        },
                                      },
                                    },
                                    where: {
                                      subjectClassType: type,
                                    },
                                  },
                                },
                              },
                            },
                            {
                              model: "SubjectClass",
                              operation: "findMany",
                              data: {
                                where: {
                                  semesterId,
                                  trainingObjectTypeId,
                                  status: "DRAFT",
                                  cancelled: false,
                                  type: type,
                                },
                              },
                            },
                          ])
                          if (resList.status !== 200) {
                            throw new Error("Lỗi khi lấy dữ liệu")
                          }

                          const listSubjectVersionIds = (
                            values.isOverride ? resList.data[1] : resList.data[0]
                          ) as Prisma.PlanTrainingGetPayload<{
                            select: {
                              planTrainingSubjects: {
                                select: {
                                  trainingBlockSubject: {
                                    select: {
                                      subject: {
                                        select: {
                                          id: true
                                          code: true
                                          name: true
                                          examType: true
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }>

                          const alreadySubjectIds = (
                            values.isOverride ? resList.data[2] : resList.data[1]
                          ) as Prisma.SubjectClassGetPayload<{}>[]

                          const protectedCountBySubjectId = values.isOverride
                            ? alreadySubjectIds.reduce(
                                (acc, asc) => {
                                  const subjectId = asc?.subjectId
                                  if (!subjectId) return acc
                                  acc[subjectId] = (acc[subjectId] ?? 0) + 1
                                  return acc
                                },
                                {} as Record<string, number>
                              )
                            : {}

                          const createOps = values.isOverride
                            ? Object.values(
                                Object.groupBy(
                                  listSubjectVersionIds.planTrainingSubjects.filter(
                                    (pts) => !!pts?.trainingBlockSubject?.subject?.id
                                  ),
                                  (pts) => pts?.trainingBlockSubject?.subject?.id ?? ""
                                )
                              ).flatMap((group) => {
                                const first = group?.[0]
                                const subjectId = first?.trainingBlockSubject?.subject?.id
                                if (!subjectId) return []
                                const existingCount = protectedCountBySubjectId?.[subjectId] ?? 0
                                const toCreate = Math.max(0, values.count - existingCount)
                                if (toCreate <= 0) return []

                                const subjectCode = first?.trainingBlockSubject?.subject?.code ?? ""
                                const subjectName = first?.trainingBlockSubject?.subject?.name

                                return new Array(toCreate).fill(1).map((_, idx) => ({
                                  model: "SubjectClass" as const,
                                  operation: "create",
                                  data: {
                                    data: {
                                      semesterId,
                                      trainingObjectTypeId,
                                      type: type,
                                      subjectId,
                                      code: `${subjectCode} ${String(existingCount + idx + 1)}`,
                                      name: subjectName,
                                      examType: subjectVersions?.[subjectId]?.examType,
                                      maxStudent: subjectVersions?.[subjectId]?.maxStudent || 0,
                                    },
                                  },
                                }))
                              })
                            : Object.values(
                                Object.groupBy(
                                  listSubjectVersionIds.planTrainingSubjects.filter(
                                    (pts) =>
                                      !alreadySubjectIds.some(
                                        (asc) =>
                                          asc.subjectId === pts?.trainingBlockSubject?.subject?.id
                                      )
                                  ),
                                  (item) => item?.trainingBlockSubject?.subject?.code ?? ""
                                )
                              )
                                .map((e) => e?.[0])
                                .flatMap((e) =>
                                  new Array(values.count).fill(1).map((_, idx) => ({
                                    model: "SubjectClass" as const,
                                    operation: "create",
                                    data: {
                                      data: {
                                        semesterId,
                                        trainingObjectTypeId,
                                        type: type,
                                        subjectId: e?.trainingBlockSubject?.subject?.id,
                                        code: `${e?.trainingBlockSubject?.subject?.code} ${String(idx + 1)}`,
                                        name: e?.trainingBlockSubject?.subject?.name,
                                        examType: e?.trainingBlockSubject?.subject?.examType,
                                        maxStudent:
                                          subjectVersions?.[
                                            e?.trainingBlockSubject?.subject?.id ?? ""
                                          ]?.maxStudent || 0,
                                      },
                                    },
                                  }))
                                )

                          const res = await sqlTransaction(createOps)
                          if (res.status !== 200) {
                            throw new Error("Lỗi khi mở LMH")
                          }
                          debouncedRefetch()
                          message.success("Mở LMH thành công")
                        } catch (error: any) {
                          message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
                        } finally {
                          hideSpinner()
                        }
                      }}
                    >
                      <FormItem form={formMoLMHNhanh} name={"count"} required label="Số LMH">
                        <InputNumber min={0} />
                      </FormItem>
                      <FormItem
                        form={formMoLMHNhanh}
                        name={"isOverride"}
                        label="Ghi đè LMH đã mở"
                        className="mt-2"
                      >
                        <Switch />
                      </FormItem>
                      <Col span={24} className="text-right mt-4">
                        <Button type="primary" htmlType="submit">
                          Mở LMH
                        </Button>
                      </Col>
                    </Form>
                  }
                  title="Mở LMH nhanh"
                  trigger="click"
                  placement="bottomRight"
                >
                  <Button type={"dashed"}>Mở LMH (nhanh)</Button>
                </Popover>
                <Button
                  onClick={async () => {
                    try {
                      if (!semesterId || !trainingObjectTypeId) return
                      showSpinner()
                      const values = await form.validateFields()
                      const subjectIds = Object.entries(values.subjectVersions || {})
                        .filter(([_, v]) => v.isEdit)
                        .map(([k, _]) => k)

                      const protectedCountBySubjectId: Record<string, number> = subjectIds.reduce(
                        (acc, subjectId) => {
                          const subjectVersion = subjects?.find((s) => s.id === subjectId)
                          const protectedCount =
                            subjectVersion?.subjectClass?.filter(
                              (sc) => (sc?._count?.subjectClassStudent ?? 0) > 0 || sc.mainLecturer
                            ).length ?? 0
                          acc[subjectId] = protectedCount
                          return acc
                        },
                        {} as Record<string, number>
                      )

                      const res = await sqlTransaction([
                        // Cập nhật maxStudent/examType cho LMH đã mở (kể cả OFFICIAL)
                        ...Object.entries(values.subjectVersions || {})
                          .filter(([_, v]) => v.isEdit)
                          .map(([subjectId, v]) => ({
                            model: "SubjectClass" as const,
                            operation: "updateMany" as const,
                            data: {
                              where: {
                                semesterId,
                                trainingObjectTypeId,
                                type: type,
                                subjectId,
                                cancelled: false,
                              },
                              data: {
                                maxStudent: v.maxStudent || 0,
                                examType: v.examType,
                              },
                            },
                          })),
                        {
                          model: "SubjectClass" as const,
                          operation: "deleteMany",
                          data: {
                            where: {
                              semesterId,
                              trainingObjectTypeId,
                              status: "DRAFT",
                              cancelled: false,
                              type: type,
                              subjectClassStudent: { none: {} },
                              subjectId: {
                                in: subjectIds,
                              },
                            },
                          },
                        },
                        ...Object.entries(values.subjectVersions || {})
                          .filter(([_, v]) => v.isEdit)
                          .flatMap(([subjectId, v]) => {
                            const existingCount = protectedCountBySubjectId?.[subjectId] ?? 0
                            const toCreate = Math.max(0, v.count - existingCount)
                            return new Array(toCreate).fill(1).map((_, idx) => ({
                              model: "SubjectClass" as const,
                              operation: "create",
                              data: {
                                data: {
                                  semesterId,
                                  trainingObjectTypeId,
                                  type: type,
                                  subjectId,
                                  code: `${v.code} ${String(existingCount + idx + 1)}`,
                                  name: v.name,
                                  maxStudent: v.maxStudent || 0,
                                  examType: v.examType,
                                },
                              },
                            }))
                          }),
                      ])
                      if (res.status !== 200) {
                        throw new Error("Lỗi khi mở LMH")
                      }
                      debouncedRefetch()
                      message.success("Lưu thành công")
                    } catch (error: any) {
                      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
                    } finally {
                      hideSpinner()
                    }
                  }}
                  type={"primary"}
                >
                  Lưu
                </Button>
                <Button
                  onClick={() => {
                    resetData()
                  }}
                  type={"primary"}
                  danger
                >
                  Huỷ
                </Button>
              </Flex>
            </Col>
          </Row>
          <Form.Item name="subjectVersions" hidden />
          <Col span={24}>
            <Table
              rowKey="id"
              data={subjects}
              onRow={(record) => {
                return {
                  className: cn(
                    subjectVersions?.[record.id]?.count === 0 && "bg-red-100",
                    subjectVersions?.[record.id]?.isEdit && "bg-yellow-100"
                  ),
                }
              }}
              columns={[
                {
                  title: "TT",
                  width: 35,
                  align: "center",
                  render: (_, __, index) => index + 1 + (currentPage - 1) * numberOfPages,
                },
                {
                  title: "Mã MH",
                  align: "center",
                  width: 100,
                  render: (_, record) => {
                    return record?.code || ""
                  },
                },
                {
                  title: "Tên môn học",
                  align: "center",
                  render: (_, record) => {
                    return (
                      <div className="text-left">
                        {`${record?.name} (${record?.credit} TC)` || ""}
                      </div>
                    )
                  },
                },
                {
                  title: "Danh sách lớp quản lý",
                  dataIndex: "fixedClass",
                  align: "center",
                  hidden: type !== $Enums.SubjectClassType.NORMAL,
                  render: (__, record) => {
                    const fixedClasses = record?.trainingBlocks?.flatMap(
                      // @ts-expect-error
                      (block) =>
                        block?.trainingBlockOnCurriculumVersion?.curriculumVersion?.fixedClasses ??
                        []
                    )

                    return (
                      <TextTruncate
                        arr={fixedClasses.map((i: any) => {
                          const count =
                            record?.studentSubjectScore?.filter(
                              (sss: any) => sss?.student?.fixedClassId === i?.id
                            )?.length || 0
                          return {
                            key: i?.id,
                            label: `${i?.code} (${count || 0} SV)`,
                          }
                        })}
                        key="fixedClass"
                      />
                    )
                  },
                },
                ...(type === $Enums.SubjectClassType.NORMAL
                  ? [
                      {
                        title: "Tổng SV",
                        width: 80,
                        align: "center" as const,
                        render: (_: any, record: any) => {
                          return (
                            record?.subjectClass?.reduce(
                              (sum: number, sc: any) =>
                                sum + (sc?._count?.subjectClassStudent ?? 0),
                              0
                            ) || 0
                          )
                        },
                      },
                    ]
                  : []),
                {
                  title: "Đơn vị phụ trách",
                  width: 150,
                  align: "center",
                  render: (_, record) => record?.subject?.managementOrganization?.sMa || "",
                },
                {
                  title: "Số LMH",
                  width: 150,
                  align: "center",
                  render: (_, record, idx) => (
                    <>
                      <Form.Item
                        name={["subjectVersions", record?.id, "count"]}
                        className={"m-0"}
                        required
                      >
                        <InputNumber
                          step={0}
                          id={`subjectClassCount-${record?.id}`}
                          controls={false}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                              e.preventDefault()
                              e.stopPropagation()
                              if (!subjects) return
                              const nextId = subjects[idx + (e.key === "ArrowUp" ? -1 : 1)]?.id
                              document.getElementById(`subjectClassCount-${nextId}`)?.focus()
                              return
                              // Handle the logic for ArrowUp key press
                            }

                            const allowedKeys = [
                              "Backspace",
                              "Delete",
                              "ArrowLeft",
                              "ArrowRight",
                              "Tab",
                              "Meta",
                              "Control",
                            ]
                            if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key)) {
                              e.preventDefault()
                            }
                          }}
                        />
                      </Form.Item>
                    </>
                  ),
                },
                {
                  title: "Số SV tối đa / LMH",
                  width: 150,
                  align: "center",
                  render: (_, record, idx) => (
                    <>
                      <Form.Item
                        name={["subjectVersions", record?.id, "maxStudent"]}
                        required
                        className={"m-0"}
                      >
                        <InputNumber
                          step={0}
                          id={`svmax-${record?.id}`}
                          controls={false}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                              e.preventDefault()
                              e.stopPropagation()
                              if (!subjects) return
                              const nextId = subjects[idx + (e.key === "ArrowUp" ? -1 : 1)]?.id
                              document.getElementById(`svmax-${nextId}`)?.focus()
                              return
                              // Handle the logic for ArrowUp key press
                            }

                            const allowedKeys = [
                              "Backspace",
                              "Delete",
                              "ArrowLeft",
                              "ArrowRight",
                              "Tab",
                              "Meta",
                              "Control",
                            ]
                            if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key)) {
                              e.preventDefault()
                            }
                          }}
                        />
                      </Form.Item>
                    </>
                  ),
                },
              ]}
              pagination={{
                current: currentPage,
                pageSize: numberOfPages,
                // total: res?._count?.planTrainingSubjects ?? 0,
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
        </Form>
      </Row>
    </div>
  )
}

KeHoachMoLopMonHoc.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
