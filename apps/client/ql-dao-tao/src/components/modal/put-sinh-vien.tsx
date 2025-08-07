import { queryClient } from '@api/index'
import PutFormModal from '@components/commons/put-modal'
import useSpinner from '@hooks/spinner'
import {
    useCreateStudent,
    useFindManyCurriculumVersion,
    useFindManyFixedClass,
    useFindManyTrainingCourse,
    useFindManyTrainingObjectType,
    useFindManyUserProfile,
    useFindUniqueStudent,
    useFindUniqueUserProfile,
    useUpdateStudent,
} from '@workspace/db/hooks'
import { Col, Form, Input, message, Row } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import FormItem from '@components/commons/form-item'
import Select from '@components/commons/select'
import { STUDENT_STATUS_OPTIONS } from '@constants/constants'
import { useCallback, useEffect, useMemo } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import type { PutStudentProfile } from './quan-ly-ho-so/type'

dayjs.locale('vi')

export type StudentModalProps = {
    id: string
}

const PutStudentModal = () => {
    const [form] = Form.useForm<PutStudentProfile>()
    const { isOpen, onClose, input } = useDisclosure<StudentModalProps>({
        tag: PutStudentModal.name,
        onClose: form.resetFields,
    })
    const { id } = input ?? {}
    const { showSpinner, hideSpinner } = useSpinner()

    const { data: fixedClassData = [] } = useFindManyFixedClass({
        include: {
            trainingCourse: true,
            curriculumVersion: true,
        },
    })

    const { data: studentData } = useFindUniqueStudent(
        {
            where: { id: id },
            include: {
                userProfile: true,
                trainingObjectType: true,
                fixedClass: {
                    include: {
                        trainingCourse: true,
                    },
                },
                trainingType: true,
                trainingLevel: true,
            },
        },
        {
            enabled: !!id,
        }
    )
    const { data: curriculumVersionData = [] } = useFindManyCurriculumVersion({
        orderBy: { name: 'asc' },
    })
    const { data: trainingObjectTypeData = [] } = useFindManyTrainingObjectType()
    const { data: trainingCourseData = [] } = useFindManyTrainingCourse()

    const selectedTrainingCourseId = Form.useWatch('trainingCourseId', form)
    const selectedCurriculumVersionId = Form.useWatch('curriculumVersionId', form)

    const filteredFixedClasses = useMemo(() => {
        if (!selectedTrainingCourseId && !selectedCurriculumVersionId) {
            return fixedClassData
        }

        return fixedClassData.filter((cls) => {
            const matchesCourse =
                !selectedTrainingCourseId || cls.trainingCourseId === selectedTrainingCourseId
            const matchesCurriculum =
                !selectedCurriculumVersionId ||
                cls.curriculumVersionId === selectedCurriculumVersionId
            return matchesCourse && matchesCurriculum
        })
    }, [fixedClassData, selectedTrainingCourseId, selectedCurriculumVersionId])

    // Lọc khóa học dựa trên chương trình đào tạo đã chọn
    const filteredTrainingCourses = useMemo(() => {
        if (!selectedCurriculumVersionId) {
            return trainingCourseData
        }

        // Lấy danh sách khóa học có chứa chương trình đào tạo đã chọn
        const coursesWithCurriculum = fixedClassData
            .filter((cls) => cls.curriculumVersionId === selectedCurriculumVersionId)
            .map((cls) => cls.trainingCourseId)
            .filter((courseId, index, array) => array.indexOf(courseId) === index) // Remove duplicates

        return trainingCourseData.filter((course) => coursesWithCurriculum.includes(course.id))
    }, [trainingCourseData, fixedClassData, selectedCurriculumVersionId])

    // Cập nhật handleFixedClassChange hoàn chỉnh
    const handleFixedClassChange = (classId: string) => {
        const selectedClass = fixedClassData.find((cls) => cls.id === classId)

        if (selectedClass?.trainingCourseId) {
            const newCourse = selectedClass.trainingCourseId

            // Tự động set khóa học tương ứng với lớp
            form.setFieldValue('trainingCourseId', newCourse)
        }

        // SỬA: Tự động set phiên bản chương trình đào tạo
        if (selectedClass?.curriculumVersionId) {
            const newCurriculum = selectedClass.curriculumVersionId

            form.setFieldValue('curriculumVersionId', newCurriculum)
        }
    }

    const { mutateAsync: createStudent } = useCreateStudent()
    const { mutateAsync: updateStudent } = useUpdateStudent()
    const { data = [] } = useFindManyUserProfile({
        where: { bLaHocVien: true },
        select: {
            firstName: true,
            lastName: true,
            idCardNumber: true,
        },
    })
    const idCardNumber = Form.useWatch('idCardNumber', form)
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
                await updateStudent({
                    data: {
                        userProfileId: cccdUserProfileData?.id,
                        fixedClassId: output.fixedClassId,
                        trainingObjectTypeId: output.trainingObjectTypeId,
                        registrationAreaId: output.registrationAreaId,
                        status: output.status,
                        curriculumVersionId: output.curriculumVersionId,
                        note: output.note,
                        code: output.code,
                    },
                    where: {
                        id: id,
                    },
                })

                message.success('Cập nhật sinh viên, học viên thành công')
            } else {
                await createStudent({
                    data: {
                        userProfileId: cccdUserProfileData?.id,
                        fixedClassId: output.fixedClassId,
                        trainingObjectTypeId: output.trainingObjectTypeId,
                        registrationAreaId: output.registrationAreaId,
                        status: output.status,
                        curriculumVersionId: output.curriculumVersionId,
                        note: output.note,
                        code: output.code,
                    },
                })
                message.success('Thêm mới sinh viên, học viên thành công')
            }

            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['Student'],
            })
            onClose()
        } catch (error) {
            console.log('Error updating student:', error)
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
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
                userProfileId: userData.id,
            })
        },
        [form]
    )
    useEffect(() => {
        if (studentData) {
            form.setFieldsValue({
                // Student fields với ID
                code: studentData.code,
                trainingObjectTypeId: studentData.trainingObjectTypeId ?? undefined,
                fixedClassId: studentData.fixedClassId ?? undefined,
                trainingCourseId: studentData.fixedClass?.trainingCourse?.id ?? undefined,
                status: studentData.status,
                curriculumVersionId: studentData.curriculumVersionId ?? undefined,

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

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Chỉnh sửa sinh viên, học viên' : 'Thêm sinh viên, học viên'}
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
                                maxTagCount={'responsive'}
                                placeholder="Chọn phiên bản ngân hàng câu hỏi"
                                options={idCardOptions}
                                disabled={!!id}
                            />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem form={form} name="code" label="Mã sinh viên, học viên" required>
                            <Input placeholder="Nhập mã sinh viên, học viên" />
                        </FormItem>
                    </Col>
                    <Col sm={12} lg={12}>
                        <FormItem form={form} name="lastName" label="Họ và tên đệm" required>
                            <Input disabled placeholder="Nhập họ và tên đệm" />
                        </FormItem>
                    </Col>
                    <Col sm={12} lg={12}>
                        <FormItem form={form} name="firstName" label="Tên" required>
                            <Input disabled placeholder="Nhập tên" />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="trainingObjectTypeId"
                            label="Đối tượng đào tạo"
                            required
                        >
                            <Select
                                placeholder="Chọn đối tượng đào tạo"
                                options={trainingObjectTypeData.map((value) => ({
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
                        <FormItem form={form} name="trainingCourseId" label="Khóa">
                            <Select
                                placeholder="Chọn khóa"
                                options={filteredTrainingCourses.map((value) => ({
                                    value: value.id,
                                    label: value.name,
                                }))}
                            />
                        </FormItem>
                    </Col>
                    <Col span={12}>
                        <FormItem
                            form={form}
                            name="curriculumVersionId"
                            label="Chương trình đào tạo"
                        >
                            <Select
                                placeholder={'Chọn chương trình đào tạo'}
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
                    <Col span={12}>
                        <FormItem form={form} name="note" label="Ghi chú">
                            <Input placeholder="Nhập ghi chú" />
                        </FormItem>
                    </Col>
                </Row>
            </Col>
        </PutFormModal>
    )
}

export default PutStudentModal
