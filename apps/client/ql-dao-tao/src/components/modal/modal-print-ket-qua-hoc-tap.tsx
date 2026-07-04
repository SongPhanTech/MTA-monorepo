import { PrinterOutlined } from "@ant-design/icons"
import { useScoreConverter } from "@hooks/scoreConverter"
import { $Enums, SubjectRequirementType } from "@workspace/db/client"
import { useFindManySemester, useFindUniqueCurriculumVersion } from "@workspace/db/hooks"
import { useAcademicRankingConverter } from "@workspace/libs/hook/academicRankingConvert"
import { Button, Input, Modal } from "antd"
import dayjs from "dayjs"
import { useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"

dayjs.locale("vi")

type ModalPrintToKQHTInput = {
  dataTable: any
  dataStudent: any
}

const ModalPrintToKQHT = () => {
  const formattedDate = `..., ngày ${dayjs().format("DD")} tháng ${dayjs().format("MM")} năm ${dayjs().format("YYYY")}`
  const printRef = useRef<HTMLDivElement>(null)
  const [signerName, setSignerName] = useState("Đại tá, TS Nguyễn Trọng Lưu")

  const { isOpen, onClose, input } = useDisclosure<ModalPrintToKQHTInput>({
    tag: "ModalPrintToKQHT",
  })

  const studentId = input?.dataStudent?.id
  const trainingCourseId = input?.dataStudent?.fixedClass?.trainingCourseId

  const { data: dataTable } = useFindManySemester(
    {
      where: {
        subjectClasses: {
          some: {
            subjectClassStudent: {
              some: { studentId },
            },
          },
        },
      },
      include: {
        subjectClasses: {
          where: {
            subjectClassStudent: {
              some: { studentId },
            },
          },
          include: {
            subjectClassStudent: {
              where: { studentId },
              include: {
                subjectVersion: true,
                certificates: { include: { archivedCertificate: true } },
                awards: {
                  where: { status: $Enums.ArchivedCertificateStatus.APPROVED },
                  include: { archivedAward: true },
                },
              },
            },
          },
        },
        trainingCoursesStart: {
          where: { id: trainingCourseId ?? undefined },
          include: { scoreConverts: true },
        },
        schoolYear: true,
      },
      orderBy: { createdAt: "asc" },
    },
    { enabled: !!studentId }
  )

  const { data: subjectScoreData } = useFindUniqueCurriculumVersion(
    {
      where: {
        id: input?.dataStudent?.curriculumVersionId,
      },
      include: {
        trainingLanguage: true,
        trainingTime: true,
        trainingLevel: true,
        trainingType: true,
        students: {
          where: { id: input?.dataStudent?.id },
          select: {
            id: true,
            graduationDecision: {
              select: { 
                finalGpa: true,
                finalRanking: {
                  select: {
                    classification: true,
                  },
                },
              },
            },
          },
        },
        curriculum: {
          include: {
            trainingMajor: {
              include: {
                trainingField: true,
              },
            },
          },
        },
        fixedClass: {
          include: {
            trainingCourse: {
              include: {
                scoreConverts: true,
                academicRankingConvert: true,
              },
            },
          },
        },
        trainingBlocks: {
          include: {
            subjects: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    },
    { enabled: !!input?.dataStudent?.curriculumVersionId }
  )

  const academicRankingConvertData =
    subjectScoreData?.fixedClass?.trainingCourse?.academicRankingConvert

  const graduationRankingData = academicRankingConvertData?.filter(
    (item) => item.context === "GRADUATION"
  )

  const graduationBaseScore =
    graduationRankingData?.find((item) => item.base4Min != null)?.baseScore ??
    graduationRankingData?.[0]?.baseScore

  const { convertScore } = useScoreConverter(
    subjectScoreData?.fixedClass?.trainingCourse?.scoreConverts
  )

  const { convertAcademicRanking } = useAcademicRankingConverter(
    graduationRankingData,
    graduationBaseScore
  )

  const finalGpa = subjectScoreData?.students?.[0]?.graduationDecision?.finalGpa
  const gpaScore =
    typeof finalGpa === "number"
      ? finalGpa
      : typeof finalGpa === "string"
        ? Number(finalGpa) || 0
        : finalGpa && typeof finalGpa === "object" && "toNumber" in finalGpa
          ? Number.isFinite((finalGpa as { toNumber: () => number }).toNumber())
            ? (finalGpa as { toNumber: () => number }).toNumber()
            : 0
          : 0

  const toScoreNumber = (value: unknown) => {
    if (typeof value === "number") return value
    if (typeof value === "string") return Number(value) || 0
    if (value && typeof value === "object" && "toNumber" in value) {
      const parsed = (value as { toNumber: () => number }).toNumber()
      return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
  }
  const scoreBySubjectVersionId = new Map<string, any>()
  dataTable?.forEach((semester: any) => {
    semester?.subjectClasses?.forEach((subjectClass: any) => {
      subjectClass?.subjectClassStudent?.forEach((scoreItem: any) => {
        const subjectVersionId = scoreItem?.subjectVersionId
        if (subjectVersionId) {
          const incomingScore = toScoreNumber(scoreItem?.manualFinalScore ?? scoreItem?.finalScore)
          const current = scoreBySubjectVersionId.get(subjectVersionId)
          const currentScore = toScoreNumber(current?.manualFinalScore ?? current?.finalScore)
          if (!current || incomingScore > currentScore) {
            scoreBySubjectVersionId.set(subjectVersionId, scoreItem)
          }
        }
      })
    })
  })
  const supplementaryBySubjectVersionId = new Set<string>()
  dataTable?.forEach((semester: any) => {
    semester?.subjectClasses?.forEach((subjectClass: any) => {
      subjectClass?.subjectClassStudent?.forEach((scoreItem: any) => {
        if (scoreItem?.isImproving && scoreItem?.subjectVersionId) {
          supplementaryBySubjectVersionId.add(scoreItem.subjectVersionId)
        }
      })
    })
  })

  const handlePrint = useReactToPrint({
    contentRef: printRef,
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
      title: "Họ và tên:",
      value: <span className="uppercase">{input?.dataStudent?.userProfile?.fullname}</span>,
    },
    {
      title: "Mã sinh viên:",
      value: <span>{input?.dataStudent?.code}</span>,
    },
    {
      title: "Ngôn ngữ đào tạo:",
      value: <span>{subjectScoreData?.trainingLanguage?.name}</span>,
    },
    {
      title: "Ngành đào tạo:",
      value: <span>{subjectScoreData?.curriculum?.trainingMajor?.trainingField?.name}</span>,
    },
    {
      title: "Chuyên ngành:",
      value: <span>{subjectScoreData?.curriculum?.trainingMajor?.name}</span>,
    },
  ]

  const basicInfoCol2 = [
    {
      title: "Ngày sinh:",
      value: (
        <span>
          {input?.dataStudent?.userProfile?.dateOfBirth &&
            dayjs(input?.dataStudent?.userProfile?.dateOfBirth).format("DD/MM/YYYY")}
        </span>
      ),
    },
    {
      title: "Năm nhập học:",
      value: <span>{input?.dataStudent?.fixedClass?.startYear}</span>,
    },
    {
      title: "Thời gian đào tạo:",
      value: <span>{subjectScoreData?.trainingTime?.name}</span>,
    },
    {
      title: "Bậc đào tạo:",
      value: <span>{subjectScoreData?.trainingLevel?.name}</span>,
    },
    {
      title: "Hình thức đào tạo:",
      value: <span>{subjectScoreData?.trainingType?.name}</span>,
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
          <span>Kết quả học tập</span>
          <Input
            placeholder="Nhập tên người ký"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            className="w-64"
          />
          <Button icon={<PrinterOutlined />} onClick={handlePrint} size="small" type="primary">
            In
          </Button>
        </div>
      }
    >
      <div ref={printRef} className="mx-auto p-6 text-sm leading-relaxed font-times-new-roman">
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

          <div className="mt-4 uppercase text-[20px]">Phụ lục văn bằng</div>
          <div className="text-sm normal-case font-normal italic">
            (Kèm theo bằng tốt nghiệp số hiệu ...)
          </div>
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
                <th rowSpan={2} className="border border-black px-1 py-1 w-[40px] text-center">
                  TT
                </th>
                <th rowSpan={2} className="border border-black px-1 py-1 text-center">
                  Tên học phần
                </th>
                <th rowSpan={2} className="border border-black px-1 py-1 w-[60px] text-center">
                  Số tín chỉ
                </th>
                <th colSpan={3} className="border border-black px-1 py-1 text-center">
                  Điểm học phần
                </th>
              </tr>
              <tr>
                <th className="border border-black px-1 py-1 w-[80px] text-center">
                  Thang điểm 10
                </th>
                <th className="border border-black px-1 py-1 w-[80px] text-center">Thang điểm 4</th>
                <th className="border border-black px-1 py-1 w-[80px] text-center">
                  Thang điểm chữ
                </th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const regularSubjects: any[] = []
                const graduationSubjects: any[] = []

                const sortedSubjects = (subjectScoreData?.trainingBlocks ?? [])
                  .flatMap((block) => block.subjects ?? [])
                  .filter((subjectItem) => subjectItem.useForFinalScore === true)
                  .sort((a, b) => {
                    const semesterA = a.semester ?? Number.MAX_SAFE_INTEGER
                    const semesterB = b.semester ?? Number.MAX_SAFE_INTEGER
                    if (semesterA !== semesterB) {
                      return semesterA - semesterB
                    }
                    return (a.subject?.name ?? "").localeCompare(b.subject?.name ?? "", "vi")
                  })

                sortedSubjects.forEach((subjectItem, index: number) => {
                  if (subjectItem.graduation) {
                    graduationSubjects.push({ subjectItem, index })
                  } else {
                    regularSubjects.push({ subjectItem, index })
                  }
                })

                const regularRows = regularSubjects?.map(({ subjectItem }, originalIndex) => {
                  const subject = subjectItem.subject
                  const score = scoreBySubjectVersionId.get(subjectItem.subjectId)
                  const isOptional = subjectItem.type === SubjectRequirementType.Optional
                  const notForFinalScore = supplementaryBySubjectVersionId.has(
                    subjectItem.subjectId
                  )
                  const isOptionalNonGpa = isOptional && notForFinalScore

                  const score10 = toScoreNumber(score?.manualFinalScore ?? score?.finalScore)
                  const score4 = convertScore(score10).base4
                  const letterGrade = isOptionalNonGpa ? "Đạt" : convertScore(score10).letter

                  return (
                    <tr key={subject.id}>
                      <td className="border border-black px-1 py-1 text-center">
                        {originalIndex + 1}
                      </td>
                      <td
                        className={`border border-black px-1 py-1 ${notForFinalScore ? "italic" : ""}`}
                      >
                        {isOptional ? "* " : ""}
                        {subject.name}
                      </td>
                      <td className="border border-black px-1 py-1 text-center">
                        {subject.credit}
                      </td>
                      <td className="border border-black px-1 py-1 text-center">
                        {isOptionalNonGpa ? "" : Number(score10).toFixedSmart(1)}
                      </td>
                      <td className="border border-black px-1 py-1 text-center">
                        {isOptionalNonGpa ? "" : Number(score4).toFixedSmart(2)}
                      </td>
                      <td className="border border-black px-1 py-1 text-center">
                        {String(letterGrade)}
                      </td>
                    </tr>
                  )
                })

                const graduationRows = [
                  graduationSubjects.length > 0 ? (
                    <tr key="graduation-header">
                      <td colSpan={6} className="border border-black px-1 py-1 font-semibold">
                        Học phần tốt nghiệp
                      </td>
                    </tr>
                  ) : null,
                  ...graduationSubjects.map(({ subjectItem }, originalIndex) => {
                    const subject = subjectItem.subject
                    const score = scoreBySubjectVersionId.get(subjectItem.subjectId)
                    const isOptional = subjectItem.type === SubjectRequirementType.Optional
                    const notForFinalScore = supplementaryBySubjectVersionId.has(
                      subjectItem.subjectId
                    )
                    const isOptionalNonGpa = isOptional && notForFinalScore
                    const score10 = toScoreNumber(score?.manualFinalScore ?? score?.finalScore)
                    const score4 = convertScore(score10).base4
                    const letterGrade = isOptionalNonGpa ? "Đạt" : convertScore(score10).letter

                    return (
                      <tr key={subject.id}>
                        <td className="border border-black px-1 py-1 text-center">
                          {originalIndex + 1}
                        </td>
                        <td
                          className={`border border-black px-1 py-1 ${notForFinalScore ? "italic" : ""}`}
                        >
                          {isOptional ? "* " : ""}
                          {subject.name}
                        </td>
                        <td className="border border-black px-1 py-1 text-center">
                          {subject.credit}
                        </td>
                        <td className="border border-black px-1 py-1 text-center">
                          {isOptionalNonGpa ? "" : Number(score10).toFixedSmart(1)}
                        </td>
                        <td className="border border-black px-1 py-1 text-center">
                          {isOptionalNonGpa ? "" : Number(score4).toFixedSmart(2)}
                        </td>
                        <td className="border border-black px-1 py-1 text-center">
                          {String(letterGrade)}
                        </td>
                      </tr>
                    )
                  }),
                ].filter(Boolean)

                return [...regularRows, ...graduationRows]
              })()}
            </tbody>
          </table>
        </div>
        <div className="overflow-x-auto mt-6 flex justify-between">
          <div className="flex flex-col max-w-[70%]">
            <div className="flex">
              <div className="italic min-w-32">Tổng số tín chỉ:</div>
              <span className="font-bold">
                {(() => {
                  const totalCredits = subjectScoreData?.trainingBlocks
                    .flatMap((block) => block.subjects)
                    .filter(
                      (subjectItem) =>
                        subjectItem.useForFinalScore === true &&
                        !supplementaryBySubjectVersionId.has(subjectItem.subjectId)
                    )
                    ?.reduce(
                      (sum: number, subjectItem) => sum + (subjectItem.subject?.credit || 0),
                      0
                    )

                  return totalCredits || 0
                })()}
              </span>
            </div>
            <div>
              <span>
                Điểm trung bình chung tích lũy toàn khoá (Thang điểm{" "}
                {graduationBaseScore === "Base4" ? "4" : "10"}):{" "}
              </span>
              <span className="font-bold">{gpaScore.toFixed(2)}</span>
            </div>
            <div className="flex">
              <div className="min-w-32">Xếp loại:</div>
              <span className="font-bold">
                {subjectScoreData?.students?.[0]?.graduationDecision?.finalRanking?.classification ||
                  convertAcademicRanking(gpaScore)?.classification}
              </span>
            </div>
          </div>
          <div className="flex flex-col text-center mt-5">
            <span className="italic">{formattedDate}</span>
            <div className="uppercase font-bold flex flex-col">
              <span>TL. GIÁM ĐỐC</span>
              <span>Trưởng phòng đào tạo</span>
            </div>
            <div className="min-h-40 flex items-end justify-center">
              <span>{signerName}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm leading-[1.5] whitespace-pre-wrap">
          <p className="italic font-[500]">Ghi chú:</p>
          <p>- Học phần có đánh dấu * là học phần tự chọn</p>
          <p>
            - Học phần in nghiêng và học phần bổ sung kiến thức không được tính vào trung bình chung
            tích lũy
          </p>
          <p>- Hệ thống điểm được quy định theo:</p>

          <div className="mt-2 text-sm">
            {(() => {
              const sortedData = [
                ...(subjectScoreData?.fixedClass?.trainingCourse?.scoreConverts ?? []),
              ].sort((a, b) => b.base4 - a.base4)

              return (
                <>
                  <div className="grid grid-cols-[minmax(120px,1fr)_repeat(9,minmax(40px,1fr))] gap-x-2 mb-2 items-center">
                    <div className="font-medium">Thang điểm chữ</div>
                    {sortedData.map((item) => (
                      <div key={item.id} className="text-center">
                        {item.letter}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-[minmax(120px,1fr)_repeat(9,minmax(40px,1fr))] gap-x-2 mb-2 items-center">
                    <div className="font-medium">Thang điểm 4</div>
                    {sortedData.map((item) => (
                      <div key={item.id} className="text-center">
                        {item.base4}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-[minmax(120px,1fr)_repeat(9,minmax(40px,1fr))] gap-x-2 items-center">
                    <div className="font-medium">Thang điểm 10</div>
                    {sortedData.map((item) => (
                      <div key={item.id} className="text-center">
                        {item.base10Min === 0
                          ? `<${item.base10Max + 0.1}`
                          : `${item.base10Min}${item.base10Max ? `-${item.base10Max}` : ""}`}
                      </div>
                    ))}
                  </div>
                </>
              )
            })()}
          </div>

          <p className="mt-2">
            - Phân hạng tốt nghiệp theo thang điểm {graduationBaseScore === "Base4" ? "4" : "10"}:{" "}
            {(() => {
              const sortedRankings = (graduationRankingData || [])
                .filter((item: any) => item.graduated)
                .sort((a: any, b: any) =>
                  graduationBaseScore === "Base4"
                    ? b.base4Min - a.base4Min
                    : b.base10Min - a.base10Min
                )

              return sortedRankings.map((item: any, index: number) => {
                const formatNumber = (num: number) => {
                  if (num == null) return "-"
                  if (Number.isInteger(num)) return num.toFixed(1)
                  const decimalPart = (num?.toString().split(".")[1] || "").length
                  if (decimalPart === 1) return num.toFixed(2) || ""
                  return num ? num?.toString() : ""
                }

                const range =
                  graduationBaseScore === "Base4"
                    ? `${formatNumber(item.base4Min)}-${formatNumber(item.base4Max)}`
                    : `${formatNumber(item.base10Min)}-${formatNumber(item.base10Max)}`

                return (
                  <span key={item.id || index}>
                    {item.classification}: {range}
                    {index < sortedRankings.length - 1 ? "; " : ""}
                  </span>
                )
              })
            })()}
            .(Loại tốt nghiệp có thể bị hạ mức theo quy chế đào tạo đại học của HVKTQS được áp dụng
            tại thời điểm xét tốt nghiệp).
          </p>
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

export default ModalPrintToKQHT
