import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import { TUY_CHON_MAU_LOAI_LICH } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/constants"
import { MAU_LOAI_MAC_DINH } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import useSpinner from "@hooks/spinner"
import { useCreatePersonalWorkTag, useUpdatePersonalWorkTag } from "@workspace/db/hooks"
import { Col, ColorPicker, Form, Input, message } from "antd"
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

  const { isOpen, onClose, input } = useDisclosure<InputThemLoaiLich>({
    tag: "ModalThemLoaiLich",
    onClose: form.resetFields,
  })

  const dangSua = !!input?.id

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
        <span className="font-bold text-cgv-green-dark">
          {dangSua ? "SỬA LOẠI LỊCH" : "THÊM LOẠI LỊCH"}
        </span>
      }
      okText="Lưu"
      width={420}
      zIndex={1100}
      centered
      form={form}
      onFinish={onFinish}
    >
      <Col span={24}>
        <FormItem form={form} name="name" label="Tên loại lịch" required>
          <Input placeholder="Ví dụ: Công việc, Cuộc họp..." maxLength={50} />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="color" label="Màu hiển thị" required>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {TUY_CHON_MAU_LOAI_LICH.map((mau) => {
                const dangChon = mauChon === mau
                return (
                  <button
                    key={mau}
                    type="button"
                    onClick={() => form.setFieldValue("color", mau)}
                    className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-105"
                    style={{
                      backgroundColor: mau,
                      borderColor: dangChon ? "#1f2937" : "transparent",
                    }}
                    aria-label={`Chọn màu ${mau}`}
                  />
                )
              })}
            </div>
            <ColorPicker
              value={mauChon}
              format="hex"
              disabledAlpha
              showText
              onChange={(_, hex) => form.setFieldValue("color", hex)}
              presets={[
                {
                  label: "Màu gợi ý",
                  colors: [...TUY_CHON_MAU_LOAI_LICH],
                },
              ]}
            />
          </div>
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default ModalThemLoaiLich
