import {
  AlignmentType,
  BorderStyle,
  Document,
  LeaderType,
  Packer,
  Paragraph,
  Tab,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  WidthType,
} from "docx"
import { saveAs } from "file-saver"
import { toRoman } from "@lib/utils"

const FONT = "Times New Roman"
const FONT_SIZE = 26

/** Bề ngang vùng in của khổ A4 với lề đang dùng, tính bằng twip. */
const CONTENT_WIDTH = 9600
const HALF_WIDTH = CONTENT_WIDTH / 2

const NONE_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } as const
const BORDERLESS = {
  top: NONE_BORDER,
  bottom: NONE_BORDER,
  left: NONE_BORDER,
  right: NONE_BORDER,
}

export type SurveyFormChoice = {
  id?: string
  answer?: string | null
  description?: string | null
  requireExplanation?: boolean | null
}

export type SurveyFormQuestion = {
  id?: string
  name?: string | null
  type?: string | null
  specificChoice?: readonly { description?: string | null }[] | null
}

export type SurveyFormGroup = {
  id?: string
  name?: string | null
  questions: readonly SurveyFormQuestion[]
}

export type SurveyFormInfoField = {
  label: string
  fullWidth?: boolean
}

export type ExportSurveyFormDocxInput = {
  headerLeft?: string
  formCode?: string
  title?: string | null
  notes?: readonly string[]
  notesAfterInfo?: boolean
  infoTitle?: string
  infoFields?: readonly SurveyFormInfoField[]
  contentTitle?: string
  choices: readonly SurveyFormChoice[]
  groups: readonly SurveyFormGroup[]
  fileName: string
}

const stripHtml = (value?: string | null) =>
  (value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

const toTextLines = (value?: string | null) => {
  const lines = stripHtml(value).split("\n")
  return lines.length ? lines : [""]
}

const text = (
  value: string,
  options?: { bold?: boolean; italics?: boolean; alignment?: "left" | "center" | "right" }
) =>
  new Paragraph({
    alignment:
      options?.alignment === "center"
        ? AlignmentType.CENTER
        : options?.alignment === "right"
          ? AlignmentType.RIGHT
          : AlignmentType.LEFT,
    spacing: { after: 40 },
    children: [new TextRun({ text: value, bold: options?.bold, italics: options?.italics })],
  })

/** Dòng "Nhãn: ......" để người dùng điền tay sau khi in. */
const dottedField = (label: string, width: number) =>
  new Paragraph({
    spacing: { after: 60 },
    tabStops: [{ type: TabStopType.RIGHT, position: width, leader: LeaderType.DOT }],
    children: [new TextRun({ text: label }), new TextRun({ children: [new Tab()] })],
  })

const borderlessCell = (children: Paragraph[], columnSpan?: number) =>
  new TableCell({ children, columnSpan, borders: BORDERLESS })

const headerBlock = (input: ExportSurveyFormDocxInput) => {
  const children: (Paragraph | Table)[] = []

  const headerLeft =
    !input.headerLeft || input.headerLeft === "HỌC VIỆN KTQS"
      ? "HỌC VIỆN KỸ THUẬT QUÂN SỰ"
      : input.headerLeft

  if (headerLeft || input.formCode) {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: BORDERLESS,
        rows: [
          new TableRow({
            children: [
              borderlessCell([text(headerLeft, { bold: true })]),
              borderlessCell([text(input.formCode || "", { italics: true, alignment: "right" })]),
            ],
          }),
        ],
      })
    )
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({ text: stripHtml(input.title).toLocaleUpperCase("vi-VN"), bold: true }),
      ],
    })
  )

  return children
}

const infoBlock = (input: ExportSurveyFormDocxInput) => {
  const fields = input.infoFields || []
  if (!fields.length) return []

  const children: (Paragraph | Table)[] = []
  if (input.infoTitle) children.push(text(input.infoTitle, { bold: true }))

  const rows: TableRow[] = []
  for (let i = 0; i < fields.length; i += 1) {
    const field = fields[i]
    if (field.fullWidth) {
      rows.push(
        new TableRow({
          children: [borderlessCell([dottedField(field.label, CONTENT_WIDTH)], 2)],
        })
      )
      continue
    }

    const next = fields[i + 1]
    if (next && !next.fullWidth) {
      rows.push(
        new TableRow({
          children: [
            borderlessCell([dottedField(field.label, HALF_WIDTH - 200)]),
            borderlessCell([dottedField(next.label, HALF_WIDTH - 200)]),
          ],
        })
      )
      i += 1
      continue
    }

    rows.push(
      new TableRow({
        children: [
          borderlessCell([dottedField(field.label, HALF_WIDTH - 200)]),
          borderlessCell([new Paragraph("")]),
        ],
      })
    )
  }

  children.push(
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: BORDERLESS, rows })
  )

  return children
}

/** Đáp án đặc biệt: nhãn trên, ô tick dưới, xếp ngang để tiết kiệm diện tích. */
const specificChoiceOptionsTable = (choices: readonly { description?: string | null }[]) => {
  const columnWidth = Math.floor(100 / choices.length)

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDERLESS,
    rows: [
      new TableRow({
        children: choices.map(
          (choice) =>
            new TableCell({
              verticalAlign: "center",
              width: { size: columnWidth, type: WidthType.PERCENTAGE },
              borders: BORDERLESS,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 40 },
                  children: [new TextRun({ text: stripHtml(choice?.description) })],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 0 },
                  children: [new TextRun({ text: "\u2610" })],
                }),
              ],
            })
        ),
      }),
    ],
  })
}

