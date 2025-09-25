import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import Table from '@components/commons/table'
import DeleteIcon from '@components/icons/delete'
import useSpinner from '@hooks/spinner'
import type { Room, SubjectClass, SubjectClassSchedule, SubjectVersion } from '@workspace/db'
import {
    useCreateManySubjectClass,
    useFindManyRoom,
    useFindManySubjectClass,
    useFindManyTrainingLocation,
    useFindUniqueSubjectVersion,
    useUpdateSubjectClass,
} from '@workspace/db/hooks'
import { Button, Col, DatePicker, Empty, Flex, Form, InputNumber, message, Row } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import { SUBJECT_CLASS_SCHEDULE_TYPE } from '@constants/constants'
import { useExamTypeOptions } from '@hooks/examType'
import type { OpenSubjectClass } from '@workspace/libs/api/schemas/openSubjectClass'
import { putManySubjectClass } from '@workspace/libs/api/training'
import { useTrainingObjectTypeStore } from '@workspace/ui'

dayjs.locale('vi')

export type OpenSubjectClassType = OpenSubjectClass & {
    studentCount: number
    semester: {
        id: string
        name: string
        value: string
        key: string
        code: string
    }
    schedule: SubjectClassSchedule
    startDate?: Date
    subjectVersionCode?: string
}

export type PutSubjectClass = {
    list?: (SubjectClass & { id: string | undefined | null })[] | []
    schedule: string
    trainingLocationId: string | null
    subjectVersionId: string
    semesterId: string
    totalStudent: number | null
    maxStudent: number | null
    numberOfClass: number | null
}

