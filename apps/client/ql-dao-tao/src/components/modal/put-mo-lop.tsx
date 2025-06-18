import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import DeleteIcon from '@components/icons/delete'
// import Table from '@components/commons/table'
import useSpinner from '@hooks/spinner'
import {
    $Enums,
    type Room,
    type SubjectClass,
    type SubjectClassSchedule,
    type SubjectVersion,
} from '@workspace/db'
import {
    useCreateManySubjectClass,
    useFindManyRoom,
    useFindManySubjectClass,
    useFindManyTrainingLocation,
    useFindUniqueSubjectVersion,
    useUpdateSubjectClass,
} from '@workspace/db/hooks'
import {
    Button,
    Col,
    DatePicker,
    Empty,
    Flex,
    Form,
    Input,
    InputNumber,
    Row,
    Table,
    TreeSelect,
    message,
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import { SUBJECT_CLASS_SCHEDULE_TYPE } from '@constants/constants'
import { useExamTypeOptions } from '@hooks/examType'
import type { OpenSubjectClass } from '@workspace/libs/api/schemas/openSubjectClass'
dayjs.locale('vi')

export type PutOpenSubjectClassType = {
    schedule: string
    trainingLocationId: string | null
    subjectVersionId: string
    semesterId: string
    totalStudent: number
}

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

const PutOpenClassModal = () => {
    const [form] = Form.useForm<PutOpenSubjectClassType>()
    const [formTable] = Form.useForm<SubjectClass>()
    const {
        isOpen,
        onClose,
        input: dataClass,
    } = useDisclosure<OpenSubjectClassType>({
        tag: PutOpenClassModal.name,
        onClose: form.resetFields,
    })
    const { getExamTypeLabel } = useExamTypeOptions()
    const { showSpinner, hideSpinner } = useSpinner()
    const [dataSubmit, setDataSubmit] = useState<
        (SubjectClass & { key: number })[]
    >([])
    const [numberOfClass, setNumberOfClass] = useState<number | null>(null)
    const [maxStudent, setMaxStudent] = useState<number | null>(null)
    const [isEdit, setIsEdit] = useState<boolean>(true)
    const { mutateAsync: createMany } = useCreateManySubjectClass()
    const { mutateAsync: updateSubjectClass } = useUpdateSubjectClass()
    async function onOk(output?: PutOpenSubjectClassType) {
        if (!output) return
        try {
            showSpinner()
            if (!isEdit) {
                console.log(dataSubmit)
            }
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
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
            const result = dataSubmit.filter((i) => i?.id !== id)
            setDataSubmit(result)
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const handleCreateTableForClass = () => {
        setMaxStudent(null)
        setIsEdit(false)
        if (Number(numberOfClass) > 0) {
            const cout = Math.ceil(Number(100) / Number(numberOfClass))
            const result = []
            for (let i = 0; i < Number(numberOfClass); i++) {
                result.push({
                    key: i + 1,
                    code: `${subjectVersionData?.code} 0${i + 1}`,
                    name: subjectVersionData?.name
                        ? subjectVersionData?.name
                        : '',
                    maxStudent: Number(cout),
                    startDate: new Date(),
                    semesterId: dataClass?.semester.id,
                    subjectId: subjectVersionData?.id,
                    schedule: form.getFieldValue('schedule'),
                    subject: subjectVersionData,
                    semester: dataClass?.semester,
                })
            }
            setDataSubmit(result)
        }
    }

    const handleCreateTableForMaxStudent = () => {
        setNumberOfClass(null)
        setIsEdit(false)
        if (Number(maxStudent) > 0) {
            const cout = Math.ceil(Number(100) / Number(maxStudent))
            const result = []
            for (let i = 0; i < cout; i++) {
                result.push({
                    key: i + 1,
                    code: `${subjectVersionData?.code} 0${i + 1}`,
                    name: subjectVersionData?.name
                        ? subjectVersionData?.name
                        : '',
                    maxStudent: Number(maxStudent),
                    startDate: new Date(),
                    semesterId: dataClass?.semester.id,
                    subjectId: subjectVersionData?.id,
                    schedule: form.getFieldValue('schedule'),
                    subject: subjectVersionData,
                    semester: dataClass?.semester,
                })
            }
            setDataSubmit(result)
        }
    }

    const handleChangeDateExam = (date: Dayjs, index: string) => {
        const result = dataSubmit.map((i) => {
            if (i?.id === index || i?.key === index) {
                return {
                    ...i,
                    examDate: date,
                    scoreDeadline: date.add(-10, 'day'),
                    examScoreDeadline: date.add(10, 'day'),
                }
            }
            return i
        })
        setDataSubmit(result)
    }

    const handleChangeDate = (date: Dayjs, index: string, key: string) => {
        console.log(index, key)
        const result = dataSubmit.map((i) => {
            if (i.id === index || i?.key === index) {
                return {
                    ...i,
                    [key]: date,
                }
            }
            return i
        })
        setDataSubmit(result)
    }

    const handleChangeLocation = (value: string, key: string) => {
        const result = dataSubmit.map((i) => {
            if (i.id === key) {
                return {
                    ...i,
                    roomId: value,
                }
            }
            return i
        })
        setDataSubmit(result)
        console.log(result)
    }
    const {
        data: trainingLocationData = [],
        refetch: refetchTrainingLocationData,
    } = useFindManyTrainingLocation()

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

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
        if (subjectClassData?.length) {
            setDataSubmit(
                subjectClassData.map((i, index) => ({ ...i, key: index + 1 }))
            )
            form.setFieldsValue({
                schedule: subjectClassData[0]?.schedule,
                trainingLocationId:
                    subjectClassData[0]?.room?.building?.trainingLocationId,
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
                Tổng SV: {dataClass?.studentCount}
            </Col>
            <Col className="mb-3" span={6}>
                Tổng SV nợ môn: 0
            </Col>
            <Col span={12}>
                <FormItem form={form} name="schedule" label="Kíp học" required>
                    <Select
                        disabled={!!dataSubmit?.length}
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
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingLocationId"
                    label="Địa điểm"
                >
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
                <Flex gap={12} align="center">
                    <span className="min-w-[100px]">Số LMH</span>
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Nhập số lớp cần tạo"
                        step={1}
                        min={0}
                        value={numberOfClass}
                        disabled={!!dataSubmit?.length}
                        onChange={(value) => setNumberOfClass(value || 0)}
                    />
                    <Button
                        onClick={handleCreateTableForClass}
                        type="primary"
                        className="h-[32px]"
                        disabled={!numberOfClass}
                    >
                        Thêm LMH theo số lớp
                    </Button>
                </Flex>
            </Col>
            <Col span={12}>
                <Flex gap={12} align="center">
                    <span className="min-w-[100px]">Số SV tối đa</span>
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Nhập số SV tối đa"
                        step={1}
                        min={0}
                        value={maxStudent}
                        disabled={!!dataSubmit?.length}
                        onChange={(value) => setMaxStudent(value || 0)}
                    />
                    <Button
                        onClick={handleCreateTableForMaxStudent}
                        type="primary"
                        className="h-[32px]"
                        disabled={!maxStudent}
                    >
                        Thêm LMH theo số SV tối đa
                    </Button>
                </Flex>
            </Col>
            <Col span={24}>
                <Table
                    rowKey="key"
                    className="mt-6 custom-scrollbar"
                    id="open-subject-class"
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
                            render: (value: SubjectClassSchedule) =>
                                SUBJECT_CLASS_SCHEDULE_TYPE[
                                    value as keyof typeof SUBJECT_CLASS_SCHEDULE_TYPE
                                ],
                        },
                        {
                            title: 'Hạn PCGD',
                            width: 150,
                            align: 'center',
                            render: (record, index) => (
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    className="w-full"
                                    disabledDate={(date) =>
                                        date && date < dayjs().startOf('day')
                                    }
                                    value={record.lecturerAssignmentDeadline}
                                    onChange={(date) =>
                                        handleChangeDate(
                                            date,
                                            isEdit ? record?.id : record?.key,
                                            'lecturerAssignmentDeadline'
                                        )
                                    }
                                />
                            ),
                        },
                        {
                            title: 'Ngày thi',
                            width: 150,
                            align: 'center',
                            render: (record) => (
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    className="w-full"
                                    disabledDate={(date) =>
                                        date && date < dayjs().startOf('day')
                                    }
                                    value={record.examDate}
                                    onChange={(date) =>
                                        handleChangeDateExam(
                                            date,
                                            isEdit ? record?.id : record?.key
                                        )
                                    }
                                />
                            ),
                        },
                        {
                            title: 'Hạn nhập điểm CC/TX',
                            width: 150,
                            align: 'center',
                            render: (record) => (
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    className="w-full"
                                    disabledDate={(date) =>
                                        date && date < dayjs().startOf('day')
                                    }
                                    value={record.scoreDeadline}
                                    onChange={(date) =>
                                        handleChangeDate(
                                            date,
                                            record?.id,
                                            'scoreDeadline'
                                        )
                                    }
                                />
                            ),
                        },
                        {
                            title: 'Hạn nhập điểm',
                            width: 150,
                            align: 'center',
                            render: (record) => (
                                <DatePicker
                                    format="DD/MM/YYYY"
                                    className="w-full"
                                    disabledDate={(date) =>
                                        date && date < dayjs().startOf('day')
                                    }
                                    value={record.examScoreDeadline}
                                    onChange={(date) =>
                                        handleChangeDate(
                                            date,
                                            record?.id,
                                            'examScoreDeadline'
                                        )
                                    }
                                />
                            ),
                        },
                        {
                            title: 'Hình thức thi',
                            width: 150,
                            align: 'center',
                            render: () =>
                                subjectVersionData?.examType
                                    ? getExamTypeLabel(
                                          subjectVersionData?.examType
                                      )
                                    : '',
                        },
                        {
                            title: 'Phòng học',
                            width: 200,
                            align: 'center',
                            render: (record) => (
                                <Select
                                    placeholder="Chọn phòng học"
                                    options={roomData.map((i: Room) => {
                                        return {
                                            value: i.id,
                                            label: i.name,
                                        }
                                    })}
                                    style={{ width: '100%' }}
                                    onChange={(value) =>
                                        handleChangeLocation(value, record?.id)
                                    }
                                />
                            ),
                        },
                        {
                            title: 'Địa điểm',
                            dataIndex: 'trainingLocationId',
                            width: 200,
                            align: 'center',
                            render: (value) =>
                                trainingLocationData.find(
                                    (item) =>
                                        item.id ===
                                        form.getFieldValue('trainingLocationId')
                                )?.name || '',
                        },
                        {
                            title: 'Thao tác',
                            width: 100,
                            align: 'center',
                            fixed: 'right',
                            render: (_, { id }) => {
                                if (id) {
                                    return (
                                        <Row className="justify-center gap-2">
                                            <DeleteIcon
                                                popConfirm={{
                                                    onConfirm: () =>
                                                        handleDelete(id),
                                                }}
                                            />
                                        </Row>
                                    )
                                }
                                return ''
                            },
                        },
                    ]}
                    dataSource={dataSubmit}
                    bordered
                    locale={{
                        emptyText: <Empty description="Không có dữ liệu" />,
                    }}
                    scroll={{ x: '100%', y: undefined }}
                />
            </Col>
        </PutFormModal>
    )
}

export default PutOpenClassModal
