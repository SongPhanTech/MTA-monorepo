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
    TableLayoutType,
    TableOfContents,
    TableRow,
    TextRun,
    VerticalAlign,
    WidthType,
} from 'docx'
import { saveAs } from 'file-saver'

interface ExportAllCriteriaEvaluationProps {
    standards: DataTabEvaluationCriterionType[]
}

const ExportAllCriteriaEvaluation = ({ standards }: ExportAllCriteriaEvaluationProps) => {
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

    const htmlToParagraphs = async (container: HTMLElement): Promise<(Paragraph | Table)[]> => {
        const nodes = Array.from(container.childNodes)

        const paragraphs: (Paragraph | Table)[] = []

        for (const node of nodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement

                if (el.tagName === 'IMG') {
                    const src = el.getAttribute('src')
                    if (src && /^https?:\/\//i.test(src)) {
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
                            const cellChildren = await htmlToParagraphs(td as HTMLElement)
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
            heading: HeadingLevel.HEADING_1,
            children: [
                new TextRun({
                    text: 'MỤC LỤC DANH MỤC MINH CHỨNG',
                    bold: true,
                    size: 32,
                    color: '000000',
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
                            children: [new TextRun({ text: 'STT', bold: true, size: 22 })],
                        }),
                    ],
                }),
                new TableCell({
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({ text: 'Mã minh chứng', bold: true, size: 22 }),
                            ],
                        }),
                    ],
                }),
                new TableCell({
                    width: { size: 32, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({ text: 'Tên minh chứng', bold: true, size: 22 }),
                            ],
                        }),
                    ],
                }),
                new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({ text: 'Số, ngày ban hành', bold: true, size: 22 }),
                            ],
                        }),
                    ],
                }),
                new TableCell({
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: 'Nơi ban hành', bold: true, size: 22 })],
                        }),
                    ],
                }),
                new TableCell({
                    width: { size: 8, type: WidthType.PERCENTAGE },
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: 'Ghi chú', bold: true, size: 22 })],
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
                            width: { size: 5, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: `${index + 1}`, size: 22 })],
                                }),
                            ],
                        }),
                        new TableCell({
                            width: { size: 15, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [
                                        new TextRun({ text: `PM.${item?.tag || ''}`, size: 22 }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            width: { size: 32, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: item?.evidence?.name || '', size: 22 }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            width: { size: 25, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: item?.evidence?.information || '',
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            width: { size: 15, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: item?.evidence?.issuer || '',
                                            size: 22,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            width: { size: 8, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({ children: [new TextRun({ text: '', size: 22 })] }),
                            ],
                        }),
                    ],
                })
        )

        const table = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
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

    const CalcevidenceTags = (criteria: any[], standardOrder: number) => {
        const map = new Map<string, string>()
        const result: any[] = []

        if (!Array.isArray(criteria)) {
            console.warn('❌ criteria không phải array:', criteria)
            return { evidenceTags: map, result }
        }

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
                    // Kiểm tra evidenceId hợp lệ
                    if (!evidence?.evidenceId) {
                        console.warn('⚠️ Evidence không có evidenceId:', evidence)
                        continue
                    }

                    // Nếu đã có trong map, skip để tránh trùng lặp
                    if (map.has(evidence.evidenceId)) continue

                    evidenceCount++

                    const tag = [standardOrder, criterionIdx + 1, evidenceCount]
                        .map((t) => t.toString().padStart(2, '0'))
                        .join('.')

                    // Đảm bảo có đầy đủ thông tin evidence
                    result.push({
                        ...evidence,
                        tag,
                        // Đảm bảo có evidence object
                        evidence: evidence.evidence || {},
                    })
                    map.set(evidence.evidenceId, `[PM.${tag}]`)
                }
            }
        }

        return { evidenceTags: map, result }
    }

    const processHtmlContent = (html: string, evidenceTags: Map<string, string>): HTMLElement => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(html || '', 'text/html')

        const spans = doc.querySelectorAll('span[id]')

        spans.forEach((span) => {
            const id = span.getAttribute('id')
            if (id && evidenceTags.has(id)) {
                span.textContent = evidenceTags.get(id) || ''
                span.removeAttribute('style')
                span.setAttribute('style', 'color: red;')
            }
        })

        return doc.body
    }

    const exportToWord = async () => {
        try {
            if (!standards || standards.length === 0) {
                console.error('Không có dữ liệu để xuất')
                return
            }

            const children: any[] = []
            const allEvidenceList: any[] = []

            // Tính toán evidenceTags cho TẤT CẢ các tiêu chuẩn trước
            const globalEvidenceTags = new Map<string, string>()
            const allStandardsWithEvidence: any[] = []

            // Fetch evidence data cho tất cả các standards
            for (const standard of standards) {
                if (!standard.criteria || standard.criteria.length === 0) {
                    allStandardsWithEvidence.push({ standard, criteriaWithEvidence: [] })
                    continue
                }

                const criteriaWithEvidence = await Promise.all(
                    standard.criteria.map(async (criterion) => {
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

                allStandardsWithEvidence.push({ standard, criteriaWithEvidence })

                const { evidenceTags, result: evidenceList } = CalcevidenceTags(
                    criteriaWithEvidence,
                    standard.order || 1
                )

                // Merge vào globalEvidenceTags
                evidenceTags.forEach((value, key) => {
                    globalEvidenceTags.set(key, value)
                })
                allEvidenceList.push(...evidenceList)
            }

            // Lặp qua tất cả các tiêu chuẩn để tạo nội dung
            for (const { standard, criteriaWithEvidence } of allStandardsWithEvidence) {
                if (!standard.criteria || standard.criteria.length === 0) {
                    continue
                }

                // Tiêu đề tiêu chuẩn
                children.push(
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        heading: HeadingLevel.HEADING_1,
                        children: [
                            new TextRun({
                                text: `Tiêu chuẩn ${standard.order}: ${standard.name || ''}`,
                                bold: true,
                                size: 32,
                                color: '000000',
                            }),
                        ],
                    })
                )
                children.push(new Paragraph(''))

                // Tiêu chí
                for (const [idx, criterion] of standard.criteria.entries()) {
                    const criterionData = criteriaWithEvidence[idx]

                    children.push(
                        new Paragraph({
                            indent: { firstLine: 720 },
                            alignment: AlignmentType.JUSTIFIED,
                            heading: HeadingLevel.HEADING_2,
                            children: [
                                new TextRun({
                                    text: `Tiêu chí ${standard.order}.${criterion.order || idx + 1}: ${criterion.name || ''}`,
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
                        ...(await htmlToParagraphs(
                            processHtmlContent(currentSituation, globalEvidenceTags)
                        ))
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
                        ...(await htmlToParagraphs(
                            processHtmlContent(strengths, globalEvidenceTags)
                        ))
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
                        ...(await htmlToParagraphs(
                            processHtmlContent(weakness, globalEvidenceTags)
                        ))
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
                        ...(await htmlToParagraphs(
                            processHtmlContent(actionPlan, globalEvidenceTags)
                        ))
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
                    children.push(
                        ...(await htmlToParagraphs(processHtmlContent(score, globalEvidenceTags)))
                    )

                    children.push(new Paragraph(''))
                }
            }

            const doc = new Document({
                features: {
                    updateFields: true,
                },
                sections: [
                    {
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                heading: HeadingLevel.HEADING_1,
                                children: [
                                    new TextRun({
                                        text: 'Mục lục',
                                        size: 28,
                                        color: '000000',
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
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                heading: HeadingLevel.HEADING_1,
                                children: [
                                    new TextRun({
                                        text: 'TỰ ĐÁNH GIÁ THEO CÁC TIÊU CHUẨN TIÊU CHÍ',
                                        bold: true,
                                        size: 32,
                                        color: '000000',
                                    }),
                                ],
                            }),
                            new Paragraph(''),
                            ...children,
                        ],
                    },
                    {
                        children:
                            allEvidenceList.length > 0
                                ? exportDanhSachMinhchung(allEvidenceList)
                                : [],
                    },
                ],
            })

            const blob = await Packer.toBlob(doc)
            saveAs(blob, 'Phieu_danh_gia_tat_ca_tieu_chuan.docx')
        } catch (error) {
            console.error('Lỗi khi xuất file Word:', error)
        }
    }

    return (
        <Button
            type="primary"
            className="bg-green-600"
            size="small"
            onClick={exportToWord}
            icon={<DownloadOutlined />}
        >
            Xuất file
        </Button>
    )
}

export default ExportAllCriteriaEvaluation
