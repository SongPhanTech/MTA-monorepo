import Select from "@components/commons/select"
import { useCloneCurriculumVersion } from "@hooks/copyCurriculumVersion"
import { useFindManyCurriculum } from "@workspace/db/hooks"
import { FormItem, PutFormModal, useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, Form } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const ModalChuyenCTDT = () => {
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const [form] = Form.useForm<{
    curriculumId: string
  }>()

  const { isOpen, onClose, input } = useDisclosure<{
    id: string
  }>({
    tag: "ModalChuyenCTDT",
    onClose: form.resetFields,
  })

  const { data = [] } = useFindManyCurriculum({
    where: {
      trainingObjectTypeId,
    },
  })

  const { handleCloneCurriculumVersion } = useCloneCurriculumVersion()

  const onOk = async (values: { curriculumId: string }) => {
    if (!input?.id) return
    await handleCloneCurriculumVersion(input.id, values.curriculumId)
    onClose()
  }

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      maskClosable={true}
      onCancel={onClose}
      title="Chọn khung chương trình đào tạo"
      layout="horizontal"
      className="w-[30vw]"
    >
      <Col span={24}>
        <FormItem form={form} name="curriculumId" label="Khung chương trình đào tạo">
          <Select
            placeholder="Chọn khung chương trình đào tạo"
            options={data.map((item) => ({
              label: `Khung: ${[item.code, item.name].filter(Boolean).join(" - ")}`,
              value: item.id,
            }))}
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default ModalChuyenCTDT
