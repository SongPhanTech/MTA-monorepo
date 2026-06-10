import { queryClient } from "@api/index"
import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import ChonLoaiLich from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/chon-loai-lich"
import { TAG_LOAI_LICH_MAC_DINH } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/constants"
import type { GiaTriFormLichCaNhan } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import { taoThoiGianLich } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import useSpinner from "@hooks/spinner"
import { useLecturerHienTai } from "@hooks/use-lecturer-hien-tai"
import {
  useCreateIndividualSchedule,
  useCreateManyPersonalWorkTag,
  useFindManyPersonalWorkTag,
  useFindUniqueIndividualSchedule,
  useUpdateIndividualSchedule,
} from "@workspace/db/hooks"
import { Checkbox, Form, Input, Select, TimePicker, message } from "antd"
import dayjs from "dayjs"
import { Bell, Clock, MapPin, RefreshCw, UserPlus } from "lucide-react"
import { useEffect, useRef } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type InputThemLichCaNhan = {
  id?: string
  ngayMacDinh?: string
}

const ModalThemLichCaNhan = () => {
  const [form] = Form.useForm<GiaTriFormLichCaNhan>()
  const { showSpinner, hideSpinner } = useSpinner()
  const { lecturerId } = useLecturerHienTai()
  const caNgay = Form.useWatch("caNgay", form)
  const dangSeedTag = useRef(false)

  const { mutateAsync: taoLich } = useCreateIndividualSchedule()
  const { mutateAsync: capNhatLich } = useUpdateIndividualSchedule()
  const { mutateAsync: taoNhieuTag } = useCreateManyPersonalWorkTag()

  const {
    isOpen,
    onClose,
    input,
  } = useDisclosure<InputThemLichCaNhan>({
    tag: "ModalThemLichCaNhan",
    onClose: () => {
      form.resetFields()
      dangSeedTag.current = false
    },
  })

  const { onOpen: moThemLoaiLich } = useDisclosure<{
    lecturerId: string
    onCreated?: (tagId: string) => void
  }>({ tag: "ModalThemLoaiLich" })

  const {
    data: tags = [],
    isLoading: dangTaiTag,
    isFetching: dangFetchTag,
  } = useFindManyPersonalWorkTag(
    {
      where: { lecturerId: lecturerId ?? "" },
      select: { id: true, name: true, color: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    },
    { enabled: !!lecturerId && isOpen }
  )

  const { data: lichHienTai } = useFindUniqueIndividualSchedule(
    {
      where: { id: input?.id ?? "" },
      include: { tags: { select: { id: true } } },
    },
    { enabled: !!input?.id && isOpen }
  )

  useEffect(() => {
    if (!isOpen || !lecturerId || tags.length > 0 || dangSeedTag.current || dangTaiTag || dangFetchTag) {
      return
    }

    dangSeedTag.current = true
    void (async () => {
      try {
        await taoNhieuTag({
          data: TAG_LOAI_LICH_MAC_DINH.map((tag) => ({
            name: tag.name,
            color: tag.color,
            sortOrder: tag.sortOrder,
            lecturerId,
          })),
        })
        await queryClient.invalidateQueries({ queryKey: ["PersonalWorkTag"] })
      } catch {
        dangSeedTag.current = false
      }
    })()
  }, [isOpen, lecturerId, tags.length, dangTaiTag, dangFetchTag, taoNhieuTag])

  useEffect(() => {
    if (!isOpen) return

    if (lichHienTai) {
      const batDau = dayjs(lichHienTai.startTime)
      const ketThuc = dayjs(lichHienTai.endTime)
      form.setFieldsValue({
        title: lichHienTai.title,
        tagId: lichHienTai.tags[0]?.id,
        tuNgay: batDau,
        denNgay: ketThuc,
        caNgay: lichHienTai.allDay,
        tuGio: batDau,
        denGio: ketThuc,
        diaDiem: lichHienTai.location ?? undefined,
        noiDung: lichHienTai.description ?? undefined,
      })
      return
    }

    const ngay = input?.ngayMacDinh ? dayjs(input.ngayMacDinh) : dayjs()
    form.setFieldsValue({
      title: "",
      tagId: tags[0]?.id,
      tuNgay: ngay,
      denNgay: ngay,
      caNgay: false,
      tuGio: ngay.hour(8).minute(0),
      denGio: ngay.hour(9).minute(30),
      diaDiem: undefined,
      noiDung: undefined,
    })
  }, [isOpen, input, lichHienTai, tags, form])

  const onFinish = async (giaTri: GiaTriFormLichCaNhan) => {
    if (!lecturerId) {
      message.error("Không xác định được giảng viên")
      return
    }

    if (!giaTri.tagId) {
      message.error("Vui lòng chọn loại lịch")
      return
    }

    if (giaTri.denNgay.isBefore(giaTri.tuNgay, "day")) {
      message.error("Đến ngày không được trước từ ngày")
      return
    }

    const { startTime, endTime, allDay } = taoThoiGianLich(giaTri)
    if (!allDay && dayjs(endTime).isBefore(dayjs(startTime))) {
      message.error("Đến giờ phải sau từ giờ")
      return
    }

    try {
      showSpinner()
      const duLieuChung = {
        title: giaTri.title.trim(),
        startTime,
        endTime,
        allDay,
        location: giaTri.diaDiem?.trim() || null,
        description: giaTri.noiDung?.trim() || null,
      }

      if (input?.id) {
        await capNhatLich({
          where: { id: input.id },
          data: {
            ...duLieuChung,
            tags: { set: [{ id: giaTri.tagId }] },
          },
        })
        message.success("Đã cập nhật lịch")
      } else {
        await taoLich({
          data: {
            ...duLieuChung,
            lecturer: { connect: { id: lecturerId } },
            tags: { connect: [{ id: giaTri.tagId }] },
          },
        })
        message.success("Đã thêm lịch")
      }

      await queryClient.invalidateQueries({ queryKey: ["IndividualSchedule"] })
      onClose()
    } catch (error: unknown) {
      const err = error as { info?: { message?: string } }
      message.error(err?.info?.message ?? "Không thể lưu lịch")
    } finally {
      hideSpinner()
    }
  }

  const moThemLoai = () => {
    if (!lecturerId) return
    moThemLoaiLich({
      lecturerId,
      onCreated: (tagId) => form.setFieldValue("tagId", tagId),
    })
  }

  return (
    <PutFormModal<GiaTriFormLichCaNhan>
      open={isOpen}
      onCancel={onClose}
      title={
        <span className="text-base font-bold uppercase text-cgv-green-dark">
          {input?.id ? "SỬA LỊCH" : "THÊM LỊCH"}
        </span>
      }
      okText="Lưu lịch"
      cancelText="Hủy"
      width={680}
      rowWrap={false}
      form={form}
      onFinish={onFinish}
      centered
      destroyOnClose
      className="[&_.ant-modal-footer]:border-t-0 [&_.ant-modal-footer]:pt-2 [&_.ant-modal-header]:mb-0"
      styles={{
        header: { paddingBottom: 8 },
        body: { paddingTop: 8, paddingBottom: 8 },
        footer: { paddingTop: 8 },
      }}
      okButtonProps={{
        className: "!h-9 !min-w-[100px] !border-cgv-green-dark !bg-cgv-green-dark !font-medium hover:!opacity-90",
      }}
      cancelButtonProps={{
        className: "!h-9 !min-w-[80px] !border-gray-300 !bg-white !font-medium !text-gray-700",
      }}
      formProps={{
        className:
          "[&_.ant-form-item-label>label]:text-sm [&_.ant-form-item-label>label]:font-medium [&_.ant-form-item-label>label]:text-gray-700",
      }}
    >
      <div className="flex flex-col gap-5">
        <FormItem form={form} name="title" label="Tiêu đề lịch" required>
          <Input placeholder="Nhập tiêu đề lịch..." maxLength={200} className="h-10" />
        </FormItem>

        <FormItem
          form={form}
          name="tagId"
          label="Loại lịch"
          required
          rules={[{ required: true, message: "Vui lòng chọn loại lịch" }]}
        >
          <ChonLoaiLich
            tags={tags}
            onThemLoai={moThemLoai}
            dangTai={dangTaiTag || dangFetchTag}
          />
        </FormItem>

        <div>
          <p className="mb-3 text-sm font-medium text-gray-700">Thời gian</p>

          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <FormItem form={form} name="tuNgay" label="Từ ngày" required>
              <DatePicker className="h-10 w-full" />
            </FormItem>
            <FormItem form={form} name="denNgay" label="Đến ngày" required>
              <DatePicker className="h-10 w-full" />
            </FormItem>
            <FormItem form={form} name="caNgay" valuePropName="checked" className="sm:pb-1">
              <Checkbox className="text-sm text-gray-600">Cả ngày</Checkbox>
            </FormItem>
          </div>

          {!caNgay ? (
            <div className="mt-1 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-[1fr_1fr_1fr] sm:items-end">
              <FormItem form={form} name="tuGio" label="Từ giờ" required>
                <TimePicker
                  format="HH:mm"
                  className="h-10 w-full"
                  needConfirm={false}
                  suffixIcon={<Clock size={14} className="text-gray-400" />}
                />
              </FormItem>
              <FormItem form={form} name="denGio" label="Đến giờ" required>
                <TimePicker
                  format="HH:mm"
                  className="h-10 w-full"
                  needConfirm={false}
                  suffixIcon={<Clock size={14} className="text-gray-400" />}
                />
              </FormItem>
              <p className="pb-2 text-xs text-gray-400 sm:whitespace-nowrap">
                Thời gian theo múi giờ: GMT+7
              </p>
            </div>
          ) : null}
        </div>

        <FormItem form={form} name="diaDiem" label="Địa điểm / Nền tảng">
          <Input
            placeholder="Nhập địa điểm hoặc nền tảng (phòng họp, Zoom, Google Meet, ...)"
            suffix={<MapPin size={16} className="text-gray-400" />}
            maxLength={200}
            className="h-10"
          />
        </FormItem>

        <FormItem form={form} name="noiDung" label="Nội dung">
          <Input.TextArea
            placeholder="Nhập nội dung công việc, nội dung cuộc họp, ghi chú..."
            rows={4}
            maxLength={1000}
            showCount={{ formatter: ({ count, maxLength }) => `${count}/${maxLength}` }}
            className="resize-none"
          />
        </FormItem>

        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">Nhắc lịch</span>
            <div className="flex items-center gap-2">
              <Bell size={16} className="shrink-0 text-gray-400" />
              <Select
                disabled
                defaultValue="30"
                className="h-10 flex-1"
                options={[{ value: "30", label: "Trước 30 phút" }]}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">Lặp lại</span>
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className="shrink-0 text-gray-400" />
              <Select
                disabled
                defaultValue="none"
                className="h-10 flex-1"
                options={[{ value: "none", label: "Không lặp lại" }]}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">Người liên quan (tùy chọn)</span>
          <Input
            disabled
            placeholder="Tìm kiếm giảng viên, người dùng..."
            suffix={<UserPlus size={16} className="text-gray-400" />}
            className="h-10"
          />
        </div>
      </div>
    </PutFormModal>
  )
}

export default ModalThemLichCaNhan
