import { queryClient } from "@api/index"
import PutFormModal from "@components/commons/put-modal"
import useSpinner from "@hooks/spinner"
import {
  useCreateStudent,
  useFindManyCurriculumVersion,
  useFindManyFixedClass,
  useFindManyTrainingCourse,
  useFindManyUserProfile,
  useFindUniqueStudent,
  useFindUniqueUserProfile,
  useUpdateUserProfile,
  useUpdateStudent,
} from "@workspace/db/hooks"
import { Button, Col, Form, Input, message, Row } from "antd"
import dayjs from "dayjs"
import "dayjs/locale/vi"
import DatePicker from "@components/commons/date-picker"
import { ExportOutlined } from "@ant-design/icons"
import FormItem from "@components/commons/form-item"
import Select from "@components/commons/select"
import { STUDENT_STATUS_OPTIONS } from "@constants/constants"
import { syncStudentDonViFromFixedClass } from "@lib/sync-student-don-vi"
import { ROUTER_PATH } from "@workspace/router"
import { useTrainingObjectTypeStore } from "@workspace/ui"
import { useCallback, useEffect, useMemo } from "react"
import { useDisclosure } from "react-hook-disclosure-modal"
import type { PutStudentProfile } from "./quan-ly-ho-so/type"

dayjs.locale("vi")

export type StudentModalProps = {
  id: string
}

