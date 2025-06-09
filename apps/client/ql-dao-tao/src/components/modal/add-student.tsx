import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import { GENDER_LIST, STUDENT_STATUS_OPTIONS } from '@constants/constants'
import useSpinner from '@hooks/spinner'
import type { $Enums, UserProfile } from '@workspace/db'
import {
    useCreateCurriculum,
    useCreateStudent,
    useCreateUserProfile,
    useFindManyCurriculum,
    useFindManyCurriculumVersion,
    useFindManyFixedClass,
    useFindManyTrainingCourse,
    useFindManyTrainingField,
    useFindManyTrainingLevel,
    useFindManyTrainingMajor,
    useFindManyTrainingObjectType,
    useFindUniqueUserProfile,
    useUpdateUserProfile,
} from '@workspace/db/hooks'
import { Col, Form, Input, message } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useEffect, useMemo } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
export type PutUserProfile = UserProfile & {
    trainingObjectTypeId?: string
    fixedClassId?: string
    trainingCourseId?: string
    trainingLevelId?: string
    curriculumVersionId?: string
    status: $Enums.FixedClassStudentStatus
}
dayjs.locale('vi')

export type AddStudentModalProps = {
    preSelectedValues?: {
        trainingObjectTypeId?: string
        trainingCourseId?: string
        fixedClassId?: string
    }
}

type PreFillFormFields = {
    trainingObjectTypeId?: string
    fixedClassId?: string
    trainingCourseId?: string
}

