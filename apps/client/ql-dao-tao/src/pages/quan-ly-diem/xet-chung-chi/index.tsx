import DefaultLayout from "@layouts/default-layout"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import {
  useFindManyCertificate,
  useFindManyFixedClass,
  useFindManyStudent,
  useFindManyTrainingCourse,
  useCreateManyArchivedCertificate,
  useFindManyTrainingBlockSubject,
} from "@workspace/db/hooks"
import { courseScoreConfigFrom, isFailedByCourseConfig } from "@workspace/libs/utils"
import { queryClient } from "@api/index"
import { Col, Form, Row, Button, message, Modal, Tooltip } from "antd"
import { useState, useMemo } from "react"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import dayjs from "dayjs"
import { saveAs } from "file-saver"
import ExcelJS from "exceljs"

const toScoreNumber = (val: any): number | null => {
  if (val == null) return null
  const raw = typeof val === "object" && typeof val.toNumber === "function" ? val.toNumber() : val
  const num = Number(raw)
  return Number.isNaN(num) ? null : num
}

const getEffectiveScore = (scoreRecord: any): number | null =>
  toScoreNumber(scoreRecord?.manualFinalScore) ?? toScoreNumber(scoreRecord?.finalScore)

// Ngưỡng qua môn dự phòng khi khoá chưa cấu hình scoreToPass
const FALLBACK_SCORE_TO_PASS = 4

type CourseScoreConfig = Parameters<typeof courseScoreConfigFrom>[0]

// Cấu hình môn theo CTĐT của SV. Môn không có trong CTĐT → coi là môn tính TBC (như cũ).
type SubjectRule = { conditional: boolean; graduation: boolean }
type CurriculumRuleMap = Map<string, Map<string, SubjectRule>>
const DEFAULT_SUBJECT_RULE: SubjectRule = { conditional: false, graduation: false }

const getStudentCurriculumVersionId = (record: any): string | undefined =>
  record.curriculumVersionId ?? record.fixedClass?.curriculumVersionId ?? undefined

const getSubjectRule = (
  record: any,
  subjectVersionId: string,
  ruleMap: CurriculumRuleMap
): SubjectRule => {
  const curriculumVersionId = getStudentCurriculumVersionId(record)
  if (!curriculumVersionId) return DEFAULT_SUBJECT_RULE
  return ruleMap.get(curriculumVersionId)?.get(subjectVersionId) ?? DEFAULT_SUBJECT_RULE
}

// Bản ghi rút môn / hoãn thi / lớp đã huỷ không dùng để xét
const isRecordUsable = (s: any) => !s.withdrew && !s.examPostponed && !s.subjectClass?.cancelled

// Cấm thi / đình chỉ: tính điểm 0, không đạt (giống tổng kết)
const getRecordScore = (s: any): number | null =>
  s.examBanned || s.suspended ? 0 : getEffectiveScore(s)

const isRecordPassed = (s: any, rule: SubjectRule, course: CourseScoreConfig): boolean => {
  const score = getEffectiveScore(s)
  if (score == null || s.examBanned || s.suspended) return false
  // Xét theo cấu hình khoá (giống tổng kết): điểm thi / CC / GK dưới ngưỡng → trượt;
  // điểm HP so với ngưỡng qua môn (thường), qua môn tốt nghiệp hoặc qua môn điều kiện
  return !isFailedByCourseConfig(
    courseScoreConfigFrom(
      { ...course, scoreToPass: course?.scoreToPass ?? FALLBACK_SCORE_TO_PASS },
      s,
      {
        isGraduation: rule.graduation,
        isConditional: rule.conditional && !rule.graduation,
      }
    ),
    score
  )
}

type SubjectResult = { score: number | null; exempted: boolean; passed: boolean }

// Kết quả 1 môn khi xét chứng chỉ.
// SV có thể có nhiều bản ghi điểm cho cùng 1 môn (học, học lại, thi lại, cải thiện, phiên điểm):
// ưu tiên lần đạt có điểm cao nhất; không có lần nào đạt thì lấy lần điểm cao nhất.
// Môn miễn (exempted, không có điểm — VD phiên từ chứng chỉ Đạt/Không đạt) xét Đạt, không vào TBC.
const getSubjectResult = (
  record: any,
  subjectVersionId: string,
  rule: SubjectRule,
  course: CourseScoreConfig
): SubjectResult => {
  const records = (record.subjectClassStudent ?? []).filter(
    (s: any) => s.subjectVersionId === subjectVersionId && isRecordUsable(s)
  )

  let found = false
  let bestPassed = false
  let bestScore: number | null = null
  for (const s of records) {
    const passed = isRecordPassed(s, rule, course)
    const score = getRecordScore(s)
    if (
      !found ||
      (passed && !bestPassed) ||
      (passed === bestPassed && score != null && (bestScore == null || score > bestScore))
    ) {
      found = true
      bestPassed = passed
      bestScore = score
    }
  }
  if (bestPassed) return { score: bestScore, exempted: false, passed: true }

  const hasExemption = records.some((s: any) => s.exempted && getEffectiveScore(s) == null)
  if (hasExemption) return { score: null, exempted: true, passed: true }
  return { score: bestScore, exempted: false, passed: false }
}

