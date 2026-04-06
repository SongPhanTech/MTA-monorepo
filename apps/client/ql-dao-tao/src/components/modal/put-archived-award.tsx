import { queryClient } from "@api/index"
import FormItem from "@components/commons/form-item"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import type { ArchivedAward, DocumentFile } from "@workspace/db/client"
import {
  useCreateArchivedAward,
  useFindManyAward,
  useFindManyFixedClass,
  useFindManyStudent,
  useFindManyStudentSubjectScore,
  useFindManyTrainingCourse,
  useFindUniqueArchivedAward,
  useUpdateArchivedAward,
} from "@workspace/db/hooks"
import { Col, Form, InputNumber, message, Switch } from "antd"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import "dayjs/locale/vi"
import DatePicker from "@components/commons/date-picker"
import DocumentPaths from "@components/commons/documentPaths"
import Select from "@components/commons/select"
import { useTrainingObjectTypeStore } from "@workspace/ui"
export type PutArchivedAward = ArchivedAward & {
  documentFiles?: DocumentFile[]
  bonusScore: number
  trainingCoursesId?: string
  fixedClassesId?: string
  studentSubjectScoreId?: string
}
dayjs.locale("vi")
const PutArchivedAwardModal = () => {
  const [document, setDocument] = useState<DocumentFile[]>([])
  const [filterByAward, setFilterByAward] = useState(false)
  const [form] = Form.useForm<PutArchivedAward>()

  const fixedClassId = Form.useWatch("fixedClassesId", form)
  const trainingCoursesId = Form.useWatch("trainingCoursesId", form)
  const studentId = Form.useWatch("studentId", form)
  const awardId = Form.useWatch("awardId", form)
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
  const {
    isOpen,
    onClose,
    input: id,
  } = useDisclosure<string>({
    tag: "PutArchivedAwardModal",
    onClose: form.resetFields,
  })
  const { showSpinner, hideSpinner } = useSpinner()

  const { mutateAsync: createArchivedAward } = useCreateArchivedAward()
  const { mutateAsync: updateArchivedAward } = useUpdateArchivedAward()
  const { data: awardData = [] } = useFindManyAward({
    include: {
      subjects: true,
    },
  })
  const { data: trainingCourses = [] } = useFindManyTrainingCourse(
    {
      where: { trainingObjectTypeId },
      orderBy: { semesterStart: { startDate: "desc" } },
    },
    { enabled: !!trainingObjectTypeId }
  )

  // Lấy danh sách FixedClass
  const { data: fixedClasses = [] } = useFindManyFixedClass(
    { where: { trainingCourseId: trainingCoursesId || undefined } },
    { enabled: !!trainingObjectTypeId }
  )
  const { data: students = [] } = useFindManyStudent(
    {
      where: {
        ...(!!trainingCoursesId || !!fixedClassId
          ? {
              fixedClass: {
                trainingCourse: { trainingObjectTypeId },
                ...(trainingCoursesId ? { trainingCourseId: trainingCoursesId } : {}),
                ...(fixedClassId ? { id: fixedClassId } : {}),
              },
            }
          : {
              fixedClass: { trainingCourse: { trainingObjectTypeId } },
            }),
      },
      include: {
        userProfile: true,
        fixedClass: {
          select: {
            trainingCourse: { select: { scoreToPass: true } },
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

  const { data: studentSubjectScores = [] } = useFindManyStudentSubjectScore(
    {
      where: {
        studentId,
        finalScore: {
          gte:
            students.find((student) => student.id === studentId)?.fixedClass?.trainingCourse
              ?.scoreToPass || 0,
        },
      },
      select: {
        id: true,
        finalScore: true,
        subjectVersion: { select: { name: true, subjectId: true } },
        subjectClass: {
          select: { semester: { select: { code: true } } },
        },
      },
    },
    { enabled: !!studentId }
  )

  async function onOk({ studentSubjectScoreId, ...rest }: PutArchivedAward) {
    try {
      if (rest.status === "APPROVED") {
        message.error("Không thể cập nhật")
        return
      }
      showSpinner()
      if (id) {
        await updateArchivedAward({
          data: {
            awardId: rest.awardId,
            studentId: rest.studentId,
            date: rest.date,
            bonusScore: rest?.bonusScore || 0,
            documentFiles: {
              upsert: (rest.documentFiles || [])
                .filter((file) => !!file.id)
                .map((file) => ({
                  where: { id: file.id },
                  create: {
                    name: file.name,
                    path: file.path,
                    mimeType: file.mimeType,
                    size: file.size,
                    curriculum: { connect: { id } },
                  },
                  update: {
                    name: file.name,
                    path: file.path,
                    mimeType: file.mimeType,
                    size: file.size,
                  },
                })),
              create: (rest.documentFiles || [])
                .filter((file) => !file.id)
                .map((file) => ({
                  name: file.name,
                  path: file.path,
                  mimeType: file.mimeType,
                  size: file.size,
                })),
              disconnect: document
                .filter((existing) => !rest.documentFiles?.some((f) => f.id === existing.id))
                .map((file) => ({ id: file.id })),
            },
            studentSubjectScore: {
              ...(studentSubjectScoreId
                ? {
                    deleteMany: {
                      studentSubjectScoreId: {
                        not: studentSubjectScoreId,
                      },
                    },
                    createMany: { data: { studentSubjectScoreId } },
                  }
                : {}),
            },
          },
          where: { id },
        })
        message.success("Cập nhật thành công")
      } else {
        await createArchivedAward({
          data: {
            awardId: rest.awardId,
            studentId: rest.studentId,
            date: rest.date,
            bonusScore: rest?.bonusScore || 0,
            documentFiles: {
              create: (rest.documentFiles || []).map((file) => ({
                name: file.name,
                path: file.path,
                mimeType: file.mimeType,
                size: file.size,
              })),
            },
            ...(studentSubjectScoreId
              ? {
                  studentSubjectScore: {
                    create: {
                      studentSubjectScoreId,
                    },
                  },
                }
              : {}),
          },
        })
        message.success("Thêm mới thành công")
      }
      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["ArchivedAward"],
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

  const { data: initialData } = useFindUniqueArchivedAward(
    {
      where: { id },
      include: {
        studentSubjectScore: true,
        documentFiles: true,
        student: {
          include: {
            fixedClass: {
              include: {
                trainingCourse: true,
              },
            },
          },
        },
      },
    },
    { enabled: !!id }
  )

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        ...initialData,
        date: initialData.date ? dayjs(initialData.date) : undefined,
        documentFiles: initialData.documentFiles,
        trainingCoursesId: initialData?.student?.fixedClass?.trainingCourseId || "",
        fixedClassesId: initialData?.student?.fixedClassId || "",
        studentSubjectScoreId: initialData?.studentSubjectScore[0]?.studentSubjectScoreId,
      })
      setDocument(initialData.documentFiles)
    } else {
      form.setFieldsValue({
        active: true,
        documentFiles: [],
      })
      setDocument([])
    }
  }, [initialData])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa đơn cộng điểm oplympic" : "Thêm mới đơn cộng điểm oplympic"}
      className="w-[700px]"
    >
      <Col span={20} className="mb-4">
        <FormItem form={form} name="awardId" label="Giải thưởng" required>
          <Select
            allowClear
            style={{ width: "100%" }}
            placeholder="Chọn giải thưởng"
            options={awardData.map((item) => ({
              label: item.name,
              value: item.id,
              bonusScore: item?.bonusScore,
            }))}
            onChange={(value, option: any) => {
              form.setFieldsValue({
                bonusScore: option.bonusScore,
              })
            }}
          />
        </FormItem>
      </Col>
      <Col span={4} className="mb-4">
        <FormItem form={form} name="bonusScore" label="Điểm cộng" required>
          <InputNumber min={1} className="w-full" placeholder="Nhập điểm" />
        </FormItem>
      </Col>

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
      <Col span={24} className="mb-4">
        <FormItem form={form} name="studentId" label="Học viên, sinh viên" required>
          <Select
            showSearch
            style={{ width: "100%" }}
            placeholder="Chọn sinh viên"
            options={students.map((item) => {
              const dateOfBirth = item.userProfile?.dateOfBirth
                ? dayjs(item.userProfile.dateOfBirth).format("DD/MM/YYYY")
                : null
              return {
                label: [item.code, item.userProfile?.fullname, dateOfBirth]
                  .filter(Boolean)
                  .join(" - "),
                value: item.id,
              }
            })}
          />
        </FormItem>
      </Col>
      <Col span={24} className="mb-4">
        <FormItem form={form} name="date" label="Thời gian nhận giải thưởng">
          <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Chọn ngày" />
        </FormItem>
      </Col>
      <Col span={24} className="mb-4">
        <FormItem
          form={form}
          name="studentSubjectScoreId"
          label={
            <div className="flex flex-col">
              <span>Cộng điểm học phần</span>
              <div className="font-normal mt-1" onClick={(e) => e.preventDefault()}>
                <Switch
                  checked={filterByAward}
                  onChange={setFilterByAward}
                  checkedChildren="Lọc theo giải"
                  unCheckedChildren="Tất cả môn"
                />
                <span className="ml-2 text-gray-500">
                  {filterByAward
                    ? "Chỉ hiển thị môn thuộc giải olympic"
                    : "Hiển thị tất cả môn học"}
                </span>
              </div>
            </div>
          }
        >
          <Select
            showSearch
            style={{ width: "100%" }}
            placeholder="Chọn điểm học phần"
            options={studentSubjectScores
              .filter((item) => {
                if (!filterByAward || !awardId) return true
                const selectedAward = awardData.find((award) => award.id === awardId)
                if (!selectedAward) return true
                const allowedSubjectIds = selectedAward.subjects.map((s) => s.id)
                return allowedSubjectIds.includes(item.subjectVersion.subjectId || "")
              })
              .map((item) => {
                const score = item.finalScore ? `Điểm: ${item.finalScore}` : "Điểm: chưa có"
                return {
                  label: [item.subjectVersion.name, score, item.subjectClass?.semester?.code]
                    .filter(Boolean)
                    .join(" - "),
                  value: item.id,
                }
              })}
          />
        </FormItem>
      </Col>
      <Col span={24} className="mb-4">
        <FormItem form={form} name="documentFiles" label="Minh chứng">
          <DocumentPaths
            form={form}
            data={document}
            relationId={id ?? ""}
            relationType="curriculumId"
          />
        </FormItem>
      </Col>
    </PutFormModal>
  )
}

export default PutArchivedAwardModal
