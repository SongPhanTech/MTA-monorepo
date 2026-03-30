import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import type { SurveyTopic } from "@workspace/db"
import {
  useCreateSurveyQuestionGroup,
  useFindManySurveyTopic,
  useFindUniqueSurveyQuestionGroup,
  useUpdateSurveyQuestionGroup,
} from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export type PutSurveyQuestionGroupType = {
  name: string
  surveyTopic?: string[]
  description?: string
}

const PutSurveyQuestionGroupModal = () => {
  const [form] = Form.useForm<PutSurveyQuestionGroupType>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutSurveyQuestionGroupModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: create } = useCreateSurveyQuestionGroup()
  const { mutateAsync: update } = useUpdateSurveyQuestionGroup()

  const { data: SurveyTopicData = [] } = useFindManySurveyTopic()

  async function onOk(output?: PutSurveyQuestionGroupType) {
    if (!output) return
    try {
      showSpinner()
      if (id) {
        await update({
          data: {
            name: output.name.trim(),
            surveyTopic: {
              set: output.surveyTopic?.map((topicId) => ({ id: topicId })) || [],
            },
            description: output.description,
          },
          where: {
            id,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await create({
          data: {
            name: output.name.trim(),
            surveyTopic: {
              connect: output.surveyTopic?.map((topicId) => ({ id: topicId })) || [],
            },
            description: output.description,
          },
        })
        message.success("Thêm mới thành công")
      }
      // refetch lại danh sách SurveyQuestionGroup
      queryClient.invalidateQueries({
        queryKey: ["SurveyQuestionGroup"],
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

  const { data: surveyQuestionGroup } = useFindUniqueSurveyQuestionGroup(
    {
      where: { id },
      include: {
        surveyTopic: {
          select: {
            id: true,
          },
        },
      },
    },
    {
      enabled: !!id,
    }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (surveyQuestionGroup) {
      form.setFieldsValue({
        name: surveyQuestionGroup.name,
        description: surveyQuestionGroup.description || undefined,
        // Chuyển đổi từ array of objects sang array of strings
        surveyTopic: surveyQuestionGroup.surveyTopic.map((item) => item.id),
      })
    }
  }, [surveyQuestionGroup])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa nhóm câu hỏi khảo sát" : "Thêm mới nhóm câu hỏi khảo sát"}
      className="w-[600px]"
    >
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên nhóm câu hỏi" required>
          <Input placeholder="Nhập tên nhóm câu hỏi" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="surveyTopic" label="Chủ đề khảo sát" required>
          <Select
            placeholder="Chọn chủ đề khảo sát"
            mode="multiple"
            maxTagCount={"responsive"}
            options={SurveyTopicData.map((i: SurveyTopic) => ({
              value: i.id,
              label: i.name,
            }))}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutSurveyQuestionGroupModal
