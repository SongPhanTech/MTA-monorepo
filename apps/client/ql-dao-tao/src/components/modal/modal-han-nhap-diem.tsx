import type { SubjectClass } from "@workspace/db/client"
import { Col, DatePicker, Form, message } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { useFindUniqueSubjectClass, useUpdateSubjectClass } from "@workspace/db/hooks"
import { useWatch } from "antd/es/form/Form"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutSubjectClass = SubjectClass

dayjs.extend(customParseFormat)

const HanNhapDiem = () => {
  const [form] = Form.useForm<PutSubjectClass>()
  const scoreDeadline = useWatch("scoreDeadline", form)
  const examScoreDeadline = useWatch("examScoreDeadline", form)

  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "HanNhapDiem",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { data: initialValue, refetch } = useFindUniqueSubjectClass(
    {
      where: { id },
    },
    { enabled: !!id }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue({
        ...initialValue,
        scoreDeadline: initialValue.scoreDeadline ? dayjs(initialValue.scoreDeadline) : undefined,
        examScoreDeadline: initialValue.examScoreDeadline
          ? dayjs(initialValue.examScoreDeadline)
          : undefined,
      })
    }
  }, [initialValue])

  const { mutateAsync: update } = useUpdateSubjectClass()

  async function onOk(output?: SubjectClass) {
    if (!output) return
    try {
      showSpinner()
      const data = {
        scoreDeadline: output?.scoreDeadline,
        examScoreDeadline: output?.examScoreDeadline,
      }
      if (id) {
        await update({
          data,
          where: {
            id,
          },
        })
        message.success("Cập nhật thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["SubjectClass"],
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

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={"Điều chỉnh hạn nhập điểm"}
      width={600}
    >
      <Col span={24}>
        <FormItem form={form} label="Hạn nhập điểm ĐQT" name="scoreDeadline" labelAlign="left">
          <DatePicker
            style={{ width: "100%" }}
            placeholder="Chọn ngày"
            format="DD/MM/YYYY"
            value={scoreDeadline}
            onChange={(date) => {
              form.setFieldsValue({
                scoreDeadline: date ? dayjs(date) : null,
              })
            }}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} label="Hạn nhập điểm thi " name="examScoreDeadline" labelAlign="left">
          <DatePicker
            style={{ width: "100%" }}
            placeholder="Chọn ngày"
            format="DD/MM/YYYY"
            value={examScoreDeadline}
            onChange={(date) => {
              form.setFieldsValue({
                examScoreDeadline: date ? dayjs(date) : null,
              })
            }}
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default HanNhapDiem
