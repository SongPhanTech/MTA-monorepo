import { queryClient } from "@api/index"
import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import useSpinner from "@hooks/spinner"
import { buildOrgTree } from "@lib/utils"
import type { DocumentFile, TrainingField, TrainingObjectType } from "@workspace/db/client"
import {
  useCreateTrainingField,
  useFindManyDM_DonVi,
  useFindUniqueTrainingField,
  useUpdateTrainingField,
} from "@workspace/db/hooks"
import { Col, Form, Input, message, Radio } from "antd"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import DocumentPaths from "@components/commons/documentPaths"
import { whereOrganization } from "@workspace/libs/constants"
import { useFindManyTrainingObjectTypePermission } from "@workspace/ui"
import TreeSelect from "@/components/commons/tree-select"
export type PutTrainingField = TrainingField & {
  trainingObjectTypeIds: string[]
  documentFiles?: DocumentFile[]
}
dayjs.locale("vi")
const PutTrainingFieldModal = () => {
  const [document, setDocument] = useState<DocumentFile[]>([])
  const [form] = Form.useForm<PutTrainingField>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutTrainingFieldModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()
  const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectTypePermission()
  const { data: organizations = [] } = useFindManyDM_DonVi({
    where: whereOrganization,
    orderBy: [{ iSTT: "asc" }, { sTen: "asc" }],
  })
  const treeData = buildOrgTree(organizations)
  const { mutateAsync: createTrainingField } = useCreateTrainingField()
  const { mutateAsync: updateTrainingField } = useUpdateTrainingField()
  async function onOk({ trainingObjectTypeIds, ...rest }: PutTrainingField) {
    try {
      showSpinner()
      if (id) {
        await updateTrainingField({
          data: {
            ...rest,
            documentFiles: {
              upsert: (rest.documentFiles || [])
                .filter((file) => !!file.id)
                .map((file) => ({
                  where: { id: file.id },
                  create: {
                    name: file.name,
                    path: file.path,
                    mimeType: file.mimeType,
                    size: file.size,
                  },
                  update: {
                    name: file.name,
                    path: file.path,
                    mimeType: file.mimeType,
                    size: file.size,
                  },
                })),
              create: (rest.documentFiles || [])
                .filter((file) => !file.id)
                .map((file) => ({
                  name: file.name,
                  path: file.path,
                  mimeType: file.mimeType,
                  size: file.size,
                })),
              disconnect: document
                .filter(
                  (initialFile) =>
                    !rest.documentFiles?.some((finalFile) => finalFile.id === initialFile.id)
                )
                .map((fileToDisconnect) => ({ id: fileToDisconnect.id })),
            },
            trainingObjectTypes: {
              createMany: {
                data: trainingObjectTypeIds.map((trainingObjectTypeId) => ({
                  trainingObjectTypeId,
                })),
                skipDuplicates: true,
              },
              deleteMany: {
                trainingFieldId: id,
                trainingObjectTypeId: {
                  notIn: trainingObjectTypeIds,
                },
              },
            },
          },
          where: {
            id,
          },
        })
        message.success("Cập nhật thành công")
      } else {
        await createTrainingField({
          data: {
            ...rest,
            documentFiles: {
              create:
                (rest.documentFiles || []).map((file: DocumentFile) => ({
                  name: file.name,
                  path: file.path,
                  mimeType: file.mimeType,
                  size: file.size,
                })) || [],
            },
            trainingObjectTypes: {
              createMany: {
                data: trainingObjectTypeIds.map((trainingObjectTypeId) => ({
                  trainingObjectTypeId,
                })),
              },
            },
          },
        })
        message.success("Thêm mới thành công")
      }
      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["TrainingField"],
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

  const { data: level } = useFindUniqueTrainingField(
    {
      where: { id },
      include: {
        organization: true,
        trainingObjectTypes: true,
        documentFiles: true,
      },
    },
    {
      enabled: !!id,
    }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (level) {
      form.setFieldsValue({
        ...level,
        trainingObjectTypeIds: level.trainingObjectTypes.map(
          (i: { trainingObjectTypeId: string }) => i?.trainingObjectTypeId
        ),
        publishDate: dayjs(level.publishDate),
      })
      setDocument(level.documentFiles as DocumentFile[])
    } else {
      form.setFieldsValue({
        active: true,
      })
      setDocument([])
    }
  }, [level])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa ngành" : "Thêm mới ngành"}
      className="w-[900px]"
    >
      <Col span={12}>
        <FormItem form={form} name="code" label="Mã ngành" required>
          <Input placeholder="Nhập mã ngành" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="name" label="Tên ngành" required>
          <Input placeholder="Nhập tên ngành" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="englishName" label="Tên tiếng anh" required>
          <Input placeholder="Nhập tên tiếng anh" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="trainingObjectTypeIds" label="Đối tượng đào tạo" required>
          <Select
            mode="multiple"
            maxTagCount={"responsive"}
            placeholder="Chọn đối tượng đào tạo"
            options={trainingObjectTypeData.map((i: TrainingObjectType) => {
              return {
                value: i.id,
                label: i.name,
              }
            })}
          />
        </FormItem>
      </Col>

      <Col span={12}>
        <FormItem form={form} required name="organizationId" label="Chọn đơn vị" className="mb-2">
          <TreeSelect
            allowClear
            showSearch
            placeholder="Chọn đơn vị quản lý"
            treeDefaultExpandAll
            treeData={treeData}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="decisionNo" label="Số quyết định">
          <Input placeholder="Nhập số quyết định" />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="publishDate" label="Ngày ban hành" required>
          <DatePicker
            format={{
              format: "DD/MM/YYYY",
              type: "mask",
            }}
            className="w-full"
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="documentFiles" label="Tài liệu đính kèm">
          <DocumentPaths
            form={form}
            data={document}
            relationId={id ?? ""}
            relationType="trainingFieldId"
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" />
        </FormItem>
      </Col>
      {id && (
        <Col span={24}>
          <FormItem form={form} name={"active"} label="Trạng thái">
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

export default PutTrainingFieldModal
