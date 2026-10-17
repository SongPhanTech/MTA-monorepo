import { PlusOutlined } from "@ant-design/icons"
import DocumentPaths from "@components/commons/documentPaths"
import FormItem from "@components/commons/form-item"
import Select from "@components/commons/select"
import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import {
  $Enums,
  type DocumentFile,
  type ScoreLinkSheet,
  type ScoreLinkStudent,
  type ScoreLinkSubjectVersion,
} from "@workspace/db"
import {
  useCreateManyStudentSubjectScore,
  useCreateScoreLinkSheet,
  useFindManyFixedClass,
  useFindManySchoolYear,
  useFindManyStudent,
  useFindManySubjectVersion,
  useFindManyTrainingCourse,
  useFindManyTrainingObjectType,
  useFindUniqueScoreLinkSheet,
  useUpdateManyScoreLinkStudent,
  useUpdateScoreLinkSheet,
} from "@workspace/db/hooks"
import { useAbility } from "@workspace/permissions/hooks"
import { QL_DAO_TAO_PERMISSION } from "@workspace/router"
import { PutFormModal, type TreeNodeType, useTrainingObjectTypeStore } from "@workspace/ui"
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Tabs,
  Tooltip,
  TreeSelect as TreeSelectAnt,
} from "antd"
import { Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"

const ScoreLinkStatus = $Enums.ScoreLinkStatus
type ScoreLinkStatus = $Enums.ScoreLinkStatus
type ScoreLinkSubjectVersionCustom = ScoreLinkSubjectVersion & {
  scoreLinkStudents: ScoreLinkStudent[]
}
export type PutScoreLinkSheet = ScoreLinkSheet & {
  scoreLinkSubjectVersions: ScoreLinkSubjectVersionCustom[]
  documents?: DocumentFile[]
}

const messages = {
  success: {
    edit: "Cập nhật phiếu thành công",
    create: "Tạo phiếu thành công",
  },
  error: {
    edit: "Cập nhật phiếu thất bại",
    create: "Tạo phiếu thất bại",
  },
}

const statusOptions = [
  { label: "Chờ duyệt", value: ScoreLinkStatus.PENDING },
  { label: "Đã duyệt", value: ScoreLinkStatus.APPROVED },
  { label: "Không được duyệt", value: ScoreLinkStatus.REJECTED },
]

function buildUpdatePayload(oldData: PutScoreLinkSheet, newData: PutScoreLinkSheet) {
  const oldMap = new Map(oldData.scoreLinkSubjectVersions.map((sv) => [sv.subjectVersionId, sv]))

  const newMap = new Map(newData.scoreLinkSubjectVersions.map((sv) => [sv.subjectVersionId, sv]))

  const toCreate = newData.scoreLinkSubjectVersions.filter((sv) => !oldMap.has(sv.subjectVersionId))

  const toDelete = oldData.scoreLinkSubjectVersions.filter((sv) => !newMap.has(sv.subjectVersionId))

  const toUpdate = newData.scoreLinkSubjectVersions.filter((sv) => oldMap.has(sv.subjectVersionId))

  return { toCreate, toDelete, toUpdate }
}

const PutScoreLinkSheetModal = () => {
  const [form] = Form.useForm()
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const { showSpinner, hideSpinner } = useSpinner()
  const { can } = useAbility()
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>()
  const [document, setDocument] = useState<DocumentFile[]>([])
  const { isOpen, onClose, input } = useDisclosure<{ id: string; mode: "view" | "edit" }>({
    tag: "PutScoreLinkSheetModal",
    onClose: () => {
      form.resetFields()
      setDocument([])
      setSelectedSubjectId(undefined)
    },
  })
  const mode = input?.mode
  const isView = mode === "view"
  const isEdit = mode === "edit"
  const isCreate = !mode
  const canApprove = can(QL_DAO_TAO_PERMISSION.QL_DAO_TAO_QUAN_LY_DIEM_DIEM_LIEN_KET, "DUYET")
  const statusSheet = Form.useWatch("status", form)
  const { data: scoreLinkSheetDetail } = useFindUniqueScoreLinkSheet(
    {
      where: { id: input?.id },
      include: {
        scoreLinkSubjectVersions: {
          include: {
            scoreLinkStudents: true,
            subjectVersion: true,
          },
        },
        documents: true,
      },
    },
    {
      enabled: isOpen && !!input?.id,
    }
  )

  const { mutateAsync: createScoreLinkSheet } = useCreateScoreLinkSheet({
    onSuccess: () => {
      message.success(messages.success.create)
    },
    onError: () => {
      message.error(messages.error.create)
    },
    onSettled: () => {
      onClose()
      hideSpinner()
    },
  })
  const { mutateAsync: updateManyScoreLinkStudent } = useUpdateManyScoreLinkStudent()
  const { mutateAsync: createManyStudentSubjectScore } = useCreateManyStudentSubjectScore()

  const createDiemLienKetScores = async (sheet: PutScoreLinkSheet) => {
    const data = sheet.scoreLinkSubjectVersions.flatMap((sv) =>
      sv.scoreLinkStudents.map((ss) => ({
        studentId: ss.studentId,
        subjectVersionId: sv.subjectVersionId,
        semesterId: sheet.semesterId,
        manualFinalScore: ss.score,
        description: "Điểm liên kết",
      }))
    )

    if (data.length === 0) return

    await createManyStudentSubjectScore({ data })
  }
  const { mutateAsync: updateScoreLinkSheet } = useUpdateScoreLinkSheet({
    onSuccess: () => {
      message.success(messages.success.edit)
    },
    onError: () => {
      message.error(messages.error.edit)
    },
    onSettled: () => {
      onClose()
      hideSpinner()
    },
  })
  const { data: trainingCourses } = useFindManyTrainingCourse({
    where: { active: true, trainingObjectTypeId },
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
  })
  const selectedTrainingCourseId = Form.useWatch("trainingCourseId", form)
  const { data: fixedClasses = [], isLoading: isLoadingFixedClasses } = useFindManyFixedClass({
    where: {
      active: true,
      trainingCourseId: selectedTrainingCourseId,
    },
  })
  const { data: trainingObjectTypeList = [] } = useFindManyTrainingObjectType(
    {
      orderBy: {
        name: "asc",
      },
    },
    { enabled: isOpen }
  )
  const { data: schoolYears } = useFindManySchoolYear({
    orderBy: { startDate: "desc" },
    include: {
      semesters: {
        orderBy: { startDate: "desc" },
      },
    },
  })
  const fixedClassId = Form.useWatch("fixedClassId", form)
  const semesterId = Form.useWatch("semesterId", form)
  const { data: subjectVersions = [], isFetching: isFetchingSubjectVersions } =
    useFindManySubjectVersion(
      {
        where: {
          deletedAt: null,
          ...(trainingObjectTypeId ? { trainingObjectTypeId } : {}),
          subjectClass: {
            some: {
              semesterId,
              fixedClasses: { some: { id: fixedClassId } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      {
        enabled: !!trainingObjectTypeId && !!fixedClassId && !!semesterId,
      }
    )

  const { data: studentList = [] } = useFindManyStudent(
    {
      where: {
        active: true,
        OR: [{ fixedClass: { id: fixedClassId } }],
      },
      include: { userProfile: true },
      take: 20,
    },
    { enabled: !!fixedClassId }
  )
  const filterTreeNode = (input: string, treeNode: any) => {
    return treeNode?.title?.toLowerCase()?.includes(input?.toLowerCase())
  }
  const treeDataSemester: TreeNodeType[] = useMemo(() => {
    return (
      schoolYears?.map((schoolYear) => ({
        value: `schoolYear-${schoolYear.id}`,
        title: schoolYear.name,
        selectable: false,
        children:
          schoolYear.semesters.map((semester) => ({
            value: semester.id,
            title: `${semester.name}`,
          })) || [],
      })) || []
    )
  }, [schoolYears])
  const onFinish = async (values: PutScoreLinkSheet) => {
    showSpinner()

    switch (mode) {
      case "view": {
        if (!canApprove) {
          return
        }

        await updateScoreLinkSheet({
          where: { id: input?.id },
          data: {
            status: ScoreLinkStatus.APPROVED,
          },
        })

        if (scoreLinkSheetDetail && scoreLinkSheetDetail.status !== ScoreLinkStatus.APPROVED) {
          await createDiemLienKetScores(scoreLinkSheetDetail)
        }

        return
      }

      case "edit": {
        if (!input?.id || !scoreLinkSheetDetail) return

        const { toCreate, toDelete, toUpdate } = buildUpdatePayload(scoreLinkSheetDetail, values)

        await updateScoreLinkSheet({
          where: { id: input.id },
          data: {
            trainingObjectTypeId: values.trainingObjectTypeId,
            decision: values.decision,
            fixedClassId: values.fixedClassId,
            semesterId: values.semesterId,
            description: values.description,
            status: values.status,
          },
        })

        if (
          values.status === ScoreLinkStatus.APPROVED &&
          scoreLinkSheetDetail.status !== ScoreLinkStatus.APPROVED
        ) {
          await createDiemLienKetScores(values)
        }

        if (toDelete.length > 0) {
          await updateScoreLinkSheet({
            where: { id: input.id },
            data: {
              scoreLinkSubjectVersions: {
                deleteMany: {
                  subjectVersionId: {
                    in: toDelete.map((sv) => sv.subjectVersionId),
                  },
                },
              },
            },
          })
        }

        if (toCreate.length > 0) {
          await updateScoreLinkSheet({
            where: { id: input.id },
            data: {
              scoreLinkSubjectVersions: {
                create: toCreate.map((sv) => ({
                  subjectVersionId: sv.subjectVersionId,
                  scoreLinkStudents: {
                    createMany: {
                      data: sv.scoreLinkStudents.map((ss) => ({
                        studentId: ss.studentId,
                        score: ss.score,
                      })),
                    },
                  },
                })),
              },
            },
          })
        }

        for (const sv of toUpdate) {
          for (const ss of sv.scoreLinkStudents) {
            await updateManyScoreLinkStudent({
              where: {
                studentId: ss.studentId,
                scoreLinkSubjectVersion: {
                  subjectVersionId: sv.subjectVersionId,
                  scoreLinkSheetId: input.id,
                },
              },
              data: {
                score: ss.score,
              },
            })
          }
        }

        return
      }

      default: {
        await createScoreLinkSheet({
          data: {
            trainingObjectTypeId: values.trainingObjectTypeId,
            decision: values.decision,
            fixedClassId: values.fixedClassId,
            semesterId: values.semesterId,
            description: values.description,
            status: ScoreLinkStatus.PENDING,
            scoreLinkSubjectVersions: {
              create: values.scoreLinkSubjectVersions.map((sv) => ({
                subjectVersionId: sv.subjectVersionId,
                scoreLinkStudents: {
                  create: sv.scoreLinkStudents.map((ss) => ({
                    studentId: ss.studentId,
                    score: ss.score,
                  })),
                },
              })),
            },
            documents: {
              create: (values.documents ?? []).map((file) => ({
                name: file.name,
                path: file.path,
                mimeType: file.mimeType,
                size: file.size,
              })),
            },
          },
        })

        return
      }
    }
  }

  useEffect(() => {
    if (isOpen && trainingObjectTypeId) {
      form.setFieldValue("trainingObjectTypeId", trainingObjectTypeId)
    }
  }, [isOpen, trainingObjectTypeId, form])

  useEffect(() => {
    if (!isOpen || !scoreLinkSheetDetail) return

    form.setFieldsValue({
      trainingObjectTypeId: scoreLinkSheetDetail.trainingObjectTypeId,
      decision: scoreLinkSheetDetail.decision,
      fixedClassId: scoreLinkSheetDetail.fixedClassId,
      semesterId: scoreLinkSheetDetail.semesterId,
      description: scoreLinkSheetDetail.description,
      status: scoreLinkSheetDetail.status,

      scoreLinkSubjectVersions: scoreLinkSheetDetail.scoreLinkSubjectVersions.map((sv) => ({
        subjectVersionId: sv.subjectVersionId,
        scoreLinkStudents: sv.scoreLinkStudents.map((ss) => ({
          studentId: ss.studentId,
          score: ss.score,
        })),
      })),

      documents: scoreLinkSheetDetail.documents?.map((d) => ({
        name: d.name,
        path: d.path,
        mimeType: d.mimeType,
        size: d.size,
      })),
    })

    setDocument(scoreLinkSheetDetail.documents)
  }, [isOpen, scoreLinkSheetDetail, form])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      title={
        isView
          ? "Xem phiếu điểm liên kết"
          : isEdit
            ? "Cập nhật phiếu điểm liên kết"
            : "Thêm phiếu điểm liên kết"
      }
      className="w-[60vw] justify-between"
      okButtonProps={{
        className: isView && !canApprove ? "hidden" : "",
        disabled: isView && statusSheet === ScoreLinkStatus.APPROVED,
      }}
      cancelText={isView ? "Đóng" : "Hủy"}
      okText={isView ? (canApprove ? "Phê duyệt" : undefined) : isEdit ? "Cập nhật" : "Thêm mới"}
      onCancel={onClose}
      onFinish={onFinish}
    >
      <Row gutter={[8, 16]} className="w-full" justify="space-between">
        <Col span={isView ? 12 : 8}>
          <FormItem name="trainingObjectTypeId" form={form} label="Đối tượng đào tạo" required>
            <Select
              defaultValue={trainingObjectTypeId}
              options={trainingObjectTypeList?.map(({ id, name }) => ({
                value: id,
                label: name,
              }))}
              disabled={!!trainingObjectTypeId || isView}
              placeholder="Chọn đối tượng đào tạo"
            />
          </FormItem>
        </Col>

        <Col span={8} hidden={isView}>
          <FormItem form={form} className="w-full" name="trainingCourseId" label="Khoá học">
            <Select
              options={trainingCourses?.map(({ id, name }) => ({
                value: id,
                label: name,
              }))}
              placeholder="Chọn khoá học"
              className="w-full"
            />
          </FormItem>
        </Col>

        <Col span={isView ? 12 : 8}>
          <FormItem name="decision" form={form} label="Số quyết định" required>
            <Input disabled={isView} placeholder="Nhập số quyết định" />
          </FormItem>
        </Col>
      </Row>

      <Row gutter={[8, 16]} className="w-full">
        <Col span={isCreate ? 12 : 8}>
          <FormItem name="fixedClassId" form={form} label="Lớp quản lí" required>
            <Select
              options={fixedClasses?.map((e) => ({
                label: e.name,
                value: e.id,
              }))}
              disabled={isView || !selectedTrainingCourseId}
              onChange={() => form.setFieldValue("scoreLinkSubjectVersions", [])}
              placeholder="Chọn lớp quản lí"
              loading={isLoadingFixedClasses}
            />
          </FormItem>
        </Col>

        <Col span={isCreate ? 12 : 8}>
          <FormItem form={form} name="semesterId" label="Kỳ học" required>
            <TreeSelectAnt
              disabled={isView}
              showSearch
              dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
              placeholder={"Chọn kỳ học"}
              allowClear
              treeDefaultExpandAll
              treeData={treeDataSemester}
              filterTreeNode={filterTreeNode}
              treeNodeFilterProp="title"
              onChange={() => {
                form.setFieldValue("scoreLinkSubjectVersions", [])
                setSelectedSubjectId(undefined)
              }}
            />
          </FormItem>
        </Col>
        <Col span={8} hidden={mode !== "edit" && mode !== "view"}>
          <FormItem form={form} name="status" label="Trạng thái">
            <Select
              disabled={isView}
              defaultValue={ScoreLinkStatus.PENDING}
              style={{
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              placeholder="Đổi trạng thái nhanh"
              options={statusOptions}
            />
          </FormItem>
        </Col>
      </Row>

      <Col span={24}>
        <Form.List name="scoreLinkSubjectVersions">
          {(fields, { add, remove }) => (
            <>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Row gutter={8}>
                    <Row gutter={8} className="w-full">
                      <Col span={12}>
                        <Select
                          loading={isFetchingSubjectVersions}
                          options={subjectVersions.map((sv) => ({
                            label: `${sv.name}${sv.code ? ` - (${sv.code})` : ""}`,
                            value: sv.id,
                          }))}
                          value={selectedSubjectId}
                          onChange={(value) => setSelectedSubjectId(value)}
                          placeholder="Chọn môn"
                          className="w-full"
                          disabled={!trainingObjectTypeId || !fixedClassId || !semesterId || isView}
                        />
                      </Col>
                      <Col span={12}>
                        <Button
                          type="dashed"
                          disabled={
                            !trainingObjectTypeId ||
                            !fixedClassId ||
                            !semesterId ||
                            !selectedSubjectId
                          }
                          icon={<PlusOutlined />}
                          className="mb-2"
                          onClick={() => {
                            const students =
                              studentList?.map((s) => ({
                                studentId: s?.id,
                                score: 0,
                              })) ?? []
                            add({
                              subjectVersionId: selectedSubjectId,
                              scoreLinkStudents: students,
                            })
                            setSelectedSubjectId(undefined)
                          }}
                        >
                          Thêm môn học
                        </Button>
                      </Col>
                    </Row>
                  </Row>
                </Col>
              </Row>

              <Tabs
                tabPosition="left"
                className="pt-2.5"
                items={fields.map((f) => {
                  const getValue = form.getFieldValue
                  const subjectId = form.getFieldValue([
                    "scoreLinkSubjectVersions",
                    f.name,
                    "subjectVersionId",
                  ])

                  const subject = subjectVersions.find((s) => s.id === subjectId)

                  return {
                    key: String(f.key),
                    style: {
                      paddingLeft: 0,
                      paddingRight: "8px",
                    },
                    label: (
                      <Tooltip
                        trigger="hover"
                        className="flex flex-row items-center"
                        title={`${subject?.name}${subject?.code ? ` - (${subject?.code})` : ""}`}
                      >
                        <div className="w-28 overflow-hidden text-ellipsis whitespace-nowrap">{`${subject?.name}${subject?.code ? ` - (${subject?.code})` : ""}`}</div>
                        <div className="text-right mt-1">
                          <Button
                            danger
                            type="text"
                            icon={<Trash2 size={16} />}
                            onClick={() => remove(f.name)}
                          />
                        </div>
                      </Tooltip>
                    ),
                    children: (
                      <>
                        <Table
                          pagination={false}
                          className="h-full pl-2.5"
                          dataSource={getValue([
                            "scoreLinkSubjectVersions",
                            f.name,
                            "scoreLinkStudents",
                          ])}
                          columns={[
                            {
                              title: "Sinh viên",
                              render: (_, __, i) => {
                                const studentId = getValue([
                                  "scoreLinkSubjectVersions",
                                  f.name,
                                  "scoreLinkStudents",
                                  i,
                                  "studentId",
                                ])

                                const student = studentList.find((s) => s.id === studentId)

                                return (
                                  `${student?.userProfile?.fullname} - ${student?.userProfile?.code}` ||
                                  "—"
                                )
                              },
                            },
                            {
                              title: "Điểm",
                              width: 120,
                              render: (_, __, i) => (
                                <FormItem
                                  form={form}
                                  name={[f.name, "scoreLinkStudents", i, "score"]}
                                  rules={[{ required: true }]}
                                  noStyle
                                >
                                  <InputNumber
                                    disabled={isView}
                                    min={0}
                                    max={10}
                                    className="w-full"
                                  />
                                </FormItem>
                              ),
                            },
                          ]}
                        />
                      </>
                    ),
                  }
                })}
              />
            </>
          )}
        </Form.List>
      </Col>

      <Col span={24}>
        <FormItem name="documents" label="Tài liệu minh chứng" form={form}>
          <DocumentPaths
            form={form}
            data={document}
            relationId={input?.id ?? ""}
            relationType="scoreLinkSheetId"
            titleForm="documents"
          />
        </FormItem>
      </Col>

      <Col span={24}>
        <FormItem name="description" label="Mô tả" form={form}>
          <Input.TextArea disabled={isView} rows={3} />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutScoreLinkSheetModal
