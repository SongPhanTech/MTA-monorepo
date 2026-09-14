import { GridBlock } from "@components/commons/grid-block"
import { useScoreConverter } from "@hooks/scoreConverter"
import { $Enums } from "@workspace/db/client"
import { useFindManyStudentResearchTopic, useFindUniqueStudent } from "@workspace/db/hooks"
import { courseScoreConfigFrom, formatPlaceOfBirth } from "@workspace/libs/utils"
import { Button, Modal, Radio, Space } from "antd"
import dayjs from "dayjs"
import { Printer } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import { useReactToPrint } from "react-to-print"
import { versionToPersonLike } from "@/utils/expert-select"

dayjs.locale("vi")

type SubjectScoreRow = {
  subjectClassId?: string | null
  createdAt?: Date | string
  manualFinalScore?: unknown
  finalScore?: unknown
}

type Subject = {
  name: string
  credits: number
  score: number | null
}

const COUNCIL_ROLE_LABEL: Record<string, string> = {
  CHAIRMAN: "Chủ tịch",
  SECRETARY: "Thư ký",
  REVIEWER_1: "Phản biện 1",
  REVIEWER_2: "Phản biện 2",
  MEMBER: "Ủy viên",
}

function pickOfficialScore<T extends SubjectScoreRow>(scores: T[] | undefined): T | undefined {
  if (!scores?.length) return undefined
  const byCreatedAt = (a: T, b: T) => {
    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return at - bt
  }
  const classScores = scores.filter((s) => s.subjectClassId).sort(byCreatedAt)
  if (classScores.length) return classScores[classScores.length - 1]
  const phienScores = scores.filter((s) => !s.subjectClassId).sort(byCreatedAt)
  return phienScores.at(-1)
}

function toScoreNumber(value: unknown): number | null {
  if (value == null || value === "") return null
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "string") {
    const n = Number(value.replace(",", "."))
    return Number.isFinite(n) ? n : null
  }
  if (typeof value === "object" && "toNumber" in value) {
    const n = (value as { toNumber: () => number }).toNumber()
    return Number.isFinite(n) ? n : null
  }
  return null
}

function formatScore(value: number | null | undefined, digits: number) {
  if (value == null || !Number.isFinite(value)) return ""
  return Number(value).toFixedSmart(digits)
}

function isApplicationOrientation(
  classType: $Enums.FixedClassType | null | undefined,
  fallbackIsProject: boolean
) {
  if (classType === $Enums.FixedClassType.APPLICATION) return true
  if (classType === $Enums.FixedClassType.RESEARCH) return false
  return fallbackIsProject
}

