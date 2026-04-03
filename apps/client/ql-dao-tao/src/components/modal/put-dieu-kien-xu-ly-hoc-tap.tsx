import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { AcademicActionCondition } from "@workspace/db/client"
import {
  useCreateAcademicActionCondition,
  useFindUniqueAcademicActionCondition,
  useUpdateAcademicActionCondition,
} from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message, Radio, Select } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import { useCriteriaFieldOptions } from "@hooks/criteriaField"
import { useCriteriaOperatorOptions } from "@hooks/criteriaOperator"
export type PutAcademicActionConditionFromType = AcademicActionCondition

type AcademicActionConditionInput = {
  id: string
  ruleSetId: string
}

dayjs.locale("vi")
const PutAcademicActionCondition = () => {
  const [form] = Form.useForm<PutAcademicActionConditionFromType>()
  const { options: criteriaFieldOptions } = useCriteriaFieldOptions()
  const { options: criteriaOperatorOptions } = useCriteriaOperatorOptions()
  const { isOpen, onClose, input } = useDisclosure<AcademicActionConditionInput>({
    tag: "PutAcademicActionCondition",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createAcademicActionCondition } = useCreateAcademicActionCondition()
  const { mutateAsync: updateAcademicActionCondition } = useUpdateAcademicActionCondition()
  async function onOk(output: PutAcademicActionConditionFromType) {
    if (!output) return
    try {
      showSpinner()
      if (!input?.ruleSetId) {
        message.error("Thiếu mã ộ quy tắc")
        hideSpinner()
        return
      }
      const data = {
        ...output,
        ruleSetId: input.ruleSetId,
      }
      if (input?.id) {
        await updateAcademicActionCondition({ data, where: { id: input?.id } })
        message.success("Cập nhật thành công")
      } else {
        await createAcademicActionCondition({ data })
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["AcademicActionCondition"],
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

  const { data: initialValue } = useFindUniqueAcademicActionCondition(
    {
      where: { id: input?.id },
    },
    { enabled: !!input?.id }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue({
        ...initialValue,
        // invert: initialValue.invert,
        isPriorityStudent: initialValue.isPriorityStudent,
      })
    } else {
      form.setFieldsValue({ active: true, /* invert: false, */ isPriorityStudent: false })
    }
  }, [initialValue])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={input?.id ? "Chỉnh sửa điều kiện" : "Thêm mới điều kiện"}
    >
      <Col span={24}>
        <FormItem form={form} label="Trường dữ liệu để kiểm tra" name="field" required>
          <Select
            placeholder="Chọn trường dữ liệu để kiểm tra"
            options={criteriaFieldOptions}
            allowClear
          />
        </FormItem>
      </Col>
      {/* <Col span={8}>
                <FormItem
                    form={form}
                    name="invert"
                    valuePropName="checked"
                    className="mb-0"
                    label="Đảo ngược so sánh"
                >
                    <Checkbox />
                </FormItem>
            </Col> */}
      <Col span={8}>
        <FormItem form={form} label="So sánh" name="operator" required>
          <Select placeholder="Chọn so sánh" options={criteriaOperatorOptions} allowClear />
        </FormItem>
      </Col>
      <Col span={8}>
        <FormItem form={form} name="value" label="Giá trị để so sánh" required>
          <InputNumber
            min={0}
            type="number"
            placeholder="Nhập giá trị ngưỡng"
            className="w-full"
            step={1}
          />
        </FormItem>
      </Col>
      <Col span={8}>
        <FormItem form={form} name="yearCondition" label="Áp dụng cho sinh viên năm thứ...">
          <InputNumber
            min={0}
            type="number"
            placeholder="Nhập giá trị ngưỡng"
            className="w-full"
            step={1}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        {/* <FormItem
                    form={form}
                    name="isPriorityStudent"
                    valuePropName="checked"
                    className="mb-0"
                    label="Áp dụng cho đối tượng ưu tiên"
                >
                    <Checkbox />
                </FormItem> */}
      </Col>
      <Col span={24}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
      {input?.id && (
        <Col span={12}>
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

export default PutAcademicActionCondition
