import { UploadOutlined } from '@ant-design/icons'
import FormItem from '@components/commons/form-item'
import Table from '@components/commons/table'
import type { FilterProps } from '@components/commons/typeFilter'
import { DIFFICULT_LABELS, QUESTION_TYPE_LABELS } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import { type Difficult, QuestionType } from '@workspace/db'
import { useCreateQuestion, useFindManyKnowledgeBlock } from '@workspace/db/hooks'
import { generatePresignedUrl } from '@workspace/libs/api/model'
import { env } from '@workspace/libs/utils'
import { Button, Modal, message, Col, Select, Radio, Form, Row } from 'antd'
import { XMLParser } from 'fast-xml-parser'
import PizZip from 'pizzip'
import type React from 'react'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

interface WordImportModalInput {
    questionBankId: string
    knowledgeBlockId: string
    subjectVersionId: string
}

const WordImportModal: React.FC = () => {
    const [questions, setQuestions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const { showSpinner, hideSpinner } = useSpinner()
    const [storageType, setStorageType] = useState<'khung' | 'kho'>('khung')
    const [form] = Form.useForm()
    const [isAllSelected, setIsAllSelected] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [filters, setFilters] = useState<FilterProps>({
        questionType: undefined,
        content: '',
        explanation: '',
        difficult: undefined,
    })

    const filteredQuestions = useMemo(() => {
        return questions.filter((q) => {
            // lọc loại câu hỏi
            if (
                filters.questionType &&
                filters.questionType.length > 0 &&
                !filters.questionType.includes(q.type)
            ) {
                return false
            }

            // lọc độ khó
            if (
                filters.difficult &&
                filters.difficult.length > 0 &&
                !filters.difficult.includes(q.difficult)
            ) {
                return false
            }

            // lọc nội dung
            if (filters.content) {
                const content = q.content?.toLowerCase() || ''
                if (!content.includes(filters.content.toLowerCase())) {
                    return false
                }
            }

            // lọc giải thích
            if (filters.explanation) {
                const explanation = q.explanation?.toLowerCase() || ''
                if (!explanation.includes(filters.explanation.toLowerCase())) {
                    return false
                }
            }

            return true
        })
    }, [questions, filters])

    const pagedQuestions = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filteredQuestions.slice(start, start + pageSize)
    }, [filteredQuestions, currentPage, pageSize])

    const { isOpen, onClose, input } = useDisclosure<WordImportModalInput>({
        tag: 'WordImportModal',
        onClose: () => {
            questions.forEach((q) => {
                ;[...(q.contentImagesRaw || []), ...(q.explanationImagesRaw || [])].forEach(
                    (img) => {
                        if (img.blobUrl) {
                            URL.revokeObjectURL(img.blobUrl)
                        }
                    }
                )
            })

            setQuestions([])
            setSelectedRowKeys([])
        },
    })

    const questionBankId = input?.questionBankId

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
    })

    const cleanQuestionText = (text: string) => text

    const extractTextAndImagesFromCell = (cell: any, zip: PizZip, relMap: Map<string, string>) => {
        const paragraphs = Array.isArray(cell?.['w:p']) ? cell['w:p'] : [cell?.['w:p']]
        let rawText = ''
        const images: { name: string; blob: Blob }[] = []
        let imgIndex = 1

        for (const p of paragraphs) {
            const runs = Array.isArray(p?.['w:r']) ? p['w:r'] : [p?.['w:r']]
            let paragraphText = ''

            for (const r of runs) {
                let value = ''
                const t = r?.['w:t']

                if (typeof t === 'string') value = t
                else if (typeof t === 'object' && t?.['#text']) value = t['#text']

                if (value) {
                    const isOption = /^([A-D])\.\s*/i.test(value)

                    if (isOption && paragraphText.trim().length > 0) {
                        paragraphText += '\n'
                    } else if (
                        paragraphText.length > 0 &&
                        !paragraphText.endsWith(' ') &&
                        !/^[.,!?;:]/.test(value)
                    ) {
                        paragraphText += ' '
                    }

                    paragraphText += value
                }

                if (r?.['w:br']) {
                    paragraphText += '\n'
                }

                const drawing = r?.['w:drawing']
                const blip =
                    drawing?.['wp:inline']?.['a:graphic']?.['a:graphicData']?.['pic:pic']?.[
                        'pic:blipFill'
                    ]?.['a:blip']

                const relId = blip?.['@_r:embed']
                if (relId) {
                    const imagePath = `word/${relMap.get(relId)}`
                    const file = zip.file(imagePath)
                    if (file) {
                        const blob = new Blob([file.asArrayBuffer()], { type: 'image/png' })
                        const placeholder = `{img_${imgIndex}}`
                        paragraphText += placeholder
                        images.push({ name: placeholder, blob })
                        imgIndex++
                    }
                }
            }

            rawText += `${paragraphText.trim()}\n`
        }

        return { text: rawText, images }
    }

    const extractPointFromCell = (
        cell: any,
        zip: PizZip,
        relMap: Map<string, string>
    ): { value?: number } => {
        if (!cell) return {}

        const { text } = extractTextAndImagesFromCell(cell, zip, relMap)
        if (!text) return {}

        const normalized = text.replace(/\s+/g, '').replace(',', '.')

        const match = normalized.match(/\d+(\.\d+)?/)

        if (!match) return {}

        const value = Number(match[0])
        if (Number.isNaN(value)) return {}

        return { value }
    }

    const uploadImagesAndReplacePlaceholders = async (
        rawText: string,
        images: { name: string; blob: Blob }[]
    ): Promise<string> => {
        let result = rawText

        for (const img of images) {
            try {
                const extension = 'png'
                const resPresignedUrl = await generatePresignedUrl({
                    path: 'question-images',
                    extension,
                })

                await fetch(resPresignedUrl.data.url, {
                    method: 'PUT',
                    body: img.blob,
                })

                const imageUrl = `${env.NEXT_PUBLIC_MINIO_ENDPOINT}/${resPresignedUrl.data.fileName}`
                result = result.replace(
                    img.name,
                    `<img src="${imageUrl}" style="max-width: 100%;" />`
                )
            } catch (error) {
                console.error(`Failed to upload image ${img.name}:`, error)
            }
        }

        return result.replace(/\n/g, '<br />')
    }

    const rowSelection = {
        selectedRowKeys,
        preserveSelectedRowKeys: true,

        onSelect: (record: any, selected: boolean) => {
            const key = record.key

            if (selected) {
                setSelectedRowKeys((prev) => {
                    if (prev.includes(key)) return prev
                    return [...prev, key]
                })
            } else {
                setIsAllSelected(false)
                setSelectedRowKeys((prev) => prev.filter((k) => k !== key))
            }
        },

        onChange: (_keys: any, _rows: any, info: any) => {
            if (info?.type !== 'all') return

            if (isAllSelected) {
                setSelectedRowKeys([])
                setIsAllSelected(false)
                return
            }

            setSelectedRowKeys(questions.map((q) => q.key))
            setIsAllSelected(true)
        },
    }

    const handleImport = async (file: File) => {
        setLoading(true)
        try {
            const arrayBuffer = await file.arrayBuffer()
            const zip = new PizZip(arrayBuffer)

            const documentXml = zip.file('word/document.xml')?.asText()
            const relsXml = zip.file('word/_rels/document.xml.rels')?.asText()

            if (!documentXml) {
                message.error('Không đọc được nội dung Word')
                return
            }

            const doc = parser.parse(documentXml)
            const rels = relsXml ? parser.parse(relsXml)?.Relationships?.Relationship || [] : []

            // ===== MAP IMAGE REL =====
            const relMap = new Map<string, string>()
            ;(Array.isArray(rels) ? rels : [rels]).forEach((rel) => {
                if (rel['@_Type']?.includes('image')) {
                    relMap.set(rel['@_Id'], rel['@_Target'])
                }
            })

            const body = doc['w:document']?.['w:body']
            const tables = Array.isArray(body?.['w:tbl'])
                ? body['w:tbl']
                : body?.['w:tbl']
                  ? [body['w:tbl']]
                  : []

            if (tables.length === 0) {
                message.error('File Word không có bảng câu hỏi')
                return
            }

            message.info('Đang đọc bảng Word...')

            const extractedQuestions: any[] = []

            for (const tbl of tables) {
                const rows = Array.isArray(tbl['w:tr']) ? tbl['w:tr'] : [tbl['w:tr']]

                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i]
                    const cells = Array.isArray(row['w:tc']) ? row['w:tc'] : []

                    if (cells.length < 5) continue

                    // ===== CỘT 1: CÂU HỎI =====
                    const questionCell = extractTextAndImagesFromCell(cells[0], zip, relMap)
                    const rawQuestionText = questionCell.text

                    if (!rawQuestionText?.trim()) continue

                    // ===== CỘT 2: ĐÁP ÁN =====
                    const answerCell = extractTextAndImagesFromCell(cells[1], zip, relMap)
                    const answerTextRaw = answerCell.text

                    // ===== CỘT 3 + 4 =====
                    const typeText = extractTextAndImagesFromCell(cells[2], zip, relMap).text
                    const difficultText = extractTextAndImagesFromCell(cells[3], zip, relMap).text

                    const type = typeText.trim() as QuestionType
                    const difficult = difficultText.trim() as Difficult

                    const point = extractPointFromCell(cells[4], zip, relMap)
                    const question: any = {
                        type,
                        difficult,
                        contentImagesRaw: questionCell.images,
                        explanationImagesRaw: answerCell.images,
                        ...(point.value !== undefined ? { point: point.value } : {}),
                    }

                    // ===== XỬ LÝ THEO TYPE =====
                    if (
                        type === QuestionType.SINGLE_CHOICE ||
                        type === QuestionType.MULTIPLE_CHOICE
                    ) {
                        question.content = rawQuestionText

                        question.optionsRaw = rawQuestionText
                            .split('\n')
                            .map((l) => l.trim())
                            .filter((l) => /^[A-D]\.\s*/i.test(l))
                            .map((line) => {
                                const match = line.match(/^([A-D])\.\s*(.+)$/i)
                                return {
                                    label: match?.[1],
                                    content: match?.[2] || '',
                                    isCorrect: false,
                                }
                            })

                        // === xử lý đáp án từ cột 2 ===
                        const answerLines = answerTextRaw
                            .split(/\n|<br\s*\/?>/i)
                            .map((l) => l.trim())
                            .filter(Boolean)

                        if (type === QuestionType.SINGLE_CHOICE) {
                            const correct = answerLines[0]?.match(/^([A-D])\./i)?.[1]
                            question.optionsRaw.forEach((o: any) => {
                                o.isCorrect = o.label === correct
                            })
                        }

                        if (type === QuestionType.MULTIPLE_CHOICE) {
                            const correctLabels = answerLines
                                .map((l) => l.match(/^([A-D])\./i)?.[1])
                                .filter(Boolean)

                            question.optionsRaw.forEach((o: any) => {
                                o.isCorrect = correctLabels.includes(o.label)
                            })
                        }
                        question.explanation = answerTextRaw
                    } else {
                        // ESSAY / ORAL / FILL / ORDERING
                        question.content = cleanQuestionText(rawQuestionText)
                        question.explanation = answerTextRaw

                        if (type === QuestionType.FILL_IN_BLANK || type === QuestionType.ORDERING) {
                            question.answer = answerTextRaw
                        }
                    }

                    extractedQuestions.push(question)
                }
            }

            const questionsWithKey = extractedQuestions.map((q, index) => ({
                ...q,
                key: index.toString(),
            }))

            console.table(
                questionsWithKey.map((q) => ({
                    content: q.content?.slice(0, 30),
                    point: q.point,
                }))
            )

            setQuestions(questionsWithKey)
            setSelectedRowKeys(questionsWithKey.map((q) => q.key))

            message.success(`Đã import ${extractedQuestions.length} câu hỏi`)
        } catch (error) {
            console.error(error)
            message.error('Có lỗi xảy ra khi đọc file Word')
        } finally {
            setLoading(false)
        }
        console.log('questions:', questions)
    }

    const renderContentWithImagePlaceholders = (text: string, images: any[]) => {
        if (!images || images.length === 0) return text

        let result = text
        images.forEach((img) => {
            const blobUrl = URL.createObjectURL(img.blob)
            result = result.replace(img.name, `<img src="${blobUrl}" style="max-width: 100%;" />`)
        })
        return result.replace(/\n/g, '<br />')
    }

    const columns = [
        {
            title: 'Câu hỏi',
            dataIndex: 'content',
            width: 350,
            type: 'input',
            render: (text: string, record: any) => {
                let html = text

                html = renderContentWithImagePlaceholders(html, record.contentImagesRaw || [])

                return (
                    <div
                        dangerouslySetInnerHTML={{
                            __html: html,
                        }}
                    />
                )
            },
        },

        {
            title: 'Loại câu hỏi',
            dataIndex: 'type',
            width: 120,
            key: 'type',
            type: 'select',
            render: (value: string) => {
                const key = value as QuestionType
                return QUESTION_TYPE_LABELS[key] ?? value
            },
            align: 'center' as const,
        },
        {
            title: 'Độ khó',
            dataIndex: 'difficult',
            width: 120,
            key: 'difficult',
            render: (value: Difficult) => DIFFICULT_LABELS[value] ?? value,
            align: 'center' as const,
        },
        {
            title: 'Đáp án',
            dataIndex: 'explanation',
            width: 320,
            render: (_: any, record: any) => {
                let html = record.explanation || '—'

                html = renderContentWithImagePlaceholders(html, record.explanationImagesRaw || [])
                return (
                    <div
                        style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                        dangerouslySetInnerHTML={{
                            __html: html,
                        }}
                    />
                )
            },
        },

        {
            title: 'Điểm',
            dataIndex: 'point',
            width: 80,
            key: 'point',
            align: 'center' as const,
            render: (value?: number) => (value !== undefined ? value : '—'),
        },
    ]

    const { mutateAsync: createQuestion } = useCreateQuestion()
    const { data: knowledgeBlockData } = useFindManyKnowledgeBlock({
        where: {
            deletedAt: null,
            examMatrix: {
                examFramework: {
                    subjectVersionId: input?.subjectVersionId,
                },
            },
        },
    })

    const onOk = async () => {
        try {
            const { knowledgeBlockId } = await form.validateFields()
            if (storageType === 'khung' && !knowledgeBlockId) {
                message.error('Bạn phải chọn Chuẩn đầu ra khi lưu tại khung')
                return
            }

            if (!questionBankId) {
                message.error('Bạn phải chọn Ngân hàng câu hỏi (Question Bank)!')
                return
            }
            // console.log('storageType:', storageType)
            // console.log('selectedKnowledgeBlockId:', selectedKnowledgeBlockId)

            showSpinner()
            const selectedQuestions = questions.filter((q) => selectedRowKeys.includes(q.key))

            for (const q of selectedQuestions) {
                const content = await uploadImagesAndReplacePlaceholders(
                    q.content,
                    q.contentImagesRaw || []
                )
                const explanation = await uploadImagesAndReplacePlaceholders(
                    q.explanation,
                    q.explanationImagesRaw || []
                )

                const payload: any = {
                    content,
                    explanation,
                    type: q.type,
                    difficult: q.difficult,
                    point: q.point,
                    isAutoGraded: false,
                    questionBankId,
                    ...(storageType === 'khung' ? { knowledgeBlockId: knowledgeBlockId } : {}),
                }

                if (
                    (q.type === QuestionType.SINGLE_CHOICE ||
                        q.type === QuestionType.MULTIPLE_CHOICE) &&
                    q.optionsRaw?.length > 0
                ) {
                    payload.multipleChoiceOptions = {
                        create: q.optionsRaw.map((opt: any, index: number) => ({
                            content: `${opt.label}. ${opt.content}`,
                            isCorrect: opt.isCorrect,
                            order: index + 1,
                        })),
                    }
                }

                if (q.type === QuestionType.ORDERING && q.optionsRaw?.length > 0) {
                    // Parse thứ tự đúng từ answer (VD: "Thứ tự đúng là A → B → C" hoặc "A → B → C")
                    const orderMatch = q.answer?.match(
                        /([A-D])\s*(?:→|->)\s*([A-D])(?:\s*(?:→|->)\s*([A-D]))?(?:\s*(?:→|->)\s*([A-D]))?/
                    )

                    if (orderMatch) {
                        // Lấy các label theo thứ tự đúng (A, B, C, D)
                        const correctSequence = orderMatch.slice(1).filter(Boolean) as string[]

                        // Tạo map từ label -> correctOrder
                        const orderMap = new Map<string, number>()
                        correctSequence.forEach((label: string, idx: number) => {
                            orderMap.set(label, idx + 1)
                        })

                        payload.orderingItems = {
                            create: q.optionsRaw.map((opt: any) => ({
                                content: `${opt.label}. ${opt.content}`,
                                correctOrder: orderMap.get(opt.label) ?? q.optionsRaw.length + 1,
                            })),
                        }
                    }

                    if (q.type === QuestionType.FILL_IN_BLANK) {
                        /**
                         * Ví dụ answer:
                         * 1: Paris
                         * 2: France
                         */
                        const slotMatches =
                            q.answer
                                ?.split(/[\n;]/)
                                .map((line: string) => {
                                    const match = line.match(/(\d+)\s*[:=]\s*(.+)/)
                                    if (!match) return null
                                    return {
                                        order: Number(match[1]),
                                        correctAnswer: match[2].trim(),
                                    }
                                })
                                .filter(Boolean) || []

                        if (slotMatches.length > 0) {
                            payload.fillInBlankSlots = {
                                create: slotMatches.map((slot: any) => ({
                                    order: slot.order,
                                    correctAnswer: slot.correctAnswer,
                                })),
                            }
                        }
                    }

                    if (q.type === QuestionType.ESSAY || q.type === QuestionType.ORAL) {
                    }

                    // if (q.type === QuestionType.TRUE_FALSE) {
                    //   payload.multipleChoiceOptions = {
                    //     create: [
                    //       {
                    //         content: "A. Đúng",
                    //         isCorrect: q.answer === "TRUE",
                    //         order: 1,
                    //       },
                    //       {
                    //         content: "B. Sai",
                    //         isCorrect: q.answer === "FALSE",
                    //         order: 2,
                    //       },
                    //     ],
                    //   };
                    // }
                }

                await createQuestion({ data: payload })
            }

            message.success('Import câu hỏi thành công')
            onClose()
            setQuestions([])
            setSelectedRowKeys([])
        } catch (error) {
            console.error(error)
            message.error('Lưu câu hỏi thất bại. Vui lòng kiểm tra lại.')
        } finally {
            hideSpinner()
        }
    }

    return (
        <Modal
            title="Import câu hỏi từ Word"
            open={isOpen}
            width="90vw"
            onCancel={onClose}
            style={{ top: 20, maxHeight: '90vh', overflowY: 'auto' }}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Đóng
                </Button>,

                <Button
                    key="submit"
                    type="primary"
                    disabled={selectedRowKeys.length === 0}
                    onClick={onOk}
                >
                    Lưu Câu Hỏi
                </Button>,
            ]}
        >
            <Form form={form} layout="vertical">
                <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
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
                        id="word-import-input"
                    />
                    <Col>
                        <Button
                            icon={<UploadOutlined />}
                            onClick={() => document.getElementById('word-import-input')?.click()}
                        >
                            Chọn File Word
                        </Button>
                    </Col>
                    <Col span={24}>
                        <div className="mt-2 mb-4">
                            <div className="text-sm font-medium mb-2">Vị trí lưu trữ</div>
                            <Radio.Group
                                value={storageType}
                                onChange={(e) => {
                                    const value = e.target.value
                                    setStorageType(value)

                                    if (value !== 'khung') {
                                        form.resetFields(['knowledgeBlockId'])
                                    }
                                }}
                            >
                                <Radio value="khung">Lưu tại khung</Radio>
                                <Radio value="kho">Lưu tại kho</Radio>
                            </Radio.Group>
                        </div>
                    </Col>

                    {storageType === 'khung' && (
                        <Col span={24}>
                            <Col span={8}>
                                <FormItem
                                    form={form}
                                    name="knowledgeBlockId"
                                    label="Chuẩn đầu ra"
                                    layout="vertical"
                                    required
                                >
                                    <Select
                                        maxTagCount={'responsive'}
                                        placeholder="Chọn chuẩn đầu ra"
                                        options={knowledgeBlockData?.map(({ id, name }) => ({
                                            value: id,
                                            label: name,
                                        }))}
                                    />
                                </FormItem>
                            </Col>
                        </Col>
                    )}
                </Row>
            </Form>

            {loading && <div style={{ margin: '16px 0' }}>Đang đọc file...</div>}

            {questions.length > 0 && (
                <div style={{ marginTop: 16 }}>
                    <Table
                        rowKey="key"
                        filters={filters}
                        setFilters={(value) => {
                            setFilters(value)
                            setCurrentPage(1)
                        }}
                        columns={columns}
                        dataSource={pagedQuestions}
                        rowSelection={rowSelection}
                        scroll={{
                            x: '100%',
                            y: 'calc(70vh - 130px)',
                        }}
                        sticky={{
                            offsetHeader: 0,
                        }}
                        style={{
                            maxHeight: '70vh',
                        }}
                        pagination={{
                            position: ['bottomRight'],
                            current: currentPage,
                            pageSize,
                            total: filteredQuestions.length,
                            onChange: (page, size) => {
                                setCurrentPage(page)
                                setPageSize(size)
                            },
                            showSizeChanger: true,
                            showTotal: (total, range) =>
                                `${range[0]} - ${range[1]} trong tổng số ${total} bản ghi`,
                        }}
                    />
                </div>
            )}
        </Modal>
    )
}

export default WordImportModal
