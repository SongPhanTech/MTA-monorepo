import { PrinterOutlined } from "@ant-design/icons"
import { Button, Modal } from "antd"
import ReactECharts from "echarts-for-react"
import { useRef } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"

const calculatePercent = (items: any[]) => {
  const total = items.reduce((sum, item) => sum + item.count, 0)
  return items.map((item) => ({
    ...item,
    total,
    percent: total === 0 ? 0 : Number(((item.count / total) * 100).toFixed(2)),
  }))
}

const buildAverageRow = (fields: any[]) => {
  if (!fields?.length) return null

  const base = fields[0].answers.map((a: any) => ({
    ...a,
    count: 0,
    total: 0,
  }))

  fields.forEach((f: any) => {
    f.answers.forEach((a: any, idx: number) => {
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

const ModalPrintSurveyToFieldReport = () => {
  const printRef = useRef<HTMLDivElement>(null)

  const { isOpen, onClose, input } = useDisclosure<{
    surveyName?: string
    fields: any[]
    chartOption: any
  }>({
    tag: "ModalPrintSurveyToFieldReport",
  })

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "BAO_CAO_THEO_LINH_VUC",
    pageStyle: `
            @page { size: A4 landscape; margin: 1.5cm; }

            @media print {
                * {
                    color: #000 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                body {
                    font-family: "Times New Roman";
                    font-size: 13px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    border: 2px solid #000;
                }

                th, td {
                    border: 2px solid #000;
                    padding: 6px;
                    text-align: center;
                    vertical-align: middle;
                }

                thead {
                    display: table-header-group;
                }

                thead th {
                    background-color: #fff;
                    font-weight: bold;
                }

                tr {
                    page-break-inside: avoid;
                }
            }
        `,
  })

  if (!input) return null

  const dataTable = input.fields || []

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={1200}
      title={
        <div className="flex justify-between items-center mr-6">
          <span>In báo cáo theo từng Lĩnh vực</span>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            In
          </Button>
        </div>
      }
    >
      <div ref={printRef}>
        <div className="font-bold text-lg text-center mb-4">THỐNG KÊ THEO TỪNG LĨNH VỰC</div>

        <table
          className="mt-4 text-sm border-collapse border border-black text-center"
          style={{ tableLayout: "fixed", width: "100%" }}
        >
          <thead>
            <tr className="font-bold bg-white border border-black text-center">
              <th className="border border-black" rowSpan={2} style={{ width: 60 }}>
                STT
              </th>
              <th className="border border-black" rowSpan={2} style={{ width: 120 }}>
                Lĩnh vực
              </th>
              <th className="border border-black" rowSpan={2} style={{ width: 250 }}>
                Nội dung
              </th>
              {dataTable[0]?.answers?.length > 0 && (
                <th className="border border-black" colSpan={dataTable[0].answers.length}>
                  Phương án trả lời
                </th>
              )}
            </tr>
            <tr className="font-bold bg-white border border-black text-center">
              {dataTable[0]?.answers?.map((a: any) => (
                <th className="border border-black" key={a.id}>
                  {a.description}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataTable.map((f: any, index: number) => {
              const percent = calculatePercent(f.answers)
              const isAvg = f.id === "average"

              return (
                <tr key={f.id} className={isAvg ? "font-bold bg-gray-100" : ""}>
                  {/* STT */}
                  <td className="border border-black">{isAvg ? "ĐGTB" : index + 1}</td>

                  {/* Lĩnh vực */}
                  <td className="border border-black">{isAvg ? "" : `Lĩnh vực ${index + 1}`}</td>

                  {/* Nội dung Lĩnh vực */}
                  <td className="border border-black text-left px-2">{isAvg ? "" : f.groupName}</td>

                  {/* Cột đáp án */}
                  {percent.map((p: any) => (
                    <td className="border border-black" key={p.id}>
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

export default ModalPrintSurveyToFieldReport
