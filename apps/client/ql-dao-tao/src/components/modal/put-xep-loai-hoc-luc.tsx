import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import {
  AcademicRankingBaseType,
  type AcademicRankingConvert,
  RankingContext,
} from "@workspace/db/client"
import {
  useCreateAcademicRankingConvert,
  useFindManyTrainingCourse,
  useFindUniqueAcademicRankingConvert,
  useUpdateAcademicRankingConvert,
} from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message, Radio, Switch } from "antd"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import Select from "@components/commons/select"
import { useTrainingObjectTypeStore } from "@workspace/ui"
export type PutAcademicRankingFormType = AcademicRankingConvert
dayjs.locale("vi")

const academicRankingBaseTypeOptions = [
  { label: "Hệ 10", value: AcademicRankingBaseType.Base10 },
  { label: "Hệ 4", value: AcademicRankingBaseType.Base4 },
]

const PutAcademicRanking = () => {
  const [form] = Form.useForm<PutAcademicRankingFormType>()
  const { isOpen, onClose, input } = useDisclosure<{ id: string; type: string }>({
    tag: "PutAcademicRanking",
    onClose: form.resetFields,
  })
  const [baseScoreValue, setBaseScoreValue] = useState<string | undefined>()
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createAcademicRankingConvert } = useCreateAcademicRankingConvert()
  const { mutateAsync: updateAcademicRankingConvert } = useUpdateAcademicRankingConvert()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { data: trainingCourses } = useFindManyTrainingCourse({
    where: { active: true, trainingObjectTypeId },
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
  })

  async function onOk(output?: PutAcademicRankingFormType) {
    if (!output) return
    try {
      showSpinner()
      if (input?.id) {
        await updateAcademicRankingConvert({
          data: output,
          where: { id: input.id },
        })
        message.success("Cập nhật thành công")
      } else {
        await createAcademicRankingConvert({
          data: {
            ...output,
            context: input?.type === RankingContext.GRADUATION ? "GRADUATION" : "STUDYING",
            rankOrder: output.rankOrder || 2,
          },
        })
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["AcademicRankingConvert"],
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

  const { data: level } = useFindUniqueAcademicRankingConvert(
    {
      where: { id: input?.id },
    },
    { enabled: !!input?.id }
  )
  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (level) {
      form.setFieldsValue(level)
      setBaseScoreValue(level.baseScore)
    }
  }, [level])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={
        input?.id
          ? input?.type === RankingContext.GRADUATION
            ? "Chỉnh sửa loại tốt nghiệp"
            : "Chỉnh sửa loại học lực"
          : input?.type === RankingContext.GRADUATION
            ? "Thêm mới loại tốt nghiệp"
            : "Thêm mới loại học lực"
      }
      className="w-[40vw]"
    >
      <Col span={12}>
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
      <Col span={12}>
        <FormItem form={form} name="classification" label="Xếp loại" required>
          <Input placeholder="Xuất sắc..." />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="baseScore" label="Loại hệ điểm" required>
          <Select
            placeholder="Chọn loại hệ điểm"
            options={academicRankingBaseTypeOptions?.map((item) => ({
              label: item.label,
              value: item.value,
            }))}
            allowClear
            onChange={(value) => {
                setBaseScoreValue(value)
                if (value === AcademicRankingBaseType.Base10) {
                  form.setFieldsValue({ base4Min: null, base4Max: null })
                } else if (value === AcademicRankingBaseType.Base4) {
                  form.setFieldsValue({ base10Min: null, base10Max: null })
                }
              }}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="graduated" label="Đạt" required>
          <Radio.Group>
            <Radio value={true}>Có</Radio>
            <Radio value={false}>Không</Radio>
          </Radio.Group>
        </FormItem>
      </Col>
      {AcademicRankingBaseType.Base10 === baseScoreValue && (
        <Col span={12}>
          <FormItem
            form={form}
            name="base10Min"
            label="Hệ 10 từ"
            rules={[
              {
                required: AcademicRankingBaseType.Base10 === baseScoreValue,
                message: "Vui lòng nhập điểm hệ 10",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const base10Max = getFieldValue("base10Max")
                  if (base10Max && Number.parseFloat(value) >= Number.parseFloat(base10Max)) {
                    return Promise.reject(new Error("Điểm hệ 10 từ phải nhỏ hơn điểm hệ 10 đến"))
                  }
                  return Promise.resolve()
                },
              }),
            ]}
          >
            <InputNumber
              type="number"
              style={{ width: "100%" }}
              placeholder="Nhập điểm"
              step={0.1}
              min={0}
              max={10}
            />
          </FormItem>
        </Col>
      )}
      {AcademicRankingBaseType.Base10 === baseScoreValue && (
        <Col span={12}>
          <FormItem
            form={form}
            name="base10Max"
            label="Hệ 10 đến"
            rules={[
              {
                required: AcademicRankingBaseType.Base10 === baseScoreValue,
                message: "Vui lòng nhập điểm hệ 10",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const base10Min = getFieldValue("base10Min")
                  if (base10Min && Number.parseFloat(value) <= Number.parseFloat(base10Min)) {
                    return Promise.reject(new Error("Điểm hệ 10 từ phải nhỏ hơn điểm hệ 10 đến"))
                  }
                  return Promise.resolve()
                },
              }),
            ]}
          >
            <InputNumber
              type="number"
              style={{ width: "100%" }}
              placeholder="Nhập điểm"
              step={0.1}
              min={0}
              max={10}
            />
          </FormItem>
        </Col>
      )}
      {AcademicRankingBaseType.Base4 === baseScoreValue && (
        <Col span={12}>
          <FormItem
            form={form}
            name="base4Min"
            label="Điểm hệ 4 từ"
            required={AcademicRankingBaseType.Base4 === baseScoreValue}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const base4Max = getFieldValue("base4Max")
                  if (base4Max && Number.parseFloat(value) >= Number.parseFloat(base4Max)) {
                    return Promise.reject(new Error("Điểm hệ 4 từ phải nhỏ hơn điểm hệ 4 đến"))
                  }
                  return Promise.resolve()
                },
              }),
            ]}
          >
            <InputNumber
              type="number"
              style={{ width: "100%" }}
              placeholder="Nhập điểm"
              step={0.1}
              min={0}
              max={4}
            />
          </FormItem>
        </Col>
      )}
      {AcademicRankingBaseType.Base4 === baseScoreValue && (
        <Col span={12}>
          <FormItem
            form={form}
            name="base4Max"
            label="Điểm hệ 4 đến"
            required={AcademicRankingBaseType.Base4 === baseScoreValue}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const base4Min = getFieldValue("base4Min")
                  if (base4Min && Number.parseFloat(value) <= Number.parseFloat(base4Min)) {
                    return Promise.reject(new Error("Điểm hệ 4 từ phải nhỏ hơn điểm hệ 4 đến"))
                  }
                  return Promise.resolve()
                },
              }),
            ]}
          >
            <InputNumber
              type="number"
              style={{ width: "100%" }}
              placeholder="Nhập điểm"
              step={0.1}
              min={0}
              max={4}
            />
          </FormItem>
        </Col>
      )}
      <Col span={12}>
        <FormItem form={form} name="rankOrder" label="Hạng xếp loại" required>
          <InputNumber
            type="number"
            style={{ width: "100%" }}
            placeholder="Nhập hạng xếp loại"
            step={1}
            min={0}
          />
        </FormItem>
      </Col>
      {/* <Col span={12}>
        <FormItem form={form} name="active" label="Kích hoạt" valuePropName="checked">
          <Switch defaultValue={true} />
        </FormItem>
      </Col> */}
      <Col span={24}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutAcademicRanking
