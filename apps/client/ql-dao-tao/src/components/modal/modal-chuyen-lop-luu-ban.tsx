import PutFormModal from '@components/commons/put-modal'
import Table from '@components/commons/table'
import {
    useFindManyFixedClass,
    useFindManyStudentAcademicDecision,
    useFindManyTrainingCourse,
} from '@workspace/db/hooks'
import { Col, Form, Select } from 'antd'
import { useDisclosure } from 'react-hook-disclosure-modal'

const ModalChuyenLopLuuBan = () => {
    const [form] = Form.useForm()

    const selectedCourses = Form.useWatch([], form)

    const { isOpen, onClose, input } = useDisclosure<{
        ids: string[]
    }>({
        tag: 'ModalChuyenLopLuuBan',
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
                            },
                        },
                        userProfile: true,
                    },
                },
            },
        },
        { enabled: !!input?.ids }
    )

    const { data: trainingCourses = [] } = useFindManyTrainingCourse({
        where: {
            active: true,
            deletedAt: null,
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
        const dataSubmit = form.getFieldsValue()
        console.log(dataSubmit)
    }

    const removeVietnameseTones = (str: string) =>
        str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

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
     * Có thể lọc theo: khóa học, trình độ đào tạo, ngành, chuyên ngành
     */
    const getAvailableFixedClasses = (
        selectedTrainingCourseId?: string,
        currentTrainingFieldId?: string,
        currentTrainingMajorId?: string
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
                    fc.curriculumVersion.curriculum.trainingMajor.trainingFieldId !==
                    currentTrainingFieldId
                )
                    return false
            }

            // Lọc theo chuyên ngành đào tạo
            if (currentTrainingMajorId && fc.curriculumVersion?.curriculum?.trainingMajorId) {
                if (fc.curriculumVersion.curriculum.trainingMajorId !== currentTrainingMajorId)
                    return false
            }

            return true
        })
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
                            title: 'STT',
                            width: 60,
                            align: 'center',
                            render: (_, __, index) => index + 1,
                        },
                        {
                            title: 'Mã sinh viên',
                            width: 100,
                            render: (_, record) => record.student.code || '',
                        },
                        {
                            title: 'Tên sinh viên',
                            width: 200,
                            render: (_, record) => record.student?.userProfile?.fullname || '',
                        },
                        {
                            title: 'Lớp niên chế',
                            width: 200,
                            render: (_, record) => record.student.fixedClass?.name || '',
                        },
                        {
                            title: 'Khóa',
                            width: 100,
                            render: (_, record) =>
                                record.student.fixedClass?.trainingCourse?.name || '',
                        },
                        {
                            title: 'Khóa mới',
                            width: 200,
                            render: (_, record) => {
                                const currentTrainingCourseId =
                                    record.student.fixedClass?.trainingCourse?.id

                                const newTrainingCourses =
                                    getAvailableTrainingCourses(currentTrainingCourseId)

                                return (
                                    <Form.Item
                                        name={[record.id, 'newTrainingCourseId']}
                                        className="mb-0"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Vui lòng chọn khóa mới',
                                            },
                                        ]}
                                    >
                                        <Select
                                            placeholder="Chọn khóa mới"
                                            showSearch
                                            optionFilterProp="label"
                                            allowClear
                                            onChange={() => {
                                                form.setFieldValue(
                                                    [record.id, 'newFixedClassId'],
                                                    undefined
                                                )
                                            }}
                                            options={newTrainingCourses.map((tc) => ({
                                                label: `${tc.name}${tc.startYear ? ` (${tc.startYear})` : ''}`,
                                                value: tc.id,
                                            }))}
                                        />
                                    </Form.Item>
                                )
                            },
                        },
                        {
                            title: 'Lớp niên chế mới',
                            width: 200,
                            render: (_, record) => {
                                const selectedTrainingCourseId =
                                    selectedCourses?.[record.id]?.newTrainingCourseId

                                const currentTrainingFieldId =
                                    record.student.fixedClass?.curriculumVersion?.curriculum
                                        ?.trainingMajor?.trainingFieldId
                                const currentTrainingMajorId =
                                    record.student.fixedClass?.curriculumVersion?.curriculum
                                        ?.trainingMajorId

                                const availableFixedClasses = getAvailableFixedClasses(
                                    selectedTrainingCourseId,
                                    currentTrainingFieldId,
                                    currentTrainingMajorId
                                )

                                return (
                                    <Form.Item
                                        name={[record.id, 'newFixedClassId']}
                                        className="mb-0"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Vui lòng chọn lớp niên chế mới',
                                            },
                                        ]}
                                    >
                                        <Select
                                            placeholder="Chọn lớp niên chế mới"
                                            showSearch
                                            optionFilterProp="label"
                                            allowClear
                                            disabled={!selectedTrainingCourseId}
                                            options={availableFixedClasses.map((fc) => ({
                                                label: fc.name,
                                                value: fc.id,
                                            }))}
                                        />
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
