import { queryClient } from "@api/index"
import { renderWithMath } from "@components/commons/rich-text-editor/renderWithMath"
import { useFindUniqueExamBank, useUpdateExamBank } from "@workspace/db/hooks"
import { useGetExamBankWithGrouping } from "@workspace/libs/api/exam"
import { getMinioUrl } from "@workspace/libs/utils"
import { Button, Flex, Input, Modal } from "antd"
import { TemplateData, TemplateHandler } from "easy-template-x"
import { useEffect, useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"
import { convertHtmlBreaks, saveFile } from "@/utils/saveFile"
import { useSession } from "@workspace/auth/react"

const PrintExamBank = () => {
  const { data: me } = useSession()
  const [name, setName] = useState(me?.fullName || "")
  const [duration, setDuration] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const { isOpen, onClose, input } = useDisclosure<{
    id: string
  }>({
    tag: "PrintExamBank",
  })

  const [hasDownloaded, setHasDownloaded] = useState(false)
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

  const { mutateAsync: fetchGroupedQuestions, data: groupedResponse } = useGetExamBankWithGrouping()
  const groupedData = groupedResponse?.status === 200 ? groupedResponse.data : undefined

  useEffect(() => {
    if (input?.id && data?.isGroup != null) {
      fetchGroupedQuestions({ data: { id: input.id, isGroup: data.isGroup ?? false } })
    }
  }, [input?.id, data?.isGroup, fetchGroupedQuestions])

  const subjectClassName = data?.subjectClass?.name || ""

  useEffect(() => {
    if (data?.examMatrix?.examFramework?.time) {
      setDuration(String(data.examMatrix.examFramework.time))
    }
  }, [data?.examMatrix?.examFramework?.time])

  const { mutateAsync: updateExamBank } = useUpdateExamBank()

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `De-Thi-${data?.exam?.subjectVersion?.name || "Exam"}`,
  })

  const examDate = data?.examDay ? new Date(data.examDay) : new Date()
  const day = examDate.getDate()
  const month = examDate.getMonth() + 1
  const year = examDate.getFullYear()

  const handleDownload = async () => {
    setIsExporting(true)
    if (!data || !groupedData) return
    const templateUrl = groupedData.isGroup
      ? getMinioUrl("mta/template/template-de-thi-tieu-de.docx")
      : getMinioUrl("mta/template/template-de-thi-bk.docx")
    const res = await fetch(templateUrl)
    const templateFile = await res.blob()

    const mapQuestion = (q: any, index: number) => ({
      order: String(q?.order || index + 1),
      point: Number(q?.question?.point || 0).toFixed(1),
      content: convertHtmlBreaks(q?.question?.content) || "",
    })

    const baseTemplateData = {
      examCode: data.examCode || "",
      subjectName: data.exam?.subjectVersion?.name || "",
      semesterName: data.exam?.semester?.name || "",
      className: data.subjectClass?.name || "",
      duration: String(
        duration || data.examMatrix?.examFramework?.time || data.exam?.duration || ""
      ),
      isNote:
        data?.isNote === true
          ? `Được sử dụng tài liệu${data?.explain ? ` ${data.explain}` : ""}`
          : `Không được sử dụng tài liệu${data?.explain ? ` ${data.explain}` : ""}`,
      day: String(day),
      month: String(month),
      year: String(year),
      teacherName: name,
    }

    const templateData: TemplateData = groupedData.isGroup
      ? {
          ...baseTemplateData,
          listQuestionChoice: (groupedData.listQuestionChoice ?? []).map(mapQuestion),
          listQuestionEssay: (groupedData.listQuestionEssay ?? []).map((q: any, i: number) =>
            mapQuestion(q, (groupedData.listQuestionChoice?.length ?? 0) + i)
          ),
        }
      : {
          ...baseTemplateData,
          questions: (groupedData.questions ?? []).map(mapQuestion),
        }

    const handler = new TemplateHandler()
    const doc = await handler.process(templateFile, templateData)
    saveFile(`De-Thi-${data?.exam?.subjectVersion?.name}.docx`, doc)
    setHasDownloaded(true)
    setIsExporting(false)
  }

  const handleClose = async () => {
    if (hasDownloaded) {
      await updateExamBank({
        where: { id: input?.id },
        data: { isLock: true },
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
          <span>Xem trước đề thi</span>
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
          <Button type="primary" onClick={handleDownload} loading={isExporting}>
            {isExporting ? "Đang xuất..." : "Tải xuống"}
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
                #print-exam-bank, #print-exam-bank * {
                  color: #000 !important;
                }
                #print-exam-bank a,
                #print-exam-bank a:visited,
                #print-exam-bank a:hover,
                #print-exam-bank a:active {
                  color: #000 !important;
                  text-decoration: none !important;
                }
              }
            `}
          </style>

          <div id="print-exam-bank">
            {/* Header */}
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                  BAN KHẢO THÍ & ĐBCLGD-ĐT
                </div>
                <div style={{ fontWeight: "bold" }}>{data?.exam?.semester?.name}</div>
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
                      <strong>Đề thi số: {data?.examCode}</strong>
                    </div>
                    <div style={{ textAlign: "center", marginBottom: "5px" }}>
                      <strong>Học phần: {data?.exam?.subjectVersion?.name}</strong>
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
                      <strong>BAN KHẢO THÍ & ĐBCLGD-ĐT</strong>
                    </div>
                    <div style={{ fontStyle: "italic" }}>{name}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Questions */}
            <div style={{ marginBottom: "30px" }}>
              {groupedData?.isGroup ? (
                <div>
                  <div className="font-semibold mb-2">I. Phần trắc nghiệm</div>
                  {groupedData.listQuestionChoice?.map((q: any, qIndex: number) => (
                    <div key={q?.id} style={{ marginBottom: "15px" }}>
                      <div>
                        <strong>
                          Câu {qIndex + 1}({Number(q?.question?.point || 0).toFixed(1)} điểm):
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
                    </div>
                  ))}
                  <div className="font-semibold mb-2">II. Phần tự luận</div>
                  {groupedData.listQuestionEssay?.map((q: any, qIndex: number) => (
                    <div key={q?.id} style={{ marginBottom: "15px" }}>
                      <div>
                        <strong>
                          Câu {(groupedData.listQuestionChoice?.length ?? 0) + qIndex + 1}(
                          {Number(q?.question?.point || 0).toFixed(1)} điểm):
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
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {groupedData?.questions?.map((q: any, index: number) => (
                    <div key={q?.id} style={{ marginBottom: "15px" }}>
                      <div>
                        <strong>
                          Câu {index + 1}({Number(q?.question?.point || 0).toFixed(1)} điểm):
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
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: "40px" }}>
              <div style={{ fontWeight: "bold", marginBottom: "10px" }}>-----HẾT-----</div>
              <div style={{ fontStyle: "italic", marginBottom: "20px" }}>
                {data?.isNote === true
                  ? `(Được sử dụng tài liệu${data?.explain ? ` ${data.explain}` : ""})`
                  : `(Không được sử dụng tài liệu${data?.explain ? ` ${data.explain}` : ""})`}
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
        </div>
      </div>
    </Modal>
  )
}

export default PrintExamBank