const formatSubjectCell = (result: SubjectResult, empty: string) => {
  if (result.exempted) return "Miễn"
  return result.score ?? empty
}

// Trạng thái chứng chỉ hiện có của SV: APPROVED = đã cấp, PENDING = đang chờ duyệt.
// REJECTED/CANCEL không tính → được xét lại.
const getArchivedStatus = (record: any): "APPROVED" | "PENDING" | null => {
  const list: any[] = record.archivedCertificate ?? []
  if (list.some((a) => a.status === "APPROVED")) return "APPROVED"
  if (list.some((a) => a.status === "PENDING")) return "PENDING"
  return null
}

export default function AutoCheckCertificate() {
  const [form] = Form.useForm()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const certificateId = Form.useWatch("certificateId", form)
  const trainingCourseId = Form.useWatch("trainingCourseId", form)
  const fixedClassIds = Form.useWatch("fixedClassIds", form)

  const [hasSearched, setHasSearched] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const { mutateAsync: createManyArchivedCertificate } = useCreateManyArchivedCertificate()

  const { data: certificates = [] } = useFindManyCertificate({
    where: { subjectVersions: { some: {} } },
    include: { subjectVersions: true },
    orderBy: { name: "asc" },
  })

  const selectedCertificate = useMemo(() => {
    return certificates.find((c) => c.id === certificateId)
  }, [certificates, certificateId])

  const { data: trainingCourses = [] } = useFindManyTrainingCourse(
    {
      where: { trainingObjectTypeId },
      orderBy: { semesterStart: { startDate: "desc" } },
    },
    { enabled: !!trainingObjectTypeId }
  )

  const { data: fixedClasses = [] } = useFindManyFixedClass(
    {
      where: { trainingCourseId, trainingCourse: { trainingObjectTypeId } },
      orderBy: { name: "asc" },
    },
    { enabled: !!trainingObjectTypeId }
  )

  const whereStudent = useMemo(() => {
    if (!trainingCourseId || !selectedCertificate) return undefined
    return {
      fixedClass: {
        trainingCourseId,
        ...(fixedClassIds && fixedClassIds.length > 0 ? { id: { in: fixedClassIds } } : {}),
      },
    }
  }, [trainingCourseId, fixedClassIds, selectedCertificate])

  const { data: students = [], isFetching } = useFindManyStudent(
    {
      where: whereStudent!,
      include: {
        userProfile: true,
        fixedClass: true,
        subjectClassStudent: {
          where: {
            subjectVersionId: {
              in: selectedCertificate?.subjectVersions?.map((sv) => sv.id) || [],
            },
          },
          include: {
            subjectVersion: true,
            subjectClass: { select: { cancelled: true, type: true } },
          },
        },
        archivedCertificate: {
          where: {
            certificateId: selectedCertificate?.id,
            status: { in: ["APPROVED", "PENDING"] },
          },
          select: { id: true, status: true },
        },
      },
      orderBy: [{ userProfile: { firstName: "asc" } }, { userProfile: { lastName: "asc" } }],
    },
    { enabled: !!whereStudent && hasSearched }
  )

  const selectedTrainingCourse = useMemo(
    () => trainingCourses.find((tc) => tc.id === trainingCourseId),
    [trainingCourses, trainingCourseId]
  )

  const certificateSubjectVersionIds = useMemo(
    () => selectedCertificate?.subjectVersions?.map((sv) => sv.id) ?? [],
    [selectedCertificate]
  )

  const curriculumVersionIds = useMemo(
    () => [
      ...new Set(
        students.map(getStudentCurriculumVersionId).filter((id): id is string => !!id)
      ),
    ],
    [students]
  )

  // Cấu hình môn (tính TBC / môn điều kiện) theo CTĐT của từng SV
  const { data: curriculumSubjects = [], isFetching: isFetchingCurriculum } =
    useFindManyTrainingBlockSubject(
      {
        where: {
          active: true,
          subjectId: { in: certificateSubjectVersionIds },
          trainingBlockOnCurriculumVersion: {
            curriculumVersionId: { in: curriculumVersionIds },
          },
        },
        select: {
          subjectId: true,
          useForFinalScore: true,
          graduation: true,
          trainingBlockOnCurriculumVersion: { select: { curriculumVersionId: true } },
        },
      },
      {
        enabled:
          hasSearched &&
          certificateSubjectVersionIds.length > 0 &&
          curriculumVersionIds.length > 0,
      }
    )

  const curriculumRuleMap = useMemo<CurriculumRuleMap>(() => {
    const map: CurriculumRuleMap = new Map()
    for (const item of curriculumSubjects as any[]) {
      const curriculumVersionId = item.trainingBlockOnCurriculumVersion?.curriculumVersionId
      if (!curriculumVersionId) continue
      if (!map.has(curriculumVersionId)) map.set(curriculumVersionId, new Map())
      const rules = map.get(curriculumVersionId)!
      const existing = rules.get(item.subjectId)
      // Môn xuất hiện nhiều khối: chỉ là môn điều kiện khi mọi khối đều không tính điểm
      rules.set(item.subjectId, {
        conditional: (existing?.conditional ?? true) && !item.useForFinalScore,
        graduation: (existing?.graduation ?? false) || item.graduation,
      })
    }
    return map
  }, [curriculumSubjects])

  const getSubjectResultOf = (record: any, subjectVersionId: string) =>
    getSubjectResult(
      record,
      subjectVersionId,
      getSubjectRule(record, subjectVersionId, curriculumRuleMap),
      selectedTrainingCourse
    )

  // Môn tính TBC (theo CTĐT): phải qua môn theo ngưỡng của khoá và vào TBC theo tín chỉ.
  // Môn điều kiện (CTĐT không tính điểm, VD QPAN): chỉ cần đạt, không vào TBC.
  // Môn miễn: Đạt, không vào TBC.
  const getStudentResult = (record: any) => {
    let totalScore = 0
    let totalCredit = 0
    let hasFailedSubject = false
    const subjectVersions = selectedCertificate?.subjectVersions ?? []

    subjectVersions.forEach((sv) => {
      const rule = getSubjectRule(record, sv.id, curriculumRuleMap)
      const { score, exempted, passed } = getSubjectResult(
        record,
        sv.id,
        rule,
        selectedTrainingCourse
      )
      if (!passed) hasFailedSubject = true
      if (exempted || rule.conditional) return

      totalScore += (score ?? 0) * sv.credit
      totalCredit += sv.credit
    })

    if (totalCredit === 0) {
      // Không có môn tính TBC (toàn môn điều kiện / miễn) → đạt hết các môn là Đạt
      return {
        tbc: null as number | null,
        isPassed: subjectVersions.length > 0 && !hasFailedSubject,
      }
    }

    const tbc = totalScore / totalCredit
    const threshold = selectedCertificate?.scoreThreshold ?? 5
    const isPassed = tbc >= threshold && !hasFailedSubject
    return { tbc: tbc as number | null, isPassed }
  }

  const handleSearch = () => {
    if (!certificateId) {
      return message.warning("Vui lòng chọn chứng chỉ!")
    }
    if (!trainingCourseId) {
      return message.warning("Vui lòng chọn khóa học!")
    }
    setHasSearched(true)
    setSelectedRowKeys([])
  }

  const handleApprove = () => {
    const targetStudents =
      selectedRowKeys.length > 0 ? students.filter((s) => selectedRowKeys.includes(s.id)) : students

    const passedStudentsToApprove = targetStudents.filter((s) => {
      const { isPassed } = getStudentResult(s)
      return isPassed && !getArchivedStatus(s)
    })

    if (passedStudentsToApprove.length === 0) {
      return message.warning("Không có sinh viên nào đủ điều kiện để phê duyệt!")
    }

    Modal.confirm({
      title: "Xác nhận phê duyệt",
      content: `Bạn có chắc chắn muốn phê duyệt chứng chỉ cho ${passedStudentsToApprove.length} sinh viên?`,
      onOk: async () => {
        try {
          await createManyArchivedCertificate({
            data: passedStudentsToApprove.map((s) => {
              const { tbc } = getStudentResult(s)
              return {
                studentId: s.id,
                certificateId: selectedCertificate!.id,
                status: "APPROVED",
                finalScore: tbc ?? 0,
              }
            }),
          })
          message.success("Phê duyệt thành công!")
          // Invalidate to refetch
          queryClient.invalidateQueries({ queryKey: ["Student"] })
          setSelectedRowKeys([])
        } catch (error) {
          message.error("Có lỗi xảy ra khi phê duyệt!")
        }
      },
    })
  }

  const handleExport = async () => {
    if (!certificateId || !trainingCourseId) {
      return message.warning("Vui lòng chọn chứng chỉ và khóa học!")
    }

    if (!selectedCertificate || students.length === 0) {
      return message.warning("Không có dữ liệu để xuất!")
    }

    try {
      message.loading({ content: "Đang xuất file...", key: "export-excel" })

      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet("Danh Sach")

      const centerStyle = {
        alignment: { horizontal: "center" as const, vertical: "middle" as const },
      }

      const svCols =
        selectedCertificate.subjectVersions?.map((sv) => ({
          header: `${sv.code} (${sv.credit} TC)`,
          key: `sub_${sv.id}`,
          width: 15,
          style: centerStyle,
        })) || []

      const allCols = [
        { header: "STT", key: "stt", width: 10, style: centerStyle },
        { header: "Mã định danh", key: "code", width: 15 },
        { header: "Họ và tên", key: "fullname", width: 25 },
        { header: "Ngày sinh", key: "dob", width: 15 },
        { header: "CCCD/CMND", key: "cccd", width: 20 },
        { header: "Lớp", key: "classCode", width: 15, style: centerStyle },
        ...svCols,
        { header: "Điểm TBC", key: "tbc", width: 15, style: centerStyle },
        { header: "Kết quả", key: "result", width: 15, style: centerStyle },
      ]

      sheet.columns = allCols

      const headerRow = sheet.getRow(1)
      allCols.forEach((col, index) => {
        headerRow.getCell(index + 1).value = col.header
      })
      headerRow.font = { bold: true, size: 12, name: "Times New Roman" }
      headerRow.alignment = { horizontal: "center", vertical: "middle", wrapText: true }

      students.forEach((record, index) => {
        const { tbc, isPassed } = getStudentResult(record)

        const rowData: any = {
          stt: index + 1,
          code: record.userProfile?.code,
          fullname: record.userProfile?.fullname || "",
          dob: record.userProfile?.dateOfBirth
            ? dayjs(record.userProfile.dateOfBirth).format("DD/MM/YYYY")
            : "",
          cccd: record.userProfile?.idCardNumber || "",
          classCode: record.fixedClass?.code || "",
          tbc: tbc ? tbc.toFixed(2) : "",
        }

        selectedCertificate.subjectVersions?.forEach((sv) => {
          rowData[`sub_${sv.id}`] = formatSubjectCell(getSubjectResultOf(record, sv.id), "")
        })

        const archivedStatus = getArchivedStatus(record)
        if (archivedStatus === "APPROVED") {
          rowData.result = "Đã cấp"
        } else if (archivedStatus === "PENDING") {
          rowData.result = "Chờ duyệt"
        } else {
          rowData.result = isPassed ? "Đạt" : "Không đạt"
        }

        const row = sheet.addRow(rowData)

        const resultCell = row.getCell("result")
        resultCell.font = {
          name: "Times New Roman",
          bold: true,
          color: {
            argb:
              rowData.result === "Đạt" || rowData.result === "Đã cấp"
                ? "FF008000"
                : rowData.result === "Chờ duyệt"
                  ? "FFFF8C00"
                  : "FFFF0000",
          },
        }
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      saveAs(blob, "DANH_SACH_XET_CHUNG_CHI.xlsx")

      message.success({ content: "Xuất file thành công!", key: "export-excel" })
    } catch (error) {
      console.error(error)
      message.error({ content: "Có lỗi xảy ra khi xuất file", key: "export-excel" })
    }
  }

  const columns = useMemo(() => {
    const baseCols = [
      {
        title: "STT",
        dataIndex: "stt",
        key: "stt",
        width: 60,
        align: "center" as const,
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: "Mã định danh",
        dataIndex: "code",
        align: "center",
        key: "code",
        width: 120,
        render: (_: any, record: any) => record.userProfile?.code || "",
      },
      {
        title: "Họ và tên",
        dataIndex: "fullname",
        key: "fullname",
        render: (_: any, record: any) => record.userProfile?.fullname,
      },
      {
        title: "Ngày sinh",
        key: "dateOfBirth",
        width: 120,
        align: "center" as const,
        render: (_: any, record: any) =>
          record.userProfile?.dateOfBirth
            ? dayjs(record.userProfile.dateOfBirth).format("DD/MM/YYYY")
            : "-",
      },
      {
        title: "CCCD/CMND",
        key: "idCardNumber",
        width: 140,
        align: "center" as const,
        render: (_: any, record: any) => record.userProfile?.idCardNumber || "-",
      },
      {
        title: "Lớp",
        dataIndex: "classCode",
        align: "center",
        key: "classCode",
        width: 120,
        render: (_: any, record: any) => (
          <Tooltip title={record.fixedClass?.name}>
            <div className="truncate max-w-[100px]">{record.fixedClass?.code}</div>
          </Tooltip>
        ),
      },
    ]

    const subjectCols =
      selectedCertificate?.subjectVersions?.map((sv) => ({
        title: (
          <Tooltip title={sv.name}>
            <span>
              {sv.code} ({sv.credit} TC)
            </span>
          </Tooltip>
        ),
        key: sv.id,
        align: "center" as const,
        width: 150,
        render: (_: any, record: any) => {
          return formatSubjectCell(getSubjectResultOf(record, sv.id), "-")
        },
      })) || []

    const resultCols = [
      {
        title: "Điểm TBC",
        key: "accumulatedScore",
        align: "center" as const,
        width: 120,
        render: (_: any, record: any) => {
          const { tbc } = getStudentResult(record)
          return <span className="font-semibold">{tbc ? tbc.toFixed(2) : "-"}</span>
        },
      },
      {
        title: "ĐK Điểm",
        key: "scoreThreshold",
        align: "center" as const,
        width: 100,
        render: () => (
          <span className="font-medium text-gray-600">
            {selectedCertificate?.scoreThreshold ?? 5}
          </span>
        ),
      },
      {
        title: "Kết quả",
        key: "result",
        align: "center" as const,
        width: 120,
        render: (_: any, record: any) => {
          const archivedStatus = getArchivedStatus(record)
          if (archivedStatus === "APPROVED") {
            return <span className="text-blue-600 font-bold">Đã cấp</span>
          }
          if (archivedStatus === "PENDING") {
            return <span className="text-orange-500 font-bold">Chờ duyệt</span>
          }

          const { isPassed } = getStudentResult(record)
          return (
            <span className={isPassed ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
              {isPassed ? "Đạt" : "Không đạt"}
            </span>
          )
        },
      },
    ]

    return [...baseCols, ...subjectCols, ...resultCols]
  }, [selectedCertificate, curriculumRuleMap, selectedTrainingCourse])

  return (
    <div className=" bg-white rounded-md flex flex-col h-full">
      <Form form={form} layout="vertical">
        <Row gutter={[8, 8]}>
          <Col span={6}>
            <Form.Item name="certificateId" label="Chứng chỉ" className="mb-4">
              <Select
                options={certificates.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                placeholder="Chọn chứng chỉ"
                onChange={() => setHasSearched(false)}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="trainingCourseId" label="Khóa học" className="mb-4">
              <Select
                options={trainingCourses.map((tc) => ({
                  value: tc.id,
                  label: tc.name,
                }))}
                placeholder="Chọn khóa học"
                onChange={() => {
                  form.setFieldValue("fixedClassIds", undefined)
                  setHasSearched(false)
                }}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="fixedClassIds" label="Lớp quản lý" className="mb-4">
              <Select
                mode="multiple"
                options={fixedClasses.map((fc) => ({
                  value: fc.id,
                  label: fc.code + " - " + fc.name,
                }))}
                placeholder="Tất cả lớp"
                onChange={() => setHasSearched(false)}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={6} className="flex items-end mb-4 gap-2">
            <Button
              type="default"
              onClick={handleSearch}
              disabled={!certificateId || !trainingCourseId}
            >
              Kiểm tra
            </Button>
            <Button
              type="primary"
              onClick={handleApprove}
              disabled={!hasSearched || students.length === 0 || isFetchingCurriculum}
            >
              Phê duyệt
            </Button>
            <Button
              type="primary"
              onClick={handleExport}
              disabled={!hasSearched || students.length === 0 || isFetchingCurriculum}
            >
              Xuất Excel
            </Button>
          </Col>
        </Row>
      </Form>
      <div className="flex-1 overflow-hidden">
        <Table
          columns={columns as any}
          dataSource={students}
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record: any) => {
              const { isPassed } = getStudentResult(record)
              return {
                disabled: !!getArchivedStatus(record) || !isPassed,
              }
            },
          }}
          loading={isFetching || isFetchingCurriculum}
          pagination={{ defaultPageSize: 20, showSizeChanger: true }}
          bordered
        />
      </div>
    </div>
  )
}

AutoCheckCertificate.getLayout = function getLayout(page: React.ReactElement) {
  return <DefaultLayout>{page}</DefaultLayout>
}
