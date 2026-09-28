import { DeleteOutlined, PlusOutlined } from "@ant-design/icons"
import { queryClient } from "@api/index"
import DatePicker from "@components/commons/date-picker"
import DocumentPaths from "@components/commons/documentPaths"
import FileUploadButton from "@components/commons/file-upload-button"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import type { DocumentFile } from "@workspace/db"
import {
  useCreateArchivedCertificate,
  useFindManyCertificate,
  useFindManyFixedClass,
  useFindManyStudent,
  useFindManyTrainingCourse,
  useUpdateArchivedCertificate,
} from "@workspace/db/hooks"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { Button, Col, Form, Input, InputNumber, Switch, message, Typography } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import {
  confirmViolations,
  useCertificateExpirationCheck,
} from "./utils/check-certificate-expiration"

type CurriculumSubject = {
  id: string
  name: string
  code?: string | null
  credit?: number | null
  subjectId?: string | null
}

type SubjectScoreItem = {
  subjectVersionId: string
  finalScore: number
}

type SelectedStudentRow = {
  rowId: string
  studentId: string
  code: string
  fullname: string
  dateOfBirth: Date | string | null
  fixedClassId: string | null
  curriculumSubjects: CurriculumSubject[]
}

export type PutArchivedCertificate = {
  documentFiles?: DocumentFile[]
  trainingCoursesId?: string
  fixedClassesId?: string
  student: Record<
    string,
    {
      certificateId: string
      score?: number
      listeningScore?: number
      speakingScore?: number
      readingScore?: number
      writingScore?: number
      issuedBy: string
      decisionNumber?: string
      issuedDate?: dayjs.Dayjs
      expiredDate?: dayjs.Dayjs
      description?: string
      documentFiles?: DocumentFile[]
      subjectScores?: SubjectScoreItem[]
    }
  >
}
dayjs.locale("vi")

const { Title } = Typography

const OPTIONAL_SUBJECT_SCORE_HINT =
  "Không chọn môn: chỉ ghi nhận chứng chỉ."

function getCurriculumSubjects(student: any): CurriculumSubject[] {
  const curriculumVersion =
    student?.curriculumVersion || student?.fixedClass?.curriculumVersion
  if (!curriculumVersion?.trainingBlocks) return []

  const map = new Map<string, CurriculumSubject>()
  for (const block of curriculumVersion.trainingBlocks) {
    for (const tbs of block.subjects || []) {
      const sv = tbs.subject
      if (!sv?.id || map.has(sv.id)) continue
      map.set(sv.id, {
        id: sv.id,
        name: sv.name,
        code: sv.code,
        credit: sv.credit,
        subjectId: sv.subjectId,
      })
    }
  }
  return [...map.values()]
}

function getConvertibleSubjects(
  cert: any,
  curriculumSubjects: CurriculumSubject[]
): CurriculumSubject[] {
  if (!cert?.subjects?.length) return []

  const curriculumById = new Map(curriculumSubjects.map((s) => [s.id, s]))
  const result: CurriculumSubject[] = []
  const used = new Set<string>()

  for (const mapping of cert.subjects) {
    const versions = mapping.subject?.subjectVersion || []
    if (!versions.length) {
      for (const subject of curriculumSubjects) {
        if (subject.subjectId !== mapping.subjectId || used.has(subject.id)) continue
        used.add(subject.id)
        result.push(subject)
      }
      continue
    }

    for (const version of versions) {
      if (!version?.id || used.has(version.id)) continue
      used.add(version.id)
      result.push(
        curriculumById.get(version.id) || {
          id: version.id,
          name: version.name,
          code: version.code,
          credit: version.credit,
          subjectId: version.subjectId || mapping.subjectId,
        }
      )
    }
  }

  return result
}

function getMappedFinalScore(cert: any, subject: CurriculumSubject): number {
  const mapping = cert?.subjects?.find((item: any) => item.subjectId === subject.subjectId)
  return mapping?.finalScore ?? 0
}

function getSelectableSubjects(cert: any, curriculumSubjects: CurriculumSubject[]): CurriculumSubject[] {
  const configured = getConvertibleSubjects(cert, curriculumSubjects)
  if (configured.length) return configured
  return curriculumSubjects
}

