import { queryClient } from "@api/index"
import DocumentPaths from "@components/commons/documentPaths"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import { buildOrgTree } from "@lib/utils"
import type { Curriculum, DocumentFile } from "@workspace/db/client"
import {
  useCreateCurriculum,
  useFindManyDM_DonVi,
  useFindManyTrainingMajor,
  useFindUniqueCurriculum,
  useUpdateCurriculum,
} from "@workspace/db/hooks"
import { Col, Form, Input, message, Radio } from "antd"
import dayjs from "dayjs"
import TreeSelect from "@/components/commons/tree-select"
import "dayjs/locale/vi"
import { useFindManyTrainingObjectTypePermission, useTrainingObjectTypeStore } from "@workspace/ui"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "./index.css"
import { whereOrganization } from "@workspace/libs/constants"
export type PutCurriculum = Curriculum & {
  documentFiles?: DocumentFile[]
}
dayjs.locale("vi")

const PutCurriculum = () => {
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const [document, setDocument] = useState<DocumentFile[]>([])
  const [form] = Form.useForm<PutCurriculum>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutCurriculum",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { data: manageOrgData = [] } = useFindManyDM_DonVi({
    where: whereOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })

  const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectTypePermission({
    orderBy: { name: "asc" },
  })

  const trainingObjectTypeIdForm = Form.useWatch("trainingObjectTypeId", form)

  const { data: trainingMajorData = [] } = useFindManyTrainingMajor({
    select: {
      id: true,
      code: true,
      name: true,
    },
    orderBy: { name: "asc" },
    where: trainingObjectTypeIdForm
      ? {
          trainingObjectTypes: {
            some: { trainingObjectTypeId: trainingObjectTypeIdForm },
          },
        }
      : {},
  })

  const { mutateAsync: createCurriculum } = useCreateCurriculum()
  const { mutateAsync: updateCurriculum } = useUpdateCurriculum()
  async function onOk(output?: PutCurriculum) {
    if (!output) return
    try {
      showSpinner()
      const baseData = {
        code: output.code,
        name: output.name.trim(),
        englishName: output.englishName,
        description: output.description,
        managementOrganizationId: output.managementOrganizationId,
        trainingMajorId: output.trainingMajorId,
        trainingObjectTypeId: output.trainingObjectTypeId,
        active: output.active,
      }

      if (id) {
        const updateData = {
          ...baseData,
          documentFiles: {
            upsert: (output.documentFiles || [])
              .filter((file) => !!file.id)
              .map((file) => ({
                where: { id: file.id },
                create: {
                  name: file.name,
                  path: file.path,
                  mimeType: file.mimeType,
                  size: file.size,
                  curriculum: { connect: { id } },
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
        }

        await updateCurriculum({
          data: updateData,
          where: { id },
        })
        message.success("Cập nhật thành công")
      } else {
        await createCurriculum({
          data: {
            ...baseData,
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
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["TrainingCourse"],
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

  const { data: initialData } = useFindUniqueCurriculum(
    {
      where: { id },
      include: {
        documentFiles: true,
      },
    },
    { enabled: !!id }
  )
  const treeData = buildOrgTree(manageOrgData)

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        documentFiles: initialData.documentFiles,
      })
      setDocument(initialData.documentFiles)
    } else {
      form.setFieldsValue({
        active: true,
        documentFiles: [],
        trainingObjectTypeId,
      })
      setDocument([])
    }
  }, [initialData, trainingObjectTypeId])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Sửa chương trình đào tạo" : "Thêm chương trình đào tạo"}
      className="w-[60vw]"
    >
      <Col span={12}>
        <FormItem form={form} name="code" label="Mã chương trình" required>
          <Input placeholder="Nhập mã CTDT" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="name" label="Tên chương trình (tiếng việt)" required>
          <Input placeholder="Nhập tên chương trình (tiếng việt)" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="englishName" label="Tên chương trình (tiếng anh)">
          <Input placeholder="Nhập tên chương trình (tiếng anh)" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="managementOrganizationId" label="Đơn vị quản lý" required>
          <TreeSelect
            placeholder="Chọn đơn vị quản lý"
            allowClear
            showSearch
            treeDefaultExpandAll
            treeData={treeData}
            filterTreeNode={(input, node) =>
              (node?.label as string)?.toLowerCase()?.includes(input?.toLowerCase())
            }
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="trainingObjectTypeId" label="Chọn đối tượng đào tạo" required>
          <Select
            placeholder="Đối tượng đào tạo"
            disabled
            options={trainingObjectTypeData.map((i) => {
              return {
                value: i.id,
                label: i.name,
              }
            })}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="trainingMajorId" label="Chuyên ngành đào tạo" required>
          <Select
            placeholder="Chọn chuyên ngành đào tạo"
            options={trainingMajorData.map((m) => {
              return {
                value: m.id,
                label: [m.code, m.name].filter(Boolean).join(" - "),
              }
            })}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="documentFiles" label="Tài liệu đính kèm">
          <DocumentPaths
            form={form}
            data={document}
            relationId={id ?? ""}
            relationType="curriculumId"
          />
        </FormItem>
      </Col>
      {id && (
        <Col span={12}>
          <FormItem form={form} name={"active"} label="Trạng thái" required>
            <Radio.Group buttonStyle="solid">
              <Radio value={true}>Đang hoạt động</Radio>
              <Radio value={false}>Ngừng hoạt động</Radio>
            </Radio.Group>
          </FormItem>
        </Col>
      )}
    </PutFormModal>
  )
}

export default PutCurriculum
