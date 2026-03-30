import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { Certificate } from "@workspace/db/client"
import {
  useCreateCertificate,
  useFindUniqueCertificate,
  useUpdateCertificate,
} from "@workspace/db/hooks"
import { Col, Form, Input, message, Radio } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutCertificate = Certificate
dayjs.locale("vi")

const PutCertificateScoreModal = () => {
  const [form] = Form.useForm<PutCertificate>()
  const [_targetDisabled, setTargetDisabled] = useState(true)
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutCertificateScoreModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createCertificate } = useCreateCertificate()
  const { mutateAsync: updateCertificate } = useUpdateCertificate()
  async function onOk({ ...rest }: PutCertificate) {
    try {
      showSpinner()
      if (id) {
        await updateCertificate({
          data: {
            name: rest.name,
            isUsingScore: rest.isUsingScore,
          },
          where: { id },
        })
        message.success("Cập nhật thành công")
      } else {
        await createCertificate({
          data: rest,
        })
        message.success("Thêm mới thành công")
      }
      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["Certificate"],
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

  const { data: level } = useFindUniqueCertificate(
    {
      where: { id },
    },
    { enabled: !!id }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (level) {
      setTargetDisabled(false)
      form.setFieldsValue({
        ...level,
      })
    } else {
      form.setFieldsValue({
        active: true,
        isUsingScore: true,
      })
    }
  }, [level])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa điểm chứng chỉ" : "Thêm mới điểm chứng chỉ"}
      className="w-[500px]"
    >
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên chứng chỉ" required>
          <Input placeholder="Nhập tên chứng chỉ" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="isUsingScore" label="Phương thức phiên điểm" required>
          <Radio.Group>
            <Radio value={true}>Điểm</Radio>
            <Radio value={false}>Đạt/Không đạt</Radio>
          </Radio.Group>
        </FormItem>
      </Col>
      {/* <Col span={24}>
                <FormItem form={form} name="finalScore" label="Điểm tương đương">
                    <InputNumber
                        type="number"
                        placeholder="Nhập điểm tương đương"
                        className="w-full"
                        min={0}
                        max={10}
                        step={0.1}
                    />
                </FormItem>
            </Col> */}
    </PutFormModal>
  )
}

export default PutCertificateScoreModal
