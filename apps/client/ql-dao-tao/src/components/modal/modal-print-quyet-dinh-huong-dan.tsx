import { PrinterOutlined } from "@ant-design/icons"
import { Button, Modal } from "antd"
import dayjs from "dayjs"
import { useRef } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"

dayjs.locale("vi")

const ModalPrintSupervisorGuide = () => {
  const printRef = useRef<HTMLDivElement>(null)
  const { isOpen, onClose, input } = useDisclosure({
    tag: "ModalPrintSupervisorGuide",
  })

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
        @page {
            size: A4;
        }
        @media print {
            @page { margin: 1 1 1 1 !important; }
            body, html, #root {
                height: auto !important;
                overflow: visible !important;
            }
            .page-break {
                page-break-after: always;
                break-after: page;
            }
            .page {
                page-break-after: auto !important;
                break-after: auto !important;
                min-height: 297mm;
                width: 210mm;
                padding: 15mm;
            }
            table {
                page-break-inside: auto;
            }
            tr {
                page-break-inside: avoid;
            }
        }
      `,
  })
  //TODO: ghép, cấu hình thông tin
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ top: 20 }}
      title={
        <div className="flex items-center justify-between w-[95%]">
          <span>Quyết định giao nhiệm vụ hướng dẫn</span>
          <Button icon={<PrinterOutlined />} onClick={handlePrint} size="small" type="primary">
            In
          </Button>
        </div>
      }
    >
      <div
        ref={printRef}
        className="mx-auto p-10 page text-sm leading-relaxed !font-time-news-roman"
      >
        <div>
          <div className="text-center font-bold uppercase">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-normal">BỘ QUỐC PHÒNG</span>
                <span className="leading-none">HỌC VIỆN KỸ THUẬT QUÂN SỰ</span>
                <hr className="border-t-[1px] border-black mx-14" />
                <span className="font-normal normal-case mt-1">
                  Số: <span className="inline-block w-10"> </span> /QĐ-HV
                </span>
              </div>
              <div className="flex flex-col">
                <span>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span>
                <span className="normal-case leading-none">Độc lập - Tự do - Hạnh phúc</span>
                <hr className="border-t-[1px] border-black mx-14" />
                <div className="font-normal normal-case italic mt-1">
                  Hà Nội, ngày 02 tháng 6 năm 2025
                </div>
              </div>
            </div>

            <div className="mt-4 text-[20px]">Quyết định</div>
            <div className="font-semibold normal-case text-[20px] leading-none mx-[100px]">
              Về việc giao nhiệm vụ hướng dẫn đồ án tốt nghiệp đại học cho ... học viên kỹ sư quân
              sự Khoá ...
            </div>
            <hr className="border-t-[1px] border-black w-[240px] mx-auto" />

            <div className="my-8 text-[20px]">Giám đốc học viện kỹ thuật quân sự</div>
            <div>
              <div className="text-left italic font-normal normal-case text-[18px] indent-6 leading-5">
                Căn cứ chức năng, nhiệm vụ, quyền hạn của Học viện Kỹ thuật quân sự;
              </div>
              <div className="text-left italic font-normal normal-case text-[18px] indent-6 leading-5">
                Căn cứ Quy chế đào tạo đại học và cao đẳng chính quy theo học chế tín chỉ hệ quân sự
                tại Học viện Kỹ thuật quân sự, ban hành kèm theo Quyết định số 333/QĐ-HV ngày
                11/02/2020
              </div>
              <div className="text-left italic font-normal normal-case text-[18px] indent-6 leading-5">
                Theo đề nghị của đồng chí Trưởng phòng Đào tạo tại tờ trình số 563/TrT-ĐT ngày
                20/6/2024.
              </div>
            </div>
          </div>
          <div className="text-[18px] mt-8 leading-5">
            <div className="indent-6">
              <strong>Điều 1.</strong> Giao nhiệm vụ hướng dẫn đồ án tốt nghiệp cho ... học viên kỹ
              sư quân sự Khoá ... như sau:
            </div>
            <div className="flex justify-center my-4 italic">(Có ... phụ lục kèm theo)</div>
            <div className="indent-6">
              Chỉ định và mời các đồng chí có tên sau đây tham gia hội đồng:
            </div>
            <div className="indent-6 mt-1">
              <strong>Điều 2.</strong> Quyết định này có hiệu lực kể từ ngày ký.
            </div>
            <div className="indent-6 mt-1">
              <strong>Điều 3.</strong> Đồng chí Trưởng phòng Đào tạo, Chỉ huy các cơ quan, đơn vị có
              liên quan và các đồng chí có tên tại Điều 1 chịu trách nhiệm thi hành Quyết định
              này./.
            </div>
          </div>
          <div className="overflow-x-auto mt-6 flex justify-between">
            <div className="flex flex-col text-[16px]">
              <div className="flex flex-col">
                <span className="font-semibold italic">Nơi nhận:</span>
                <ul className="list-none leading-5">
                  <li>- K11, K21, K22, K24;</li>
                  <li>- K31, V2, V4, V5, V6;</li>
                  <li>- d1, d2, d3, d4;</li>
                  <li>- HSQL(02);</li>
                  <li>- Lưu: VT, QLĐT/P2. Lul17.</li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col text-center">
              <div className="font-bold flex flex-col text-[18px]">
                <span className="uppercase">KT.GIÁM ĐỐC</span>
                <span className="uppercase">PHÓ GIÁM ĐỐC</span>
                <div className="h-[40px]"> </div>
                <span>Thiếu tướng Trần Xuân Nam</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>
        {`
            @media print {
                .page {
                    width: 210mm;
                    min-height: 297mm; 
                    page-break-after: auto;
                    background: white;
                    overflow: visible;
                }
            }
            table {
                page-break-inside: auto;
            }
            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
            @page {
                size: A4;
            }
            @media screen {
                .page {
                    width: 210mm;
                    min-height: 297mm;
                    margin: 10px auto;
                    padding: 20mm;
                    background: white;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
            }
            `}
      </style>
    </Modal>
  )
}

export default ModalPrintSupervisorGuide
