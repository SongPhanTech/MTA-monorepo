import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { AcademicWarningRule } from "@workspace/db/client"
import {
  useCreateAcademicWarningRule,
  useFindUniqueAcademicWarningRule,
  useUpdateAcademicWarningRule,
} from "@workspace/db/hooks"
import { Checkbox, Col, Form, Input, InputNumber, message, Radio } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import { queryClient } from "@api/index"
import Select from "@components/commons/select"
import { useCriteriaFieldOptions } from "@hooks/criteriaField"
import { useCriteriaOperatorOptions } from "@hooks/criteriaOperator"
export type PutAcademicWarningRule = AcademicWarningRule
dayjs.locale("vi")

type AcademicWarningRuleInput = {
  trainingCourseId: string
  academicWarningRuleId: string
}

const PutAcademicWarningRule = () => {
  const [form] = Form.useForm<PutAcademicWarningRule>()
  const { options: criteriaFieldOptions } = useCriteriaFieldOptions()
  const { options: criteriaOperatorOptions } = useCriteriaOperatorOptions()

  const { isOpen, onClose, input } = useDisclosure<AcademicWarningRuleInput>({
    tag: "PutAcademicWarningRule",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createAcademicWarningRule } = useCreateAcademicWarningRule()
  const { mutateAsync: updateAcademicWarningRule } = useUpdateAcademicWarningRule()
  async function onOk(output?: PutAcademicWarningRule) {
    if (!output) return
    try {
      showSpinner()
      if (!input?.trainingCourseId) {
        message.error("Thiếu mã khoá học")
        hideSpinner()
        return
      }
      const data = {
        code: output?.code,
        trainingCourseId: input.trainingCourseId,
        field: output?.field,
        operator: output?.operator,
        threshold: output?.threshold,
        // tuple: output?.tuple,
        severity: output?.severity,
        yearCondition: output?.yearCondition,
        semesterCondition: output?.semesterCondition,
        description: output?.description,
        active: output?.active,
      }
      if (input?.academicWarningRuleId) {
        await updateAcademicWarningRule({
          data,
          where: { id: input?.academicWarningRuleId },
        })
        message.success("Cập nhật thành công")
      } else {
        await createAcademicWarningRule({
          data,
        })
        message.success("Thêm mới thành công")
      }
      // refetch() lại danh sách level
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

  const { data: initialValue } = useFindUniqueAcademicWarningRule(
    {
      where: { id: input?.academicWarningRuleId },
    },
    { enabled: !!input?.academicWarningRuleId }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue({
        ...initialValue,
      })
    } else {
      form.setFieldsValue({
        active: true,
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
      title={
        input?.academicWarningRuleId
          ? "Sửa quy tắc cảnh báo học tập"
          : "Thêm quy tắc cảnh báo học tập"
      }
    >
      <Col span={12}>
        <FormItem form={form} label="Trường được đánh giá" name="field" required>
          <Select
            placeholder="Chọn trường được đánh giá"
            options={criteriaFieldOptions}
            allowClear
          />
        </FormItem>
      </Col>
      {/* <Col span={12}>
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
      <Col span={12}>
        <FormItem form={form} label="So sánh" name="operator" required>
          <Select placeholder="Chọn so sánh" options={criteriaOperatorOptions} allowClear />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="threshold" label="Giá trị ngưỡng để so sánh" required>
          <InputNumber
            type="number"
            placeholder="Nhập giá trị ngưỡng"
            className="w-full"
            step={1}
            min={0}
          />
        </FormItem>
      </Col>
      {/* <Col span={24}>
                <FormItem form={form} name="tuple" label="Giá trị sử dụng cho operator IN">
                    <Input.TextArea placeholder="Nhập mô tả" />
                </FormItem>
            </Col> */}
      <Col span={12}>
        <FormItem form={form} name="severity" label="Mức độ cảnh cáo sẽ tăng nếu vi phạm" required>
          <InputNumber
            type="number"
            placeholder="Nhập mức độ cảnh cáo sẽ tăng"
            className="w-full"
            step={1}
            min={1}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="yearCondition" label="Áp dụng cho sinh viên năm thứ...">
          <InputNumber
            type="number"
            placeholder="Nhập thứ tự"
            className="w-full"
            step={1}
            min={1}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="semesterCondition" label="Áp dụng cho học kỳ thứ ... trong năm">
          <InputNumber
            type="number"
            placeholder="Nhập thứ tự"
            className="w-full"
            step={1}
            min={1}
          />
        </FormItem>
      </Col>
      {input?.academicWarningRuleId && (
        <Col span={12}>
          <FormItem form={form} name={"active"} label="Trạng thái" required>
            <Radio.Group buttonStyle="solid">
              <Radio value={true}>Đang hoạt động</Radio>
              <Radio value={false}>Ngừng hoạt động</Radio>
            </Radio.Group>
          </FormItem>
        </Col>
      )}
      <Col span={24}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutAcademicWarningRule
