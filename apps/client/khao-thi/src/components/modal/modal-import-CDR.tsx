import { DownloadOutlined, UploadOutlined } from "@ant-design/icons"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import { queryClient } from "@api/index"
import { Button, Col, Flex, Form, message, Table, Upload } from "antd"
import * as XLSX from "xlsx"
import { useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import type { Key } from "react"
import type { UploadProps } from "antd/lib"
import { LEVEL_COLUMNS, QUESTION_TYPE_OPTIONS } from "@constants/constants"
import type { KnowledgeBlockFormData } from "./put-chuan-dau-ra"
import { useFindManyKnowledgeBlock } from "@workspace/db/hooks"
import type { Difficult, QuestionType } from "@workspace/db"
import { sqlTransaction } from "@workspace/libs/api/model"
import { getMinioUrl } from "@workspace/libs"

type ImportedKnowledgeBlock = {
  key: number
  code: string
  name: string
  description?: string | null
  exams: {
    difficult: Difficult
    quantity: number
    type?: QuestionType | null
  }[]
}
const getQuestionTypeLabel = (type?: string | null) => {
  if (!type) return "Tất cả"
  return QUESTION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
}

const renderQuantityWithPoint = (exams: ImportedKnowledgeBlock["exams"], difficult: string) => {
  const exam = exams.find((e) => e.difficult === difficult)
  if (!exam) return "0"
  return `${exam.quantity}`
}

const parseQuantity = (value: unknown): number | null => {
  if (value == null) return null

  const text = String(value).trim()
  if (!text) return null

  const num = Number(text)
  if (!Number.isNaN(num) && num >= 0) return num

  return null
}

const parseQuestionType = (value?: string | null): QuestionType | null => {
  if (!value) return null

  const text = value.trim()

  if (text.toLowerCase() === "tất cả" || text.toLowerCase() === "tat ca") {
    return null
  }

  if (text === "null") return null

  const map: Record<string, QuestionType> = {
    "Tự luận": "ESSAY",
    "Vấn đáp": "ORAL",
    "Trắc nghiệm": "SINGLE_CHOICE",
    "Trắc nghiệm một lựa chọn": "SINGLE_CHOICE",
    "Trắc nghiệm 1 lựa chọn": "SINGLE_CHOICE",
    "Trắc nghiệm 1 đáp án": "SINGLE_CHOICE",
    "Trắc nghiệm nhiều lựa chọn": "MULTIPLE_CHOICE",
    "Điền vào chỗ trống": "FILL_IN_BLANK",
    "Sắp xếp thứ tự": "ORDERING",
  }

  return map[text] ?? null
}

const normalizeHeader = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()

const getExcelCell = (row: any, columnName: string) => {
  const target = normalizeHeader(columnName)
  const key = Object.keys(row).find((k) => normalizeHeader(k) === target)
  return key ? row[key] : null
}

const normalizeOutcomeCode = (value: unknown): string => {
  if (value == null) return ""

  let text = String(value).trim()
  if (!text) return ""

  text = text.toUpperCase()
  text = text.replace(/\s+/g, "")
  text = text.replace(/[^A-Z0-9-]/g, "")

  return text
}

const ModalImportCDR = () => {
  const { showSpinner, hideSpinner } = useSpinner()
  const [data, setData] = useState<ImportedKnowledgeBlock[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [form] = Form.useForm<KnowledgeBlockFormData>()
  const { isOpen, onClose, input } = useDisclosure<{
    id?: string
    matrixId?: string
  }>({
    tag: "ModalImportCDR",
    onClose: form.resetFields,
  })

  const { data: knowledgeBlocks = [] } = useFindManyKnowledgeBlock({
    select: { id: true, code: true },
  })

  const handleImportExcel: UploadProps["beforeUpload"] = async (file) => {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, {
      defval: null,
      header: 0,
    })

    if (!rows.length) {
      message.error("File Excel không có dữ liệu")
      return false
    }

    const imported: ImportedKnowledgeBlock[] = rows.map((row, index) => {
      const exams = LEVEL_COLUMNS.reduce<ImportedKnowledgeBlock["exams"]>((acc, col) => {
        const quantity = parseQuantity(getExcelCell(row, col.label))
        if (quantity === null) return acc

        acc.push({
          difficult: col.difficult,
          quantity,
          type: parseQuestionType(getExcelCell(row, "Loại câu hỏi")),
        })

        return acc
      }, [])

      const rawCode = getExcelCell(row, "Mã chuẩn đầu ra")

      return {
        key: index,
        name: String(getExcelCell(row, "Chuẩn đầu ra") ?? "").trim(),
        code: normalizeOutcomeCode(rawCode),
        description: String(getExcelCell(row, "Mô tả") ?? "").trim() || null,
        exams,
      }
    })

    setData(imported)
    setSelectedRowKeys(imported.map((_, i) => i))
    message.success(`Import thành công ${imported.length} chuẩn đầu ra`)
    return false
  }

  const onOk = async () => {
    const selected = selectedRowKeys.map((k) => data[Number(k)]).filter(Boolean)

    if (!input?.matrixId) {
      message.error("Thiếu examMatrixId, không thể import")
      return
    }

    if (!selected.length) {
      message.warning("Vui lòng chọn ít nhất một chuẩn đầu ra")
      return
    }

    const existing = new Set(knowledgeBlocks.map((k: any) => k.code).filter(Boolean))

    const count: Record<string, number> = {}
    selected.forEach((i) => {
      count[i.code] = (count[i.code] ?? 0) + 1
    })

    const duplicatedCodes = Object.keys(count).filter(
      (code) => count[code] > 1 || existing.has(code)
    )

    if (duplicatedCodes.length) {
      message.error(`Các mã chuẩn đầu ra bị trùng: ${duplicatedCodes.join(", ")}`)
      return
    }

    try {
      showSpinner()

      const res = await sqlTransaction(
        selected.map((item) => ({
          model: "KnowledgeBlock",
          operation: "create",
          data: {
            data: {
              code: item.code,
              name: item.name,
              description: item.description ?? undefined,
              examMatrixId: input.matrixId,
              configExams: {
                create: item.exams.map((e) => ({
                  difficult: e.difficult,
                  quantity: e.quantity,
                  type: e.type ?? null,
                  point: 0,
                })),
              },
            },
          },
        }))
      )

      if (res?.status !== 200) {
        message.error(
          `Không thể import. Các mã chuẩn đầu ra có vấn đề: ${selected
            .map((i) => `${i.code} (${i.name})`)
            .join(", ")}`
        )
        return
      }

      message.success(`Đã import ${selected.length} chuẩn đầu ra`)
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "KnowledgeBlock"],
      })

      onClose()
    } catch (err) {
      console.error(err)
      message.error("Import thất bại")
    } finally {
      hideSpinner()
    }
  }

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      title="Import Chuẩn đầu ra từ Excel"
      className="w-[900px]"
    >
      <Col span={24}>
        <Flex align="center" gap={16}>
          <Upload accept=".xlsx" showUploadList={false} beforeUpload={handleImportExcel}>
            <Button type="primary" icon={<UploadOutlined />}>
              Import Excel
            </Button>
          </Upload>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            iconPosition="end"
            className="mr-2"
            href={getMinioUrl("mta/template/File-mau-chuan-dau-ra.xlsx")}
          >
            Tải file mẫu
          </Button>
        </Flex>
      </Col>

      {data.length > 0 && (
        <Table
          rowKey="key"
          dataSource={data}
          className="mt-2 w-[900px]"
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          columns={[
            {
              title: "Chuẩn đầu ra",
              dataIndex: "name",
            },
            {
              title: "Mã chuẩn đầu ra",
              dataIndex: "code",
              width: 100,
            },
            {
              title: "Loại câu hỏi",
              width: 100,
              render: (_, r) => getQuestionTypeLabel(r.exams[0]?.type),
            },

            ...LEVEL_COLUMNS.map((col) => ({
              title: col.label,
              width: 100,
              render: (_: any, r: ImportedKnowledgeBlock) =>
                renderQuantityWithPoint(r.exams, col.difficult),
            })),

            {
              title: "Mô tả",
              dataIndex: "description",
              width: 100,
            },
          ]}
        />
      )}
    </PutFormModal>
  )
}

export default ModalImportCDR
