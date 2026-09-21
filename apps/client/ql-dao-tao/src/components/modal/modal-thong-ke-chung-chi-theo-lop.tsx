import { ArchivedCertificateStatus } from "@workspace/db/client"
import {
  useFindManyCertificate,
  useFindManyFixedClass,
  useFindManyTrainingCourse,
} from "@workspace/db/hooks"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Flex, Modal, Select, Table, Tag, message } from "antd"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

type ModalInput = {
  certificateId?: string
  trainingCourseId?: string
}

type CertKind = "approved" | "pending" | "none"

type StudentRow = {
  id: string
  code: string
  fullname: string
  kind: CertKind
  description: string
  issuedDate: string
}

type ClassStatRow = {
  id: string
  code: string
  name: string
  total: number
  approvedCount: number
  pendingCount: number
  withoutCount: number
  students: StudentRow[]
}

const formatIssuedDate = (value?: string | Date | null) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("vi-VN")
}

const pickCertKind = (
  certs: {
    status: ArchivedCertificateStatus | string
    description?: string | null
    issuedDate?: string | Date | null
  }[]
): { kind: CertKind; description: string; issuedDate: string } => {
  const approved = certs.find(
    (c) => c.status === ArchivedCertificateStatus.APPROVED || c.status === "APPROVED"
  )
  if (approved) {
    return {
      kind: "approved",
      description: approved.description || "",
      issuedDate: formatIssuedDate(approved.issuedDate),
    }
  }
  const pending = certs.find(
    (c) => c.status === ArchivedCertificateStatus.PENDING || c.status === "PENDING"
  )
  if (pending) {
    return {
      kind: "pending",
      description: pending.description || "",
      issuedDate: formatIssuedDate(pending.issuedDate),
    }
  }
  return { kind: "none", description: "", issuedDate: "" }
}

const CERT_KIND_LABEL: Record<CertKind, string> = {
  approved: "Đã duyệt",
  pending: "Chờ duyệt",
  none: "Chưa có",
}

const CERT_KIND_TAG_COLOR: Record<CertKind, string> = {
  approved: "green",
  pending: "orange",
  none: "red",
}

const CERT_KIND_EXCEL: Record<
  CertKind,
  { fill: string; font: string } | null
> = {
  approved: { fill: "FFC6EFCE", font: "FF006100" },
  pending: { fill: "FFFFC000", font: "FF9C5700" },
  none: null,
}

const toSheetName = (raw: string, used: Set<string>) => {
  let name = raw.replace(/[*?:\\/[\]]/g, " ").replace(/\s+/g, " ").trim() || "Lop"
  name = name.slice(0, 31)
  let unique = name
  let i = 2
  while (used.has(unique.toLowerCase())) {
    const suffix = ` (${i})`
    unique = `${name.slice(0, Math.max(1, 31 - suffix.length))}${suffix}`
    i += 1
  }
  used.add(unique.toLowerCase())
  return unique
}

const applyStatusCell = (cell: ExcelJS.Cell, kind: CertKind) => {
  cell.alignment = { horizontal: "center", vertical: "middle" }
  const excelStyle = CERT_KIND_EXCEL[kind]
  if (!excelStyle) return
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: excelStyle.fill },
  }
  cell.font = {
    bold: true,
    color: { argb: excelStyle.font },
  }
}

