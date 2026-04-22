import { queryClient } from "@api/index"
import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import { store } from "@pages/thiet-lap-de-thi/danh-sach-de"
import { useStore } from "@tanstack/react-store"
import { $Enums, type ExamBank } from "@workspace/db/client"
import {
  useFindManyExamFramework,
  useFindManyExamMatrix,
  useFindUniqueExam,
} from "@workspace/db/hooks"
import { automaticTopicGeneration } from "@workspace/libs/api/exam"
import { Checkbox, Col, Form, Input, InputNumber, message, Row } from "antd"
import dayjs from "dayjs"
import { examTypeOptions } from "@workspace/libs/constants"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type PutMaTranDeInputType = ExamBank & {
  quantity: number
  examFrameworkId: string
  examMatrixId: string
  codeFrom: number
  subjectClassId?: string
}

const SinhDeModal = () => {
  const [form] = Form.useForm<PutMaTranDeInputType>()
  const [showExplain, setShowExplain] = useState(false)

  const { isOpen, onClose } = useDisclosure<{
    id?: string
  }>({
    tag: "SinhDeModal",
    onClose: form.resetFields,
  })
  const selectedExamId = useStore(store, (state) => state.selectedExamId)
  const subjectVersionId = useStore(store, (state) => state.subjectVersionId)
  const { data: dataExam } = useFindUniqueExam(
    {
      where: { id: selectedExamId },
      include: {
        subjectClass: true,
        subjectVersion: true,
      },
    },
    {
      enabled: !!selectedExamId,
    }
  )

  const dataOption = useMemo(() => {
    return dataExam?.subjectClass
      ? dataExam?.subjectClass.map((item) => {
          return {
            value: item?.id,
            label: `${item?.code}-${item?.name}`,
          }
        })
      : []
  }, [dataExam])

  const { data: examFrameworkData = [] } = useFindManyExamFramework(
    {
      where: {
        subjectVersionId: subjectVersionId,
      },
      include: {
        subjectVersion: true,
        examMatrixs: true,
      },
    },
    { enabled: !!subjectVersionId }
  )

  const examFrameworkId = Form.useWatch("examFrameworkId", form)

  const { data: ExamMatrixData = [] } = useFindManyExamMatrix(
    {
      where: {
        examFrameworkId: examFrameworkId,
      },
      include: {
        examFramework: true,
      },
    },
    { enabled: !!examFrameworkId }
  )

  useEffect(() => {
    form.setFieldsValue({
      examType: dataExam?.subjectVersion?.examType,
      subjectClassId: dataExam?.subjectClass?.[0]?.id,
      examDay: dataExam?.subjectClass?.[0]?.examDate
        ? dayjs(dataExam?.subjectClass?.[0]?.examDate)
        : undefined,
    })
  }, [
    dataExam?.subjectVersion?.examType,
    dataExam?.subjectClass?.[0]?.id,
    dataExam?.subjectClass?.[0]?.examDate,
  ])

  const onOk = async (values: PutMaTranDeInputType) => {
    try {
      if (!values || !selectedExamId) return

      const res = await automaticTopicGeneration({
        ...values,
        isNote: values.isNote || false,
        description: values.explain || undefined,
        id: "",
        examId: selectedExamId,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        examDay: values?.examDay ? new Date(values?.examDay).toISOString() : null,
        isGroup: values?.isGroup || true,
      })
      if (res?.status === 200) {
        message.success("Tạo đề thành công!")
        queryClient.invalidateQueries({
          queryKey: ["ExamBank"],
        })
        onClose()
      } else {
        message.error(res?.data?.message || "Tạo đề thất bại!")
      }

      // onClose()
    } catch (error) {
      console.log(error)
      message.error("Tạo đề thất bại!")
    }
  }

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      title="Thông tin tạo đề"
      onCancel={onClose}
      onFinish={onOk}
      className="w-[1000px] top-2"
    >
      <Col span={24}>
        <Row gutter={[16, 0]}>
          <Col span={12}>
            <FormItem form={form} name="examCode" label="Mã đề" required>
              <Input placeholder="Nhập mã đề" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              form={form}
              name="codeFrom"
              label="Số thứ tự bắt đầu"
              initialValue={1}
              required
            >
              <InputNumber className="w-full" placeholder="Nhập số thứ tự bắt đầu" min={1} />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="quantity" label="Số đề cần tạo" required>
              <InputNumber className="w-full" placeholder="Nhập số lượng đề cần tạo" min={1} />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="examType" label="Hình thức thi" required>
              <Select
                options={examTypeOptions
                  .filter(
                    (opt) =>
                      opt.value === $Enums.ExamType.OfflineWritten ||
                      opt.value === $Enums.ExamType.Oral ||
                      opt.value === $Enums.ExamType.OnlineWritten
                  )
                  .map((opt) => ({
                    label: opt.label,
                    value: opt.value,
                  }))}
                placeholder="Chọn hình thức thi"
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="examFrameworkId" label="Khung đề" required>
              <Select
                options={examFrameworkData.map((i) => {
                  return {
                    label: i.name,
                    value: i.id,
                  }
                })}
                placeholder="Chọn khung đề"
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="examMatrixId" label="Ma trận đề" required>
              <Select
                options={ExamMatrixData.map((i: { name: string; id: string }) => {
                  return {
                    label: i.name,
                    value: i.id,
                  }
                })}
                placeholder="Chọn ma trận đề"
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="examDay" label="Ngày thi" required>
              <DatePicker
                format={{
                  format: "DD/MM/YYYY",
                  type: "mask",
                }}
                className="w-full"
                placeholder="Chọn ngày thi"
                disabledDate={(current) => {
                  return current && current < dayjs().subtract(1, "d")
                }}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="subjectClassId" label="Dùng cho lớp" required>
              <Select options={dataOption} placeholder="Chọn lớp môn học" />
            </FormItem>
          </Col>
          <Col span={4}>
            <FormItem form={form} name="isGroup" valuePropName="checked">
              <Checkbox>Hiển thị tiêu đề</Checkbox>
            </FormItem>
          </Col>

          <Col span={5}>
            <FormItem form={form} name="isNote" valuePropName="checked">
              <Checkbox>Được sử dụng tài liệu</Checkbox>
            </FormItem>
          </Col>
          <Col span={4}>
            <Form.Item>
              <Checkbox onChange={(e) => setShowExplain(e.target.checked)}>Khác</Checkbox>
            </Form.Item>
          </Col>

          {showExplain && (
            <Col span={24} className="mt-3">
              <FormItem form={form} name="explain" label="Chú thích">
                <Input.TextArea placeholder="Nhập chú thích" />
              </FormItem>
            </Col>
          )}
        </Row>
      </Col>
    </PutFormModal>
  )
}

export default SinhDeModal
