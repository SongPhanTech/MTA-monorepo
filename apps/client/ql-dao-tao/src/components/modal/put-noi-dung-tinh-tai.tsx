import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { LoadCategory } from "@workspace/db/client"
import {
  useCreateLoadCategory,
  useFindUniqueLoadCategory,
  useUpdateLoadCategory,
} from "@workspace/db/hooks"
import { Checkbox, Col, Form, Input, InputNumber, message, Radio } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"

dayjs.locale("vi")
const PutNoiDungTinhTaiModal = () => {
  const [form] = Form.useForm<LoadCategory>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutNoiDungTinhTaiModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createLoadCategory } = useCreateLoadCategory()
  const { mutateAsync: updateLoadCategory } = useUpdateLoadCategory()

  async function onOk({ ...rest }: LoadCategory) {
    try {
      showSpinner()
      if (id) {
        await updateLoadCategory({
          data: {
            ...rest,
          },
          where: { id },
        })
        message.success("Cập nhật thành công")
      } else {
        await createLoadCategory({
          data: {
            ...rest,
          },
        })
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["TrainingType"],
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

  const { data: detail } = useFindUniqueLoadCategory(
    {
      where: { id },
    },
    { enabled: !!id }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (detail) {
      form.setFieldsValue({
        ...detail,
      })
    } else {
      form.setFieldsValue({
        active: true,
      })
    }
  }, [detail])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa nội dung tính tải" : "Thêm mới nội dung tính tải"}
      className="w-[60vw]"
      formProps={{
        initialValues: {
          isOverageCalculated: false,
        },
      }}
    >
      <Col span={12}>
        <FormItem form={form} name="name" label="Tên nội dung tính tải" required>
          <Input placeholder="Nhập tên nội dung tính tải" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="category" label="Loại nội dung tính tải" required>
          <Input placeholder="Nhập loại nội dung tính tải" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="unit" label="Đơn vị tính tải" required>
          <Input placeholder="Nhập đơn vị tính tải" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="standardHours" label="Số quy giờ chuẩn" required>
          <InputNumber className="w-full" placeholder="Nhập số quy giờ chuẩn" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem
          form={form}
          name="isOverageCalculated"
          label=" "
          colon={false}
          valuePropName="checked"
        >
          <Checkbox>Cho phép tính vượt định mức</Checkbox>
        </FormItem>
      </Col>
      {id && (
        <Col span={12}>
          <FormItem form={form} name={"active"} label="Trạng thái">
            <Radio.Group buttonStyle="solid">
              <Radio value={true}>Đang hoạt động</Radio>
              <Radio value={false}>Ngừng hoạt động</Radio>
            </Radio.Group>
          </FormItem>
        </Col>
      )}
    </PutFormModal>
  )
}

export default PutNoiDungTinhTaiModal
