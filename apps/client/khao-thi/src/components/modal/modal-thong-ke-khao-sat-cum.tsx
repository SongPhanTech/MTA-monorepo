import useSpinner from "@hooks/spinner"
import { useFindUniqueClusterSurvey } from "@workspace/db/hooks"
import { customExamFetch } from "@workspace/libs/api/custom-instance"
import { Button, DatePicker, Form, Input, InputNumber, Modal, Select, message } from "antd"
import dayjs, { type Dayjs } from "dayjs"
import { saveAs } from "file-saver"
import { useEffect, useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type ModalInput = {
  id: string
  name?: string
}

const ModalThongKeKhaoSatCum = () => {
  const [form] = Form.useForm()
  const { showSpinner, hideSpinner } = useSpinner()
  const { isOpen, onClose, input } = useDisclosure<ModalInput>({
    tag: "ModalThongKeKhaoSatCum",
  })

  const { data: cluster, isLoading } = useFindUniqueClusterSurvey(
    {
      where: { id: input?.id || "" },
      include: {
        surveyChoice: { orderBy: { answer: "asc" } },
        surveyObjectType: true,
        surveys: {
          take: 1,
          include: {
            semester: { include: { schoolYear: true } },
            trainingObjectType: true,
          },
        },
      },
    },
    { enabled: !!input?.id && isOpen }
  )

  const choiceOptions = useMemo(
    () =>
      (cluster?.surveyChoice || []).map((c) => ({
        value: c.id,
        label: c.description || c.answer || c.id,
      })),
    [cluster?.surveyChoice]
  )

  useEffect(() => {
    if (!isOpen || !cluster) return

    const choices = cluster.surveyChoice || []
    const textOf = (c: (typeof choices)[number]) =>
      `${c.description || ""} ${c.answer || ""}`.toLowerCase()

    const verySatisfied = choices.filter((c) => textOf(c).includes("rất hài lòng")).map((c) => c.id)
    const satisfied = choices
      .filter((c) => {
        const t = textOf(c)
        return t.includes("hài lòng") && !t.includes("không hài lòng") && !t.includes("rất hài lòng")
      })
      .map((c) => c.id)
    const concern = choices
      .filter((c) => {
        const t = textOf(c)
        return t.includes("không hài lòng") || t.includes("phân vân")
      })
      .map((c) => c.id)

    const positiveIds =
      verySatisfied.length || satisfied.length
        ? [...verySatisfied, ...satisfied]
        : choices.slice(0, 2).map((c) => c.id)
    const highIds = verySatisfied.length ? verySatisfied : positiveIds.slice(0, 1)
    const concernIds = concern.length ? concern : choices.slice(-3).map((c) => c.id)

    const objectTypeNames = (cluster.surveyObjectType || []).map((o) => o.name).filter(Boolean)
    const trainingName = cluster.surveys?.[0]?.trainingObjectType?.name || ""
    const doiTuong = [...objectTypeNames, trainingName].filter(Boolean).join(" - ") || cluster.name
    const semester = cluster.surveys?.[0]?.semester
    const schoolYearName = semester?.schoolYear?.name || ""
    const semesterName = semester?.name || ""
    const kyMatch =
      semesterName.match(/HK\s*([12])/i) ||
      semesterName.match(/học\s*k[ỳy]\s*([12])/i) ||
      semesterName.match(/(?:^|[^\d])([12])(?:$|[^\d])/)
    const kyNumber = kyMatch?.[1]
    const hocKyNamHoc =
      kyNumber && schoolYearName
        ? `Học kỳ ${kyNumber} năm học ${schoolYearName}`
        : kyNumber
          ? `Học kỳ ${kyNumber}`
          : [semesterName, schoolYearName ? `năm học ${schoolYearName}` : ""]
              .filter(Boolean)
              .join(" ")
              .trim()

    form.setFieldsValue({
      positiveChoiceIds: Array.from(new Set(positiveIds)),
      highChoiceIds: highIds,
      highThreshold: 50,
      concernChoiceIds: Array.from(new Set(concernIds)),
      concernThreshold: 20,
      doiTuongTieuDe: doiTuong.toUpperCase(),
      doiTuongMoTa: doiTuong,
      doiTuongChiTiet: doiTuong,
      phamVi: "100% học phần trong thời khóa biểu học kỳ",
      hocKyNamHoc: hocKyNamHoc || cluster.name,
      diaDiem: "Hà Nội",
      ngayBaoCao: dayjs(),
      vaiTroNguoiKi: "TRƯỞNG BAN",
      tenNguoiKi: "",
    })
  }, [isOpen, cluster, form])

  const handleExport = async () => {
    try {
      const values = await form.validateFields()
      if (!input?.id) return

      const ngayBaoCao = values.ngayBaoCao as Dayjs | undefined
      const payload = {
        ...values,
        ngayBaoCao: undefined,
        date: ngayBaoCao ? String(ngayBaoCao.date()).padStart(2, "0") : undefined,
        month: ngayBaoCao ? String(ngayBaoCao.month() + 1).padStart(2, "0") : undefined,
        year: ngayBaoCao ? ngayBaoCao.year() : undefined,
      }

      showSpinner()
      const res = await customExamFetch<{ status: number; data: Blob; headers: Headers }>(
        `/api/cluster-survey/${input.id}/summary-report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      if (res.status !== 200 || !(res.data instanceof Blob)) {
        let errMsg = "Xuất báo cáo thất bại"
        try {
          if (res.data instanceof Blob) {
            const text = await res.data.text()
            const json = JSON.parse(text)
            errMsg = json?.message || errMsg
          }
        } catch {
          // ignore
        }
        message.error(errMsg)
        return
      }

      const fileName = `Bao_cao_thong_ke_${input.name || "khao_sat"}.docx`
      saveAs(res.data, fileName)
      message.success("Xuất báo cáo thành công")
      onClose()
    } catch (error: any) {
      if (error?.errorFields) return
      message.error(error?.message || "Đã xảy ra lỗi, vui lòng thử lại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={`Thống kê khảo sát${input?.name ? `: ${input.name}` : ""}`}
      width={720}
      centered
      destroyOnClose
      // styles={{
      //   body: {
      //     maxHeight: "calc(100vh - 200px)",
      //     overflowY: "auto",
      //     paddingTop: 8,
      //   },
      // }}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button key="ok" type="primary" loading={isLoading} onClick={handleExport}>
          Xuất báo cáo Word
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" className="mt-2">
        <Form.Item
          label='Mức đánh giá tính % trung bình (vd: "Rất hài lòng", "Hài lòng")'
          name="positiveChoiceIds"
          rules={[{ required: true, message: "Chọn ít nhất 1 mức" }]}
        >
          <Select mode="multiple" options={choiceOptions} placeholder="Chọn mức đánh giá" />
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Form.Item
            label='Mức so sánh cao (vd: "Rất hài lòng")'
            name="highChoiceIds"
            rules={[{ required: true, message: "Chọn ít nhất 1 mức" }]}
          >
            <Select mode="multiple" options={choiceOptions} placeholder="Chọn mức" />
          </Form.Item>
          <Form.Item
            label="Định mức so sánh cao (%)"
            name="highThreshold"
            rules={[{ required: true, message: "Nhập định mức" }]}
          >
            <InputNumber min={0} max={100} className="w-full" addonAfter="%" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Form.Item
            label='Mức cần xem xét (vd: "Không hài lòng", "Phân vân")'
            name="concernChoiceIds"
            rules={[{ required: true, message: "Chọn ít nhất 1 mức" }]}
          >
            <Select mode="multiple" options={choiceOptions} placeholder="Chọn mức" />
          </Form.Item>
          <Form.Item
            label="Định mức cần xem xét (%)"
            name="concernThreshold"
            rules={[{ required: true, message: "Nhập định mức" }]}
          >
            <InputNumber min={0} max={100} className="w-full" addonAfter="%" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Form.Item label="Tiêu đề đối tượng (IN HOA trên báo cáo)" name="doiTuongTieuDe">
            <Input placeholder="HỌC VIÊN KỸ SƯ DÂN SỰ" />
          </Form.Item>
          <Form.Item label="Đối tượng mô tả (đoạn mở đầu)" name="doiTuongMoTa">
            <Input placeholder="sinh viên kỹ sư dân sự" />
          </Form.Item>
          <Form.Item label="Đối tượng chi tiết (mục 1)" name="doiTuongChiTiet">
            <Input placeholder="sinh viên kỹ sư dân sự Khóa 18" />
          </Form.Item>
          <Form.Item label="Phạm vi lấy ý kiến" name="phamVi">
            <Input placeholder="100% học phần trong thời khóa biểu học kỳ 1" />
          </Form.Item>
          <Form.Item label="Học kỳ / năm học" name="hocKyNamHoc" className="md:col-span-2">
            <Input disabled placeholder="Học kỳ 1 năm học 2025-2026" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Form.Item label="Địa điểm" name="diaDiem">
            <Input placeholder="Hà Nội" />
          </Form.Item>
          <Form.Item label="Ngày tháng năm" name="ngayBaoCao">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item label="Vai trò người ký" name="vaiTroNguoiKi">
            <Input placeholder="TRƯỞNG BAN" />
          </Form.Item>
          <Form.Item label="Tên người ký" name="tenNguoiKi">
            <Input placeholder="Đại tá ..." />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}

export default ModalThongKeKhaoSatCum
