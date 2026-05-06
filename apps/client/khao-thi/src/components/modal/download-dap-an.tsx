import { queryClient } from "@api/index"
import { renderWithMath } from "@components/commons/rich-text-editor/renderWithMath"
import { useFindUniqueExamBank, useUpdateExamBank } from "@workspace/db/hooks"
import { getMinioUrl } from "@workspace/libs/utils"
import { Button, Flex, Input, Modal } from "antd"
import { TemplateHandler } from "easy-template-x"
import { useEffect, useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"
import { convertHtmlBreaks, saveFile } from "@/utils/saveFile"

const PrintExplanation = () => {
  const [name, setName] = useState("Nguyễn Văn A")
  const [duration, setDuration] = useState("")
  const { isOpen, onClose, input } = useDisclosure<{
    id: string
  }>({
    tag: "PrintExplanation",
  })

  const [hasDownloaded, setHasDownloaded] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const { data } = useFindUniqueExamBank(
    {
      where: {
        id: input?.id,
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
        examMatrix: {
          include: {
            examFramework: {
              select: {
                time: true,
              },
            },
          },
        },
      },
    },
    {
      enabled: !!input?.id,
    }
  )

  const subjectClassName = data?.subjectClass?.name || ""

  // Tự động fill thời gian từ examFramework
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

  // Download file
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
        questions:
          data.questions?.map((q, index) => {
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
              order: String(q?.order || index + 1),
              point: Number(question?.point || 0).toFixed(1),
              content: convertHtmlBreaks(question?.content || ""),
              answer: answer,
            }
          }) || [],
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
      await updateExamBank({
        where: {
          id: input?.id,
        },
        data: {
          isLock: true,
        },
      })
    }
    setHasDownloaded(false)
    queryClient.invalidateQueries({
      queryKey: ["ExamBank"],
    })
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
                /* Force all text to black when printing (avoid browser default link blue) */
                #print-explanation, #print-explanation * {
                  color: #000 !important;
                }
                #print-explanation a,
                #print-explanation a:visited,
                #print-explanation a:hover,
                #print-explanation a:active {
                  color: #000 !important;
                  text-decoration: none !important;
                }
              }
            `}
          </style>

          <div id="print-explanation">
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

            {/* Class info */}
            <div
              style={{
                textAlign: "center",
                marginBottom: "10px",
                marginLeft: "10%",
              }}
            >
              <span style={{ fontWeight: "normal" }}>(Dùng cho lớp: {subjectClassName})</span>
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
                {data?.questions?.map((q, index: number) => (
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
                          Câu {q?.order || index + 1}({Number(q?.question?.point || 0).toFixed(1)}{" "}
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
                        {q?.question?.multipleChoiceOptions &&
                          q?.question?.multipleChoiceOptions?.length > 0 && (
                            <div>
                              {q.question.multipleChoiceOptions.map((option) => (
                                <div
                                  key={option?.id}
                                  style={{
                                    marginLeft: "20px",
                                    color: "#000",
                                    fontWeight: "normal",
                                  }}
                                >
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: renderWithMath(option?.content || ""),
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        {q?.question?.orderingItems && q?.question?.orderingItems?.length > 0 && (
                          <div>
                            {q.question.orderingItems.map((option) => (
                              <div
                                key={option?.id}
                                style={{
                                  marginLeft: "20px",
                                  color: "#000",
                                  fontWeight: "normal",
                                }}
                              >
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: renderWithMath(option?.content || ""),
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ marginTop: "8px" }}>
                        <strong>Đáp án:</strong>{" "}
                        {q?.question?.multipleChoiceOptions &&
                        q?.question?.multipleChoiceOptions?.length > 0 ? (
                          <span
                            dangerouslySetInnerHTML={{
                              __html: renderWithMath(
                                q.question.multipleChoiceOptions
                                  .filter((option) => option?.isCorrect)
                                  .map((option) => option?.content || "")
                                  .join(", ")
                              ),
                            }}
                          />
                        ) : q?.question?.orderingItems && q?.question?.orderingItems?.length > 0 ? (
                          <span>
                            {q.question.orderingItems
                              .sort((a, b) => (a?.correctOrder || 0) - (b?.correctOrder || 0))
                              .map((_, idx) => String.fromCharCode(65 + idx))
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
        </div>
      </div>
    </Modal>
  )
}

export default PrintExplanation
