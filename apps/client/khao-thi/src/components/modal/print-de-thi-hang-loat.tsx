import { Modal, Button, Flex, Divider, Input } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useState, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import {
    Document,
    Packer,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    AlignmentType,
    WidthType,
    BorderStyle,
    VerticalAlign,
    PageBreak,
    ImageRun,
} from 'docx'
import html2canvas from 'html2canvas'
import { useFindManyExamBank, useUpdateExamBank } from '@workspace/db/hooks'
import { renderWithMath } from '@components/commons/rich-text-editor/renderWithMath'
import { queryClient } from '@api/index'

// Type cho content elements
type ContentElement =
    | { type: 'text'; content: string }
    | {
          type: 'image'
          data: Uint8Array
          width: number
          height: number
      }

const PrintBatchExamBank = () => {
    const [name, setName] = useState('Nguyễn Văn A')
    const { isOpen, onClose, input } = useDisclosure<{
        ids: string[]
    }>({
        tag: 'PrintBatchExamBank',
    })

    const [hasDownloaded, setHasDownloaded] = useState(false)
    const printRef = useRef<HTMLDivElement>(null)

    const { data: exams = [] } = useFindManyExamBank(
        {
            where: {
                id: {
                    in: input?.ids || [],
                },
            },
            include: {
                exam: {
                    include: {
                        semester: true,
                        subjectVersion: true,
                    },
                },
                questions: {
                    include: {
                        question: true,
                    },
                },
                subjectClass: {
                    select: {
                        name: true,
                        id: true,
                        code: true,
                    },
                },
            },
            orderBy: {
                examCode: 'asc',
            },
        },
        {
            enabled: !!input?.ids && input?.ids.length > 0,
        }
    )

    const { mutateAsync: updateExamBank } = useUpdateExamBank()

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `De-Thi-Hang-Loat-${exams[0]?.exam?.subjectVersion?.name || 'Exam'}`,
    })

    const allowMaterials = true

    // ========== RENDER LATEX THÀNH HÌNH ẢNH ==========

    // Render 1 công thức LaTeX thành hình ảnh PNG
    async function renderLatexToImage({
        latexFormula,
        isBlock = false,
    }: {
        latexFormula: string
        isBlock?: boolean
    }): Promise<{ data: Uint8Array; width: number; height: number } | null> {
        try {
            // Tạo wrapper container để đảm bảo không bị cắt
            const wrapper = document.createElement('div')
            wrapper.style.position = 'absolute'
            wrapper.style.left = '-9999px'
            wrapper.style.top = '-9999px'
            wrapper.style.backgroundColor = '#FFFFFF'
            wrapper.style.padding = '15px'
            wrapper.style.display = 'inline-block'

            const container = document.createElement('div')
            container.style.backgroundColor = '#FFFFFF'
            container.style.fontSize = '12pt'
            container.style.fontFamily = 'Times New Roman, serif'
            container.style.lineHeight = '1.4'
            container.style.display = 'inline-block'
            container.style.padding = '2px'

            // Wrap LaTeX và render
            const wrappedLatex = isBlock ? `$$${latexFormula}$$` : `$${latexFormula}$`
            container.innerHTML = renderWithMath(wrappedLatex)

            wrapper.appendChild(container)
            document.body.appendChild(wrapper)

            // Đợi fonts và MathJax/KaTeX render xong
            await new Promise((resolve) => setTimeout(resolve, 800))
            await document.fonts.ready

            // Capture toàn bộ wrapper để bao gồm cả padding
            const canvas = await html2canvas(wrapper, {
                backgroundColor: '#FFFFFF',
                scale: 3,
                logging: false,
                useCORS: true,
                allowTaint: true,
                width: wrapper.scrollWidth,
                height: wrapper.scrollHeight,
            })

            document.body.removeChild(wrapper)

            return new Promise((resolve) => {
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            blob.arrayBuffer().then((buffer) => {
                                resolve({
                                    data: new Uint8Array(buffer),
                                    width: Math.round(canvas.width / 3),
                                    height: Math.round(canvas.height / 3),
                                })
                            })
                        } else {
                            resolve(null)
                        }
                    },
                    'image/png',
                    1.0
                )
            })
        } catch (error) {
            console.error('Error rendering LaTeX:', error)
            return null
        }
    }

    // Tách nội dung thành các phần: text thường và LaTeX
    const parseContentWithLatex = (
        text: string
    ): Array<{
        type: 'text' | 'latex-block' | 'latex-inline'
        content: string
    }> => {
        const parts: Array<{
            type: 'text' | 'latex-block' | 'latex-inline'
            content: string
        }> = []

        const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g
        let lastIndex = 0
        let match: RegExpExecArray | null = null

        match = regex.exec(text)
        while (match !== null) {
            if (match.index > lastIndex) {
                const textBefore = text.slice(lastIndex, match.index)
                if (textBefore) {
                    parts.push({ type: 'text', content: textBefore })
                }
            }

            const latex = match[1]
            if (latex.startsWith('$$')) {
                parts.push({
                    type: 'latex-block',
                    content: latex.slice(2, -2).trim(),
                })
            } else {
                parts.push({
                    type: 'latex-inline',
                    content: latex.slice(1, -1).trim(),
                })
            }

            lastIndex = regex.lastIndex
            match = regex.exec(text)
        }

        if (lastIndex < text.length) {
            const remaining = text.slice(lastIndex)
            if (remaining) {
                parts.push({ type: 'text', content: remaining })
            }
        }

        return parts
    }

    // Helper function để strip HTML tags
    const stripHtml = (html: string) => {
        const tmp = document.createElement('div')
        tmp.innerHTML = html
        return tmp.textContent || tmp.innerText || ''
    }

    // Parse nội dung HTML và tạo elements cho Word
    const parseHtmlContent = async (html: string): Promise<ContentElement[]> => {
        const elements: ContentElement[] = []

        // Lấy text thuần (giữ nguyên LaTeX)
        const plainText = stripHtml(html)

        // Tách thành các phần
        const parts = parseContentWithLatex(plainText)

        for (const part of parts) {
            if (part.type === 'text') {
                // Text thường - giữ nguyên
                elements.push({ type: 'text', content: part.content })
            } else {
                // LaTeX - render thành hình ảnh
                const isBlock = part.type === 'latex-block'
                const imageData = await renderLatexToImage({
                    latexFormula: part.content,
                    isBlock,
                })

                if (imageData) {
                    elements.push({
                        type: 'image',
                        data: imageData.data,
                        width: imageData.width,
                        height: imageData.height,
                    })
                } else {
                    // Fallback nếu render thất bại
                    elements.push({ type: 'text', content: part.content })
                }
            }
        }

        return elements
    }

    // Tạo children cho Paragraph từ elements
    const createParagraphChildren = (
        elements: ContentElement[],
        prefixText?: string,
        prefixBold?: boolean
    ) => {
        const children: (TextRun | ImageRun)[] = []

        if (prefixText) {
            children.push(
                new TextRun({
                    text: prefixText,
                    bold: prefixBold,
                    font: 'Times New Roman',
                    size: 24,
                })
            )
        }

        for (const el of elements) {
            if (el.type === 'text') {
                children.push(
                    new TextRun({
                        text: el.content,
                        font: 'Times New Roman',
                        size: 24,
                    })
                )
            } else if (el.type === 'image') {
                children.push(
                    new ImageRun({
                        type: 'png',
                        data: el.data,
                        transformation: {
                            width: el.width,
                            height: el.height,
                        },
                        altText: {
                            title: 'Math Formula',
                            description: 'Mathematical formula',
                            name: 'formula',
                        },
                    })
                )
            }
        }

        return children
    }

    // Tạo document Word cho một đề thi
    const createExamSection = (
        exam: any,
        processedQuestions: Array<{ index: number; questionContent: ContentElement[] }>,
        isLastExam: boolean
    ) => {
        const currentDate = new Date()
        const day = currentDate.getDate()
        const month = currentDate.getMonth() + 1
        const year = currentDate.getFullYear()

        const children = [
            // Header row
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: { style: BorderStyle.NONE },
                    bottom: { style: BorderStyle.NONE },
                    left: { style: BorderStyle.NONE },
                    right: { style: BorderStyle.NONE },
                    insideHorizontal: { style: BorderStyle.NONE },
                    insideVertical: { style: BorderStyle.NONE },
                },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 36, type: WidthType.PERCENTAGE },
                                borders: {
                                    top: { style: BorderStyle.NONE },
                                    bottom: { style: BorderStyle.NONE },
                                    left: { style: BorderStyle.NONE },
                                    right: { style: BorderStyle.NONE },
                                },
                                children: [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: 'BAN KHẢO THÍ & ĐBCLGD-ĐT',
                                                bold: true,
                                                font: 'Times New Roman',
                                                size: 24,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                            new TableCell({
                                width: { size: 32, type: WidthType.PERCENTAGE },
                                borders: {
                                    top: { style: BorderStyle.NONE },
                                    bottom: { style: BorderStyle.NONE },
                                    left: { style: BorderStyle.NONE },
                                    right: { style: BorderStyle.NONE },
                                },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [
                                            new TextRun({
                                                text: 'PHIẾU ĐỀ THI',
                                                bold: true,
                                                font: 'Times New Roman',
                                                size: 24,
                                            }),
                                        ],
                                    }),
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        spacing: { before: 100 },
                                        children: [
                                            new TextRun({
                                                text: `(Dùng cho lớp: ${exam?.subjectClass?.name || ''})`,
                                                font: 'Times New Roman',
                                                size: 24,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                            new TableCell({
                                width: { size: 32, type: WidthType.PERCENTAGE },
                                borders: {
                                    top: { style: BorderStyle.NONE },
                                    bottom: { style: BorderStyle.NONE },
                                    left: { style: BorderStyle.NONE },
                                    right: { style: BorderStyle.NONE },
                                },
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.RIGHT,
                                        children: [
                                            new TextRun({
                                                text: exam?.exam?.semester?.name || 'HK1',
                                                bold: true,
                                                font: 'Times New Roman',
                                                size: 24,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),

            // Date
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 300 },
                children: [
                    new TextRun({
                        text: `Ngày ${day} tháng ${month} năm ${year}`,
                        italics: true,
                        font: 'Times New Roman',
                        size: 24,
                    }),
                ],
            }),

            // Main info table
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 25, type: WidthType.PERCENTAGE },
                                verticalAlign: VerticalAlign.CENTER,
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [
                                            new TextRun({
                                                text: 'Giáo viên ra đề',
                                                bold: true,
                                                font: 'Times New Roman',
                                                size: 24,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                            new TableCell({
                                width: { size: 50, type: WidthType.PERCENTAGE },
                                verticalAlign: VerticalAlign.CENTER,
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        spacing: { after: 100 },
                                        children: [
                                            new TextRun({
                                                text: `Đề thi số: ${exam?.examCode || '001'}`,
                                                bold: true,
                                                font: 'Times New Roman',
                                                size: 24,
                                            }),
                                        ],
                                    }),
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        spacing: { after: 100 },
                                        children: [
                                            new TextRun({
                                                text: `Học phần: ${exam?.exam?.subjectVersion?.name || ''}`,
                                                bold: true,
                                                font: 'Times New Roman',
                                                size: 24,
                                            }),
                                        ],
                                    }),
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        spacing: { after: 150 },
                                        children: [
                                            new TextRun({
                                                text: `Thời gian làm bài: ${exam?.exam?.duration || 30} phút`,
                                                bold: true,
                                                font: 'Times New Roman',
                                                size: 24,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                            new TableCell({
                                width: { size: 25, type: WidthType.PERCENTAGE },
                                verticalAlign: VerticalAlign.CENTER,
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        spacing: { after: 100 },
                                        children: [
                                            new TextRun({
                                                text: 'BAN KHẢO THÍ & ĐBCLGD-ĐT',
                                                bold: true,
                                                font: 'Times New Roman',
                                                size: 24,
                                            }),
                                        ],
                                    }),
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [
                                            new TextRun({
                                                text: name,
                                                italics: true,
                                                font: 'Times New Roman',
                                                size: 24,
                                            }),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),

            new Paragraph({ spacing: { after: 400 } }),

            // Questions
            ...processedQuestions.map(
                (q) =>
                    new Paragraph({
                        spacing: { after: 200 },
                        children: createParagraphChildren(
                            q.questionContent,
                            `Câu ${q.index + 1}(${Number(exam?.questions?.[q.index]?.question?.point || 0).toFixed(1)} điểm): `,
                            true
                        ),
                    })
            ),

            // Footer
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 600 },
                children: [
                    new TextRun({
                        text: '-----HẾT-----',
                        bold: true,
                        font: 'Times New Roman',
                        size: 24,
                    }),
                ],
            }),

            ...(allowMaterials
                ? [
                      new Paragraph({
                          alignment: AlignmentType.CENTER,
                          spacing: { before: 200 },
                          children: [
                              new TextRun({
                                  text: '(Được sử dụng tài liệu)',
                                  italics: true,
                                  font: 'Times New Roman',
                                  size: 24,
                              }),
                          ],
                      }),
                  ]
                : []),

            new Paragraph({
                spacing: { before: 600 },
                children: [
                    new TextRun({
                        text: '* Giám thị coi thi không giải thích gì thêm',
                        bold: true,
                        italics: true,
                        font: 'Times New Roman',
                        size: 24,
                    }),
                ],
            }),
        ]

        // Thêm page break nếu không phải đề cuối cùng
        if (!isLastExam) {
            children.push(
                new Paragraph({
                    children: [new PageBreak()],
                })
            )
        }

        return children
    }

    // Tạo document Word
    const createDocument = async () => {
        const allChildren: any[] = []

        for (let i = 0; i < exams.length; i++) {
            const exam = exams[i]
            const isLastExam = i === exams.length - 1

            // Pre-process questions
            const processedQuestions = await Promise.all(
                (exam?.questions || []).map(async (q: any, index: number) => {
                    const questionContent = await parseHtmlContent(q?.question?.content || '')
                    return {
                        index,
                        questionContent,
                    }
                })
            )

            const examChildren = createExamSection(exam, processedQuestions, isLastExam)
            allChildren.push(...examChildren)
        }

        const doc = new Document({
            sections: [
                {
                    properties: {
                        page: {
                            margin: {
                                top: 567,
                                bottom: 567,
                                left: 850,
                                right: 850,
                            },
                        },
                    },
                    children: allChildren,
                },
            ],
        })

        return doc
    }

    // Download file
    const handleDownload = async () => {
        const doc = await createDocument()
        const blob = await Packer.toBlob(doc)

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `De-Thi-Hang-Loat-${exams[0]?.exam?.subjectVersion?.name || 'Exam'}.docx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        setHasDownloaded(true)
    }

    const handleClose = async () => {
        if (hasDownloaded) {
            // Cập nhật isLock cho tất cả các đề đã tải
            await Promise.all(
                exams.map((exam) =>
                    updateExamBank({
                        where: { id: exam.id },
                        data: { isLock: true },
                    })
                )
            )
        }
        setHasDownloaded(false)
        queryClient.invalidateQueries({
            queryKey: ['ExamBank'],
        })
        onClose()
    }

    // Render preview cho một đề thi
    const renderExamPreview = (exam: any, index: number) => {
        const currentDate = new Date()
        const day = currentDate.getDate()
        const month = currentDate.getMonth() + 1
        const year = currentDate.getFullYear()

        return (
            <div key={exam.id}>
                <div
                    style={{
                        padding: '20mm 15mm',
                        width: '210mm',
                        minHeight: '297mm',
                        background: 'white',
                        fontFamily: 'Times New Roman, serif',
                        fontSize: '13pt',
                        lineHeight: '1.5',
                        margin: '0 auto',
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            position: 'relative',
                            marginBottom: '10px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                BAN KHẢO THÍ & ĐBCLGD-ĐT
                            </div>
                            <div style={{ fontWeight: 'bold' }}>{exam?.exam?.semester?.name}</div>
                        </div>
                        <div
                            style={{
                                position: 'absolute',
                                left: '55%',
                                top: '0',
                                transform: 'translateX(-50%)',
                                fontWeight: 'bold',
                            }}
                        >
                            PHIẾU ĐỀ THI
                        </div>
                    </div>

                    {/* Class info */}
                    <div
                        style={{
                            textAlign: 'center',
                            marginBottom: '10px',
                            marginLeft: '10%',
                        }}
                    >
                        <span style={{ fontWeight: 'normal' }}>
                            (Dùng cho lớp: {exam?.subjectClass?.name || ''})
                        </span>
                    </div>

                    {/* Date */}
                    <div
                        style={{
                            textAlign: 'right',
                            fontStyle: 'italic',
                            marginBottom: '15px',
                        }}
                    >
                        Ngày {day} tháng {month} năm {year}
                    </div>

                    {/* Main info table */}
                    <table
                        style={{
                            width: '100%',
                            border: '1px solid black',
                            borderCollapse: 'collapse',
                            marginBottom: '20px',
                        }}
                    >
                        <tbody>
                            <tr>
                                <td
                                    style={{
                                        border: '1px solid black',
                                        padding: '10px',
                                        width: '25%',
                                        textAlign: 'center',
                                        verticalAlign: 'middle',
                                    }}
                                >
                                    <strong>Giáo viên ra đề</strong>
                                </td>
                                <td
                                    style={{
                                        border: '1px solid black',
                                        padding: '10px',
                                        width: '50%',
                                        verticalAlign: 'middle',
                                    }}
                                >
                                    <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                                        <strong>Đề thi số: {exam?.examCode}</strong>
                                    </div>
                                    <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                                        <strong>
                                            Học phần: {exam?.exam?.subjectVersion?.name}
                                        </strong>
                                    </div>
                                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                                        <strong>
                                            Thời gian làm bài: {exam?.exam?.duration || 30} phút
                                        </strong>
                                    </div>
                                </td>
                                <td
                                    style={{
                                        border: '1px solid black',
                                        padding: '10px',
                                        width: '25%',
                                        textAlign: 'center',
                                        verticalAlign: 'middle',
                                    }}
                                >
                                    <div style={{ marginBottom: '5px' }}>
                                        <strong>BAN KHẢO THÍ & ĐBCLGD-ĐT</strong>
                                    </div>
                                    <div style={{ fontStyle: 'italic' }}>{name}</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Questions */}
                    <div style={{ marginBottom: '30px' }}>
                        {exam?.questions?.map((q: any, qIndex: number) => (
                            <div key={q?.id} style={{ marginBottom: '15px' }}>
                                <div>
                                    <strong>
                                        Câu {q?.order || qIndex + 1}(
                                        {Number(q?.question?.point || 0).toFixed(1)} điểm):
                                    </strong>{' '}
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: renderWithMath(q?.question?.content || ''),
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div style={{ textAlign: 'center', marginTop: '40px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                            -----HẾT-----
                        </div>
                        {allowMaterials && (
                            <div style={{ fontStyle: 'italic', marginBottom: '20px' }}>
                                (Được sử dụng tài liệu)
                            </div>
                        )}
                    </div>

                    {/* Note */}
                    <div
                        style={{
                            marginTop: '30px',
                            fontStyle: 'italic',
                            fontWeight: 'bold',
                        }}
                    >
                        * Giám thị coi thi không giải thích gì thêm
                    </div>
                </div>

                {/* Divider giữa các đề */}
                {index < exams.length - 1 && (
                    <Divider style={{ margin: '20px 0', borderColor: '#999' }} />
                )}
            </div>
        )
    }

    return (
        <Modal
            title={
                <div className="flex items-center gap-4">
                    <span>Xem trước {exams.length} đề thi</span>
                    <div className="flex-1 flex items-center justify-end gap-4 mr-6">
                        <Input
                            placeholder="Nhập tên"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-56"
                        />
                    </div>
                </div>
            }
            open={isOpen}
            onCancel={handleClose}
            className="top-2"
            width={1000}
            footer={
                <Flex justify="flex-end" gap={8}>
                    <Button onClick={handleClose}>Đóng</Button>
                    <Button onClick={handlePrint} type="primary">
                        In
                    </Button>
                    <Button type="primary" onClick={handleDownload}>
                        Tải xuống tất cả ({exams.length} đề)
                    </Button>
                </Flex>
            }
        >
            <div
                style={{
                    maxHeight: '70vh',
                    overflow: 'auto',
                    border: '1px solid #d9d9d9',
                    padding: '16px',
                }}
            >
                <div ref={printRef}>
                    {exams.length > 0 ? (
                        exams.map((exam, index) => renderExamPreview(exam, index))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            Không có đề thi nào được chọn
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    )
}

export default PrintBatchExamBank
