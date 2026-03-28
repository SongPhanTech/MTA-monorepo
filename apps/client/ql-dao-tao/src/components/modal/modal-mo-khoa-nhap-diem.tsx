import type { SubjectClass } from "@workspace/db/client"
import { Col, Form, message, Radio } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { useFindUniqueSubjectClass, useUpdateSubjectClass } from "@workspace/db/hooks"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutSubjectClass = SubjectClass

dayjs.extend(customParseFormat)

const MoKhoaNhapDiem = () => {
  const [form] = Form.useForm<PutSubjectClass>()

  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "MoKhoaNhapDiem",
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
        isLockScore: initialValue.isLockScore,
        isLockExamScore: initialValue.isLockExamScore,
      })
    }
  }, [initialValue])

  const { mutateAsync: update } = useUpdateSubjectClass()

  async function onOk(output?: SubjectClass) {
    if (!output) return
    try {
      showSpinner()
      const data = {
        isLockScore: output?.isLockScore,
        isLockExamScore: output?.isLockExamScore,
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
      title={"Điều chỉnh mở khoá nhập điểm"}
      width={600}
    >
      <Col span={24}>
        <FormItem form={form} label="Khoá điểm ĐQT" labelAlign="left" name="isLockScore">
          <Radio.Group
            onChange={(e) => {
              form.setFieldsValue({
                isLockScore: e.target.value,
              })
            }}
          >
            <Radio value={true}>Đã khoá</Radio>
            <Radio value={false}>Chưa khoá</Radio>
          </Radio.Group>
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem form={form} label="Khoá điểm thi" name="isLockExamScore" labelAlign="left">
          <Radio.Group
            onChange={(e) => {
              form.setFieldsValue({
                isLockExamScore: e.target.value,
              })
            }}
          >
            <Radio value={true}>Đã khoá</Radio>
            <Radio value={false}>Chưa khoá</Radio>
          </Radio.Group>
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default MoKhoaNhapDiem
