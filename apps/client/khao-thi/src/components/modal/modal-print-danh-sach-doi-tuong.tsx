import { PrinterOutlined } from "@ant-design/icons"
import { Button, Modal } from "antd"
import { useRef } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"

const ModalPrintDanhSachDoiTuong = () => {
  const printRef = useRef<HTMLDivElement>(null)

  const { isOpen, onClose, input } = useDisclosure<{
    surveyName?: string
    data: any[]
  }>({
    tag: "ModalPrintDanhSachDoiTuong",
  })

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "DANH_SACH_DOI_TUONG_KHAO_SAT",
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
                    background-color: #;
                    font-weight: bold;
                }

                tr {
                    page-break-inside: avoid;
                }
            }
        `,
  })

  if (!input) return null

  const dataTable = input.data || []

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={1200}
      title={
        <div className="flex justify-between items-center mr-6">
          <span>In danh sách người làm khảo sát</span>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            In
          </Button>
        </div>
      }
    >
      <div ref={printRef}>
        <div className="font-bold text-lg text-center mb-4">DANH SÁCH NGƯỜI LÀM KHẢO SÁT</div>

        <table
          className="mt-4 text-sm border-collapse border border-black text-center"
          style={{ tableLayout: "fixed", width: "100%" }}
        >
          <thead>
            <tr className="font-bold  border border-black text-center">
              <th className="border border-black text-center" style={{ width: 50 }}>
                STT
              </th>
              <th className="border border-black text-center">Mã HV/GV</th>
              <th className="border border-black text-center">Họ tên</th>
              <th className="border border-black text-center">CCCD</th>
              <th className="border border-black text-center">SĐT</th>
              <th className="border border-black text-center">ĐVQL</th>
              <th className="border border-black text-center">Lớp QL</th>
              <th className="border border-black text-center">Khoá</th>
              <th className="border border-black text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="border border-black text-center">
            {dataTable.map((record: any, index: number) => (
              <tr className="border border-black text-center" key={record.id}>
                <td className="border border-black text-center">{index + 1}</td>
                <td className="border border-black text-center">
                  {record?.code || ""}
                </td>
                <td className="border border-black text-center">
                  {record?.lastName || ""} {record?.firstName || ""}
                </td>
                <td className="border border-black text-center">{record?.idCardNumber || ""}</td>
                <td className="border border-black text-center">{record?.phoneNumber || ""}</td>
                <td className="border border-black text-center">
                  {record?.donVi?.sMa || ""}
                </td>
                <td className="border border-black text-center">
                  {record?.educationAndTraining?.[0]?.fixedClass?.code || ""}
                </td>
                <td className="border border-black text-center">
                  {(record?.educationAndTraining?.[0]?.fixedClass as any)?.trainingCourse?.name ||
                    ""}
                </td>
                <td className="border border-black text-center">
                  {record?.surveySession ? "Đã làm" : "Chưa làm"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}

export default ModalPrintDanhSachDoiTuong
