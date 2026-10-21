import { queryClient } from "@api/index"
import DatePicker from "@components/commons/date-picker"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import ChonLoaiLich from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/chon-loai-lich"
import { TUY_CHON_NHAC_LICH } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/constants"
import type { GiaTriFormLichCaNhan } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import {
  CHON_NGUOI_LIEN_QUAN,
  chuyenPhutSangNhacLich,
  datGioCaNgay,
  MAU_LOAI_MAC_DINH,
  taoDieuKienTimNguoiLienQuan,
  taoDuLieuLuuLich,
  taoThoiGianLich,
  taoThongBaoLichGiaoNhau,
  soSanhTheoFirstName,
  taoTuyChonNguoiLienQuan,
} from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/utils"
import { demSoLichGanTag } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/dem-lich-gan-tag"
import { timLichGiaoNhau } from "@components/cong-giang-vien/lich-cua-toi/lich-ca-nhan/kiem-tra-lich-giao-nhau"
import useSpinner from "@hooks/spinner"
import { useLecturerHienTai } from "@hooks/use-lecturer-hien-tai"
import {
  useCreateIndividualSchedule,
  useDeleteIndividualSchedule,
  useDeletePersonalWorkTag,
  useFindManyPersonalWorkTag,
  useFindManyUserProfile,
  useFindUniqueIndividualSchedule,
  useUpdateIndividualSchedule,
} from "@workspace/db/hooks"
import { ScheduleRepeatType } from "@workspace/db/client"
import { Button, Checkbox, Form, Input, Modal, Select, TimePicker, message } from "antd"
import dayjs from "dayjs"
import { Bell, Clock, MapPin, UserPlus } from "lucide-react"
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
  const daNapForm = useRef(false)
  const [timNguoiLienQuan, setTimNguoiLienQuan] = useState("")

  const { mutateAsync: taoLich } = useCreateIndividualSchedule()
  const { mutateAsync: capNhatLich } = useUpdateIndividualSchedule()
  const { mutateAsync: xoaLich } = useDeleteIndividualSchedule()
  const { mutateAsync: xoaTag } = useDeletePersonalWorkTag()

  const {
    isOpen,
    onClose,
    input,
    store: modalStore,
  } = useDisclosure<InputThemLichCaNhan>({
    tag: "ModalThemLichCaNhan",
    onClose: () => {
      form.resetFields()
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
        relatedUserProfiles: {
          select: CHON_NGUOI_LIEN_QUAN,
        },
      },
    },
    { enabled: !!input?.id && isOpen }
  )

  const { data: nguoiDung = [] } = useFindManyUserProfile(
    {
      where: {
        active: true,
        ...(timNguoiLienQuan ? taoDieuKienTimNguoiLienQuan(timNguoiLienQuan) : {}),
      },
      select: CHON_NGUOI_LIEN_QUAN,
    },
    { enabled: isOpen }
  )

  const tuyChonNguoiLienQuan = useMemo(() => {
    const map = new Map<string, ReturnType<typeof taoTuyChonNguoiLienQuan>>()
    for (const nguoi of nguoiDung) {
      map.set(nguoi.id, taoTuyChonNguoiLienQuan(nguoi))
    }
    for (const nguoi of lichHienTai?.relatedUserProfiles ?? []) {
      if (!map.has(nguoi.id)) {
        map.set(nguoi.id, taoTuyChonNguoiLienQuan(nguoi))
      }
    }
    return [...map.values()].sort(soSanhTheoFirstName)
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
        lapLai: ScheduleRepeatType.NONE,
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
      const lichGiaoNhau = await timLichGiaoNhau(lecturerId, startTime, endTime, input?.id)
      if (lichGiaoNhau.length > 0) {
        message.error(taoThongBaoLichGiaoNhau(lichGiaoNhau[0]))
        return
      }
    } catch {
      message.error("Không thể kiểm tra lịch trùng")
      return
    }

    try {
      showSpinner()
      const duLieuChung = taoDuLieuLuuLich(giaTri, { startTime, endTime, allDay })
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
    modalStore.setState((state: any) => ({
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

  const moSuaLoai = (tagId: string) => {
    const tag = tags.find((item) => item.id === tagId)
    if (!tag) return

    modalStore.setState((state: any) => ({
      modalTags: {
        ...state.modalTags,
        ModalThemLoaiLich: {
          input: {
            lecturerId: lecturerId ?? "",
            id: tag.id,
            name: tag.name,
            color: tag.color ?? MAU_LOAI_MAC_DINH,
          },
        },
      },
    }))
  }

  const xoaLichCaNhan = () => {
    const lichId = input?.id
    if (!lichId) return

    Modal.confirm({
      title: "Xóa lịch này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        showSpinner()
        try {
          await xoaLich({ where: { id: lichId } })
          await queryClient.invalidateQueries({ queryKey: ["IndividualSchedule"] })
          message.success("Đã xóa lịch")
          onClose()
        } catch (error: unknown) {
          const err = error as { info?: { message?: string } }
          message.error(err?.info?.message ?? "Không thể xóa lịch")
          throw error
        } finally {
          hideSpinner()
        }
      },
    })
  }

  const xoaLoaiLich = async (tagId: string) => {
    if (!lecturerId) {
      message.error("Không xác định được giảng viên")
      return
    }

    showSpinner()
    try {
      const soLich = await demSoLichGanTag(tagId, lecturerId)
      if (soLich > 0) {
        message.warning("Loại lịch này đang được gắn với lịch cá nhân, không thể xóa.")
        return
      }
    } catch {
      message.error("Không thể kiểm tra lịch gắn loại lịch")
      return
    } finally {
      hideSpinner()
    }

    Modal.confirm({
      title: "Xóa loại lịch",
      content: "Bạn có chắc muốn xóa loại lịch này? Thao tác này không thể hoàn tác.",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        showSpinner()
        try {
          await xoaTag({ where: { id: tagId } })
          await queryClient.invalidateQueries({ queryKey: ["PersonalWorkTag"] })

          if (form.getFieldValue("tagId") === tagId) {
            const tagConLai = tags.filter((item) => item.id !== tagId)
            form.setFieldValue("tagId", tagConLai[0]?.id)
          }

          message.success("Đã xóa loại lịch")
        } catch (error: unknown) {
          const err = error as { info?: { message?: string } }
          message.error(err?.info?.message ?? "Không thể xóa loại lịch")
          throw error
        } finally {
          hideSpinner()
        }
      },
    })
  }

  return (
    <PutFormModal<GiaTriFormLichCaNhan>
      open={isOpen}
      onCancel={onClose}
      title={
        <span className="text-sm font-bold uppercase text-cgv-green-dark">
          {input?.id ? "SỬA LỊCH" : "THÊM LỊCH"}
        </span>
      }
      okText="Lưu lịch"
      cancelText="Hủy"
      footer={
        input?.id ? (
          <div className="flex justify-end gap-2">
            <Button danger className="!h-9 !font-medium" onClick={xoaLichCaNhan}>
              Xóa lịch
            </Button>
            <Button
              onClick={onClose}
              className="!h-9 !min-w-[80px] !border-gray-300 !bg-white !font-medium !text-gray-700"
            >
              Hủy
            </Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              className="!h-9 !min-w-[100px] !border-cgv-green-dark !bg-cgv-green-dark !font-medium hover:!opacity-90"
            >
              Lưu lịch
            </Button>
          </div>
        ) : undefined
      }
      width={880}
      form={form}
      onFinish={onFinish}
      centered
      destroyOnClose
      className="modal-them-lich-ca-nhan [&_.ant-modal-footer]:border-t-0 [&_.ant-modal-body_.ant-row]:!block"
      okButtonProps={{
        className:
          "!h-[34px] !min-w-[96px] !border-cgv-green-dark !bg-cgv-green-dark !text-[13px] !font-medium hover:!opacity-90",
      }}
      cancelButtonProps={{
        className:
          "!h-[34px] !min-w-[72px] !border-gray-300 !bg-white !text-[13px] !font-medium !text-gray-700",
      }}
      formProps={{
        className:
          "[&_.ant-form-item-label>label]:text-gray-700 [&_.ant-form-item:last-child]:mb-0",
        onValuesChange: xuLyThayDoiForm,
      }}
    >
      <div className="flex w-full flex-col">
        <FormItem form={form} name="title" label="Tiêu đề lịch" required className="min-w-0">
          <Input placeholder="Nhập tiêu đề lịch..." maxLength={200} className="h-9" />
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
            onSuaLoai={moSuaLoai}
            onXoaLoai={xoaLoaiLich}
            dangTai={dangTaiTag || dangFetchTag}
          />
        </FormItem>

        <div className="khoang-thoi-gian mb-2">
          <p className="mb-1.5 text-xs font-medium text-gray-700">Thời gian</p>

          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-x-4">
            <FormItem
              form={form}
              name="tuNgay"
              label="Từ ngày"
              required
              className="min-w-0 !mb-1.5"
            >
              <DatePicker className="h-9 w-full" />
            </FormItem>
            <FormItem
              form={form}
              name="denNgay"
              label="Đến ngày"
              required
              className="min-w-0 !mb-1.5"
            >
              <DatePicker className="h-9 w-full" />
            </FormItem>
            <FormItem
              form={form}
              name="caNgay"
              label=" "
              colon={false}
              valuePropName="checked"
              className="min-w-0 !mb-1.5 [&_.ant-form-item-label>label]:invisible [&_.ant-form-item-control-input]:min-h-9 [&_.ant-form-item-control-input]:content-center"
            >
              <Checkbox className="text-xs text-gray-600">Cả ngày</Checkbox>
            </FormItem>

            <FormItem form={form} name="tuGio" label="Từ giờ" required className="min-w-0 !mb-0">
              <TimePicker
                format="HH:mm"
                className="h-9 w-full"
                style={{ width: "100%" }}
                needConfirm={false}
                disabled={caNgay}
                suffixIcon={<Clock size={13} className="text-gray-400" />}
              />
            </FormItem>
            <FormItem form={form} name="denGio" label="Đến giờ" required className="min-w-0 !mb-0">
              <TimePicker
                format="HH:mm"
                className="h-9 w-full"
                style={{ width: "100%" }}
                needConfirm={false}
                disabled={caNgay}
                suffixIcon={<Clock size={13} className="text-gray-400" />}
              />
            </FormItem>
            <div className="mb-1 flex min-h-9 flex-col justify-end">
              <span className="invisible mb-0.5 block text-xs">.</span>
              <p className="text-[11px] text-gray-400 whitespace-nowrap">
                Thời gian theo múi giờ: GMT+7
              </p>
            </div>
          </div>
        </div>

        <FormItem form={form} name="noiDung" label="Nội dung" className="min-w-0">
          <Input.TextArea
            placeholder="Nhập nội dung công việc, nội dung cuộc họp, ghi chú..."
            rows={3}
            // maxLength={1000}
            // showCount
            className="resize-none text-[13px]"
          />
        </FormItem>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormItem form={form} name="diaDiem" label="Địa điểm / Nền tảng" className="min-w-0">
            <Input
              placeholder="Nhập địa điểm hoặc nền tảng (phòng họp, Zoom, Google Meet, ...)"
              suffix={<MapPin size={14} className="text-gray-400" />}
              maxLength={200}
              className="h-9"
            />
          </FormItem>

          <FormItem form={form} name="nhacLich" label="Nhắc lịch" className="min-w-0">
            <Select
              className="h-9 w-full [&_.ant-select-selector]:!h-9 [&_.ant-select-selector]:!items-center [&_.ant-select-prefix]:!mr-2"
              options={TUY_CHON_NHAC_LICH.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
              prefix={<Bell size={14} className="text-gray-400" />}
            />
          </FormItem>
        </div>

        <FormItem
          form={form}
          name="nguoiLienQuanIds"
          label="Người liên quan (tùy chọn)"
          className="min-w-0 !mb-0"
        >
          <Select
            mode="multiple"
            allowClear
            showSearch
            filterOption={false}
            placeholder="Tìm theo Mã định danh/GV, tên, mã đơn vị..."
            className="w-full [&_.ant-select-selector]:!min-h-9"
            options={tuyChonNguoiLienQuan}
            optionRender={(option) => (
              <div className="py-0.5 text-sm text-gray-900">{option.data.label}</div>
            )}
            onSearch={setTimNguoiLienQuan}
            suffixIcon={<UserPlus size={14} className="text-gray-400" />}
          />
        </FormItem>
      </div>
    </PutFormModal>
  )
}

export default ModalThemLichCaNhan
