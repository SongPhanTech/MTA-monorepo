import { queryClient } from "@api/index"
import DatePicker from "@components/commons/date-picker"
import DocumentPaths from "@components/commons/documentPaths"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import { useSchoolYearStore } from "@components/selecter-school-year"
import useSpinner from "@hooks/spinner"
import { useSession } from "@workspace/auth/react"
import { createId, type EvaluationPeriod } from "@workspace/db"
import type { DocumentFile } from "@workspace/db/client"
import {
  useCreateEvaluationCouncil,
  useCreateEvaluationPeriod,
  useFindUniqueEvaluationPeriod,
  useUpdateEvaluationCouncil,
  useUpdateEvaluationPeriod,
} from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutEvaluationPeriod = EvaluationPeriod & {
  councilIds: string[]
  documentFiles?: DocumentFile[]
}
dayjs.locale("vi")

const PutEvaluationPeriod = () => {
  const [document, setDocument] = useState<DocumentFile[]>([])
  const [form] = Form.useForm<PutEvaluationPeriod>()
  const { data: me } = useSession()
  const idProfile = me?.sDM_NhanVienId
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutEvaluationPeriod",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { data: initialData } = useFindUniqueEvaluationPeriod(
    { where: { id }, include: { council: true, documentFiles: true } },
    { enabled: !!id }
  )

  const { id: schoolYearId } = useSchoolYearStore()

  const { mutateAsync: createEvaluationPeriod } = useCreateEvaluationPeriod()
  const { mutateAsync: updateEvaluationPeriod } = useUpdateEvaluationPeriod()
  const { mutateAsync: createEvaluationCouncil } = useCreateEvaluationCouncil()
  const { mutateAsync: updateEvaluationCouncil } = useUpdateEvaluationCouncil()

  async function onOk(output?: PutEvaluationPeriod) {
    if (!output) return
    try {
      showSpinner()
      const data = {
        name: output.name.trim(),
        startDate: output.startDate,
        endDate: output.endDate,
        schoolYearId: schoolYearId || "",
        createdBy: idProfile,
      }
      if (id) {
        await Promise.all([
          updateEvaluationPeriod({
            data: {
              ...data,
              documentFiles: {
                upsert: (output.documentFiles || [])
                  .filter((file) => !!file.id)
                  .map((file) => ({
                    where: {
                      id: file.id,
                    },
                    create: {
                      name: file.name,
                      path: file.path,
                      mimeType: file.mimeType,
                      size: file.size,
                      evaluationPeriod: {
                        connect: {
                          id,
                        },
                      },
                    },
                    update: {
                      name: file.name,
                      path: file.path,
                      mimeType: file.mimeType,
                      size: file.size,
                    },
                  })),
                create: (output.documentFiles || [])
                  .filter((file) => !file.id)
                  .map((file) => ({
                    name: file.name,
                    path: file.path,
                    mimeType: file.mimeType,
                    size: file.size,
                  })),
                disconnect: document
                  .filter((existing) => !output.documentFiles?.some((f) => f.id === existing.id))
                  .map((file) => ({ id: file.id })),
              },
            },
            where: { id },
          }),

          updateEvaluationCouncil({
            data: {
              name: output.name,
              createdBy: idProfile,
            },
            where: {
              periodId: id,
            },
          }),
        ])

        message.success("Cập nhật thành công")
      } else {
        const periodId = createId()

        await createEvaluationPeriod({
          data: {
            id: periodId,
            ...data,
            documentFiles: {
              create: (output.documentFiles || []).map((file) => ({
                name: file.name,
                path: file.path,
                mimeType: file.mimeType,
                size: file.size,
              })),
            },
          },
        })

        await createEvaluationCouncil({
          data: {
            name: output.name,
            periodId,
            createdBy: idProfile,
          },
        })

        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["EvaluationPeriod"],
      })
      onClose()
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        startDate: dayjs(initialData.startDate),
        endDate: initialData.endDate ? dayjs(initialData.endDate) : undefined,
      })
      setDocument(initialData.documentFiles)
    } else {
      form.setFieldsValue({
        startDate: dayjs(),
      })
      setDocument([])
    }
  }, [initialData])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa đợt đánh giá CTĐT" : "Thêm mới đợt đánh giá CTĐT"}
      className="w-[60vw] top-2"
    >
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên đợt đánh giá" required>
          <Input placeholder="Nhập tên đợt đánh giá" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="startDate" label="Ngày bắt đầu" initialValue={dayjs()} required>
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
        <FormItem form={form} name="endDate" label="Ngày kết thúc" required>
          <DatePicker
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            className="w-full"
            disabledDate={(current) => {
              const startTime = form.getFieldValue("startDate")
              if (!startTime) return false
              return current && current < dayjs(startTime).startOf("day")
            }}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="documentFiles" label="Tài liệu đính kèm">
          <DocumentPaths
            form={form}
            data={document}
            relationId={id || ""}
            relationType="evaluationPeriodId"
            titleForm="documentFiles"
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutEvaluationPeriod
