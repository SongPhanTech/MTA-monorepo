import { queryClient } from "@api/index"
import DatePicker from "@components/commons/date-picker"
import DocumentPaths, { type UploadedFileItem } from "@components/commons/documentPaths"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import { RichTextEditor } from "@components/commons/rich-text-editor"
import useSpinner from "@hooks/spinner"
import type { DocumentFile, Notification } from "@workspace/db/client"
import { useCreateNotification, useFindUniqueNotification } from "@workspace/db/hooks"
import { sqlTransaction } from "@workspace/libs/api/model"
import { Col, Form, Input, message, Radio } from "antd"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
export type PutNotification = Notification & {
  attachments?: UploadedFileItem[]
}
const PutNotificationModal = () => {
  const [document, setDocument] = useState<DocumentFile[]>([])
  const [form] = Form.useForm<PutNotification>()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutNotificationModal",
    onClose: form.resetFields,
  })

  const attachments = Form.useWatch("attachments", form)

  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: create } = useCreateNotification()
  async function onOk(value: PutNotification) {
    try {
      showSpinner()
      if (id) {
        const resUpdate = await sqlTransaction([
          {
            model: "Notification",
            operation: "update",
            data: {
              data: {
                attachments: {
                  deleteMany: {},
                },
              },
              where: { id },
            },
          },
          {
            model: "Notification",
            operation: "update",
            data: {
              data: {
                ...value,
                publishedAt: value.publishedAt ? dayjs(value.publishedAt).toDate() : undefined,
                expiresAt: value.expiresAt ? dayjs(value.expiresAt).toDate() : undefined,
                attachments: {
                  create: attachments?.map((file) => ({
                    name: file.name,
                    path: file.path,
                    size: file.size ? Number(file.size) : 0,
                    mimeType: file.mimeType || "",
                  })),
                },
              },
              where: { id },
            },
          },
        ])
        if (resUpdate.status !== 200) {
          throw new Error("Cập nhật thất bại")
        }
        message.success("Cập nhật thành công")
      } else {
        await create({
          data: {
            ...value,
            publishedAt: value.publishedAt ? dayjs(value.publishedAt).toDate() : undefined,
            expiresAt: value.expiresAt ? dayjs(value.expiresAt).toDate() : undefined,
            attachments: {
              create: attachments?.map((file) => ({
                name: file.name,
                path: file.path,
                size: file.size ? Number(file.size) : 0,
                mimeType: file.mimeType || "",
              })),
            },
          },
        })
        message.success("Thêm mới thành công")
      }
      queryClient.invalidateQueries({
        queryKey: ["TrainingTime"],
      })
      onClose()
    } catch (error: any) {
      if (error?.info?.message || error?.message) {
        message.error(error?.info?.message || error?.message)
      } else message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const { data } = useFindUniqueNotification(
    {
      where: { id },
      include: {
        attachments: true,
      },
    },
    { enabled: !!id }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        ...data,
        publishedAt: data.publishedAt ? dayjs(data.publishedAt) : undefined,
        expiresAt: data.expiresAt ? dayjs(data.expiresAt) : undefined,
        attachments: data.attachments.map((file) => ({
          file: null,
          name: file.name,
          path: file.path,
          size: file.size ? BigInt(file.size) : BigInt(0),
          mimeType: file.mimeType || "",
          notificationId: id || "",
        })),
      })
      setDocument(data.attachments)
    } else {
      form.setFieldsValue({
        active: true,
        publishedAt: dayjs().startOf("day"),
      })
    }
  }, [data])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa thông báo" : "Thêm mới thông báo"}
      className="w-[85vw]"
    >
      <Col span={24}>
        <FormItem form={form} name="title" label="Tiêu đề thông báo" required>
          <Input placeholder="Nhập tiêu đề thông báo" />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="content" label="Nội dung thông báo" required>
          <RichTextEditor />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="publishedAt" label="Ngày đăng" required>
          <DatePicker
            minDate={dayjs().startOf("day")}
            defaultValue={dayjs().startOf("day")}
            style={{ width: "100%" }}
          />
        </FormItem>
      </Col>
      <Col span={12}>
        <FormItem form={form} name="expiresAt" label="Ngày hết hạn">
          <DatePicker minDate={dayjs().startOf("day")} style={{ width: "100%" }} />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="attachments" label="Tài liệu đính kèm">
          <DocumentPaths
            form={form}
            data={document}
            titleForm="attachments"
            relationId={id || ""}
            relationType="notificationId"
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name={"active"} label="Trạng thái" required>
          <Radio.Group buttonStyle="solid">
            <Radio value={true}>Hiển thị</Radio>
            <Radio value={false}>Không hiển thị</Radio>
          </Radio.Group>
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export { PutNotificationModal }