/** Bảng chú giải thang phản hồi: mô tả ở hàng trên, ký hiệu ở hàng dưới. */
const choiceLegendTable = (choices: readonly SurveyFormChoice[]) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: choices.map(
          (choice) =>
            new TableCell({
              verticalAlign: "center",
              children: [
                text(`${choice?.description || ""}${choice?.requireExplanation ? " *" : ""}`, {
                  bold: true,
                  alignment: "center",
                }),
              ],
            })
        ),
      }),
      new TableRow({
        children: choices.map(
          (choice) =>
            new TableCell({
              verticalAlign: "center",
              children: [text(String(choice?.answer ?? ""), { alignment: "center" })],
            })
        ),
      }),
    ],
  })

const questionTable = (input: ExportSurveyFormDocxInput) => {
  const choices = input.choices
  const totalColumns = 2 + choices.length

  const rows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          rowSpan: 2,
          verticalAlign: "center",
          width: { size: 7, type: WidthType.PERCENTAGE },
          children: [text("STT", { bold: true, alignment: "center" })],
        }),
        new TableCell({
          rowSpan: 2,
          verticalAlign: "center",
          width: { size: 93 - choices.length * 8, type: WidthType.PERCENTAGE },
          children: [text("Nội dung phản hồi", { bold: true, alignment: "center" })],
        }),
        new TableCell({
          columnSpan: choices.length,
          verticalAlign: "center",
          children: [text("Mức phản hồi", { bold: true, alignment: "center" })],
        }),
      ],
    }),
    new TableRow({
      tableHeader: true,
      children: choices.map(
        (choice) =>
          new TableCell({
            verticalAlign: "center",
            width: { size: 8, type: WidthType.PERCENTAGE },
            children: [text(String(choice?.answer ?? ""), { bold: true, alignment: "center" })],
          })
      ),
    }),
  ]

  let questionIndex = 0
  input.groups.forEach((group, groupIndex) => {
    if (group?.name) {
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              columnSpan: totalColumns,
              children: [
                text(
                  `${toRoman(groupIndex + 1)}. ${stripHtml(group.name).toLocaleUpperCase("vi-VN")}`,
                  { bold: true }
                ),
              ],
            }),
          ],
        })
      )
    }

    group.questions.forEach((question) => {
      questionIndex += 1
      const specificChoices = question?.specificChoice || []
      const isEssay = question?.type === "ESSAY"
      const hasOwnChoices = specificChoices.length > 0
      const contentChildren: (Paragraph | Table)[] = toTextLines(question?.name).map((line) =>
        text(line)
      )

      if (hasOwnChoices) {
        contentChildren.push(
          new Paragraph({ spacing: { before: 80, after: 40 } }),
          specificChoiceOptionsTable(specificChoices)
        )
      } else if (isEssay) {
        for (let line = 0; line < 3; line += 1) {
          contentChildren.push(
            new Paragraph({
              spacing: { after: 60 },
              tabStops: [
                { type: TabStopType.RIGHT, position: CONTENT_WIDTH - 400, leader: LeaderType.DOT },
              ],
              children: [new TextRun({ children: [new Tab()] })],
            })
          )
        }
      }

      rows.push(
        new TableRow({
          children: [
            new TableCell({
              verticalAlign: "center",
              children: [text(String(questionIndex), { alignment: "center" })],
            }),
            new TableCell({
              columnSpan: hasOwnChoices || isEssay ? totalColumns - 1 : undefined,
              children: contentChildren,
            }),
            ...(hasOwnChoices || isEssay
              ? []
              : choices.map(() => new TableCell({ children: [new Paragraph("")] }))),
          ],
        })
      )
    })
  })

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })
}

export const buildSurveyFormDocx = (input: ExportSurveyFormDocxInput) => {
  const notes = (input.notes || []).map(
    (note) =>
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 80 },
        indent: { firstLine: 567 },
        children: [new TextRun({ text: note, italics: true })],
      })
  )
  const info = infoBlock(input)

  const children: (Paragraph | Table)[] = [
    ...headerBlock(input),
    ...(input.notesAfterInfo ? [...info, ...notes] : [...notes, ...info]),
  ]

  if (input.choices.length) {
    if (input.contentTitle) {
      children.push(
        new Paragraph({
          spacing: { before: 160, after: 80 },
          children: [new TextRun({ text: input.contentTitle, bold: true })],
        })
      )
    }
    children.push(choiceLegendTable(input.choices))
    children.push(new Paragraph(""))
    children.push(questionTable(input))
  }

  return new Document({
    styles: { default: { document: { run: { font: FONT, size: FONT_SIZE } } } },
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, right: 850, bottom: 1134, left: 1417 } },
        },
        children,
      },
    ],
  })
}

export const exportSurveyFormDocx = async (input: ExportSurveyFormDocxInput) => {
  const blob = await Packer.toBlob(buildSurveyFormDocx(input))
  saveAs(blob, input.fileName)
}

/** Build DOCX blob without triggering browser download (for MinIO upload). */
export const buildSurveyFormDocxBlob = async (
  input: Omit<ExportSurveyFormDocxInput, "fileName">
) => {
  return Packer.toBlob(buildSurveyFormDocx({ ...input, fileName: "survey.docx" }))
}

export const toDocxFileName = (prefix: string, name?: string | null) => {
  const safeName = stripHtml(name)
    .replace(/[\\/:*?"<>|]+/g, " ")
    .trim()
  return `${prefix}${safeName ? ` - ${safeName}` : ""}.docx`
}
