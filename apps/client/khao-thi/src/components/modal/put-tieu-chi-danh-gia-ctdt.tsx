import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { CriterionCatalog } from "@workspace/db"
import {
  useCountCriterionCatalog,
  useCreateCriterionCatalog,
  useFindUniqueCriterionCatalog,
  useUpdateCriterionCatalog,
} from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutCriterionCatalogType = CriterionCatalog
const PutCriterionCatalog = () => {
  const [form] = Form.useForm<PutCriterionCatalogType>()
  const { isOpen, onClose, input } = useDisclosure<{
    id: string
    standardId: string
  }>({
    tag: "PutCriterionCatalog",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createCriterionCatalog } = useCreateCriterionCatalog()
  const { mutateAsync: updateCriterionCatalog } = useUpdateCriterionCatalog()
  async function onOk(output?: PutCriterionCatalogType) {
    if (!output) return
    try {
      showSpinner()
      const data = {
        order: output.order,
        name: output.name.trim(),
        standardId: input?.standardId || "",
      }
      if (input?.id) {
        await updateCriterionCatalog({
          data,
          where: {
            id: input?.id,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createCriterionCatalog({
          data,
        })
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["CriterionCatalog"],
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

  const { data: initialValue } = useFindUniqueCriterionCatalog(
    {
      where: { id: input?.id },
    },
    {
      enabled: !!input?.id,
    }
  )

  const { data: count } = useCountCriterionCatalog(
    {
      where: {
        deletedAt: null,
        standardId: input?.standardId,
      },
    },
    { enabled: !!input?.standardId }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue({ ...initialValue })
    } else if (count !== undefined) {
      form.setFieldsValue({ order: count + 1 })
    }
  }, [initialValue, count])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={input?.id ? "Chỉnh sửa tiêu chí" : "Thêm mới tiêu chí"}
      className="w-[50vw]"
    >
      <Col span={24}>
        <FormItem form={form} name="order" label="Thứ tự" required>
          <InputNumber
            min={0}
            type="number"
            className="w-full"
            step={1}
            placeholder="Nhập thứ tự"
            defaultValue={count || 0 + 1}
            disabled
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên tiêu chí" required>
          <Input.TextArea rows={2} placeholder="Nhập tên tiêu chí" spellCheck={false} />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutCriterionCatalog
