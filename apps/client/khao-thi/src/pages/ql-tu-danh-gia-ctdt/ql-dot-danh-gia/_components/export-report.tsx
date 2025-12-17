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
    TableRow,
    TextRun,
    WidthType,
    BorderStyle,
    VerticalAlign,
    type IImageOptions,
    ImageRun,
    TableOfContents,
} from 'docx'
import { saveAs } from 'file-saver'
import { sqlTransaction } from '@workspace/libs/api/model'
export default function ExportReport({ id }: { id: string }) {
    const role = {
        CHAIRMAN: 'Chủ tịch hội đồng',
        VICE_PRESIDENT: 'Phó chủ tịch hội đồng',
        HEAD_SECRETARY: 'Trưởng ban thư ký',
        SECRETARY: 'Thư ký',
        MEMBER: 'Thành viên',
        ADVISORY_BOARD: 'Ban tư vấn',
        SPECIALIZED: 'nhóm chuyên trách',
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
        const title = new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            children: [
                new TextRun({
                    text: 'DANH SÁCH CÁC ĐỒNG CHÍ THAM GIA HỘI ĐỒNG',
                    bold: true,
                    size: 32,
                    color: '000000',
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
                    width: { size: 35, type: WidthType.PERCENTAGE },
                    children: [new Paragraph('Quân hàm, học hàm, học vị, họ và tên')],
                }),
                new TableCell({
                    width: { size: 23, type: WidthType.PERCENTAGE },
                    children: [new Paragraph('Chức vụ, đơn vị')],
                }),
                new TableCell({
                    width: { size: 22, type: WidthType.PERCENTAGE },
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
                                    [
                                        item?.lecturer?.userProfile?.rank?.sTen,
                                        item?.lecturer?.userProfile?.academicDegreeType?.sTen,
                                        item?.lecturer?.userProfile?.academicRankType?.sTen,
                                    ]
                                        .filter(Boolean)
                                        .join(', ') +
                                        ' ' +
                                        [
                                            item?.lecturer?.userProfile?.lastName,
                                            item?.lecturer?.userProfile?.firstName,
                                        ]
                                            .filter(Boolean)
                                            .join(' ')
                                ),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph(
                                    [
                                        item?.lecturer?.userProfile?.positionCPV?.sTen,
                                        item?.lecturer?.organization?.sMa,
                                    ]
                                        .filter(Boolean)
                                        .join(', ')
                                ),
                            ],
                        }),
                        new TableCell({
                            children: Array.isArray(item.role)
                                ? item.role.map(
                                      (r: string) =>
                                          new Paragraph(role[r as keyof typeof role] || r)
                                  )
                                : [
                                      new Paragraph(
                                          role[item.role as keyof typeof role] || item.role
                                      ),
                                  ],
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
                insideHorizontal: {
                    style: BorderStyle.SINGLE,
                    size: 1,
                    color: '000000',
                },
                insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            },
            rows: [headerRow, ...dataRows],
        })

        return [title, new Paragraph(''), table]
    }
    const exportDanhSachMinhchung = (dataTable: any) => {
        const title = new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            children: [
                new TextRun({
                    text: 'BẢNG DANH MỤC MINH CHỨNG',
                    bold: true,
                    size: 32,
                    color: '000000',
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
                    children: [new Paragraph('Mã mới')],
                }),
                new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [new Paragraph('Tên minh chứng')],
                }),
                new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [new Paragraph('Số, ngày ban hành')],
                }),
                new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [new Paragraph('Nơi ban hành')],
                }),
                new TableCell({
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    children: [new Paragraph('Ghi chú')],
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
                            children: [new Paragraph(`PM.${item?.tag || ''}`)],
                        }),
                        new TableCell({
                            children: [new Paragraph(`${item?.evidence?.name || ''}`)],
                        }),
                        new TableCell({
                            children: [new Paragraph(`${item?.evidence?.information || ''}`)],
                        }),
                        new TableCell({
                            children: [new Paragraph(`${item?.evidence?.issuer || ''}`)],
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
                insideHorizontal: {
                    style: BorderStyle.SINGLE,
                    size: 1,
                    color: '000000',
                },
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
        const result: any = []
        // 1) Kiểm tra dataMap có phải array không
        if (!Array.isArray(dataMap)) {
            console.warn('❌ dataMap không phải array:', dataMap)
            return map
        }

        for (const [o1, standard] of dataMap.entries()) {
            const criteriaList = standard?.criteria
            if (!Array.isArray(criteriaList)) {
                console.warn('❌ standard.criteria không phải array:', criteriaList)
                continue
            }

            for (const [o2, criteria] of criteriaList.entries()) {
                const analysis = criteria?.analysisCriterions

                // analysisCriterions có thể là object → không loop được
                if (!analysis || typeof analysis !== 'object') {
                    console.warn('❌ criteria.analysisCriterions không hợp lệ:', analysis)
                    continue
                }

                const reqList = analysis.requirementCriterions

                if (!Array.isArray(reqList)) {
                    console.warn('❌ analysis.requirementCriterions không phải array:', reqList)
                    continue
                }

                for (const req of reqList) {
                    let evidenceCount = 0

                    const evidencesList = req?.evidences

                    if (!Array.isArray(evidencesList)) {
                        console.warn('❌ req.evidences không phải array:', evidencesList)
                        continue
                    }

                    for (const evidences of evidencesList) {
                        if (map.has(evidences.evidenceId)) continue

                        evidenceCount++

                        const tag = [o1 + 1, o2 + 1, evidenceCount]
                            .map((t) => t.toString().padStart(2, '0'))
                            .join('.')
                        result.push({ ...evidences, tag })
                        map.set(evidences.evidenceId, `[PM.${tag}]`)
                    }
                }
            }
        }

        return { evidenceTags: map, result }
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
                                orderBy: {
                                    order: 'asc',
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
                const { evidenceTags, result }: any = CalcevidenceTags(data?.standards)

                const listMembers = await Promise.all([
                    {
                        children: exportDanhSachHoiDong(data?.council?.members),
                    },
                ])
                const sections = await Promise.all([
                    ...data.standards.map(async (standard: any, idx: number) => {
                        const children: any = []

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
                            children.push(
                                new Paragraph({
                                    indent: { firstLine: 720 },
                                    alignment: AlignmentType.JUSTIFIED,
                                    children: [
                                        new TextRun({
                                            text: '5. Tự đánh giá',
                                            italics: true,
                                            size: 28,
                                        }),
                                    ],
                                })
                            )
                            children.push(
                                ...(await htmlToParagraphs(
                                    processHtmlContent(
                                        criterion?.evaluationCriterion?.score || '',
                                        evidenceTags
                                    )
                                ))
                            )
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
                    }),
                    {
                        children: exportDanhSachMinhchung(result),
                    },
                ])

                const doc = new Document({
                    sections: [
                        ...listMembers,
                        {
                            properties: {
                                type: 'nextPage',
                            },
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    heading: HeadingLevel.HEADING_1,
                                    children: [
                                        new TextRun({
                                            text: 'MỤC LỤC',
                                            bold: true,
                                            size: 32,
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
        <Tooltip title="Xuất báo cáo" placement="top">
            <FileDown
                size={17}
                strokeWidth={1.5}
                className="text-base text-green-600"
                onClick={(e) => {
                    exportToWord()
                }}
            />
        </Tooltip>
    )
}
