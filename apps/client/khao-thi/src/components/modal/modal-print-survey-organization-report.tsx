import { formatThangIn } from "@workspace/libs/timezone"
import { PrinterOutlined } from "@ant-design/icons"
import { Button, Modal } from "antd"
import dayjs from "dayjs"
import ReactECharts from "echarts-for-react"
import { useRef } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"
import { buildReportTitleSemester } from "@/utils/export-survey-docx-template"

dayjs.locale("vi")

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
    id: "DGTB",
    name: "Trung bình chung",
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
    semesterName?: string
    schoolYearName?: string
    trainingSystemName?: string
    departmentName?: string
    departmentCode?: string
  }>({
    tag: "ModalPrintSurveyOrganization",
  })

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "HỌC VIỆN KĨ QUÂN SỰ",
    pageStyle: `
        @page { size: A4; margin: 1.5cm; }

        @media print {
            * {
                color: #000 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .special-star {
                color: #FF0000 !important;
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
                border: 1px solid #000;
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
  const hasDepartment = !!input.departmentName

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
            <div className="uppercase underline">BAN KHẢO THÍ VÀ ĐBCLGD - ĐT</div>
          </div>
          <div className="w-[45%]">
            <div className="uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div className="underline font-normal">Độc lập - Tự do - Hạnh phúc</div>
          </div>
        </div>

        {/* ===== TITLE ===== */}
        <div className="text-center mt-6  ">
          <div className="text-lg font-bold uppercase">TỔNG HỢP PHIẾU LẤY Ý KIẾN NGƯỜI HỌC</div>
          <div className="text-lg mt-1 font-bold uppercase">
            VỀ HOẠT ĐỘNG GIẢNG DẠY CỦA GIẢNG VIÊN
          </div>
          <div className="text-sm mt-1 font-bold uppercase">
            {buildReportTitleSemester({
              semesterName: input.semesterName,
              schoolYearName: input.schoolYearName,
              trainingSystemName: input.trainingSystemName,
              trainingObjectTypeName: input.trainingObjectTypeName,
              surveyName: input.surveyName,
            }) || (
              <>
                <span>HĐGD của GV, </span>
                <span>{input.surveyName}</span>
                <span> - {input.trainingObjectTypeName}</span>
              </>
            )}
          </div>

          {/* ===== FACULTY INFO ===== */}
          <div className="mt-4 text-sm leading-6 text-left">
            {hasDepartment && (
              <div className="flex justify-between">
                <div>
                  <b>1. Bộ môn:</b> {input.departmentName}
                </div>
                <div>
                  <b>Mã bộ môn:</b> {input.departmentCode}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <div>
                {hasDepartment ? "2." : "1."} Khoa (Viện): {input.organizationName}
              </div>
              <div>Mã khoa (Viện): {input.organizationCode}</div>
            </div>

            <div className="mt-2">
              A. Kết quả đánh giá theo {input.questions?.length || 0} tiêu chí:
            </div>
          </div>
        </div>

        {/* ===== TABLE ===== */}
        <table
          className="mt-6 text-sm border-collapse"
          style={{ tableLayout: "fixed", width: "100%" }}
        >
          <thead>
            <tr className="font-bold text-center">
              <th className="border border-black" style={{ width: 50 }}>
                STT
              </th>
              <th className="border border-black" style={{ width: 90 }}>
                Câu hỏi
              </th>
              {input.questions[0]?.answers.map((a: any) => (
                <th key={a.id} className="border border-black">
                  {a.description}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...input.questions, buildAverageRow(input.questions)]
              .filter(Boolean)
              .map((q: any, index: number) => {
                const percent = calcPercent(q.answers)
                const isAvg = q.id === "DGTB"
                const isSpecial = !isAvg && q.specificChoice?.length > 0

                return (
                  <tr key={q.id} className={isAvg ? "avg-row" : ""}>
                    <td className="text-center border border-black">
                      {isAvg ? "ĐGTB" : index + 1}
                    </td>
                    <td className="text-center border border-black">
                      {isAvg ? (
                        ""
                      ) : (
                        <>
                          {`Câu ${index + 1}`}
                          {isSpecial && (
                            <span
                              className="special-star"
                              style={{ color: "#FF0000", fontWeight: 700 }}
                            >
                              {" "}
                              *
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    {percent.map((p: any, answerIndex: number) => {
                      const special =
                        isSpecial &&
                        (q.specificChoice.find((c: any) => String(c.answer) === String(p.answer)) ||
                          q.specificChoice[answerIndex])
                      const specialLabel =
                        special?.description?.trim() || special?.answer?.trim() || ""

                      return (
                        <td key={p.id} className="text-center border border-black">
                          {specialLabel && (
                            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 2 }}>
                              {specialLabel}
                            </div>
                          )}
                          {p.percent}% ({p.count}/{p.total})
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
          </tbody>
        </table>

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

        {/* ===== FOOTER ===== */}
        <div className="mt-3 text-sm italic">
          Ghi chú: Các mức tính theo tỷ lệ % người học đánh giá.
        </div>

        <div className="mt-6 text-right italic">
          Hà Nội, ngày {dayjs().format("DD")} tháng {formatThangIn(dayjs().month() + 1)} năm{" "}
          {dayjs().format("YYYY")}
        </div>

        <div className=" flex text-lg justify-end">
          <div className="text-center font-bold">TRƯỞNG BAN</div>
        </div>
      </div>
    </Modal>
  )
}

export default ModalPrintSurveyOrganization