const PutStudentModal = () => {
  const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()

  const [form] = Form.useForm<PutStudentProfile>()
  const { isOpen, onClose, input } = useDisclosure<StudentModalProps>({
    tag: "PutStudentModal",
    onClose: form.resetFields,
  })
  const { id } = input ?? {}
  const { showSpinner, hideSpinner } = useSpinner()

  const { data: fixedClassData = [] } = useFindManyFixedClass({
    where: { trainingCourse: { trainingObjectTypeId } },
    include: {
      trainingCourse: true,
      curriculumVersion: true,
    },
  })
  const { data: studentData, isPending } = useFindUniqueStudent(
    {
      where: { id },
      include: {
        userProfile: true,
        fixedClass: {
          include: {
            trainingCourse: {
              include: {
                trainingObjectType: true,
              },
            },
          },
        },
      },
    },
    {
      enabled: !!id,
    }
  )
  const { data: curriculumVersionData = [] } = useFindManyCurriculumVersion({
    where: {
      deletedAt: null,
      OR: [
        { trainingObjectTypeId },
        { curriculum: { trainingObjectTypeId } },
        { trainingCourse: { trainingObjectTypeId } },
        ...(studentData?.curriculumVersionId ? [{ id: studentData.curriculumVersionId }] : []),
      ],
    },
    orderBy: { name: "asc" },
  })

  const { data: trainingCourseData = [] } = useFindManyTrainingCourse({
    where: { active: true, trainingObjectTypeId },
    orderBy: {
      semesterStart: {
        startDate: "desc",
      },
    },
  })

  const selectedTrainingCourseId = Form.useWatch("trainingCourseId", form)
  const selectedCurriculumVersionId = Form.useWatch("curriculumVersionId", form)

  const filteredFixedClasses = useMemo(() => {
    if (!selectedTrainingCourseId) {
      return fixedClassData
    }

    return fixedClassData.filter((cls) => {
      const matchesCourse =
        !selectedTrainingCourseId || cls.trainingCourseId === selectedTrainingCourseId
      return matchesCourse
    })
  }, [fixedClassData, selectedTrainingCourseId])

  // // Lọc khoá học dựa trên chương trình đào tạo đã chọn
  // const filteredTrainingCourses = useMemo(() => {
  //     if (!selectedCurriculumVersionId) {
  //         return trainingCourseData
  //     }

  //     // Lấy danh sách khoá học có chứa chương trình đào tạo đã chọn
  //     const coursesWithCurriculum = fixedClassData
  //         .filter((cls) => cls.curriculumVersionId === selectedCurriculumVersionId)
  //         .map((cls) => cls.trainingCourseId)
  //         .filter((courseId, index, array) => array.indexOf(courseId) === index) // Remove duplicates

  //     return trainingCourseData.filter((course) => coursesWithCurriculum.includes(course.id))
  // }, [trainingCourseData, fixedClassData, selectedCurriculumVersionId])

  const filteredParallelCurriculumVersions = useMemo(() => {
    if (!selectedCurriculumVersionId) {
      return curriculumVersionData
    }

    return curriculumVersionData.filter((cv) => cv.id !== selectedCurriculumVersionId)
  }, [curriculumVersionData, selectedCurriculumVersionId])

  // Cập nhật handleFixedClassChange hoàn chỉnh
  const handleFixedClassChange = (classId: string) => {
    const selectedClass = fixedClassData.find((cls) => cls.id === classId)

    if (selectedClass?.trainingCourseId) {
      const newCourse = selectedClass.trainingCourseId

      // Tự động set khoá học tương ứng với lớp
      form.setFieldValue("trainingCourseId", newCourse)
    }

    // SỬA: Tự động set phiên bản chương trình đào tạo
    if (selectedClass?.curriculumVersionId) {
      const newCurriculum = selectedClass.curriculumVersionId

      form.setFieldValue("curriculumVersionId", newCurriculum)
    }
  }

  const { mutateAsync: createStudent } = useCreateStudent()
  const { mutateAsync: updateStudent } = useUpdateStudent()
  const { mutateAsync: updateUserProfile } = useUpdateUserProfile()
  const { data = [] } = useFindManyUserProfile({
    select: {
      firstName: true,
      lastName: true,
      idCardNumber: true,
    },
  })
  const idCardNumber = Form.useWatch("idCardNumber", form)
  const { data: cccdUserProfileData } = useFindUniqueUserProfile(
    {
      where: {
        idCardNumber: idCardNumber,
      },
      include: {
        educationAndTraining: {
          include: {
            fixedClass: {
              include: {
                trainingCourse: true,
                curriculumVersion: {
                  include: {
                    curriculum: {
                      include: {
                        trainingMajor: true,
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
    {
      enabled: !!idCardNumber,
      refetchOnWindowFocus: false,
    }
  )

  const idCardOptions = useMemo(() => {
    return data.map((profile) => ({
      value: profile.idCardNumber,
      label: `${profile.idCardNumber} - ${profile.lastName} ${profile.firstName}`,
    }))
  }, [data])

  async function onOk(output: PutStudentProfile) {
    if (!output || !cccdUserProfileData?.id) return

    try {
      showSpinner()

      if (id) {
        await updateUserProfile({
          data: {
            firstName: output.firstName,
            lastName: output.lastName,
            dateOfBirth: output.dateOfBirth,
            code: output.code || undefined,
          },
          where: {
            // The userProfileId is taken from the cccdUserProfileData
            // which is fetched based on the idCardNumber in the form.
            id: cccdUserProfileData.id,
          },
        })
        await updateStudent({
          data: {
            userProfileId: cccdUserProfileData?.id,
            fixedClassId: output.fixedClassId || null,
            registrationAreaId: output.registrationAreaId,
            status: output.status,
            curriculumVersionId: output.curriculumVersionId || null,
            curriculumVersionParallelId: output.curriculumVersionParallelId || null,
            note: output.note,
          },
          where: {
            id,
          },
        })
        if (output.fixedClassId) {
          await syncStudentDonViFromFixedClass({ studentIds: [id] })
        }

        message.success("Cập nhật sinh viên, học viên thành công")
      } else {
        if (cccdUserProfileData.educationAndTraining?.length > 0) {
          message.error(
            "Hồ sơ này đã được sử dụng cho một sinh viên khác. Vui lòng chọn hồ sơ khác."
          )
          hideSpinner()
          return
        }

        const created = await createStudent({
          data: {
            userProfileId: cccdUserProfileData?.id,
            fixedClassId: output.fixedClassId,
            registrationAreaId: output.registrationAreaId,
            status: output.status,
            curriculumVersionId: output.curriculumVersionId,
            curriculumVersionParallelId: output.curriculumVersionParallelId,
            note: output.note,
          },
        })
        if (output.code) {
          await updateUserProfile({
            where: { id: cccdUserProfileData.id },
            data: { code: output.code },
          })
        }
        if (output.fixedClassId && created?.id) {
          await syncStudentDonViFromFixedClass({ studentIds: [created.id] })
        }
        message.success("Thêm mới sinh viên, học viên thành công")
      }

      // refetch() lại danh sách level
      queryClient.invalidateQueries({
        queryKey: ["Student"],
      })
      onClose()
    } catch (error) {
      message.error("Đã xảy ra lỗi, vui lòng kiểm tra lại")
    } finally {
      hideSpinner()
    }
  }
  // Hàm fill thông tin từ dữ liệu cccdUserProfileData
  const fillUserInfo = useCallback(
    (userData: any) => {
      if (!userData) return

      // Fill thông tin cơ bản từ UserProfile
      form.setFieldsValue({
        firstName: userData.firstName,
        lastName: userData.lastName,
        dateOfBirth: userData.dateOfBirth ? dayjs(userData.dateOfBirth) : undefined,
      })
    },
    [form]
  )
  useEffect(() => {
    if (studentData) {
      form.setFieldsValue({
        // Student fields với ID
        code: studentData.userProfile?.code,
        fixedClassId: studentData.fixedClassId ?? undefined,
        trainingCourseId: studentData.fixedClass?.trainingCourse?.id ?? undefined,
        status: studentData.status,
        curriculumVersionId: studentData.curriculumVersionId ?? undefined,
        curriculumVersionParallelId: studentData.curriculumVersionParallelId ?? undefined,

        // UserProfile fields với ID
        firstName: studentData.userProfile?.firstName,
        lastName: studentData.userProfile?.lastName,

        idCardNumber: studentData.userProfile?.idCardNumber,
      })
    }
  }, [studentData, form])

  // Effect để fill thông tin khi có dữ liệu từ API
  useEffect(() => {
    if (cccdUserProfileData && !id) {
      fillUserInfo(cccdUserProfileData)
    }
  }, [cccdUserProfileData, id, fillUserInfo])
  useEffect(() => {
    if (studentData) {
      form.setFieldsValue({
        // Student fields với ID
        code: studentData.userProfile?.code,
        fixedClassId: studentData.fixedClassId ?? undefined,
        trainingCourseId: studentData.fixedClass?.trainingCourse?.id ?? undefined,
        status: studentData.status,
        curriculumVersionId: studentData.curriculumVersionId ?? undefined,
        curriculumVersionParallelId: studentData.curriculumVersionParallelId ?? undefined,

        // UserProfile fields với ID
        firstName: studentData.userProfile?.firstName,
        lastName: studentData.userProfile?.lastName,
        dateOfBirth: studentData.userProfile?.dateOfBirth
          ? dayjs(studentData.userProfile.dateOfBirth)
          : undefined,

        idCardNumber: studentData.userProfile?.idCardNumber,
      })
    }
  }, [studentData, form])

  // Effect để fill thông tin khi có dữ liệu từ API
  useEffect(() => {
    if (cccdUserProfileData && !id) {
      fillUserInfo(cccdUserProfileData)
    }
  }, [cccdUserProfileData, id, fillUserInfo])

  return (
    <PutFormModal
      open={isOpen}
      form={form}
      onFinish={onOk}
      onCancel={onClose}
      maskClosable={true}
      title={id ? "Chỉnh sửa sinh viên, học viên" : "Thêm sinh viên, học viên"}
      className="w-[1000px]"
      layout="vertical"
      // labelCol={{ span: 8 }} // label chiếm 6 cột (trên 24)
      // wrapperCol={{ span: 16 }} // input chiếm 18 cột
    >
      <Col span={24}>
        <Row gutter={16}>
          <Col sm={12} lg={12}>
            <FormItem form={form} name="idCardNumber" label="Số CCCD" required>
              <Select
                maxTagCount={"responsive"}
                placeholder="Chọn hồ sơ"
                options={idCardOptions}
                {...(id
                  ? {
                      showSearch: false,
                      allowClear: false,
                      showArrow: false,
                      open: false,
                    }
                  : {})}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="code" label="Mã sinh viên, học viên" required>
              <Input placeholder="Nhập mã định danh, học viên" />
            </FormItem>
          </Col>
          <Col sm={12} lg={12}>
            <FormItem form={form} name="lastName" label="Họ và tên đệm" required>
              <Input placeholder="Nhập họ và tên đệm" />
            </FormItem>
          </Col>
          <Col sm={12} lg={12}>
            <FormItem form={form} name="firstName" label="Tên" required>
              <Input placeholder="Nhập tên" />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="dateOfBirth" label="Ngày sinh">
              <DatePicker
                format={{
                  format: "DD/MM/YYYY",
                  type: "mask",
                }}
                className="w-full"
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="trainingCourseId" label="Khoá">
              <Select
                placeholder="Chọn khoá"
                options={trainingCourseData.map((value) => ({
                  value: value.id,
                  label: value.name,
                }))}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="fixedClassId" label="Lớp">
              <Select
                placeholder="Chọn lớp"
                optionFilterProp="label"
                onChange={handleFixedClassChange}
                options={filteredFixedClasses.map((value) => ({
                  value: value.id,
                  label: `${value.code}-${value.name}`,
                }))}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="curriculumVersionId" label="Chương trình đào tạo">
              <Select
                placeholder={"Chọn chương trình đào tạo"}
                showSearch
                optionFilterProp="label"
                options={curriculumVersionData.map((value) => ({
                  value: value.id,
                  label: value.name,
                }))}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem
              form={form}
              name="curriculumVersionParallelId"
              label="Chương trình đào tạo song song"
            >
              <Select
                placeholder={"Chọn chương trình đào tạo"}
                showSearch
                optionFilterProp="label"
                options={filteredParallelCurriculumVersions.map((value) => ({
                  value: value.id,
                  label: value.name,
                }))}
              />
            </FormItem>
          </Col>
          <Col span={12}>
            <FormItem form={form} name="status" label="Trạng thái" required>
              <Select
                placeholder="Chọn trạng thái"
                options={STUDENT_STATUS_OPTIONS.map((v) => {
                  return {
                    value: v.value,
                    label: v.label,
                  }
                })}
              />
            </FormItem>
          </Col>
          <Col span={12} />
          <Col span={12}>
            <div className="h-full flex items-end pt-2">
              <Button
                className="mt-auto"
                type="link"
                rel="noopener noreferrer"
                loading={isPending || !studentData}
                target="_blank"
                href={`/hrm/${ROUTER_PATH.QL_HO_SO.QUAN_LY_HO_SO}/${studentData?.userProfileId}`}
              >
                Hồ sơ <ExportOutlined />
              </Button>
            </div>
          </Col>
          <Col span={24}>
            <FormItem form={form} name="note" label="Ghi chú">
              <Input.TextArea placeholder="Nhập ghi chú" />
            </FormItem>
          </Col>
        </Row>
      </Col>
    </PutFormModal>
  )
}

export default PutStudentModal
