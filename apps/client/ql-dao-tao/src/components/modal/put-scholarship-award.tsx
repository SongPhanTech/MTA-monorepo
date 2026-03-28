import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { ScholarshipAward } from "@workspace/db/client"
import {
  useCreateScholarshipAward,
  useFindManyFixedClass,
  useFindManyScholarship,
  useFindManyStudent,
  useFindUniqueScholarshipAward,
  useUpdateScholarshipAward,
} from "@workspace/db/hooks"
import { Col, Form, InputNumber, message } from "antd"
import { useWatch } from "antd/es/form/Form"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import "./index.css"
import { queryClient } from "@api/index"
import Select from "@components/commons/select"
import { SelectTrainingCourse } from "@workspace/ui"
export type PutScholarshipAward = ScholarshipAward & {
  trainingCourseId: string
  fixedClassId: string
}
dayjs.locale("vi")

type ScholarshipAwardInput = {
  id: string
  semesterId: string
}

const PutScholarshipAward = () => {
  const [form] = Form.useForm<PutScholarshipAward>()

  const { isOpen, onClose, input } = useDisclosure<ScholarshipAwardInput>({
    tag: "PutScholarshipAward",
    onClose: form.resetFields,
  })

  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(undefined)
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined)

  const { data: fixedClasses } = useFindManyFixedClass({
    where: { trainingCourseId: selectedCourseId },
    orderBy: { name: "asc" },
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const selectedStudentId = useWatch("studentId", form)
  const selectedScholarshipId = useWatch("scholarshipId", form)

  const { mutateAsync: createScholarshipAward } = useCreateScholarshipAward()
  const { mutateAsync: updateScholarshipAward } = useUpdateScholarshipAward()
  async function onOk(output?: PutScholarshipAward) {
    if (!output) return
    try {
      showSpinner()
      if (!input?.semesterId) {
        message.error("Thiếu mã học kỳ")
        hideSpinner()
        return
      }
      const data = {
        studentId: output?.studentId,
        semesterId: input?.semesterId,
        scholarshipId: output?.scholarshipId,
        amount: output?.amount,
        gpaAtAward: output?.gpaAtAward,
        priorityRank: output?.priorityRank,
      }
      if (input?.id) {
        await updateScholarshipAward({
          data,
          where: {
            id: input?.id,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createScholarshipAward({
          data,
        })
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["SchoolYear"],
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

  const { data: initialValue } = useFindUniqueScholarshipAward(
    {
      where: { id: input?.id },
    },
    { enabled: !!input?.id }
  )

  const { data: studentData = [] } = useFindManyStudent({
    where: {
      studentSemesterResult: {
        some: {
          semesterId: input?.semesterId,
        },
      },
      fixedClass: {
        trainingCourseId: selectedCourseId,
        id: selectedClassId,
      },
    },
    include: {
      userProfile: true,
      studentSemesterResult: true,
      fixedClass: true,
    },
    orderBy: {
      userProfile: {
        firstName: "asc",
      },
    },
  })

  const selectedStudent = studentData.find((student) => student.id === selectedStudentId)
  const trainingCourseId = selectedStudent?.fixedClass?.trainingCourseId

  const { data: scholarshipData = [] } = useFindManyScholarship({
    where: {
      trainingCourseId,
    },
    include: {
      trainingCourse: true,
    },
    orderBy: {
      rankOrder: "asc",
    },
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue({
        ...initialValue,
      })
    }
  }, [initialValue])

  useEffect(() => {
    if (selectedScholarshipId) {
      const selectedScholarship = scholarshipData.find((s) => s.id === selectedScholarshipId)
      if (selectedScholarship) {
        const amount = Number(selectedScholarship.baseAmount) * selectedScholarship.multiplier
        form.setFieldValue("amount", amount)
      }
    }
  }, [selectedScholarshipId, form, scholarshipData])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={input?.id ? "Sửa xét học bổng" : "Thêm xét học bổng"}
    >
      <Col span={12}>
        <FormItem form={form} name="trainingCourseId" label="Khoá học">
          <SelectTrainingCourse
            placeholder="Chọn khoá"
            allowClear
            onChange={(val) => {
              setSelectedCourseId(val)
              setSelectedClassId(undefined)
            }}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="fixedClassId" label="Lớp quản lý">
          <Select
            placeholder="Chọn lớp"
            allowClear
            disabled={!selectedCourseId}
            value={selectedClassId}
            onChange={setSelectedClassId}
            options={fixedClasses?.map((c) => ({ label: c.name, value: c.id }))}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="studentId" label="Sinh viên" required>
          <Select
            maxTagCount={"responsive"}
            placeholder="Chọn sinh viên"
            options={studentData.map((i) => {
              return {
                value: i.id,
                label: [i.code, i.userProfile.fullname].filter(Boolean).join(" - "),
              }
            })}
            {...(input?.id
              ? {
                  showSearch: false,
                  allowClear: false,
                  showArrow: false,
                  open: false,
                }
              : {})}
            onChange={() => {
              form.setFieldValue("scholarshipId", undefined)
              form.setFieldValue("amount", undefined)
            }}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="scholarshipId" label="Học bổng" required>
          <Select
            maxTagCount={"responsive"}
            placeholder={selectedStudentId ? "Chọn học bổng" : "Vui lòng chọn sinh viên trước"}
            options={scholarshipData.map((i) => {
              return {
                value: i.id,
                label: [i.name, i.trainingCourse.name].filter(Boolean).join(" - "),
              }
            })}
            onChange={(value) => {
              const selected = scholarshipData.find((s) => s.id === value)
              if (selected) {
                form.setFieldValue("amount", Number(selected.baseAmount) * selected.multiplier)
              }
            }}
            disabled={!selectedStudentId}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="amount" label="Số tiền học bổng">
          <InputNumber
            min={0}
            type="number"
            placeholder="Nhập số tiền học bổng"
            className="w-full"
            step={1}
            suffix="VNĐ"
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="gpaAtAward" label="GPA">
          <InputNumber min={0} type="number" placeholder="Nhập GPA" className="w-full" step={0.1} />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="priorityRank" label="Xếp hạng xét học bổng">
          <InputNumber min={0} type="number" placeholder="Nhập hệ số" className="w-full" step={1} />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutScholarshipAward
