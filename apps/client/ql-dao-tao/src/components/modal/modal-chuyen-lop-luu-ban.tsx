import { queryClient } from "@api/index"
import PutFormModal from "@components/commons/put-modal"
import Table from "@components/commons/table"
import useSpinner from "@hooks/spinner"
import type { AcademicActionType } from "@workspace/db/client"
import {
  useFindManyFixedClass,
  useFindManyStudentAcademicDecision,
  useFindManyTrainingCourse,
} from "@workspace/db/hooks"
import { updateStudentStatus } from "@workspace/libs/api/training"
import { Select, useTrainingObjectTypeStore } from "@workspace/ui"
import { Col, Form, message, Switch } from "antd"
import { useDisclosure } from "react-hook-disclosure-modal"

const ModalChuyenLopLuuBan = () => {
  const [form] = Form.useForm()

  const selected = Form.useWatch([], form)

  const { showSpinner, hideSpinner } = useSpinner()

  const { isOpen, onClose, input } = useDisclosure<{
    ids: string[]
    actionTaken: AcademicActionType
  }>({
    tag: "ModalChuyenLopLuuBan",
  })

  const { data = [] } = useFindManyStudentAcademicDecision(
    {
      where: {
        id: {
          in: input?.ids,
        },
      },
      include: {
        student: {
          include: {
            fixedClass: {
              include: {
                trainingCourse: true,
                managementOrganization: true,
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
                  },
                },
              },
            },
            userProfile: true,
          },
        },
      },
    },
    { enabled: !!input?.ids }
  )

  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const { data: trainingCourses = [] } = useFindManyTrainingCourse({
    where: {
      active: true,
      deletedAt: null,
      trainingObjectTypeId,
    },
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
  })

  const { data: fixedClasses = [] } = useFindManyFixedClass({
    where: {
      active: true,
      deletedAt: null,
    },
    include: {
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
        },
      },
      trainingCourse: true,
    },
  })

  const handleSubmit = async () => {
    try {
      showSpinner()

      const dataSubmit = form.getFieldsValue()

      const listObject = Object.entries(dataSubmit).map(([key, value_]) => {
        return {
          id: key,
          ...(value_ as any),
        }
      })

      if (input) {
        await updateStudentStatus({
          decisionIds: input.ids as string[],
          academicActionType: input.actionTaken,
          classChanges: listObject.map((i) => {
            return {
              decisionId: i.id,
              changeCurriculumVersion: i.changeCurriculumVersion,
              fixedClassId: i.newFixedClassId,
            }
          }),
        })
      }

      message.success("Cập nhật thành công")
      queryClient.invalidateQueries({
        queryKey: ["zenstack", "StudentAcademicDecision"],
      })
      onClose()
    } catch (error: any) {
      message.error(error?.info?.message || "Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }

  const removeVietnameseTones = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  const extractCourseNumber = (courseName: string): number => {
    const normalized = removeVietnameseTones(courseName)
    const match = normalized.match(/(?:^K|[Kk]hoa\s*K?)\s*(\d+)/)
    return match ? Number(match[1]) : 0
  }

  const getAvailableTrainingCourses = (currentTrainingCourseId?: string) => {
    const currentCourse = trainingCourses.find((tc) => tc.id === currentTrainingCourseId)

    if (!currentCourse) return []

    const currentNumber = extractCourseNumber(currentCourse.name)

    return trainingCourses.filter((tc) => {
      const tcNumber = extractCourseNumber(tc.name)
      return tcNumber > currentNumber
    })
  }

  /**
   * Lọc danh sách lớp niên chế theo khóa học được chọn
   * Có thể lọc theo: khóa học, ngành
   */
  const getAvailableFixedClasses = (
    selectedTrainingCourseId?: string,
    currentTrainingFieldId?: string
  ) => {
    if (!selectedTrainingCourseId) return []

    return fixedClasses.filter((fc) => {
      // Lọc theo khóa học
      if (fc.trainingCourseId !== selectedTrainingCourseId) return false

      // Lọc theo ngành đào tạo
      if (
        currentTrainingFieldId &&
        fc.curriculumVersion?.curriculum?.trainingMajor?.trainingFieldId
      ) {
        if (
          fc.curriculumVersion.curriculum.trainingMajor.trainingFieldId !== currentTrainingFieldId
        )
          return false
      }

      return true
    })
  }

  const handleFixedClassChange = (
    recordId: string,
    newFixedClassId: string,
    currentCurriculumVersionId?: string
  ) => {
    const newFixedClass = fixedClasses.find((fc) => fc.id === newFixedClassId)

    if (newFixedClass && currentCurriculumVersionId) {
      const isDifferentCurriculum = newFixedClass.curriculumVersionId !== currentCurriculumVersionId

      form.setFieldValue([recordId, "changeCurriculumVersion"], isDifferentCurriculum)
    }
  }

  return (
    <PutFormModal
      title="Chuyển lớp học viên lưu ban"
      open={isOpen}
      onFinish={handleSubmit}
      onCancel={onClose}
      maskClosable={false}
      className="w-[80vw]"
      form={form}
    >
      <Col span={24}>
        <Table
          data={data}
          columns={[
            {
              title: "STT",
              width: 60,
              align: "center",
              render: (_, __, index) => index + 1,
            },
            {
              title: "Mã sinh viên",
              width: 100,
              render: (_, record) => record.student.code || "",
            },
            {
              title: "Tên sinh viên",
              width: 200,
              render: (_, record) => record.student?.userProfile?.fullname || "",
            },
            {
              title: "Lớp niên chế",
              width: 200,
              render: (_, record) => record.student.fixedClass?.name || "",
            },
            {
              title: "Khóa",
              width: 100,
              render: (_, record) => record.student.fixedClass?.trainingCourse?.name || "",
            },
            {
              title: "Khóa mới",
              width: 200,
              render: (_, record) => {
                const currentTrainingCourseId = record.student.fixedClass?.trainingCourse?.id

                const newTrainingCourses = getAvailableTrainingCourses(currentTrainingCourseId)

                return (
                  <Form.Item
                    name={[record.id, "newTrainingCourseId"]}
                    className="mb-0"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn khóa mới",
                      },
                    ]}
                  >
                    <Select
                      placeholder="Chọn khóa mới"
                      showSearch
                      optionFilterProp="label"
                      allowClear
                      onChange={() => {
                        form.setFieldValue([record.id, "newFixedClassId"], undefined)
                        form.setFieldValue([record.id, "changeCurriculumVersion"], false)
                      }}
                      options={newTrainingCourses.map((tc) => ({
                        label: tc.name,
                        value: tc.id,
                      }))}
                    />
                  </Form.Item>
                )
              },
            },
            {
              title: "Lớp niên chế mới",
              width: 400,
              render: (_, record) => {
                const selectedTrainingCourseId = selected?.[record.id]?.newTrainingCourseId

                const currentTrainingFieldId =
                  record.student.fixedClass?.curriculumVersion?.curriculum?.trainingMajor
                    ?.trainingFieldId

                const currentCurriculumVersionId = record.student.fixedClass?.curriculumVersionId

                const availableFixedClasses = getAvailableFixedClasses(
                  selectedTrainingCourseId,
                  currentTrainingFieldId
                )

                return (
                  <Form.Item
                    name={[record.id, "newFixedClassId"]}
                    className="mb-0"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn lớp niên chế mới",
                      },
                    ]}
                  >
                    <Select
                      placeholder="Chọn lớp niên chế mới"
                      showSearch
                      optionFilterProp="label"
                      allowClear
                      disabled={!selectedTrainingCourseId}
                      onChange={(value) => {
                        handleFixedClassChange(record.id, value, currentCurriculumVersionId)
                      }}
                      options={availableFixedClasses.map((fc) => ({
                        label: `${fc.name}${fc.curriculumVersion?.name ? ` - ${fc.curriculumVersion.name}` : ""}`,
                        value: fc.id,
                      }))}
                    />
                  </Form.Item>
                )
              },
            },
            {
              title: "Thay đổi CTĐT",
              width: 80,
              align: "center",
              render: (_, record) => {
                return (
                  <Form.Item
                    name={[record.id, "changeCurriculumVersion"]}
                    className="mb-0 flex justify-center items-center"
                    valuePropName="checked"
                    initialValue={false}
                  >
                    <Switch disabled />
                  </Form.Item>
                )
              },
            },
          ]}
        />
      </Col>
    </PutFormModal>
  )
}

export default ModalChuyenLopLuuBan
