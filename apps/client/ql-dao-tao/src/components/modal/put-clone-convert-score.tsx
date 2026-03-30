import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { useCreateManyScoreConvert, useFindManyTrainingCourse } from "@workspace/db/hooks"
import { Col, Form, message } from "antd"
import dayjs from "dayjs"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import Select from "@components/commons/select"
import type { ScoreConvert, TrainingCourse } from "@workspace/db/client"
import { useTrainingObjectTypeStore } from "@workspace/ui"
export type PutCloneConvertScoreFormType = { trainingCourseId: string }
dayjs.locale("vi")
const PutCloneConvertScore = () => {
  const [form] = Form.useForm<PutCloneConvertScoreFormType>()
  const { isOpen, onClose, input } = useDisclosure<{
    record: TrainingCourse & { scoreConverts: ScoreConvert[] }
  }>({
    tag: "PutCloneConvertScore",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createManyScoreConvert } = useCreateManyScoreConvert()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { data: trainingCourses } = useFindManyTrainingCourse({
    where: {
      active: true,
      scoreConverts: {
        none: {},
      },
      trainingObjectTypeId,
    },
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
  })

  async function onOk(output?: PutCloneConvertScoreFormType) {
    if (!output) return
    try {
      showSpinner()
      if (!input?.record.scoreConverts?.length) return
      type Item = ScoreConvert & { $type?: string; key?: string }

      await createManyScoreConvert({
        data: input?.record?.scoreConverts.map(
          ({ id, createdAt, updatedAt, $type, key, ...rest }: Item) => ({
            ...rest,
            trainingCourseId: output.trainingCourseId,
          })
        ),
      })
      message.success("Thêm mới thành công")
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

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={"Nhân bản bộ chuyển đổi điểm"}
      className="w-[400px]"
    >
      <Col span={24}>
        <FormItem form={form} name="trainingCourseId" label="Khoá học" required>
          <Select
            options={trainingCourses?.map(({ id, name }) => ({
              value: id,
              label: name,
            }))}
            placeholder="Chọn khoá học"
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutCloneConvertScore
