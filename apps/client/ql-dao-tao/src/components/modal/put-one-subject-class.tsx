import { queryClient } from '@api/index'
import DatePicker from '@components/commons/date-picker'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import TreeSelect from '@components/commons/tree-select'
import { SUBJECT_CLASS_SCHEDULE_TYPE } from '@constants/constants'
import { useExamTypeOptions } from '@hooks/examType'
import useSpinner from '@hooks/spinner'
import type { SubjectClass } from '@workspace/db/client'
import {
    useFindManyBuilding,
    useFindManyLecturer,
    useFindManySemester,
    useFindManySubjectVersion,
    useFindManyTrainingLocation,
    useFindUniqueSubjectClass,
    useUpdateSubjectClass,
} from '@workspace/db/hooks'
import { PERIOD } from '@workspace/ui'
import { Col, Form, InputNumber, message } from 'antd'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'

dayjs.locale('vi')

export type PutOneSubjectClassType = SubjectClass & {
    trainingLocationId: string
    dayOfWeeks?: number[]
    times?: { dayOfWeek: number; startPeriod: number; endPeriod: number }[]
}

const PutOneSubjectClassModal = () => {
    const [form] = Form.useForm<PutOneSubjectClassType>()

    const times = Form.useWatch('times', form) ?? []
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: 'PutOneSubjectClassModal',
        onClose: form.resetFields,
    })
    const { options } = useExamTypeOptions()
    const { showSpinner, hideSpinner } = useSpinner()
    const [_dataSubmit, _setDataSubmit] = useState<(SubjectClass & { key: number })[]>([])

    const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()
    // const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()
    async function onOk(output?: PutOneSubjectClassType) {
        if (!output) return
        console.log(output.times)

        try {
            showSpinner()
            await updateSubjectClass({
                data: { subjectClassTimes: { deleteMany: {} } },
                where: { id },
            })
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
                    subjectClassTimes: {
                        create: output.times?.map((time) => ({
                            dayOfWeek: time.dayOfWeek,
                            startPeriod: Number(time.startPeriod),
                            endPeriod: Number(time.endPeriod),
                        })),
                    },
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
        } catch (error: any) {
            if (error?.info?.message) {
                message.error(error?.info?.message)
                return
            }
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        } finally {
            hideSpinner()
        }
    }

    const handleChangeDate = () => {
        form.setFieldsValue({
            scoreDeadLineStart: form.getFieldValue('examDate').add(-14, 'day'),
            scoreDeadline: form.getFieldValue('examDate').add(-7, 'day'),
            examScoreDeadline: form.getFieldValue('examDate').add(10, 'day'),
        })
    }

    const { data: trainingLocationData = [] } = useFindManyTrainingLocation({
        where: { active: true },
    })

    const { data: subjectVersionData = [] } = useFindManySubjectVersion({ where: { active: true } })

    const { data: semesterData = [] } = useFindManySemester({
        include: { schoolYear: { select: { name: true } } },
        orderBy: { startDate: 'desc' },
    })

    const trainingLocationId = Form.useWatch('trainingLocationId', form)

    const { data: buildingData = [] } = useFindManyBuilding({
        orderBy: { name: 'asc' },
        where: { deletedAt: null, active: true, trainingLocationId },
        include: {
            rooms: {
                where: {
                    deletedAt: null,
                    active: true,
                },
            },
        },
    })

    const { data: lecturerData = [] } = useFindManyLecturer({
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
                subjectClassTimes: true,
            },
        },
        {
            enabled: !!id,
        }
    )

    const mainLecturerForm = Form.useWatch('lecturerId', form)
    const extraLecturerForm = Form.useWatch('extraLecturerId', form)

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
                dayOfWeeks: subjectClassData.subjectClassTimes?.map((item) => item.dayOfWeek),
                times: subjectClassData.subjectClassTimes?.map((item) => ({
                    dayOfWeek: item.dayOfWeek,
                    startPeriod: item.startPeriod,
                    endPeriod: item.endPeriod,
                })),
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
                <FormItem form={form} name="schedule" label="Kíp học">
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
                <FormItem form={form} name="trainingLocationId" label="Địa điểm">
                    <Select
                        placeholder="Chọn địa điểm"
                        options={trainingLocationData.map((item) => {
                            return {
                                label: item.name,
                                value: item.id,
                            }
                        })}
                        onChange={() => {
                            form.setFieldsValue({
                                roomId: undefined,
                            })
                        }}
                        allowClear
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="roomId" label="Chọn phòng học">
                    <TreeSelect
                        treeData={buildingData.map((e) => ({
                            label: e.name,
                            value: e.id,
                            selectable: false,
                            children: e.rooms.map((room) => ({
                                label: <p className="text-primary">{room.name}</p>,
                                value: room.id,
                                selectable: true,
                            })),
                        }))}
                        showSearch
                        allowClear
                        treeNodeFilterProp="title"
                        multiple={false}
                        showCheckedStrategy="SHOW_CHILD"
                        dropdownStyle={{
                            width: 400,
                            maxHeight: 400,
                        }}
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem form={form} name="maxStudent" label="Số SV tối đa">
                    <InputNumber
                        type="number"
                        min={1}
                        step={1}
                        placeholder="Nhập số SV tối đa"
                        className="w-full"
                    />
                </FormItem>
            </Col>
            <Col span={8}>
                <FormItem form={form} name="lecturerId" label="Giảng viên 1">
                    <Select
                        options={lecturerData.map((i) => {
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
            <Col span={8}>
                <FormItem form={form} name="extraLecturerId" label="Giảng viên 2">
                    <Select
                        options={lecturerData.map((i) => {
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
            <Col span={8}>
                <FormItem form={form} name="enterGradeLecturerId" label="Giảng viên chấm điểm">
                    <Select
                        options={lecturerData.map((i) => {
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
            <Col span={4}>
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
            <Col span={4}>
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
            <Col span={4}>
                <FormItem form={form} name="scoreDeadLineStart" label="Hạn bắt đầu nhập điểm CC/TX">
                    <DatePicker placeholder="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={4}>
                <FormItem form={form} name="scoreDeadline" label="Hạn kết thúc nhập điểm CC/TX">
                    <DatePicker placeholder="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={4}>
                <FormItem form={form} name="examScoreDeadline" label="Hạn nhập điểm thi">
                    <DatePicker placeholder="DD/MM/YYYY" className="w-full" />
                </FormItem>
            </Col>
            <Col span={4}>
                <FormItem form={form} name="examType" label="Hình thức thi">
                    <Select placeholder="Chọn hình thức thi" options={options} />
                </FormItem>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="dayOfWeeks" label="Ngày học trong tuần">
                    <Select
                        placeholder="Chọn ngày trong tuần"
                        mode="multiple"
                        allowClear
                        options={[
                            { label: 'Thứ 2', value: 2 },
                            { label: 'Thứ 3', value: 3 },
                            { label: 'Thứ 4', value: 4 },
                            { label: 'Thứ 5', value: 5 },
                            { label: 'Thứ 6', value: 6 },
                            { label: 'Thứ 7', value: 7 },
                            { label: 'Chủ nhật', value: 8 },
                        ]}
                        onChange={(value) => {
                            form.setFieldsValue({
                                times: value.map((dayOfWeek: number) => ({
                                    dayOfWeek,
                                    startPeriod: 1,
                                    endPeriod: 1,
                                })),
                            })
                        }}
                    />
                </FormItem>
            </Col>
            <FormItem form={form} name="times" hidden />
            <Col span={24}>
                <Table
                    columns={[
                        {
                            title: 'Thứ',
                            dataIndex: 'dayOfWeek',
                            key: 'dayOfWeek',
                            align: 'center',
                            render: (value) => {
                                if (value === 2) return 'Thứ 2'
                                if (value === 3) return 'Thứ 3'
                                if (value === 4) return 'Thứ 4'
                                if (value === 5) return 'Thứ 5'
                                if (value === 6) return 'Thứ 6'
                                if (value === 7) return 'Thứ 7'
                                if (value === 8) return 'Chủ nhật'
                                return ''
                            },
                        },
                        {
                            title: 'Tiết bắt đầu',
                            dataIndex: 'startPeriod',
                            key: 'startPeriod',
                            align: 'center',
                            render: (value) => (
                                <Select
                                    defaultValue={value}
                                    options={Object.entries(PERIOD).map(([key, val]) => ({
                                        label: `${key} - ${val.startTime.format('HH:mm')}`,
                                        value: Number(key),
                                    }))}
                                    onChange={(val) => {
                                        const newTimes = times.map((time) => {
                                            if (time.startPeriod === value) {
                                                return { ...time, startPeriod: val }
                                            }
                                            return time
                                        })
                                        form.setFieldsValue({
                                            times: newTimes,
                                        })
                                    }}
                                    className="w-full"
                                />
                            ),
                        },
                        {
                            title: 'Tiết kết thúc',
                            dataIndex: 'endPeriod',
                            key: 'endPeriod',
                            align: 'center',
                            render: (value, record) => (
                                <Select
                                    defaultValue={value}
                                    options={Object.entries(PERIOD)
                                        .map(([key, val]) => ({
                                            label: `${key} - ${val.endTime.format('HH:mm')}`,
                                            value: Number(key),
                                        }))
                                        .filter((item) => Number(item.value) >= record.startPeriod)}
                                    onChange={(val) => {
                                        const newTimes = times.map((time) => {
                                            if (time.endPeriod === value) {
                                                return { ...time, endPeriod: val }
                                            }
                                            return time
                                        })
                                        form.setFieldsValue({
                                            times: newTimes,
                                        })
                                    }}
                                    className="w-full"
                                />
                            ),
                        },
                    ]}
                    data={times}
                />
            </Col>
        </PutFormModal>
    )
}

export default PutOneSubjectClassModal
