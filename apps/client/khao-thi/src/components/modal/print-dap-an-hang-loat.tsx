import { queryClient } from "@api/index"
import type { Prisma } from "@workspace/db/client"
import { useFindManyExamBank, useUpdateExamBank } from "@workspace/db/hooks"
import { getExamBankWithGrouping } from "@workspace/libs/api/exam"
import type { ExamBankQuestionsResult } from "@workspace/libs/api/schemas/examBankQuestionsResult"
import { getMinioUrl, formatQuestionPoint } from "@workspace/libs/utils"
import { Button, Divider, Flex, Input, Modal } from "antd"
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

export type ExamBankType = Prisma.ExamBankGetPayload<{
  include: {
    exam: { include: { semester: true; subjectVersion: true } }
    subjectClass: { select: { id: true; name: true } }
    examMatrix: { include: { examFramework: { select: { time: true } } } }
  }
}>

const flattenGroupedQuestions = (grouped?: ExamBankQuestionsResult) =>
  grouped?.isGroup
    ? [...(grouped.listQuestionChoice ?? []), ...(grouped.listQuestionEssay ?? [])]
    : (grouped?.questions ?? [])

const PrintBatchExplanation = () => {
  const { data: me } = useSession()
  const [name, setName] = useState(me?.fullName || "")
  const [duration, setDuration] = useState("")
  const { isOpen, onClose, input } = useDisclosure<{ ids: string[] }>({
    tag: "PrintBatchExplanation",
  })

  const [hasDownloaded, setHasDownloaded] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [groupedExamsData, setGroupedExamsData] = useState<Map<string, ExamBankQuestionsResult>>(
    new Map()
  )
  const printRef = useRef<HTMLDivElement>(null)

  const { data: exams = [] } = useFindManyExamBank(
    {
      where: { id: { in: input?.ids || [] } },
      include: {
        exam: { include: { semester: true, subjectVersion: true } },
        subjectClass: { select: { id: true, name: true } },
        examMatrix: { include: { examFramework: { select: { time: true } } } },
      },
      orderBy: { examCode: "asc" },
    },
    { enabled: !!input?.ids && input?.ids.length > 0 }
  )

  useEffect(() => {
    if (exams.length === 0) return
    Promise.all(
      exams.map((exam) => getExamBankWithGrouping({ id: exam.id, isGroup: exam.isGroup ?? false }))
    ).then((results) => {
      const map = new Map<string, ExamBankQuestionsResult>()
      exams.forEach((exam, i) => {
        if (results[i].status === 200) map.set(exam.id, results[i].data)
      })
      setGroupedExamsData(map)
    })
  }, [exams])

  useEffect(() => {
    if (exams.length > 0 && exams[0]?.examMatrix?.examFramework?.time) {
      setDuration(String(exams[0].examMatrix.examFramework.time))
    }
  }, [exams])

  const { mutateAsync: updateExamBank } = useUpdateExamBank()

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Dap-An-Hang-Loat-${exams[0]?.exam?.subjectVersion?.name || "Exam"}`,
  })

  const handleDownload = async () => {
    if (!exams.length || groupedExamsData.size === 0) return
    setIsDownloading(true)
    try {
      const res = await fetch(getMinioUrl("mta/template/template-dap-an-hang-loat-bk.docx"))
      const templateFile = await res.blob()

      const templateData = {
        exams: exams.map((exam, index) => {
          const examDate = exam?.examDay ? new Date(exam.examDay) : new Date()
          const questions = flattenGroupedQuestions(groupedExamsData.get(exam.id))

          return {
            semester: exam?.exam?.semester?.name || "",
            className: exam?.subjectClass?.name || "",
            day: examDate.getDate(),
            month: examDate.getMonth() + 1,
            year: examDate.getFullYear(),
            semesterName: exam?.exam?.semester?.name || "",
            examCode: exam?.examCode || "",
            subjectName: exam?.exam?.subjectVersion?.name || "",
            duration: duration || exam?.examMatrix?.examFramework?.time || exam?.exam?.duration || 30,
            teacherName: name,
            questions: questions.map((q: any, qIndex: number) => ({
              order: q?.order || qIndex + 1,
              point: formatQuestionPoint(q?.question?.point),
              content: convertHtmlBreaks(renderQuestionExamHtml(q?.question ?? {})) || "",
              answer: convertHtmlBreaks(plainQuestionAnswerText(q?.question ?? {})),
            })),
            isLastExam: index === exams.length - 1,
          }
        }),
      }

      const handler = new TemplateHandler()
      const doc = await handler.process(templateFile, templateData)
      saveFile(`Dap-An-Hang-Loat-${exams[0]?.exam?.subjectVersion?.name}.docx`, doc)
      setHasDownloaded(true)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleClose = async () => {
    if (hasDownloaded) {
      await Promise.all(
        exams.map((exam) => updateExamBank({ where: { id: exam.id }, data: { isLock: true } }))
      )
    }
    setHasDownloaded(false)
    queryClient.invalidateQueries({ queryKey: ["ExamBank"] })
    onClose()
  }

  const renderAnswerPreview = (exam: ExamBankType, index: number) => {
    const examDate = exam?.examDay ? new Date(exam.examDay) : new Date()
    const questions = flattenGroupedQuestions(groupedExamsData.get(exam.id))

    return (
      <div key={exam.id}>
        <div
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
          <div style={{ position: "relative", marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>BAN KHẢO THÍ & ĐBCLGD-ĐT</div>
              <div style={{ fontWeight: "bold" }}>{exam?.exam?.semester?.name || "HKI"}</div>
            </div>
            <div style={{ position: "absolute", left: "55%", top: "0", transform: "translateX(-50%)", fontWeight: "bold" }}>
              PHIẾU ĐỀ THI
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: "10px", marginLeft: "10%" }}>
            <span>(Dùng cho lớp: {exam?.subjectClass?.name || ""})</span>
          </div>

          <div style={{ textAlign: "right", fontStyle: "italic", marginBottom: "15px" }}>
            Ngày {examDate.getDate()} tháng {examDate.getMonth() + 1} năm {examDate.getFullYear()}
          </div>

          <table style={{ width: "100%", border: "1px solid black", borderCollapse: "collapse", marginBottom: "20px" }}>
            <tbody>
              <tr>
                <td style={{ border: "1px solid black", padding: "10px", width: "25%", textAlign: "center", verticalAlign: "middle" }}>
                  <strong>Giáo viên ra đề</strong>
                </td>
                <td style={{ border: "1px solid black", padding: "10px", width: "50%", verticalAlign: "middle" }}>
                  <div style={{ textAlign: "center", marginBottom: "5px" }}>
                    <strong>Đề thi số : {exam?.examCode || "001"}</strong>
                  </div>
                  <div style={{ textAlign: "center", marginBottom: "5px" }}>
                    <strong>Học phần: {exam?.exam?.subjectVersion?.name || ""}</strong>
                  </div>
                  <div style={{ textAlign: "center", marginBottom: "10px" }}>
                    <strong>
                      Thời gian làm bài:{" "}
                      {duration || exam?.examMatrix?.examFramework?.time || exam?.exam?.duration} phút
                    </strong>
                  </div>
                </td>
                <td style={{ border: "1px solid black", padding: "10px", width: "25%", textAlign: "center", verticalAlign: "middle" }}>
                  <div style={{ marginBottom: "5px" }}><strong>Ban Khảo thi</strong></div>
                  <div style={{ marginBottom: "5px" }}><strong>& ĐBCLGD-ĐT</strong></div>
                  <div style={{ fontStyle: "italic" }}>{name}</div>
                </td>
              </tr>
            </tbody>
          </table>

          <table style={{ width: "100%", border: "1px solid black", borderCollapse: "collapse", marginBottom: "20px" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid black", padding: "15px", width: "85%", textAlign: "center", fontWeight: "bold" }}>
                  Nội dung câu hỏi và đáp án
                </th>
                <th style={{ border: "1px solid black", padding: "15px", width: "15%", textAlign: "center", fontWeight: "bold" }}>
                  Điểm
                </th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q: any, qIndex: number) => (
                <tr key={q?.id}>
                  <td style={{ border: "1px solid black", padding: "15px" }}>
                    <div style={{ marginBottom: "12px" }}>
                      <strong>
                        Câu {q?.order || qIndex + 1}({formatQuestionPoint(q?.question?.point)} điểm):
                      </strong>{" "}
                      <span dangerouslySetInnerHTML={{ __html: renderQuestionExamHtml(q?.question ?? {}) }} />
                    </div>
                    <div style={{ marginTop: "8px" }}>
                      <strong>Đáp án:</strong>{" "}
                      <span dangerouslySetInnerHTML={{ __html: renderQuestionAnswerHtml(q?.question ?? {}) }} />
                    </div>
                  </td>
                  <td style={{ border: "1px solid black", padding: "10px", textAlign: "center", verticalAlign: "middle" }}>
                    {formatQuestionPoint(q?.question?.point)}đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {index < exams.length - 1 && <Divider style={{ margin: "20px 0", borderColor: "#999" }} />}
      </div>
    )
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-4">
          <span>Xem trước {exams.length} đáp án</span>
          <div className="flex-1 flex items-center justify-center gap-4">
            <Input placeholder="Nhập tên" value={name} onChange={(e) => setName(e.target.value)} className="w-56" />
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
            Tải xuống tất cả ({exams.length} đáp án)
          </Button>
        </Flex>
      }
    >
      <div style={{ maxHeight: "70vh", overflow: "auto", border: "1px solid #d9d9d9", padding: "16px" }}>
        <div ref={printRef}>
          <style>
            {`
              @media print {
                #print-batch-explanation, #print-batch-explanation * { color: #000 !important; }
                #print-batch-explanation a, #print-batch-explanation a:visited,
                #print-batch-explanation a:hover, #print-batch-explanation a:active {
                  color: #000 !important; text-decoration: none !important;
                }
              }
            `}
          </style>
          <div id="print-batch-explanation">
            {exams.length > 0 ? (
              exams.map((exam, index) => renderAnswerPreview(exam, index))
            ) : (
              <div style={{ textAlign: "center", padding: "40px" }}>Không có đáp án nào được chọn</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default PrintBatchExplanation