const AddStudentModal = () => {
    const [form] = Form.useForm<PutUserProfile>()
    const { isOpen, onClose, input } = useDisclosure<AddStudentModalProps>({
        tag: AddStudentModal.name,
        onClose: form.resetFields,
    })

    const { preSelectedValues } = input ?? {}

    const { showSpinner, hideSpinner } = useSpinner()

    const { data: fixedClassData = [], refetch: refetchFixedClassData } =
        useFindManyFixedClass({
            include: {
                trainingCourse: true,
                curriculumVersion: true,
            },
        })

    const { data: trainingCourseData = [], refetch: refetchTrainingCourse } =
        useFindManyTrainingCourse({
            include: {
                fixedClass: true,
            },
        })

    const { data: trainingObjectTypeData } = useFindManyTrainingObjectType()

    const { data: trainingLevelData = [] } = useFindManyTrainingLevel()

    const { data: curriculumVersionData = [] } = useFindManyCurriculumVersion()

    const { mutateAsync: createStudent } = useCreateStudent()

    //Watch lớp
    const selectedFixedClassId = Form.useWatch('fixedClassId', form)
    const selectedTrainingCourseId = Form.useWatch('trainingCourseId', form)

    //Lọc lớp theo khóa đã chọn
    const filteredFixedClasses = useMemo(() => {
        if (!selectedTrainingCourseId) {
            return fixedClassData
        }

        // Chỉ hiển thị các lớp thuộc khóa đã chọn
        return fixedClassData.filter(
            (cls) => cls.trainingCourseId === selectedTrainingCourseId
        )
    }, [fixedClassData, selectedTrainingCourseId])

    //Lọc khóa theo lớp đã chọn (giữ nguyên logic cũ)
    const filteredTrainingCourses = useMemo(() => {
        if (!selectedFixedClassId) {
            return trainingCourseData
        }

        const selectedClass = fixedClassData.find(
            (cls) => cls.id === selectedFixedClassId
        )
        if (selectedClass?.trainingCourseId) {
            return trainingCourseData.filter(
                (course) => course.id === selectedClass.trainingCourseId
            )
        }

        return trainingCourseData
    }, [trainingCourseData, selectedFixedClassId, fixedClassData])

    //Handler khi thay đổi lớp
    const handleFixedClassChange = (classId: string) => {
        const selectedClass = fixedClassData.find((cls) => cls.id === classId)

        if (selectedClass?.trainingCourseId) {
            // Tự động set khóa học tương ứng với lớp
            form.setFieldValue(
                'trainingCourseId',
                selectedClass.trainingCourseId
            )
        }

        if (selectedClass?.curriculumVersionId) {
            form.setFieldValue(
                'curriculumVersionId',
                selectedClass.curriculumVersionId
            )
        }
    }

    //Thêm handler khi thay đổi khóa
    const handleTrainingCourseChange = (courseId: string) => {
        const currentClassId = form.getFieldValue('fixedClassId')

        if (currentClassId) {
            const selectedClass = fixedClassData.find(
                (cls) => cls.id === currentClassId
            )

            // Nếu lớp hiện tại không thuộc khóa mới được chọn
            if (selectedClass?.trainingCourseId !== courseId) {
                // Reset lớp để user chọn lại
                form.setFieldValue('fixedClassId', undefined)
            }
        }

        // Nếu khóa chỉ có 1 lớp, tự động chọn lớp đó
        const classesInCourse = fixedClassData.filter(
            (cls) => cls.trainingCourseId === courseId
        )
        if (classesInCourse.length === 1 && !currentClassId) {
            form.setFieldValue('fixedClassId', classesInCourse[0].id)
        }
    }

    useEffect(() => {
        if (isOpen && preSelectedValues) {
            const fieldsToSet: PreFillFormFields = {} // SỬA: Khai báo biến fieldsToSet

            // Set đối tượng đào tạo nếu có trong filter
            if (preSelectedValues.trainingObjectTypeId) {
                fieldsToSet.trainingObjectTypeId =
                    preSelectedValues.trainingObjectTypeId
            }

            // Set lớp nếu có trong filter (ưu tiên cao nhất)
            if (preSelectedValues.fixedClassId) {
                fieldsToSet.fixedClassId = preSelectedValues.fixedClassId

                // Tự động tìm và set khóa học tương ứng với lớp đã chọn
                const selectedClass = fixedClassData.find(
                    (cls) => cls.id === preSelectedValues.fixedClassId
                )
                if (selectedClass?.trainingCourseId) {
                    fieldsToSet.trainingCourseId =
                        selectedClass.trainingCourseId
                }
            }
            // Nếu không có lớp trong filter nhưng có khóa
            else if (preSelectedValues.trainingCourseId) {
                fieldsToSet.trainingCourseId =
                    preSelectedValues.trainingCourseId
            }

            // Chỉ set form values nếu có ít nhất 1 field cần set
            if (Object.keys(fieldsToSet).length > 0) {
                form.setFieldsValue(fieldsToSet)
            }
        }
    }, [isOpen, preSelectedValues, form, fixedClassData])

    async function onOk(output?: PutUserProfile) {
        if (!output) return
        try {
            showSpinner()

            await createStudent({
                data: {
                    userProfile: {
                        create: {
                            code: output.code,
                            firstName: output.firstName,
                            lastName: output.lastName,
                            gender: output.gender,
                            dateOfBirth: output.dateOfBirth,
                        },
                    },
                    trainingObjectType: {
                        connect: {
                            id: output.trainingObjectTypeId,
                        },
                    },
                    fixedClass: {
                        connect: {
                            id: output.fixedClassId,
                        },
                    },
                    curriculumVersion: {
                        connect: {
                            id: output.curriculumVersionId,
                        },
                    },
                    code: output.code,
                    status: output.status,
                },
            })

            message.success('Thêm mới thành công')

            queryClient.invalidateQueries({
                queryKey: ['Student'],
            })

            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Thêm mới sinh viên / học viên'}
            className="w-[50vw]"
        >
            <Col span={12}>
                <FormItem
                    form={form}
                    name="firstName"
                    label="Họ và tên đệm"
                    required
                >
                    <Input placeholder="Nhập họ và tên đệm" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="lastName" label="Tên" required>
                    <Input placeholder="Nhập tên" />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="code" label="Mã" required>
                    <Input placeholder="Nhập mã sinh viên" />
                </FormItem>
            </Col>

            <Col span={12}>
                <FormItem
                    form={form}
                    name="dateOfBirth"
                    label="Ngày sinh"
                    required
                >
                    <DatePicker
                        format="DD/MM/YYYY"
                        className="w-full"
                        disabledDate={(date) =>
                            date && date > dayjs().endOf('day')
                        }
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="gender" label="Giới tính" required>
                    <Select
                        placeholder="Chọn giới tính"
                        options={GENDER_LIST.map((i) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
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
                        options={trainingObjectTypeData?.map((value) => {
                            return {
                                value: value.id,
                                label: value.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingLevelId"
                    label="Bậc đào tạo"
                >
                    <Select
                        placeholder="Chọn bậc đào tạo"
                        options={trainingLevelData.map((i) => {
                            return {
                                value: i.id,
                                label: i.name,
                            }
                        })}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="status" label="Trạng thái">
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
                <FormItem form={form} name="fixedClassId" label="Lớp">
                    <Select
                        placeholder="Chọn lớp"
                        showSearch
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
                <FormItem form={form} name="trainingCourseId" label="Khóa học">
                    <Select
                        placeholder={'Chọn khóa học'}
                        showSearch
                        optionFilterProp="label"
                        onChange={handleTrainingCourseChange}
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
                    label="Phiên bản chương trình đào tạo"
                >
                    <Select
                        placeholder={'Chọn phiên bản chương trình đào tạo'}
                        showSearch
                        optionFilterProp="label"
                        options={curriculumVersionData.map((value) => ({
                            value: value.id,
                            label: value.name,
                        }))}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default AddStudentModal
