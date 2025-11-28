import { sqlTransaction } from '@workspace/libs/api/model'
import { message, Tooltip } from 'antd'
import { FileDown } from 'lucide-react'
import {
    AlignmentType,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableOfContents,
    TableRow,
    TextRun,
    WidthType,
    BorderStyle,
    VerticalAlign,
    IImageOptions,
    ImageRun,
} from 'docx'
import { saveAs } from 'file-saver'
import { $Enums } from '@workspace/db'
export default function ExportReport({ id }: { id: string }) {
    const role = {
        CHAIRMAN: 'Chủ tịch hội đồng',
        VICE_PRESIDENT: 'Phó chủ tịch hội đồng',
        HEAD_SECRETARY: 'Trưởng ban thư ký',
        SECRETARY: 'Thư ký',
        MEMBER: 'Thành viên',
        ADVISORY_BOARD: 'Ban tư vấn',
    }
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

    const exportDanhSachHoiDong = (dataTable: any) => {
        console.log('dataTable', dataTable)

        const title = new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({
                    text: 'DANH SÁCH CÁC ĐỒNG CHÍ THAM GIA HỘI ĐỒNG',
                    bold: true,
                }),
            ],
        })

        // ==== Tạo header bảng ====
        const headerRow = new TableRow({
            children: [
                new TableCell({
                    width: { size: 5, type: WidthType.PERCENTAGE },
                    children: [new Paragraph('TT')],
                }),
                new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    children: [new Paragraph('Quân hàm, học hàm, học vị, họ và tên')],
                }),
                new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [new Paragraph('Chức vụ, đơn vị')],
                }),
                new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [new Paragraph('Chức vụ trong HĐ')],
                }),
                new TableCell({
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    children: [new Paragraph('Chữ ký')],
                }),
            ],
        })

        // ==== Tạo các dòng dữ liệu ====
        const dataRows = dataTable.map(
            (item: any, index: number) =>
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph(`${index + 1}`)] }),
                        new TableCell({
                            children: [
                                new Paragraph(
                                    `${item?.lecturer?.userProfile?.rank?.sTen || ''} ${item?.lecturer?.userProfile?.academicDegreeType?.sTen ? `, ${item?.lecturer?.userProfile?.academicDegreeType?.sTen}` : ''} ${item?.lecturer?.userProfile?.academicRankType?.sTen ? `, ${item?.lecturer?.userProfile?.academicRankType?.sTen}` : ''} ${item?.lecturer?.userProfile?.lastName || ''} ${item?.lecturer?.userProfile?.firstName || ''}`
                                ),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph(
                                    `${item?.lecturer?.userProfile?.positionCPV?.sTen || ''}, ${item?.lecturer?.organization?.sMa || ''}`
                                ),
                            ],
                        }),
                        new TableCell({
                            children: item.role.map(
                                (t: $Enums.EvaluationMemberRole) =>
                                    new Paragraph(`${role[t as $Enums.EvaluationMemberRole]}`)
                            ),
                        }),
                        new TableCell({ children: [new Paragraph('')] }),
                    ],
                })
        )

        // ==== Tạo bảng ====
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

    const htmlToParagraphs = async (html: string): Promise<(Paragraph | Table | Paragraph)[]> => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const nodes = Array.from(doc.body.childNodes)

        const paragraphs: (Paragraph | Table | Paragraph)[] = []

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
                    el.childNodes.forEach(async (child) => {
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
                            children: runs,
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
                                    color: el.style.color || undefined,
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

    const CalcevidenceTags = (dataMap: any) => {
        const map = new Map<string, string>()
        for (const [o1, standard] of (dataMap || []).entries()) {
            for (const [o2, criteria] of (standard?.criteria || []).entries()) {
                let evidenceCount = 0
                for (const requirementCriterions of criteria?.requirementCriterions || []) {
                    for (const evidences of requirementCriterions?.evidences || []) {
                        if (map.has(evidences.evidenceId)) continue
                        evidenceCount++
                        const tag = [o1 + 1, o2 + 1, evidenceCount]
                            .map((t) => t.toString().padStart(2, '0'))
                            .join('.')
                        map.set(evidences.evidenceId, `[KM.${tag}]`)
                    }
                }
            }
        }

        console.log(map, 'map')
        return map
    }
    const exportToWord = async () => {
        try {
            const res = await sqlTransaction([
                {
                    model: 'EvaluationPeriod',
                    operation: 'findUnique',
                    data: {
                        where: { id },
                        include: {
                            standards: {
                                include: {
                                    criteria: {
                                        include: {
                                            analysisCriterions: {
                                                include: {
                                                    requirementCriterions: {
                                                        include: {
                                                            evidences: true,
                                                        },
                                                    },
                                                },
                                            },
                                            evaluationCriterion: true,
                                        },
                                    },
                                },
                            },
                            council: {
                                include: {
                                    members: {
                                        include: {
                                            lecturer: {
                                                include: {
                                                    organization: true,
                                                    userProfile: {
                                                        include: {
                                                            rank: true,
                                                            academicDegreeType: true,
                                                            academicRankType: true,
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            ])
            if (res?.status === 200) {
                const data: any = res?.data[0]
                if (!data) return

                const listMembers = await Promise.all([
                    {
                        children: exportDanhSachHoiDong(data?.council?.members),
                    },
                ])

                const evidenceTags = CalcevidenceTags(data?.standards)

                const sections = await Promise.all(
                    data.standards.map(async (standard: any, idx: number) => {
                        const children: Array<Paragraph | Table> = []

                        // Tiêu chuẩn
                        children.push(
                            new Paragraph({
                                indent: { firstLine: 720 },
                                alignment: AlignmentType.JUSTIFIED,
                                heading: HeadingLevel.HEADING_1,
                                children: [
                                    new TextRun({
                                        text: `Tiêu chuẩn ${idx + 1}: ${standard.name}`,
                                        bold: true,
                                        size: 28,
                                        color: '000000',
                                    }),
                                ],
                            })
                        )

                        // Mở đầu
                        children.push(
                            new Paragraph({
                                indent: { firstLine: 720 },
                                alignment: AlignmentType.JUSTIFIED,
                                heading: HeadingLevel.HEADING_2,
                                children: [
                                    new TextRun({
                                        text: 'Mở đầu:',
                                        bold: true,
                                        italics: true,
                                        size: 28,
                                        color: '000000',
                                    }),
                                ],
                            })
                        )
                        children.push(
                            ...(await htmlToParagraphs(
                                processHtmlContent(standard.opening || '', evidenceTags)
                            ))
                        )

                        // Tiêu chí
                        for (const [cIdx, criterion] of standard.criteria.entries()) {
                            children.push(
                                new Paragraph({
                                    indent: { firstLine: 720 },
                                    alignment: AlignmentType.JUSTIFIED,
                                    heading: HeadingLevel.HEADING_2,
                                    children: [
                                        new TextRun({
                                            text: `Tiêu chí ${idx + 1}.${cIdx + 1}: ${criterion.name}`,
                                            size: 28,
                                            italics: true,
                                            color: '000000',
                                        }),
                                    ],
                                })
                            )

                            children.push(
                                new Paragraph({
                                    indent: { firstLine: 720 },
                                    alignment: AlignmentType.JUSTIFIED,
                                    children: [
                                        new TextRun({
                                            text: '1. Mô tả hiện trạng',
                                            italics: true,
                                            size: 28,
                                        }),
                                    ],
                                })
                            )
                            children.push(
                                ...(await htmlToParagraphs(
                                    processHtmlContent(
                                        criterion?.evaluationCriterion?.currentSituation || '',
                                        evidenceTags
                                    )
                                ))
                            )

                            children.push(
                                new Paragraph({
                                    indent: { firstLine: 720 },
                                    alignment: AlignmentType.JUSTIFIED,
                                    children: [
                                        new TextRun({
                                            text: '2. Điểm mạnh',
                                            italics: true,
                                            size: 28,
                                        }),
                                    ],
                                })
                            )
                            children.push(
                                ...(await htmlToParagraphs(
                                    processHtmlContent(
                                        criterion?.evaluationCriterion?.strengths || '',
                                        evidenceTags
                                    )
                                ))
                            )

                            children.push(
                                new Paragraph({
                                    indent: { firstLine: 720 },
                                    alignment: AlignmentType.JUSTIFIED,
                                    children: [
                                        new TextRun({
                                            text: '3. Điểm tồn tại',
                                            italics: true,
                                            size: 28,
                                        }),
                                    ],
                                })
                            )
                            children.push(
                                ...(await htmlToParagraphs(
                                    processHtmlContent(
                                        criterion?.evaluationCriterion?.weakness || '',
                                        evidenceTags
                                    )
                                ))
                            )

                            children.push(
                                new Paragraph({
                                    indent: { firstLine: 720 },
                                    alignment: AlignmentType.JUSTIFIED,
                                    children: [
                                        new TextRun({
                                            text: '4. Kế hoạch hành động',
                                            italics: true,
                                            size: 28,
                                        }),
                                    ],
                                })
                            )
                            children.push(
                                ...(await htmlToParagraphs(
                                    processHtmlContent(
                                        criterion?.evaluationCriterion?.actionPlan || '',
                                        evidenceTags
                                    )
                                ))
                            )

                            // children.push(
                            //     new Paragraph({
                            //         indent: { firstLine: 720 },
                            //         alignment: AlignmentType.JUSTIFIED,
                            //         children: [
                            //             new TextRun({
                            //                 text: '5. Tự đánh giá',
                            //                 italics: true,
                            //                 size: 28,
                            //             }),
                            //         ],
                            //     })
                            // )
                        }

                        // Kết luận
                        children.push(
                            new Paragraph({
                                indent: { firstLine: 720 },
                                alignment: AlignmentType.JUSTIFIED,
                                heading: HeadingLevel.HEADING_2,
                                children: [
                                    new TextRun({
                                        text: `Kết luận về Tiêu chuẩn ${idx + 1}:`,
                                        bold: true,
                                        italics: true,
                                        size: 28,
                                        color: '000000',
                                    }),
                                ],
                            })
                        )
                        children.push(
                            ...(await htmlToParagraphs(
                                processHtmlContent(
                                    standard?.evaluationCriterion?.conclusion || '',
                                    evidenceTags
                                )
                            ))
                        )

                        return { children }
                    })
                )
                const doc = new Document({
                    sections: [
                        ...listMembers,
                        {
                            children: [
                                new Paragraph({
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
                                    headingStyleRange: '1-5',
                                }),
                            ],
                        },
                        ...sections,
                    ],
                })

                const blob = await Packer.toBlob(doc)
                saveAs(blob, `bao_cao_dot_danh_gia_${data?.name}.docx`)
            }
        } catch (error) {
            message.error('Không thể tải file mẫu')
            console.error('Lỗi tải file:', error)
        }
    }
    return (
        <Tooltip>
            <FileDown
                onClick={(e) => {
                    exportToWord()
                }}
            />
        </Tooltip>
    )
}
