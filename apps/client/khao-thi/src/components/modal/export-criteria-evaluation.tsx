import { DownloadOutlined } from '@ant-design/icons'
import type { DataTabEvaluationCriterionType } from '@pages/ql-tu-danh-gia-ctdt/phieu-phan-tich-va-danh-gia/_components/standar-reports'
import { sqlTransaction } from '@workspace/libs/api/model'
import { Button } from 'antd'
import {
    AlignmentType,
    BorderStyle,
    Document,
    HeadingLevel,
    type IImageOptions,
    ImageRun,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableOfContents,
    TableRow,
    TextRun,
    VerticalAlign,
    WidthType,
} from 'docx'
import { saveAs } from 'file-saver'

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
                    const trs = Array.from(el.querySelectorAll('tr'))
                    for (const tr of trs) {
                        const cells: TableCell[] = []
                        const tds = Array.from(tr.querySelectorAll('td, th'))
                        for (const td of tds) {
                            const cellChildren = await htmlToParagraphs(td.innerHTML)
                            cells.push(
                                new TableCell({
                                    children: cellChildren as Paragraph[],
                                    width: { size: 100 / tds.length, type: WidthType.PERCENTAGE },
                                    verticalAlign: VerticalAlign.CENTER,
                                })
                            )
                        }
                        rows.push(new TableRow({ children: cells }))
                    }

                    paragraphs.push(
                        new Table({
                            rows,
                            width: { size: 100, type: WidthType.PERCENTAGE },
                        })
                    )
                }

                if (el.tagName === 'P') {
                    const runs: TextRun[] = []
                    el.childNodes.forEach((child) => {
                        if (child.nodeType === Node.TEXT_NODE) {
                            runs.push(new TextRun({ text: child.textContent || '', size: 28 }))
                        } else if (child.nodeType === Node.ELEMENT_NODE) {
                            const c = child as HTMLElement
                            runs.push(
                                new TextRun({
                                    text: c.textContent || '',
                                    bold: c.tagName === 'B' || c.tagName === 'STRONG',
                                    italics: c.tagName === 'I' || c.tagName === 'EM',
                                    color: normalizeColor(c.style.color),
                                    size: 28,
                                })
                            )
                        }
                    })
                    paragraphs.push(
                        new Paragraph({
                            indent: { firstLine: 720 },
                            alignment: AlignmentType.JUSTIFIED,
                            children:
                                runs.length > 0 ? runs : [new TextRun({ text: '', size: 28 })],
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
                                    size: 28,
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
                new TextRun({
                    text: 'MỤC LỤC DANH MỤC MINH CHỨNG',
                    bold: true,
                    size: 28,
                }),
            ],
        })

        // Header bảng
        const headerRow = new TableRow({
            children: [
                new TableCell({
                    width: { size: 5, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: 'STT', bold: true, size: 26 })],
                        }),
                    ],
                }),
                new TableCell({
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({ text: 'Mã minh chứng', bold: true, size: 26 }),
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
                                new TextRun({ text: 'Tên minh chứng', bold: true, size: 26 }),
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
                                new TextRun({ text: 'Số, ngày ban hành', bold: true, size: 26 }),
                            ],
                        }),
                    ],
                }),
                new TableCell({
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: 'Nơi ban hành', bold: true, size: 26 })],
                        }),
                    ],
                }),
                new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: 'Ghi chú', bold: true, size: 26 })],
                        }),
                    ],
                }),
            ],
        })

        // Data rows
        const dataRows = dataTable.map(
            (item: any, index: number) =>
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: `${index + 1}`, size: 26 })],
                                }),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun({ text: `PM.${item?.tag || ''}`, size: 26 }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: item?.evidence?.name || '', size: 26 }),
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
                                            size: 26,
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
                                            size: 26,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({ children: [new TextRun({ text: '', size: 26 })] }),
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

            if (!analysis || typeof analysis !== 'object') {
                continue
            }

            const reqList = analysis.requirementCriterions

            if (!Array.isArray(reqList)) {
                continue
            }

            let evidenceCount = 0

            for (const req of reqList) {
                const evidencesList = req?.evidences

                if (!Array.isArray(evidencesList)) {
                    continue
                }

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

        const spans = doc.querySelectorAll('span[id]')

        spans.forEach((span) => {
            const id = span.getAttribute('id')
            if (id && evidenceTags.has(id)) {
                span.textContent = evidenceTags.get(id) || ''
                ;(span as HTMLElement).style.color = 'red'
                span.removeAttribute('style')
                span.setAttribute('style', 'color: red;')
            }
        })

        return doc.body.innerHTML
    }

    const exportToWord = async () => {
        try {
            if (!data || !data.criteria || data.criteria.length === 0) {
                console.error('Không có dữ liệu để xuất')
                return
            }

            // Fetch evidence data with complete relationships
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
                                                        include: {
                                                            evidence: true,
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    evaluationCriterion: true,
                                },
                            },
                        },
                    ])
                    return (res?.status === 200 ? res.data[0] : criterion) as any
                })
            )

            const { evidenceTags, result: evidenceList } = CalcevidenceTags(criteriaWithEvidence)

            const children: any[] = []

            // Header
            children.push(
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: 'BỘ QUỐC PHÒNG',
                            bold: true,
                            size: 28,
                        }),
                    ],
                })
            )
            children.push(
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: 'HỌC VIỆN KỸ THUẬT QUÂN SỰ',
                            bold: true,
                            size: 28,
                        }),
                    ],
                })
            )
            children.push(new Paragraph(''))

            // Tiêu đề tiêu chuẩn
            children.push(
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    heading: HeadingLevel.HEADING_1,
                    children: [
                        new TextRun({
                            text: `Tiêu chuẩn ${data.order}: ${data.name || ''}`,
                            bold: true,
                            size: 32,
                            color: '000000',
                        }),
                    ],
                })
            )
            children.push(new Paragraph(''))

            // Tiêu chí
            for (const [idx, criterion] of data.criteria.entries()) {
                const criterionData = criteriaWithEvidence[idx]

                children.push(
                    new Paragraph({
                        indent: { firstLine: 720 },
                        alignment: AlignmentType.JUSTIFIED,
                        heading: HeadingLevel.HEADING_2,
                        children: [
                            new TextRun({
                                text: `Tiêu chí ${data.order}.${criterion.order || idx + 1}: ${criterion.name || ''}`,
                                bold: true,
                                size: 28,
                                color: '000000',
                            }),
                        ],
                    })
                )
                children.push(new Paragraph(''))

                // 1. Mô tả hiện trạng
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: '1. Mô tả hiện trạng',
                                italics: true,
                                size: 28,
                            }),
                        ],
                    })
                )
                const currentSituation =
                    criterionData?.evaluationCriterion?.currentSituation ||
                    criterion?.evaluationCriterion?.currentSituation ||
                    ''
                children.push(
                    ...(await htmlToParagraphs(processHtmlContent(currentSituation, evidenceTags)))
                )

                // 2. Điểm mạnh
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: '2. Điểm mạnh',
                                italics: true,
                                size: 28,
                            }),
                        ],
                    })
                )
                const strengths =
                    criterionData?.evaluationCriterion?.strengths ||
                    criterion?.evaluationCriterion?.strengths ||
                    ''
                children.push(
                    ...(await htmlToParagraphs(processHtmlContent(strengths, evidenceTags)))
                )

                // 3. Điểm tồn tại
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: '3. Điểm tồn tại',
                                italics: true,
                                size: 28,
                            }),
                        ],
                    })
                )
                const weakness =
                    criterionData?.evaluationCriterion?.weakness ||
                    criterion?.evaluationCriterion?.weakness ||
                    ''
                children.push(
                    ...(await htmlToParagraphs(processHtmlContent(weakness, evidenceTags)))
                )

                // 4. Kế hoạch hành động
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: '4. Kế hoạch hành động',
                                italics: true,
                                size: 28,
                            }),
                        ],
                    })
                )
                const actionPlan =
                    criterionData?.evaluationCriterion?.actionPlan ||
                    criterion?.evaluationCriterion?.actionPlan ||
                    ''
                children.push(
                    ...(await htmlToParagraphs(processHtmlContent(actionPlan, evidenceTags)))
                )

                // 5. Tự đánh giá
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: '5. Tự đánh giá',
                                italics: true,
                                size: 28,
                            }),
                        ],
                    })
                )
                const score =
                    criterionData?.evaluationCriterion?.score ||
                    criterion?.evaluationCriterion?.score ||
                    ''
                children.push(...(await htmlToParagraphs(processHtmlContent(score, evidenceTags))))

                children.push(new Paragraph(''))
            }

            const doc = new Document({
                features: {
                    updateFields: true,
                },
                sections: [
                    {
                        children: [
                            new Paragraph({
                                heading: HeadingLevel.HEADING_1,
                                children: [
                                    new TextRun({
                                        text: 'Mục lục',
                                        size: 28,
                                    }),
                                ],
                            }),
                            new TableOfContents('Mục lục', {
                                hyperlink: true,
                                headingStyleRange: '1-2',
                            }),
                        ],
                    },
                    {
                        children,
                    },
                    {
                        children:
                            evidenceList.length > 0 ? exportDanhSachMinhchung(evidenceList) : [],
                    },
                ],
            })

            const blob = await Packer.toBlob(doc)
            saveAs(blob, `Phieu_danh_gia_tieu_chuan_${data.order || ''}.docx`)
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
