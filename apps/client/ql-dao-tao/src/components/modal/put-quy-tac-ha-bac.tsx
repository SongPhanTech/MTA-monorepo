import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { GraduationRankDowngradeCondition } from "@workspace/db/client"
import {
  useCreateGraduationRankDowngradeCondition,
  useFindManyCriteriaDefinition,
  useFindUniqueGraduationRankDowngradeCondition,
  useUpdateGraduationRankDowngradeCondition,
} from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message, Radio } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import "./index.css"
import Select from "@components/commons/select"
import { useCriteriaOperatorOptions } from "@hooks/criteriaOperator"
export type PutRankDowngradeCondition = GraduationRankDowngradeCondition
dayjs.locale("vi")

type GraduationRankDowngradeConditionInput = {
  downgradeRuleId: string
  downgradeConditionId: string
}

const PutRankDowngradeCondition = () => {
  const [form] = Form.useForm<PutRankDowngradeCondition>()
  const { options: criteriaOperatorOptions } = useCriteriaOperatorOptions()

  const { isOpen, onClose, input } = useDisclosure<GraduationRankDowngradeConditionInput>({
    tag: "PutRankDowngradeCondition",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createRankDowngradeCondition } = useCreateGraduationRankDowngradeCondition()
  const { mutateAsync: updateRankDowngradeCondition } = useUpdateGraduationRankDowngradeCondition()
  async function onOk(output?: PutRankDowngradeCondition) {
    if (!output) return
    try {
      showSpinner()
      if (!input?.downgradeRuleId) {
        message.error("Thiếu mã bộ quy tắc")
        hideSpinner()
        return
      }
      const data = {
        code: output?.code,
        criteriaId: output?.criteriaId,
        // invert: output?.invert,
        operator: output?.operator,
        value: output?.value,
        description: output?.description,
        active: output?.active,
      }
      if (input?.downgradeConditionId) {
        await updateRankDowngradeCondition({
          data,
          where: {
            id: input?.downgradeConditionId,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createRankDowngradeCondition({
          data: { ...data, downgradeRuleId: input.downgradeRuleId },
        })
        message.success("Thêm mới thành công")
      }
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

  const { data: initialValue } = useFindUniqueGraduationRankDowngradeCondition(
    {
      where: { id: input?.downgradeConditionId },
    },
    { enabled: !!input?.downgradeConditionId }
  )

  // Danh mục tiêu chí: đang hoạt động, hoặc tiêu chí đang gắn với điều kiện đang sửa
  const { data: criteriaList = [] } = useFindManyCriteriaDefinition(
    {
      where: {
        OR: [
          { active: true },
          ...(initialValue?.criteriaId ? [{ id: initialValue.criteriaId }] : []),
        ],
      },
      select: { id: true, name: true, source: true },
      orderBy: [{ source: "asc" }, { name: "asc" }],
    },
    { enabled: isOpen }
  )
  const criteriaOptions = [
    {
      label: "Tiêu chí tự định nghĩa",
      options: criteriaList
        .filter((item) => item.source === "CUSTOM")
        .map((item) => ({ value: item.id, label: item.name })),
    },
    {
      label: "Tiêu chí hệ thống",
      options: criteriaList
        .filter((item) => item.source === "SYSTEM")
        .map((item) => ({ value: item.id, label: item.name })),
    },
  ].filter((group) => group.options.length > 0)

  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue({
        ...initialValue,
        // invert: initialValue.invert,
      })
    } else {
      form.setFieldsValue({
        active: true,
        // invert: false,
      })
    }
  }, [initialValue, form])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={input?.downgradeConditionId ? "Sửa tiêu chí bộ quy tắc " : "Thêm tiêu chí bộ quy tắc"}
    >
      <Col span={12}>
        <FormItem form={form} label="Tiêu chí được đánh giá" name="criteriaId" required>
          <Select placeholder="Chọn tiêu chí" options={criteriaOptions} allowClear />
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
        <FormItem form={form} name="value" label="Giá trị ngưỡng để so sánh" required>
          <InputNumber
            min={0}
            type="number"
            placeholder="Nhập giá trị ngưỡng"
            className="w-full"
            step={0.1}
          />
        </FormItem>
      </Col>
      {input?.downgradeConditionId && (
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

export default PutRankDowngradeCondition
