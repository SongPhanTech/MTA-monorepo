import { formatDateInSlash, formatThangIn } from "@workspace/libs/timezone"
import { PrinterOutlined } from "@ant-design/icons"
// import { GENDER_MEAN } from '@constants/constants'
import type { DM_DonVi, FixedClass, Student, TrainingCourse } from "@workspace/db/client"
import { Button, Modal } from "antd"
import dayjs from "dayjs"
import { useRef } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"

dayjs.locale("vi")

type ModalPrintToDSHVInput = {
  dataTable: Student[]
  dataFixedClass: FixedClass & {
    trainingCourse?: TrainingCourse
    managementOrganization?: DM_DonVi
  }
}

const ModalPrintToDSHV = () => {
  const formattedDate = `..., ngày ${dayjs().format("DD")} tháng ${formatThangIn(dayjs().month() + 1)} năm ${dayjs().format("YYYY")}`
  const printRef = useRef<HTMLDivElement>(null)

  const { isOpen, onClose, input } = useDisclosure<ModalPrintToDSHVInput>({
    tag: "ModalPrintToDSHV",
  })

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
        @page {
            size: A4;
            margin: 1cm;
        }
        @media print {
            * {
                color: black !important;
            }
            .page-break {
                page-break-after: always;
            }
            .blank-page {
                height: 100vh;
                visibility: hidden;
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

  const basicInfoCol1 = [
    {
      title: "Mã lớp quản lý:",
      value: <span>{input?.dataFixedClass?.code}</span>,
    },
    {
      title: "Khoá:",
      value: <span>{input?.dataFixedClass?.trainingCourse?.name}</span>,
    },
  ]

  const basicInfoCol2 = [
    {
      title: "Tên lớp quản lý:",
      value: <span className="font-medium">{input?.dataFixedClass?.name}</span>,
    },
    {
      title: "Đơn vị quản lý:",
      value: (
        <span>
          {input?.dataFixedClass?.managementOrganization?.sMa} -{" "}
          {input?.dataFixedClass?.managementOrganization?.sTen}
        </span>
      ),
    },
  ]
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={900}
      style={{ top: 20 }}
      title={
        <div className="flex items-center justify-between w-[95%]">
          <span>Danh sách sinh viên trong lớp</span>
          {/* TODO: Làm select chọn trưởng phòng đào tạo */}

          <Button icon={<PrinterOutlined />} onClick={handlePrint} size="small" type="primary">
            In
          </Button>
        </div>
      }
    >
      <div ref={printRef} className="mx-auto p-6 text-sm leading-relaxed !font-time-news-roman">
        <div className="text-center font-bold uppercase">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-normal">BỘ QUỐC PHÒNG</span>
              <span>HỌC VIỆN KỸ THUẬT QUÂN SỰ</span>
              <hr className="text-black border-[1px] mx-14" />
            </div>
            <div className="flex flex-col">
              <span>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span>
              <span className="normal-case">Độc lập - Tự do - Hạnh phúc</span>
              <hr className="text-black border-[1px] mx-14" />
            </div>
          </div>

          <div className="mt-4 uppercase text-[20px]">Danh sách sinh viên</div>

          <div />
        </div>
        <div className="flex justify-between gap-5 mt-6">
          <div className="flex flex-col gap-2.5 w-[50%]">
            {basicInfoCol1?.filter(Boolean).map((item, index) => (
              <div key={item?.title || index} className="flex gap-2 w-full">
                <span className="text-[#656565] text-sm min-w-32">{item?.title}</span>
                <span className="text-sm font-semibold">{item?.value}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2.5 w-[50%]">
            {basicInfoCol2?.filter(Boolean).map((item, index) => (
              <div key={item?.title || index} className="flex gap-2 w-full">
                <span className="text-[#656565] text-sm min-w-32">{item?.title}</span>
                <span className="text-sm font-semibold">{item?.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto text-sm mt-6">
          <table className="w-full border border-black border-collapse">
            <thead>
              <tr>
                <th className="border border-black px-1 py-1 w-[40px] text-center">TT</th>
                <th className="border border-black px-1 py-1 text-center">Mã định danh</th>
                <th className="border border-black px-1 py-1 text-center">Họ và tên</th>
                <th className="border border-black px-1 py-1 text-center">Ngày sinh</th>
                <th className="border border-black px-1 py-1 text-center">Giới tính</th>
                <th className="border border-black px-1 py-1 text-center">Chuyên ngành</th>
                <th className="border border-black px-1 py-1 text-center">CTĐT</th>
              </tr>
            </thead>
            <tbody>
              {input?.dataTable?.map((item: any, index: number) => (
                <tr key={item?.id}>
                  <td className="border border-black px-1 py-1 text-center">{index + 1}</td>
                  <td className="border border-black px-1 py-1 text-center">
                    {item?.userProfile?.code}
                  </td>
                  <td className="border border-black px-1 py-1 text-center">
                    {item?.userProfile?.fullname}
                  </td>
                  <td className="border border-black px-1 py-1 text-center">
                    {item?.userProfile?.dateOfBirth
                      ? formatDateInSlash(item?.userProfile?.dateOfBirth)
                      : ""}
                  </td>
                  <td className="border border-black px-1 py-1 text-center">
                    {item?.userProfile?.gender?.sTen || ""}
                  </td>
                  <td className="border border-black px-1 py-1 text-center">
                    {item?.fixedClass?.curriculumVersion?.curriculum?.trainingMajor?.name || ""}
                  </td>
                  <td className="border border-black px-1 py-1 text-center">
                    {item.curriculumVersion?.name || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="overflow-x-auto mt-6 flex justify-end">
          <div className="flex flex-col text-center mt-5">
            <span className="italic">{formattedDate}</span>
            <div className="uppercase font-bold flex flex-col">
              <span>TL. GIÁM ĐỐC</span>
              <span>Trưởng phòng đào tạo</span>
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

export default ModalPrintToDSHV
