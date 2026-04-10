import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { validateExamScore } from "@lib/utils"
import type { StudentSubjectScore } from "@workspace/db/client"
import { useFindFirstTrainingCourse, useUpdateStudentSubjectScore } from "@workspace/db/hooks"
import { calcFinalScore } from "@workspace/libs/utils"
import { Col, Form, Input, InputNumber, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type PutEditScoreForm = {
  attendanceScore?: number
  midtermScore?: number
  examScore?: number
  description?: string
}

const { TextArea } = Input

const PutEditScoreModal = () => {
  const [form] = Form.useForm<PutEditScoreForm>()
  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: updateStudentSubjectScore } = useUpdateStudentSubjectScore()

  const { isOpen, onClose, input } = useDisclosure<{
    id: string
    list: string[]
    studentId: string
    subjectClassStudent: StudentSubjectScore
    refetch?: () => Promise<unknown>
  }>({
    tag: "PutEditScoreModal",
    onClose: form.resetFields,
  })

  const { data: trainingCourse } = useFindFirstTrainingCourse({
    where: {
      fixedClass: {
        some: {
          students: {
            some: {
              id: input?.studentId,
            },
          },
        },
      },
    },
  })

  const getScoreValue = (value: unknown): number | undefined => {
    if (typeof value === "number") return value
    if (value && typeof (value as { toNumber?: () => number }).toNumber === "function") {
      return (value as { toNumber: () => number }).toNumber()
    }
    return undefined
  }

  useEffect(() => {
    if (!isOpen || !input?.subjectClassStudent) return

    form.setFieldsValue({
      attendanceScore: getScoreValue(input.subjectClassStudent.attendanceScore),
      midtermScore: getScoreValue(input.subjectClassStudent.midtermScore),
      examScore: getScoreValue(input.subjectClassStudent.examScore),
      description: input.subjectClassStudent.description || "",
    })
  }, [form, input, isOpen])

  const onOk = async (values: PutEditScoreForm) => {
    try {
      if (!input?.id) {
        message.warning("Không tìm thấy dữ liệu điểm để cập nhật")
        return
      }

      if (
        values.attendanceScore === undefined &&
        values.midtermScore === undefined &&
        values.examScore === undefined
      ) {
        message.warning("Vui lòng nhập ít nhất một loại điểm")
        return
      }

      showSpinner()

      if (!trainingCourse) {
        message.warning("Không tìm thấy khóa huấn luyện để tính điểm tổng kết")
        return
      }

      const finalScore = calcFinalScore(
        trainingCourse,
        {
          attendanceScore: values.attendanceScore ?? null,
          midtermScore: values.midtermScore ?? null,
          examScore: values.examScore ?? null,
          certificates:
            (input?.subjectClassStudent as any)?.certificates?.map((item: any) => ({
              archivedCertificate: item.archivedCertificate,
            })) || [],
          awards:
            (input?.subjectClassStudent as any)?.awards?.map((item: any) => ({
              status: item.status,
              archivedAward: item.archivedAward,
            })) || [],
        },
        "NORMAL"
      )

      await updateStudentSubjectScore({
        where: {
          id: input.id,
        },
        data: {
          attendanceScore: values.attendanceScore ?? null,
          midtermScore: values.midtermScore ?? null,
          examScore: values.examScore ?? null,
          finalScore,
          manualFinalScore: null,
          description: values.description?.trim() || null,
        },
      })

      message.success("Cập nhật điểm quá trình thành công")

      if (input?.refetch) {
        await input.refetch()
      }

      onClose()
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error.info.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable
      title="Sửa điểm học phần"
      className="w-[620px]"
    >
      <Col span={24} className="mb-3">
        <FormItem
          form={form}
          name="attendanceScore"
          label="Điểm TX"
          rules={[
            {
              validator: (_, value) => {
                return validateExamScore(value)
              },
            },
          ]}
        >
          <InputNumber
            min={0}
            max={10}
            step={0.1}
            precision={2}
            className="w-full"
            placeholder="Nhập điểm TX"
          />
        </FormItem>
      </Col>

      <Col span={24} className="mb-3">
        <FormItem
          form={form}
          name="midtermScore"
          label="Điểm ĐK"
          rules={[
            {
              validator: (_, value) => {
                return validateExamScore(value)
              },
            },
          ]}
        >
          <InputNumber
            min={0}
            max={10}
            step={0.1}
            precision={2}
            className="w-full"
            placeholder="Nhập điểm ĐK"
          />
        </FormItem>
      </Col>

      <Col span={24} className="mb-3">
        <FormItem
          form={form}
          name="examScore"
          label="Điểm thi"
          rules={[
            {
              validator: (_, value) => {
                return validateExamScore(value)
              },
            },
          ]}
        >
          <InputNumber
            min={0}
            max={10}
            step={0.1}
            precision={2}
            className="w-full"
            placeholder="Nhập điểm thi"
          />
        </FormItem>
      </Col>

      <Col span={24} className="mb-3">
        <FormItem form={form} name="description" label="Ghi chú">
          <TextArea rows={3} placeholder="Nhập ghi chú" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutEditScoreModal
