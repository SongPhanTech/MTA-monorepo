import { PrinterOutlined } from '@ant-design/icons'
import { Button, Modal } from 'antd'
import dayjs from 'dayjs'
import { useRef } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import { useReactToPrint } from 'react-to-print'
import ReactECharts from 'echarts-for-react'

dayjs.locale('vi')

const calcPercent = (answers: any[]) => {
    const total = answers.reduce((s, i) => s + i.count, 0)
    return answers.map((i) => ({
        ...i,
        total,
        percent: total === 0 ? 0 : Number(((i.count / total) * 100).toFixed(2)),
    }))
}

const buildAverageRow = (questions: any[]) => {
    if (!questions?.length) return null

    const base = questions[0].answers.map((a: any) => ({
        ...a,
        count: 0,
        total: 0,
    }))

    questions.forEach((q: any) => {
        q.answers.forEach((a: any, idx: number) => {
            base[idx].count += a.count
            base[idx].total += a.total
        })
    })

    return {
        id: 'DGTB',
        name: 'Trung bình chung',
        answers: base,
    }
}

const ModalPrintSurveyOrganization = () => {
    const printRef = useRef<HTMLDivElement>(null)

    const { isOpen, onClose, input } = useDisclosure<{
        surveyName?: string
        organizationName?: string
        questions: any[]
        chartOption: any
        organizationCode?: string
        trainingObjectTypeName?: string
    }>({
        tag: 'ModalPrintSurveyOrganization',
    })

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        pageStyle: `
        @page { size: A4; margin: 1.5cm; }

        @media print {
            * {
                color: #000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .echarts-for-react text {
                fill: #000 !important;
            }

            body {
                font-family: "Times New Roman";
                font-size: 13px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                page-break-after: auto;
                border: 2px solid #000;
            }

            thead {
                display: table-header-group;
            }

            thead th {
                background-color: #eaeaea;
                font-weight: bold;
                text-align: center;
            }

            tr.avg-row td {
                 font-weight: bold;
            }

            th, td {
                border: 2px solid #000;
                padding: 6px 6px;
                vertical-align: middle;
            }

            tr {
                page-break-inside: avoid;
            }
        }
    `,
    })

    if (!input) return null

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={1100}
            title={
                <div className="flex justify-between items-center mr-6">
                    <span>In báo cáo khảo sát</span>
                    <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
                        In
                    </Button>
                </div>
            }
        >
            <div ref={printRef}>
                {/* ===== HEADER ===== */}
                <div className="flex justify-between text-center font-bold">
                    <div className="w-[45%]">
                        <div className="uppercase">HỌC VIỆN KỸ THUẬT QUÂN SỰ</div>
                        <div className="uppercase underline">PHÒNG KT & ĐBCLGD-ĐT</div>
                    </div>
                    <div className="w-[45%]">
                        <div className="uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                        <div className="underline font-normal">Độc lập - Tự do - Hạnh phúc</div>
                    </div>
                </div>

                {/* ===== TITLE ===== */}
                <div className="text-center mt-6 font-bold uppercase">
                    <div className="text-lg">TỔNG HỢP PHIẾU LẤY Ý KIẾN NGƯỜI HỌC</div>
                    <div className="text-lg mt-1">VỀ HOẠT ĐỘNG GIẢNG DẠY</div>
                    <div className="text-sm font-normal mt-1">
                        {['HĐGD của GV', input.surveyName, `Hệ ${input.trainingObjectTypeName}`]
                            .filter(Boolean)
                            .join(', ')}
                    </div>

                    {/* ===== FACULTY INFO ===== */}
                    <div className="mt-4 text-sm text-left">
                        <div className="flex justify-between">
                            <div>
                                <span className="font-bold">I.</span>{' '}
                                {input.organizationName && `Khoa: Khoa ${input.organizationName}`}
                            </div>

                            <div>
                                {input.organizationCode && `Mã khoa: ${input.organizationCode}`}
                            </div>
                        </div>

                        <div className="mt-2">
                            <span className="font-bold">A.</span> Kết quả đánh giá theo{' '}
                            {input.questions?.length || 0} tiêu chí:
                        </div>
                    </div>
                </div>

                {/* ===== CHART ===== */}
                <div className="mt-6">
                    <ReactECharts
                        option={input.chartOption}
                        className="echarts-for-react"
                        style={{
                            height: Math.max(350, input.questions.length * 30 + 150),
                        }}
                    />
                </div>

                {/* ===== TABLE ===== */}
                <table className="mt-6 text-sm" style={{ tableLayout: 'fixed', width: '100%' }}>
                    <thead>
                        <tr className="font-bold text-center">
                            <th style={{ width: 50 }}>STT</th>
                            <th style={{ width: 90 }}>Câu hỏi</th>
                            {input.questions[0]?.answers.map((a: any) => (
                                <th key={a.id}>{a.description}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[...input.questions, buildAverageRow(input.questions)]
                            .filter(Boolean)
                            .map((q: any, index: number) => {
                                const percent = calcPercent(q.answers)
                                const isAvg = q.id === 'DGTB'

                                return (
                                    <tr key={q.id} className={isAvg ? 'avg-row' : ''}>
                                        <td className="text-center">
                                            {isAvg ? 'ĐGTB' : index + 1}
                                        </td>
                                        <td className="text-center">
                                            {isAvg ? '' : `Câu ${index + 1}`}
                                        </td>
                                        {percent.map((p: any) => (
                                            <td key={p.id} className="text-center">
                                                {p.percent}% ({p.count}/{p.total})
                                            </td>
                                        ))}
                                    </tr>
                                )
                            })}
                    </tbody>
                </table>

                {/* ===== FOOTER ===== */}
                <div className="mt-3 text-sm italic">
                    Ghi chú: Các mức tính theo tỷ lệ % người học đánh giá.
                </div>

                <div className="mt-6 text-right italic">
                    Hà Nội, ngày {dayjs().format('DD')} tháng {dayjs().format('MM')} năm{' '}
                    {dayjs().format('YYYY')}
                </div>

                <div className=" flex text-lg justify-end">
                    <div className="text-center font-bold">TRƯỞNG PHÒNG</div>
                </div>
            </div>
        </Modal>
    )
}

export default ModalPrintSurveyOrganization
