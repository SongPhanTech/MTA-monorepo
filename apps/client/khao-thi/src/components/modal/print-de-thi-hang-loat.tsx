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
import { renderQuestionExamHtml } from "@/utils/cluster-question-utils"
import { useSession } from "@workspace/auth/react"

export type ExamBankType = Prisma.ExamBankGetPayload<{
  include: {
    exam: {
      include: {
        semester: true
        subjectVersion: true
      }
    }
    subjectClass: {
      select: {
        name: true
        id: true
        code: true
      }
    }
    examMatrix: {
      include: {
        examFramework: {
          select: {
            time: true
          }
        }
      }
    }
  }
}>

const PrintBatchExamBank = () => {
  const { data: me } = useSession()
  const [name, setName] = useState(me?.fullName || "")
  const [duration, setDuration] = useState("")
  const { isOpen, onClose, input } = useDisclosure<{
    ids: string[]
  }>({
    tag: "PrintBatchExamBank",
  })

  const [hasDownloaded, setHasDownloaded] = useState(false)
  const [groupedExamsData, setGroupedExamsData] = useState<Map<string, ExamBankQuestionsResult>>(
    new Map()
  )
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
        subjectClass: {
          select: {
            name: true,
            id: true,
            code: true,
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
      orderBy: {
        examCode: "asc",
      },
    },
    {
      enabled: !!input?.ids && input?.ids.length > 0,
    }
  )

  useEffect(() => {
    if (exams.length === 0) return
    Promise.all(
      exams.map((exam) => getExamBankWithGrouping({ id: exam.id, isGroup: exam.isGroup ?? false }))
    ).then((results) => {
      const map = new Map<string, ExamBankQuestionsResult>()
      exams.forEach((exam, i) => {
        const result = results[i]
        if (result.status === 200) {
          map.set(exam.id, result.data)
        }
      })
      setGroupedExamsData(map)
    })
  }, [exams])

  // Tự động fill thời gian từ examFramework của exam đầu tiên
  useEffect(() => {
    if (exams.length > 0 && exams[0]?.examMatrix?.examFramework?.time) {
      setDuration(String(exams[0].examMatrix.examFramework.time))
    }
  }, [exams])

  const { mutateAsync: updateExamBank } = useUpdateExamBank()

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `De-Thi-Hang-Loat-${exams[0]?.exam?.subjectVersion?.name || "Exam"}`,
  })

  // Download file
  const handleDownload = async () => {
    if (!exams || groupedExamsData.size === 0) return
    const res = await fetch(getMinioUrl("mta/template/template-de-thi-hang-loat.docx"))
    const templateFile = await res.blob()

    const mapQuestion = (q: any, index: number) => ({
      order: index + 1,
      point: formatQuestionPoint(q?.question?.point),
      content: convertHtmlBreaks(renderQuestionExamHtml(q?.question ?? {})) || "",
    })

    const templateData = {
      exams: exams.map((exam, index) => {
        const examDate = exam?.examDay ? new Date(exam.examDay) : new Date()
        const grouped = groupedExamsData.get(exam.id)

        const allQuestions = grouped?.isGroup
          ? [...(grouped.listQuestionChoice ?? []), ...(grouped.listQuestionEssay ?? [])]
          : (grouped?.questions ?? [])

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
          isNote:
            exam?.isNote === true
              ? `Được sử dụng tài liệu${exam?.explain ? ` ${exam.explain}` : ""}`
              : `Không được sử dụng tài liệu${exam?.explain ? ` ${exam.explain}` : ""}`,
          questions: allQuestions.map(mapQuestion),
          isLastExam: index === exams.length - 1,
        }
      }),
    }

    const handler = new TemplateHandler()
    const doc = await handler.process(templateFile, templateData)
    saveFile(`De-Thi-Hang-Loat-${exams[0]?.exam?.subjectVersion?.name}.docx`, doc)
    setHasDownloaded(true)
  }

  const handleClose = async () => {
    if (hasDownloaded) {
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

  const renderExamPreview = (exam: ExamBankType, index: number) => {
    const examDate = exam?.examDay ? new Date(exam.examDay) : new Date()
    const day = examDate.getDate()
    const month = examDate.getMonth() + 1
    const year = examDate.getFullYear()
    const grouped = groupedExamsData.get(exam.id)

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
              <div style={{ fontWeight: "bold" }}>{exam?.exam?.semester?.name}</div>
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
                    <strong>Đề thi số: {exam?.examCode}</strong>
                  </div>
                  <div style={{ textAlign: "center", marginBottom: "5px" }}>
                    <strong>Học phần: {exam?.exam?.subjectVersion?.name}</strong>
                  </div>
                  <div style={{ textAlign: "center", marginBottom: "10px" }}>
                    <strong>
                      Thời gian làm bài:{" "}
                      {duration || exam?.examMatrix?.examFramework?.time || exam?.exam?.duration}{" "}
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
                    <strong>BAN KHẢO THÍ & ĐBCLGD-ĐT</strong>
                  </div>
                  <div style={{ fontStyle: "italic" }}>{name}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Questions */}
          <div style={{ marginBottom: "30px" }}>
            {grouped?.isGroup ? (
              <div>
                <div className="font-semibold mb-2">I. Phần trắc nghiệm</div>
                {grouped.listQuestionChoice?.map((q: any, qIndex: number) => (
                  <div key={q?.id} style={{ marginBottom: "15px" }}>
                    <div>
                      <strong>
                        Câu {qIndex + 1}({formatQuestionPoint(q?.question?.point)} điểm):
                      </strong>{" "}
                      <span
                        dangerouslySetInnerHTML={{
                          __html: renderQuestionExamHtml(q?.question ?? {}),
                        }}
                      />
                    </div>
                  </div>
                ))}
                <div className="font-semibold mb-2">II. Phần tự luận</div>
                {grouped.listQuestionEssay?.map((q: any, qIndex: number) => (
                  <div key={q?.id} style={{ marginBottom: "15px" }}>
                    <div>
                      <strong>
                        Câu {(grouped.listQuestionChoice?.length ?? 0) + qIndex + 1}(
                        {formatQuestionPoint(q?.question?.point)} điểm):
                      </strong>{" "}
                      <span
                        dangerouslySetInnerHTML={{
                          __html: renderQuestionExamHtml(q?.question ?? {}),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {grouped?.questions?.map((q: any, qIndex: number) => (
                  <div key={q?.id} style={{ marginBottom: "15px" }}>
                    <div>
                      <strong>
                        Câu {qIndex + 1}({formatQuestionPoint(q?.question?.point)} điểm):
                      </strong>{" "}
                      <span
                        dangerouslySetInnerHTML={{
                          __html: renderQuestionExamHtml(q?.question ?? {}),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "10px" }}>-----HẾT-----</div>
            <div style={{ fontStyle: "italic", marginBottom: "20px" }}>
              {exam?.isNote === true
                ? `(Được sử dụng tài liệu${exam?.explain ? ` ${exam.explain}` : ""})`
                : `(Không được sử dụng tài liệu${exam?.explain ? ` ${exam.explain}` : ""})`}
            </div>
          </div>

          {/* Note */}
          <div
            style={{
              marginTop: "30px",
              fontStyle: "italic",
              fontWeight: "bold",
            }}
          >
            * Giám thị coi thi không giải thích gì thêm
          </div>
        </div>

        {/* Divider giữa các đề */}
        {index < exams.length - 1 && <Divider style={{ margin: "20px 0", borderColor: "#999" }} />}
      </div>
    )
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-4">
          <span>Xem trước {exams.length} đề thi</span>
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
          <Button type="primary" onClick={handleDownload}>
            Tải xuống tất cả ({exams.length} đề)
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
          <style>
            {`
              @media print {
                /* Force all text to black when printing (avoid browser default link blue) */
                #print-batch-exam-bank, #print-batch-exam-bank * {
                  color: #000 !important;
                }
                #print-batch-exam-bank a,
                #print-batch-exam-bank a:visited,
                #print-batch-exam-bank a:hover,
                #print-batch-exam-bank a:active {
                  color: #000 !important;
                  text-decoration: none !important;
                }
              }
            `}
          </style>

          <div id="print-batch-exam-bank">
            {exams.length > 0 ? (
              exams.map((exam, index) => renderExamPreview(exam, index))
            ) : (
              <div style={{ textAlign: "center", padding: "40px" }}>
                Không có đề thi nào được chọn
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default PrintBatchExamBank
