import { DeleteOutlined } from "@ant-design/icons"
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

type SelectedStudentRow = {
  rowId: string
  studentId: string
  code: string
  fullname: string
  dateOfBirth: Date | string | null
  fixedClassId: string | null
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
      documentFiles?: DocumentFile[]
    }
  >
}
dayjs.locale("vi")

const { Title } = Typography

const PutCertificateArchivedModal = () => {
  const [documentFiles, setDocumentFiles] = useState<DocumentFile[]>([])
  const [selectedStudents, setSelectedStudents] = useState<SelectedStudentRow[]>([])
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
      setRowCounter(0)
    },
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createArchivedCertificate } = useCreateArchivedCertificate()
  const { mutateAsync: updateArchivedCertificate } = useUpdateArchivedCertificate()
  const { data: certificate = [] } = useFindManyCertificate({
    include: {
      subjects: {
        include: {
          subject: true,
        },
      },
    },
  })
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
        fixedClass: true,
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
        },
      ])
    },
    [studentData, rowCounter]
  )

  const handleRemoveRow = useCallback(
    (rowId: string) => {
      setSelectedStudents((prev) => prev.filter((r) => r.rowId !== rowId))
      const currentStudent = form.getFieldValue("student") || {}
      delete currentStudent[rowId]
      form.setFieldValue("student", currentStudent)
    },
    [form]
  )

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
              status: "PENDING",
              documentFiles: {
                create: studentFiles.map((file: any) => ({
                  name: file.name,
                  path: file.path,
                  mimeType: file.mimeType,
                  size: file.size,
                })),
              },
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
              scroll={{ y: 300 }}
              columns={[
                {
                  title: "TT",
                  width: 35,
                  align: "center",
                  render: (_, __, index) => index + 1,
                },
                {
                  title: "Mã SV",
                  width: 120,
                  align: "center",
                  render: (_, record) => record.code,
                },
                {
                  title: "Họ và tên",
                  align: "left",
                  width: 200,
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
                  width: 250,
                  align: "center",
                  render: (_, record) => (
                    <FormItem
                      form={form}
                      name={["student", record.rowId, "certificateId"]}
                      rules={[{ required: true, message: "Vui lòng chọn chứng chỉ" }]}
                    >
                      <Select
                        variant="underlined"
                        options={certificate.map((item) => ({
                          label: item.name,
                          value: item.id,
                        }))}
                        placeholder="Chọn chứng chỉ"
                      />
                    </FormItem>
                  ),
                },
                {
                  title: "Điểm phiên",
                  width: 250,
                  align: "center",
                  render: (_, record) =>
                    certificate
                      .find((c) => c.id === studentFormData?.[record.rowId]?.certificateId)
                      ?.subjects.map((sub) => (
                        <p>
                          {sub.subject.name}: <b>{sub.finalScore}</b>
                        </p>
                      )),
                },
                {
                  title: "Điểm chứng chỉ",
                  width: 150,
                  align: "center",
                  render: (_, record) => {
                    const selectedCert = certificate.find(
                      (c) => c.id === studentFormData?.[record.rowId]?.certificateId
                    )
                    return (
                      <FormItem
                        form={form}
                        name={["student", record.rowId, "score"]}
                        rules={[
                          {
                            required: !!selectedCert?.isUsingScore,
                            message: "Vui lòng nhập điểm chứng chỉ",
                          },
                        ]}
                      >
                        <InputNumber
                          min={1}
                          variant="underlined"
                          className="w-full"
                          placeholder="Nhập điểm phiên cho môn học"
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
