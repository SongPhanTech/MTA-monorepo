import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import { TUY_CHON_MAU_LOAI_LICH } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/constants"
import { MAU_LOAI_MAC_DINH } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import useSpinner from "@hooks/spinner"
import { cn } from "@workspace/ui/lib/utils"
import { useCreatePersonalWorkTag, useUpdatePersonalWorkTag } from "@workspace/db/hooks"
import { ColorPicker, Form, Input, message } from "antd"
import { Check, Palette } from "lucide-react"
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
  const mauHienThi = mauChon || MAU_LOAI_MAC_DINH
  const tenHienThi = tenLoai?.trim() || "Tên loại lịch"
  const mauGoiY = TUY_CHON_MAU_LOAI_LICH.includes(
    mauHienThi as (typeof TUY_CHON_MAU_LOAI_LICH)[number]
  )

  useEffect(() => {
    if (!isOpen) return

    form.setFieldsValue({
      name: input?.name ?? "",
      color: input?.color ?? TUY_CHON_MAU_LOAI_LICH[0] ?? MAU_LOAI_MAC_DINH,
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
        <span className="text-base font-semibold text-gray-900">
          {dangSua ? "Sửa loại lịch" : "Thêm loại lịch"}
        </span>
      }
      okText="Lưu"
      cancelText="Hủy"
      width={440}
      zIndex={1100}
      centered
      destroyOnClose
      rowWrap={false}
      form={form}
      onFinish={onFinish}
      className="modal-them-loai-lich [&_.ant-modal-footer]:border-t [&_.ant-modal-footer]:border-gray-100 [&_.ant-modal-footer]:pt-4 [&_.ant-modal-header]:mb-0 [&_.ant-modal-content]:!p-0 [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-gray-100 [&_.ant-modal-header]:!px-6 [&_.ant-modal-header]:!py-4 [&_.ant-modal-body]:!px-6 [&_.ant-modal-body]:!py-5 [&_.ant-modal-footer]:!px-6 [&_.ant-modal-footer]:!pb-4"
      styles={{
        header: { marginBottom: 0 },
        body: { paddingTop: 20, paddingBottom: 20 },
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
          "[&_.ant-form-item]:mb-0 [&_.ant-form-item-label>label]:text-sm [&_.ant-form-item-label>label]:font-medium [&_.ant-form-item-label>label]:text-gray-700",
      }}
    >
      <div className="flex flex-col gap-5">
        <FormItem form={form} name="name" label="Tên loại lịch" required className="min-w-0">
          <Input
            placeholder="Ví dụ: Công việc, Cuộc họp..."
            maxLength={50}
            className="h-10 rounded-md"
            allowClear
          />
        </FormItem>

        <FormItem form={form} name="color" label="Màu hiển thị" required className="min-w-0">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2.5">
              {TUY_CHON_MAU_LOAI_LICH.map((mau) => {
                const dangChon = mauChon === mau
                return (
                  <button
                    key={mau}
                    type="button"
                    onClick={() => form.setFieldValue("color", mau)}
                    className={cn(
                      "relative flex h-9 w-9 items-center justify-center rounded-full transition-all",
                      dangChon
                        ? "ring-2 ring-gray-900 ring-offset-2"
                        : "hover:scale-105 hover:ring-2 hover:ring-gray-200 hover:ring-offset-1"
                    )}
                    style={{ backgroundColor: mau }}
                    aria-label={`Chọn màu ${mau}`}
                    aria-pressed={dangChon}
                  >
                    {dangChon ? (
                      <Check size={14} className="text-white drop-shadow-sm" strokeWidth={3} />
                    ) : null}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <Palette size={15} className="shrink-0 text-gray-400" />
              <span className="text-xs text-gray-500">Màu tùy chỉnh</span>
              <ColorPicker
                value={mauChon}
                format="hex"
                disabledAlpha
                size="small"
                onChange={(_, hex) => form.setFieldValue("color", hex)}
                presets={[
                  {
                    label: "Màu gợi ý",
                    colors: [...TUY_CHON_MAU_LOAI_LICH],
                  },
                ]}
                className="ml-auto [&_.ant-color-picker-trigger]:!h-8 [&_.ant-color-picker-trigger]:!min-w-[120px] [&_.ant-color-picker-trigger]:!rounded-md [&_.ant-color-picker-trigger]:!border-gray-200"
              />
            </div>
          </div>
        </FormItem>

        <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-4 py-3">
          <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-gray-400">
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
          {!mauGoiY ? (
            <p className="mb-0 mt-2 text-xs text-gray-400">Màu tùy chỉnh · {mauHienThi}</p>
          ) : null}
        </div>
      </div>
    </PutFormModal>
  )
}

export default ModalThemLoaiLich