const PutOpenClassModal = () => {
    const { id: trainingObjectTypeId } = useTrainingObjectTypeStore()
    const [form] = Form.useForm<PutSubjectClass>()
    const {
        isOpen,
        onClose,
        input: dataClass,
    } = useDisclosure<OpenSubjectClassType>({
        tag: 'PutOpenClassModal',
        onClose: form.resetFields,
    })
    const { options, getExamTypeLabel } = useExamTypeOptions()
    const { showSpinner, hideSpinner } = useSpinner()
    const [isEdit, setIsEdit] = useState<boolean>(true)
    const { mutateAsync: createMany } = useCreateManySubjectClass()
    const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()
    async function onOk(output?: PutSubjectClass) {
        // if (!output) return
        try {
            showSpinner()
            const dataSubmit = form.getFieldValue('list')
            console.log('dataSubmit', dataSubmit, dataClass)

            if (!isEdit) {
                await createMany({
                    data: form.getFieldValue('list').map((i: SubjectClass) => ({
                        name: i.name,
                        startDate: i.startDate,
                        subjectId: i.subjectId,
                        schedule: i.schedule,
                        semesterId: dataClass?.semester,
                        code: i?.code,
                        roomId: i?.roomId,
                        maxStudent: i?.maxStudent,
                        examDate: i.examDate,
                        examScoreDeadline: i.examScoreDeadline,
                        lecturerAssignmentDeadline: i.lecturerAssignmentDeadline,
                        scoreDeadline: i.scoreDeadline,
                        examType: i.examType,
                        trainingObjectTypeId,
                    })),
                })
            } else {
                const _res = await putManySubjectClass(
                    form.getFieldValue('list').map((i: SubjectClass) => ({
                        id: i?.id,
                        schedule: i.schedule,
                        code: i?.code,
                        roomId: i?.roomId,
                        examDate: i.examDate,
                        examScoreDeadline: i.examScoreDeadline,
                        lecturerAssignmentDeadline: i.lecturerAssignmentDeadline,
                        scoreDeadline: i.scoreDeadline,
                        examType: i.examType,
                        semesterId: dataClass?.semester,
                        trainingObjectTypeId,
                    }))
                )
            }

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
    const { data: subjectVersionData } = useFindUniqueSubjectVersion({
        where: { id: dataClass?.subjectVersionId },
        include: {
            subjectClass: true,
        },
    })

    async function handleDelete(id: string) {
        try {
            showSpinner()
            await updateSubjectClass({
                where: {
                    id,
                },
                data: {
                    deletedAt: new Date(),
                },
            })
            // const result = dataSubmit.filter((i) => i?.id !== id)
            // setDataSubmit(result)
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

    const handleCreateTableForClass = () => {
        setIsEdit(false)
        const numberOfClass = Number(form.getFieldValue('numberOfClass'))
        if (numberOfClass > 0) {
            const cout = Math.ceil(Number(dataClass?.countStudent) / Number(numberOfClass))
            const result = []

            for (let i = 0; i < Number(numberOfClass); i++) {
                result.push({
                    key: i + 1,
                    code: `${subjectVersionData?.code} 0${i + 1}`,
                    name: subjectVersionData?.name,
                    maxStudent: Number(cout),
                    startDate: new Date(),
                    semesterId: dataClass?.semester?.id,
                    subjectId: subjectVersionData?.id,
                    subject: subjectVersionData,
                    examType: subjectVersionData?.examType,
                })
            }
            form.setFieldsValue({ list: result, maxStudent: null })
        }
    }
    const handleCreateTableForMaxStudent = () => {
        setIsEdit(false)
        const maxStudent = Number(form.getFieldValue('maxStudent'))
        console.log('maxStudent', maxStudent, form.getFieldValue('totalStudent'))

        if (Number(maxStudent) > 0) {
            const cout = Math.ceil(Number(dataClass?.countStudent) / Number(maxStudent))
            const result = []
            for (let i = 0; i < cout; i++) {
                result.push({
                    key: i + 1,
                    code: `${subjectVersionData?.code} 0${i + 1}`,
                    name: subjectVersionData?.name ? subjectVersionData?.name : '',
                    maxStudent: Number(maxStudent),
                    startDate: new Date(),
                    semesterId: dataClass?.semester?.id,
                    subjectId: subjectVersionData?.id,
                    subject: subjectVersionData,
                    examType: subjectVersionData?.examType,
                })
            }
            form.setFieldsValue({ list: result, numberOfClass: null })
        }
    }

    const handleChangeDateExam = (date: Dayjs, key: number) => {
        const result = form.getFieldValue('list').map((i: SubjectClass, index: number) => {
            if (key === index) {
                return {
                    ...i,
                    examDate: date,
                    scoreDeadline: date.add(-10, 'day'),
                    examScoreDeadline: date.add(10, 'day'),
                }
            }
            return i
        })
        form.setFieldsValue({ list: result })
    }

    const handleChangeLocation = (value: string, key: string) => {}
    const { data: trainingLocationData = [], refetch: refetchTrainingLocationData } =
        useFindManyTrainingLocation()

    const TrainingLocationForm = Form.useWatch('trainingLocationId', form)

    const { data: roomData = [], refetch: refetchRoomData } = useFindManyRoom({
        where: {
            trainingRoom: true,
            building: {
                trainingLocationId: TrainingLocationForm,
            },
        },
    })

    const { data: subjectClassData = [], refetch: refetchSubjectClassData } =
        useFindManySubjectClass(
            {
                where: {
                    subjectId: dataClass?.subjectVersionId,
                },
                include: {
                    subject: true,
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
                enabled: !!dataClass?.subjectVersionId,
            }
        )

    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    useEffect(() => {
        if (subjectClassData?.length) {
            const totalStudent = subjectClassData.reduce(
                (total, item) => total + Number(dataClass?.countStudent),
                0
            )
            form.setFieldsValue({
                totalStudent: totalStudent,
                trainingLocationId: subjectClassData[0]?.room?.building?.trainingLocationId,
                list: subjectClassData.map((i, index: number) => ({
                    ...i,
                    key: index + 1,
                    examDate: i.examDate ? dayjs(i.examDate) : null,
                    scoreDeadline: i.scoreDeadline ? dayjs(i.scoreDeadline) : null,
                    examScoreDeadline: i.examScoreDeadline ? dayjs(i.examScoreDeadline) : null,
                    lecturerAssignmentDeadline: i.lecturerAssignmentDeadline
                        ? dayjs(i.lecturerAssignmentDeadline)
                        : null,
                })),
            })
        }
    }, [subjectClassData])
    const listForm = Form.useWatch('list', form)?.filter((i) => i?.name) ?? []
    return (
        <PutFormModal
            open={isOpen}
            form={form}
            onFinish={onOk}
            onCancel={onClose}
            maskClosable={true}
            title={'Mở lớp môn học'}
            className="w-[80vw]"
        >
            <Col span={6}>
                <div className="mb-3">Mã HK: {dataClass?.semester?.code}</div>
            </Col>
            <Col className="mb-3" span={6}>
                {dataClass?.semester?.name}
            </Col>
            <Col className="mb-3" span={6}>
                Đơn vị phụ trách:
            </Col>
            <Col className="mb-3" span={6}>
                Bộ môn:{' '}
            </Col>
            <Col className="mb-3" span={6}>
                Mã MH: {dataClass?.subjectVersionCode}
            </Col>
            <Col className="mb-3" span={6}>
                Tên MH: {dataClass?.subjectVersionName}
            </Col>
            <Col className="mb-3" span={6}>
                Tổng SV: {dataClass?.countStudent}
            </Col>
            <Col className="mb-3" span={6}>
                Tổng SV nợ môn: 0
            </Col>
            {/* <Col span={12}>
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
                <FormItem form={form} name="trainingLocationId" label="Địa điểm">
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
            </Col> */}
            <Col span={12}>
                <Flex gap={12} align="center">
                    <span className="min-w-[100px]">Số LMH</span>
                    <FormItem className="w-full mb-0" form={form} name="numberOfClass" label="">
                        <InputNumber
                            type="number"
                            className="w-full"
                            placeholder="Nhập số lớp cần tạo"
                            step={1}
                            min={0}
                        />
                    </FormItem>
                    <Button onClick={handleCreateTableForClass} type="primary" className="h-[32px]">
                        Thêm LMH theo số lớp
                    </Button>
                </Flex>
            </Col>
            <Col span={12}>
                <Flex gap={12} align="center">
                    <span className="min-w-[100px]">Số SV tối đa</span>
                    <FormItem className="w-full mb-0" form={form} name="maxStudent" label="">
                        <InputNumber
                            type="number"
                            className="w-full"
                            placeholder="Nhập số SV tối đa"
                            step={1}
                            min={0}
                        />
                    </FormItem>

                    <Button
                        onClick={handleCreateTableForMaxStudent}
                        type="primary"
                        className="h-[32px]"
                    >
                        Thêm LMH theo số SV tối đa
                    </Button>
                </Flex>
            </Col>
            <Col span={24}>
                <FormItem form={form} name="list">
                    <Table
                        columns={[
                            {
                                title: 'STT',
                                width: 50,
                                align: 'center',
                                fixed: 'left',
                                render: (_, __, index) => index + 1,
                            },
                            {
                                title: 'Mã LMH',
                                dataIndex: 'code',
                                width: 150,
                            },
                            {
                                title: 'Tên môn học',
                                dataIndex: 'name',
                                width: 200,
                            },
                            {
                                title: 'Số tín chỉ',
                                dataIndex: 'subject',
                                width: 100,
                                align: 'center',
                                render: (value: SubjectVersion) => value?.credit,
                            },
                            {
                                title: 'SV nợ',
                                dataIndex: 'svNo',
                                width: 100,
                                align: 'center',
                            },
                            {
                                title: 'Số tiết TKB',
                                dataIndex: 'subject',
                                width: 100,
                                align: 'center',
                                render: (value: SubjectVersion) => value?.period,
                            },
                            {
                                title: 'Số SV max',
                                dataIndex: 'maxStudent',
                                width: 100,
                                align: 'center',
                            },

                            {
                                title: 'Kíp học',
                                dataIndex: 'schedule',
                                width: 200,
                                align: 'center',
                                render: (_, __, index) => (
                                    <Form.Item
                                        className="w-full mb-0"
                                        name={['list', index, 'schedule']}
                                        label=""
                                    >
                                        <Select
                                            placeholder="Chọn kíp học"
                                            options={Object.entries(
                                                SUBJECT_CLASS_SCHEDULE_TYPE
                                            ).map(([key, value_]) => {
                                                return {
                                                    label: value_,
                                                    value: key,
                                                }
                                            })}
                                            allowClear
                                        />
                                    </Form.Item>
                                ),
                            },
                            {
                                title: 'Hạn PCGD',
                                width: 150,
                                align: 'center',
                                render: (_, __, index) => (
                                    <Form.Item
                                        className="w-full mb-0"
                                        name={['list', index, 'lecturerAssignmentDeadline']}
                                        label=""
                                    >
                                        <DatePicker
                                            format={{
                                                format: 'DD/MM/YYYY',
                                                type: 'mask',
                                            }}
                                            className="w-full"
                                            disabledDate={(date) =>
                                                date && date < dayjs().startOf('day')
                                            }
                                        />
                                    </Form.Item>
                                ),
                            },
                            {
                                title: 'Ngày thi',
                                width: 150,
                                align: 'center',
                                render: (record, __, index) => (
                                    <Form.Item
                                        className="w-full mb-0"
                                        name={['list', index, 'examDate']}
                                        label=""
                                    >
                                        <DatePicker
                                            format={{
                                                format: 'DD/MM/YYYY',
                                                type: 'mask',
                                            }}
                                            className="w-full"
                                            disabledDate={(date) =>
                                                date && date < dayjs().startOf('day')
                                            }
                                            onChange={(date) => handleChangeDateExam(date, index)}
                                        />
                                    </Form.Item>
                                ),
                            },
                            {
                                title: 'Hạn nhập điểm CC/TX',
                                width: 150,
                                align: 'center',
                                render: (record, __, index) => (
                                    <Form.Item
                                        className="w-full mb-0"
                                        name={['list', index, 'scoreDeadline']}
                                        label=""
                                    >
                                        <DatePicker
                                            format={{
                                                format: 'DD/MM/YYYY',
                                                type: 'mask',
                                            }}
                                            className="w-full"
                                            disabledDate={(date) =>
                                                date && date < dayjs().startOf('day')
                                            }
                                        />
                                    </Form.Item>
                                ),
                            },
                            {
                                title: 'Hạn nhập điểm',
                                width: 150,
                                align: 'center',
                                render: (record, __, index) => (
                                    <Form.Item
                                        className="w-full mb-0"
                                        name={['list', index, 'examScoreDeadline']}
                                        label=""
                                    >
                                        <DatePicker
                                            format={{
                                                format: 'DD/MM/YYYY',
                                                type: 'mask',
                                            }}
                                            className="w-full"
                                            disabledDate={(date) =>
                                                date && date < dayjs().startOf('day')
                                            }
                                        />
                                    </Form.Item>
                                ),
                            },
                            {
                                title: 'Hình thức thi',
                                width: 150,
                                align: 'center',
                                render: (record, __, index) => (
                                    <Form.Item
                                        className="w-full mb-0"
                                        name={['list', index, 'examType']}
                                        label=""
                                    >
                                        <Select
                                            placeholder="Chọn hình thức thi"
                                            options={options}
                                        />
                                    </Form.Item>
                                ),
                            },
                            {
                                title: 'Phòng học',
                                width: 200,
                                align: 'center',
                                render: (record, __, index) => (
                                    <Form.Item
                                        className="w-full mb-0"
                                        name={['list', index, 'roomId']}
                                        label=""
                                    >
                                        <Select
                                            placeholder="Chọn phòng học"
                                            options={roomData.map((i: Room) => {
                                                return {
                                                    value: i.id,
                                                    label: i.name,
                                                }
                                            })}
                                            className="w-full"
                                            onChange={(value) =>
                                                handleChangeLocation(value, record)
                                            }
                                        />
                                    </Form.Item>
                                ),
                            },
                            // {
                            //     title: 'Địa điểm',
                            //     dataIndex: 'trainingLocationId',
                            //     width: 200,
                            //     align: 'center',
                            //     render: (value) =>
                            //         trainingLocationData.find(
                            //             (item) =>
                            //                 item.id === form.getFieldValue('trainingLocationId')
                            //         )?.name || '',
                            // },
                            {
                                title: 'Thao tác',
                                width: 100,
                                align: 'center',
                                fixed: 'right',
                                render: (record) => {
                                    if (record?.id) {
                                        return (
                                            <Row className="justify-center gap-2">
                                                <DeleteIcon
                                                    popConfirm={{
                                                        onConfirm: () => handleDelete(record?.id),
                                                    }}
                                                />
                                            </Row>
                                        )
                                    }
                                    return ''
                                },
                            },
                        ]}
                        dataSource={form.getFieldValue('list')}
                        bordered
                        locale={{
                            emptyText: <Empty description="Không có dữ liệu" />,
                        }}
                        data={listForm}
                        pagination={false}
                    />
                </FormItem>
            </Col>
        </PutFormModal>
    )
}

export default PutOpenClassModal
