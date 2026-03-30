import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { TrainingBlock } from "@workspace/db/client"
import {
  useCreateTrainingBlock,
  useFindManyTrainingBlock,
  useFindUniqueTrainingBlock,
  useUpdateTrainingBlock,
} from "@workspace/db/hooks"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, Form, Input, message, Radio, Select } from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import { useEffect } from "react"
export type PutTrainingBlock = TrainingBlock
dayjs.locale("vi")
const PutTrainingBlock = () => {
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const [form] = Form.useForm<PutTrainingBlock>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutTrainingBlock",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { data: trainingBlock } = useFindUniqueTrainingBlock({ where: { id } }, { enabled: !!id })
  const { data: parentTrainingBlock } = useFindManyTrainingBlock({
    where: { id: { not: id }, trainingObjectTypeId },
  })
  useEffect(() => {
    if (trainingBlock) {
      form.setFieldsValue({
        ...trainingBlock,
      })
    } else {
      form.setFieldsValue({
        active: true,
      })
    }
  }, [trainingBlock, form])

  const { mutateAsync: createTrainingBlock } = useCreateTrainingBlock()
  const { mutateAsync: updateTrainingBlock } = useUpdateTrainingBlock()
  async function onOk(output?: PutTrainingBlock) {
    if (!output) return

    try {
      showSpinner()
      const payload = {
        code: output.code,
        name: output.name.trim(),
        active: output.active,
        parentId: output.parentId,
        trainingObjectTypeId: trainingObjectTypeId ?? "",
      }

      if (id) {
        await updateTrainingBlock({
          data: payload,
          where: { id },
        })
        message.success("Cập nhật thành công")
      } else {
        await createTrainingBlock({
          data: {
            ...payload,
          },
        })
        message.success("Thêm mới thành công")
      }

      queryClient.invalidateQueries({
        queryKey: ["TrainingBlock"],
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

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa khối kiến thức CTĐT" : "Thêm mới khối kiến thức CTĐT"}
      className="min-w-[400px] w-[500px]"
    >
      <FormItem form={form} name="trainingObjectTypeId" label="Mã khối kiến thức" hidden>
        <Input value={trainingObjectTypeId} />
      </FormItem>
      <Col span={24}>
        <FormItem form={form} name="code" label="Mã khối kiến thức" required>
          <Input placeholder="Nhập mã khối kiến thức" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên khối kiến thức" required>
          <Input placeholder="Nhập tên khối kiến thức" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="parentId" label="Khối kiến thức cha">
          <Select
            placeholder="Chọn khối kiến thức cha"
            options={parentTrainingBlock?.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
        </FormItem>
      </Col>
      {/* <Col span={24}>
                <FormItem
                    form={form}
                    name="totalCredits"
                    label="Tổng tín chỉ"
                >
                    <Input placeholder="Tổng tín chỉ" />
                </FormItem>
            </Col> */}
      {/* <Col span={24}>
                <FormItem
                    form={form}
                    name="totalRequiredCredits"
                    label="Tổng tín chỉ bắt buộc"
                >
                    <Input placeholder="Tổng tín chỉ bắt buộc" />
                </FormItem>
            </Col> */}
      {/* <Col span={24}>
                <FormItem
                    form={form}
                    name="electiveCredits"
                    label="Số tín chỉ tự chọn"
                >
                    <Input placeholder="Số tín chỉ tự chọn" />
                </FormItem>
            </Col> */}
      {/* <Col span={24}>
                <FormItem
                    form={form}
                    name="specializedCredits"
                    label="Số tín chỉ chuyên ngành"
                >
                    <Input placeholder="Số tín chỉ chuyên ngành" />
                </FormItem>
            </Col> */}
      {id && (
        <Col span={24}>
          <FormItem form={form} name={"active"} label="Trạng thái" required>
            <Radio.Group buttonStyle="solid">
              <Radio value={true}>Đang đào tạo</Radio>
              <Radio value={false}>Ngừng đào tạo</Radio>
            </Radio.Group>
          </FormItem>
        </Col>
      )}
    </PutFormModal>
  )
}

export default PutTrainingBlock