const SubjectTable: React.FC<{ data: Subject[]; startIndex: number }> = ({ data, startIndex }) => (
  <table className="table-auto border-collapse border border-black w-full text-sm">
    <thead>
      <tr>
        <th className="border border-black px-2 py-1 w-10 text-center">TT</th>
        <th className="border border-black px-2 py-1 text-center">Tên học phần</th>
        <th className="border border-black px-2 py-1 w-12 text-center">Số TC</th>
        <th className="border border-black px-2 py-1 w-12 text-center">Điểm</th>
      </tr>
    </thead>
    <tbody>
      {data.map((item, idx) => (
        <tr key={`${item}-${idx + 1}`}>
          <td className="border border-black px-2 py-1 text-center">{startIndex + idx + 1}</td>
          <td className="border border-black px-2 py-1">{item.name}</td>
          <td className="border border-black px-2 py-1 text-center">{item.credits}</td>
          <td className="border border-black px-2 py-1 text-center">
            {item.score != null ? formatScore(item.score, 1) : ""}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)

export const ModalPhuLucThacSi = () => {
  const formattedDate = `Ngày ${dayjs().format("DD")} tháng ${dayjs().format("MM")} năm ${dayjs().format("YYYY")}`
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "ModalPhuLucThacSi",
  })

  const { data } = useFindUniqueStudent(
    {
      where: { id },
      include: {
        userProfile: {
          include: {
            gender: true,
            ethnicity: true,
            religion: true,
            nationality: true,
            provinceOfBirth: true,
            newProvinceOfBirth: true,
          },
        },
        graduationDecision: true,
        studentYearResult: {
          where: { isLastStudyYear: true, deletedAt: null },
          take: 1,
          select: {
            cumulativeGpaBase10: true,
            cumulativeGpaBase4: true,
          },
        },
        thesisRegistrations: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            studentSubjectScore: { include: { subjectVersion: true } },
            thesisProject: {
              include: {
                supervisor: true,
                coSupervisor: true,
                defenseRecord: true,
                subjectClass: { include: { subject: true } },
                thesisSession: {
                  select: { id: true, name: true, chief: true, deputy: true },
                },
                council: {
                  include: {
                    members: {
                      include: {
                        expertProfileVersion: {
                          include: {
                            academicDegreeType: true,
                            academicRankType: true,
                            expert: {
                              include: {
                                lecturer: {
                                  include: {
                                    userProfile: true,
                                    organization: true,
                                  },
                                },
                              },
                            },
                          },
                        },
                        expert: {
                          include: {
                            lecturer: {
                              include: {
                                userProfile: true,
                                organization: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        fixedClass: {
          include: {
            trainingCourse: {
              include: {
                scoreConverts: true,
                trainingObjectType: {
                  include: {
                    trainingForm: true,
                  },
                },
              },
            },
          },
        },
        curriculumVersion: {
          include: {
            curriculum: {
              include: {
                trainingMajor: {
                  include: {
                    trainingField: true,
                  },
                },
              },
            },
            trainingTime: true,
            trainingLanguage: true,
            trainingBlocks: {
              orderBy: { priority: "asc" },
              include: {
                subjects: {
                  orderBy: { semester: "asc" },
                  include: {
                    subject: {
                      include: {
                        studentSubjectScore: {
                          where: { studentId: id },
                          orderBy: { createdAt: "asc" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    { enabled: !!id }
  )

  const { data: researchTopicData = [] } = useFindManyStudentResearchTopic(
    {
      where: {
        deletedAt: null,
        studentSubjectScore: { studentId: id },
      },
      include: {
        studentSubjectScore: {
          include: { subjectVersion: true },
        },
      },
      orderBy: { createdAt: "asc" },
    },
    { enabled: !!id }
  )

  const { convertScore } = useScoreConverter(data?.fixedClass?.trainingCourse?.scoreConverts)

  const thesisReg = data?.thesisRegistrations?.[0]
  const thesisProject = thesisReg?.thesisProject
  const isProject = thesisProject?.thesisType === $Enums.ThesisType.PROJECT
  const isApplicationProgram = isApplicationOrientation(data?.fixedClass?.classType, isProject)
  const orientationLabel = isApplicationProgram ? "định hướng ứng dụng" : "định hướng nghiên cứu"
  const thesisSession = thesisProject?.thesisSession
  const chiefName = thesisSession?.chief?.trim() || ""
  const deputyName = thesisSession?.deputy?.trim() || ""
  const [signRole, setSignRole] = useState<"chief" | "deputy">("chief")
  const isChiefSigner = signRole === "chief"
  const signerDisplayName = isChiefSigner ? chiefName : deputyName
  const signerTitle1 = isChiefSigner ? "TL. GIÁM ĐỐC" : "KT. TRƯỞNG PHÒNG"
  const signerTitle2 = isChiefSigner
    ? "Trưởng phòng sau đại học"
    : "Phó trưởng phòng sau đại học"

  useEffect(() => {
    setSignRole(chiefName ? "chief" : "deputy")
  }, [id, chiefName])

  const courseRows = useMemo(() => {
    const subjects = (data?.curriculumVersion?.trainingBlocks ?? []).flatMap((block) =>
      block.subjects.map((item) => item)
    )
    return subjects.map((item) => {
      const subject = item.subject
      const score = pickOfficialScore(subject.studentSubjectScore)
      const score10 = toScoreNumber(score?.manualFinalScore) ?? toScoreNumber(score?.finalScore)
      const converted =
        score10 != null
          ? convertScore(
              score10,
              courseScoreConfigFrom(data?.fixedClass?.trainingCourse, score, {
                isGraduation: item.graduation === true,
                isConditional: item.useForFinalScore === false,
              })
            )
          : null
      return {
        id: subject.id,
        name: subject.name,
        credits: subject.credit,
        score10,
        score4: converted?.base4 ?? null,
        scoreLetter: converted?.letter ?? null,
        useForFinalScore: item.useForFinalScore !== false,
        graduation: item.graduation === true,
      }
    })
  }, [data, convertScore])

  const researchTopicRows = useMemo(() => {
    return researchTopicData.map((topic, index) => {
      const score = topic.studentSubjectScore
      const score10 = toScoreNumber(score?.manualFinalScore) ?? toScoreNumber(score?.finalScore)
      const converted =
        score10 != null
          ? convertScore(
              score10,
              courseScoreConfigFrom(data?.fixedClass?.trainingCourse, score)
            )
          : null
      const topicTitle = (topic.name || score?.subjectVersion?.name || "").trim()
      const name = topicTitle
        ? /^chuyên đề\b/i.test(topicTitle)
          ? topicTitle
          : `Chuyên đề ${topicTitle}`
        : `Chuyên đề ${index + 1}`
      return {
        id: topic.id,
        name,
        credits: score?.subjectVersion?.credit ?? null,
        score10,
        score4: converted?.base4 ?? null,
        scoreLetter: converted?.letter ?? null,
      }
    })
  }, [researchTopicData, convertScore])

  const thesisScore10 =
    toScoreNumber(thesisProject?.defenseRecord?.finalScore) ??
    toScoreNumber(thesisReg?.studentSubjectScore?.manualFinalScore) ??
    toScoreNumber(thesisReg?.studentSubjectScore?.finalScore)
  const thesisConverted =
    thesisScore10 != null
      ? convertScore(
          thesisScore10,
          courseScoreConfigFrom(
            data?.fixedClass?.trainingCourse,
            thesisReg?.studentSubjectScore,
            { isGraduation: true }
          )
        )
      : null
  const thesisCredits =
    thesisReg?.studentSubjectScore?.subjectVersion?.credit ??
    thesisProject?.subjectClass?.subject?.credit ??
    null
  const thesisName = isApplicationProgram ? "Đề án tốt nghiệp" : "Luận văn tốt nghiệp"

  const page1Rows = useMemo(() => {
    const rows = [
      ...researchTopicRows,
      ...(thesisProject
        ? [
            {
              id: thesisProject.id,
              name: thesisName,
              credits: thesisCredits,
              score10: thesisScore10,
              score4: thesisConverted?.base4 ?? null,
              scoreLetter: thesisConverted?.letter ?? null,
            },
          ]
        : []),
    ]
    return rows.length ? rows : courseRows
  }, [
    researchTopicRows,
    thesisProject,
    thesisName,
    thesisCredits,
    thesisScore10,
    thesisConverted,
    courseRows,
  ])

  const computedGpa = useMemo(() => {
    const scored = courseRows.filter((row) => row.useForFinalScore && row.score10 != null)
    const totalCredits = scored.reduce((sum, row) => sum + (row.credits || 0), 0)
    const totalWeighted = scored.reduce((sum, row) => sum + (row.score10 ?? 0) * (row.credits || 0), 0)
    return totalCredits > 0 ? Number((totalWeighted / totalCredits).toFixed(2)) : null
  }, [courseRows])

  const gpa10 =
    toScoreNumber(data?.graduationDecision?.finalGpa) ??
    toScoreNumber(data?.studentYearResult?.[0]?.cumulativeGpaBase10) ??
    computedGpa
  const gpaConverted = gpa10 != null ? convertScore(gpa10) : null
  const gpa4 =
    toScoreNumber(data?.studentYearResult?.[0]?.cumulativeGpaBase4) ?? gpaConverted?.base4 ?? null

  const councilMembers = useMemo(() => {
    const roleOrder: Record<string, number> = {
      CHAIRMAN: 1,
      SECRETARY: 2,
      REVIEWER_1: 3,
      REVIEWER_2: 4,
      MEMBER: 5,
    }
    return [...(thesisProject?.council?.members ?? [])]
      .sort((a, b) => (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99))
      .map((member) => {
        const expert = (versionToPersonLike(member.expertProfileVersion) ?? member.expert) as any
        const rank =
          expert?.academicRankType?.sMa ?? expert?.lecturer?.userProfile?.academicRankType?.sMa ?? ""
        const degree =
          expert?.academicDegreeType?.sMa ??
          expert?.lecturer?.userProfile?.academicDegreeType?.sMa ??
          ""
        const title = [rank, degree].filter(Boolean).join(".")
        const name = [title, expert?.name].filter(Boolean).join(" ").trim()
        return {
          role: COUNCIL_ROLE_LABEL[member.role] ?? "Ủy viên",
          name,
          unit: expert?.lecturer?.organization?.sTen || expert?.workplace || "",
        }
      })
  }, [thesisProject])

  const supervisors = [thesisProject?.supervisor?.name, thesisProject?.coSupervisor?.name]
    .filter(Boolean)
    .join("; ")

  const defenseDate = thesisProject?.defenseDate
  const defenseDateLabel = defenseDate
    ? `Bảo vệ ngày ${dayjs(defenseDate).format("DD")} tháng ${dayjs(defenseDate).format("MM")} năm ${dayjs(defenseDate).format("YYYY")} tại Hội đồng đánh giá luận văn HVKTQS, danh sách`
    : "Bảo vệ ngày ... tháng ... năm ... tại Hội đồng đánh giá luận văn HVKTQS, danh sách"

  const certificateSubjects: Subject[] = courseRows.map((row) => ({
    name: row.name,
    credits: row.credits,
    score: row.score10,
  }))
  const mid = Math.ceil(certificateSubjects.length / 2) || 0
  const leftData = certificateSubjects.slice(0, mid)
  const rightData = certificateSubjects.slice(mid)

  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Phu_luc_thac_si_${data?.code}_${data?.userProfile?.fullname}.pdf`,
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

  const basicInfoCol1 = [
    {
      title: "Họ và tên:",
      value: <span className="uppercase">{data?.userProfile?.fullname}</span>,
    },
    {
      title: "Ngày sinh:",
      value: (
        <span>
          {data?.userProfile?.dateOfBirth &&
            dayjs(data?.userProfile?.dateOfBirth).format("DD/MM/YYYY")}
        </span>
      ),
    },
    {
      title: "Khoá:",
      value: <span>{data?.fixedClass?.trainingCourse?.name}</span>,
    },
  ]

  const basicInfoCol2 = [
    {
      title: "Mã học viên:",
      value: <span>{data?.code}</span>,
    },
    {
      title: "Nơi sinh:",
      value: <span>{formatPlaceOfBirth(data?.userProfile)}</span>,
    },
    {
      title: "Ngày nhập học:",
      value: <span>{data?.from && dayjs(data?.from).format("DD/MM/YYYY")}</span>,
    },
  ]

  const basicInfoCol3 = [
    {
      title: "Ngành:",
      value: <span>{data?.curriculumVersion?.curriculum?.trainingMajor?.trainingField?.name}</span>,
    },
    {
      title: "Chuyên ngành:",
      value: <span>{data?.curriculumVersion?.curriculum?.trainingMajor?.name}</span>,
    },
    {
      title: "Ngôn ngữ đào tạo:",
      value: <span>{data?.curriculumVersion?.trainingLanguage?.name}</span>,
    },
  ]
  const basicInfoCol4 = [
    {
      title: "",
      value: "",
    },
    {
      title: "Thời gian đào tạo:",
      value: <span>{data?.curriculumVersion?.trainingTime?.name}</span>,
    },
    {
      title: "Hình thức đào tạo:",
      value: (
        <span>{data?.fixedClass?.trainingCourse?.trainingObjectType?.trainingForm?.name}</span>
      ),
    },
  ]

  return (
    <Modal
      title="In phụ lục văn bằng thạc sĩ"
      open={isOpen}
      onCancel={onClose}
      width="80vw"
      style={{ maxWidth: "1200px" }}
      footer={null}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-start w-full mb-4 gap-4">
          <Radio.Group
            value={signRole}
            onChange={(e) => setSignRole(e.target.value)}
            className="flex flex-col gap-1"
          >
            <Radio value="chief">
              Trưởng phòng sau đại học: <strong>{chiefName || "(chưa nhập)"}</strong>
            </Radio>
            <Radio value="deputy">
              Phó trưởng phòng sau đại học: <strong>{deputyName || "(chưa nhập)"}</strong>
            </Radio>
          </Radio.Group>
          <Space>
            <Button type="primary" onClick={() => handlePrint()} icon={<Printer />}>
              In phụ lục
            </Button>
          </Space>
        </div>

        <div
          ref={printRef}
          className="!font-time-news-roman text-black bg-white p-6"
          style={{ fontSize: "14px", lineHeight: "1.5" }}
        >
          <div className="page-break">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <tbody>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-1 text-center">
                    <span className="font-bold uppercase flex flex-col w-full">
                      <span className="font-normal">Bộ Quốc Phòng</span>
                      <span>Học viện Kỹ Thuật Quân sự</span>
                    </span>
                  </td>

                  {/* Bên phải */}
                  <td className="align-top w-1/2 p-1 text-center">
                    <span className="font-bold uppercase flex flex-col w-full">
                      <span>Cộng hòa Xã hội Chủ nghĩa Việt Nam</span>
                      <span>Độc lập - Tự do - Hạnh phúc</span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="w-full flex flex-col items-center">
              <div className="mt-2 uppercase font-bold">Phụ lục văn bằng</div>
              <div className="text-sm normal-case font-normal italic">
                {`(Kèm theo Bằng Thạc sĩ số: ${data?.graduationDecision?.diplomaNumber || ""})`}
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
            <div className="text-[#656565] text-sm py-2">
              Đã hoàn thành chương trình đào tạo thạc sĩ theo {orientationLabel}
            </div>
            <div className="flex justify-between gap-5">
              <div className="flex flex-col gap-2.5 w-[50%]">
                {basicInfoCol3?.filter(Boolean).map((item, index) => (
                  <div key={item?.title || index} className="flex gap-2 w-full">
                    <span className="text-[#656565] text-sm min-w-32">{item?.title}</span>
                    <span className="text-sm font-semibold">{item?.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2.5 w-[50%]">
                {basicInfoCol4?.filter(Boolean).map((item, index) => (
                  <div key={item?.title || index} className="flex gap-2 w-full">
                    <span className="text-[#656565] text-sm min-w-32">{item?.title}</span>
                    <span className="text-sm font-semibold">{item?.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[#656565] text-sm py-2">Kết quả đào tạo:</div>
            <div className="overflow-x-auto text-sm">
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
                      Số TC
                    </th>
                    <th colSpan={3} className="border border-black px-1 py-1 text-center">
                      Điểm
                    </th>
                  </tr>
                  <tr>
                    <th className="border border-black px-1 py-1 w-[80px] text-center">
                      Thang điểm 10
                    </th>
                    <th className="border border-black px-1 py-1 w-[80px] text-center">
                      Thang điểm 4
                    </th>
                    <th className="border border-black px-1 py-1 w-[80px] text-center">
                      Thang điểm chữ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {page1Rows.map((row, index) => (
                    <tr key={row.id}>
                      <td className="border border-black px-1 py-1 text-center">{index + 1}</td>
                      <td className="border border-black px-1 py-1">{row.name}</td>
                      <td className="border border-black px-1 py-1 text-center">
                        {row.credits ?? ""}
                      </td>
                      <td className="border border-black px-1 py-1 text-center">
                        {formatScore(row.score10, 1)}
                      </td>
                      <td className="border border-black px-1 py-1 text-center">
                        {formatScore(row.score4, 2)}
                      </td>
                      <td className="border border-black px-1 py-1 text-center">
                        {row.scoreLetter ?? ""}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="border border-black px-1 py-1 text-center" />
                    <td className="border border-black px-1 py-1 text-center font-bold">
                      Điểm trung bình chung tốt nghiệp
                    </td>
                    <td className="border border-black px-1 py-1 text-center" />
                    <td className="border border-black px-1 py-1 text-center">
                      {formatScore(gpa10, 2)}
                    </td>
                    <td className="border border-black px-1 py-1 text-center">
                      {formatScore(gpa4, 2)}
                    </td>
                    <td className="border border-black px-1 py-1 text-center">
                      {gpaConverted?.letter ?? ""}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {researchTopicRows.map((topic, index) => (
              <div key={topic.id} className="font-bold italic text-sm py-1">
                Tên chuyên đề nghiên cứu {index + 1}: {topic.name}
              </div>
            ))}
            <div className="font-bold italic py-1">
              Tên đề tài luận văn: {thesisProject?.title ?? ""}
            </div>
            <span>Cán bộ hướng dẫn: {supervisors}</span>
            <div>{defenseDateLabel}</div>
            <div className="overflow-x-auto">
              <table className="table-auto  border-separate border-spacing-0 w-full text-sm">
                <tbody>
                  {councilMembers.map((item, index) => (
                    <tr key={`${item.role}-${index}`} className="hover:bg-gray-50">
                      <td className="px-3 py-1 font-medium">
                        {index + 1}. {item.role}
                      </td>
                      <td className="px-3 py-1">{item.name}</td>
                      <td className="px-3 py-1">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="page-break">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <tbody>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-1 text-center">
                    <span className="font-bold uppercase flex flex-col w-full">
                      <span className="font-normal">Bộ Quốc Phòng</span>
                      <span>Học viện Kỹ Thuật Quân sự</span>
                    </span>
                  </td>

                  {/* Bên phải */}
                  <td className="align-top w-1/2 p-1 text-center">
                    <span className="font-bold uppercase flex flex-col w-full">
                      <span>Cộng hòa Xã hội Chủ nghĩa Việt Nam</span>
                      <span>Độc lập - Tự do - Hạnh phúc</span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="w-full flex flex-col items-center">
              <div className="mt-4 uppercase font-bold">Phụ lục văn bằng</div>
              <div className="text-sm normal-case font-normal italic">
                {`(Kèm theo Bằng Thạc sĩ số: ${data?.graduationDecision?.diplomaNumber || ""})`}
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
            <div className="text-[#656565] text-sm py-2">
              Đã hoàn thành chương trình đào tạo thạc sĩ theo {orientationLabel}
            </div>
            <div className="flex justify-between gap-5">
              <div className="flex flex-col gap-2.5 w-[50%]">
                {basicInfoCol3?.filter(Boolean).map((item, index) => (
                  <div key={item?.title || index} className="flex gap-2 w-full">
                    <span className="text-[#656565] text-sm min-w-32">{item?.title}</span>
                    <span className="text-sm font-semibold">{item?.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2.5 w-[50%]">
                {basicInfoCol4?.filter(Boolean).map((item, index) => (
                  <div key={item?.title || index} className="flex gap-2 w-full">
                    <span className="text-[#656565] text-sm min-w-32">{item?.title}</span>
                    <span className="text-sm font-semibold">{item?.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[#656565] text-sm py-2">Kết quả đào tạo:</div>
            <div className="overflow-x-auto text-sm">
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
                      Số TC
                    </th>
                    <th colSpan={3} className="border border-black px-1 py-1 text-center">
                      Điểm
                    </th>
                  </tr>
                  <tr>
                    <th className="border border-black px-1 py-1 w-[80px] text-center">
                      Thang điểm 10
                    </th>
                    <th className="border border-black px-1 py-1 w-[80px] text-center">
                      Thang điểm 4
                    </th>
                    <th className="border border-black px-1 py-1 w-[80px] text-center">
                      Thang điểm chữ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-1 py-1 text-center" />
                    <td className="border border-black px-1 py-1 font-bold">
                      {isApplicationProgram
                        ? "Đề án tốt nghiệp (với UD)"
                        : "Luận văn tốt nghiệp (Đối với NC)"}
                    </td>
                    <td className="border border-black px-1 py-1 text-center">
                      {thesisCredits ?? ""}
                    </td>
                    <td className="border border-black px-1 py-1 text-center">
                      {formatScore(thesisScore10, 1)}
                    </td>
                    <td className="border border-black px-1 py-1 text-center">
                      {formatScore(thesisConverted?.base4, 2)}
                    </td>
                    <td className="border border-black px-1 py-1 text-center">
                      {thesisConverted?.letter ?? ""}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-1 py-1 text-center" />
                    <td className="border border-black px-1 py-1 font-bold text-center">
                      Điểm trung bình chung tốt nghiệp
                    </td>
                    <td className="border border-black px-1 py-1 text-center" />
                    <td className="border border-black px-1 py-1 text-center">
                      {formatScore(gpa10, 2)}
                    </td>
                    <td className="border border-black px-1 py-1 text-center">
                      {formatScore(gpa4, 2)}
                    </td>
                    <td className="border border-black px-1 py-1 text-center">
                      {gpaConverted?.letter ?? ""}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="font-bold italic py-2">
              Tên đề tài luận văn (Đối với NC) hoặc tên đề án tốt nghiệp (với ƯD):{" "}
              {thesisProject?.title ?? ""}
            </div>
            <span>Cán bộ hướng dẫn: {supervisors}</span>
            <div>{defenseDateLabel}</div>
            <div className="overflow-x-auto">
              <table className="table-auto  border-separate border-spacing-0 w-full text-sm">
                <tbody>
                  {councilMembers.map((item, index) => (
                    <tr key={`${item.role}-${index}`} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">
                        {index + 1}. {item.role}
                      </td>
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <table className="w-full border-separate border-spacing-0">
              <tbody>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-2 text-center" />

                  {/* Bên phải */}
                  <td className="align-top w-1/2 p-2 text-center">
                    <span className="italic">{formattedDate}</span>
                    <span className="flex flex-col w-full items-center">
                      <span className="font-bold uppercase">{signerTitle1}</span>
                      <span className="font-bold uppercase">{signerTitle2}</span>
                      <div className="h-20" />
                      {signerDisplayName ? (
                        <span className="font-bold">{signerDisplayName}</span>
                      ) : null}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="page-break">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <tbody>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-1 text-center">
                    <span className="font-bold uppercase flex flex-col w-full">
                      <span className="font-normal">Học viện Kỹ Thuật Quân sự</span>
                      <span>Phòng sau đại học</span>
                    </span>
                  </td>

                  {/* Bên phải */}
                  <td className="align-top w-1/2 p-1 text-center">
                    <span className="font-bold uppercase flex flex-col w-full">
                      <span>Cộng hòa Xã hội Chủ nghĩa Việt Nam</span>
                      <span>Độc lập - Tự do - Hạnh phúc</span>
                    </span>
                  </td>
                </tr>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-1 text-center">
                    <span>Số: 0 /CN-SĐH</span>
                  </td>

                  {/* Bên phải */}
                  <td className="align-top w-1/2 p-1 text-right">
                    <span>
                      <span>{formattedDate}</span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="w-full flex flex-col items-center">
              <div className="mt-4 uppercase font-bold">Giấy chứng nhận</div>
              <div className="text-sm normal-case">Kết quả học tập của Học viên cao học</div>
            </div>

            <span>Phòng Sau đại học - Học viện Kỹ thuật Quân sự chứng nhận:</span>
            <div className="flex justify-between gap-5 mt-2">
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
            <div className="text-[#656565] text-sm mt-2">
              {`Học viên chuyên ngành: ${data?.curriculumVersion?.curriculum?.trainingMajor?.name} `}
            </div>
            <div className="text-[#656565] text-sm mt-2">
              Học viên chấp hành tốt quy định về đào tạo, không vi phạm nội quy, quy định của Học
              viện.
            </div>
            <div className="text-[#656565] text-sm py-2">Kết quả học tập như sau: </div>
            <div className="grid grid-cols-2 gap-4">
              <SubjectTable data={leftData} startIndex={0} />
              <SubjectTable data={rightData} startIndex={mid} />
            </div>

            <div className="mt-2 flex flex-col">
              <span>Điểm trung bình chung các học phần: {formatScore(gpa10, 2)}</span>
              <span>Giấy này có hiệu lực đến hết ngày </span>
            </div>
            <table className="w-full border-separate border-spacing-0">
              <tbody>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-2 text-left">
                    <span className="italic">Nơi nhận:</span>
                    <ul className="list-none leading-4">
                      <li>- Học viên;</li>
                      <li>- Lưu;</li>
                    </ul>
                  </td>

                  {/* Bên phải */}
                  <td className="align-top w-1/2 p-2 text-center">
                    <span className="font-bold uppercase flex flex-col w-full">
                      <span>Kt. Trưởng phòng</span>
                      <span>Phó trưởng phòng</span>
                      <div className="h-20" />
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="page-break">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <tbody>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-1 text-center">
                    <span className="font-bold uppercase flex flex-col w-full">
                      <span className="font-normal">Học viện Kỹ Thuật Quân sự</span>
                      <span>Phòng sau đại học</span>
                    </span>
                  </td>

                  {/* Bên phải */}
                  <td className="align-top w-1/2 p-1 text-center" />
                </tr>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-1 text-center">
                    <span>Số hồ sơ TS: {data?.doctoralCode ?? ""}</span>
                  </td>

                  {/* Bên phải */}
                  <td className="align-top w-1/2 p-1 text-right" />
                </tr>
              </tbody>
            </table>

            <div className="w-full flex flex-col items-center font-bold">
              <div className="mt-4 uppercase">Phiếu học viên quân sự</div>
              <div className="text-sm flex flex-col items-center">
                <span>{`Khoá: ${data?.fixedClass?.trainingCourse?.name}, Lớp CN: ${data?.fixedClass?.name}`}</span>
                <span>{`Chuyên ngành: ${data?.curriculumVersion?.curriculum?.trainingMajor?.name}`}</span>
              </div>
            </div>

            <span className="uppercase font-bold">A. Bản thân</span>
            <GridBlock
              columns={2}
              items={[
                {
                  key: "dan-toc",
                  content: (
                    <>
                      Họ và tên học viên:{" "}
                      <span className="font-bold capitalize">
                        {data?.userProfile?.fullname}
                      </span>{" "}
                    </>
                  ),
                },
                {
                  key: "masv",
                  content: <>Mã số HV: {data?.code}</>,
                },
              ]}
            />
            <GridBlock
              columns={3}
              items={[
                {
                  key: "gioi-tinh",
                  content: <>Giới tính: {data?.userProfile?.gender?.sTen}</>,
                },
                {
                  key: "dob",
                  content: (
                    <>
                      Ngày sinh:{" "}
                      {data?.userProfile?.dateOfBirth &&
                        dayjs(data?.userProfile?.dateOfBirth).format("DD/MM/YYYY")}
                    </>
                  ),
                },
                {
                  key: "noi-sinh",
                  content: <>Nơi sinh: {formatPlaceOfBirth(data?.userProfile)}</>,
                },
              ]}
            />
            <GridBlock
              columns={3}
              items={[
                {
                  key: "dan-toc",
                  content: <>Dân tộc: {data?.userProfile?.ethnicity?.sTen}</>,
                },
                {
                  key: "ton-diao",
                  content: <>Tôn giáo: {data?.userProfile?.religion?.sTen}</>,
                },
                {
                  key: "quoc-tich",
                  content: <>Quốc tịch: {data?.userProfile?.nationality?.sTen}</>,
                },
              ]}
            />
            <div className="flex flex-col">
              <span>Quê quán (Xã, Huyện, Tỉnh): {data?.userProfile?.homeTown}</span>
              <span>Nơi ở hiện nay (Ghi rõ đến số nhà):</span>
              <span>Đơn vị trước khi đi học:</span>
              <span>Cụ thể (Từ cấp tiểu đoàn trở lên):</span>
              <span>Địa chỉ nơi đóng quân (Xã, Huyện, Tỉnh):</span>
            </div>
            <GridBlock
              columns={2}
              items={[
                {
                  key: "so-hieu",
                  content: <>Số hiệu SQ (QNCN):</>,
                },
                {
                  key: "date-nhap-ngu",
                  content: <>Tháng, năm nhập ngũ:</>,
                },
              ]}
            />
            <GridBlock
              columns={2}
              items={[
                {
                  key: "cap-bac",
                  content: <>Cấp bậc:</>,
                },
                {
                  key: "date-1",
                  content: <>Tháng, năm nhận:</>,
                },
              ]}
            />
            <GridBlock
              columns={2}
              items={[
                {
                  key: "nang-luong-lan",
                  content: <>Nâng lương lần:</>,
                },
                {
                  key: "date-2",
                  content: <>Tháng, năm nhận:</>,
                },
              ]}
            />
            <GridBlock
              columns={2}
              items={[
                {
                  key: "chuc-vu",
                  content: <>Chức vụ:</>,
                },
                {
                  key: "date-3",
                  content: <>Tháng, năm nhận:</>,
                },
              ]}
            />
            <GridBlock
              columns={3}
              items={[
                {
                  key: "date-dang",
                  content: (
                    <>
                      Ngày vào Đảng:{" "}
                      {data?.userProfile?.CPVJoinDate &&
                        dayjs(data?.userProfile?.CPVJoinDate).format("DD/MM/YYYY")}
                    </>
                  ),
                },
                {
                  key: "date-chinh",
                  content: (
                    <>
                      Ngày chính thức:{" "}
                      {data?.userProfile?.officialCPVDate &&
                        dayjs(data?.userProfile?.officialCPVDate).format("DD/MM/YYYY")}
                    </>
                  ),
                },
                {
                  key: "so-the",
                  content: <>Số thẻ Đảng viên: </>,
                },
              ]}
            />
            <span>Cấp ủy Đảng cao nhất đã qua:</span>
            <GridBlock
              columns={2}
              items={[
                {
                  key: "con-liet-si",
                  content: <>Con liệt sĩ:</>,
                },
                {
                  key: "thuong-binh",
                  content: <>Bản thân là thương binh:</>,
                },
              ]}
            />
            <div>Tốt nghiệp đại học làm hồ sơ tuyển sinh:</div>
            <table className="w-full border-separate border-spacing-0">
              <tbody>
                <tr>
                  {/* Bên trái */}
                  <td className="align-top w-1/2 p-2 text-left">
                    <ul className="list-none leading-4">
                      <li>+ Trường: HVKTQS</li>
                      <li>
                        + Chuyên ngành: {data?.curriculumVersion?.curriculum?.trainingMajor?.name}
                      </li>
                      <li>
                        + Hình thức đào tạo:{" "}
                        {data?.fixedClass?.trainingCourse?.trainingObjectType?.trainingForm?.name}
                      </li>
                    </ul>
                  </td>

                  {/* Bên phải */}
                  <td className="align-top w-1/2 p-2 text-left">
                    <ul className="list-none leading-4">
                      <li>+ Năm tốt nghiệp:</li>
                      <li>+ Số năm đào tạo: {data?.curriculumVersion?.trainingTime?.name}</li>
                      <li>+ PLTN: </li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
            <span>Đã qua trường (Từ 6 tháng trở lên)</span>
            <div className="p-4">
              <table className="table-fixed border-collapse border border-black w-full text-center">
                <thead>
                  <tr>
                    <th className="border border-black px-2 py-1 w-1/5">Tên trường</th>
                    <th className="border border-black px-2 py-1 w-1/5">Chuyên ngành</th>
                    <th className="border border-black px-2 py-1 w-1/5">Hình thức ĐT</th>
                    <th className="border border-black px-2 py-1 w-1/5">Niên khoá</th>
                    <th className="border border-black px-2 py-1 w-1/5">Xếp loại TN</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black h-10" />
                    <td className="border border-black" />
                    <td className="border border-black" />
                    <td className="border border-black" />
                    <td className="border border-black" />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ModalPhuLucThacSi
