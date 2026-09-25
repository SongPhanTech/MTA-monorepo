import Select from "@components/commons/select"
import Table from "@components/commons/table"
import { DEFAULT_PAGINATE_SIZE } from "@constants/constants"
import DefaultLayout from "@layouts/default-layout"
import type { Prisma } from "@workspace/db/client"
import { useFindManyExamList, useFindManyLecturer, useUpdateExamList } from "@workspace/db/hooks"
import { PERIOD } from "@workspace/ui"
import { Button, Col, Flex, Form, message, Popconfirm, Row } from "antd"
import dayjs from "dayjs"
import { useEffect, useState } from "react"

type SubjectClassTypeWithRelation = Prisma.SubjectClassGetPayload<{
  include: {
    subject: {
      select: {
        name: true
      }
    }
  }
}>

export default function DanhSachThiPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [numberOfPages, setNumberOfPages] = useState(DEFAULT_PAGINATE_SIZE)

  const [form] = Form.useForm()

  const { data: examListData = [], refetch } = useFindManyExamList({
    include: {
      examPapers: {
        include: {
          studentSubjectScore: true,
        },
      },
      examRoom: {
        include: {
          room: true,
          exam: {
            include: {
              subjectClass: {
                include: {
                  subject: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [
      {
        examRoom: {
          exam: { createdAt: "desc" },
        },
      },
    ],
  })

  const { data: lecturerData = [] } = useFindManyLecturer({
    include: {
      userProfile: true,
    },
  })

  const { mutateAsync: updateExamList } = useUpdateExamList()

  useEffect(() => {
    if (examListData.length > 0) {
      const formValues: Record<string, any> = {}

      for (const examRoom of examListData) {
        formValues[examRoom.id] = {
          start: examRoom.start,
          end: examRoom.end,
          firstSupervisorId: examRoom.firstSupervisorId,
          secondSupervisorId: examRoom.secondSupervisorId,
        }
      }

      form.setFieldsValue(formValues)
    }
  }, [examListData, form])

  const onSubmit = async () => {
    try {
      const data = form.getFieldsValue()

      const listObject = Object.entries(data).map(([key, value_]) => {
        return {
          id: key,
          ...(value_ as any),
        }
      })

      await Promise.all(
        listObject.map((item) =>
          updateExamList({
            where: { id: item.id },
            data: {
              start: item.start,
              end: item.end,
              firstSupervisorId: item.firstSupervisorId,
              secondSupervisorId: item.secondSupervisorId,
            },
          })
        )
      )

      message.success("Lưu danh sách thi thành công")
      refetch()
    } catch (error) {
      message.error("Có lỗi xảy ra khi lưu danh sách thi")
      console.error(error)
    }
  }

  return (
    <div>
      <Row gutter={[0, 0]}>
        <Col span={24}>
          <Flex justify="end">
            <Popconfirm
              title="Xác nhận lưu danh sách thi?"
              okText="Xác nhận"
              cancelText="Hủy"
              onConfirm={onSubmit}
            >
              <Button type="primary">Lưu</Button>
            </Popconfirm>
          </Flex>
        </Col>
        <Form form={form} className="w-full">
          <Table
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center",
                render: (_, __, index) => index + 1,
              },
              {
                title: "Môn học",
                width: 150,
                render: (_, record) => {
                  const subjectNames = record.examRoom?.exam?.subjectClass
                    ?.map((sc: SubjectClassTypeWithRelation) => sc.subject?.name)
                    .filter(
                      (name: string, index: number, self: string[]) => self.indexOf(name) === index
                    )

                  if (!subjectNames || subjectNames.length === 0) return "-"
                  if (subjectNames.length === 1) return subjectNames[0]
                  return subjectNames.join(", ")
                },
              },
              {
                title: "Mã lớp môn học",
                width: 150,
                render: (_, record) => {
                  const subjectClassCodes = record.examRoom.exam?.subjectClass?.map(
                    (sc: SubjectClassTypeWithRelation) => sc.code
                  )

                  if (!subjectClassCodes || subjectClassCodes.length === 0) return "-"
                  return subjectClassCodes.join(", ")
                },
              },
              {
                title: "Phòng thi",
                width: 120,
                align: "center",
                render: (_, record) => record.examRoom.room?.name || "-",
              },
              {
                title: "Số sinh viên",
                width: 100,
                align: "center",
                render: (_, record) => record.examRoom.exam?.studentSubjectScore?.length || 0,
              },
              {
                title: "Ngày tạo",
                width: 120,
                align: "center",
                render: (_, record) =>
                  record.createdAt ? dayjs(record.createdAt).format("DD/MM/YYYY") : "-",
              },
              {
                title: "Ca bắt đầu",
                width: 100,
                align: "center",
                render: (_, record) => {
                  return (
                    <Form.Item
                      name={[record.id, "start"]}
                      className="mb-0"
                      initialValue={record.start}
                    >
                      <Select
                        options={Object.entries(PERIOD).map(([key, val]) => ({
                          label: `${key} - ${val.startTime.format("HH:mm")}`,
                          value: Number(key),
                        }))}
                        onChange={(val) => {
                          form.setFieldValue([record.id, "start"], val)

                          const currentEnd = form.getFieldValue([record.id, "end"])

                          if (currentEnd && currentEnd < val) {
                            form.setFieldValue([record.id, "end"], val)
                          }
                        }}
                        className="w-full"
                      />
                    </Form.Item>
                  )
                },
              },
              {
                title: "Ca kết thúc",
                width: 100,
                align: "center",
                render: (_, record) => {
                  return (
                    <Form.Item name={[record.id, "end"]} className="mb-0" initialValue={record.end}>
                      <Select
                        options={Object.entries(PERIOD)
                          .map(([key, val]) => ({
                            label: `${key} - ${val.endTime.format("HH:mm")}`,
                            value: Number(key),
                          }))
                          .filter((item) => {
                            const startPeriod =
                              form.getFieldValue([record.id, "start"]) || record.start
                            return Number(item.value) >= startPeriod
                          })}
                        onChange={(val) => {
                          form.setFieldValue([record.id, "end"], val)
                        }}
                        className="w-full"
                      />
                    </Form.Item>
                  )
                },
              },
              {
                title: "Giám thị 1",
                width: 150,
                render: (_, record) => {
                  return (
                    <Form.Item
                      name={[record.id, "firstSupervisorId"]}
                      className="mb-0"
                      initialValue={record.firstSupervisorId}
                    >
                      <Select
                        placeholder="Chọn giám thị 1"
                        options={lecturerData
                          .filter(
                            (lecturer) =>
                              lecturer?.id !== form.getFieldValue([record.id, "lecturerId2"])
                          )
                          .map((i) => {
                            return {
                              ...i,
                              value: i?.id,
                              label: [i?.userProfile?.code, i?.userProfile?.fullname]
                                .filter(Boolean)
                                .join(" - "),
                            }
                          })}
                        onChange={(val) => {
                          form.setFieldValue([record.id, "lecturerId1"], val)
                        }}
                      />
                    </Form.Item>
                  )
                },
              },
              {
                title: "Giám thị 2",
                width: 150,
                render: (_, record) => {
                  return (
                    <Form.Item
                      name={[record.id, "secondSupervisorId"]}
                      className="mb-0"
                      initialValue={record.secondSupervisorId}
                    >
                      <Select
                        placeholder="Chọn giám thị 2"
                        options={lecturerData
                          .filter(
                            (lecturer) =>
                              lecturer?.id !== form.getFieldValue([record.id, "lecturerId1"])
                          )
                          .map((i) => {
                            return {
                              ...i,
                              value: i?.id,
                              label: [i?.userProfile?.code, i?.userProfile?.fullname]
                                .filter(Boolean)
                                .join(" - "),
                            }
                          })}
                        onChange={(val) => {
                          form.setFieldValue([record.id, "lecturerId2"], val)
                        }}
                      />
                    </Form.Item>
                  )
                },
              },
            ]}
            data={examListData}
            pagination={{
              current: currentPage,
              pageSize: numberOfPages,
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
        </Form>
      </Row>
    </div>
  )
}

DanhSachThiPage.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
