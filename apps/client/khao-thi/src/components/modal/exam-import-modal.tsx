import { UploadOutlined } from '@ant-design/icons'
import { Button, Modal, message, Table, Descriptions } from 'antd'
import { XMLParser } from 'fast-xml-parser'
import PizZip from 'pizzip'
import type React from 'react'
import { useState } from 'react'

import { useDisclosure } from 'react-hook-disclosure-modal'
import { useStore } from '@tanstack/react-store'
import {
    useCreateExamBank,
    useCreateQuestion,
    useCreateQuestionBank,
    useFindManyQuestion,
    useFindManyQuestionBank,
    useFindUniqueExamBank,
} from '@workspace/db/hooks'
import { store } from '@/pages/thiet-lap-de-thi/danh-sach-de'
import { queryClient } from '@api/index'
import { type Difficult, ExamType, QuestionType } from '@workspace/db'
interface ParsedQuestion {
    order: number
    content: string
    point: number
}

interface ParsedExamData {
    examCode: string
    examDay: Date | null
    examName: string
    questions: ParsedQuestion[]
}

const ExamImportModal: React.FC = () => {
    const [parsedData, setParsedData] = useState<ParsedExamData | null>(null)
    const { isOpen, onClose } = useDisclosure({
        tag: 'ExamImportModal',
        onClose: () => {
            setParsedData(null)
        },
    })

    const selectedExamId = useStore(store, (state) => state.selectedExamId)
    const subjectVersionId = useStore(store, (state) => state.subjectVersionId)

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
    })

    // Parse ngày thi từ text "Ngày DD tháng MM năm YYYY"
    const parseExamDay = (text: string): Date | null => {
        const match = text.match(/Ngày\s+(\d+)\s+tháng\s+(\d+)\s+năm\s+(\d+)/i)
        if (match) {
            const day = Number.parseInt(match[1], 10)
            const month = Number.parseInt(match[2], 10) - 1 // month is 0-indexed
            const year = Number.parseInt(match[3], 10)
            return new Date(year, month, day)
        }
        return null
    }

    // Parse mã đề từ text "Đề thi số: XX" hoặc "Đề thi số : XX"
    const parseExamCode = (text: string): string | null => {
        let match = text.match(/Đề\s+thi\s+số\s*:\s*(\d+(?:[_-]\d+)?)/i)
        if (match) return match[1]

        match = text.match(/^(\d{3}|\d{2}[_-]\d{1,3})$/)
        if (match && match[1].length <= 6) return match[1]

        return null
    }

    // Parse tên kỳ thi từ header
    const parseExamName = (text: string): string => {
        const match = text.match(/Học\s+kỳ\s+\d+\s+năm\s+\d{4}-\d{4}/i)
        return match ? match[0] : ''
    }

    // Parse câu hỏi từ text
    const parseQuestions = (lines: string[]): ParsedQuestion[] => {
        const questions: ParsedQuestion[] = []
        let currentQuestion: ParsedQuestion | null = null

        for (const line of lines) {
            const trimmed = line.trim()

            const questionMatch = trimmed.match(
                /^Câu\s+(\d+)\s*\((\d+(?:\.\d+)?)\s*điểm\)\s*:\s*(.*)$/i
            )

            if (questionMatch) {
                if (currentQuestion) {
                    questions.push(currentQuestion)
                }

                const order = Number.parseInt(questionMatch[1], 10)
                const point = Number.parseFloat(questionMatch[2])
                const content = questionMatch[3].trim()

                currentQuestion = {
                    order,
                    point,
                    content,
                }
            } else if (currentQuestion && trimmed && !trimmed.startsWith('-----HẾT-----')) {
                // Nội dung tiếp theo của câu hỏi hiện tại
                currentQuestion.content += `\n${trimmed}`
            } else if (trimmed.startsWith('-----HẾT-----')) {
                // Kết thúc
                if (currentQuestion) {
                    questions.push(currentQuestion)
                }
                break
            }
        }

        // Lưu câu hỏi cuối cùng nếu chưa lưu
        if (currentQuestion && !questions.find((q) => q.order === currentQuestion?.order)) {
            questions.push(currentQuestion)
        }

        return questions
    }

    // Helper: Extract text từ một phần tử w:t (có thể là string, number, object, hoặc array)
    const extractTextFromWt = (wt: any): string => {
        if (wt === null || wt === undefined) return ''

        // Trường hợp w:t là mảng (nhiều text elements trong cùng một run)
        if (Array.isArray(wt)) {
            return wt.map((t) => extractTextFromWt(t)).join('')
        }

        // Trường hợp w:t là số (XMLParser tự động convert "3" thành number 3)
        if (typeof wt === 'number') {
            return String(wt)
        }

        // Trường hợp w:t là string đơn giản
        if (typeof wt === 'string') {
            return wt
        }

        // Trường hợp w:t là object với #text (khi có xml:space="preserve")
        if (typeof wt === 'object' && wt['#text'] !== undefined) {
            return extractTextFromWt(wt['#text'])
        }

        return ''
    }

    // Extract text từ table cell
    const extractTextFromCell = (cell: any): string => {
        if (!cell) return ''

        const paragraphs = Array.isArray(cell['w:p']) ? cell['w:p'] : [cell['w:p']]
        let fullText = ''

        for (const p of paragraphs) {
            if (!p) continue
            const runs = p['w:r']
            if (!runs) continue

            const runArray = Array.isArray(runs) ? runs : [runs]

            // Nối tất cả runs trong paragraph lại KHÔNG trim giữa các runs
            for (const r of runArray) {
                fullText += extractTextFromWt(r['w:t'])
            }

            // Thêm khoảng trắng giữa các paragraphs
            fullText += ' '
        }

        // Chỉ trim ở cuối cùng
        return fullText.trim()
    }

    const handleImport = async (file: File) => {
        try {
            const arrayBuffer = await file.arrayBuffer()
            const zip = new PizZip(arrayBuffer)

            const documentXml = zip.file('word/document.xml')?.asText()
            if (!documentXml) {
                throw new Error('Không thể đọc nội dung file Word')
            }

            const doc = parser.parse(documentXml)
            const body = doc['w:document']['w:body']

            // Thu thập tất cả các dòng text từ cả paragraphs và tables
            const lines: string[] = []

            // Parse paragraphs
            const paragraphs = body['w:p']
            if (paragraphs) {
                const pArray = Array.isArray(paragraphs) ? paragraphs : [paragraphs]

                for (const p of pArray) {
                    const runs = p['w:r']
                    if (!runs) continue

                    const runArray = Array.isArray(runs) ? runs : [runs]
                    let content = ''

                    for (const r of runArray) {
                        content += extractTextFromWt(r['w:t'])
                    }

                    if (content.trim().length > 0) {
                        lines.push(content.trim())
                    }
                }
            }

            // Parse tables
            const tables = body['w:tbl']
            if (tables) {
                const tArray = Array.isArray(tables) ? tables : [tables]

                for (const table of tArray) {
                    const rows = Array.isArray(table['w:tr']) ? table['w:tr'] : [table['w:tr']]

                    for (const row of rows) {
                        if (!row) continue
                        const cells = Array.isArray(row['w:tc']) ? row['w:tc'] : [row['w:tc']]

                        // Merge tất cả cells trong cùng row thành một dòng
                        const rowTexts: string[] = []
                        for (const cell of cells) {
                            const cellText = extractTextFromCell(cell)
                            if (cellText) {
                                rowTexts.push(cellText)
                            }
                        }

                        // Join cells, nhưng cẩn thận với số
                        let rowText = ''
                        for (let i = 0; i < rowTexts.length; i++) {
                            const current = rowTexts[i]
                            const next = rowTexts[i + 1]

                            rowText += current

                            // Nếu cell hiện tại kết thúc bằng số VÀ cell tiếp theo bắt đầu bằng số
                            // thì KHÔNG thêm khoảng trắng (để ghép "00" + "2" thành "002")
                            if (next) {
                                const endsWithDigit = /\d$/.test(current)
                                const startsWithDigit = /^\d/.test(next)
                                if (!(endsWithDigit && startsWithDigit)) {
                                    rowText += ' '
                                }
                            }
                        }

                        rowText = rowText.trim()
                        if (rowText) {
                            lines.push(rowText)
                        }
                    }
                }
            }

            // Parse metadata
            let examCode = ''
            let examDay: Date | null = null
            let examName = ''

            // Ưu tiên tìm mã đề có "Đề thi số:" trước
            for (const line of lines) {
                if (!examCode && line.includes('Đề thi số')) {
                    const code = parseExamCode(line)
                    if (code) examCode = code
                }

                if (!examDay) {
                    examDay = parseExamDay(line)
                }

                if (!examName) {
                    const name = parseExamName(line)
                    if (name) examName = name
                }
            }

            // Nếu chưa tìm thấy mã đề, tìm pattern số 3 chữ số trong các lines
            if (!examCode) {
                for (const line of lines) {
                    // Tìm số 3 chữ số (001, 002, 003, etc.)
                    const match = line.match(/\b(\d{3})\b/)
                    if (match) {
                        examCode = match[1]
                        break
                    }
                }
            }

            // Parse câu hỏi
            const questions = parseQuestions(lines)

            // Validation
            if (!examCode) {
                throw new Error('Không tìm thấy mã đề trong file Word')
            }

            if (questions.length === 0) {
                throw new Error('Không tìm thấy câu hỏi nào trong file Word')
            }

            setParsedData({
                examCode,
                examDay,
                examName,
                questions,
            })
        } catch (error: any) {
            console.error(error)
            message.error(error.message || 'Có lỗi xảy ra khi đọc file Word')
        }
    }

    const { mutateAsync: createQuestion } = useCreateQuestion()
    const { mutateAsync: createExamBank } = useCreateExamBank()
    const { data: questionBanks = [] } = useFindManyQuestionBank({
        where: { subjectVersionId },
    })
    const { mutateAsync: createQuestionBank } = useCreateQuestionBank()

    const { data: existingExamBank } = useFindUniqueExamBank(
        {
            where: {
                examId_examCode: {
                    examId: selectedExamId ? (selectedExamId as string) : '',
                    examCode: parsedData?.examCode as string,
                },
            },
            include: {
                questions: true,
                exam: true,
            },
        },
        {
            enabled: !!parsedData && !!selectedExamId,
        }
    )

    // Fetch tất cả câu hỏi từ ngân hàng câu hỏi để tìm kiếm
    const { data: existingQuestions = [] } = useFindManyQuestion(
        {
            where: {
                questionBankId: questionBanks[0]?.id,
            },
            select: {
                id: true,
                content: true,
                point: true,
            },
        },
        {
            enabled: !!questionBanks[0]?.id,
        }
    )

    const onOk = async () => {
        if (!parsedData) return
        if (!selectedExamId) {
            message.error('Vui lòng chọn kỳ thi trước!')
            return
        }

        try {
            if (existingExamBank !== null) {
                message.error(`Mã đề "${parsedData.examCode}" đã tồn tại!`)
                return
            }

            // Lấy hoặc tạo QuestionBank
            let questionBankId = questionBanks[0]?.id

            if (!questionBankId && subjectVersionId) {
                const newQB: any = await createQuestionBank({
                    data: {
                        name: 'Ngân hàng câu hỏi tổng hợp',
                        subjectVersionId,
                    },
                })
                questionBankId = newQB?.id
            }

            if (!questionBankId) {
                throw new Error('Không thể tạo Question Bank')
            }

            // Tìm kiếm hoặc tạo các câu hỏi
            const questionIds: string[] = []

            for (const q of parsedData.questions) {
                // Tìm câu hỏi đã có trong ngân hàng câu hỏi dựa vào content
                const existingQuestion = existingQuestions.find(
                    (existing) => existing.content.trim() === q.content.trim()
                )

                if (existingQuestion) {
                    //Nếu có rồi thì connect thôi
                    questionIds.push(existingQuestion.id)
                } else {
                    // Nếu chưa có → tạo câu hỏi mới (chưa có đáp án)
                    const newQuestion: any = await createQuestion({
                        data: {
                            content: q.content,
                            point: q.point,
                            type: QuestionType.ESSAY,
                            difficult: 'D1' as Difficult,
                            questionBankId,
                            knowledgeBlockId: null,
                            explanation: '',
                            isAutoGraded: false,
                        },
                    })
                    questionIds.push(newQuestion.id)
                }
            }

            // Tạo ExamBank với các câu hỏi
            await createExamBank({
                data: {
                    examCode: parsedData.examCode,
                    examDay: parsedData.examDay,
                    examType: ExamType.OfflineWritten,
                    examId: selectedExamId,
                    questions: {
                        create: questionIds.map((id, index) => ({
                            questionId: id,
                            order: index + 1,
                        })),
                    },
                },
            })

            message.success('Import đề thi thành công!')

            queryClient.invalidateQueries({ queryKey: ['ExamBank'] })

            onClose()
        } catch (error: any) {
            console.error(error)
            message.error('Có lỗi xảy ra khi lưu đề thi')
        }
    }

    const columns = [
        {
            title: 'STT',
            dataIndex: 'order',
            width: 60,
            align: 'center' as const,
        },
        {
            title: 'Nội dung câu hỏi',
            dataIndex: 'content',
            render: (text: string) => <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>,
        },
        {
            title: 'Điểm',
            dataIndex: 'point',
            width: 80,
            align: 'center' as const,
            render: (point: number) => `${point} đ`,
        },
    ]

    return (
        <Modal
            title="Import đề thi từ Word"
            open={isOpen}
            width="90vw"
            onCancel={onClose}
            style={{ top: 20 }}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Đóng
                </Button>,
                <Button key="submit" type="primary" onClick={onOk}>
                    Lưu Đề Thi
                </Button>,
            ]}
        >
            <input
                type="file"
                accept=".docx"
                onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                        handleImport(file)
                    }
                    e.target.value = ''
                }}
                style={{ display: 'none' }}
                id="exam-import-input"
            />

            <Button
                icon={<UploadOutlined />}
                onClick={() => document.getElementById('exam-import-input')?.click()}
            >
                Chọn File Word (.docx)
            </Button>

            {parsedData && (
                <div style={{ marginTop: 16 }}>
                    <Descriptions title="Thông tin đề thi" bordered column={2} size="small">
                        <Descriptions.Item label="Mã đề">{parsedData.examCode}</Descriptions.Item>
                        <Descriptions.Item label="Ngày thi">
                            {parsedData.examDay
                                ? parsedData.examDay.toLocaleDateString('vi-VN')
                                : 'Chưa xác định'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Kỳ thi" span={2}>
                            {parsedData.examName || 'Chưa xác định'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số câu hỏi" span={2}>
                            {parsedData.questions.length} câu
                        </Descriptions.Item>
                        <Descriptions.Item label="Hình thức thi" span={2}>
                            Thi viết
                        </Descriptions.Item>
                    </Descriptions>

                    <div style={{ marginTop: 16 }}>
                        <h3>Danh sách câu hỏi</h3>
                        <Table
                            columns={columns}
                            dataSource={parsedData.questions}
                            rowKey="order"
                            scroll={{ y: 400 }}
                            pagination={false}
                        />
                    </div>
                </div>
            )}
        </Modal>
    )
}

export default ExamImportModal
