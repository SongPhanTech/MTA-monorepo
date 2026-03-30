import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { Award } from "@workspace/db/client"
import {
  useCreateAward,
  useFindManySubject,
  useFindUniqueAward,
  useUpdateAward,
} from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import Select from "@components/commons/select"
import { useTrainingObjectTypeStore } from "@workspace/ui"
export type PutAward = Award & {
  subjects: string[]
}
dayjs.locale("vi")
const PutOlympicScoreModal = () => {
  const [form] = Form.useForm<PutAward>()
  const [_targetDisabled, setTargetDisabled] = useState(true)
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutOlympicScoreModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { mutateAsync: createAward } = useCreateAward()
  const { mutateAsync: updateAward } = useUpdateAward()
  const { data: subjectData = [] } = useFindManySubject({
    where: {
      subjectVersion: {
        some: { trainingObjectTypeId },
      },
    },
    include: {
      managementOrganization: true,
    },
  })
  async function onOk({ subjects, ...rest }: PutAward) {
    try {
      showSpinner()
      if (id) {
        await updateAward({
          data: {
            // name: rest.name,
            bonusScore: rest.bonusScore,
          },
          where: { id },
        })
        message.success("Cập nhật thành công")
      } else {
        await createAward({
          data: {
            ...rest,
            subjects: {
              connect: (subjects || []).map((id) => ({ id })),
            },
          },
        })
        message.success("Thêm mới thành công")
      }
      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["Award"],
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

  const { data: level } = useFindUniqueAward(
    {
      where: { id },
    },
    { enabled: !!id }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (level) {
      setTargetDisabled(false)
      form.setFieldsValue({
        ...level,
      })
    } else {
      form.setFieldsValue({
        active: true,
      })
    }
  }, [level])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa điểm oplympic" : "Thêm mới điểm oplympic"}
      className="w-[500px]"
    >
      <Col span={24} className="mb-4">
        <FormItem form={form} name="name" label="Tên giải thưởng" required>
          <Input placeholder="Nhập tên giải thưởng" />
        </FormItem>
      </Col>
      <Col span={24} className="mb-4">
        <FormItem form={form} name="bonusScore" label="Điểm cộng">
          <InputNumber
            type="number"
            placeholder="Nhập điểm cộng"
            className="w-full"
            min={0}
            max={10}
            step={0.1}
          />
        </FormItem>
      </Col>
      <Col span={24} className="mb-4">
        <FormItem form={form} name="subjects" label="Nhóm môn được cộng điểm" required>
          <Select
            mode="multiple"
            allowClear
            style={{ width: "100%" }}
            placeholder="Chọn môn học"
            options={subjectData.map((item) => ({
              label: item.name + " - " + (item.managementOrganization?.sTen || "Không có đơn vị"),
              value: item.id,
            }))}
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutOlympicScoreModal
