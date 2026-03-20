import DOMPurify from 'dompurify'
import { DownloadOutlined } from '@ant-design/icons'
import type { DataTabEvaluationCriterionType } from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/standar-reports'
import { sqlTransaction } from '@workspace/libs/api/model'
import { Button } from 'antd'
import {
    AlignmentType,
    BorderStyle,
    Document,
    type IImageOptions,
    ImageRun,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    VerticalAlign,
    WidthType,
} from 'docx'
import { saveAs } from 'file-saver'

// Font size constants (half-points: 32 = 16pt, 28 = 14pt)
const SIZE_BODY = 32
const SIZE_DESC = 28

interface ExportCriteriaEvaluationProps {
    data: DataTabEvaluationCriterionType
}

const ExportCriteriaEvaluation = ({ data }: ExportCriteriaEvaluationProps) => {
    const rgbToHex = (rgb: string): string | undefined => {
        const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
        if (!match) return undefined
        const r = Number.parseInt(match[1], 10)
        const g = Number.parseInt(match[2], 10)
        const b = Number.parseInt(match[3], 10)
        return [r, g, b]
            .map((x) => x.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()
    }

    const normalizeColor = (color: string): string | undefined => {
        if (!color) return undefined
        const map: Record<string, string> = {
            gray: '808080',
            red: 'FF0000',
            green: '008000',
            blue: '0000FF',
            orange: 'FFA500',
        }
        if (map[color.toLowerCase()]) return map[color.toLowerCase()]
        if (color.startsWith('rgb')) return rgbToHex(color)
        if (color.startsWith('#')) return color.replace('#', '').toUpperCase()
        return color
    }

    const htmlToParagraphs = async (html: string): Promise<(Paragraph | Table)[]> => {
        if (!html) return []

        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const nodes = Array.from(doc.body.childNodes)

        const paragraphs: (Paragraph | Table)[] = []

        for (const node of nodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement

                if (el.tagName === 'IMG') {
                    const src = el.getAttribute('src')
                    if (src) {
                        try {
                            const res = await fetch(src)
                            const blob = await res.blob()
                            const reader = new FileReader()
                            const base64 = await new Promise<string>((resolve, reject) => {
                                reader.onloadend = () => resolve(reader.result as string)
                                reader.onerror = reject
                                reader.readAsDataURL(blob)
                            })
                            const uint8Array = Uint8Array.from(atob(base64.split(',')[1]), (c) =>
                                c.charCodeAt(0)
                            )
                            paragraphs.push(
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new ImageRun({
                                            data: uint8Array,
                                            transformation: { width: 400, height: 300 },
                                        } as IImageOptions),
                                    ],
                                })
                            )
                        } catch (err) {
                            console.error('Lỗi tải ảnh:', err)
                        }
                    }
                }

                if (el.tagName === 'TABLE') {
                    const rows: TableRow[] = []
                    const trs = Array.from(
                        el.querySelectorAll(':scope > tbody > tr, :scope > thead > tr, :scope > tr')
                    )

                    // Tính số cột tối đa (có tính colspan)
                    let maxCols = 0
                    for (const tr of trs) {
                        let colCount = 0
                        for (const td of Array.from(
                            tr.querySelectorAll(':scope > td, :scope > th')
                        )) {
                            colCount += Number.parseInt(td.getAttribute('colspan') || '1', 10)
                        }
                        maxCols = Math.max(maxCols, colCount)
                    }
                    if (maxCols === 0) maxCols = 1

                    // A4 với margin ~2.5cm mỗi bên ≈ 9070 DXA
                    const PAGE_WIDTH_DXA = 9070
                    const colWidthDXA = Math.floor(PAGE_WIDTH_DXA / maxCols)

                    const cellBorders = {
                        top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                        left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                        right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                    }

                    for (const tr of trs) {
                        const cells: TableCell[] = []
                        const tds = Array.from(tr.querySelectorAll(':scope > td, :scope > th'))
                        for (const td of tds) {
                            const colspan = Number.parseInt(td.getAttribute('colspan') || '1', 10)
                            const rowspan = Number.parseInt(td.getAttribute('rowspan') || '1', 10)
                            const cellChildren = await htmlToParagraphs(DOMPurify.sanitize(td.innerHTML))
                            cells.push(
                                new TableCell({
                                    children:
                                        cellChildren.length > 0
                                            ? (cellChildren as Paragraph[])
                                            : [
                                                  new Paragraph({
                                                      children: [
                                                          new TextRun({
                                                              text: '',
                                                              size: SIZE_BODY,
                                                          }),
                                                      ],
                                                  }),
                                              ],
                                    width: {
                                        size: colWidthDXA * colspan,
                                        type: WidthType.DXA,
                                    },
                                    columnSpan: colspan > 1 ? colspan : undefined,
                                    rowSpan: rowspan > 1 ? rowspan : undefined,
                                    verticalAlign: VerticalAlign.CENTER,
                                    borders: cellBorders,
                                })
                            )
                        }
                        rows.push(new TableRow({ children: cells }))
                    }
                    paragraphs.push(
                        new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } })
                    )
                }

                if (el.tagName === 'P') {
                    const runs: TextRun[] = []
                    el.childNodes.forEach((child) => {
                        if (child.nodeType === Node.TEXT_NODE) {
                            runs.push(
                                new TextRun({ text: child.textContent || '', size: SIZE_BODY })
                            )
                        } else if (child.nodeType === Node.ELEMENT_NODE) {
                            const c = child as HTMLElement
                            runs.push(
                                new TextRun({
                                    text: c.textContent || '',
                                    bold: c.tagName === 'B' || c.tagName === 'STRONG',
                                    italics: c.tagName === 'I' || c.tagName === 'EM',
                                    color: normalizeColor(c.style.color),
                                    size: SIZE_BODY,
                                })
                            )
                        }
                    })
                    paragraphs.push(
                        new Paragraph({
                            indent: { firstLine: 720 },
                            alignment: AlignmentType.JUSTIFIED,
                            children:
                                runs.length > 0
                                    ? runs
                                    : [new TextRun({ text: '', size: SIZE_BODY })],
                        })
                    )
                }

                if (el.tagName === 'SPAN') {
                    paragraphs.push(
                        new Paragraph({
                            indent: { firstLine: 720 },
                            alignment: AlignmentType.JUSTIFIED,
                            children: [
                                new TextRun({
                                    text: el.textContent || '',
                                    color: normalizeColor(el.style.color) || undefined,
                                    bold: el.style.fontWeight === 'bold',
                                    italics: el.style.fontStyle === 'italic',
                                    size: SIZE_BODY,
                                }),
                            ],
                        })
                    )
                }
            }
        }

        return paragraphs
    }

    const exportDanhSachMinhchung = (dataTable: any[]) => {
        const title = new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({ text: 'MỤC LỤC DANH MỤC MINH CHỨNG', bold: true, size: SIZE_BODY }),
            ],
        })

        const headerRow = new TableRow({
            children: [
                new TableCell({
                    width: { size: 5, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: 'STT', bold: true, size: SIZE_BODY })],
                        }),
                    ],
                }),
                new TableCell({
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({ text: 'Mã minh chứng', bold: true, size: SIZE_BODY }),
                            ],
                        }),
                    ],
                }),
                new TableCell({
                    width: { size: 35, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: 'Tên minh chứng',
                                    bold: true,
                                    size: SIZE_BODY,
                                }),
                            ],
                        }),
                    ],
                }),
                new TableCell({
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({
                                    text: 'Số, ngày ban hành',
                                    bold: true,
                                    size: SIZE_BODY,
                                }),
                            ],
                        }),
                    ],
                }),
                new TableCell({
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({ text: 'Nơi ban hành', bold: true, size: SIZE_BODY }),
                            ],
                        }),
                    ],
                }),
                new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({ text: 'Ghi chú', bold: true, size: SIZE_BODY }),
                            ],
                        }),
                    ],
                }),
            ],
        })

        const dataRows = dataTable.map(
            (item: any, index: number) =>
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun({ text: `${index + 1}`, size: SIZE_BODY }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun({
                                            text: `PM.${item?.tag || ''}`,
                                            size: SIZE_BODY,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: item?.evidence?.name || '',
                                            size: SIZE_BODY,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: item?.evidence?.information || '',
                                            size: SIZE_BODY,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: item?.evidence?.issuer || '',
                                            size: SIZE_BODY,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: '', size: SIZE_BODY })],
                                }),
                            ],
                        }),
                    ],
                })
        )

        const table = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            },
            rows: [headerRow, ...dataRows],
        })

        return [title, new Paragraph(''), table]
    }

    const CalcevidenceTags = (criteria: any[]) => {
        const map = new Map<string, string>()
        const result: any[] = []

        if (!Array.isArray(criteria)) {
            console.warn('❌ criteria không phải array:', criteria)
            return { evidenceTags: map, result }
        }

        const standardOrder = data.order || 1

        for (const [criterionIdx, criterion] of criteria.entries()) {
            const analysis = criterion?.analysisCriterions
            if (!analysis || typeof analysis !== 'object') continue

            const reqList = analysis.requirementCriterions
            if (!Array.isArray(reqList)) continue

            for (const req of reqList) {
                let evidenceCount = 0
                const evidencesList = req?.evidences
                if (!Array.isArray(evidencesList)) continue

                for (const evidence of evidencesList) {
                    if (map.has(evidence.evidenceId)) continue
                    evidenceCount++
                    const tag = [standardOrder, criterionIdx + 1, evidenceCount]
                        .map((t) => t.toString().padStart(2, '0'))
                        .join('.')
                    result.push({ ...evidence, tag })
                    map.set(evidence.evidenceId, `[PM.${tag}]`)
                }
            }
        }

        return { evidenceTags: map, result }
    }

    const processHtmlContent = (html: string, evidenceTags: Map<string, string>): string => {
        if (!html) return ''

        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')

        doc.querySelectorAll('span[id]').forEach((span) => {
            const id = span.getAttribute('id')
            if (id && evidenceTags.has(id)) {
                span.textContent = evidenceTags.get(id) || ''
                span.removeAttribute('style')
                span.setAttribute('style', 'color: red;')
            }
        })

        return DOMPurify.sanitize(doc.body.innerHTML)
    }

    const noBorders = {
        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    }

    const cellP = (
        text: string,
        opts: { bold?: boolean; italics?: boolean; center?: boolean; size?: number } = {}
    ) =>
        new Paragraph({
            alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
            children: [
                new TextRun({
                    text,
                    bold: opts.bold,
                    italics: opts.italics,
                    size: opts.size ?? SIZE_BODY,
                }),
            ],
        })

    const createSignatureTable = () =>
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            borders: noBorders,
                            children: [
                                cellP('Xác nhận', { bold: true, center: true }),
                                cellP('của trưởng nhóm công tác', { bold: true, center: true }),
                            ],
                        }),
                        new TableCell({
                            width: { size: 50, type: WidthType.PERCENTAGE },
                            borders: noBorders,
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun({
                                            text: '......., ngày ... tháng ... năm 20...',
                                            size: SIZE_BODY,
                                        }),
                                    ],
                                }),
                                cellP('Người viết', { bold: true, center: true }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun({
                                            text: '(Ký, ghi rõ họ tên)',
                                            italics: true,
                                            size: SIZE_DESC,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        })

    const exportToWord = async () => {
        try {
            if (!data || !data.criteria || data.criteria.length === 0) {
                console.error('Không có dữ liệu để xuất')
                return
            }

            const criteriaWithEvidence = await Promise.all(
                data.criteria.map(async (criterion) => {
                    const res = await sqlTransaction([
                        {
                            model: 'CriterionPeriod',
                            operation: 'findUnique',
                            data: {
                                where: { id: criterion.id },
                                include: {
                                    analysisCriterions: {
                                        include: {
                                            requirementCriterions: {
                                                include: {
                                                    evidences: {
                                                        include: { evidence: true },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    evaluationCriterion: {
                                        include: {
                                            lecturer: {
                                                include: { userProfile: true },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    ])
                    return (res?.status === 200 ? res.data[0] : criterion) as any
                })
            )

            const { evidenceTags, result: evidenceList } = CalcevidenceTags(criteriaWithEvidence)

            const allChildren: any[] = []

            for (const [idx, criterion] of data.criteria.entries()) {
                const criterionData = criteriaWithEvidence[idx]
                const isFirst = idx === 0

                const lecturerName =
                    criterionData?.evaluationCriterion?.lecturer?.userProfile?.fullname ||
                    criterion?.evaluationCriterion?.lecturer?.userProfile?.fullname ||
                    '.............................................'

                // === TIÊU ĐỀ PHIẾU ===
                allChildren.push(
                    new Paragraph({
                        pageBreakBefore: !isFirst,
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: 'PHIẾU TỰ ĐÁNH GIÁ TIÊU CHÍ',
                                bold: true,
                                size: SIZE_BODY,
                            }),
                        ],
                    })
                )
                allChildren.push(new Paragraph({ children: [new TextRun({ text: '' })] }))

                // === THÔNG TIN HEADER ===
                allChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: 'Nhóm công tác hoặc cá nhân: ',
                                size: SIZE_BODY,
                                bold: true,
                            }),
                            new TextRun({ text: lecturerName, size: SIZE_BODY }),
                        ],
                    })
                )
                allChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Tiêu chuẩn: ', size: SIZE_BODY, bold: true }),
                            new TextRun({
                                text: `${data.order}: ${data.name || ''}`,
                                size: SIZE_BODY,
                            }),
                        ],
                    })
                )
                allChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: 'Tiêu chí: ', size: SIZE_BODY, italics: true }),
                            new TextRun({
                                text: `${data.order}.${criterion.order || idx + 1}: ${criterion.name || ''}`,
                                italics: true,
                                size: SIZE_BODY,
                            }),
                        ],
                    })
                )
                allChildren.push(new Paragraph({ children: [new TextRun({ text: '' })] }))

                // === 1. MÔ TẢ HIỆN TRẠNG ===
                allChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: '1. Mô tả hiện trạng ',
                                bold: true,
                                size: SIZE_BODY,
                            }),
                        ],
                    })
                )
                const currentSituation =
                    criterionData?.evaluationCriterion?.currentSituation ||
                    criterion?.evaluationCriterion?.currentSituation ||
                    ''
                allChildren.push(
                    ...(await htmlToParagraphs(processHtmlContent(currentSituation, evidenceTags)))
                )
                allChildren.push(new Paragraph({ children: [new TextRun({ text: '' })] }))

                // === 2. ĐIỂM MẠNH ===
                allChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: '2. Điểm mạnh ', bold: true, size: SIZE_BODY }),
                        ],
                    })
                )
                const strengths =
                    criterionData?.evaluationCriterion?.strengths ||
                    criterion?.evaluationCriterion?.strengths ||
                    ''
                allChildren.push(
                    ...(await htmlToParagraphs(processHtmlContent(strengths, evidenceTags)))
                )
                allChildren.push(new Paragraph({ children: [new TextRun({ text: '' })] }))

                // === 3. ĐIỂM TỒN TẠI ===
                allChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: '3. Điểm tồn tại ', bold: true, size: SIZE_BODY }),
                        ],
                    })
                )
                const weakness =
                    criterionData?.evaluationCriterion?.weakness ||
                    criterion?.evaluationCriterion?.weakness ||
                    ''
                allChildren.push(
                    ...(await htmlToParagraphs(processHtmlContent(weakness, evidenceTags)))
                )
                allChildren.push(new Paragraph({ children: [new TextRun({ text: '' })] }))

                // === 4. KẾ HOẠCH HÀNH ĐỘNG ===
                allChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: '4. Kế hoạch hành động ',
                                bold: true,
                                size: SIZE_BODY,
                            }),
                        ],
                    })
                )
                const actionPlan =
                    criterionData?.evaluationCriterion?.actionPlan ||
                    criterion?.evaluationCriterion?.actionPlan ||
                    ''
                allChildren.push(
                    ...(await htmlToParagraphs(processHtmlContent(actionPlan, evidenceTags)))
                )
                allChildren.push(new Paragraph({ children: [new TextRun({ text: '' })] }))

                // === 5. TỰ ĐÁNH GIÁ ===
                const scoreRaw =
                    criterionData?.evaluationCriterion?.score ||
                    criterion?.evaluationCriterion?.score ||
                    ''

                allChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: '5. Tự đánh giá: ', bold: true, size: SIZE_BODY }),
                        ],
                    })
                )
                allChildren.push(
                    ...(await htmlToParagraphs(processHtmlContent(scoreRaw, evidenceTags)))
                )
                allChildren.push(new Paragraph({ children: [new TextRun({ text: '' })] }))
                allChildren.push(new Paragraph({ children: [new TextRun({ text: '' })] }))

                // === KÝ TÊN ===
                allChildren.push(createSignatureTable())
            }

            const doc = new Document({
                sections: [
                    { children: allChildren },
                    {
                        children:
                            evidenceList.length > 0 ? exportDanhSachMinhchung(evidenceList) : [],
                    },
                ],
            })

            const blob = await Packer.toBlob(doc)
            saveAs(blob, `Phieu_tu_danh_gia_tieu_chi_TC${data.order || ''}.docx`)
        } catch (error) {
            console.error('Lỗi khi xuất file Word:', error)
        }
    }

    return (
        <Button
            type="primary"
            className="bg-yellow-800"
            size="small"
            onClick={exportToWord}
            icon={<DownloadOutlined />}
        >
            Xuất phiếu đánh giá
        </Button>
    )
}

export default ExportCriteriaEvaluation
