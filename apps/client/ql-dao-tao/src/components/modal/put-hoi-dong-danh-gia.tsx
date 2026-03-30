import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { Council } from "@workspace/db/client"
import { useCreateCouncil, useFindUniqueCouncil, useUpdateCouncil } from "@workspace/db/hooks"
import { Col, Form, message } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import "./index.css"
import DatePicker from "@components/commons/date-picker"
import Select from "@components/commons/select"
import { useCouncilProposalStatusOptions } from "@hooks/councilProposalStatus"
export type PutCouncil = Council
dayjs.locale("vi")

type CouncilInput = {
  thesisProjectId: string
  councilId: string
}

const PutCouncil = () => {
  const [form] = Form.useForm<PutCouncil>()
  const { councilProposalStatusOptions } = useCouncilProposalStatusOptions()
  const { isOpen, onClose, input } = useDisclosure<CouncilInput>({
    tag: "PutCouncil",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createCouncil } = useCreateCouncil()
  const { mutateAsync: updateCouncil } = useUpdateCouncil()
  async function onOk(output?: PutCouncil) {
    if (!output) return
    try {
      showSpinner()
      if (!input?.thesisProjectId) {
        message.error("Không tìm thấy mẫ đồ án")
        hideSpinner()
        return
      }
      const data = {
        proposedDate: output.proposedDate,
        status: output.status,
      }
      if (input?.councilId) {
        await updateCouncil({
          data: {
            ...data,
          },
          where: {
            id: input?.councilId,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createCouncil({
          data: {
            ...data,
            thesis: { connect: { id: input.thesisProjectId } },
          },
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

  const { data: council } = useFindUniqueCouncil(
    {
      where: { id: input?.councilId },
    },
    { enabled: !!input?.councilId }
  )

  useEffect(() => {
    if (council) {
      form.setFieldsValue({
        ...council,
        proposedDate: council.proposedDate ? dayjs(council.proposedDate) : undefined,
      })
    }
  }, [council, form])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={input?.councilId ? "Sửa hội đồng" : "Thêm hội đồng"}
    >
      <Col span={12}>
        <FormItem form={form} name="proposedDate" label="Ngày đề xuất">
          <DatePicker
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            className="w-full"
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="status" label="Trạng thái">
          <Select
            placeholder="Chọn trạng thái"
            options={councilProposalStatusOptions?.map((item) => ({
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

export default PutCouncil
