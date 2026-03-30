import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type {
  DocumentFile,
  StudentScoreConvert,
  SubjectScoreConvert,
  SubjectVersion,
} from "@workspace/db/client"
import {
  useCreateStudentScoreConvert,
  useFindManyStudent,
  useFindUniqueStudent,
  useFindUniqueStudentScoreConvert,
} from "@workspace/db/hooks"
import { Button, Col, Form, Input, InputNumber, message, Row, Table } from "antd"
import dayjs from "dayjs"
import { useEffect, useMemo, useRef, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import { PlusOutlined } from "@ant-design/icons"
import DocumentPaths from "@components/commons/documentPaths"
import { $Enums } from "@workspace/db/client"
import { sqlTransaction } from "@workspace/libs/api/model"
import { Select } from "@workspace/ui"
import type { TableColumnsType } from "antd"
import { Trash2 } from "lucide-react"

const ScoreConvertStatus = $Enums.ScoreConvertStatus
type ScoreConvertStatus = $Enums.ScoreConvertStatus
const statusOptions = [
  { label: "Chờ duyệt", value: ScoreConvertStatus.PENDING },
  { label: "Đã duyệt", value: ScoreConvertStatus.APPROVED },
  { label: "Không được duyệt", value: ScoreConvertStatus.REJECTED },
]

export type PutStudentScoreConvert = StudentScoreConvert & {
  subjectScoreConvert: Partial<SubjectScoreConvert>[]
  documentFiles?: DocumentFile[]
}
dayjs.locale("vi")
const PutStudentScoreConvertModal = () => {
  const [form] = Form.useForm<PutStudentScoreConvert>()
  const [document, setDocument] = useState<DocumentFile[]>([])
  const [studentKeyword, setStudentKeyword] = useState<string>("")
  const originalStatusRef = useRef<Record<string, ScoreConvertStatus>>({})
  const initialSubjectsRef = useRef<Partial<SubjectScoreConvert>[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const { showSpinner, hideSpinner } = useSpinner()
  const { isOpen, onClose, input } = useDisclosure<{ id: string; mode: "view" | "edit" }>({
    tag: "PutStudentScoreConvertModal",
    onClose: () => {
      form.resetFields()
      setDocument([])
      setStudentKeyword("")
      setSelectedRowKeys([])
    },
  })
  const id = input?.id
  const isEdit = !!id
  const isViewMode = input?.mode === "view"
  const selectedSubjects = Form.useWatch("subjectScoreConvert", form) || []
  const selectedSubjectIds = useMemo(
    () => new Set(selectedSubjects.map((s: any) => s?.subjectVersionId).filter(Boolean)),
    [selectedSubjects]
  )
  const {
    data: studentList = [],
    isLoading: loadingStudents,
    isFetching: fetchingStudents,
  } = useFindManyStudent({
    where: {
      active: true,
      OR: [
        {
          userProfile: studentKeyword
            ? { fullname: { contains: studentKeyword, mode: "insensitive" } }
            : {},
        },
        { code: { contains: studentKeyword, mode: "insensitive" } },
      ],
    },
    include: { userProfile: true },
    take: 20,
  })
  const selectedStudentId = Form.useWatch("studentId", form)
  const { data: selectedStudent } = useFindUniqueStudent(
    {
      where: { id: selectedStudentId || "" },
      include: {
        curriculumVersion: {
          include: {
            trainingBlocks: { include: { subjects: { include: { subject: true } } } },
          },
        },
        fixedClass: {
          include: {
            curriculumVersion: {
              include: {
                trainingBlocks: {
                  include: { subjects: { include: { subject: true } } },
                },
              },
            },
          },
        },
      },
    },
    { enabled: !!selectedStudentId }
  )

  const allSubjectOptions = useMemo(() => {
    const cv = selectedStudent?.curriculumVersion ?? selectedStudent?.fixedClass?.curriculumVersion
    if (!cv) return []

    const list: { value: string; label: string }[] = []
    cv.trainingBlocks?.forEach((tb: any) => {
      tb.subjects?.forEach((s: any) => {
        const sv = s.subject as SubjectVersion | undefined
        if (sv?.id) {
          const label = `${sv.code ?? ""} ${sv.name ?? ""}`.trim()
          list.push({ value: sv.id, label })
        }
      })
    })
    const map = new Map<string, { value: string; label: string }>()
    list.forEach((it) => {
      map.set(it.value, it)
    })
    return Array.from(map.values())
  }, [selectedStudent])

  const { mutateAsync: createStudentScoreConvert } = useCreateStudentScoreConvert()

  async function onOk(output?: PutStudentScoreConvert) {
    if (!output) return

    const rows = (output.subjectScoreConvert || []) as Array<{
      id?: string
      subjectVersionId?: string
      score?: number | string
      status?: ScoreConvertStatus
    }>

    const toCreate = rows
      .filter((r) => !r.id && r.subjectVersionId && r.score !== undefined && r.score !== null)
      .map((r) => ({
        subjectVersionId: r.subjectVersionId ?? "",
        score: Number(r.score),
        status: r.status,
      }))

    const toUpdate = rows
      .filter((r) => !!r.id && originalStatusRef.current[r.id] !== ScoreConvertStatus.APPROVED)
      .map((r) => ({
        where: { id: r.id },
        data: {
          subjectVersionId: r.subjectVersionId ?? "",
          score: Number(r.score),
          status: r.status,
        },
      }))

    const toDelete: { id: string }[] = []
    if (isEdit) {
      const initialIds = new Set(initialSubjectsRef.current.map((s) => s.id).filter(Boolean))
      const finalIds = new Set(rows.map((r) => r.id).filter(Boolean))
      for (const idToDelete of initialIds) {
        if (!finalIds.has(idToDelete)) {
          toDelete.push({ id: idToDelete as string })
        }
      }
    }

    try {
      showSpinner()
      if (id) {
        const scoresToCreate = rows
          .filter(
            (row) =>
              row.id &&
              row.status === ScoreConvertStatus.APPROVED &&
              originalStatusRef.current[row.id] !== ScoreConvertStatus.APPROVED
          )
          .map((row) => ({
            studentId: output.studentId,
            subjectVersionId: row.subjectVersionId,
            finalScore: Number(row.score),
            manualFinalScore: Number(row.score),
            description: "Điểm sinh viên chuyển trường",
          }))
        const listSqlTransaction: any[] = [
          {
            model: "StudentScoreConvert",
            operation: "update",
            data: {
              where: { id },
              data: {
                studentId: output.studentId,
                description: output.description,
                documentFiles: {
                  upsert: (output.documentFiles || [])
                    .filter((file) => !!file.id)
                    .map((file) => ({
                      where: { id: file.id },
                      create: {
                        name: file.name,
                        path: file.path,
                        mimeType: file.mimeType,
                        size: file.size,
                      },
                      update: {
                        name: file.name,
                        path: file.path,
                        mimeType: file.mimeType,
                        size: file.size,
                      },
                    })),

                  create: (output.documentFiles || [])
                    .filter((file) => !file.id)
                    .map((file) => ({
                      name: file.name,
                      path: file.path,
                      mimeType: file.mimeType,
                      size: file.size,
                    })),

                  disconnect: document
                    .filter(
                      (initialFile) =>
                        !output.documentFiles?.some((finalFile) => finalFile.id === initialFile.id)
                    )
                    .map((fileToDisconnect) => ({ id: fileToDisconnect.id })),
                },
                subjectScoreConvert: {
                  ...(toCreate.length ? { create: toCreate } : {}),
                  ...(toUpdate.length ? { update: toUpdate } : {}),
                  ...(toDelete.length ? { delete: toDelete } : {}),
                },
              },
            },
          },
        ]
        if (scoresToCreate.length > 0) {
          listSqlTransaction.push({
            model: "StudentSubjectScore",
            operation: "createMany",
            data: {
              data: scoresToCreate,
              skipDuplicates: true,
            },
          })
        }

        await sqlTransaction(listSqlTransaction)
        queryClient.invalidateQueries({
          queryKey: ["zenstack", "StudentScoreConvert"],
        })
        message.success("Cập nhật thành công")
      } else {
        await createStudentScoreConvert({
          data: {
            studentId: output.studentId,
            description: output.description,
            documentFiles: {
              create:
                (output.documentFiles || []).map((file) => ({
                  name: file.name,
                  path: file.path,
                  mimeType: file.mimeType,
                  size: file.size,
                })) || [],
            },
            subjectScoreConvert: {
              createMany: {
                data: toCreate,
              },
            },
          },
        })
        message.success("Thêm mới thành công")
      }
      // queryClient.invalidateQueries({
      //     queryKey: ['StudentScoreConvert'],
      // })
      onClose()
    } catch (error: any) {
      message.error(error?.info?.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const { data: initialValue } = useFindUniqueStudentScoreConvert(
    {
      where: { id },
      include: {
        student: {
          include: {
            curriculumVersion: true,
            fixedClass: { include: { curriculumVersion: true } },
            userProfile: true,
          },
        },
        subjectScoreConvert: {
          include: { subjectVersion: { include: { subject: true } } },
        },
        documentFiles: true,
      },
    },
    { enabled: !!id }
  )

  useEffect(() => {
    if (!isOpen) return
    if (initialValue) {
      const subjects = (initialValue.subjectScoreConvert || []).map((i: any) => ({
        id: i.id,
        subjectVersionId: i.subjectVersionId,
        score: i.score,
        status: i.status,
      }))
      form.setFieldsValue({
        ...initialValue,
        subjectScoreConvert: subjects,
      })
      originalStatusRef.current = Object.fromEntries(
        (initialValue?.subjectScoreConvert || []).map((i: any) => [i.id, i.status])
      )
      initialSubjectsRef.current = subjects
      setDocument((initialValue.documentFiles || []) as DocumentFile[])
    } else {
      form.setFieldsValue({})
      setDocument([])
    }
  }, [initialValue, isOpen, form])

  const handleQuickStatusChange = (newStatus: ScoreConvertStatus) => {
    if (!newStatus || selectedRowKeys.length === 0) return

    const allSubjects = form.getFieldValue("subjectScoreConvert") || []
    const updatedSubjects = allSubjects.map((subject: any, index: number) => {
      if (selectedRowKeys.includes(index)) {
        const subjectId = subject?.id
        if (!subjectId || originalStatusRef.current[subjectId] !== ScoreConvertStatus.APPROVED) {
          return { ...subject, status: newStatus }
        }
      }
      return subject
    })

    form.setFieldsValue({ subjectScoreConvert: updatedSubjects })
    setSelectedRowKeys([]) // Bỏ chọn các hàng sau khi cập nhật
  }

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={
        isViewMode
          ? "Xem chi tiết phiếu chuyển trường"
          : id
            ? "Chỉnh sửa phiếu chuyển trường"
            : "Thêm mới phiếu chuyển trường"
      }
      okButtonProps={{ style: { display: isViewMode ? "none" : "inline-block" } }}
      cancelText={isViewMode ? "Đóng" : "Hủy"}
      className="w-[60vw]"
    >
      <Col span={24}>
        <FormItem form={form} name="studentId" label="Sinh viên" required>
          <Select
            showSearch
            placeholder="Chọn sinh viên"
            loading={loadingStudents || fetchingStudents}
            filterOption={false}
            onSearch={(v) => setStudentKeyword(v)}
            {...(isEdit || isViewMode ? { variant: "borderless", open: false } : {})}
            options={studentList.map((s: any) => {
              const fullName =
                s?.userProfile?.fullName ??
                [s?.userProfile?.lastName, s?.userProfile?.firstName].filter(Boolean).join(" ")
              const extra = s?.code ? ` - ${s.code}` : ""
              return { value: s.id, label: `${fullName}${extra}` }
            })}
          />
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="subjectScoreConvert" label="Môn cần quy đổi điểm">
          <Form.List name="subjectScoreConvert">
            {(fields, { add, remove }) => {
              const columns: TableColumnsType<any> = [
                {
                  title: "Môn học (CTĐT)",
                  render: (_, record) => (
                    <FormItem form={form} name={[record.name, "subjectVersionId"]} required noStyle>
                      <Select
                        showSearch
                        placeholder="Chọn môn theo CTĐT"
                        optionFilterProp="label"
                        style={{ width: "100%" }}
                        options={allSubjectOptions.filter(
                          (opt) =>
                            opt.value ===
                              form.getFieldValue([
                                "subjectScoreConvert",
                                record.name,
                                "subjectVersionId",
                              ]) || !selectedSubjectIds.has(opt.value)
                        )}
                        disabled={
                          isViewMode ||
                          !selectedStudentId ||
                          !allSubjectOptions.length ||
                          originalStatusRef.current[
                            form.getFieldValue(["subjectScoreConvert", record.name, "id"])
                          ] === ScoreConvertStatus.APPROVED
                        }
                      />
                    </FormItem>
                  ),
                },
                {
                  title: "Điểm",
                  width: 140,
                  align: "center",
                  render: (_, record) => (
                    <>
                      <FormItem form={form} name={[record.name, "score"]} required noStyle>
                        <InputNumber
                          min={0}
                          max={10}
                          step={0.1}
                          style={{ width: "100%" }}
                          readOnly={
                            isViewMode ||
                            originalStatusRef.current[
                              form.getFieldValue(["subjectScoreConvert", record.name, "id"])
                            ] === ScoreConvertStatus.APPROVED
                          }
                        />
                      </FormItem>
                      {!isEdit && (
                        <FormItem
                          form={form}
                          name={[record.name, "status"]}
                          initialValue={ScoreConvertStatus.PENDING}
                          hidden
                        />
                      )}
                    </>
                  ),
                },
              ]

              if (isEdit) {
                columns.push({
                  title: "Trạng thái",
                  width: 180,
                  align: "center",
                  render: (_, record) => (
                    <FormItem form={form} name={[record.name, "status"]} required noStyle>
                      <Select
                        style={{ width: "100%" }}
                        disabled={
                          isViewMode ||
                          originalStatusRef.current[
                            form.getFieldValue(["subjectScoreConvert", record.name, "id"])
                          ] === ScoreConvertStatus.APPROVED
                        }
                        options={statusOptions}
                      />
                    </FormItem>
                  ),
                })
              }

              columns.push({
                title: "Xóa",
                width: 60,
                align: "center",
                render: (_, record) => (
                  <Button
                    danger
                    type="text"
                    icon={<Trash2 size={16} />}
                    onClick={() => remove(record.name)}
                    disabled={
                      originalStatusRef.current[
                        form.getFieldValue(["subjectScoreConvert", record.name, "id"])
                      ] === ScoreConvertStatus.APPROVED || isViewMode
                    }
                  />
                ),
              })

              return (
                <>
                  <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                    <Col>
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() => add({ status: ScoreConvertStatus.PENDING })}
                        disabled={!selectedStudentId || isViewMode}
                      >
                        Thêm môn
                      </Button>
                    </Col>
                    <Col>
                      {isEdit && (
                        <Select
                          placeholder="Đổi trạng thái nhanh"
                          style={{ width: 200 }}
                          onChange={handleQuickStatusChange}
                          value={null}
                          disabled={selectedRowKeys.length === 0 || isViewMode}
                          options={statusOptions}
                        />
                      )}
                    </Col>
                  </Row>

                  <Table
                    bordered
                    size="small"
                    pagination={false}
                    dataSource={fields}
                    rowKey="key"
                    rowSelection={{
                      selectedRowKeys,
                      onChange: setSelectedRowKeys,
                      getCheckboxProps: (record) => {
                        if (isViewMode) return { disabled: true }
                        const subject = form.getFieldValue(["subjectScoreConvert", record.name])
                        const isApproved =
                          subject?.id &&
                          originalStatusRef.current[subject.id] === ScoreConvertStatus.APPROVED
                        return { disabled: isApproved }
                      },
                    }}
                    columns={columns}
                  />
                </>
              )
            }}
          </Form.List>
        </FormItem>
      </Col>
      <Col span={24}>
        <FormItem form={form} name="documentFiles" label="Tài liệu minh chứng">
          {/* <div style={{ maxHeight: 220, overflowY: 'auto', overflowX: 'hidden' }}> */}
          <DocumentPaths
            form={form}
            data={document}
            relationId={id ?? ""}
            relationType="studentScoreConvertId"
            // disabled={isViewMode} // Thêm disable vào component
          />
          {/* </div> */}
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem form={form} name="description" label="Mô tả">
          <Input.TextArea placeholder="Nhập mô tả" disabled={isViewMode} />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutStudentScoreConvertModal
