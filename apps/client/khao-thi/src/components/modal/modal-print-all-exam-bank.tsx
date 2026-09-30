import { renderWithMath } from "@components/commons/rich-text-editor/renderWithMath"
import type { Question } from "@workspace/db"
import { Button, Modal } from "antd"
import dayjs from "dayjs"
import { Printer } from "lucide-react"
import { useRef } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"

const ModalPrintAllExams = () => {
  const { isOpen, onClose, input } = useDisclosure<{
    exams: {
      examCode: string
      questions: Question[]
      subjectVersionName: string
      subject: string
      semester: string
      examId: string
      duration: number
    }[]
    explanation: boolean
  }>({
    tag: "ModalPrintAllExams",
  })

  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Toan_bo_de_thi.pdf",
    pageStyle: `
      @page {
        size: A4;
        margin: 1cm;
      }
      @media print {
        .page-break {
          page-break-after: always;
        }
        .blank-page {
          height: 100vh;
          visibility: hidden;
        }
      }
    `,
  })

  return (
    <Modal
      title="In toàn bộ đề thi"
      open={isOpen}
      onCancel={onClose}
      width="80vw"
      style={{ maxWidth: "1200px" }}
      footer={null}
    >
      <div className="space-y-4">
        <div className="flex justify-end w-full mb-4 space-x-2">
          <Button type="primary" onClick={() => handlePrint()} icon={<Printer />}>
            In toàn bộ đề thi
          </Button>
          {/* <Button onClick={handleExportWord}>Xuất Word</Button> */}
        </div>

        <div ref={printRef} className="!font-time-news-roman text-black bg-white">
          {input?.exams.map((exam, examIndex) => (
            <div key={exam.examCode}>
              <div className="p-6" style={{ fontSize: "16px", lineHeight: "1.5" }}>
                {/* Header for each exam */}
                <table className="w-full border-separate border-spacing-0">
                  <tbody>
                    <tr>
                      <td className="align-top w-1/3 p-2 text-center">
                        <span className="font-bold uppercase">
                          PHÒNG KHẢO THÍ <br /> &amp; ĐBCLGD-ĐT
                        </span>
                      </td>
                      <td className="align-top w-1/3 p-2 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold uppercase">PHIẾU ĐỀ THI</span>
                          <span className="italic">(Dùng cho lớp: {exam.subject})</span>
                        </div>
                      </td>
                      <td className="align-top w-1/3 p-2 text-center">
                        <span
                          className="font-bold uppercase"
                          dangerouslySetInnerHTML={{
                            __html: exam?.semester || "",
                          }}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <span className="flex w-full justify-end italic">
                  Ngày {dayjs().format("DD")} tháng {dayjs().format("M")} năm{" "}
                  {dayjs().format("YYYY")}
                </span>

                <table className="w-full border border-black border-double border-collapse text-center align-middle">
                  <tbody>
                    <tr>
                      <td className="w-1/5 border border-black border-double p-2 align-top">
                        <span className="font-bold">Giảng viên ra đề</span>
                      </td>
                      <td className="w-3/5 border border-black border-double p-2 align-middle">
                        <div>
                          <div>
                            <span className="font-bold">Đề thi số: {exam.examCode}</span>
                          </div>
                          <div>
                            <span className="font-bold">Học phần: {exam.subjectVersionName}</span>
                          </div>
                          <div>
                            <span className="font-bold">
                              Thời gian làm bài: {exam.duration} phút
                            </span>
                          </div>
                        </div>
                      </td>
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

                {/* Questions */}
                <div className="mb-4 mt-10 space-y-4">
                  {exam.questions.map((question, index) => (
                    <div key={question.id} className="flex flex-col">
                      <span className="font-bold">
                        Câu {index + 1}({question.point && `${question.point} điểm`}):
                      </span>
                      <span
                        className="prose max-w-none text-gray-800"
                        dangerouslySetInnerHTML={{
                          __html: question.content
                            ? renderWithMath(question.content)
                            : "<i>Chưa có nội dung</i>",
                        }}
                      />
                      {input?.explanation && (
                        <>
                          <span className="italic text-sm">Giải thích đáp án:</span>
                          <span
                            className="prose max-w-none text-gray-800"
                            dangerouslySetInnerHTML={{
                              __html: question.explanation
                                ? renderWithMath(question.explanation)
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
                  <span className="italic mt-1 font-bold">
                    * Giám thị coi thi không giải thích gì thêm
                  </span>
                </div>
              </div>

              {/* Add page break after each exam except the last one */}
              {examIndex < input.exams.length - 1 && <div className="page-break" />}

              {/* Add blank page if the exam has odd number of pages */}
              <div className="blank-page" />
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

export default ModalPrintAllExams
