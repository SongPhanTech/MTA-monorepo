import { queryClient } from "@api/index"
import Table from "@components/commons/table"
import TextTruncate from "@components/commons/text-truncate"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import useSpinner from "@hooks/spinner"
import { $Enums, type PlanTraining } from "@workspace/db/client"
import { sqlTransaction } from "@workspace/libs/api/model"
import { useAbility } from "@workspace/permissions/hooks"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Flex, Form, Input, message, Row } from "antd"
import _ from "lodash"
import { useCallback, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

interface SubjectBySemesterForm {
  searchText?: string
  trainingCourseId?: string
  trainingMajorId?: string
  subjectDelaySelected?: Array<string>
}

export default function MonCham() {
  const { canSome } = useAbility()
  const [form] = Form.useForm<SubjectBySemesterForm>()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(100)
  const { id: semesterId } = useSemesterStore()
  const searchText = Form.useWatch("searchText", form)
  const trainingCourseId = Form.useWatch("trainingCourseId", form)
  const trainingMajorId = Form.useWatch("trainingMajorId", form)
  const subjectDelaySelected = Form.useWatch("subjectDelaySelected", form) || []

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const planTrainingDelayData = {
    id: "",
    planTrainingDelaySubjects: [] as any[],
    _count: {
      planTrainingDelaySubjects: 0, // Total count of subjects
    },
  }
  const { onOpen: onOpenDetailSubject } = useDisclosure<{
    subjectVersionId?: string
  }>({
    tag: "ModalChiTietMonHoc",
  })
  const debouncedRefetch = useCallback(
    _.debounce(() => {
      queryClient.invalidateQueries({ queryKey: ["zenstack", "PlanTraining"] })
      queryClient.invalidateQueries({ queryKey: ["zenstack", "SubjectClass"] })
    }, 500),
    []
  )

  const { showSpinner, hideSpinner } = useSpinner()

  const onSubmit = async () => {
    try {
      if (!semesterId || !trainingObjectTypeId) return
      showSpinner()
      const subject = planTrainingDelayData?.planTrainingDelaySubjects.filter((subject) =>
        subjectDelaySelected.includes(subject.subjectVersionId)
      )

      const planTraining = await sqlTransaction([
        {
          model: "PlanTraining",
          operation: "upsert",
          data: {
            where: {
              trainingObjectTypeId_semesterId_trainingCourseId: {
                trainingObjectTypeId,
                semesterId,
                trainingCourseId,
              },
            },
            update: {},
            create: {
              trainingObjectTypeId,
              semesterId,
              trainingCourseId,
            },
            select: {
              id: true,
              planTrainingSubjects: {
                select: {
                  subjectVersionId: true,
                },
                where: {
                  subjectClassType: $Enums.SubjectClassType.RETAKE,
                },
              },
            },
          },
        },
      ])

      if (planTraining.status !== 200 || !subject) {
        throw new Error("Lỗi khi tạo kế hoạch đào tạo")
      }

      const planTrainingId = (planTraining?.data?.[0] as PlanTraining)?.id
      if (!planTrainingId) {
        throw new Error("Kế hoạch đào tạo không tồn tại")
      }
      const planTrainingDelayId = planTrainingDelayData?.id
      if (!planTrainingDelayId) {
        throw new Error("Kế hoạch đào tạo môn chậm tiến độ không tồn tại")
      }

      const res = await sqlTransaction([
        {
          model: "PlanTraining",
          operation: "update",
          data: {
            where: { id: planTrainingId },
            data: {
              planTrainingSubjects: {
                // create: subject.map((subject) => ({
                //     subjectVersionId: subject.subjectVersionId,
                //     fixedClasses: {
                //         connect: subject.fixedClasses.map((fc) => ({
                //             id: fc.id,
                //         })),
                //     },
                // })),
              },
            },
          },
        },
      ])
      if (res.status !== 200) {
        throw new Error("Lỗi khi lưu kế hoạch đào tạo")
      }
      message.success("Thêm môn học vào kế hoạch thành công")
      form.resetFields()
      debouncedRefetch()
    } catch (error) {
      message.error("Lưu kế hoạch môn thất bại")
      console.error(error)
    }
    hideSpinner()
  }

  return (
    <div>
      <Row gutter={[0, 0]}>
        <Form
          className="w-full"
          form={form}
          onValuesChange={(filter: SubjectBySemesterForm) => {
            if (!filter.subjectDelaySelected) {
              debouncedRefetch()
            }
          }}
        >
          <Col span={24}>
            <Flex justify="space-between" gap={4}>
              <Form.Item className="mb-0" name="searchText">
                <Input id="search" placeholder="Tìm kiếm" allowClear />
              </Form.Item>
              <Button onClick={onSubmit} type="primary" disabled={!subjectDelaySelected.length}>
                Thêm vào kế hoạch
              </Button>
            </Flex>
          </Col>
          <Col span={24}>
            <Form.Item hidden name="subjectDelaySelected" />
            <Table
              rowKey="subjectVersionId"
              data={planTrainingDelayData?.planTrainingDelaySubjects ?? []}
              rowSelection={{
                type: "checkbox",
                checkStrictly: true,
                selectedRowKeys: subjectDelaySelected,
                onChange: (selectedRowKeys) => {
                  form.setFieldValue("subjectDelaySelected", selectedRowKeys)
                },
                columnWidth: 15,
              }}
              onRow={(record) => {
                return {
                  onClick: () => {
                    const isSelected = subjectDelaySelected.includes(record.subjectVersionId)
                    if (isSelected) {
                      form.setFieldValue(
                        "subjectDelaySelected",
                        subjectDelaySelected.filter((id) => id !== record.subjectVersionId)
                      )
                    } else {
                      form.setFieldValue("subjectDelaySelected", [
                        ...subjectDelaySelected,
                        record.subjectVersionId,
                      ])
                    }
                  },
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
                  dataIndex: ["subjectVersion", "code"],
                  align: "center",
                  width: 100,
                },
                {
                  title: "Tên môn học",
                  align: "center",
                  render: (_, record) => {
                    return (
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenDetailSubject({
                            subjectVersionId: record.subjectVersionId,
                          })
                        }}
                        className="text-left hover:text-primary cursor-pointer"
                      >
                        {`${record?.subjectVersion?.name} (${record?.subjectVersion?.credit})` ||
                          ""}
                      </div>
                    )
                  },
                },
                {
                  title: "Danh sách lớp quản lý",
                  dataIndex: "fixedClass",
                  align: "center",
                  width: 180,
                  render: (__, record) => {
                    return record?.fixedClasses.length ? (
                      <TextTruncate
                        arr={record?.fixedClasses.map((i: any) => {
                          return {
                            key: i?.id,
                            label: ` ${i.code} (${i._count?.students})`,
                          }
                        })}
                        key="fixedClass"
                      />
                    ) : (
                      ""
                    )
                  },
                },
                {
                  title: "Đơn vị phụ trách",
                  dataIndex: ["subjectVersion", "managementOrganization", "sMa"],
                  width: 150,
                  align: "center",
                },
              ]}
              pagination={{
                current: currentPage,
                pageSize: numberOfPages,
                total: planTrainingDelayData?._count.planTrainingDelaySubjects ?? 0,
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
