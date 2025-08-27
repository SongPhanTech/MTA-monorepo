import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type { SubjectClass } from '@workspace/db'
import {
    useFindManyLecturer,
    useFindManyRoom,
    useFindManySemester,
    useFindManySubjectVersion,
    useFindManyTrainingLocation,
    useFindUniqueSubjectClass,
    useUpdateSubjectClass,
} from '@workspace/db/hooks'
import { Col, Form, InputNumber, message } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import { SUBJECT_CLASS_SCHEDULE_TYPE } from '@constants/constants'
import { useExamTypeOptions } from '@hooks/examType'

dayjs.locale('vi')

export type PutOneSubjectClassType = SubjectClass & {
    trainingLocationId: string
}

const PutOneSubjectClassModal = () => {
    const [form] = Form.useForm<PutOneSubjectClassType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutOneSubjectClassModal.name,
        onClose: form.resetFields,
    })
    const { options, getExamTypeLabel } = useExamTypeOptions()
    const { showSpinner, hideSpinner } = useSpinner()
    // const [enterGradeLecturerOptions, setEnterGradeLecturerOptions] = useState([])
    const [_dataSubmit, _setDataSubmit] = useState<(SubjectClass & { key: number })[]>([])

    const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()
    // const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()
    async function onOk(output?: PutOneSubjectClassType) {
        if (!output) return
        try {
            showSpinner()
            await updateSubjectClass({
                data: {
                    startDate: output.startDate,
                    subjectId: output.subjectId,
                    schedule: output.schedule,
                    semesterId: output.semesterId,
                    code: output?.code,
                    roomId: output?.roomId,
                    maxStudent: output.maxStudent,
                    examType: output?.examType,
                    lecturerId: output?.lecturerId,
                    extraLecturerId: output.extraLecturerId,
                    enterGradeLecturerId: output?.enterGradeLecturerId,
                    examDate: output?.examDate,
                    scoreDeadline: output?.scoreDeadline,
                    examScoreDeadline: output.examScoreDeadline,
                    lecturerAssignmentDeadline: output.lecturerAssignmentDeadline,
                },
                where: {
                    id,
                },
            })
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['SubjectClass'],
            })
            onClose()
        } catch (_error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const handleChangeDate = () => {
        form.setFieldsValue({
            scoreDeadline: form.getFieldValue('examDate').add(-10, 'day'),
            examScoreDeadline: form.getFieldValue('examDate').add(10, 'day'),
        })
    }

    const { data: trainingLocationData = [], refetch: refetchTrainingLocationData } =
        useFindManyTrainingLocation()

    const { data: subjectVersionData = [] } = useFindManySubjectVersion({})

    const { data: semesterData = [] } = useFindManySemester({
        include: { schoolYear: { select: { name: true } } },
        orderBy: { startDate: 'desc' },
    })

    const TrainingLocationForm = Form.useWatch('trainingLocationId', form)

    const { data: roomData = [], refetch: refetchRoomData } = useFindManyRoom({
        where: {
            trainingRoom: true,
            building: {
                trainingLocationId: TrainingLocationForm,
            },
        },
    })

    const { data: lecturerData = [], refetch: refetchLecturer } = useFindManyLecturer({
        include: {
            userProfile: true,
        },
    })

    const { data: subjectClassData } = useFindUniqueSubjectClass(
        {
            where: { id },
            include: {
                room: {
                    include: {
                        building: {
                            include: {
                                trainingLocation: true,
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

    const mainLecturerForm = Form.useWatch('lecturerId', form)
    const extraLecturerForm = Form.useWatch('extraLecturerId', form)
    const enterGradeLecturerOptions = useMemo(() => {
        const lecturers = lecturerData.find((lecturer) => lecturer.id === mainLecturerForm)
        const enterGradeLecturer = lecturerData.find(
            (lecturer) => lecturer.id === extraLecturerForm
        )
        return [lecturers, enterGradeLecturer]
    }, [mainLecturerForm, extraLecturerForm, lecturerData])

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (subjectClassData) {
            form.setFieldsValue({
                ...subjectClassData,
                trainingLocationId: subjectClassData.room?.building?.trainingLocation?.id,
                lecturerAssignmentDeadline: subjectClassData.lecturerAssignmentDeadline
                    ? dayjs(subjectClassData.lecturerAssignmentDeadline)
                    : null,
                examDate: subjectClassData.examDate ? dayjs(subjectClassData.examDate) : null,
                scoreDeadline: subjectClassData.scoreDeadline
                    ? dayjs(subjectClassData.scoreDeadline)
                    : null,
                examScoreDeadline: subjectClassData.examScoreDeadline
                    ? dayjs(subjectClassData.examScoreDeadline)
                    : null,
            })
        }
    }, [subjectClassData])

    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={id ? 'Cập nhật lớp môn học' : 'Mở lớp môn học'}
            className="w-[65vw]"
        >
            <Col span={12}>
                <FormItem form={form} name="semesterId" label="Học kỳ" required>
                    <Select
                        placeholder="Chọn học kỳ"
                        showSearch
                        options={semesterData.map((item) => {
                            return {
                                ...item,
                                label: [item?.name, item?.schoolYear?.name]
                                    .filter(Boolean)
                                    .join(' - '),
                                value: item.id,
                            }
                        })}
                        disabled={true}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="subjectId" label="Môn học" required>
                    <Select
                        disabled={true}
                        placeholder="Chọn môn học"
                        options={subjectVersionData.map((item) => {
                            return {
                                ...item,
                                label: [item?.code, item?.name].filter(Boolean).join(' - '),
                                value: item.id,
                            }
                        })}
                        allowClear
                    />
                </FormItem>
            </Col>

            <Col span={12}>
                <FormItem form={form} name="schedule" label="Kíp học" required>
                    <Select
                        placeholder="Chọn kíp học"
                        options={Object.entries(SUBJECT_CLASS_SCHEDULE_TYPE).map(
                            ([key, value_]) => {
                                return {
                                    label: value_,
                                    value: key,
                                }
                            }
                        )}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="trainingLocationId" label="Địa điểm" required>
                    <Select
                        placeholder="Chọn địa điểm"
                        options={trainingLocationData.map((item) => {
                            return {
                                label: item.name,
                                value: item.id,
                            }
                        })}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="roomId" label="Chọn phòng học" required>
                    <Select
                        placeholder="Chọn kíp học"
                        options={roomData.map((item) => {
                            return {
                                label: item.name,
                                value: item.id,
                            }
                        })}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="maxStudent" label="Số SV tối đa" required>
                    <InputNumber
                        type="number"
                        min={1}
                        step={1}
                        placeholder="Nhập số SV tối đa"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="lecturerId" label="Giảng viên 1">
                    <Select
                        options={lecturerData
                            .filter(
                                (lecturer) => lecturer?.id !== form.getFieldValue('extraLecturerId')
                            )
                            .map((i) => {
                                return {
                                    ...i,
                                    value: i?.id,
                                    label: [i?.code, i?.userProfile?.fullname]
                                        .filter(Boolean)
                                        .join(' - '),
                                }
                            })}
                        placeholder="Chọn giảng viên 1"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="extraLecturerId" label="Giảng viên 2">
                    <Select
                        options={lecturerData
                            .filter((lecturer) => lecturer?.id !== form.getFieldValue('lecturerId'))
                            .map((i) => {
                                return {
                                    value: i?.id,
                                    label: [i?.code, i?.userProfile?.fullname]
                                        .filter(Boolean)
                                        .join(' - '),
                                }
                            })}
                        placeholder="Chọn giảng viên"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="enterGradeLecturerId" label="Giảng viên chấm điểm">
                    <Select
                        options={enterGradeLecturerOptions.map((i) => {
                            return {
                                value: i?.id,
                                label: [i?.code, i?.userProfile?.fullname]
                                    .filter(Boolean)
                                    .join(' - '),
                            }
                        })}
                        placeholder="Chọn giảng viên"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="lecturerAssignmentDeadline" label="Hạn PCGD">
                    <DatePicker
                        placeholder="DD/MM/YYYY"
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="examDate" label="Ngày thi">
                    <DatePicker
                        onChange={handleChangeDate}
                        placeholder="DD/MM/YYYY"
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                    />
                </FormItem>
            </Col>

            <Col span={12}>
                <FormItem form={form} name="scoreDeadline" label="Hạn nhập điểm CC/TX">
                    <DatePicker
                        placeholder="DD/MM/YYYY"
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="examScoreDeadline" label="Hạn nhập điểm thi">
                    <DatePicker
                        placeholder="DD/MM/YYYY"
                        format={{
                            format: 'DD/MM/YYYY',
                            type: 'mask',
                        }}
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="examType" label="Hình thức thi" required>
                    <Select placeholder="Chọn hình thức thi" options={options} />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutOneSubjectClassModal
