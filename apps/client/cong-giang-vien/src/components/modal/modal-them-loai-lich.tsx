import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import { MAU_LOAI_MAC_DINH } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import { colors } from "@constants/colors"
import useSpinner from "@hooks/spinner"
import { useCreatePersonalWorkTag, useUpdatePersonalWorkTag } from "@workspace/db/hooks"
import { ColorPicker, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type FormThemLoaiLich = {
  name: string
  color: string
}

type InputThemLoaiLich = {
  lecturerId: string
  id?: string
  name?: string
  color?: string
  onCreated?: (tagId: string) => void
  onUpdated?: (tagId: string) => void
}

const ModalThemLoaiLich = () => {
  const [form] = Form.useForm<FormThemLoaiLich>()
  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: taoTag } = useCreatePersonalWorkTag()
  const { mutateAsync: capNhatTag } = useUpdatePersonalWorkTag()

  const mauChon = Form.useWatch("color", form)
  const tenLoai = Form.useWatch("name", form)

  const { isOpen, onClose, input } = useDisclosure<InputThemLoaiLich>({
    tag: "ModalThemLoaiLich",
    onClose: form.resetFields,
  })

  const dangSua = !!input?.id
  const mauHienThi = (mauChon || MAU_LOAI_MAC_DINH).toUpperCase()
  const tenHienThi = tenLoai?.trim() || "Tên loại lịch"

  useEffect(() => {
    if (!isOpen) return

    form.setFieldsValue({
      name: input?.name ?? "",
      color: (input?.color ?? colors.common.green).toUpperCase(),
    })
  }, [isOpen, input, form])

  const onFinish = async (giaTri: FormThemLoaiLich) => {
    if (!input?.lecturerId) {
      message.error("Không xác định được giảng viên")
      return
    }

    try {
      showSpinner()

      if (dangSua && input.id) {
        const tag = await capNhatTag({
          where: { id: input.id },
          data: {
            name: giaTri.name.trim(),
            color: giaTri.color,
          },
        })
        await queryClient.invalidateQueries({ queryKey: ["PersonalWorkTag"] })
        message.success("Đã cập nhật loại lịch")
        if (tag?.id) input.onUpdated?.(tag.id)
      } else {
        const tag = await taoTag({
          data: {
            name: giaTri.name.trim(),
            color: giaTri.color,
            lecturer: { connect: { id: input.lecturerId } },
          },
        })
        await queryClient.invalidateQueries({ queryKey: ["PersonalWorkTag"] })
        message.success("Đã thêm loại lịch")
        if (tag?.id) input.onCreated?.(tag.id)
      }

      onClose()
    } catch (error: unknown) {
      const err = error as { info?: { message?: string } }
      message.error(
        err?.info?.message ??
          (dangSua ? "Không thể cập nhật loại lịch" : "Không thể thêm loại lịch")
      )
    } finally {
      hideSpinner()
    }
  }

  return (
    <PutFormModal<FormThemLoaiLich>
      open={isOpen}
      onCancel={onClose}
      title={
        <span className="text-sm font-bold uppercase text-cgv-green-dark">
          {dangSua ? "SỬA LOẠI LỊCH" : "THÊM LOẠI LỊCH"}
        </span>
      }
      okText="Lưu"
      cancelText="Hủy"
      width={480}
      zIndex={1100}
      centered
      destroyOnClose
      form={form}
      onFinish={onFinish}
      className="modal-them-loai-lich [&_.ant-modal-body_.ant-row]:!m-0 [&_.ant-modal-body_.ant-row]:!block [&_.ant-modal-footer]:border-t [&_.ant-modal-footer]:border-gray-100 [&_.ant-modal-header]:mb-0 [&_.ant-modal-content]:!p-0 [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-gray-100 [&_.ant-modal-header]:!px-6 [&_.ant-modal-header]:!py-4 [&_.ant-modal-body]:!px-6 [&_.ant-modal-body]:!pb-4 [&_.ant-modal-body]:!pt-4 [&_.ant-modal-footer]:!px-6 [&_.ant-modal-footer]:!pb-4 [&_.ant-modal-footer]:!pt-3"
      styles={{
        header: { marginBottom: 0 },
        footer: { marginTop: 0 },
      }}
      okButtonProps={{
        className:
          "!h-9 !min-w-[88px] !rounded-md !border-cgv-green-dark !bg-cgv-green-dark !font-medium !shadow-none hover:!opacity-90",
      }}
      cancelButtonProps={{
        className:
          "!h-9 !min-w-[72px] !rounded-md !border-gray-200 !bg-white !font-medium !text-gray-600 !shadow-none hover:!border-gray-300 hover:!text-gray-800",
      }}
      formProps={{
        className:
          "[&_.ant-form-item]:!mb-0 [&_.ant-form-item]:!mt-0 [&_.ant-form-item-label]:!pb-1 [&_.ant-form-item-label>label]:text-sm [&_.ant-form-item-label>label]:font-medium [&_.ant-form-item-label>label]:text-gray-700",
      }}
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-[minmax(0,1fr)_172px] gap-3">
          <FormItem form={form} name="name" label="Tên loại lịch" required className="min-w-0">
            <Input
              placeholder="Ví dụ: Công việc, Cuộc họp..."
              maxLength={50}
              className="h-10 rounded-md"
              allowClear
            />
          </FormItem>

          <FormItem form={form} name="color" label="Màu hiển thị" required className="min-w-0">
            <ColorPicker
              value={mauChon}
              format="hex"
              disabledAlpha
              onChange={(color) => form.setFieldValue("color", color.toHexString().toUpperCase())}
              className="block w-full [&_.ant-color-picker-trigger]:!h-10 [&_.ant-color-picker-trigger]:!w-full [&_.ant-color-picker-trigger]:!border-0 [&_.ant-color-picker-trigger]:!bg-transparent [&_.ant-color-picker-trigger]:!p-0 [&_.ant-color-picker-trigger]:!shadow-none"
            >
              <button
                type="button"
                className="flex h-10 w-full min-w-0 items-center gap-2 rounded-md border border-gray-300 bg-white px-2.5 text-left transition-colors hover:border-gray-400"
              >
                <span
                  className="h-5 w-5 shrink-0 rounded-full border border-black/5"
                  style={{ backgroundColor: mauHienThi }}
                />
                <span className="whitespace-nowrap text-[13px] text-gray-800">{mauHienThi}</span>
              </button>
            </ColorPicker>
          </FormItem>
        </div>

        <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-2.5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            Xem trước
          </p>
          <span
            className="inline-flex max-w-full items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium"
            style={{
              borderColor: mauHienThi,
              backgroundColor: `${mauHienThi}14`,
              color: mauHienThi,
            }}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: mauHienThi }}
            />
            <span className="truncate">{tenHienThi}</span>
          </span>
        </div>
      </div>
    </PutFormModal>
  )
}

export default ModalThemLoaiLich
