import { PrinterOutlined } from "@ant-design/icons"
import { Button, Modal } from "antd"
import dayjs from "dayjs"
import ReactECharts from "echarts-for-react"
import { useRef } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"

dayjs.locale("vi")

const calculatePercent = (items: any[]) => {
  const total = items.reduce((sum, item) => sum + item.count, 0)
  return items.map((item) => ({
    ...item,
    total,
    percent: total === 0 ? 0 : Number(((item.count / total) * 100).toFixed(2)),
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
    id: "average",
    name: "Trung bình",
    answers: base,
  }
}

const ModalPrintSurvey = () => {
  const printRef = useRef<HTMLDivElement>(null)

  const { isOpen, onClose, input } = useDisclosure<{
    surveyName?: string
    questions: any[]
    summaryInfo: any[]
    chartOption: any
  }>({
    tag: "ModalPrintSurvey",
  })

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "BAO_CAO_KHAO_SAT",
    pageStyle: `
            @page { size: A4 landscape; margin: 1.5cm; }

            @media print {

            * {
                color: #000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                }

            body {
                font-family: "Times New Roman" !important;
                font-size: 13px !important;
                color: #000 !important;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                border: 2px solid #000 !important;
            }

            th, td {
                border: 2px solid #000 !important;
                padding: 6px;
                text-align: center;
                vertical-align: middle;
                color: #000 !important;
                font-weight: 500;
            }

            thead {
                display: table-header-group;
            }

            thead th {
                background: #fff !important;
                font-weight: bold !important;
            }

            tr.avg-row td {
                font-weight: bold !important;
            }

            svg text {
                fill: #000 !important;
            }
        }
        `,
  })

  if (!input) return null

  const dataTable = input.questions || []

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={1200}
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
        {/* ===== Theo câu hỏi ===== */}
        <div className="font-bold text-lg text-center mb-4">THỐNG KÊ THEO TỪNG CÂU HỎI</div>

        <table
          className="mt-4 text-sm border-collapse border border-black text-center"
          style={{ tableLayout: "fixed", width: "100%" }}
        >
          <thead>
            <tr className="font-bold text-center border border-black">
              <th className="border border-black text-center" style={{ width: 60 }}>
                STT
              </th>
              <th className="border border-black text-center" style={{ width: 100 }}>
                Câu hỏi
              </th>
              {dataTable[0]?.answers?.map((a: any) => (
                <th className="border border-black text-center" key={a.id}>
                  {a.description}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataTable.map((q: any, index: number) => {
              const percent = calculatePercent(q.answers)

              return (
                <tr key={q.id}>
                  <td className="text-center border border-black">{index + 1}</td>

                  <td className="text-center border border-black">{`Câu ${index + 1}`}</td>

                  {percent.map((p: any) => (
                    <td key={p.id} className="text-center border border-black">
                      {p.percent}% ({p.count}/{p.total})
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* ===== Chart ===== */}
        <div className="mt-6">
          <ReactECharts
            option={input.chartOption}
            style={{
              height: Math.max(400, dataTable.length * 40 + 150),
            }}
          />
        </div>
      </div>
    </Modal>
  )
}

export default ModalPrintSurvey
