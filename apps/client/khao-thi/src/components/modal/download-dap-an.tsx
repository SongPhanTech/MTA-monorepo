import { queryClient } from "@api/index"
import { useFindUniqueExamBank, useUpdateExamBank } from "@workspace/db/hooks"
import { useGetExamBankWithGrouping } from "@workspace/libs/api/exam"
import { getMinioUrl, formatQuestionPoint } from "@workspace/libs/utils"
import { Button, Flex, Input, Modal } from "antd"
import { TemplateHandler } from "easy-template-x"
import { useEffect, useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"
import { convertHtmlBreaks, saveFile } from "@/utils/saveFile"
import {
  plainQuestionAnswerText,
  renderQuestionAnswerHtml,
  renderQuestionExamHtml,
} from "@/utils/cluster-question-utils"
import { useSession } from "@workspace/auth/react"

const PrintExplanation = () => {
  const { data: me } = useSession()
  const [name, setName] = useState(me?.fullName || "")
  const [duration, setDuration] = useState("")
  const { isOpen, onClose, input } = useDisclosure<{ id: string }>({ tag: "PrintExplanation" })

  const [hasDownloaded, setHasDownloaded] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const { data } = useFindUniqueExamBank(
    {
      where: { id: input?.id },
      include: {
        exam: { include: { semester: true, subjectVersion: true } },
        subjectClass: { select: { id: true, name: true } },
        examMatrix: { include: { examFramework: { select: { time: true } } } },
      },
    },
    { enabled: !!input?.id }
  )

  const { mutateAsync: fetchGroupedQuestions, data: groupedResponse } = useGetExamBankWithGrouping()
  const questions = groupedResponse?.status === 200 ? (groupedResponse.data.questions ?? []) : []

  useEffect(() => {
    if (input?.id) {
      fetchGroupedQuestions({ data: { id: input.id, isGroup: false } })
    }
  }, [input?.id, fetchGroupedQuestions])

  useEffect(() => {
    if (data?.examMatrix?.examFramework?.time) {
      setDuration(String(data.examMatrix.examFramework.time))
    }
  }, [data?.examMatrix?.examFramework?.time])

  const { mutateAsync: updateExamBank } = useUpdateExamBank()

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Dap-An-${data?.exam?.subjectVersion?.name || "Exam"}`,
  })

  const examDate = data?.examDay ? new Date(data.examDay) : new Date()
  const day = examDate.getDate()
  const month = examDate.getMonth() + 1
  const year = examDate.getFullYear()
  const subjectClassName = data?.subjectClass?.name || ""

  const handleDownload = async () => {
    if (!data) return
    setIsDownloading(true)
    try {
      const res = await fetch(getMinioUrl("mta/template/template-dap-an-bk.docx"))
      const templateFile = await res.blob()

      const templateData = {
        examCode: data.examCode || "",
        subjectName: data.exam?.subjectVersion?.name || "",
        semesterName: data.exam?.semester?.name || "",
        className: data.subjectClass?.name || "",
        duration: String(duration || data.examMatrix?.examFramework?.time || ""),
        day: String(day),
        month: String(month),
        year: String(year),
        teacherName: name,
        questions: questions.map((q: any, index: number) => ({
          order: String(q?.order || index + 1),
          point: formatQuestionPoint(q?.question?.point),
          content: convertHtmlBreaks(renderQuestionExamHtml(q?.question ?? {})) || "",
          answer: convertHtmlBreaks(plainQuestionAnswerText(q?.question ?? {})),
        })),
      }

      const handler = new TemplateHandler()
      const doc = await handler.process(templateFile, templateData)
      saveFile(`Dap-An-${data?.exam?.subjectVersion?.name}.docx`, doc)
      setHasDownloaded(true)
    } catch (error) {
      console.error("Error downloading file:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleClose = async () => {
    if (hasDownloaded) {
      await updateExamBank({ where: { id: input?.id }, data: { isLock: true } })
    }
    setHasDownloaded(false)
    queryClient.invalidateQueries({ queryKey: ["ExamBank"] })
    onClose()
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-4">
          <span>Xem trước đáp án</span>
          <div className="flex-1 flex items-center justify-center gap-4">
            <Input
              placeholder="Nhập tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-56"
            />
            <Input
              placeholder="Nhập thời gian thi"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-56"
            />
          </div>
        </div>
      }
      open={isOpen}
      onCancel={handleClose}
      className="top-2"
      width={1000}
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={handleClose}>Đóng</Button>
          <Button onClick={handlePrint} type="primary">
            In
          </Button>
          <Button type="primary" onClick={handleDownload} loading={isDownloading}>
            Tải xuống
          </Button>
        </Flex>
      }
    >
      <div
        style={{
          maxHeight: "70vh",
          overflow: "auto",
          border: "1px solid #d9d9d9",
          padding: "16px",
        }}
      >
        <div
          ref={printRef}
          style={{
            padding: "20mm 15mm",
            width: "210mm",
            minHeight: "297mm",
            background: "white",
            fontFamily: "Times New Roman, serif",
            fontSize: "13pt",
            lineHeight: "1.5",
            margin: "0 auto",
          }}
        >
          <style>
            {`
              @media print {
                #print-explanation, #print-explanation * { color: #000 !important; }
                #print-explanation a, #print-explanation a:visited,
                #print-explanation a:hover, #print-explanation a:active {
                  color: #000 !important; text-decoration: none !important;
                }
              }
            `}
          </style>

          <div id="print-explanation">
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                  BAN KHẢO THÍ & ĐBCLGD-ĐT
                </div>
                <div style={{ fontWeight: "bold" }}>{data?.exam?.semester?.name || "HKI"}</div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: "55%",
                  top: "0",
                  transform: "translateX(-50%)",
                  fontWeight: "bold",
                }}
              >
                PHIẾU ĐỀ THI
              </div>
            </div>

            <div style={{ textAlign: "center", marginBottom: "10px", marginLeft: "10%" }}>
              <span style={{ fontWeight: "normal" }}>(Dùng cho lớp: {subjectClassName})</span>
            </div>

            <div style={{ textAlign: "right", fontStyle: "italic", marginBottom: "15px" }}>
              Ngày {day} tháng {month} năm {year}
            </div>

            <table
              style={{
                width: "100%",
                border: "1px solid black",
                borderCollapse: "collapse",
                marginBottom: "20px",
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "10px",
                      width: "25%",
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    <strong>Giáo viên ra đề</strong>
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "10px",
                      width: "50%",
                      verticalAlign: "middle",
                    }}
                  >
                    <div style={{ textAlign: "center", marginBottom: "5px" }}>
                      <strong>Đề thi số : {data?.examCode || "001"}</strong>
                    </div>
                    <div style={{ textAlign: "center", marginBottom: "5px" }}>
                      <strong>Học phần: {data?.exam?.subjectVersion?.name || ""}</strong>
                    </div>
                    <div style={{ textAlign: "center", marginBottom: "10px" }}>
                      <strong>
                        Thời gian làm bài:{" "}
                        {duration || data?.examMatrix?.examFramework?.time || data?.exam?.duration}{" "}
                        phút
                      </strong>
                    </div>
                  </td>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "10px",
                      width: "25%",
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    <div style={{ marginBottom: "5px" }}>
                      <strong>Ban Khảo thi</strong>
                    </div>
                    <div style={{ marginBottom: "5px" }}>
                      <strong>& ĐBCLGD-ĐT</strong>
                    </div>
                    <div style={{ fontStyle: "italic" }}>{name}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            <table
              style={{
                width: "100%",
                border: "1px solid black",
                borderCollapse: "collapse",
                marginBottom: "20px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      border: "1px solid black",
                      padding: "15px",
                      width: "85%",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    Nội dung câu hỏi và đáp án
                  </th>
                  <th
                    style={{
                      border: "1px solid black",
                      padding: "15px",
                      width: "15%",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    Điểm
                  </th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q: any, index: number) => (
                  <tr key={q?.id}>
                    <td style={{ border: "1px solid black", padding: "15px" }}>
                      <div style={{ marginBottom: "12px" }}>
                        <strong>
                          Câu {q?.order || index + 1}({formatQuestionPoint(q?.question?.point)}{" "}
                          điểm):
                        </strong>{" "}
                        <span
                          dangerouslySetInnerHTML={{
                            __html: renderQuestionExamHtml(q?.question ?? {}),
                          }}
                        />
                      </div>
                      <div style={{ marginTop: "8px" }}>
                        <strong>Đáp án:</strong>{" "}
                        <span
                          dangerouslySetInnerHTML={{
                            __html: renderQuestionAnswerHtml(q?.question ?? {}),
                          }}
                        />
                      </div>
                    </td>
                    <td
                      style={{
                        border: "1px solid black",
                        padding: "10px",
                        textAlign: "center",
                        verticalAlign: "middle",
                      }}
                    >
                      {formatQuestionPoint(q?.question?.point)}đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default PrintExplanation
