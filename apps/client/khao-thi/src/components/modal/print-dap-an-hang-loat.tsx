import { queryClient } from "@api/index"
import { renderWithMath } from "@components/commons/rich-text-editor/renderWithMath"
import type { Prisma } from "@workspace/db/client"
import { useFindManyExamBank, useUpdateExamBank } from "@workspace/db/hooks"
import { getMinioUrl } from "@workspace/libs/utils"
import { Button, Divider, Flex, Input, Modal } from "antd"
import { TemplateHandler } from "easy-template-x"
import { useEffect, useMemo, useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"
import { convertHtmlBreaks, saveFile } from "@/utils/saveFile"

type ExamBankQuestionType = Prisma.ExamBankGetPayload<{
  include: {
    exam: {
      include: {
        semester: true
        subjectVersion: true
      }
    }
    questions: {
      include: {
        question: {
          include: {
            multipleChoiceOptions: true
            fillInBlankSlots: true
            orderingItems: true
          }
        }
      }
    }
    subjectClass: {
      select: {
        id: true
        name: true
      }
    }
  }
}>

const PrintBatchExplanation = () => {
  const [name, setName] = useState("Nguyễn Văn A")
  const [duration, setDuration] = useState("")
  const { isOpen, onClose, input } = useDisclosure<{
    ids: string[]
  }>({
    tag: "PrintBatchExplanation",
  })

  const [hasDownloaded, setHasDownloaded] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const { data: exams = [] } = useFindManyExamBank(
    {
      where: {
        id: {
          in: input?.ids || [],
        },
      },
      include: {
        exam: {
          include: {
            semester: true,
            subjectVersion: true,
          },
        },
        questions: {
          include: {
            question: {
              include: {
                multipleChoiceOptions: true,
                fillInBlankSlots: true,
                orderingItems: true,
              },
            },
          },
        },
        subjectClass: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        examCode: "asc",
      },
    },
    {
      enabled: !!input?.ids && input?.ids.length > 0,
    }
  )

  const dataRender = useMemo(() => {
    if (exams?.length <= 0) return []
    const result = exams.map((i) => {
      const listQuestionChoice = i?.questions.filter((q) => q?.question?.type !== "ESSAY")
      const listQuestionEssay = i?.questions.filter((q) => q?.question?.type === "ESSAY")
      if (i?.isGroup) {
        return {
          ...i,
          questions: [...listQuestionChoice, ...listQuestionEssay],
          listQuestionChoice: listQuestionChoice,
          listQuestionEssay: listQuestionEssay,
        }
      }
      return {
        ...i,
        listQuestionChoice: listQuestionChoice,
        listQuestionEssay: listQuestionEssay,
      }
    })
    return result
  }, [exams])
  // Tự động fill thời gian từ examTime (API tạo đề) của exam đầu tiên
  useEffect(() => {
    if (exams.length > 0 && exams[0]?.examTime != null) {
      setDuration(String(exams[0].examTime))
    }
  }, [exams])

  const { mutateAsync: updateExamBank } = useUpdateExamBank()

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Dap-An-Hang-Loat-${exams[0]?.exam?.subjectVersion?.name || "Exam"}`,
  })

  // Download file
  const handleDownload = async () => {
    if (!exams || exams.length === 0) return

    const res = await fetch(getMinioUrl("mta/template/template-dap-an-hang-loat-bk.docx"))
    const templateFile = await res.blob()

    const templateData = {
      exams: exams.map((exam, index) => {
        const examDate = exam?.examDay ? new Date(exam.examDay) : new Date()
        return {
          semester: exam?.exam?.semester?.name || "",
          className: exam?.subjectClass?.name || "",
          day: examDate.getDate(),
          month: examDate.getMonth() + 1,
          year: examDate.getFullYear(),
          semesterName: exam?.exam?.semester?.name || "",
          examCode: exam?.examCode || "",
          subjectName: exam?.exam?.subjectVersion?.name || "",
          duration: duration || exam?.examTime || exam?.exam?.duration || 30,
          teacherName: name,
          questions:
            exam?.questions?.map((q, qIndex) => {
              const question = q?.question
              let answer = ""

              // Xử lý đáp án theo loại câu hỏi
              if (question?.multipleChoiceOptions && question?.multipleChoiceOptions?.length > 0) {
                // Lấy các đáp án đúng
                const correctAnswers = question.multipleChoiceOptions
                  .filter((option) => option?.isCorrect)
                  .map((option) => convertHtmlBreaks(option?.content || ""))
                  .join(", ")
                answer = correctAnswers
              } else if (question?.orderingItems && question?.orderingItems?.length > 0) {
                // Hiển thị thứ tự đúng
                const orderSequence = question.orderingItems
                  .sort((a, b) => (a?.correctOrder || 0) - (b?.correctOrder || 0))
                  .map((_, idx) => String.fromCharCode(65 + idx))
                  .join(" → ")
                answer = orderSequence
              } else {
                // Các loại câu hỏi khác (tự luận, điền chỗ trống, v.v.)
                answer = convertHtmlBreaks(question?.explanation || "")
              }

              return {
                order: q?.order || qIndex + 1,
                point: Number(question?.point || 0).toFixed(1),
                content: convertHtmlBreaks(question?.content || ""),
                answer: answer,
              }
            }) || [],
          isLastExam: index === exams.length - 1,
        }
      }),
    }

    const handler = new TemplateHandler()
    const doc = await handler.process(templateFile, templateData)
    saveFile(`Dap-An-Hang-Loat-${exams[0]?.exam?.subjectVersion?.name}.docx`, doc)
    setHasDownloaded(true)
  }

  const handleClose = async () => {
    if (hasDownloaded) {
      // Cập nhật isLock cho tất cả các đề đã tải
      await Promise.all(
        exams.map((exam) =>
          updateExamBank({
            where: { id: exam.id },
            data: { isLock: true },
          })
        )
      )
    }
    setHasDownloaded(false)
    queryClient.invalidateQueries({
      queryKey: ["ExamBank"],
    })
    onClose()
  }

  // Render preview cho một đáp án
  const renderAnswerPreview = (exam: ExamBankQuestionType, index: number) => {
    const examDate = exam?.examDay ? new Date(exam.examDay) : new Date()
    const day = examDate.getDate()
    const month = examDate.getMonth() + 1
    const year = examDate.getFullYear()

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
          {/* Header */}
          <div
            style={{
              position: "relative",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                BAN KHẢO THÍ & ĐBCLGD-ĐT
              </div>
              <div style={{ fontWeight: "bold" }}>{exam?.exam?.semester?.name || "HKI"}</div>
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

          {/* Class info */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "10px",
              marginLeft: "10%",
            }}
          >
            <span style={{ fontWeight: "normal" }}>
              (Dùng cho lớp: {exam?.subjectClass?.name || ""})
            </span>
          </div>

          {/* Date */}
          <div
            style={{
              textAlign: "right",
              fontStyle: "italic",
              marginBottom: "15px",
            }}
          >
            Ngày {day} tháng {month} năm {year}
          </div>

          {/* Main info table */}
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
                    <strong>Đề thi số : {exam?.examCode || "001"}</strong>
                  </div>
                  <div style={{ textAlign: "center", marginBottom: "5px" }}>
                    <strong>Học phần: {exam?.exam?.subjectVersion?.name || ""}</strong>
                  </div>
                  <div style={{ textAlign: "center", marginBottom: "10px" }}>
                    <strong>
                      Thời gian làm bài: {duration || exam?.examTime || exam?.exam?.duration} phút
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

          {/* Questions and Answers Table */}
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
              {exam?.questions?.map((q: any, qIndex: number) => (
                <tr key={q?.id}>
                  <td
                    style={{
                      border: "1px solid black",
                      padding: "15px",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: "12px",
                      }}
                    >
                      <strong>
                        Câu {q?.order || qIndex + 1}({Number(q?.question?.point || 0).toFixed(1)}{" "}
                        điểm):
                      </strong>{" "}
                      <span
                        dangerouslySetInnerHTML={{
                          __html: renderWithMath(q?.question?.content || "")
                            .replace(/<p[^>]*>/g, "")
                            .replace(/<\/p>/g, " ")
                            .trim(),
                        }}
                      />
                    </div>
                    <div style={{ marginTop: "8px" }}>
                      <strong>Đáp án:</strong>{" "}
                      {q?.question?.multipleChoiceOptions &&
                      q?.question?.multipleChoiceOptions?.length > 0 ? (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: renderWithMath(
                              q.question.multipleChoiceOptions
                                .filter((option: any) => option?.isCorrect)
                                .map((option: any) => option?.content || "")
                                .join(", ")
                            ),
                          }}
                        />
                      ) : q?.question?.orderingItems && q?.question?.orderingItems?.length > 0 ? (
                        <span>
                          {q.question.orderingItems
                            .sort(
                              (a: any, b: any) => (a?.correctOrder || 0) - (b?.correctOrder || 0)
                            )
                            .map((_: any, idx: number) => String.fromCharCode(65 + idx))
                            .join(" -> ")}
                        </span>
                      ) : (
                        <span
                          dangerouslySetInnerHTML={{
                            __html: renderWithMath(q?.question?.explanation || "")
                              .replace(/<p[^>]*>/g, "")
                              .replace(/<\/p>/g, " ")
                              .trim(),
                          }}
                        />
                      )}
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
                    {Number(q?.question?.point || 0).toFixed(1)}đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Divider giữa các đáp án */}
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
            Tải xuống tất cả ({exams.length} đáp án)
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
        <div ref={printRef}>
          {dataRender.length > 0 ? (
            dataRender.map((exam, index) => renderAnswerPreview(exam, index))
          ) : (
            <div style={{ textAlign: "center", padding: "40px" }}>
              Không có đáp án nào được chọn
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default PrintBatchExplanation