const ModalThongKeChungChiTheoLop = () => {
  const { isOpen, onClose, input } = useDisclosure<ModalInput>({
    tag: "ModalThongKeChungChiTheoLop",
  })
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const [certificateId, setCertificateId] = useState<string | undefined>()
  const [trainingCourseId, setTrainingCourseId] = useState<string | undefined>()

  useEffect(() => {
    if (!isOpen) return
    setCertificateId(input?.certificateId)
    setTrainingCourseId(input?.trainingCourseId)
  }, [isOpen, input])

  const { data: certificates = [] } = useFindManyCertificate(
    {
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    },
    { enabled: isOpen }
  )

  const { data: trainingCourses = [] } = useFindManyTrainingCourse(
    {
      where: { trainingObjectTypeId, deletedAt: null, active: true },
      orderBy: { semesterStart: { startDate: "desc" } },
    },
    { enabled: isOpen && !!trainingObjectTypeId }
  )

  const { data: fixedClasses = [], isFetching } = useFindManyFixedClass(
    {
      where: {
        trainingCourseId,
        deletedAt: null,
        trainingCourse: { trainingObjectTypeId, deletedAt: null, active: true },
      },
      include: {
        students: {
          where: { deletedAt: null },
          include: {
            userProfile: true,
            archivedCertificate: {
              where: {
                certificateId,
                deletedAt: null,
                status: {
                  in: [ArchivedCertificateStatus.PENDING, ArchivedCertificateStatus.APPROVED],
                },
              },
              select: { id: true, status: true, description: true, issuedDate: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    },
    { enabled: isOpen && !!certificateId && !!trainingCourseId && !!trainingObjectTypeId }
  )

  const classStats: ClassStatRow[] = useMemo(() => {
    return (fixedClasses as any[]).map((fc) => {
      const students = [...(fc.students || [])].sort((a, b) =>
        (a.userProfile?.fullname || "").localeCompare(b.userProfile?.fullname || "", "vi")
      )

      const studentRows: StudentRow[] = students.map((s: any) => {
        const certs = s.archivedCertificate || []
        const picked = pickCertKind(certs)
        return {
          id: s.id,
          code: s.userProfile?.code || s.code || "",
          fullname: s.userProfile?.fullname || "",
          kind: picked.kind,
          description: picked.description,
          issuedDate: picked.issuedDate,
        }
      })

      return {
        id: fc.id,
        code: fc.code || "",
        name: fc.name || "",
        total: studentRows.length,
        approvedCount: studentRows.filter((s) => s.kind === "approved").length,
        pendingCount: studentRows.filter((s) => s.kind === "pending").length,
        withoutCount: studentRows.filter((s) => s.kind === "none").length,
        students: studentRows,
      }
    })
  }, [fixedClasses])

  const handleExport = async () => {
    if (!certificateId || !trainingCourseId) {
      return message.warning("Vui lòng chọn chứng chỉ và khóa học")
    }
    if (classStats.length === 0) {
      return message.warning("Không có dữ liệu để xuất")
    }

    const certificateName = certificates.find((c) => c.id === certificateId)?.name || ""
    const courseName = trainingCourses.find((c) => c.id === trainingCourseId)?.name || ""

    try {
      message.loading({ content: "Đang xuất file...", key: "export-excel" })

      const workbook = new ExcelJS.Workbook()
      const summarySheet = workbook.addWorksheet("Tong hop")
      summarySheet.columns = [
        { header: "STT", key: "stt", width: 8 },
        { header: "Mã lớp", key: "code", width: 16 },
        { header: "Tên lớp", key: "name", width: 28 },
        { header: "Sĩ số", key: "total", width: 10 },
        { header: "Đã duyệt", key: "approvedCount", width: 12 },
        { header: "Chờ duyệt", key: "pendingCount", width: 12 },
        { header: "Chưa có", key: "withoutCount", width: 12 },
      ]
      classStats.forEach((row, index) => {
        summarySheet.addRow({
          stt: index + 1,
          code: row.code,
          name: row.name,
          total: row.total,
          approvedCount: row.approvedCount,
          pendingCount: row.pendingCount,
          withoutCount: row.withoutCount,
        })
      })
      summarySheet.getRow(1).font = { bold: true }

      const usedSheetNames = new Set<string>(["tong hop"])

      classStats.forEach((cls) => {
        const sheet = workbook.addWorksheet(toSheetName(cls.code || cls.name, usedSheetNames))
        sheet.columns = [
          { key: "stt", width: 8 },
          { key: "code", width: 16 },
          { key: "fullname", width: 28 },
          { key: "status", width: 18 },
          { key: "issuedDate", width: 16 },
          { key: "description", width: 32 },
        ]

        sheet.mergeCells("A1:F1")
        sheet.getCell("A1").value = `Lớp: ${cls.code} - ${cls.name}`
        sheet.getCell("A1").font = { bold: true, size: 13 }

        sheet.mergeCells("A2:F2")
        sheet.getCell("A2").value = `Chứng chỉ: ${certificateName}    Khóa: ${courseName}`

        const headerRow = sheet.getRow(3)
        headerRow.getCell(1).value = "STT"
        headerRow.getCell(2).value = "Mã SV"
        headerRow.getCell(3).value = "Họ và tên"
        headerRow.getCell(4).value = "Tình trạng"
        headerRow.getCell(5).value = "Ngày cấp"
        headerRow.getCell(6).value = "Ghi chú"
        headerRow.font = { bold: true }
        headerRow.alignment = { horizontal: "center", vertical: "middle" }

        cls.students.forEach((s, index) => {
          const excelRow = sheet.getRow(4 + index)
          excelRow.getCell(1).value = index + 1
          excelRow.getCell(2).value = s.code
          excelRow.getCell(3).value = s.fullname
          excelRow.getCell(4).value = CERT_KIND_LABEL[s.kind]
          applyStatusCell(excelRow.getCell(4), s.kind)
          excelRow.getCell(5).value = s.issuedDate || ""
          excelRow.getCell(5).alignment = { horizontal: "center", vertical: "middle" }
          excelRow.getCell(6).value = s.description || ""
          excelRow.getCell(6).alignment = { vertical: "middle", wrapText: true }
        })
      })

      const buffer = await workbook.xlsx.writeBuffer()
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `THONG_KE_CHUNG_CHI_THEO_LOP.xlsx`
      )
      message.success({ content: "Xuất Excel thành công", key: "export-excel" })
    } catch (error) {
      console.error(error)
      message.error({ content: "Có lỗi xảy ra khi xuất file", key: "export-excel" })
    }
  }

  return (
    <Modal
      title="Thống kê chứng chỉ theo lớp"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={1100}
      destroyOnClose
      className="thong-ke-cc-lop-modal"
      styles={{ body: { maxHeight: "75vh", overflow: "auto" } }}
    >
      <Flex vertical gap={12}>
        <Flex gap={8} wrap="wrap">
          <Select
            className="min-w-[240px] flex-1"
            placeholder="Chọn chứng chỉ"
            value={certificateId}
            onChange={setCertificateId}
            allowClear
            showSearch
            optionFilterProp="label"
            options={certificates.map((c) => ({ label: c.name, value: c.id }))}
          />
          <Select
            className="min-w-[240px] flex-1"
            placeholder="Chọn khóa học"
            value={trainingCourseId}
            onChange={setTrainingCourseId}
            allowClear
            showSearch
            optionFilterProp="label"
            options={trainingCourses.map((c) => ({ label: c.name, value: c.id }))}
          />
          <Button
            type="primary"
            onClick={handleExport}
            disabled={!certificateId || !trainingCourseId || classStats.length === 0}
          >
            Xuất Excel
          </Button>
        </Flex>

        {certificateId && trainingCourseId ? (
          <Table
            rowKey="id"
            size="small"
            bordered
            dataSource={classStats}
            loading={isFetching}
            pagination={false}
            expandable={{
              expandRowByClick: true,
              expandedRowClassName: () => "thong-ke-cc-lop-expanded",
              expandedRowRender: (record: ClassStatRow) => (
                <div className="thong-ke-cc-lop-student-list bg-white">
                  <Table
                    rowKey="id"
                    size="small"
                    bordered
                    dataSource={record.students}
                    pagination={false}
                    columns={[
                      {
                        title: "STT",
                        width: 60,
                        align: "center",
                        render: (_: unknown, __: StudentRow, index: number) => index + 1,
                      },
                      {
                        title: "Mã SV",
                        dataIndex: "code",
                        width: 140,
                        align: "center",
                      },
                      { title: "Họ và tên", dataIndex: "fullname" },
                      {
                        title: "Trạng thái",
                        key: "status",
                        width: 160,
                        align: "center",
                        render: (_: unknown, student: StudentRow) => (
                          <Tag color={CERT_KIND_TAG_COLOR[student.kind]}>
                            {CERT_KIND_LABEL[student.kind]}
                          </Tag>
                        ),
                      },
                      {
                        title: "Ngày cấp",
                        dataIndex: "issuedDate",
                        width: 120,
                        align: "center",
                        render: (value: string) => value || "-",
                      },
                      {
                        title: "Ghi chú",
                        dataIndex: "description",
                        render: (value: string) => value || "-",
                      },
                    ]}
                  />
                </div>
              ),
            }}
            columns={[
              {
                title: "STT",
                width: 60,
                align: "center",
                render: (_: unknown, __: ClassStatRow, index: number) => index + 1,
              },
              { title: "Mã lớp", dataIndex: "code", width: 140, align: "center" },
              { title: "Tên lớp", dataIndex: "name" },
              { title: "Sĩ số", dataIndex: "total", width: 90, align: "center" },
              {
                title: "Đã duyệt",
                dataIndex: "approvedCount",
                width: 100,
                align: "center",
                render: (value: number) => (
                  <span className="font-semibold text-green-700">{value}</span>
                ),
              },
              {
                title: "Chờ duyệt",
                dataIndex: "pendingCount",
                width: 110,
                align: "center",
                render: (value: number) => (
                  <span className="font-semibold text-orange-500">{value}</span>
                ),
              },
              {
                title: "Chưa có",
                dataIndex: "withoutCount",
                width: 100,
                align: "center",
                render: (value: number) => (
                  <span className="font-semibold text-red-600">{value}</span>
                ),
              },
            ]}
          />
        ) : (
          <div className="text-gray-500 py-6 text-center">
            Chọn chứng chỉ và khóa học để xem lớp nào đã có sinh viên có chứng chỉ, lớp nào chưa.
          </div>
        )}
      </Flex>
      <style>{`
        .thong-ke-cc-lop-modal .thong-ke-cc-lop-expanded > td {
          background: #fff !important;
          padding: 12px 16px !important;
        }
        .thong-ke-cc-lop-modal .thong-ke-cc-lop-expanded:hover > td {
          background: #fff !important;
        }
        .thong-ke-cc-lop-student-list {
          max-height: 320px;
          overflow: auto;
        }
        .thong-ke-cc-lop-student-list .ant-table-thead > tr > th {
          position: sticky;
          top: 0;
          z-index: 1;
          background: #fafafa;
        }
      `}</style>
    </Modal>
  )
}

export default ModalThongKeChungChiTheoLop
