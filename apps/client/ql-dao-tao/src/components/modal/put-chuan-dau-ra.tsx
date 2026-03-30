import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { useFindUniqueStudent, useUpdateStudent } from "@workspace/db/hooks"
import { Form, message, Switch } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import { CheckOutlined, CloseOutlined } from "@ant-design/icons"
import { useEffect } from "react"
export type StudentOutputStandards = {
  foreignLangPass: boolean
  ITCertificationPass: boolean
}

const PutChuanDauRaModal = () => {
  const [form] = Form.useForm<StudentOutputStandards>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutChuanDauRaModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: updateStudent } = useUpdateStudent()

  async function onOk(data?: StudentOutputStandards) {
    if (!data) return

    try {
      showSpinner()
      const submitData = {
        ...data,
        foreignLangPass: !data.foreignLangPass,
        ITCertificationPass: !data.ITCertificationPass,
      }

      await updateStudent({
        data: submitData,
        where: { id },
      })

      message.success("Cập nhật thành công")
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

  const { data: initialValue } = useFindUniqueStudent(
    {
      where: { id },
    },
    {
      enabled: !!id,
    }
  )
  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (isOpen && initialValue) {
      form.setFieldsValue({
        foreignLangPass: !initialValue.foreignLangPass,
        ITCertificationPass: !initialValue.ITCertificationPass,
      })
    }
  }, [isOpen, initialValue])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={"Cập nhật chuẩn đầu ra"}
      layout="horizontal"
      rowWrap={false}
    >
      <FormItem
        form={form}
        name="foreignLangPass"
        label="Đạt chuẩn ngoại ngữ"
        valuePropName="checked"
      >
        <Switch
          className="ml-auto"
          checkedChildren={<CheckOutlined />}
          unCheckedChildren={<CloseOutlined />}
        />
      </FormItem>

      <FormItem
        form={form}
        name="ITCertificationPass"
        label="Đạt chuẩn tin học"
        valuePropName="checked"
      >
        <Switch
          className="ml-auto"
          checkedChildren={<CheckOutlined />}
          unCheckedChildren={<CloseOutlined />}
        />
      </FormItem>
    </PutFormModal>
  )
}

export default PutChuanDauRaModal