const PutCertificateArchivedModal = () => {
  const [documentFiles, setDocumentFiles] = useState<DocumentFile[]>([])
  const [selectedStudents, setSelectedStudents] = useState<SelectedStudentRow[]>([])
  const [subjectScoresByRow, setSubjectScoresByRow] = useState<Record<string, SubjectScoreItem[]>>(
    {}
  )
  const [showLanguageScoreColumns, setShowLanguageScoreColumns] = useState(true)
  const [rowCounter, setRowCounter] = useState(0)
  const [form] = Form.useForm<PutArchivedCertificate>()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutCertificateArchivedModal",
    onClose: () => {
      form.resetFields()
      setSelectedStudents([])
      setSubjectScoresByRow({})
      setRowCounter(0)
    },
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createArchivedCertificate } = useCreateArchivedCertificate()
  const { mutateAsync: updateArchivedCertificate } = useUpdateArchivedCertificate()
  const { data: certificate = [] } = useFindManyCertificate(
    {
      include: {
        subjects: {
          where: { deletedAt: null },
          include: {
            subject: {
              include: {
                subjectVersion: {
                  where: {
                    deletedAt: null,
                    ...(trainingObjectTypeId ? { trainingObjectTypeId } : {}),
                  },
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    credit: true,
                    subjectId: true,
                  },
                },
              },
            },
          },
        },
      },
    },
    { enabled: !!trainingObjectTypeId }
  )
  const { runCheck } = useCertificateExpirationCheck(certificate as any)
  const { data: trainingCourses = [] } = useFindManyTrainingCourse(
    {
      where: { trainingObjectTypeId },
      orderBy: {
        semesterStart: {
          startDate: "desc",
        },
      },
    },
    { enabled: !!trainingObjectTypeId }
  )
  const fixedClassId = Form.useWatch("fixedClassesId", form)
  const trainingCoursesId = Form.useWatch("trainingCoursesId", form)
  const studentFormData = Form.useWatch("student", form) ?? {}

  const { data: fixedClasses = [] } = useFindManyFixedClass({
    where: {
      trainingCourseId: trainingCoursesId ?? undefined,
    },
  })

  const studentWhere = useMemo(() => {
    return {
      fixedClass: {
        ...(trainingCoursesId ? { trainingCourseId: trainingCoursesId } : {}),
        ...(fixedClassId ? { id: fixedClassId } : {}),
      },
    }
  }, [trainingCoursesId, fixedClassId])

  const curriculumInclude = {
    trainingBlocks: {
      include: {
        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                credit: true,
                subjectId: true,
              },
            },
          },
        },
      },
    },
  }

  const { data: studentData = [] } = useFindManyStudent(
    {
      where: studentWhere || {},
      include: {
        userProfile: {
          select: {
            code: true,
            dateOfBirth: true,
            fullname: true,
          },
        },
        curriculumVersion: {
          include: curriculumInclude,
        },
        fixedClass: {
          include: {
            curriculumVersion: {
              include: curriculumInclude,
            },
          },
        },
      },
      orderBy: {
        userProfile: {
          firstName: "asc",
        },
      },
    },
    { enabled: !!trainingObjectTypeId }
  )

  const handleAddStudent = useCallback(
    (studentId: string) => {
      const student = studentData.find((s: any) => s.id === studentId)
      if (!student) return

      const newRowId = `row_${rowCounter}`
      setRowCounter((prev) => prev + 1)
      setSelectedStudents((prev) => [
        ...prev,
        {
          rowId: newRowId,
          studentId: student.id,
          code: student.userProfile?.code || "",
          fullname: student.userProfile?.fullname || "",
          dateOfBirth: student.userProfile?.dateOfBirth || null,
          fixedClassId: student.fixedClassId ?? student.fixedClass?.id ?? null,
          curriculumSubjects: getCurriculumSubjects(student),
        },
      ])
    },
    [studentData, rowCounter]
  )

  const handleRemoveRow = useCallback(
    (rowId: string) => {
      setSelectedStudents((prev) => prev.filter((r) => r.rowId !== rowId))
      setSubjectScoresByRow((prev) => {
        const next = { ...prev }
        delete next[rowId]
        return next
      })
      const currentStudent = form.getFieldValue("student") || {}
      delete currentStudent[rowId]
      form.setFieldValue("student", currentStudent)
    },
    [form]
  )

  const setSubjectScores = useCallback(
    (rowId: string, scores: SubjectScoreItem[]) => {
      setSubjectScoresByRow((prev) => ({ ...prev, [rowId]: scores }))
      form.setFieldValue(["student", rowId, "subjectScores"], scores)
    },
    [form]
  )

  const handleCertificateChange = useCallback(
    (rowId: string, certificateId: string) => {
      form.setFieldValue(["student", rowId, "certificateId"], certificateId)
      setSubjectScores(rowId, [])
    },
    [form, setSubjectScores]
  )

  const getSubjectScores = (rowId: string): SubjectScoreItem[] =>
    subjectScoresByRow[rowId] || []

  async function onOk({ ...rest }: PutArchivedCertificate) {
    try {
      if (!id && selectedStudents.length === 0) {
        message.warning("Vui lòng thêm ít nhất một học viên")
        return
      }

      await form.validateFields()

      if (id) {
      } else {
        const latestStudentFormData = form.getFieldValue("student") || {}

        for (const row of selectedStudents) {
          const data = latestStudentFormData[row.rowId] || studentFormData[row.rowId] || {}
          if (!data?.certificateId) continue
          if (subjectScoresByRow[row.rowId]?.some((s) => s.finalScore == null)) {
            message.warning(`Vui lòng nhập điểm phiên cho ${row.fullname || row.code}`)
            return
          }
        }

        const itemsForCheck = selectedStudents
          .map((row) => {
            const data = latestStudentFormData[row.rowId] || studentFormData[row.rowId] || {}
            if (!data?.certificateId) return null
            return {
              studentId: row.studentId,
              studentName: row.fullname,
              studentFixedClassId: row.fixedClassId,
              certificateId: data.certificateId as string,
              expiredDate: data.expiredDate ? data.expiredDate.toDate() : null,
            }
          })
          .filter((x): x is NonNullable<typeof x> => !!x)

        const violations = await runCheck(itemsForCheck)
        if (violations.length > 0) {
          const proceed = await confirmViolations(violations)
          if (!proceed) return
        }

        showSpinner()
        const createdCertificates: any[] = []

        for (const row of selectedStudents) {
          const studentDataForRow =
            latestStudentFormData[row.rowId] || studentFormData[row.rowId] || {}
          if (!studentDataForRow?.certificateId) continue

          const studentFiles =
            form.getFieldValue(["student", row.rowId, "documentFiles"]) ||
            studentDataForRow.documentFiles ||
            []

          const subjectScores: SubjectScoreItem[] = (subjectScoresByRow[row.rowId] || []).filter(
            (s) => s.subjectVersionId
          )

          const result = await createArchivedCertificate({
            data: {
              studentId: row.studentId,
              certificateId: studentDataForRow.certificateId,
              finalScore: 0,
              score: studentDataForRow.score || 0,
              listeningScore: studentDataForRow.listeningScore || null,
              speakingScore: studentDataForRow.speakingScore || null,
              readingScore: studentDataForRow.readingScore || null,
              writingScore: studentDataForRow.writingScore || null,
              issuedBy: studentDataForRow.issuedBy || "",
              decisionNumber: studentDataForRow.decisionNumber || null,
              issuedDate: studentDataForRow.issuedDate?.toDate() as Date,
              expiredDate: studentDataForRow.expiredDate?.toDate() || null,
              description: studentDataForRow.description?.trim() || null,
              status: "PENDING",
              documentFiles: {
                create: studentFiles.map((file: any) => ({
                  name: file.name,
                  path: file.path,
                  mimeType: file.mimeType,
                  size: file.size,
                })),
              },
              ...(subjectScores.length
                ? {
                    subjectScores: {
                      create: subjectScores.map((s) => ({
                        subjectVersionId: s.subjectVersionId,
                        finalScore: s.finalScore,
                      })),
                    },
                  }
                : {}),
            },
          })
          if (result) {
            createdCertificates.push({ id: result.id, studentId: row.studentId })
          }
        }

        message.success(`Đã thêm mới ${createdCertificates.length} chứng chỉ`)
        queryClient.invalidateQueries({
          queryKey: ["ArchivedCertificate"],
        })
        onClose()
        return
      }

      queryClient.invalidateQueries({
        queryKey: ["ArchivedCertificate"],
      })
      onClose()
    } catch (error: any) {
      if (error?.info?.message) {
        message.error(error?.info?.message)
        return
      }
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    form.setFieldsValue({
      documentFiles: [],
    })
    setDocumentFiles([])
  }, [])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa đơn phiên điểm" : "Thêm mới đơn phiên điểm"}
      className="w-[95vw]"
    >
      <Col span={12} className="mb-4">
        <FormItem form={form} name="trainingCoursesId" label="Khoá">
          <Select
            showSearch
            style={{ width: "100%" }}
            placeholder="Chọn khoá"
            options={trainingCourses.map((item) => ({
              label: `${item?.code || ""} - ${item.name}`,
              value: item.id,
            }))}
          />
        </FormItem>
      </Col>
      <Col span={12} className="mb-4">
        <FormItem form={form} name="fixedClassesId" label="Lớp quản lý">
          <Select
            showSearch
            style={{ width: "100%" }}
            placeholder="Chọn lớp quản lý"
            options={fixedClasses.map((item) => ({
              label: `${item?.code || ""} - ${item.name}`,
              value: item.id,
            }))}
          />
        </FormItem>
      </Col>

      {!id && (
        <Col span={24} className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <Title level={5} className="m-0">
              Học viên, sinh viên
            </Title>
            <div className="flex items-center gap-2">
              <span className="text-sm">Điểm ngoại ngữ</span>
              <Switch
                checked={showLanguageScoreColumns}
                onChange={setShowLanguageScoreColumns}
                size="small"
              />
            </div>
          </div>

          <div className="mb-3">
            <Select
              showSearch
              style={{ width: "100%" }}
              placeholder="Tìm và chọn sinh viên để thêm vào danh sách..."
              value={undefined}
              onSelect={(value: string) => handleAddStudent(value)}
              options={studentData.map((item: any) => ({
                label: `${item.userProfile?.code || ""} - ${item.userProfile?.fullname || ""}`,
                value: item.id,
              }))}
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </div>

          {selectedStudents.length > 0 && (
            <Table
              rowKey="rowId"
              data={selectedStudents}
              scroll={{ y: 400, x: 2100 }}
              columns={[
                {
                  title: "TT",
                  width: 35,
                  align: "center",
                  render: (_, __, index) => index + 1,
                },
                {
                  title: "Mã định danh",
                  width: 120,
                  align: "center",
                  render: (_, record) => record.code,
                },
                {
                  title: "Họ và tên",
                  align: "left",
                  width: 180,
                  render: (_, record) => record.fullname,
                },
                {
                  title: "Ngày sinh",
                  width: 100,
                  align: "center",
                  render: (_, record) =>
                    record.dateOfBirth ? dayjs(record.dateOfBirth).format("DD/MM/YYYY") : "",
                },
                {
                  title: "Chứng chỉ",
                  width: 220,
                  align: "center",
                  render: (_, record) => (
                    <FormItem
                      form={form}
                      name={["student", record.rowId, "certificateId"]}
                      rules={[{ required: true, message: "Vui lòng chọn chứng chỉ" }]}
                    >
                      <Select
                        variant="underlined"
                        options={certificate.map((item: any) => ({
                          label: item.name,
                          value: item.id,
                        }))}
                        placeholder="Chọn chứng chỉ"
                        onChange={(value: string) => handleCertificateChange(record.rowId, value)}
                      />
                    </FormItem>
                  ),
                },
                {
                  title: "Điểm phiên",
                  width: 320,
                  align: "left",
                  render: (_, record: SelectedStudentRow) => {
                    const selectedCertificateId = studentFormData?.[record.rowId]?.certificateId
                    const selectedCertificate = certificate.find((c) => c.id === selectedCertificateId)
                    const subjectOptions = getSelectableSubjects(
                      selectedCertificate,
                      record.curriculumSubjects
                    )
                    const scores = getSubjectScores(record.rowId)
                    const selectedIds = new Set(scores.map((s) => s.subjectVersionId))
                    const availableSubjects = subjectOptions.filter(
                      (s: CurriculumSubject) => !selectedIds.has(s.id)
                    )

                    if (!selectedCertificateId) {
                      return (
                        <span className="text-gray-500 text-xs">
                          Chọn chứng chỉ để chọn môn phiên
                        </span>
                      )
                    }

                    if (!subjectOptions.length) {
                      return (
                        <div className="flex flex-col gap-1 py-1">
                          <span className="text-orange-500 text-xs">
                            SV chưa có CTĐT / không có môn
                          </span>
                          <span className="text-gray-500 text-xs">{OPTIONAL_SUBJECT_SCORE_HINT}</span>
                        </div>
                      )
                    }

                    return (
                      <div className="flex flex-col gap-1 py-1">
                        {!scores.length && (
                          <span className="text-gray-500 text-xs">{OPTIONAL_SUBJECT_SCORE_HINT}</span>
                        )}
                        {scores.map((item, idx) => {
                          return (
                            <div key={item.subjectVersionId} className="flex items-center gap-1">
                              <Select
                                variant="underlined"
                                className="flex-1 min-w-0"
                                value={item.subjectVersionId}
                                options={subjectOptions
                                  .filter(
                                    (s: CurriculumSubject) =>
                                      s.id === item.subjectVersionId || !selectedIds.has(s.id)
                                  )
                                  .map((s: CurriculumSubject) => ({
                                    label: `${s.code ? `${s.code} - ` : ""}${s.name}${
                                      s.credit != null ? ` (${s.credit} TC)` : ""
                                    }`,
                                    value: s.id,
                                  }))}
                                onChange={(value: string) => {
                                  const next = [...scores]
                                  const subject = subjectOptions.find((s) => s.id === value)
                                  next[idx] = {
                                    ...next[idx],
                                    subjectVersionId: value,
                                    finalScore: subject
                                      ? getMappedFinalScore(selectedCertificate, subject)
                                      : next[idx].finalScore,
                                  }
                                  setSubjectScores(record.rowId, next)
                                }}
                              />
                              <InputNumber
                                min={0}
                                max={10}
                                step={0.1}
                                variant="underlined"
                                className="w-[70px]"
                                value={item.finalScore}
                                onChange={(value) => {
                                  const next = [...scores]
                                  next[idx] = {
                                    ...next[idx],
                                    finalScore: value ?? 0,
                                  }
                                  setSubjectScores(record.rowId, next)
                                }}
                              />
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                  setSubjectScores(
                                    record.rowId,
                                    scores.filter((_, i) => i !== idx)
                                  )
                                }}
                              />
                            </div>
                          )
                        })}
                        {availableSubjects.length > 0 && (
                          <Button
                            type="link"
                            size="small"
                            icon={<PlusOutlined />}
                            className="px-0 self-start"
                            onClick={() => {
                              setSubjectScores(record.rowId, [
                                ...scores,
                                {
                                  subjectVersionId: availableSubjects[0].id,
                                  finalScore: getMappedFinalScore(
                                    selectedCertificate,
                                    availableSubjects[0]
                                  ),
                                },
                              ])
                            }}
                          >
                            Thêm môn
                          </Button>
                        )}
                      </div>
                    )
                  },
                },
                {
                  title: "Điểm chứng chỉ",
                  width: 130,
                  align: "center",
                  render: (_, record) => {
                    const selectedCert = certificate.find(
                      (c) => c.id === studentFormData?.[record.rowId]?.certificateId
                    )
                    return (
                      <FormItem form={form} name={["student", record.rowId, "score"]}>
                        <InputNumber
                          min={1}
                          variant="underlined"
                          className="w-full"
                          placeholder="Điểm chứng chỉ"
                          disabled={!selectedCert?.isUsingScore}
                        />
                      </FormItem>
                    )
                  },
                },
                ...((showLanguageScoreColumns
                  ? [
                      {
                        title: "Nghe",
                        width: 100,
                        align: "center",
                        render: (_: any, record: any) => (
                          <FormItem form={form} name={["student", record.rowId, "listeningScore"]}>
                            <InputNumber
                              min={0}
                              variant="underlined"
                              className="w-full"
                              placeholder="Điểm nghe"
                            />
                          </FormItem>
                        ),
                      },
                      {
                        title: "Nói",
                        width: 100,
                        align: "center",
                        render: (_: any, record: any) => (
                          <FormItem form={form} name={["student", record.rowId, "speakingScore"]}>
                            <InputNumber
                              min={0}
                              variant="underlined"
                              className="w-full"
                              placeholder="Điểm nói"
                            />
                          </FormItem>
                        ),
                      },
                      {
                        title: "Đọc",
                        width: 100,
                        align: "center",
                        render: (_: any, record: any) => (
                          <FormItem form={form} name={["student", record.rowId, "readingScore"]}>
                            <InputNumber
                              min={0}
                              variant="underlined"
                              className="w-full"
                              placeholder="Điểm đọc"
                            />
                          </FormItem>
                        ),
                      },
                      {
                        title: "Viết",
                        width: 100,
                        align: "center",
                        render: (_: any, record: any) => (
                          <FormItem form={form} name={["student", record.rowId, "writingScore"]}>
                            <InputNumber
                              min={0}
                              variant="underlined"
                              className="w-full"
                              placeholder="Điểm viết"
                            />
                          </FormItem>
                        ),
                      },
                    ]
                  : []) as any[]),
                {
                  title: "Nơi cấp",
                  width: 150,
                  align: "center",
                  render: (_, record) => (
                    <FormItem form={form} name={["student", record.rowId, "issuedBy"]}>
                      <Input variant="underlined" className="w-full" placeholder="Nhập nơi cấp" />
                    </FormItem>
                  ),
                },
                {
                  title: "Số quyết định",
                  width: 150,
                  align: "center",
                  render: (_, record) => (
                    <FormItem form={form} name={["student", record.rowId, "decisionNumber"]}>
                      <Input variant="underlined" className="w-full" placeholder="Nhập số QĐ" />
                    </FormItem>
                  ),
                },
                {
                  title: "Ngày cấp",
                  width: 120,
                  align: "center",
                  render: (_, record) => (
                    <FormItem
                      form={form}
                      name={["student", record.rowId, "issuedDate"]}
                      dependencies={[["student", record.rowId, "expiredDate"]]}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            const expiredDate = getFieldValue([
                              "student",
                              record.rowId,
                              "expiredDate",
                            ])
                            if (
                              !value ||
                              !expiredDate ||
                              value.isBefore(expiredDate) ||
                              value.isSame(expiredDate, "day")
                            ) {
                              return Promise.resolve()
                            }
                            return Promise.reject(new Error("Ngày cấp không hợp lệ"))
                          },
                        }),
                      ]}
                    >
                      <DatePicker variant="underlined" className="w-full" placeholder="Chọn ngày" />
                    </FormItem>
                  ),
                },
                {
                  title: "Ngày hết hạn",
                  width: 120,
                  align: "center",
                  render: (_, record) => (
                    <FormItem
                      form={form}
                      name={["student", record.rowId, "expiredDate"]}
                      dependencies={[["student", record.rowId, "issuedDate"]]}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            const issuedDate = getFieldValue([
                              "student",
                              record.rowId,
                              "issuedDate",
                            ])
                            if (
                              !value ||
                              !issuedDate ||
                              value.isAfter(issuedDate) ||
                              value.isSame(issuedDate, "day")
                            ) {
                              return Promise.resolve()
                            }
                            return Promise.reject(new Error("Ngày hết hạn không hợp lệ"))
                          },
                        }),
                      ]}
                    >
                      <DatePicker variant="underlined" className="w-full" placeholder="Chọn ngày" />
                    </FormItem>
                  ),
                },
                {
                  title: "Ghi chú",
                  width: 180,
                  align: "center",
                  render: (_, record) => (
                    <FormItem form={form} name={["student", record.rowId, "description"]}>
                      <Input variant="underlined" className="w-full" placeholder="Nhập ghi chú" />
                    </FormItem>
                  ),
                },
                {
                  title: "Minh chứng",
                  width: 200,
                  align: "center",
                  render: (_, record) => (
                    <FileUploadButton
                      form={form}
                      fieldName={["student", record.rowId, "documentFiles"]}
                    />
                  ),
                },
                {
                  title: "",
                  width: 50,
                  align: "center",
                  render: (_, record) => (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      onClick={() => handleRemoveRow(record.rowId)}
                    />
                  ),
                },
              ]}
              pagination={false}
            />
          )}
        </Col>
      )}

      {id && (
        <Col span={24} className="mb-3">
          <FormItem form={form} name="documentFiles" label="Minh chứng">
            <DocumentPaths
              form={form}
              data={documentFiles}
              relationId={id ?? ""}
              relationType="curriculumId"
            />
          </FormItem>
        </Col>
      )}
    </PutFormModal>
  )
}

export default PutCertificateArchivedModal
