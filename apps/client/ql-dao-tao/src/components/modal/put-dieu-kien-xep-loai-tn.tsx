import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { RankingCondition } from "@workspace/db/client"
import {
  useCreateRankingCondition,
  useFindUniqueRankingCondition,
  useUpdateRankingCondition,
} from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message, Radio } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import "./index.css"
import Select from "@components/commons/select"
import { useCriteriaFieldOptions } from "@hooks/criteriaField"
import { useCriteriaOperatorOptions } from "@hooks/criteriaOperator"
export type PutRankingCondition = RankingCondition
dayjs.locale("vi")

type RankingConditionInput = {
  rankingId: string
  rankingConditionId: string
}

const PutRankingCondition = () => {
  const [form] = Form.useForm<PutRankingCondition>()
  const { options: criteriaFieldOptions } = useCriteriaFieldOptions()
  const { options: criteriaOperatorOptions } = useCriteriaOperatorOptions()

  const { isOpen, onClose, input } = useDisclosure<RankingConditionInput>({
    tag: "PutRankingCondition",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createRankingCondition } = useCreateRankingCondition()
  const { mutateAsync: updateRankingCondition } = useUpdateRankingCondition()
  async function onOk(output?: PutRankingCondition) {
    if (!output) return
    try {
      showSpinner()
      if (!input?.rankingId) {
        message.error("Thiếu xếp loại")
        hideSpinner()
        return
      }
      const data = {
        code: output?.code,
        rankingId: input.rankingId,
        field: output?.field,
        // invert: output?.invert,
        operator: output?.operator,
        value: output?.value,
        description: output?.description,
        active: output?.active,
      }
      if (input?.rankingConditionId) {
        await updateRankingCondition({
          data,
          where: {
            id: input?.rankingConditionId,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createRankingCondition({
          data,
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

  const { data: initialValue } = useFindUniqueRankingCondition(
    {
      where: { id: input?.rankingConditionId },
    },
    { enabled: !!input?.rankingConditionId }
  )

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
      title={input?.rankingConditionId ? "Sửa tiêu chí xét xếp loại" : "Thêm tiêu chí xét xếp loại"}
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
        <FormItem form={form} name="value" label="Giá trị ngưỡng để so sánh" required>
          <InputNumber
            min={0}
            type="number"
            placeholder="Nhập giá trị ngưỡng"
            className="w-full"
            step={1}
          />
        </FormItem>
      </Col>
      {input?.rankingConditionId && (
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

export default PutRankingCondition
