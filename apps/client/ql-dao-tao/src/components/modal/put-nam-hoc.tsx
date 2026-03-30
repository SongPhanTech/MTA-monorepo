import { queryClient } from "@api/index"
import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { SchoolYear } from "@workspace/db/client"
import {
  useCreateSchoolYear,
  useFindUniqueSchoolYear,
  useUpdateSchoolYear,
} from "@workspace/db/hooks"
import { Col, Form, Input, message, Radio } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
export type PutSchoolYearFormType = SchoolYear
dayjs.locale("vi")
const PutSchoolYearModal = () => {
  const [form] = Form.useForm<PutSchoolYearFormType>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutSchoolYearModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createSchoolYear } = useCreateSchoolYear()
  const { mutateAsync: updateSchoolYear } = useUpdateSchoolYear()
  async function onOk(output?: PutSchoolYearFormType) {
    if (!output) return
    try {
      showSpinner()
      const data = {
        code: output.code,
        name: output.name.trim(),
        startDate: output.startDate,
        endDate: output.endDate,
        description: output.description,
        active: output.active,
      }
      if (id) {
        await updateSchoolYear({
          data,
          where: {
            id,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createSchoolYear({
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

  const { data: level } = useFindUniqueSchoolYear(
    {
      where: { id },
    },
    { enabled: !!id }
  )
  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (level) {
      form.setFieldsValue({
        ...level,
        startDate: dayjs(level.startDate),
        endDate: level.endDate ? dayjs(level.endDate) : undefined,
      })
    } else {
      form.setFieldsValue({
        active: true,
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
      title={id ? "Chỉnh sửa năm học" : "Thêm mới năm học"}
      className="w-[30vw]"
    >
      <Col span={24}>
        <FormItem form={form} name="code" label="Mã năm học" required>
          <Input placeholder="Nhập mã năm học" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên năm học" required>
          <Input placeholder="Nhập tên năm học" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="startDate" label="Ngày bắt đầu" required>
          <DatePicker
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            className="w-full"
            placeholder="Chọn ngày bắt đầu"
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="endDate" label="Ngày kết thúc">
          <DatePicker
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            className="w-full"
            disabledDate={(current) => {
              const startTime = form.getFieldValue("startDate")
              if (!startTime) return false
              return current && current < dayjs(startTime).startOf("day")
            }}
            placeholder="Chọn ngày kết thúc"
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
      {id && (
        <Col span={24}>
          <FormItem form={form} name={"active"} label="Trạng thái" required>
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

export default PutSchoolYearModal
