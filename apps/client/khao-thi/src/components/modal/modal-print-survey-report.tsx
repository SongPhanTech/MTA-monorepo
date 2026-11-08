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

function QuestionStatisticsTable({
  questions,
  isSpecial,
}: {
  questions: any[]
  isSpecial: boolean
}) {
  const specialChoices =
    questions.find((question) => question.specificChoice?.length)?.specificChoice || []
  const answerHeaders = isSpecial ? specialChoices : questions[0]?.answers || []

  if (!questions.length || !answerHeaders.length) return null

  return (
    <table
      className="mt-4 text-sm border-collapse border border-black text-center"
      style={{ tableLayout: "fixed", width: "100%" }}
    >
      <thead>
        <tr className="font-bold text-center border border-black">
          <th className="border border-black text-center" style={{ width: 60 }}>
            STT
          </th>
          <th className="border border-black text-center" style={{ width: 120 }}>
            Câu hỏi
          </th>
          {answerHeaders.map((answer: any, index: number) => (
            <th
              className="border border-black text-center"
              key={answer.id || answer.answer || index}
            >
              {answer.description || answer.answer}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {questions.map((question: any, index: number) => {
          const percentages = calculatePercent(question.answers || [])

          return (
            <tr key={question.id}>
              <td className="text-center border border-black">{index + 1}</td>
              <td className="text-center border border-black">
                {`Câu ${question.questionNumber || index + 1}`}
                {isSpecial && (
                  <span className="special-star" style={{ color: "#FF0000", fontWeight: 700 }}>
                    {" "}
                    *
                  </span>
                )}
              </td>
              {answerHeaders.map((header: any, answerIndex: number) => {
                const answer =
                  percentages.find((item: any) => String(item.answer) === String(header.answer)) ||
                  percentages[answerIndex]

                return (
                  <td
                    className="text-center border border-black"
                    key={header.id || header.answer || answerIndex}
                  >
                    {answer ? `${answer.percent}% (${answer.count}/${answer.total})` : "0% (0/0)"}
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
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

            .special-star {
                color: #FF0000 !important;
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
  const normalQuestions = dataTable.filter((question: any) => !question.specificChoice?.length)
  const specialQuestions = dataTable.filter((question: any) => question.specificChoice?.length)

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

        {normalQuestions.length > 0 && (
          <>
            <div className="font-bold mt-4">BẢNG 1. CÂU HỎI TRẮC NGHIỆM THƯỜNG</div>
            <QuestionStatisticsTable questions={normalQuestions} isSpecial={false} />
          </>
        )}

        {specialQuestions.length > 0 && (
          <>
            <div className="font-bold mt-6">BẢNG 2. CÂU HỎI TRẮC NGHIỆM ĐẶC BIỆT</div>
            <QuestionStatisticsTable questions={specialQuestions} isSpecial />
          </>
        )}

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
