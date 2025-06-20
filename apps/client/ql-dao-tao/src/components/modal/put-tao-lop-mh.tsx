import { queryClient } from '@api/index'
import FormItem from '@components/commons/form-item'
import PutFormModal from '@components/commons/put-modal'
import Select from '@components/commons/select'
import useSpinner from '@hooks/spinner'
import type {
    Room,
    Semester,
    SubjectClass,
    SubjectClassSchedule,
    SubjectVersion,
    TrainingLocation,
} from '@workspace/db'
import {
    useCreateManySubjectClass,
    useFindManyRoom,
    useFindManySchoolYear,
    useFindManySubjectVersion,
    useFindManyTrainingLocation,
} from '@workspace/db/hooks'
import {
    Button,
    Col,
    DatePicker,
    Empty,
    Flex,
    Form,
    InputNumber,
    Table,
    TreeSelect,
    message,
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import { useDisclosure } from 'react-hook-disclosure-modal'
import 'dayjs/locale/vi'
import { SUBJECT_CLASS_SCHEDULE_TYPE } from '@constants/constants'
import { useExamTypeOptions } from '@hooks/examType'
dayjs.locale('vi')

export type PutOpenSubjectClassType = {
    subjectClassScheduleId: string
    trainingLocationId: string
    subjectVersionId: string
    semesterId: string
    totalStudent: number
}

const PutOpenSubjectClassModal = () => {
    const [form] = Form.useForm<PutOpenSubjectClassType>()
    const {
        isOpen,
        onClose,
        input: id,
    } = useDisclosure<string>({
        tag: PutOpenSubjectClassModal.name,
        onClose: form.resetFields,
    })
    const { getExamTypeLabel } = useExamTypeOptions()
    const { showSpinner, hideSpinner } = useSpinner()
    const [dataSubmit, setDataSubmit] = useState<
        (SubjectClass & { key: number })[]
    >([])
    const [numberOfClass, setNumberOfClass] = useState<number | null>(null)
    const [maxStudent, setMaxStudent] = useState<number | null>(null)
    const [selectedSemester, setSelectedSemester] = useState<
        Semester & { key: number }
    >()
    const [subjectVersion, setSubjectVersion] = useState<SubjectVersion>()
    const { mutateAsync: createMany } = useCreateManySubjectClass()
    async function onOk(output?: PutOpenSubjectClassType) {
        if (!output) return
        try {
            showSpinner()
            await createMany({
                data: dataSubmit.map((i) => ({
                    name: i.name,
                    startDate: i.startDate,
                    subjectId: i.subjectId,
                    schedule: i.schedule,
                    semesterId: i.semesterId,
                    code: i?.code,
                    roomId: i?.roomId,
                    examDate: i?.examDate,
                    maxStudent: i?.maxStudent,
                })),
            })
            // refetch() lại danh sách level
            queryClient.invalidateQueries({
                queryKey: ['SubjectClass'],
            })
            onClose()
        } catch (error) {
            message.error('Đã xảy ra lỗi, vui lòng kiểm tra lại')
        }
        hideSpinner()
    }

    const handleCreateTableForClass = () => {
        const totalStudent = Number(form.getFieldValue('totalStudent'))
        if (Number(totalStudent) <= 0) {
            return
        }
        setMaxStudent(null)

        if (Number(numberOfClass) > 0) {
            const cout = Math.ceil(Number(totalStudent) / Number(numberOfClass))
            const result = []
            for (let i = 0; i < Number(numberOfClass); i++) {
                result.push({
                    key: i + 1,
                    code: `${subjectVersion?.code} 0${i + 1}`,
                    name: subjectVersion?.name ? subjectVersion?.name : '',
                    maxStudent: cout,
                    startDate: new Date(),
                    semesterId: form.getFieldValue('semesterId'),
                    subjectId: form.getFieldValue('subjectVersionId'),
                    schedule: form.getFieldValue('subjectClassScheduleId'),
                })
            }
            setDataSubmit(result)
        }
    }

    const handleCreateTableForMaxStudent = () => {
        const totalStudent = Number(form.getFieldValue('totalStudent'))
        if (Number(totalStudent) <= 0) {
            return
        }
        setNumberOfClass(null)
        if (Number(maxStudent) > 0) {
            const cout = Math.ceil(Number(totalStudent) / Number(maxStudent))
            const result = []
            for (let i = 0; i < cout; i++) {
                result.push({
                    key: i + 1,
                    code: `${subjectVersion?.code} 0${i + 1}`,
                    name: subjectVersion?.name ? subjectVersion?.name : '',
                    maxStudent: Number(maxStudent),
                    startDate: new Date(),
                    semesterId: form.getFieldValue('semesterId'),
                    subjectId: form.getFieldValue('subjectVersionId'),
                    schedule: form.getFieldValue('subjectClassScheduleId'),
                })
            }
            setDataSubmit(result)
        }
    }

    const handleChangeDateExam = (date: Dayjs, index: number) => {
        const result = dataSubmit.map((i) => {
            if (i.key === index) {
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

    const handleChangeDate = (date: Dayjs, index: number, key: string) => {
        const result = dataSubmit.map((i) => {
            if (i.key === index) {
                return {
                    ...i,
                    [key]: date,
                }
            }
            return i
        })
        setDataSubmit(result)
    }

    const handleChangeLocation = (
        value: string,
        record: TrainingLocation & { key: number }
    ) => {
        const result = dataSubmit.map((i) => {
            if (i.key === record.key) {
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

    const semesterId = Form.useWatch('semesterId', form)
    const { data: subjectVersionData = [] } = useFindManySubjectVersion({
        where: semesterId
            ? {
                  subjectClass: {
                      none: {
                          semesterId: semesterId,
                      },
                  },
              }
            : {},
    })

    const { data: schoolYears = [] } = useFindManySchoolYear({
        include: { semesters: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
    })

    const treeData = useMemo(() => {
        return schoolYears.map((i) => ({
            title: i?.name,
            key: i?.id,
            value: i?.id,
            selectable: false,
            code: i?.code,
            children: i?.semesters?.length
                ? i?.semesters.map((j) => ({
                      title: j?.name,
                      key: j?.id,
                      value: j?.id,
                      code: j?.code,
                  }))
                : [],
        }))
    }, [schoolYears])

    const TrainingLocationForm = Form.useWatch('trainingLocationId', form)

    const { data: roomData = [], refetch: refetchRoomData } = useFindManyRoom({
        where: {
            trainingRoom: true,
            building: {
                trainingLocationId: TrainingLocationForm,
            },
        },
    })

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
            <Col span={12}>
                <FormItem form={form} name="semesterId" label="Học kỳ" required>
                    <TreeSelect
                        placeholder="Chọn học kỳ"
                        showSearch
                        treeDefaultExpandAll
                        treeData={treeData}
                        style={{ width: '100%' }}
                        filterTreeNode={(input, node) =>
                            (node.title as string)
                                .toLowerCase()
                                .includes(input.toLowerCase())
                        }
                        onSelect={(value, node) =>
                            setSelectedSemester({ ...node, id: node.value })
                        }
                    />
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="subjectVersionId"
                    label="Môn học"
                    required
                >
                    <Select
                        disabled={!selectedSemester?.id}
                        placeholder="Chọn môn học"
                        options={subjectVersionData.map((item) => {
                            return {
                                ...item,
                                label: `${item?.code} - ${item?.name}`,
                                value: item.id,
                            }
                        })}
                        onSelect={(value, node) => {
                            setSubjectVersion({ ...node, id: node.value })
                        }}
                        allowClear
                    />
                </FormItem>
            </Col>

            <Col span={12}>
                <FormItem
                    form={form}
                    name="subjectClassScheduleId"
                    label="Kíp học"
                    required
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
                </FormItem>
            </Col>
            <Col span={12}>
                <FormItem
                    form={form}
                    name="trainingLocationId"
                    label="Địa điểm"
                    required
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
            <Col span={24}>
                <FormItem
                    form={form}
                    name="totalStudent"
                    label="Tổng SV"
                    required
                >
                    <InputNumber style={{ width: '100%' }} min={0} step={1} />
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
                        onChange={(value) => setNumberOfClass(value || 0)}
                    />
                    <Button
                        onClick={handleCreateTableForClass}
                        type="primary"
                        className="h-[32px]"
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
                        onChange={(value) => setMaxStudent(value || 0)}
                    />
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
                            width: 100,
                            align: 'center',
                            render: () => <>{subjectVersion?.credit}</>,
                        },
                        {
                            title: 'Số SV tối đa',
                            dataIndex: 'maxStudent',
                            width: 150,
                            align: 'center',
                        },
                        {
                            title: 'SV nợ',
                            dataIndex: 'svNo',
                            width: 100,
                            align: 'center',
                        },
                        {
                            title: 'Số tiết TKB',
                            width: 100,
                            align: 'center',
                            render: () => <>{subjectVersion?.period}</>,
                        },
                        {
                            title: 'Số SV max',
                            width: 100,
                            align: 'center',
                            render: (record) => <>{record?.maxStudent}</>,
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
                            render: (record) => (
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
                                            record?.key,
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
                                        handleChangeDateExam(date, record?.key)
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
                                            record?.key,
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
                                            record?.key,
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
                                subjectVersion?.examType
                                    ? getExamTypeLabel(subjectVersion?.examType)
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
                                        handleChangeLocation(value, record)
                                    }
                                />
                            ),
                        },
                        {
                            title: 'Địa điểm',
                            width: 200,
                            align: 'center',
                            render: (value) =>
                                trainingLocationData.find(
                                    (item) =>
                                        item.id ===
                                        form.getFieldValue('trainingLocationId')
                                )?.name || '',
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

export default PutOpenSubjectClassModal
