import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { SurveyTopic } from "@workspace/db"
import {
  useCreateSurveyTopic,
  useFindUniqueSurveyTopic,
  useUpdateSurveyTopic,
} from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutSurveyTopicType = SurveyTopic
const PutSurveyTopicModal = () => {
  const [form] = Form.useForm<PutSurveyTopicType>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutSurveyTopicModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: create } = useCreateSurveyTopic()
  const { mutateAsync: update } = useUpdateSurveyTopic()
  async function onOk(output?: PutSurveyTopicType) {
    if (!output) return
    try {
      showSpinner()
      if (id) {
        await update({
          data: {
            code: output.code,
            name: output.name.trim(),
            description: output.description,
            type: output.type,
          },
          where: {
            id,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await create({
          data: {
            code: output.code,
            name: output.name.trim(),
            description: output.description,
            type: output.type,
          },
        })
        message.success("Thêm mới thành công")
      }
      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["Level"],
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

  const { data: surveyObjectType } = useFindUniqueSurveyTopic(
    {
      where: { id },
    },
    {
      enabled: !!id,
    }
  )
  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (surveyObjectType) {
      form.setFieldsValue(surveyObjectType)
    }
  }, [surveyObjectType])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa chủ đề khảo sát" : "Thêm mới chủ đề khảo sát"}
      className="w-[30vw]"
    >
      <Col span={24}>
        <FormItem form={form} name="code" label="Mã chủ đề khảo sát" required>
          <Input placeholder="Nhập mã chủ đề khảo sát" disabled={!!id} />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên chủ đề khảo sát" required>
          <Input placeholder="Nhập tên chủ đề khảo sát" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="type" label="Loại khảo sát" required>
          <Select
            options={[
              {
                label: "Khảo sát chung",
                value: "SINGLE",
              },
              {
                label: "Khảo sát giảng viên",
                value: "CLUSTER",
              },
            ]}
            placeholder="Nhập loại khảo sát"
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutSurveyTopicModal
