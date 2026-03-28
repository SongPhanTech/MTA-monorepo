import { renderWithMath } from "@components/commons/rich-text-editor/renderWithMath"
import { formatDateVN } from "@lib/utils"
import type { ExamBankQuestion, Question } from "@workspace/db"
import { Docxtemplater, exportFile, loadFile } from "@workspace/libs/docxjs"
import { getRuntimeEnv } from "@workspace/libs/utils"
import { Button, Modal, message, Space } from "antd"
import dayjs from "dayjs"
import { saveAs } from "file-saver"
import { FileDown, Printer } from "lucide-react"
import { useRef } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"

export const ModalPrintExamBank = () => {
  const formattedDate = `Ngày ${dayjs().format("DD")} tháng ${dayjs().format("MM")} năm ${dayjs().format("YYYY")}`
  const { isOpen, onClose, input } = useDisclosure<{
    data?: (ExamBankQuestion & { question: Question })[]
    subjectVersionName: string
    subject: string
    examCode: string
    semester: string
    examId: string
    duration: number
    explanation: boolean
  }>({
    tag: "ModalPrintExamBank",
  })

  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `De_thi_mon_${input?.subjectVersionName}_${input?.examCode}.pdf`,
  })

  // Xử lý xuất file Word
  const exportToWord = async () => {
    if (!input?.data) return

    try {
      console.log("Loading template file...")
      const res = await loadFile(
        `${getRuntimeEnv("NEXT_PUBLIC_ASSET_PREFIX")}/templates/InDeThi.docx`
      )
      console.log("Template loaded successfully:", !!res)

      console.log("Initializing Docxtemplater...")
      const doc = new Docxtemplater(res, {
        linebreaks: true,
        paragraphLoop: true,
        errorLogging: true,
      })

      function handleConvertHtmlToDocx(html: string) {
        if (!html) return ""

        const div = document.createElement("div")
        div.innerHTML = renderWithMath(html)
        let textContent = div.textContent || div.innerText || ""

        textContent = textContent.replace(/\s+/g, " ").trim()

        return textContent
      }

      // Format dữ liệu cho template
      const templateData = {
        currentDate: formatDateVN(dayjs()),
        lop: input?.subject,
        hocPhan: input?.subjectVersionName,
        duration: input?.duration,
        semester: handleConvertHtmlToDocx(input?.semester || ""),
        examCode: input?.examCode,

        questions:
          input?.data?.map((item, index) => ({
            index: index + 1,
            point: item?.question?.point,
            content: item.question.content
              ? handleConvertHtmlToDocx(item.question.content)
              : "Chưa có nội dung",
          })) || [],
      }
      console.log(templateData)

      console.log("Rendering template with data...")
      await doc.renderAsync(templateData)
      console.log("Template rendered successfully")

      const blob = exportFile(doc.getZip())
      const fileName = `De_thi_mon_${input?.subjectVersionName}_${input?.examCode}_${dayjs().format("DDMMYYYY")}.docx`
      saveAs(blob, fileName)
      message.success("Xuất file Word thành công")
    } catch (error: any) {
      console.error("Lỗi khi xuất file Word:", error)

      // Detailed error logging for Docxtemplater
      if (error?.properties?.errors) {
        console.error("Docxtemplater errors:", error.properties.errors)
        error.properties.errors.forEach((err: any, index: number) => {
          console.error(`Error ${index + 1}:`, {
            message: err.message,
            name: err.name,
            stack: err.stack,
            properties: err.properties,
          })
        })
      }

      message.error(`Xuất file Word thất bại: ${error?.message || "Unknown error"}`)
    }
  }

  return (
    <Modal
      title="In đề thi"
      open={isOpen}
      onCancel={onClose}
      width="80vw"
      style={{ maxWidth: "1200px" }}
      footer={null}
    >
      <div className="space-y-4">
        <div className="flex justify-end w-full mb-4">
          <Space>
            <Button type="primary" onClick={() => handlePrint()} icon={<Printer />}>
              In đề thi
            </Button>
            <Button type="primary" onClick={() => exportToWord()} icon={<FileDown />}>
              Xuất file Word
            </Button>
          </Space>
        </div>

        <div
          ref={printRef}
          className="!font-time-news-roman text-black bg-white p-6"
          style={{ fontSize: "16px", lineHeight: "1.5" }}
        >
          {/* Header */}
          <table className="w-full border-separate border-spacing-0">
            <tbody>
              <tr>
                {/* Bên trái */}
                <td className="align-top w-1/3 p-2 text-center">
                  <span className="font-bold uppercase">
                    PHÒNG KHẢO THÍ <br /> &amp; ĐBCLGD-ĐT
                  </span>
                </td>

                {/* Ở giữa */}
                <td className="align-top w-1/3 p-2 text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-bold uppercase">PHIẾU ĐỀ THI</span>
                    <span className="italic">(Dùng cho lớp: {input?.subject})</span>
                  </div>
                </td>

                {/* Bên phải */}
                <td className="align-top w-1/3 p-2 text-center">
                  <span
                    className="font-bold uppercase "
                    dangerouslySetInnerHTML={{
                      __html: input?.semester || "",
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <span className="flex w-full justify-end italic">{formattedDate}</span>

          <table className="w-full border border-black border-double border-collapse text-center align-middle">
            <tbody>
              <tr>
                {/* Cột trái */}
                <td className="w-1/5 border border-black border-double p-2 align-top">
                  <span className="font-bold">Giảng viên ra đề</span>
                </td>

                {/* Cột giữa */}
                <td className="w-3/5 border border-black border-double p-2 align-middle">
                  <div>
                    <div>
                      <span className="font-bold">Đề thi số: {input?.examCode}</span>
                    </div>
                    <div>
                      <span className="font-bold">Học phần: {input?.subjectVersionName}</span>
                    </div>
                    <div>
                      <span className="font-bold">Thời gian làm bài: {input?.duration} phút</span>
                    </div>
                  </div>
                </td>

                {/* Cột phải */}
                <td className="w-1/5 border border-black border-double p-2">
                  <div className="flex flex-col justify-between h-[80px]">
                    <div className="font-bold">
                      Phòng khảo thí <br />
                      &amp; ĐBCLGD-ĐT
                    </div>
                    {/* <div className="font-bold">Nguyễn Văn Cần</div> */}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Câu hỏi */}
          <div className="mb-4 mt-10 space-y-4">
            {input?.data?.map((item, index) => (
              <div key={item.id} className="flex flex-col">
                <span className="font-bold ">
                  Câu {index + 1}({item?.question?.point && `${item?.question?.point} điểm`}):
                </span>
                <span
                  className="prose max-w-none text-gray-800"
                  dangerouslySetInnerHTML={{
                    __html: item.question.content
                      ? renderWithMath(item.question.content)
                      : "<i>Chưa có nội dung</i>",
                  }}
                />
                {input?.explanation && (
                  <>
                    <span className="italic text-sm">Giải thích đáp án:</span>
                    <span
                      className="prose max-w-none text-gray-800"
                      dangerouslySetInnerHTML={{
                        __html: item.question.explanation
                          ? renderWithMath(item.question.explanation)
                          : "<i>Chưa có nội dung</i>",
                      }}
                    />
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4">
            <div className="italic text-center font-bold">(Không được sử dụng tài liệu)</div>

            {/* Dòng 2: căn trái */}
            <span className="italic mt-1 font-bold">
              * Giám thị coi thi không giải thích gì thêm
            </span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ModalPrintExamBank
