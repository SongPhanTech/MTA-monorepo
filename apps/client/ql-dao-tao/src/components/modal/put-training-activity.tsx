import { DeleteOutlined } from "@ant-design/icons"
import { queryClient } from "@api/index"
import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import {
  useCreateTrainingActivity,
  useFindManyFixedClass,
  useFindManyStudent,
  useFindManyTrainingCourse,
  useFindUniqueTrainingActivity,
  useUpdateTrainingActivity,
} from "@workspace/db/hooks"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Form, Input, InputNumber, message, Typography } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type SelectedStudentRow = {
  rowId: string
  studentId: string
  code: string
  fullname: string
  dateOfBirth: Date | string | null
}

type StudentTrainingActivityInput = {
  category?: string
  score?: number
  date?: dayjs.Dayjs
  description?: string
}

export type PutTrainingActivityForm = {
  trainingCoursesId?: string
  fixedClassesId?: string
  category?: string
  score?: number
  date?: dayjs.Dayjs
  description?: string
  student?: Record<string, StudentTrainingActivityInput>
}

dayjs.locale("vi")

const { Title } = Typography
const { TextArea } = Input

const PutTrainingActivityModal = () => {
  const [selectedStudents, setSelectedStudents] = useState<SelectedStudentRow[]>([])
  const [rowCounter, setRowCounter] = useState(0)
  const [studentSelectKey, setStudentSelectKey] = useState(0)
  const [form] = Form.useForm<PutTrainingActivityForm>()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutTrainingActivityModal",
    onClose: () => {
      form.resetFields()
      setSelectedStudents([])
      setRowCounter(0)
      setStudentSelectKey((prev) => prev + 1)
    },
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createTrainingActivity } = useCreateTrainingActivity()
  const { mutateAsync: updateTrainingActivity } = useUpdateTrainingActivity()

  const { data: trainingActivityData } = useFindUniqueTrainingActivity(
    {
      where: { id: id as string },
      include: {
        student: {
          include: {
            userProfile: true,
            fixedClass: true,
          },
        },
      },
    },
    { enabled: isOpen && !!id }
  )

  const { data: trainingCourses = [] } = useFindManyTrainingCourse(
    {
      where: { trainingObjectTypeId },
      orderBy: {
        semesterStart: {
          startDate: "desc",
        },
      },
    },
    { enabled: !!trainingObjectTypeId }
  )

  const fixedClassId = Form.useWatch("fixedClassesId", form)
  const trainingCoursesId = Form.useWatch("trainingCoursesId", form)
  const studentFormData = Form.useWatch("student", form) ?? {}

  const { data: fixedClasses = [] } = useFindManyFixedClass({
    where: {
      trainingCourseId: trainingCoursesId ?? undefined,
    },
  })

  const studentWhere = useMemo(() => {
    return {
      fixedClass: {
        ...(trainingCoursesId ? { trainingCourseId: trainingCoursesId } : {}),
        ...(fixedClassId ? { id: fixedClassId } : {}),
      },
    }
  }, [trainingCoursesId, fixedClassId])

  const { data: studentData = [] } = useFindManyStudent(
    {
      where: studentWhere,
      include: {
        userProfile: {
          select: {
            code: true,
            dateOfBirth: true,
            fullname: true,
          },
        },
      },
      orderBy: {
        userProfile: {
          firstName: "asc",
        },
      },
    },
    { enabled: !!trainingObjectTypeId }
  )

  const handleAddStudent = useCallback(
    (studentId: string) => {
      const student = studentData.find((s: any) => s.id === studentId)
      if (!student) return

      const newRowId = `row_${rowCounter}`
      setRowCounter((prev) => prev + 1)
      setSelectedStudents((prev) => [
        ...prev,
        {
          rowId: newRowId,
          studentId: student.id,
          code: student.userProfile?.code || "",
          fullname: student.userProfile?.fullname || "",
          dateOfBirth: student.userProfile?.dateOfBirth || null,
        },
      ])
    },
    [studentData, rowCounter]
  )

  const handleRemoveRow = useCallback(
    (rowId: string) => {
      setSelectedStudents((prev) => prev.filter((r) => r.rowId !== rowId))
      const currentStudent = form.getFieldValue("student") || {}
      delete currentStudent[rowId]
      form.setFieldValue("student", currentStudent)
    },
    [form]
  )

  async function onOk(values: PutTrainingActivityForm) {
    try {
      showSpinner()

      if (id) {
        await updateTrainingActivity({
          where: { id },
          data: {
            category: values.category?.trim() || "",
            score: values.score ?? 0,
            date: values.date?.toDate() as Date,
            description: values.description?.trim() || null,
          },
        })
        message.success("Cập nhật quá trình rèn luyện thành công")
      } else {
        let createdCount = 0

        for (const row of selectedStudents) {
          const rowData = values.student?.[row.rowId]
          if (!rowData?.category || !rowData?.date) continue

          const result = await createTrainingActivity({
            data: {
              studentId: row.studentId,
              category: rowData.category.trim(),
              score: rowData.score || 0,
              date: rowData.date.toDate() as Date,
              description: rowData.description?.trim() || null,
            },
          })

          if (result) {
            createdCount += 1
          }
        }

        if (createdCount === 0) {
          message.warning("Chưa có dữ liệu hợp lệ để thêm mới")
          return
        }

        message.success(`Đã thêm mới ${createdCount} quá trình rèn luyện`)
      }

      queryClient.invalidateQueries({
        queryKey: ["TrainingActivity"],
      })
      onClose()
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

  useEffect(() => {
    if (!isOpen) return

    if (!id) {
      form.setFieldsValue({
        trainingCoursesId: undefined,
        fixedClassesId: undefined,
        student: {},
      })
      setSelectedStudents([])
      setRowCounter(0)
      setStudentSelectKey((prev) => prev + 1)
      return
    }

    if (!trainingActivityData) return

    form.setFieldsValue({
      trainingCoursesId: trainingActivityData.student?.fixedClass?.trainingCourseId,
      fixedClassesId: trainingActivityData.student?.fixedClassId || undefined,
      category: trainingActivityData.category || "",
      score: trainingActivityData.score ?? undefined,
      date: trainingActivityData.date ? dayjs(trainingActivityData.date) : undefined,
      description: trainingActivityData.description || "",
    })
  }, [form, id, isOpen, trainingActivityData])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable
      title={id ? "Chỉnh sửa quá trình rèn luyện" : "Thêm mới quá trình rèn luyện"}
      className="w-[95vw]"
    >
      <Col span={12} className="mb-4">
        <FormItem form={form} name="trainingCoursesId" label="Khoá">
          <Select
            showSearch
            style={{ width: "100%" }}
            placeholder="Chọn khoá"
            options={trainingCourses.map((item) => ({
              label: `${item?.code || ""} - ${item.name}`,
              value: item.id,
            }))}
            disabled={!!id}
          />
        </FormItem>
      </Col>

      <Col span={12} className="mb-4">
        <FormItem form={form} name="fixedClassesId" label="Lớp quản lý">
          <Select
            showSearch
            style={{ width: "100%" }}
            placeholder="Chọn lớp quản lý"
            options={fixedClasses.map((item) => ({
              label: `${item?.code || ""} - ${item.name}`,
              value: item.id,
            }))}
            disabled={!form.getFieldValue("trainingCoursesId") || !!id}
          />
        </FormItem>
      </Col>

      {!id && (
        <Col span={24} className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <Title level={5} className="m-0">
              Học viên, sinh viên
            </Title>
          </div>

          <div className="mb-3">
            <Select
              key={studentSelectKey}
              showSearch
              style={{ width: "100%" }}
              placeholder="Tìm và chọn sinh viên để thêm vào danh sách..."
              value={undefined}
              onSelect={(value: string) => handleAddStudent(value)}
              options={studentData.map((item: any) => ({
                label: `${item.userProfile?.code || ""} - ${item.userProfile?.fullname || ""}`,
                value: item.id,
              }))}
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              disabled={!form.getFieldValue("fixedClassesId")}
            />
          </div>

          {selectedStudents.length > 0 && (
            <Table
              rowKey="rowId"
              data={selectedStudents}
              scroll={{ y: 320 }}
              columns={[
                {
                  title: "TT",
                  width: 35,
                  align: "center",
                  render: (_, __, index) => index + 1,
                },
                {
                  title: "Mã SV",
                  width: 120,
                  align: "center",
                  render: (_, record) => record.code,
                },
                {
                  title: "Họ và tên",
                  align: "left",
                  width: 200,
                  render: (_, record) => record.fullname,
                },
                {
                  title: "Ngày sinh",
                  width: 100,
                  align: "center",
                  render: (_, record) =>
                    record.dateOfBirth ? dayjs(record.dateOfBirth).format("DD/MM/YYYY") : "",
                },
                {
                  title: "Loại rèn luyện",
                  width: 180,
                  align: "center",
                  render: (_, record) => (
                    <FormItem
                      form={form}
                      name={["student", record.rowId, "category"]}
                      rules={[{ required: true, message: "Vui lòng nhập loại rèn luyện" }]}
                    >
                      <Input variant="underlined" className="w-full" placeholder="Nhập loại" />
                    </FormItem>
                  ),
                },
                {
                  title: "Điểm",
                  width: 120,
                  align: "center",
                  render: (_, record) => (
                    <FormItem form={form} name={["student", record.rowId, "score"]}>
                      <InputNumber
                        min={0}
                        variant="underlined"
                        className="w-full"
                        placeholder="Nhập điểm"
                      />
                    </FormItem>
                  ),
                },
                {
                  title: "Ngày",
                  width: 120,
                  align: "center",
                  render: (_, record) => (
                    <FormItem
                      form={form}
                      name={["student", record.rowId, "date"]}
                      rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
                    >
                      <DatePicker variant="underlined" className="w-full" placeholder="Chọn ngày" />
                    </FormItem>
                  ),
                },
                {
                  title: "Mô tả",
                  width: 220,
                  align: "center",
                  render: (_, record) => (
                    <FormItem form={form} name={["student", record.rowId, "description"]}>
                      <Input variant="underlined" className="w-full" placeholder="Nhập mô tả" />
                    </FormItem>
                  ),
                },
                {
                  title: "",
                  width: 50,
                  align: "center",
                  render: (_, record) => (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      onClick={() => handleRemoveRow(record.rowId)}
                    />
                  ),
                },
              ]}
              pagination={false}
            />
          )}
        </Col>
      )}

      {id && (
        <>
          <Col span={12} className="mb-3">
            <FormItem form={form} name="category" label="Loại rèn luyện" required>
              <Input placeholder="Nhập loại rèn luyện" />
            </FormItem>
          </Col>
          <Col span={12} className="mb-3">
            <FormItem form={form} name="score" label="Điểm">
              <InputNumber min={0} className="w-full" placeholder="Nhập điểm rèn luyện" />
            </FormItem>
          </Col>
          <Col span={12} className="mb-3">
            <FormItem form={form} name="date" label="Ngày" required>
              <DatePicker className="w-full" placeholder="Chọn ngày" />
            </FormItem>
          </Col>
          <Col span={12} className="mb-3">
            <FormItem form={form} name="description" label="Mô tả">
              <TextArea rows={3} placeholder="Nhập mô tả" />
            </FormItem>
          </Col>
        </>
      )}
    </PutFormModal>
  )
}

export default PutTrainingActivityModal
