import { UploadOutlined } from '@ant-design/icons'
import { Button, Modal, message, Table } from 'antd'
import { XMLParser } from 'fast-xml-parser'
import PizZip from 'pizzip'
import type React from 'react'
import { useState } from 'react'

interface WordImportModalProps {
    visible: boolean
    onCancel: () => void
    onImportSuccess: (questions: any[]) => void
}

const WordImportModal: React.FC<WordImportModalProps> = ({
    visible,
    onCancel,
    onImportSuccess,
}) => {
    const [questions, setQuestions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
    })

    const extractTextFromCell = (cell: any) => {
        const paragraphs = Array.isArray(cell?.['w:p']) ? cell['w:p'] : [cell?.['w:p']]
        let rawText = ''
        let prevEndedWithChar = false

        for (const p of paragraphs) {
            const runs = Array.isArray(p?.['w:r']) ? p['w:r'] : [p?.['w:r']]
            for (const r of runs) {
                const t = r?.['w:t']
                let value = ''
                if (typeof t === 'string') {
                    value = t
                } else if (typeof t === 'object' && t?.['#text']) {
                    value = t['#text']
                }

                if (!value) continue

                const startsWithPunctuation = /^[.,!?;:]/.test(value)
                const endsWithChar = /[a-zA-ZÀ-ỹ0-9]$/.test(value)

                if (rawText && prevEndedWithChar && !startsWithPunctuation) {
                    rawText += ' '
                }

                rawText += value
                prevEndedWithChar = endsWithChar
            }
        }

        const cleanedText = rawText
            .replace(/([.,!?;:])(?=\S)/g, '$1 ')
            .replace(/\s{2,}/g, ' ')
            .trim()

        return cleanedText
    }

    const extractPointFromCell = (cell: any) => {
        const text = extractTextFromCell(cell)
        const match = text.match(/(\d+(?:[.,]\d+)?)\s*(đ|điểm)?/i)
        if (match) {
            return Number.parseFloat(match[1].replace(',', '.'))
        }
        return undefined
    }

    const handleImport = async (file: File) => {
        setLoading(true)
        try {
            const arrayBuffer = await file.arrayBuffer()
            const zip = new PizZip(arrayBuffer)

            const documentXml = zip.file('word/document.xml')?.asText()
            const relsXml = zip.file('word/_rels/document.xml.rels')?.asText()

            const doc = parser.parse(documentXml || '')
            const rels = relsXml ? parser.parse(relsXml)?.Relationships?.Relationship || [] : []

            const relMap = new Map()
            ;(Array.isArray(rels) ? rels : [rels]).forEach((rel) => {
                if (rel['@_Type']?.includes('image')) {
                    relMap.set(rel['@_Id'], rel['@_Target'])
                }
            })

            const body = doc['w:document']['w:body']
            const tables = Array.isArray(body['w:tbl']) ? body['w:tbl'] : [body['w:tbl']]

            const extractedQuestions: any[] = []

            for (const tbl of tables) {
                const rows = Array.isArray(tbl['w:tr']) ? tbl['w:tr'] : [tbl['w:tr']]

                for (let i = 0; i < rows.length - 1; i += 2) {
                    const question: any = {}

                    // Row lẻ (câu hỏi)
                    const contentRow = rows[i]
                    const contentCells = Array.isArray(contentRow['w:tc'])
                        ? contentRow['w:tc']
                        : [contentRow['w:tc']]
                    question.content = extractTextFromCell(contentCells[0])

                    // Row chẵn (giải thích + điểm)
                    const explanationRow = rows[i + 1]
                    const explanationCells = Array.isArray(explanationRow['w:tc'])
                        ? explanationRow['w:tc']
                        : [explanationRow['w:tc']]
                    question.explanation = extractTextFromCell(explanationCells[0])
                    question.point = extractPointFromCell(
                        explanationCells[explanationCells.length - 1]
                    )

                    if (question.content && question.explanation && question.point !== undefined) {
                        extractedQuestions.push(question)
                    }
                }
            }

            console.log('Extracted:', extractedQuestions)
            setQuestions(extractedQuestions)

            message.success(`Đã import thành công ${extractedQuestions.length} câu hỏi`)
        } catch (error) {
            message.error('Có lỗi xảy ra khi đọc file Word')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        {
            title: 'Câu hỏi',
            dataIndex: 'content',
            key: 'content',
        },
        {
            title: 'Giải thích',
            dataIndex: 'explanation',
            key: 'explanation',
        },
        {
            title: 'Điểm',
            dataIndex: 'point',
            key: 'point',
            width: 80,
            align: 'center' as const,
        },
    ]

    const handleCancel = () => {
        onCancel()
        setQuestions([])
    }

    return (
        <Modal
            title="Import Câu Hỏi từ Word"
            open={visible}
            className="w-[80vw]"
            onCancel={handleCancel}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Đóng
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    disabled={questions.length === 0}
                    onClick={() => {
                        onImportSuccess(questions)
                        onCancel()
                        setQuestions([])
                    }}
                >
                    Lưu Câu Hỏi
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
                    // Reset giá trị input để có thể chọn lại cùng file
                    e.target.value = ''
                }}
                style={{ display: 'none' }}
                id="word-import-input"
            />

            <Button
                icon={<UploadOutlined />}
                onClick={() => document.getElementById('word-import-input')?.click()}
            >
                Chọn File Word
            </Button>

            {loading && <div style={{ margin: '16px 0' }}>Đang đọc file...</div>}

            {questions.length > 0 && (
                <div style={{ marginTop: 16 }}>
                    <Table
                        columns={columns}
                        dataSource={questions}
                        rowKey={(record, index) => index?.toString() || ''}
                        pagination={false}
                        scroll={{ x: true }}
                        size="small"
                    />
                </div>
            )}
        </Modal>
    )
}

export default WordImportModal
