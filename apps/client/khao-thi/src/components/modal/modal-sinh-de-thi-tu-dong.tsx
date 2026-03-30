import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { useGenExamBank } from "@workspace/libs/api/exam"
import { Col, Form, InputNumber, message, Radio } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

export type ModalSinhDeThiTuDongType = {
  examId: string
  nOfnExamBank: number
  replace?: boolean
}
const ModalSinhDeThiTuDong = () => {
  const [form] = Form.useForm<ModalSinhDeThiTuDongType>()
  const {
    isOpen,
    onClose,
    input: examId,
  } = useDisclosure<string>({
    tag: "ModalSinhDeThiTuDong",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: genExamBank } = useGenExamBank()

  async function onOk(output?: ModalSinhDeThiTuDongType) {
    if (!output) return
    try {
      showSpinner()
      if (!examId) {
        message.error("Thiếu mã kỳ thi")
        hideSpinner()
        return
      }
      const data = {
        examId,
        nOfnExamBank: output?.nOfnExamBank,
        replace: output?.replace || false,
      }

      const res = await genExamBank({ data })
      if (res.status === 400 || res.status === 404) {
        message.error(res.data.message)
        return
      }
      message.success("Tạo đề thành công")

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
      title={"Tạo đề tự động"}
      className="w-[30vw]"
      okText="Xác nhận"
    >
      <Col span={24}>
        <FormItem form={form} name="nOfnExamBank" label="Số lượng đề thi" required>
          <InputNumber type="number" step={1} min={1} className="w-full" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name={"replace"} label="Xoá đề thi cũ nếu có">
          <Radio.Group buttonStyle="solid" defaultValue={false}>
            <Radio value={true}>Có</Radio>
            <Radio value={false}>Không</Radio>
          </Radio.Group>
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default ModalSinhDeThiTuDong
