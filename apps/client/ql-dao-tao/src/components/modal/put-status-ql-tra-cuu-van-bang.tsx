import { queryClient } from "@api/index"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { DiplomaVerificationApplication } from "@workspace/db/client"
import {
  useFindUniqueDiplomaVerificationApplication,
  useUpdateDiplomaVerificationApplication,
} from "@workspace/db/hooks"
import { Col, Form, message, Select } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import FormItem from "@components/commons/form-item"
import { useDiplomaVerificationStatusOptions } from "@hooks/diplomaVerificationStatus"

dayjs.locale("vi")
const PutStatusQLTraCuuVanBang = () => {
  const [form] = Form.useForm<DiplomaVerificationApplication>()
  const { diplomaVerificationStatusOptions } = useDiplomaVerificationStatusOptions()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutStatusQLTraCuuVanBang",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: updateDiplomaVerificationApplication } =
    useUpdateDiplomaVerificationApplication()
  async function onOk(data?: DiplomaVerificationApplication) {
    if (!data) return
    try {
      showSpinner()
      if (id) {
        await updateDiplomaVerificationApplication({ data, where: { id } })
        message.success("Cập nhật thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["DiplomaVerificationApplication"],
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

  const { data: initialValue } = useFindUniqueDiplomaVerificationApplication(
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
      })
    }
  }, [initialValue])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={"Cập nhật trạng thái tra cứu văn bằng"}
      className="w-[30vw]"
    >
      <Col span={24}>
        <FormItem form={form} name="status" label="Trạng thái">
          <Select
            placeholder="Chọn trạng thái"
            options={diplomaVerificationStatusOptions?.map((item) => ({
              label: item.label,
              value: item.value,
            }))}
            allowClear
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutStatusQLTraCuuVanBang
