import { queryClient } from "@api/index"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import {
  useFindManyAcademicRankingConvert,
  useFindManyDiplomaType,
  useFindManyStudent,
  useFindUniqueGraduationDecision,
  useUpdateGraduationDecision,
} from "@workspace/db/hooks"
import { Col, Form, Input, InputNumber, message, Select } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import DatePicker from "@components/commons/date-picker"
import DocumentPaths from "@components/commons/documentPaths"
import FormItem from "@components/commons/form-item"
import { type DocumentFile, type GraduationDecision, RankingContext } from "@workspace/db/client"
import dayjs from "dayjs"
import { useEffect, useState } from "react"

dayjs.locale("vi")

type PutGraduationDecisionFormValues = GraduationDecision & {
  diplomaFront?: [DocumentFile]
  diplomaBack?: [DocumentFile]
}

const PutGraduationDecision = () => {
  const [documentFront, setDocumentFront] = useState<DocumentFile | null>(null)
  const [documentBack, setDocumentBack] = useState<DocumentFile | null>(null)
  const [form] = Form.useForm<PutGraduationDecisionFormValues>()
  const { isOpen, onClose, input } = useDisclosure<{ id: string; trainingCourseId: string }>({
    tag: "PutGraduationDecision",
    onClose: form.resetFields,
  })

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: updateGraduationDecision } = useUpdateGraduationDecision()
  async function onOk(output?: PutGraduationDecisionFormValues) {
    if (!output) return
    try {
      showSpinner()
      const data = {
        decisionDate: output?.decisionDate,
        notes: output?.notes,
        finalGpa: output?.finalGpa,
        finalRankingId: output?.finalRankingId,
        diplomaTypeId: output?.diplomaTypeId,
        originalDiplomaNumber: output?.originalDiplomaNumber,
        diplomaNumber: output?.diplomaNumber,
        diplomaIssueDate: output?.diplomaIssueDate,
        diplomaFront: output.diplomaFront?.[0]
          ? output.diplomaFront[0].id
            ? {
                upsert: {
                  where: { id: output.diplomaFront[0].id },
                  update: {
                    name: output.diplomaFront[0].name,
                    path: output.diplomaFront[0].path,
                    mimeType: output.diplomaFront[0].mimeType,
                    size: output.diplomaFront[0].size,
                  },
                  create: {
                    name: output.diplomaFront[0].name,
                    path: output.diplomaFront[0].path,
                    mimeType: output.diplomaFront[0].mimeType,
                    size: output.diplomaFront[0].size,
                    diplomaFrontId: input?.id,
                  },
                },
              }
            : {
                create: {
                  name: output.diplomaFront[0].name,
                  path: output.diplomaFront[0].path,
                  mimeType: output.diplomaFront[0].mimeType,
                  size: output.diplomaFront[0].size,
                },
              }
          : documentFront
            ? { disconnect: true }
            : undefined,

        diplomaBack: output.diplomaBack?.[0]
          ? output.diplomaBack[0].id
            ? {
                upsert: {
                  where: { id: output.diplomaBack[0].id },
                  update: {
                    name: output.diplomaBack[0].name,
                    path: output.diplomaBack[0].path,
                    mimeType: output.diplomaBack[0].mimeType,
                    size: output.diplomaBack[0].size,
                  },
                  create: {
                    name: output.diplomaBack[0].name,
                    path: output.diplomaBack[0].path,
                    mimeType: output.diplomaBack[0].mimeType,
                    size: output.diplomaBack[0].size,
                    diplomaBackId: input?.id,
                  },
                },
              }
            : {
                create: {
                  name: output.diplomaBack[0].name,
                  path: output.diplomaBack[0].path,
                  mimeType: output.diplomaBack[0].mimeType,
                  size: output.diplomaBack[0].size,
                },
              }
          : documentFront
            ? { disconnect: true }
            : undefined,
      }
      if (input?.id) {
        await updateGraduationDecision({
          data,
          where: {
            id: input?.id,
          },
        })
        message.success("Cập nhật thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["GraduationDecision"],
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

  const { data: initialValue } = useFindUniqueGraduationDecision(
    {
      where: {
        id: input?.id,
      },
      include: {
        diplomaFront: true,
        diplomaBack: true,
      },
    },
    { enabled: !!input?.id }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (initialValue) {
      form.setFieldsValue({
        ...initialValue,
        decisionDate: initialValue.decisionDate && dayjs(initialValue.decisionDate),
        diplomaIssueDate: initialValue.diplomaIssueDate && dayjs(initialValue.diplomaIssueDate),
        diplomaFront: initialValue.diplomaFront ? [initialValue.diplomaFront] : undefined,
        diplomaBack: initialValue.diplomaBack ? [initialValue.diplomaBack] : undefined,
      })
      setDocumentFront(initialValue.diplomaFront)
      setDocumentBack(initialValue.diplomaBack)
    } else {
      form.setFieldsValue({
        decisionDate: dayjs(),
        diplomaFront: undefined,
        diplomaBack: undefined,
      })
      setDocumentFront(null)
      setDocumentBack(null)
    }
  }, [initialValue])

  const { data: students, refetch } = useFindManyStudent({
    where: {
      fixedClass: {
        trainingCourseId: input?.trainingCourseId,
      },
    },
    include: {
      userProfile: true,
    },
    take: 500,
  })

  const { data: finalRankingData } = useFindManyAcademicRankingConvert(
    {
      where: {
        trainingCourseId: input?.trainingCourseId,
        context: RankingContext.GRADUATION,
      },
    },
    { enabled: !!input?.trainingCourseId }
  )

  const { data: diplomaTypeData } = useFindManyDiplomaType(
    {
      where: {
        curriculumVersion: {
          some: {
            fixedClass: {
              trainingCourseId: input?.trainingCourseId,
            },
          },
        },
      },
    },
    { enabled: !!input?.trainingCourseId }
  )

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={input?.id ? "Sửa quyết định tốt nghiệp" : "Thêm quyết định tốt nghiệp"}
    >
      <Col span={12}>
        <FormItem form={form} name={"studentId"} label={"Sinh viên"} required>
          <Select
            placeholder={"Chọn sinh viên"}
            options={students?.map((item) => ({
              label: [item.code, item.userProfile.fullname].filter(Boolean).join(" - "),
              value: item.id,
            }))}
            filterOption={false}
            {...(input?.id
              ? {
                  showSearch: false,
                  allowClear: false,
                  showArrow: false,
                  open: false,
                }
              : {})}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="decisionDate" label="Ngày duyệt đơn" required>
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
      <Col span={12}>
        <FormItem form={form} name={"finalRankingId"} label={"Xếp loại"} required>
          <Select
            placeholder={"Chọn xếp loại"}
            options={finalRankingData?.map((item) => ({
              label: [item.classification].filter(Boolean).join(" - "),
              value: item.id,
            }))}
            disabled
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="finalGpa" label="GPA" required>
          <InputNumber
            min={0}
            type="number"
            placeholder="Nhập gpa"
            step={0.1}
            className="w-full"
            disabled
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name={"diplomaTypeId"} label={"Loại văn bằng"}>
          <Select
            placeholder={"Chọn loại văn bằng"}
            options={diplomaTypeData?.map((item) => ({
              label: [item.name].filter(Boolean).join(" - "),
              value: item.id,
            }))}
            showSearch
            filterOption={false}
            allowClear
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="diplomaIssueDate" label="Ngày cấp bằng">
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
        <FormItem form={form} name="diplomaNumber" label="Số hiệu văn bằng">
          <Input placeholder="Nhập số hiệu văn bằng" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="originalDiplomaNumber" label="Số vào sổ gốc văn bằng">
          <Input placeholder="Nhập số vào sổ gốc văn bằng" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="notes" label="Ghi chú của hội đồng">
          <Input.TextArea placeholder="Nhập ghi chú" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name={"diplomaFront"} label="Ảnh phôi mặt trước">
          <DocumentPaths
            form={form}
            data={documentFront ? [documentFront] : []}
            relationId={input?.id ?? ""}
            relationType={"diplomaFrontId"}
            titleForm={"diplomaFront"}
            multiple={false}
            accept="image/*,.pdf"
            text="ảnh"
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name={"diplomaBack"} label="Ảnh phôi mặt sau">
          <DocumentPaths
            form={form}
            data={documentBack ? [documentBack] : []}
            relationId={input?.id ?? ""}
            relationType={"diplomaBackId"}
            titleForm={"diplomaBack"}
            multiple={false}
            accept="image/*,.pdf"
            text="ảnh"
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutGraduationDecision
