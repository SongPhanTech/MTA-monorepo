import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import { MAU_LOAI_LICH_MAC_DINH } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import useSpinner from "@hooks/spinner"
import { useCreatePersonalWorkTag } from "@workspace/db/hooks"
import { Col, Form, Input, message } from "antd"
import { useEffect } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type FormThemLoaiLich = {
  name: string
  color: string
}

type InputThemLoaiLich = {
  lecturerId: string
  onCreated?: (tagId: string) => void
}

const ModalThemLoaiLich = () => {
  const [form] = Form.useForm<FormThemLoaiLich>()
  const { showSpinner, hideSpinner } = useSpinner()
  const { mutateAsync: taoTag } = useCreatePersonalWorkTag()

  const mauChon = Form.useWatch("color", form)

  const {
    isOpen,
    onClose,
    input,
  } = useDisclosure<InputThemLoaiLich>({
    tag: "ModalThemLoaiLich",
    onClose: form.resetFields,
  })

  useEffect(() => {
    if (isOpen) {
      form.setFieldsValue({
        name: "",
        color: MAU_LOAI_LICH_MAC_DINH[0],
      })
    }
  }, [isOpen, form])

  const onFinish = async (giaTri: FormThemLoaiLich) => {
    if (!input?.lecturerId) {
      message.error("Không xác định được giảng viên")
      return
    }

    try {
      showSpinner()
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
      onClose()
    } catch (error: unknown) {
      const err = error as { info?: { message?: string } }
      message.error(err?.info?.message ?? "Không thể thêm loại lịch")
    } finally {
      hideSpinner()
    }
  }

  return (
    <PutFormModal<FormThemLoaiLich>
      open={isOpen}
      onCancel={onClose}
      title={<span className="font-bold text-cgv-green-dark">THÊM LOẠI LỊCH</span>}
      okText="Lưu"
      width={420}
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
          <div className="flex flex-wrap gap-2">
            {MAU_LOAI_LICH_MAC_DINH.map((mau) => {
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
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default ModalThemLoaiLich
