import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { TrainingScoreSession } from "@workspace/db/client"
import {
  useCreateTrainingScoreSession,
  useFindManySemester,
  useFindManyTrainingObjectType,
  useFindUniqueTrainingScoreSession,
  useUpdateTrainingScoreSession,
} from "@workspace/db/hooks"
import { useSemesterStore, useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, DatePicker, Form, Input, message, Select } from "antd"
import dayjs from "dayjs"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

export type PutTrainingLocation = TrainingScoreSession & {
  semesterId?: string
  trainingObjectTypeId?: string
}

const PutDotRenLuyen = () => {
  const [form] = Form.useForm<PutTrainingLocation>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutDotRenLuyen",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()
  const { id: semesterId } = useSemesterStore()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  // Fetch semester list for select
  const { data: semesterList = [] } = useFindManySemester(
    {
      include: {
        schoolYear: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    },
    { enabled: isOpen }
  )

  // Fetch training object type list for select
  const { data: trainingObjectTypeList = [] } = useFindManyTrainingObjectType(
    {
      orderBy: {
        name: "asc",
      },
    },
    { enabled: isOpen }
  )

  const { mutateAsync: createTrainingScoreSession } = useCreateTrainingScoreSession()
  const { mutateAsync: updateTrainingScoreSession } = useUpdateTrainingScoreSession()

  async function onOk(output?: PutTrainingLocation) {
    if (!output) return

    // Validate required fields
    if (!output.semesterId) {
      message.error("Vui lòng chọn học kỳ")
      return
    }
    if (!output.trainingObjectTypeId) {
      message.error("Vui lòng chọn đối tượng đào tạo")
      return
    }

    try {
      showSpinner()

      const data = {
        name: output.name.trim(),
        time: output.time,
        semesterId: output.semesterId,
        trainingObjectTypeId: output.trainingObjectTypeId,
        description: output.description,
      }
      if (id) {
        await updateTrainingScoreSession({
          data,
          where: {
            id,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createTrainingScoreSession({
          data,
        })
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["TrainingScoreSession"],
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

  const { data: initialValue } = useFindUniqueTrainingScoreSession(
    {
      where: { id },
    },
    { enabled: !!id }
  )

  useEffect(() => {
    if (!isOpen) return
    if (id && initialValue) {
      form.setFieldsValue({
        ...initialValue,
        time: initialValue.time ? dayjs(initialValue.time) : undefined,
        semesterId: initialValue.semesterId || undefined,
        trainingObjectTypeId: initialValue.trainingObjectTypeId || undefined,
      })
    } else if (!id) {
      form.setFieldsValue({
        time: dayjs(),
        semesterId: semesterId || undefined,
        trainingObjectTypeId: trainingObjectTypeId || undefined,
      })
    }
  }, [id, isOpen, initialValue, form, semesterId, trainingObjectTypeId])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa đợt đánh giá" : "Thêm mới đợt đánh giá"}
      className="w-[30vw]"
    >
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên đợt" required>
          <Input placeholder="Nhập tên đợt" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="trainingObjectTypeId" label="Đối tượng đào tạo" required>
          <Select
            placeholder="Chọn đối tượng đào tạo"
            showSearch
            optionFilterProp="label"
            options={trainingObjectTypeList.map((t) => ({
              value: t.id,
              label: t.name,
            }))}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="semesterId" label="Học kỳ" required>
          <Select
            placeholder="Chọn học kỳ"
            showSearch
            optionFilterProp="label"
            options={semesterList.map((s) => ({
              value: s.id,
              label: [s.name, s.schoolYear?.name].filter(Boolean).join(" - "),
            }))}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="time" label="Thời gian">
          <DatePicker
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            className="w-full"
            defaultValue={dayjs()}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="description" label="Ghi chú">
          <Input.TextArea />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutDotRenLuyen
