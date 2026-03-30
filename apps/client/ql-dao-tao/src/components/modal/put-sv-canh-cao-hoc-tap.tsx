import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { AcademicWarning } from "@workspace/db/client"
import {
  useCreateAcademicWarning,
  useFindManyFixedClass,
  useFindManyStudent,
  useFindUniqueAcademicWarning,
  useUpdateAcademicWarning,
} from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import Select from "@components/commons/select"
import { SelectTrainingCourse } from "@workspace/ui/components/select-training-course/index"
export type PutAcademicWarning = AcademicWarning & {
  trainingCourseId: string
  fixedClassId: string
}
dayjs.locale("vi")

type AcademicWarningInput = {
  id: string
  semesterId: string
}

const PutAcademicWarning = () => {
  const [form] = Form.useForm<PutAcademicWarning>()

  const { isOpen, onClose, input } = useDisclosure<AcademicWarningInput>({
    tag: "PutAcademicWarning",
    onClose: form.resetFields,
  })

  const selectedCourseId = Form.useWatch("trainingCourseId", form)
  const selectedClassId = Form.useWatch("fixedClassId", form)

  const { data: fixedClasses } = useFindManyFixedClass({
    where: { trainingCourseId: selectedCourseId },
    orderBy: { name: "asc" },
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createAcademicWarning } = useCreateAcademicWarning()

  const { mutateAsync: updateAcademicWarning } = useUpdateAcademicWarning()
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
    },
    orderBy: {
      userProfile: {
        firstName: "asc",
      },
    },
  })

  async function onOk(output?: PutAcademicWarning) {
    if (!output) return
    try {
      showSpinner()
      if (!input?.semesterId) {
        message.error("Thiếu mã kỳ học")
        hideSpinner()
        return
      }
      const data = {
        code: output?.code,
        description: output?.description,
        active: output?.active,
        studentId: output?.studentId,
        semesterId: input.semesterId,
        level: output.level,
      }
      if (input?.id) {
        await updateAcademicWarning({
          data,
          where: {
            id: input?.id,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createAcademicWarning({
          data,
        })
        message.success("Thêm mới thành công")
      }

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

  const { data: initialValue } = useFindUniqueAcademicWarning(
    {
      where: { id: input?.id },
      include: {
        student: {
          include: {
            fixedClass: true,
          },
        },
      },
    },
    { enabled: !!input?.id }
  )

  useEffect(() => {
    if (initialValue) {
      const trainingCourseId = initialValue.student?.fixedClass?.trainingCourseId
      const fixedClassId = initialValue.student?.fixedClassId ?? undefined
      form.setFieldsValue({
        ...initialValue,
        trainingCourseId,
        fixedClassId,
      })
    } else {
      form.setFieldsValue({
        active: true,
      })
    }
  }, [initialValue, form.setFieldsValue])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={input?.id ? "Sửa cảnh cáo học tập" : "Thêm cảnh cáo học tập"}
    >
      <Col span={12}>
        <FormItem form={form} name="trainingCourseId" label="Khoá học">
          <SelectTrainingCourse
            className="w-full"
            placeholder="Chọn khoá"
            allowClear
            onChange={() => {
              form.setFieldValue("fixedClassId", undefined)
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
                label: [i.code, i.userProfile?.fullname].filter(Boolean).join(" - "),
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
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="level" label="Mức cảnh cáo học tập">
          <InputNumber
            type="number"
            placeholder="Nhập mức cảnh cáo"
            className="w-full"
            step={1}
            min={0}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="description" label="Ghi chú lý do">
          <Input.TextArea placeholder="Nhập ghi chú" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutAcademicWarning
