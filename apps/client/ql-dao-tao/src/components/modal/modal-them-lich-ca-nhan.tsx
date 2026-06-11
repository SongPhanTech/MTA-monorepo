import { queryClient } from "@api/index"
import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import ChonLoaiLich from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/chon-loai-lich"
import {
  TAG_LOAI_LICH_MAC_DINH,
  TUY_CHON_LAP_LAI,
  TUY_CHON_NHAC_LICH,
} from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/constants"
import type { GiaTriFormLichCaNhan } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import {
  chuyenPhutSangNhacLich,
  datGioCaNgay,
  taoDuLieuLuuLich,
  taoThoiGianLich,
} from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import useSpinner from "@hooks/spinner"
import { useLecturerHienTai } from "@hooks/use-lecturer-hien-tai"
import {
  useCreateIndividualSchedule,
  useCreateManyPersonalWorkTag,
  useFindManyPersonalWorkTag,
  useFindManyUserProfile,
  useFindUniqueIndividualSchedule,
  useUpdateIndividualSchedule,
} from "@workspace/db/hooks"
import { ScheduleRepeatType } from "@workspace/db/client"
import { Checkbox, Form, Input, Select, TimePicker, message } from "antd"
import dayjs from "dayjs"
import { Bell, Clock, MapPin, RefreshCw, UserPlus } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
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
  const daNapForm = useRef(false)
  const [timNguoiLienQuan, setTimNguoiLienQuan] = useState("")

  const { mutateAsync: taoLich } = useCreateIndividualSchedule()
  const { mutateAsync: capNhatLich } = useUpdateIndividualSchedule()
  const { mutateAsync: taoNhieuTag } = useCreateManyPersonalWorkTag()

  const {
    isOpen,
    onClose,
    input,
    store: modalStore,
  } = useDisclosure<InputThemLichCaNhan>({
    tag: "ModalThemLichCaNhan",
    onClose: () => {
      form.resetFields()
      dangSeedTag.current = false
      setTimNguoiLienQuan("")
    },
  })

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
      include: {
        tags: { select: { id: true } },
        relatedUserProfiles: { select: { id: true, fullname: true, email: true } },
      },
    },
    { enabled: !!input?.id && isOpen }
  )

  const { data: nguoiDung = [] } = useFindManyUserProfile(
    {
      where: {
        active: true,
        ...(timNguoiLienQuan
          ? {
              OR: [
                { fullname: { contains: timNguoiLienQuan, mode: "insensitive" } },
                { email: { contains: timNguoiLienQuan, mode: "insensitive" } },
                { phoneNumber: { contains: timNguoiLienQuan, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: { id: true, fullname: true, email: true },
      take: 50,
      orderBy: [{ fullname: "asc" }],
    },
    { enabled: isOpen }
  )

  const tuyChonNguoiLienQuan = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>()
    for (const nguoi of nguoiDung) {
      map.set(nguoi.id, {
        value: nguoi.id,
        label: nguoi.fullname?.trim() || nguoi.email || nguoi.id,
      })
    }
    for (const nguoi of lichHienTai?.relatedUserProfiles ?? []) {
      if (!map.has(nguoi.id)) {
        map.set(nguoi.id, {
          value: nguoi.id,
          label: nguoi.fullname?.trim() || nguoi.email || nguoi.id,
        })
      }
    }
    return [...map.values()]
  }, [nguoiDung, lichHienTai?.relatedUserProfiles])

  const xuLyThayDoiForm = (
    thayDoi: Partial<GiaTriFormLichCaNhan>,
    giaTri: GiaTriFormLichCaNhan
  ) => {
    if (thayDoi.caNgay && giaTri.caNgay) {
      const tuNgay = giaTri.tuNgay ?? dayjs()
      const denNgay = giaTri.denNgay ?? tuNgay
      form.setFieldsValue(datGioCaNgay(tuNgay, denNgay))
      return
    }

    if (
      giaTri.caNgay &&
      (thayDoi.tuNgay != null || thayDoi.denNgay != null) &&
      giaTri.tuNgay &&
      giaTri.denNgay
    ) {
      form.setFieldsValue(datGioCaNgay(giaTri.tuNgay, giaTri.denNgay))
    }
  }

  useEffect(() => {
    if (
      !isOpen ||
      !lecturerId ||
      tags.length > 0 ||
      dangSeedTag.current ||
      dangTaiTag ||
      dangFetchTag
    ) {
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
    if (!isOpen) {
      daNapForm.current = false
      return
    }

    if (daNapForm.current) {
      if (!input?.id && tags[0]?.id && !form.getFieldValue("tagId")) {
        form.setFieldValue("tagId", tags[0].id)
      }
      return
    }

    if (input?.id) {
      if (!lichHienTai) return

      const batDau = dayjs(lichHienTai.startTime)
      const ketThuc = dayjs(lichHienTai.endTime)
      const gioCaNgay = lichHienTai.allDay
        ? datGioCaNgay(batDau, ketThuc)
        : { tuGio: batDau, denGio: ketThuc }
      form.setFieldsValue({
        title: lichHienTai.title,
        tagId: lichHienTai.tags[0]?.id,
        tuNgay: batDau,
        denNgay: ketThuc,
        caNgay: lichHienTai.allDay,
        ...gioCaNgay,
        diaDiem: lichHienTai.location ?? undefined,
        noiDung: lichHienTai.content ?? undefined,
        nhacLich: chuyenPhutSangNhacLich(lichHienTai.reminderMinutes),
        lapLai: lichHienTai.repeatType ?? ScheduleRepeatType.NONE,
        nguoiLienQuanIds: lichHienTai.relatedUserProfiles.map((nguoi) => nguoi.id),
      })
      daNapForm.current = true
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
      nhacLich: "30",
      lapLai: ScheduleRepeatType.NONE,
      nguoiLienQuanIds: [],
    })
    daNapForm.current = true
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
      const duLieuChung = taoDuLieuLuuLich(giaTri, taoThoiGianLich(giaTri))
      const nguoiLienQuanIds = giaTri.nguoiLienQuanIds ?? []

      if (input?.id) {
        await capNhatLich({
          where: { id: input.id },
          data: {
            ...duLieuChung,
            tags: { set: [{ id: giaTri.tagId }] },
            relatedUserProfiles: { set: nguoiLienQuanIds.map((id) => ({ id })) },
          },
        })
        message.success("Đã cập nhật lịch")
      } else {
        await taoLich({
          data: {
            ...duLieuChung,
            lecturer: { connect: { id: lecturerId } },
            tags: { connect: [{ id: giaTri.tagId }] },
            ...(nguoiLienQuanIds.length > 0
              ? { relatedUserProfiles: { connect: nguoiLienQuanIds.map((id) => ({ id })) } }
              : {}),
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
    if (!lecturerId) {
      message.warning("Không xác định được giảng viên. Vui lòng liên hệ quản trị viên.")
    }
    modalStore.setState((state) => ({
      modalTags: {
        ...state.modalTags,
        ModalThemLoaiLich: {
          input: {
            lecturerId: lecturerId ?? "",
            onCreated: (tagId: string) => form.setFieldValue("tagId", tagId),
          },
        },
      },
    }))
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
      width={720}
      rowWrap={false}
      form={form}
      onFinish={onFinish}
      centered
      destroyOnClose
      className="modal-them-lich-ca-nhan [&_.ant-modal-footer]:border-t-0 [&_.ant-modal-footer]:pt-2 [&_.ant-modal-header]:mb-0"
      styles={{
        header: { paddingBottom: 8 },
        body: { paddingTop: 8, paddingBottom: 8 },
        footer: { paddingTop: 8 },
      }}
      okButtonProps={{
        className:
          "!h-9 !min-w-[100px] !border-cgv-green-dark !bg-cgv-green-dark !font-medium hover:!opacity-90",
      }}
      cancelButtonProps={{
        className: "!h-9 !min-w-[80px] !border-gray-300 !bg-white !font-medium !text-gray-700",
      }}
      formProps={{
        className:
          "[&_.ant-form-item-label>label]:text-sm [&_.ant-form-item-label>label]:font-medium [&_.ant-form-item-label>label]:text-gray-700",
        onValuesChange: xuLyThayDoiForm,
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
          <FormItem form={form} name="title" label="Tiêu đề lịch" required className="min-w-0">
            <Input placeholder="Nhập tiêu đề lịch..." maxLength={200} className="h-10" />
          </FormItem>

          <FormItem
            form={form}
            name="tagId"
            label="Loại lịch"
            required
            className="min-w-0"
            rules={[{ required: true, message: "Vui lòng chọn loại lịch" }]}
          >
            <ChonLoaiLich
              tags={tags}
              onThemLoai={moThemLoai}
              dangTai={dangTaiTag || dangFetchTag}
            />
          </FormItem>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-gray-700">Thời gian</p>

          <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <FormItem form={form} name="tuNgay" label="Từ ngày" required className="min-w-0">
              <DatePicker className="h-10 w-full" />
            </FormItem>
            <FormItem form={form} name="denNgay" label="Đến ngày" required className="min-w-0">
              <DatePicker className="h-10 w-full" />
            </FormItem>
            <FormItem
              form={form}
              name="caNgay"
              valuePropName="checked"
              className="min-w-0 sm:col-start-3 sm:row-start-1 sm:pb-1"
            >
              <Checkbox className="text-sm text-gray-600">Cả ngày</Checkbox>
            </FormItem>

            <FormItem form={form} name="tuGio" label="Từ giờ" required className="min-w-0">
              <TimePicker
                format="HH:mm"
                className="h-10 w-full"
                style={{ width: "100%" }}
                needConfirm={false}
                disabled={caNgay}
                suffixIcon={<Clock size={14} className="text-gray-400" />}
              />
            </FormItem>
            <FormItem form={form} name="denGio" label="Đến giờ" required className="min-w-0">
              <TimePicker
                format="HH:mm"
                className="h-10 w-full"
                style={{ width: "100%" }}
                needConfirm={false}
                disabled={caNgay}
                suffixIcon={<Clock size={14} className="text-gray-400" />}
              />
            </FormItem>
            <p className="min-w-0 pb-2 text-xs text-gray-400 sm:col-start-3 sm:row-start-2 sm:whitespace-nowrap">
              Thời gian theo múi giờ: GMT+7
            </p>
          </div>
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
          <FormItem form={form} name="nhacLich" label="Nhắc lịch">
            <Select
              className="h-10 w-full [&_.ant-select-selector]:!h-10 [&_.ant-select-selector]:!items-center [&_.ant-select-prefix]:!mr-2"
              options={TUY_CHON_NHAC_LICH.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
              prefix={<Bell size={16} className="text-gray-400" />}
            />
          </FormItem>
          <FormItem form={form} name="lapLai" label="Lặp lại">
            <Select
              className="h-10 w-full [&_.ant-select-selector]:!h-10 [&_.ant-select-selector]:!items-center [&_.ant-select-prefix]:!mr-2"
              options={TUY_CHON_LAP_LAI.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
              prefix={<RefreshCw size={16} className="text-gray-400" />}
            />
          </FormItem>
        </div>

        <FormItem form={form} name="nguoiLienQuanIds" label="Người liên quan (tùy chọn)">
          <Select
            mode="multiple"
            allowClear
            showSearch
            filterOption={false}
            placeholder="Tìm kiếm giảng viên, người dùng..."
            className="w-full [&_.ant-select-selector]:!min-h-10"
            options={tuyChonNguoiLienQuan}
            onSearch={setTimNguoiLienQuan}
            suffixIcon={<UserPlus size={16} className="text-gray-400" />}
          />
        </FormItem>
      </div>
    </PutFormModal>
  )
}

export default ModalThemLichCaNhan
