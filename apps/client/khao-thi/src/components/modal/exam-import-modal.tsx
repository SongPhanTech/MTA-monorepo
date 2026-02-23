import { UploadOutlined } from '@ant-design/icons'
import { queryClient } from '@api/index'
import { useStore } from '@tanstack/react-store'
import { type Difficult, ExamType, QuestionType } from '@workspace/db'
import {
    useCreateExamBank,
    useCreateQuestion,
    useCreateQuestionBank,
    useFindManyQuestion,
    useFindManyQuestionBank,
    useFindUniqueExamBank,
} from '@workspace/db/hooks'
import { Button, Descriptions, Modal, message, Table } from 'antd'
import { XMLParser } from 'fast-xml-parser'
import PizZip from 'pizzip'
import type React from 'react'
import { useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { store } from '@/pages/thiet-lap-de-thi/danh-sach-de'

interface ParsedQuestion {
    order: number
    content: string
    point: number
}

interface ParsedExamData {
    examCode: string
    examDay: Date | null
    examName: string
    examDuration: string
    examiner: string
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
        // Normalize non-breaking spaces và các ký tự whitespace đặc biệt thành space thường
        const normalized = text.replace(/[\u00A0\u202F\u2009\u2060\uFEFF]/g, ' ')
        const match = normalized.match(/Ngày\s*(\d+)\s*tháng\s*(\d+)\s*năm\s*(\d+)/i)
        if (match) {
            const day = Number.parseInt(match[1], 10)
            const month = Number.parseInt(match[2], 10) - 1 // month is 0-indexed
            const year = Number.parseInt(match[3], 10)
            return new Date(year, month, day)
        }
        return null
    }

    // Parse mã đề từ text "Đề thi số: XX" hoặc "Đề thi số : XX"
    // Mã đề có thể là số, chữ, hoặc kết hợp (VD: 001, TEST_SINH_3, TEST SINH_3)
    const parseExamCode = (text: string): string | null => {
        // Match "Đề thi số: CODE" - CODE có thể gồm chữ, số, gạch dưới, khoảng trắng
        let match = text.match(/Đề\s+thi\s+số\s*:\s*([A-Z0-9][A-Z0-9_\s-]*)/i)
        if (match) return match[1].trim()

        // Match standalone code gồm chữ + gạch dưới/khoảng trắng + số (VD: TEST_SINH_3)
        match = text.match(/^([A-Z0-9][A-Z0-9_ -]*)$/i)
        if (match && match[1].trim().length > 0 && match[1].trim().length <= 30)
            return match[1].trim()

        return null
    }

    // Parse tên kỳ thi từ header
    const parseExamName = (text: string): string => {
        const match = text.match(/Học\s+kỳ\s+\d+\s+năm\s+\d{4}-\d{4}/i)
        return match ? match[0] : ''
    }

    // Parse thời gian làm bài từ text "Thời gian làm bài: 60 phút"
    const parseExamDuration = (text: string): string => {
        const normalized = text.replace(/[\u00A0\u202F\u2009\u2060\uFEFF]/g, ' ')
        const match = normalized.match(/Thời\s*gian\s*làm\s*bài\s*:\s*(\d+)\s*(phút)/i)
        return match ? `${match[1]} ${match[2]}` : ''
    }

    // Parse người ra đề: chỉ lấy tên người sau "ĐBCLGD-ĐT"
    // Chỉ tìm trong dòng có "Thời gian làm bài" để tránh match nhầm dòng header
    const parseExaminer = (text: string): string => {
        const normalized = text.replace(/[\u00A0\u202F\u2009\u2060\uFEFF]/g, ' ')
        if (!normalized.match(/Thời\s*gian\s*làm\s*bài/i)) return ''
        const match = normalized.match(/ĐBCLGD-ĐT\s+(.+)/i)
        return match ? match[1].trim() : ''
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

            // Helper: extract lines từ một body/hdr element (dùng chung cho document và header)
            const extractLinesFromBody = (bodyEl: any) => {
                const ps = bodyEl['w:p']
                if (ps) {
                    const pArray = Array.isArray(ps) ? ps : [ps]
                    for (const p of pArray) {
                        const runs = p['w:r']
                        if (!runs) continue
                        const runArray = Array.isArray(runs) ? runs : [runs]
                        let content = ''
                        for (const r of runArray) {
                            content += extractTextFromWt(r['w:t'])
                        }
                        if (content.trim().length > 0) lines.push(content.trim())
                    }
                }
                const tbls = bodyEl['w:tbl']
                if (tbls) {
                    const tArray = Array.isArray(tbls) ? tbls : [tbls]
                    for (const table of tArray) {
                        const rows = Array.isArray(table['w:tr']) ? table['w:tr'] : [table['w:tr']]
                        for (const row of rows) {
                            if (!row) continue
                            const cells = Array.isArray(row['w:tc']) ? row['w:tc'] : [row['w:tc']]
                            const rowTexts: string[] = []
                            for (const cell of cells) {
                                const cellText = extractTextFromCell(cell)
                                if (cellText) rowTexts.push(cellText)
                            }
                            let rowText = ''
                            for (let i = 0; i < rowTexts.length; i++) {
                                const current = rowTexts[i]
                                const next = rowTexts[i + 1]
                                rowText += current
                                if (next) {
                                    const endsWithDigit = /\d$/.test(current)
                                    const startsWithDigit = /^\d/.test(next)
                                    if (!(endsWithDigit && startsWithDigit)) rowText += ' '
                                }
                            }
                            rowText = rowText.trim()
                            if (rowText) lines.push(rowText)
                        }
                    }
                }
            }

            // Đọc thêm từ Word header files (word/header1.xml, header2.xml, ...)
            for (let i = 1; i <= 3; i++) {
                const headerXml = zip.file(`word/header${i}.xml`)?.asText()
                if (headerXml) {
                    try {
                        const headerDoc = parser.parse(headerXml)
                        const hdr = headerDoc['w:hdr']
                        if (hdr) extractLinesFromBody(hdr)
                    } catch {
                        // bỏ qua nếu header không parse được
                    }
                }
            }

            // Parse body (paragraphs + tables)
            extractLinesFromBody(body)

            // Parse metadata
            let examCode = ''
            let examDay: Date | null = null
            let examName = ''
            let examDuration = ''
            let examiner = ''

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

                if (!examDuration) {
                    const duration = parseExamDuration(line)
                    if (duration) examDuration = duration
                }

                if (!examiner) {
                    const name = parseExaminer(line)
                    if (name) examiner = name
                }
            }

            // Nếu chưa tìm thấy mã đề, tìm pattern chữ+số hoặc số 3 chữ số trong các lines
            if (!examCode) {
                for (const line of lines) {
                    // Tìm mã dạng chữ-gạch dưới-số (VD: TEST_SINH_3, TEST SINH 3)
                    const alphaMatch = line.match(/\b([A-Z][A-Z0-9]*(?:[_ ][A-Z0-9]+)+)\b/i)
                    if (alphaMatch) {
                        examCode = alphaMatch[1]
                        break
                    }
                    // Tìm số 3 chữ số (001, 002, 003, etc.)
                    const numMatch = line.match(/\b(\d{3})\b/)
                    if (numMatch) {
                        examCode = numMatch[1]
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
                examDuration,
                examiner,
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
                throw new Error('Không thể tạo ngân hàng câu hỏi')
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
            title="Import đề thi từ file word"
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
                        <Descriptions.Item label="Kỳ thi">
                            {parsedData.examName || 'Chưa xác định'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Số câu hỏi">
                            {parsedData.questions.length} câu
                        </Descriptions.Item>
                        <Descriptions.Item label="Hình thức thi">Thi viết</Descriptions.Item>
                        <Descriptions.Item label="Thời gian làm bài">
                            {parsedData.examDuration || 'Chưa xác định'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Người ra đề">
                            {parsedData.examiner || 'Chưa xác định'}
                        </Descriptions.Item>
                    </Descriptions>

                    <div style={{ marginTop: 16 }}>
                        <h3>Danh sách câu hỏi: </h3>
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
