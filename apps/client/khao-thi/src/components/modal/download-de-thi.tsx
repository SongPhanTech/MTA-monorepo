import { Modal, Button, Flex, Input } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useState, useRef, useEffect } from 'react'
import { useReactToPrint } from 'react-to-print'
import { useFindUniqueExamBank, useUpdateExamBank } from '@workspace/db/hooks'
import { renderWithMath } from '@components/commons/rich-text-editor/renderWithMath'
import { queryClient } from '@api/index'
import { getMinioUrl } from '@workspace/libs/utils'
import { TemplateHandler } from 'easy-template-x'
import { convertHtmlBreaks, saveFile } from '@/utils/saveFile'

const PrintExamBank = () => {
    const [name, setName] = useState('Nguyễn Văn A')
    const [duration, setDuration] = useState('')
    const [isExporting, setIsExporting] = useState(false)
    const { isOpen, onClose, input } = useDisclosure<{
        id: string
    }>({
        tag: 'PrintExamBank',
    })

    const [hasDownloaded, setHasDownloaded] = useState(false)
    const printRef = useRef<HTMLDivElement>(null)

    const { data } = useFindUniqueExamBank(
        {
            where: {
                id: input?.id,
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
                        id: true,
                        name: true,
                    },
                },
                examMatrix: {
                    include: {
                        examFramework: {
                            select: {
                                time: true,
                            },
                        },
                    },
                },
            },
        },
        {
            enabled: !!input?.id,
        }
    )

    const subjectClassName = data?.subjectClass?.name || ''

    // Tự động fill thời gian từ examFramework
    useEffect(() => {
        if (data?.examMatrix?.examFramework?.time) {
            setDuration(String(data.examMatrix.examFramework.time))
        }
    }, [data?.examMatrix?.examFramework?.time])

    const { mutateAsync: updateExamBank } = useUpdateExamBank()

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `De-Thi-${data?.exam?.subjectVersion?.name || 'Exam'}`,
    })

    const allowMaterials = true

    const currentDate = new Date()
    const day = currentDate.getDate()
    const month = currentDate.getMonth() + 1
    const year = currentDate.getFullYear()

    const handleDownload = async () => {
        if (!data) return
        const res = await fetch(getMinioUrl('mta/template/template-de-thi.docx'))
        const templateFile = await res.blob()

        const templateData = {
            examCode: data.examCode || '',
            subjectName: data.exam?.subjectVersion?.name || '',
            semesterName: data.exam?.semester?.name || '',
            className: data.subjectClass?.name || '',
            duration: String(duration || data.examMatrix?.examFramework?.time || data.exam?.duration || ''),
            day: String(day),
            month: String(month),
            year: String(year),
            teacherName: name,
            questions:
                data.questions?.map((q, index) => ({
                    order: String(q?.order || index + 1),
                    point: Number(q?.question?.point || 0).toFixed(1),
                    content: convertHtmlBreaks(q?.question?.content) || '',
                })) || [],
        }

        const handler = new TemplateHandler()
        const doc = await handler.process(templateFile, templateData)
        saveFile(`De-Thi-${data?.exam?.subjectVersion?.name}.docx`, doc)
    }

    const handleClose = async () => {
        if (hasDownloaded) {
            await updateExamBank({
                where: { id: input?.id },
                data: { isLock: true },
            })
        }
        setHasDownloaded(false)
        queryClient.invalidateQueries({
            queryKey: ['ExamBank'],
        })
        onClose()
    }

    return (
        <Modal
            title={
                <div className="flex items-center gap-4">
                    <span>Xem trước đề thi</span>
                    <div className="flex-1 flex items-center justify-center gap-4">
                        <Input
                            placeholder="Nhập tên"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-56"
                        />
                        <Input
                            placeholder="Nhập thời gian thi"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
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
                    <Button type="primary" onClick={handleDownload} loading={isExporting}>
                        {isExporting ? 'Đang xuất...' : 'Tải xuống'}
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
                <div
                    ref={printRef}
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
                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                BAN KHẢO THÍ & ĐBCLGD-ĐT
                            </div>
                            <div style={{ fontWeight: 'bold' }}>{data?.exam?.semester?.name}</div>
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
                            (Dùng cho lớp: {subjectClassName})
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
                                        <strong>Đề thi số: {data?.examCode}</strong>
                                    </div>
                                    <div style={{ textAlign: 'center', marginBottom: '5px' }}>
                                        <strong>
                                            Học phần: {data?.exam?.subjectVersion?.name}
                                        </strong>
                                    </div>
                                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                                        <strong>
                                            Thời gian làm bài:{' '}
                                            {duration ||
                                                data?.examMatrix?.examFramework?.time ||
                                                data?.exam?.duration}{' '}
                                            phút
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
                        {data?.questions?.map((q, index: number) => (
                            <div key={q?.id} style={{ marginBottom: '15px' }}>
                                <div>
                                    <strong>
                                        Câu {q?.order || index + 1}(
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
            </div>
        </Modal>
    )
}

export default PrintExamBank
