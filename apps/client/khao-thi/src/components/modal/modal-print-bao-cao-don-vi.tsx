import { PrinterOutlined } from "@ant-design/icons"
import { Button, Modal } from "antd"
import dayjs from "dayjs"
import ReactECharts from "echarts-for-react"
import { useRef } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"

dayjs.locale("vi")

const calculatePercent = (items: any[]) => {
  const total = items.reduce((s, i) => s + i.totalCount, 0)
  return items.map((i) => ({
    ...i,
    total,
    percent: total === 0 ? 0 : Number(((i.totalCount / total) * 100).toFixed(2)),
  }))
}

const ModalPrintBaoCaoDonVi = () => {
  const printRef = useRef<HTMLDivElement>(null)

  const { isOpen, onClose, input } = useDisclosure<{
    surveyName: string
    data: any[]
    choices: any[]
    chartOption: any
    trainingObjectTypeName?: string
  }>({
    tag: "ModalPrintBaoCaoDonVi",
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

            body {
                font-family: "Times New Roman";
                font-size: 13px;
            }

            table {
                border-collapse: collapse;
            }

            th, td {
                border: 1px solid black;
                padding: 4px;
            }

            tr {
                page-break-inside: avoid;
            }

            /* Ẩn legend màu nếu muốn */
            /* .echarts-for-react canvas { filter: grayscale(100%); } */
        }
    `,
  })

  if (!input) return null

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={1000}
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
        <div className="flex justify-between text-center text-black font-bold">
          <div className="w-[45%]">
            <div className="uppercase">HỌC VIỆN KỸ THUẬT QUÂN SỰ</div>
            <div className="uppercase underline">BAN KT & ĐBCLGD-ĐT</div>
          </div>

          <div className="w-[45%]">
            <div className="uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div className="font-normal underline">Độc lập - Tự do - Hạnh phúc</div>
          </div>
        </div>

        {/* ===== TITLE ===== */}
        <div className="text-center">
          <div className="text-xl mt-6 font-bold uppercase">TỔNG HỢP ĐÁNH GIÁ</div>
          <div className="text-sm font-normal mt-1 mt-6 font-semibold uppercase">
            {[
              "HĐGD của GV",
              input.surveyName,
              input.trainingObjectTypeName && `Hệ ${input.trainingObjectTypeName}`,
            ]
              .filter(Boolean)
              .join(", ")}
          </div>
        </div>

        {/* ===== TABLE ===== */}
        <table className="w-full mt-6 text-sm border-collapse">
          <thead>
            <tr className="font-bold text-center">
              <th className="border border-black">STT</th>
              <th className="border border-black">Đơn vị quản lý</th>
              {input.choices.map((c: any) => (
                <th key={c.id} className="border border-black">
                  {c.description}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {input.data.map((row: any, index: number) => {
              const percentData = calculatePercent(row.average)

              return (
                <tr key={row.organization?.Id || index}>
                  <td className="border border-black text-center">{index + 1}</td>

                  <td className="border border-black px-2">
                    {row.organization?.sMa || ""} - {row.organization?.sTen || ""}
                  </td>

                  {input.choices.map((c: any) => {
                    const found = percentData.find((p: any) => p.id === c.id)

                    return (
                      <td key={c.id} className="border border-black text-center">
                        {found
                          ? `${found.percent}% (${found.totalCount}/${found.total})`
                          : "0% (0/0)"}
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
            style={{
              height: Math.max(300, (input.data?.length || 0) * 35 + 120),
            }}
          />
        </div>

        {/* ===== FOOTER ===== */}
        <div className="mt-6 text-right italic">
          Hà Nội, ngày {dayjs().format("DD")} tháng {dayjs().format("M")} năm{" "}
          {dayjs().format("YYYY")}
        </div>
      </div>
    </Modal>
  )
}

export default ModalPrintBaoCaoDonVi
