import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import { queryClient } from "@lib/api"
import { $Enums, type PlanTraining } from "@workspace/db/client"
import { sqlTransaction } from "@workspace/libs/api/model"
import { useOpenSubjectClassReExam, useOpenSubjectClassRetake } from "@workspace/libs/api/training"
import { useAbility } from "@workspace/permissions/hooks"
import {
  useSemesterStore,
  useTrainingCourseStore,
  useTrainingMajorStore,
  useTrainingObjectTypeStore,
} from "@workspace/ui"
import { Button, Col, Flex, Form, Input, message, Row } from "antd"
import { useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

interface SubjectBySemesterForm {
  searchText?: string
  subjectSelected?: Array<{
    id: string
    trainingBlockSubjectId: string
    count: number
  }>
}

export default function MonCoHVSVChuaDat({ type }: { type?: $Enums.SubjectClassType }) {
  const { canSome } = useAbility()
  const [form] = Form.useForm<SubjectBySemesterForm>()
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(100)
  const { id: semesterId } = useSemesterStore()
  const searchText = Form.useWatch("searchText", form)
  const subjectSelected = Form.useWatch("subjectSelected", form) || []
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const { showSpinner, hideSpinner } = useSpinner()

  const { onOpen: onOpenDetailSubject } = useDisclosure<{
    subjectVersionId?: string
  }>({
    tag: "ModalChiTietMonHoc",
  })

  const { id: trainingCourseId } = useTrainingCourseStore()
  const { id: trainingMajorId } = useTrainingMajorStore()
  const { data: res } =
    type === $Enums.SubjectClassType.RETAKE
      ? useOpenSubjectClassRetake(
          {
            search: searchText,
            trainingCourseId: trainingCourseId as string,
            trainingMajorId,
            trainingObjectTypeId: trainingObjectTypeId as string,
            semesterId: semesterId as string,
            limit: numberOfPages,
            page: currentPage,
            viewAll: 0,
          },
          {
            query: {
              enabled: !!trainingObjectTypeId && !!semesterId && !!trainingCourseId,
            },
          }
        )
      : useOpenSubjectClassReExam(
          {
            search: searchText,
            trainingCourseId: trainingCourseId as string,
            trainingMajorId,
            trainingObjectTypeId: trainingObjectTypeId as string,
            semesterId: semesterId as string,
            limit: numberOfPages,
            page: currentPage,
            viewAll: 0,
          },
          {
            query: {
              enabled: !!trainingObjectTypeId && !!semesterId && !!trainingCourseId,
            },
          }
        )
  // queryKey /api/subject-class/open-subject-class-retake

  const data = useMemo(() => (res?.status === 200 ? res?.data.data : []), [res])

  const onSubmit = async () => {
    try {
      if (!semesterId || !trainingObjectTypeId) return
      showSpinner()
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
                  trainingBlockSubjectId: true,
                },
                where: {
                  subjectClassType: type,
                },
              },
            },
          },
        },
      ])

      if (planTraining.status !== 200) {
        throw new Error("Lỗi khi tạo kế hoạch đào tạo")
      }

      const planTrainingId = (planTraining?.data?.[0] as PlanTraining)?.id
      if (!planTrainingId) {
        throw new Error("Kế hoạch đào tạo không tồn tại")
      }
      const res = await sqlTransaction([
        {
          model: "PlanTraining",
          operation: "update",
          data: {
            where: { id: planTrainingId },
            data: {
              planTrainingSubjects: {
                create: subjectSelected.map((subject) => ({
                  trainingBlockSubjectId: subject.trainingBlockSubjectId,
                  subjectClassType: type,
                  studentCount: subject.count,
                })),
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
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "PlanTraining"],
      })
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
    } catch (error) {
      message.error("Lưu kế hoạch môn thất bại")
      console.error(error)
    }
    hideSpinner()
  }

  return (
    <Form form={form}>
      <Row gutter={[8, 0]}>
        <Col span={24}>
          <Flex justify={"space-between"}>
            <Col span={12}>
              <Form.Item className="mb-0" name="searchText">
                <Input id="search" placeholder="Tìm kiếm" allowClear />
              </Form.Item>
            </Col>
            <Flex gap={8} justify={"end"}>
              <Button onClick={onSubmit} type="primary" disabled={subjectSelected.length === 0}>
                Đưa {subjectSelected.length || ""} môn vào KHDK
              </Button>
            </Flex>
          </Flex>
        </Col>
        <Col span={24}>
          <Form.Item hidden name="subjectSelected" />
          <Table
            rowKey="id"
            data={data}
            rowSelection={{
              selectedRowKeys: [...subjectSelected.map((e) => e.id)],
              onChange: (_, selectedRows) => {
                form.setFieldValue(
                  "subjectSelected",
                  selectedRows.map((e) => ({
                    id: e.id,
                    count: e.count,
                    trainingBlockSubjectId: e.trainingBlockSubjectId,
                  }))
                )
              },
              type: "checkbox",
              columnWidth: 35,
            }}
            onRow={(record) => {
              return {
                onClick: () => {
                  if (subjectSelected.some((e) => e.id === record.id)) {
                    const newSelected = subjectSelected.filter((e) => e.id !== record.id)
                    form.setFieldValue("subjectSelected", newSelected)
                  } else {
                    const newSelected = [
                      ...subjectSelected,
                      {
                        id: record.id,
                        count: record.count,
                        trainingBlockSubjectId: record.trainingBlockSubjectId,
                      },
                    ]
                    form.setFieldValue("subjectSelected", newSelected)
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
                dataIndex: "code",
                align: "center",
                width: 100,
              },
              {
                title: "Tên môn học",
                align: "center",
                render: (__, record) => {
                  return (
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenDetailSubject({
                          subjectVersionId: record.id,
                        })
                      }}
                      className="text-left hover:text-primary cursor-pointer"
                    >{`${record?.name}`}</div>
                  )
                },
              },
              // {
              //     title: 'Số SV nợ',
              //     dataIndex: 'count',
              //     width: 80,
              //     align: 'center',
              // },
            ]}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
              total: res?.data?.count ?? 0,
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
    </Form>
  )
}
